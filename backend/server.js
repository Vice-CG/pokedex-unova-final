// backend/server.js - Backend con MongoDB + SSO
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');
const axios = require('axios');

// Modelos
const User = require('./models/User');
const Collection = require('./models/Collection');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;

// ============= MIDDLEWARE =============
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Sesiones (necesario para Passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// ============= CONEXIÓN A MONGODB =============
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ============= MIDDLEWARE DE AUTENTICACIÓN JWT =============
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// ============= RUTAS DE AUTENTICACIÓN TRADICIONAL =============

// POST /api/register - Registro tradicional
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    // Cifrar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      provider: 'local'
    });

    await newUser.save();

    // Generar token JWT
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        provider: newUser.provider
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/login - Login tradicional
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const user = await User.findOne({ username });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Actualizar último login
    user.lastLogin = Date.now();
    await user.save();

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ============= RUTAS DE SSO (GOOGLE) =============

// GET /api/auth/google - Iniciar autenticación con Google
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/auth/google/callback - Callback de Google
app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    // Generar token JWT
    const token = jwt.sign(
      { id: req.user._id, username: req.user.username },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    // Redirigir al frontend con el token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);

// ============= RUTAS DE SSO (GITHUB) =============

// GET /api/auth/github - Iniciar autenticación con GitHub
app.get('/api/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GET /api/auth/github/callback - Callback de GitHub
app.get('/api/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    // Generar token JWT
    const token = jwt.sign(
      { id: req.user._id, username: req.user.username },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    // Redirigir al frontend con el token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);

// GET /api/auth/me - Obtener usuario actual
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// ============= RUTAS DE POKÉMON (PokeAPI) =============

// Pokémon de Unova (IDs de PokeAPI)
const UNOVA_POKEMON_IDS = [
  494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508,
  509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522,
  523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536,
  537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550,
  551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564,
  565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578,
  579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592,
  593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606,
  607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620,
  621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634,
  635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649
];

// GET /api/pokemon - Obtener todos los Pokémon de Unova
app.get('/api/pokemon', async (req, res) => {
  try {
    const pokemonData = [];

    for (let i = 0; i < UNOVA_POKEMON_IDS.length; i++) {
      const id = UNOVA_POKEMON_IDS[i];
      try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const pokemon = response.data;
        
        pokemonData.push({
          id: pokemon.id,
          name: pokemon.name,
          number: String(i).padStart(3, '0'),
          types: pokemon.types.map(t => t.type.name),
          height: pokemon.height,
          weight: pokemon.weight,
          abilities: pokemon.abilities.map(a => a.ability.name),
          sprite: pokemon.sprites.front_default,
          spriteShiny: pokemon.sprites.front_shiny
        });
      } catch (err) {
        console.error(`Error fetching pokemon ${id}:`, err.message);
      }
    }

    res.json(pokemonData);
  } catch (error) {
    console.error('Error al obtener Pokémon:', error);
    res.status(500).json({ error: 'Error al obtener Pokémon' });
  }
});

// GET /api/pokemon/:id - Obtener un Pokémon específico
app.get('/api/pokemon/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemon = response.data;

    const pokemonData = {
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types.map(t => t.type.name),
      height: pokemon.height,
      weight: pokemon.weight,
      abilities: pokemon.abilities.map(a => a.ability.name),
      sprite: pokemon.sprites.front_default,
      spriteShiny: pokemon.sprites.front_shiny,
      stats: pokemon.stats.map(s => ({
        name: s.stat.name,
        value: s.base_stat
      }))
    };

    res.json(pokemonData);
  } catch (error) {
    console.error('Error al obtener Pokémon:', error);
    res.status(404).json({ error: 'Pokémon no encontrado' });
  }
});

// GET /api/pokemon/:id/details - Obtener información COMPLETA
app.get('/api/pokemon/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pokemonResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemon = pokemonResponse.data;
    
    const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    const species = speciesResponse.data;
    
    const descriptionES = species.flavor_text_entries
      .filter(entry => entry.language.name === 'es')
      .slice(-1)[0]?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') || 'No disponible';
    
    const descriptionEN = species.flavor_text_entries
      .filter(entry => entry.language.name === 'en')
      .slice(-1)[0]?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') || 'No available';
    
    const nameES = species.names.find(n => n.language.name === 'es')?.name || pokemon.name;
    const nameEN = species.names.find(n => n.language.name === 'en')?.name || pokemon.name;
    
    const genusES = species.genera.find(g => g.language.name === 'es')?.genus || 'Pokémon';
    const genusEN = species.genera.find(g => g.language.name === 'en')?.genus || 'Pokémon';
    
    const habitatTranslations = {
      'cave': { es: 'Cueva', en: 'Cave' },
      'forest': { es: 'Bosque', en: 'Forest' },
      'grassland': { es: 'Pradera', en: 'Grassland' },
      'mountain': { es: 'Montaña', en: 'Mountain' },
      'rare': { es: 'Raro', en: 'Rare' },
      'rough-terrain': { es: 'Terreno Irregular', en: 'Rough Terrain' },
      'sea': { es: 'Mar', en: 'Sea' },
      'urban': { es: 'Urbano', en: 'Urban' },
      'waters-edge': { es: 'Orilla del Agua', en: 'Waters Edge' }
    };
    
    const habitatName = species.habitat?.name || 'unknown';
    const habitat = habitatTranslations[habitatName] || { es: 'Desconocido', en: 'Unknown' };
    
    const growthRateTranslations = {
      'slow': { es: 'Lenta', en: 'Slow' },
      'medium': { es: 'Media', en: 'Medium' },
      'fast': { es: 'Rápida', en: 'Fast' },
      'medium-slow': { es: 'Media-Lenta', en: 'Medium Slow' },
      'slow-then-very-fast': { es: 'Lenta-Muy Rápida', en: 'Slow Then Very Fast' },
      'fast-then-very-slow': { es: 'Rápida-Muy Lenta', en: 'Fast Then Very Slow' },
      'erratic': { es: 'Errática', en: 'Erratic' },
      'fluctuating': { es: 'Fluctuante', en: 'Fluctuating' }
    };
    
    const growthRateName = species.growth_rate.name;
    const growthRate = growthRateTranslations[growthRateName] || { es: growthRateName, en: growthRateName };
    
    const eggGroupTranslations = {
      'monster': { es: 'Monstruo', en: 'Monster' },
      'water1': { es: 'Agua 1', en: 'Water 1' },
      'water2': { es: 'Agua 2', en: 'Water 2' },
      'water3': { es: 'Agua 3', en: 'Water 3' },
      'bug': { es: 'Bicho', en: 'Bug' },
      'flying': { es: 'Volador', en: 'Flying' },
      'ground': { es: 'Tierra', en: 'Ground' },
      'fairy': { es: 'Hada', en: 'Fairy' },
      'plant': { es: 'Planta', en: 'Plant' },
      'humanshape': { es: 'Forma Humana', en: 'Human-Like' },
      'mineral': { es: 'Mineral', en: 'Mineral' },
      'amorphous': { es: 'Amorfo', en: 'Amorphous' },
      'ditto': { es: 'Ditto', en: 'Ditto' },
      'dragon': { es: 'Dragón', en: 'Dragon' },
      'undiscovered': { es: 'No Descubierto', en: 'Undiscovered' },
      'no-eggs': { es: 'Sin Huevos', en: 'No Eggs' }
    };
    
    const eggGroups = {
      es: species.egg_groups.map(eg => eggGroupTranslations[eg.name]?.es || eg.name),
      en: species.egg_groups.map(eg => eggGroupTranslations[eg.name]?.en || eg.name)
    };
    
    const abilitiesPromises = pokemon.abilities.map(async (a) => {
      try {
        const abilityResponse = await axios.get(a.ability.url);
        const abilityData = abilityResponse.data;
        
        const nameES = abilityData.names.find(n => n.language.name === 'es')?.name || a.ability.name;
        const nameEN = abilityData.names.find(n => n.language.name === 'en')?.name || a.ability.name;
        
        return {
          name: { es: nameES, en: nameEN },
          isHidden: a.is_hidden
        };
      } catch (err) {
        return {
          name: { es: a.ability.name, en: a.ability.name },
          isHidden: a.is_hidden
        };
      }
    });
    
    const abilities = await Promise.all(abilitiesPromises);
    
    const movesPromises = pokemon.moves.slice(0, 20).map(async (m) => {
      try {
        const moveResponse = await axios.get(m.move.url);
        const moveData = moveResponse.data;
        
        const nameES = moveData.names.find(n => n.language.name === 'es')?.name || m.move.name;
        const nameEN = moveData.names.find(n => n.language.name === 'en')?.name || m.move.name;
        
        return {
          name: { es: nameES, en: nameEN },
          learnMethod: m.version_group_details[0]?.move_learn_method.name,
          levelLearned: m.version_group_details[0]?.level_learned_at || 0
        };
      } catch (err) {
        return {
          name: { es: m.move.name, en: m.move.name },
          learnMethod: m.version_group_details[0]?.move_learn_method.name,
          levelLearned: m.version_group_details[0]?.level_learned_at || 0
        };
      }
    });
    
    const moves = await Promise.all(movesPromises);
    
    let evolutionChain = [];
    try {
      const evolutionResponse = await axios.get(species.evolution_chain.url);
      evolutionChain = await parseEvolutionChainWithNames(evolutionResponse.data.chain);
    } catch (err) {
      console.error('Error obteniendo evoluciones:', err.message);
    }
    
    const pokemonDetails = {
      id: pokemon.id,
      name: { es: nameES, en: nameEN },
      types: pokemon.types.map(t => t.type.name),
      height: pokemon.height / 10,
      weight: pokemon.weight / 10,
      
      sprites: {
        default: pokemon.sprites.front_default,
        shiny: pokemon.sprites.front_shiny,
        official: pokemon.sprites.other['official-artwork'].front_default,
        animated: pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || null
      },
      
      stats: pokemon.stats.map(s => ({
        name: s.stat.name,
        value: s.base_stat
      })),
      
      totalStats: pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0),
      
      abilities: abilities,
      moves: moves,
      
      descriptions: {
        es: descriptionES,
        en: descriptionEN
      },
      
      species: {
        genus: { es: genusES, en: genusEN },
        habitat: habitat,
        captureRate: species.capture_rate,
        baseHappiness: species.base_happiness,
        growthRate: growthRate,
        eggGroups: eggGroups,
        genderRate: species.gender_rate
      },
      
      evolutionChain: evolutionChain
    };
    
    res.json(pokemonDetails);
  } catch (error) {
    console.error('Error al obtener detalles del Pokémon:', error.message);
    res.status(500).json({ error: 'Error al obtener detalles del Pokémon' });
  }
});

async function parseEvolutionChainWithNames(chain) {
  const evolutionArray = [];
  
  async function traverse(node) {
    try {
      const speciesId = node.species.url.split('/').filter(Boolean).pop();
      const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`);
      const speciesData = speciesResponse.data;
      
      const nameES = speciesData.names.find(n => n.language.name === 'es')?.name || node.species.name;
      const nameEN = speciesData.names.find(n => n.language.name === 'en')?.name || node.species.name;
      
      evolutionArray.push({
        name: { es: nameES, en: nameEN },
        minLevel: node.evolution_details[0]?.min_level || null,
        trigger: node.evolution_details[0]?.trigger.name || null,
        item: node.evolution_details[0]?.item?.name || null
      });
      
      if (node.evolves_to && node.evolves_to.length > 0) {
        for (const evolution of node.evolves_to) {
          await traverse(evolution);
        }
      }
    } catch (err) {
      console.error('Error en traverse:', err.message);
      evolutionArray.push({
        name: { es: node.species.name, en: node.species.name },
        minLevel: node.evolution_details[0]?.min_level || null,
        trigger: node.evolution_details[0]?.trigger.name || null,
        item: node.evolution_details[0]?.item?.name || null
      });
    }
  }
  
  await traverse(chain);
  return evolutionArray;
}

// ============= RUTAS DE COLECCIÓN (CRUD) =============

// GET /api/collection - Obtener colección del usuario
app.get('/api/collection', authenticateToken, async (req, res) => {
  try {
    const collection = await Collection.find({ userId: req.user.id });
    res.json(collection);
  } catch (error) {
    console.error('Error al obtener colección:', error);
    res.status(500).json({ error: 'Error al obtener colección' });
  }
});

// POST /api/collection - Agregar Pokémon a colección
app.post('/api/collection', authenticateToken, async (req, res) => {
  try {
    const { pokemonId, notes } = req.body;

    if (!pokemonId) {
      return res.status(400).json({ error: 'pokemonId es requerido' });
    }

    // Verificar si ya existe
    const exists = await Collection.findOne({ 
      userId: req.user.id, 
      pokemonId 
    });

    if (exists) {
      return res.status(400).json({ error: 'Pokémon ya está en la colección' });
    }

    const newEntry = new Collection({
      userId: req.user.id,
      pokemonId,
      notes: notes || '',
      caught: true
    });

    await newEntry.save();

    res.json({
      message: 'Pokémon agregado a la colección',
      entry: newEntry
    });
  } catch (error) {
    console.error('Error al agregar a colección:', error);
    res.status(500).json({ error: 'Error al agregar a colección' });
  }
});

// PUT /api/collection/:id - Actualizar entrada de colección
app.put('/api/collection/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, caught, favorite } = req.body;

    const entry = await Collection.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    if (notes !== undefined) entry.notes = notes;
    if (caught !== undefined) entry.caught = caught;
    if (favorite !== undefined) entry.favorite = favorite;

    await entry.save();

    res.json({
      message: 'Entrada actualizada',
      entry
    });
  } catch (error) {
    console.error('Error al actualizar entrada:', error);
    res.status(500).json({ error: 'Error al actualizar entrada' });
  }
});

// DELETE /api/collection/:id - Eliminar de colección
app.delete('/api/collection/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Collection.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!result) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    res.json({ message: 'Pokémon eliminado de la colección' });
  } catch (error) {
    console.error('Error al eliminar de colección:', error);
    res.status(500).json({ error: 'Error al eliminar de colección' });
  }
});

// ============= SERVIDOR =============
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔐 SSO habilitado: Google y GitHub`);
  console.log(`🗄️  Base de datos: MongoDB Atlas`);
});
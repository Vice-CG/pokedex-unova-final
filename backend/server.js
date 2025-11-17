// server.js - Backend Node.js + Express
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'pokemon_unova_secret_key_2024';
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar base de datos
async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    const initialData = {
      users: [],
      collections: {}
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Leer DB
async function readDB() {
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

// Escribir DB
async function writeDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Middleware de autenticación
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

// ============= RUTAS DE AUTENTICACIÓN =============

// POST /api/register - Registrar usuario
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const db = await readDB();

    // Verificar si el usuario ya existe
    if (db.users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Cifrar contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.collections[newUser.id] = [];
    await writeDB(db);

    // Generar token JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/login - Iniciar sesión
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const db = await readDB();
    const user = db.users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ============= RUTAS DE POKÉMON (PokéAPI) =============

// Pokémon de Unova (IDs de PokéAPI)
const UNOVA_POKEMON_IDS = [
  494, // Victini #000
  495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508,
  509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522,
  523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536,
  537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550,
  551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564,
  565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578,
  579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592,
  593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606,
  607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620,
  621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634,
  635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648,
  649  // Genesect #155
];

// GET /api/pokemon - Obtener todos los Pokémon de Unova
app.get('/api/pokemon', async (req, res) => {
  try {
    const pokemonData = [];

    // Caché con todos los pokémon pedidosphite
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

// ============= RUTAS DE COLECCIÓN (CRUD) =============

// GET /api/collection - Obtener colección del usuario
app.get('/api/collection', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const collection = db.collections[req.user.id] || [];
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

    const db = await readDB();

    if (!db.collections[req.user.id]) {
      db.collections[req.user.id] = [];
    }

    // Verificar si ya existe
    const exists = db.collections[req.user.id].find(p => p.pokemonId === pokemonId);
    if (exists) {
      return res.status(400).json({ error: 'Pokémon ya está en la colección' });
    }

    const newEntry = {
      id: Date.now().toString(),
      pokemonId,
      notes: notes || '',
      caught: true,
      caughtAt: new Date().toISOString()
    };

    db.collections[req.user.id].push(newEntry);
    await writeDB(db);

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
    const { notes, caught } = req.body;

    const db = await readDB();
    const collection = db.collections[req.user.id] || [];
    const entryIndex = collection.findIndex(p => p.id === id);

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    if (notes !== undefined) {
      collection[entryIndex].notes = notes;
    }
    if (caught !== undefined) {
      collection[entryIndex].caught = caught;
    }

    db.collections[req.user.id] = collection;
    await writeDB(db);

    res.json({
      message: 'Entrada actualizada',
      entry: collection[entryIndex]
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

    const db = await readDB();
    const collection = db.collections[req.user.id] || [];
    const newCollection = collection.filter(p => p.id !== id);

    if (collection.length === newCollection.length) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    db.collections[req.user.id] = newCollection;
    await writeDB(db);

    res.json({ message: 'Pokémon eliminado de la colección' });
  } catch (error) {
    console.error('Error al eliminar de colección:', error);
    res.status(500).json({ error: 'Error al eliminar de colección' });
  }
});

// ============= SERVIDOR =============

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📦 Base de datos: ${DB_FILE}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
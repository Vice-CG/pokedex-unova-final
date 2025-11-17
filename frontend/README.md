# 📱 Pokédex de Unova - Proyecto Full Stack

Una aplicación web completa basada en la Pokédex de Unova (Pokémon Black/White), desde Victini #000 hasta Genesect #155.

## ✨ Características Implementadas

### ✅ Requisitos Cumplidos

- **✓ Autenticación con cifrado básico**: Sistema de login/registro con bcrypt para cifrar contraseñas
- **✓ CRUD completo**: Create, Read, Update, Delete de la colección de Pokémon
- **✓ Multilenguaje obligatorio**: Español e Inglés con archivos JSON (`es.json` y `en.json`)
- **✓ Multiplataforma responsive**: Diseño adaptativo para móvil, tablet y desktop
- **✓ Servicio externo**: Integración con PokéAPI para obtener datos de Pokémon en tiempo real

### 🎮 Funcionalidades Extra

- Autenticación JWT con tokens
- Base de datos JSON simulada
- Búsqueda y filtrado de Pokémon
- Sistema de notas personalizadas
- Interfaz temática de Pokémon Black/White
- Persistencia de datos de usuario

---

## 🏗️ Estructura del Proyecto

```
pokedex-unova/
│
├── backend/                    # Servidor Node.js + Express
│   ├── server.js              # API REST
│   ├── package.json           # Dependencias del backend
│   └── db.json                # Base de datos (se crea automáticamente)
│
└── frontend/                   # Aplicación React
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/        # Componentes React
    │   ├── locales/           # Archivos de idiomas
    │   │   ├── es.json       # Español
    │   │   └── en.json       # Inglés
    │   ├── services/          # Servicios API
    │   ├── App.js            # Componente principal
    │   └── index.js
    └── package.json           # Dependencias del frontend
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0

### Paso 1: Clonar o crear el proyecto

```bash
mkdir pokedex-unova
cd pokedex-unova
```

### Paso 2: Configurar el Backend

```bash
# Crear carpeta backend
mkdir backend
cd backend

# Crear package.json con el contenido proporcionado
# (copiar el contenido de backend-package.json)

# Instalar dependencias
npm install

# Volver a la raíz
cd ..
```

**Dependencias del backend:**
- `express`: Framework web
- `cors`: Middleware para CORS
- `bcryptjs`: Cifrado de contraseñas
- `jsonwebtoken`: Autenticación JWT
- `axios`: Cliente HTTP para PokéAPI

### Paso 3: Configurar el Frontend

```bash
# Crear aplicación React
npx create-react-app frontend
cd frontend

# Instalar dependencias adicionales
npm install axios react-router-dom

# Volver a la raíz
cd ..
```

### Paso 4: Copiar los archivos

**Backend:**
1. Copiar el contenido de `server.js` en `backend/server.js`
2. Copiar el contenido de `backend-package.json` en `backend/package.json`

**Frontend:**
1. Crear carpeta `src/locales/`
2. Copiar `es.json` y `en.json` en `frontend/src/locales/`
3. Reemplazar `src/App.js` con el código del componente principal
4. Actualizar `src/index.css` con los estilos de Tailwind (opcional)

### Paso 5: Ejecutar el proyecto

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
El servidor correrá en: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
La aplicación correrá en: `http://localhost:3000`

---

## 🔧 Configuración Adicional

### Variables de Entorno (Opcional)

Crear `.env` en el backend:

```env
PORT=5000
SECRET_KEY=pokemon_unova_secret_key_2024
DB_FILE=./db.json
```

### Tailwind CSS (Opcional pero recomendado)

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Actualizar `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 📡 Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/register` | Registrar nuevo usuario |
| POST | `/api/login` | Iniciar sesión |

### Pokémon (PokéAPI)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/pokemon` | Obtener lista de Pokémon de Unova |
| GET | `/api/pokemon/:id` | Obtener detalles de un Pokémon |

### Colección (Requiere autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/collection` | Obtener colección del usuario |
| POST | `/api/collection` | Agregar Pokémon a colección |
| PUT | `/api/collection/:id` | Actualizar notas/estado |
| DELETE | `/api/collection/:id` | Eliminar de colección |

---

## 🎨 Características del Frontend

### Responsive Design

- **Móvil** (< 640px): Vista de tarjetas verticales
- **Tablet** (640px - 1024px): Grid de 2 columnas
- **Desktop** (> 1024px): Grid de 3-4 columnas

### Multilenguaje

El cambio de idioma se hace mediante el botón del globo terráqueo en el header. Los textos se cargan dinámicamente desde `locales/es.json` y `locales/en.json`.

### Autenticación

1. El usuario se registra o inicia sesión
2. El backend devuelve un token JWT
3. El token se guarda en localStorage
4. Se envía en el header `Authorization: Bearer <token>` en cada petición protegida

---

## 🔐 Seguridad

### Cifrado de Contraseñas

Las contraseñas se cifran usando **bcrypt** con salt rounds de 10:

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

### JSON Web Tokens (JWT)

Los tokens JWT expiran en 7 días y contienen:
```json
{
  "id": "user_id",
  "username": "username",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 🐛 Solución de Problemas

### El backend no se conecta

**Problema:** Error de CORS

**Solución:** Verifica que CORS esté habilitado en `server.js`:
```javascript
app.use(cors());
```

### El frontend no carga los Pokémon

**Problema:** La API de PokéAPI está lenta

**Solución:** Aumentar el timeout en axios o implementar caché

### La base de datos no persiste

**Problema:** `db.json` no se crea

**Solución:** Verificar permisos de escritura en la carpeta backend

---

## 📝 Ejemplo de Uso

### 1. Registrar un usuario

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ash_ketchum",
    "email": "ash@pokemon.com",
    "password": "pikachu123"
  }'
```

### 2. Iniciar sesión

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ash_ketchum",
    "password": "pikachu123"
  }'
```

### 3. Agregar Pokémon a colección

```bash
curl -X POST http://localhost:5000/api/collection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token_jwt>" \
  -d '{
    "pokemonId": 494,
    "notes": "Mi primer Victini!"
  }'
```

---

## 🎯 Roadmap y Mejoras Futuras

- [ ] Implementar SSO (Google, GitHub)
- [ ] Agregar integración con Transbank para compras
- [ ] Implementar chat con OpenAI API
- [ ] Agregar animaciones de captura
- [ ] Sistema de logros y badges
- [ ] Modo competitivo con estadísticas
- [ ] PWA (Progressive Web App)
- [ ] Modo oscuro/claro

---

## 📚 Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- bcryptjs (cifrado)
- jsonwebtoken (JWT)
- axios (HTTP client)

### Frontend
- React 18
- React Router
- Axios
- CSS Modules / Tailwind CSS

### API Externa
- PokéAPI (https://pokeapi.co)

---

## 👥 Autores

Proyecto desarrollado para la asignatura de desarrollo web.

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT.

---

## 🎮 Pokémon de Unova Incluidos

**Rango:** #000 Victini → #155 Genesect

Incluye todos los Pokémon de la Pokédex de Unova:
- Iniciales: Snivy, Tepig, Oshawott
- Legendarios: Victini, Reshiram, Zekrom, Kyurem
- Míticos: Meloetta, Keldeo, Genesect
- Y muchos más...

---

## 🙏 Agradecimientos

- PokéAPI por proporcionar los datos
- The Pokémon Company
- Game Freak

---

**¡Hazte con todos! 🎮✨**
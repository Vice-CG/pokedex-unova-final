# Pokédex de Unova

Aplicación web de la Pokédex de la región de Unova (Pokémon Black/White).

## Descripción

Este proyecto permite explorar y gestionar una colección personal de Pokémon. Los usuarios pueden registrarse, buscar Pokémon y añadirlos a su colección con notas personalizadas.

---

## Características

- **Autenticación de usuarios** con registro e inicio de sesión
- **Gestión de colección personal** (agregar, editar notas, eliminar)
- **Búsqueda de Pokémon** por nombre o número
- **Información detallada** (estadísticas, evoluciones, movimientos)
- **Multilenguaje** (español e inglés)
- **Diseño responsive** (móvil, tablet y escritorio)

---

## Tecnologías

**Backend:**
- Node.js + Express
- bcrypt (seguridad de contraseñas)
- JWT (autenticación)

**Frontend:**
- React
- CSS3

**API Externa:**
- PokéAPI

---

## Instalación

### Backend
```bash
cd backend
npm install
npm start
```

Corre en `http://localhost:5000/api/pokemon`

### Frontend
```bash
cd frontend
npm install
npm start
```

Corre en `http://localhost:3000`

---

## Uso

1. Abrir `http://localhost:3000`
2. Registrarse o iniciar sesión
3. Explorar la lista de Pokémon
4. Agregar Pokémon a la colección
5. Ver detalles completos de cada Pokémon
6. Cambiar idioma con el botón 🌐

---

## API

### Autenticación
- `POST /api/register` - Registrar usuario
- `POST /api/login` - Iniciar sesión

### Pokémon
- `GET /api/pokemon` - Lista de Pokémon
- `GET /api/pokemon/:id/details` - Detalles completos

### Colección
- `GET /api/collection` - Ver colección
- `POST /api/collection` - Agregar Pokémon
- `PUT /api/collection/:id` - Editar notas
- `DELETE /api/collection/:id` - Eliminar

---

## Créditos

- Datos: [PokéAPI](https://pokeapi.co)

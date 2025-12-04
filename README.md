# Pokédex de Unova

Aplicación web de la Pokédex de la región de Unova (Pokémon Black/White).

## Descripción

Este proyecto permite explorar y gestionar una colección personal de Pokémon. Los usuarios pueden registrarse, buscar Pokémon y añadirlos a su colección con notas personalizadas.

---

## Modificaciones

- **MongoDB**, aunque no estoy muy seguro de cómo va a funcionar/quedar abierta la base de datos en MongoDB Atlas
- **OAuth**, logré usar el OAuth de google, aunque parece que me quieren cobrar + el nombre de usuario queda como un código raro, y el de GitHub funciona perfecto, toma bien la foto y nombre de usuario. Siguen cumpliendo la labor de mantener los datos guardados en cada cuenta.
  <img width="674" height="748" alt="image" src="https://github.com/user-attachments/assets/f154a423-0b8e-486e-a446-fd80bcf74721" />
  <img width="442" height="71" alt="image" src="https://github.com/user-attachments/assets/ca9afafa-d815-42c6-b829-060c9842290b" />
  <img width="1064" height="652" alt="image" src="https://github.com/user-attachments/assets/82db18f6-a977-4f37-97c6-f20e14a1696e" />
  <img width="575" height="65" alt="image" src="https://github.com/user-attachments/assets/fc2299cc-17ea-49ec-ae4b-d7a20573c9d9" />

- **Información Adicional**, cada pokémon contará con "Detalles" tanto en inglés como español, donde mostrará el nombre técnico de la especie, peso, altura, ratio de captura, felicidad base, estadísticas base, habilidades y línea evolutiva. Tenía y dejó de funcionar: Posibles movimientos más populares, grupo de huevo para crianza, hábitat, etc, pero al cambiar a MongoDB no lo supe implementar. Todo está en ambos idiomas.
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
- MongoDB
- OAuth

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
node server.js
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

// backend/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario de la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ============= ESTRATEGIA DE GOOGLE =============
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Buscar si el usuario ya existe con Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // Usuario existe, actualizar último login
        user.lastLogin = Date.now();
        await user.save();
        return done(null, user);
      }

      // Buscar si existe un usuario con ese email (para vincular cuentas)
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Vincular cuenta de Google a usuario existente
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.lastLogin = Date.now();
        await user.save();
        return done(null, user);
      }

      // Crear nuevo usuario
      const newUser = new User({
        googleId: profile.id,
        username: profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value,
        provider: 'google'
      });

      await newUser.save();
      done(null, newUser);
    } catch (error) {
      console.error('Error en Google Strategy:', error);
      done(error, null);
    }
  }
));

// ============= ESTRATEGIA DE GITHUB =============
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/api/auth/github/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Buscar si el usuario ya existe con GitHub ID
      let user = await User.findOne({ githubId: profile.id });

      if (user) {
        // Usuario existe, actualizar último login
        user.lastLogin = Date.now();
        await user.save();
        return done(null, user);
      }

      // Buscar si existe un usuario con ese email (para vincular cuentas)
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.local`;
      user = await User.findOne({ email: email });

      if (user) {
        // Vincular cuenta de GitHub a usuario existente
        user.githubId = profile.id;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.lastLogin = Date.now();
        await user.save();
        return done(null, user);
      }

      // Crear nuevo usuario
      const newUser = new User({
        githubId: profile.id,
        username: profile.username || profile.displayName.replace(/\s+/g, '_').toLowerCase(),
        email: email,
        avatar: profile.photos[0]?.value,
        provider: 'github'
      });

      await newUser.save();
      done(null, newUser);
    } catch (error) {
      console.error('Error en GitHub Strategy:', error);
      done(error, null);
    }
  }
));

module.exports = passport;
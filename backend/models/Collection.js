// backend/models/Collection.js
const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pokemonId: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  caught: {
    type: Boolean,
    default: true
  },
  caughtAt: {
    type: Date,
    default: Date.now
  },
  favorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar duplicados (un usuario no puede tener el mismo pokémon dos veces)
collectionSchema.index({ userId: 1, pokemonId: 1 }, { unique: true });

module.exports = mongoose.model('Collection', collectionSchema);
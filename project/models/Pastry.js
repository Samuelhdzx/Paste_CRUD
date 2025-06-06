const mongoose = require('mongoose');

const pastrySchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del pastel es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  categoria: {
    type: String,
    enum: ['Tartas', 'Cupcakes', 'Pasteles', 'Galletas', 'Otros'],
    default: 'Pasteles'
  },
  imagen: {
    type: String,
    default: '/img/default-pastry.jpg'
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  ingredientes: [String],
  disponible: {
    type: Boolean,
    default: true
  }
});

// Índices para búsquedas optimizadas
pastrySchema.index({ nombre: 'text', descripcion: 'text' });

const Pastry = mongoose.model('Pastry', pastrySchema);

module.exports = Pastry;
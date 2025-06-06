const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');
const dotenv = require('dotenv');

// Rutas
const authRoutes = require('./routes/auth.routes');
const pastryRoutes = require('./routes/pastry.routes');
const userRoutes = require('./routes/user.routes');

// Middleware
const { checkUser } = require('./middleware/auth.middleware');

// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://velazquezmolinavaleria:clavesitapou@cluster0.nkowjb8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Conexión a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Configuración de la aplicación
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_pasteleria',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: MONGODB_URI,
    ttl: 60 * 60 * 24 // 24 horas
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

// Middleware global para verificar usuario
app.use(checkUser);

// Rutas
app.get('/', (req, res) => {
  res.redirect('/pasteles');
});

app.use('/', authRoutes);
app.use('/pasteles', pastryRoutes);
app.use('/usuarios', userRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Página no encontrada',
    error: 'La página que buscas no existe' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

module.exports = app;
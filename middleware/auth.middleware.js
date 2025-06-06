// Middleware de autenticación y autorización

// Verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

// Verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
  if (req.session && req.session.userRole === 'admin') {
    return next();
  }
  res.status(403).render('error', { 
    title: 'Acceso denegado',
    error: 'No tienes permisos para acceder a esta página'
  });
};

// Verificar si el usuario es propietario del recurso o admin
const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const Pastry = require('../models/Pastry');
    const pastry = await Pastry.findById(req.params.id);
    
    if (!pastry) {
      return res.status(404).render('error', { 
        title: 'No encontrado',
        error: 'El pastel no existe'
      });
    }
    
    if (req.session.userRole === 'admin' || 
        pastry.creador.toString() === req.session.userId) {
      return next();
    }
    
    res.status(403).render('error', { 
      title: 'Acceso denegado',
      error: 'No tienes permisos para modificar este recurso'
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error',
      error: 'Ocurrió un error al verificar permisos'
    });
  }
};

// Verificar y guardar información del usuario en res.locals
const checkUser = async (req, res, next) => {
  res.locals.user = null;
  res.locals.isAuthenticated = false;
  res.locals.isAdmin = false;
  
  if (req.session && req.session.userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.user = {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        };
        res.locals.isAuthenticated = true;
        res.locals.isAdmin = user.rol === 'admin';
      }
    } catch (error) {
      console.error('Error al verificar usuario:', error);
    }
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isOwnerOrAdmin,
  checkUser
};
const User = require('../models/User');

// Renderizar página de registro
const renderRegister = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/pasteles');
  }
  res.render('auth/register', { 
    title: 'Registro', 
    error: null 
  });
};

// Procesar registro de usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password, confirmPassword } = req.body;
    
    // Validaciones
    if (!nombre || !email || !password) {
      return res.render('auth/register', { 
        title: 'Registro', 
        error: 'Todos los campos son obligatorios',
        values: { nombre, email }
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('auth/register', { 
        title: 'Registro', 
        error: 'Las contraseñas no coinciden',
        values: { nombre, email }
      });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', { 
        title: 'Registro', 
        error: 'El email ya está registrado',
        values: { nombre, email }
      });
    }
    
    // Crear el primer usuario como admin, los demás como usuarios normales
    const count = await User.countDocuments({});
    const rol = count === 0 ? 'admin' : 'usuario';
    
    // Crear usuario
    const user = new User({ nombre, email, password, rol });
    await user.save();
    
    // Iniciar sesión automáticamente
    req.session.userId = user._id;
    req.session.userRole = user.rol;
    
    res.redirect('/pasteles');
    
  } catch (error) {
    res.render('auth/register', { 
      title: 'Registro', 
      error: error.message,
      values: req.body
    });
  }
};

// Renderizar página de login
const renderLogin = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/pasteles');
  }
  res.render('auth/login', { 
    title: 'Iniciar sesión', 
    error: null 
  });
};

// Procesar login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validaciones
    if (!email || !password) {
      return res.render('auth/login', { 
        title: 'Iniciar sesión', 
        error: 'Todos los campos son obligatorios',
        email
      });
    }
    
    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { 
        title: 'Iniciar sesión', 
        error: 'Credenciales incorrectas',
        email
      });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', { 
        title: 'Iniciar sesión', 
        error: 'Credenciales incorrectas',
        email
      });
    }
    
    // Iniciar sesión
    req.session.userId = user._id;
    req.session.userRole = user.rol;
    
    // Redireccionar a la página original o a pasteles
    const redirectUrl = req.session.returnTo || '/pasteles';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
    
  } catch (error) {
    res.render('auth/login', { 
      title: 'Iniciar sesión', 
      error: error.message,
      email: req.body.email
    });
  }
};

// Cerrar sesión
const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = {
  renderRegister,
  register,
  renderLogin,
  login,
  logout
};
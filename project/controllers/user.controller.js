const User = require('../models/User');
const Pastry = require('../models/Pastry');

// Listar todos los usuarios (solo admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort('nombre');
    
    res.render('user/index', { 
      title: 'Usuarios', 
      users 
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar usuarios' 
    });
  }
};

// Mostrar perfil de usuario
const getUserProfile = async (req, res) => {
  try {
    // Si es el propio usuario o es admin, puede ver el perfil
    const isOwnProfile = req.params.id === req.session.userId;
    const isAdmin = req.session.userRole === 'admin';
    
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).render('error', { 
        title: 'Acceso denegado', 
        error: 'No tienes permiso para ver este perfil' 
      });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El usuario no existe' 
      });
    }
    
    // Contar pasteles creados por el usuario
    const pastriesCount = await Pastry.countDocuments({ creador: user._id });
    
    res.render('user/profile', { 
      title: `Perfil de ${user.nombre}`,
      user,
      pastriesCount,
      isOwnProfile
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar el perfil' 
    });
  }
};

// Mostrar formulario para editar usuario
const renderEditUserForm = async (req, res) => {
  try {
    // Si es el propio usuario o es admin, puede editar
    const isOwnProfile = req.params.id === req.session.userId;
    const isAdmin = req.session.userRole === 'admin';
    
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).render('error', { 
        title: 'Acceso denegado', 
        error: 'No tienes permiso para editar este usuario' 
      });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El usuario no existe' 
      });
    }
    
    res.render('user/edit', { 
      title: `Editar ${user.nombre}`, 
      user, 
      error: null,
      isAdmin
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar el formulario de edición' 
    });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { nombre, email, rol } = req.body;
    const userId = req.params.id;
    
    // Si es el propio usuario o es admin, puede editar
    const isOwnProfile = userId === req.session.userId;
    const isAdmin = req.session.userRole === 'admin';
    
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).render('error', { 
        title: 'Acceso denegado', 
        error: 'No tienes permiso para editar este usuario' 
      });
    }
    
    // Validar datos
    if (!nombre || !email) {
      const user = await User.findById(userId).select('-password');
      return res.render('user/edit', {
        title: `Editar ${user.nombre}`,
        user,
        error: 'Nombre y email son obligatorios',
        isAdmin
      });
    }
    
    // Buscar el usuario
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El usuario no existe' 
      });
    }
    
    // Verificar si el email ya está en uso por otro usuario
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.render('user/edit', {
          title: `Editar ${user.nombre}`,
          user: { ...user.toObject(), email },
          error: 'El email ya está en uso por otro usuario',
          isAdmin
        });
      }
    }
    
    // Actualizar datos
    user.nombre = nombre;
    user.email = email;
    
    // Solo admin puede cambiar roles
    if (isAdmin && rol) {
      user.rol = rol;
    }
    
    await user.save();
    
    // Actualizar la sesión si es el propio usuario
    if (isOwnProfile) {
      req.session.userRole = user.rol;
    }
    
    res.redirect(`/usuarios/${userId}`);
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al actualizar el usuario' 
    });
  }
};

// Cambiar contraseña
const renderChangePasswordForm = async (req, res) => {
  try {
    // Solo el propio usuario puede cambiar su contraseña
    if (req.params.id !== req.session.userId) {
      return res.status(403).render('error', { 
        title: 'Acceso denegado', 
        error: 'No puedes cambiar la contraseña de otro usuario' 
      });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El usuario no existe' 
      });
    }
    
    res.render('user/change-password', { 
      title: 'Cambiar Contraseña', 
      user, 
      error: null 
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar el formulario' 
    });
  }
};

// Procesar cambio de contraseña
const changePassword = async (req, res) => {
  try {
    // Solo el propio usuario puede cambiar su contraseña
    if (req.params.id !== req.session.userId) {
      return res.status(403).render('error', { 
        title: 'Acceso denegado', 
        error: 'No puedes cambiar la contraseña de otro usuario' 
      });
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validar datos
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('user/change-password', {
        title: 'Cambiar Contraseña',
        user: { _id: req.params.id },
        error: 'Todos los campos son obligatorios'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.render('user/change-password', {
        title: 'Cambiar Contraseña',
        user: { _id: req.params.id },
        error: 'Las nuevas contraseñas no coinciden'
      });
    }
    
    if (newPassword.length < 6) {
      return res.render('user/change-password', {
        title: 'Cambiar Contraseña',
        user: { _id: req.params.id },
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Buscar usuario
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El usuario no existe' 
      });
    }
    
    // Verificar contraseña actual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.render('user/change-password', {
        title: 'Cambiar Contraseña',
        user: { _id: req.params.id },
        error: 'La contraseña actual es incorrecta'
      });
    }
    
    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    
    // Mostrar mensaje de éxito
    req.session.passwordChanged = true;
    res.redirect(`/usuarios/${req.params.id}`);
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cambiar la contraseña' 
    });
  }
};

// Eliminar usuario (solo admin)
const deleteUser = async (req, res) => {
  try {
    // Verificar que no se elimine a sí mismo
    if (req.params.id === req.session.userId) {
      return res.status(400).render('error', { 
        title: 'Error', 
        error: 'No puedes eliminar tu propia cuenta' 
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El usuario no existe' 
      });
    }
    
    // Eliminar pasteles asociados
    await Pastry.deleteMany({ creador: user._id });
    
    // Eliminar usuario
    await user.deleteOne();
    
    res.redirect('/usuarios');
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al eliminar el usuario' 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserProfile,
  renderEditUserForm,
  updateUser,
  renderChangePasswordForm,
  changePassword,
  deleteUser
};
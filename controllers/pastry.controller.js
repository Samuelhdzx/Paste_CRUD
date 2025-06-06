const Pastry = require('../models/Pastry');
const fs = require('fs');
const path = require('path');

// Listar todos los pasteles
const getAllPastries = async (req, res) => {
  try {
    const { categoria, busqueda } = req.query;
    let filter = {};
    
    // Filtrar por categoría si se proporciona
    if (categoria && categoria !== 'Todas') {
      filter.categoria = categoria;
    }
    
    // Filtrar por términos de búsqueda
    if (busqueda) {
      filter.$text = { $search: busqueda };
    }
    
    // Si el usuario no es admin, mostrar solo los pasteles disponibles (a menos que sean propios)
    if (res.locals.user && res.locals.user.rol !== 'admin') {
      filter = {
        ...filter,
        $or: [
          { disponible: true },
          { creador: req.session.userId }
        ]
      };
    }
    
    // Obtener pasteles con filtros
    let pastries = await Pastry.find(filter)
      .populate('creador', 'nombre')
      .sort('-fechaCreacion');
    
    // Obtener categorías para el filtro
    const categorias = await Pastry.distinct('categoria');
    
    res.render('pastry/index', { 
      title: 'Pasteles',
      pastries,
      categoriaActual: categoria || 'Todas',
      categorias,
      busqueda: busqueda || ''
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar los pasteles' 
    });
  }
};

// Mostrar formulario para crear pastel
const renderCreateForm = (req, res) => {
  res.render('pastry/create', { 
    title: 'Nuevo Pastel', 
    pastry: {}, 
    error: null 
  });
};

// Crear nuevo pastel
const createPastry = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, ingredientes, disponible } = req.body;
    
    // Validar datos
    if (!nombre || !descripcion || !precio) {
      return res.render('pastry/create', {
        title: 'Nuevo Pastel',
        pastry: req.body,
        error: 'Nombre, descripción y precio son obligatorios'
      });
    }
    
    // Procesar ingredientes
    const ingredientesArray = ingredientes ? 
      ingredientes.split(',').map(ing => ing.trim()) : [];
    
    // Crear pastel
    const pastry = new Pastry({
      nombre,
      descripcion,
      precio,
      categoria: categoria || 'Pasteles',
      ingredientes: ingredientesArray,
      disponible: disponible === 'on',
      creador: req.session.userId,
      imagen: req.file ? `/uploads/${req.file.filename}` : '/img/default-pastry.jpg'
    });
    
    await pastry.save();
    res.redirect('/pasteles');
    
  } catch (error) {
    res.render('pastry/create', {
      title: 'Nuevo Pastel',
      pastry: req.body,
      error: error.message
    });
  }
};

// Mostrar detalle de un pastel
const getPastryDetail = async (req, res) => {
  try {
    const pastry = await Pastry.findById(req.params.id)
      .populate('creador', 'nombre');
    
    if (!pastry) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El pastel no existe' 
      });
    }
    
    res.render('pastry/detail', { 
      title: pastry.nombre, 
      pastry 
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar el pastel' 
    });
  }
};

// Mostrar formulario de edición
const renderEditForm = async (req, res) => {
  try {
    const pastry = await Pastry.findById(req.params.id);
    
    if (!pastry) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El pastel no existe' 
      });
    }
    
    res.render('pastry/edit', { 
      title: `Editar ${pastry.nombre}`, 
      pastry, 
      error: null 
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar el formulario de edición' 
    });
  }
};

// Actualizar pastel
const updatePastry = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, ingredientes, disponible } = req.body;
    
    // Validar datos
    if (!nombre || !descripcion || !precio) {
      return res.render('pastry/edit', {
        title: 'Editar Pastel',
        pastry: { ...req.body, _id: req.params.id },
        error: 'Nombre, descripción y precio son obligatorios'
      });
    }
    
    // Procesar ingredientes
    const ingredientesArray = ingredientes ? 
      ingredientes.split(',').map(ing => ing.trim()) : [];
    
    // Buscar pastel existente
    const pastry = await Pastry.findById(req.params.id);
    
    if (!pastry) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El pastel no existe' 
      });
    }
    
    // Actualizar datos
    pastry.nombre = nombre;
    pastry.descripcion = descripcion;
    pastry.precio = precio;
    pastry.categoria = categoria || 'Pasteles';
    pastry.ingredientes = ingredientesArray;
    pastry.disponible = disponible === 'on';
    
    // Actualizar imagen si se proporciona una nueva
    if (req.file) {
      // Eliminar imagen anterior si no es la default
      if (pastry.imagen && pastry.imagen !== '/img/default-pastry.jpg') {
        const oldImagePath = path.join(__dirname, '../public', pastry.imagen);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      pastry.imagen = `/uploads/${req.file.filename}`;
    }
    
    await pastry.save();
    res.redirect(`/pasteles/${pastry._id}`);
    
  } catch (error) {
    res.render('pastry/edit', {
      title: 'Editar Pastel',
      pastry: { ...req.body, _id: req.params.id },
      error: error.message
    });
  }
};

// Eliminar pastel
const deletePastry = async (req, res) => {
  try {
    const pastry = await Pastry.findById(req.params.id);
    
    if (!pastry) {
      return res.status(404).render('error', { 
        title: 'No encontrado', 
        error: 'El pastel no existe' 
      });
    }
    
    // Eliminar imagen si no es la default
    if (pastry.imagen && pastry.imagen !== '/img/default-pastry.jpg') {
      const imagePath = path.join(__dirname, '../public', pastry.imagen);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await pastry.deleteOne();
    res.redirect('/pasteles');
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al eliminar el pastel' 
    });
  }
};

// Mostrar pasteles del usuario actual
const getMyPastries = async (req, res) => {
  try {
    const pastries = await Pastry.find({ creador: req.session.userId })
      .sort('-fechaCreacion');
    
    res.render('pastry/my-pastries', { 
      title: 'Mis Pasteles', 
      pastries 
    });
    
  } catch (error) {
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Error al cargar tus pasteles' 
    });
  }
};

module.exports = {
  getAllPastries,
  renderCreateForm,
  createPastry,
  getPastryDetail,
  renderEditForm,
  updatePastry,
  deletePastry,
  getMyPastries
};
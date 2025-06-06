const express = require('express');
const router = express.Router();
const pastryController = require('../controllers/pastry.controller');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'pastel-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
});

// Rutas de pasteles
router.get('/', pastryController.getAllPastries);
router.get('/crear', isAuthenticated, pastryController.renderCreateForm);
router.post('/', isAuthenticated, upload.single('imagen'), pastryController.createPastry);
router.get('/mis-pasteles', isAuthenticated, pastryController.getMyPastries);
router.get('/:id', pastryController.getPastryDetail);
router.get('/:id/editar', isAuthenticated, isOwnerOrAdmin, pastryController.renderEditForm);
router.put('/:id', isAuthenticated, isOwnerOrAdmin, upload.single('imagen'), pastryController.updatePastry);
router.delete('/:id', isAuthenticated, isOwnerOrAdmin, pastryController.deletePastry);

module.exports = router;
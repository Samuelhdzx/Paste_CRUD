const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

// Rutas de autenticación
router.get('/registro', authController.renderRegister);
router.post('/registro', authController.register);
router.get('/login', authController.renderLogin);
router.post('/login', authController.login);
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;
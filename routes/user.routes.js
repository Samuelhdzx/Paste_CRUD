const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

// Rutas de usuarios
router.get('/', isAuthenticated, isAdmin, userController.getAllUsers);
router.get('/:id', isAuthenticated, userController.getUserProfile);
router.get('/:id/editar', isAuthenticated, userController.renderEditUserForm);
router.post('/:id', isAuthenticated, userController.updateUser);
router.get('/:id/cambiar-password', isAuthenticated, userController.renderChangePasswordForm);
router.post('/:id/cambiar-password', isAuthenticated, userController.changePassword);
router.delete('/:id', isAuthenticated, isAdmin, userController.deleteUser);

module.exports = router;
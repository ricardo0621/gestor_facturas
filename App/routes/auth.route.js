const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

// Definición de la ruta de login.
// POST /api/auth/login
router.post('/login', authController.loginUsuario);

module.exports = router;
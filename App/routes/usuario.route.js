const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuario.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas de gestión de usuarios (solo SUPER_ADMIN)
router.post('/', usuarioController.crearUsuario);
router.get('/', usuarioController.listarUsuarios);
router.get('/roles', usuarioController.listarRoles);
router.get('/ruta2', usuarioController.listarUsuariosRuta2); // Listar usuarios de Ruta 2
router.get('/:id', usuarioController.obtenerUsuario);
router.put('/:id', usuarioController.actualizarUsuario);
router.delete('/:id', usuarioController.desactivarUsuario);
router.patch('/:id/activar', usuarioController.activarUsuario);
router.put('/:id/roles', usuarioController.asignarRoles);

module.exports = router;
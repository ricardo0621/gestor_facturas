const express = require('express');
const router = express.Router();
const controller = require('../controller/tipoSoporte.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Middleware para verificar rol SUPER_ADMIN
const verificarSuperAdmin = (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes('SUPER_ADMIN')) {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Solo SUPER_ADMIN puede realizar esta acción.'
        });
    }
    next();
};

// Rutas públicas (requieren autenticación)
router.get('/', verifyToken, controller.listar);
router.get('/:id', verifyToken, controller.obtener);

// Rutas protegidas (solo SUPER_ADMIN)
router.post('/', verifyToken, verificarSuperAdmin, controller.crear);
router.put('/:id', verifyToken, verificarSuperAdmin, controller.actualizar);
router.delete('/:id', verifyToken, verificarSuperAdmin, controller.eliminar);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    listarProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor
} = require('../controller/proveedor.controller');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
// Solo Super Admin puede gestionar (crear, editar, eliminar), pero todos pueden listar (para cargar facturas)

router.get('/', verifyToken, listarProveedores);
router.post('/', verifyToken, isSuperAdmin, crearProveedor);
router.put('/:id', verifyToken, isSuperAdmin, actualizarProveedor);
router.delete('/:id', verifyToken, isSuperAdmin, eliminarProveedor);

module.exports = router;

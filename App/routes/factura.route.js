const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importar controlador y middleware de autenticación
const {
    cargarFactura,
    listarFacturas,
    obtenerFactura,
    procesarEstado,
    procesarEstadoConDocumento,
    obtenerHistorial,
    obtenerEstadisticas,
    agregarDocumento,
    listarDocumentos,
    eliminarDocumento,
    descargarDocumento,
    eliminarFactura
} = require('../controller/factura.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Configuración de Multer para carga de archivos
const UPLOAD_BASE_PATH = 'D:\\FacturasClinica';

// Asegurarse de que el directorio de carga exista
try {
    if (!fs.existsSync(UPLOAD_BASE_PATH)) {
        console.log(`Creando directorio de carga: ${UPLOAD_BASE_PATH}`);
        fs.mkdirSync(UPLOAD_BASE_PATH, { recursive: true });
    }
} catch (error) {
    console.error(`ERROR FATAL: No se pudo crear el directorio de carga ${UPLOAD_BASE_PATH}.`);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_BASE_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Configurar para archivo único - documento (evidencia de pago)
const uploadSingleDocumento = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('documento');

// Configurar para archivo único - documentoSoporte (para Ruta 3)
const uploadSingleSoporte = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('documentoSoporte');

// Configurar para múltiples archivos (carga inicial de factura)
const uploadMultiple = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB por archivo
}).array('documentos', 10); // Máximo 10 archivos

// =============================================================
// RUTAS DE FACTURAS
// =============================================================

// GET /api/facturas - Listar facturas con filtros
router.get('/', verifyToken, listarFacturas);

// GET /api/facturas/estadisticas - Obtener estadísticas
router.get('/estadisticas', verifyToken, obtenerEstadisticas);

// GET /api/facturas/:id - Obtener detalles de una factura
router.get('/:id', verifyToken, obtenerFactura);

// GET /api/facturas/:id/historial - Obtener historial de una factura
router.get('/:id/historial', verifyToken, obtenerHistorial);

// POST /api/facturas/cargar - Cargar nueva factura con múltiples documentos
router.post('/cargar', verifyToken, uploadMultiple, cargarFactura);

// PUT /api/facturas/:id/estado - Procesar flujo de factura (Aprobar, Rechazar, etc.)
router.put('/:id/estado', verifyToken, procesarEstado);

// PUT /api/facturas/:id/estado-con-documento - Procesar flujo con documento de soporte (Ruta 3)
router.put('/:id/estado-con-documento', verifyToken, uploadSingleSoporte, procesarEstadoConDocumento);

// DELETE /api/facturas/:id - Eliminar factura (solo SUPER_ADMIN)
router.delete('/:id', verifyToken, eliminarFactura);

// =============================================================
// RUTAS DE DOCUMENTOS
// =============================================================

// POST /api/facturas/:id/documentos - Agregar documento a una factura (evidencia de pago)
router.post('/:id/documentos', verifyToken, uploadSingleDocumento, agregarDocumento);

// GET /api/facturas/:id/documentos - Listar documentos de una factura
router.get('/:id/documentos', verifyToken, listarDocumentos);

// DELETE /api/facturas/documentos/:docId - Eliminar un documento
router.delete('/documentos/:docId', verifyToken, eliminarDocumento);

// GET /api/facturas/documentos/:docId/descargar - Descargar un documento
router.get('/documentos/:docId/descargar', verifyToken, descargarDocumento);

module.exports = router;
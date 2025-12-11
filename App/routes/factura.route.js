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
    eliminarFactura,
    busquedaAvanzada,
    contarPendientes,
    corregirFacturaRuta1,
    eliminarDocumentoCorreccion,
    agregarDocumentoCorreccion
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
        // Obtener información del request
        const facturaId = req.params.id || req.body.factura_id || 'TEMP';
        const tipoDoc = req.body.tipo_documento || file.fieldname || 'DOC';
        const timestamp = Date.now();

        // Limpiar nombre original (sin espacios ni caracteres especiales)
        const ext = path.extname(file.originalname);
        const nombreBase = path.basename(file.originalname, ext)
            .replace(/\s+/g, '_')           // Espacios a guiones bajos
            .replace(/[^a-zA-Z0-9_-]/g, '') // Solo alfanuméricos, guiones y guiones bajos
            .substring(0, 50);              // Máximo 50 caracteres

        // Formato mejorado: FAC-123_FACTURA_1733876543210_nombre_original.pdf
        const fileName = `FAC-${facturaId}_${tipoDoc}_${timestamp}_${nombreBase}${ext}`;

        cb(null, fileName);
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

// GET /api/facturas/busqueda-avanzada - Búsqueda avanzada (requiere permiso)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar conflictos
router.get('/busqueda-avanzada', verifyToken, busquedaAvanzada);

// GET /api/facturas/pendientes/count - Contar facturas pendientes
router.get('/pendientes/count', verifyToken, contarPendientes);

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

// PUT /api/facturas/:id/corregir-datos - Corregir datos de factura (Solo Ruta 1)
router.put('/:id/corregir-datos', verifyToken, corregirFacturaRuta1);

// DELETE /api/facturas/:id - Eliminar factura (solo SUPER_ADMIN)
router.delete('/:id', verifyToken, eliminarFactura);

// =============================================================
// RUTAS DE DOCUMENTOS
// =============================================================

// POST /api/facturas/:id/documentos - Agregar documento a una factura (evidencia de pago)
router.post('/:id/documentos', verifyToken, uploadSingleDocumento, agregarDocumento);

// POST /api/facturas/:id/documentos/correccion - Agregar documento de corrección (Ruta 1 o 3)
router.post('/:id/documentos/correccion', verifyToken, uploadSingleDocumento, agregarDocumentoCorreccion);

// GET /api/facturas/:id/documentos - Listar documentos de una factura
router.get('/:id/documentos', verifyToken, listarDocumentos);

// DELETE /api/facturas/:facturaId/documentos/:documentoId/correccion - Eliminar documento durante corrección (Ruta 1)
router.delete('/:facturaId/documentos/:documentoId/correccion', verifyToken, eliminarDocumentoCorreccion);

// DELETE /api/facturas/documentos/:docId - Eliminar un documento
router.delete('/documentos/:docId', verifyToken, eliminarDocumento);

// GET /api/facturas/documentos/:docId/descargar - Descargar un documento
router.get('/documentos/:docId/descargar', verifyToken, descargarDocumento);

module.exports = router;
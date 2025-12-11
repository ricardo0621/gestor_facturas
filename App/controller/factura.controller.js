const facturaService = require('../services/factura.service');
const fs = require('fs');
const path = require('path');

/**
 * Endpoint para cargar una nueva factura con múltiples archivos
 */
const cargarFactura = async (req, res) => {
    try {
        const files = req.files;
        const body = req.body;
        const userId = req.user.usuario_id;

        // Validación básica de archivos
        if (!files || files.length === 0) {
            return res.status(400).json({
                error: 'Archivos requeridos',
                details: 'Debe subir al menos un archivo.'
            });
        }

        // Validación de tipos de documento
        let tiposDocumento = body.tipos_documento;
        if (!tiposDocumento) {
            return res.status(400).json({
                error: 'Tipos de documento requeridos',
                details: 'Debe especificar el tipo para cada documento.'
            });
        }

        // Asegurar que tiposDocumento sea un array
        if (!Array.isArray(tiposDocumento)) {
            tiposDocumento = [tiposDocumento];
        }

        if (files.length !== tiposDocumento.length) {
            return res.status(400).json({
                error: 'Discrepancia en datos',
                details: 'La cantidad de archivos no coincide con la cantidad de tipos de documento.'
            });
        }

        // Validar que exista al menos una FACTURA
        if (!tiposDocumento.includes('FACTURA')) {
            // Limpiar archivos subidos si falla validación
            files.forEach(f => {
                try { fs.unlinkSync(f.path); } catch (e) { console.error('Error borrando archivo:', e); }
            });
            return res.status(400).json({
                error: 'Falta factura',
                details: 'Debe incluir al menos un archivo de tipo FACTURA.'
            });
        }

        // Validar rol de Ruta 2 (opcional pero recomendado)
        const rolAprobadorRuta2 = body.rol_aprobador_ruta2 || null;

        // Preparar datos de la factura
        const facturaData = {
            numero_factura: body.numero_factura,
            nit_proveedor: body.nit_proveedor,
            fecha_emision: body.fecha_emision,
            monto: body.monto,
            concepto: body.concepto
        };

        // Llamar al servicio con el rol de Ruta 2
        const nuevaFactura = await facturaService.crearFacturaConMultiplesArchivos(
            facturaData,
            files,
            tiposDocumento,
            userId,
            rolAprobadorRuta2
        );

        res.status(201).json({
            success: true,
            message: 'Factura creada exitosamente',
            factura: nuevaFactura
        });

    } catch (error) {
        console.error('Error en cargarFactura:', error);

        if (error.message.includes('proveedor')) {
            return res.status(400).json({ error: 'Error de validación', details: error.message });
        }
        if (error.message.includes('Ya existe')) {
            return res.status(409).json({ error: 'Conflicto', details: error.message });
        }
        if (error.message.includes('rol de Ruta 2')) {
            return res.status(400).json({ error: 'Error de validación', details: error.message });
        }

        res.status(500).json({
            error: 'Error interno al procesar la factura',
            details: error.message
        });
    }
};

const listarFacturas = async (req, res) => {
    try {
        const userId = req.user.usuario_id;
        const filtros = {
            busqueda: req.query.busqueda || null,
            numero_factura: req.query.numero_factura || null,
            nit: req.query.nit || null,
            proveedor: req.query.proveedor || null,
            estado_codigo: req.query.estado_codigo || null
        };

        const facturas = await facturaService.listarFacturas(filtros, userId);

        res.status(200).json({
            success: true,
            count: facturas.length,
            facturas
        });

    } catch (error) {
        console.error('Error al listar facturas:', error);
        res.status(500).json({
            error: 'Error al listar facturas.',
            details: error.message
        });
    }
};

/**
 * Endpoint para obtener una factura por ID
 */
const obtenerFactura = async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await facturaService.obtenerFacturaPorId(id);

        if (!factura) {
            return res.status(404).json({
                error: 'Factura no encontrada.',
                details: `No existe una factura con ID ${id}.`
            });
        }

        res.status(200).json({
            success: true,
            factura
        });

    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({
            error: 'Error al obtener la factura.',
            details: error.message
        });
    }
};

/**
 * Endpoint para procesar el estado de una factura (Aprobar, Rechazar, Corregir, Anular, Pagar)
 */
const procesarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { accion, observacion } = req.body;
        const userId = req.user.usuario_id;

        if (!accion) {
            return res.status(400).json({
                error: 'Acción requerida.',
                details: 'Debe especificar la acción a realizar (APROBAR, RECHAZAR, CORREGIR, ANULAR, PAGAR).'
            });
        }

        const resultado = await facturaService.procesarFactura(id, accion, userId, {
            observacion
        });

        res.status(200).json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('Error al procesar factura:', error);

        if (error.message.includes('no fue encontrada')) {
            return res.status(404).json({ error: 'Factura no encontrada', details: error.message });
        }
        if (error.message.includes('no permitida') || error.message.includes('Solo')) {
            return res.status(400).json({ error: 'Acción no válida para el estado actual.', details: error.message });
        }

        res.status(500).json({
            error: 'Error al procesar la factura.',
            details: error.message
        });
    }
};

/**
 * Endpoint para procesar el estado de una factura CON documento de soporte
 * (Usado en Ruta 3 - Contabilidad donde es obligatorio subir un documento)
 */
const procesarEstadoConDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { accion, observacion } = req.body;
        const userId = req.user.usuario_id;
        const file = req.file;

        if (!accion) {
            return res.status(400).json({
                error: 'Acción requerida.',
                details: 'Debe especificar la acción a realizar.'
            });
        }

        if (!file) {
            return res.status(400).json({
                error: 'Documento requerido.',
                details: 'Debe adjuntar un documento de soporte.'
            });
        }

        // Primero agregar el documento de soporte
        await facturaService.agregarDocumento(
            id,
            file,
            'SOPORTE',
            file.originalname,
            userId,
            `Documento de soporte para ${accion}`
        );

        // Luego procesar la factura
        const resultado = await facturaService.procesarFactura(id, accion, userId, {
            observacion
        });

        res.status(200).json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('Error al procesar factura con documento:', error);

        // Limpieza de archivo si falla
        if (req.file) {
            const UPLOAD_DIR = 'D:\\FacturasClinica';
            const filePath = path.join(UPLOAD_DIR, req.file.filename);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Error al eliminar archivo:', e);
                }
            }
        }

        if (error.message.includes('no fue encontrada')) {
            return res.status(404).json({ error: 'Factura no encontrada', details: error.message });
        }
        if (error.message.includes('no permitida') || error.message.includes('Solo')) {
            return res.status(400).json({ error: 'Acción no válida para el estado actual.', details: error.message });
        }

        res.status(500).json({
            error: 'Error al procesar la factura.',
            details: error.message
        });
    }
};

/**
 * Endpoint para obtener el historial de una factura
 */
const obtenerHistorial = async (req, res) => {
    try {
        const { id } = req.params;
        const historial = await facturaService.obtenerHistorialFactura(id);

        res.status(200).json({
            success: true,
            count: historial.length,
            historial
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            error: 'Error al obtener el historial de la factura.',
            details: error.message
        });
    }
};

/**
 * Endpoint para obtener estadísticas generales
 */
const obtenerEstadisticas = async (req, res) => {
    try {
        const estadisticas = await facturaService.obtenerEstadisticas();

        res.status(200).json({
            success: true,
            estadisticas
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error al obtener las estadísticas.',
            details: error.message
        });
    }
};

/**
 * Agregar documento a una factura
 */
const agregarDocumento = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Archivo requerido',
                details: 'Debe enviar un archivo en el campo "documento".'
            });
        }

        const { id } = req.params;
        const { tipo_documento, nombre_personalizado, observacion } = req.body;
        const userId = req.user.usuario_id;

        if (!tipo_documento) {
            return res.status(400).json({
                error: 'Tipo de documento requerido',
                details: 'Debe especificar el tipo_documento (EVIDENCIA_PAGO).'
            });
        }

        const documento = await facturaService.agregarDocumento(
            id,
            req.file,
            tipo_documento,
            nombre_personalizado,
            userId,
            observacion
        );

        res.status(201).json({
            success: true,
            message: 'Documento agregado exitosamente',
            documento
        });

    } catch (error) {
        console.error('Error al agregar documento:', error);

        // Limpieza de archivo si falla
        if (req.file) {
            const UPLOAD_DIR = 'D:\\FacturasClinica';
            const filePath = path.join(UPLOAD_DIR, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: 'Factura no encontrada', details: error.message });
        }
        if (error.message.includes('Solo') || error.message.includes('No se pueden agregar')) {
            return res.status(403).json({ error: 'Permiso denegado', details: error.message });
        }

        res.status(500).json({
            error: 'Error al agregar documento',
            details: error.message
        });
    }
};

/**
 * Listar documentos de una factura
 */
const listarDocumentos = async (req, res) => {
    try {
        const { id } = req.params;
        const documentos = await facturaService.listarDocumentos(id);

        res.status(200).json({
            success: true,
            count: documentos.length,
            documentos
        });

    } catch (error) {
        console.error('Error al listar documentos:', error);
        res.status(500).json({
            error: 'Error al listar documentos',
            details: error.message
        });
    }
};

/**
 * Eliminar un documento
 */
const eliminarDocumento = async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.usuario_id;

        const resultado = await facturaService.eliminarDocumento(docId, userId);

        res.status(200).json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('Error al eliminar documento:', error);

        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ error: 'Documento no encontrado', details: error.message });
        }
        if (error.message.includes('Solo')) {
            return res.status(403).json({ error: 'Permiso denegado', details: error.message });
        }
        if (error.message.includes('No se puede eliminar')) {
            return res.status(400).json({ error: 'Operación no permitida', details: error.message });
        }

        res.status(500).json({
            error: 'Error al eliminar documento',
            details: error.message
        });
    }
};

/**
 * Descargar un documento
 */
const descargarDocumento = async (req, res) => {
    try {
        const { docId } = req.params;
        const db = require('../config/db');
        const client = await db.connect();

        try {
            const result = await client.query(
                'SELECT ruta_archivo, nombre_personalizado FROM factura_documentos WHERE documento_id = $1',
                [docId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Documento no encontrado' });
            }

            const { ruta_archivo, nombre_personalizado } = result.rows[0];

            if (!fs.existsSync(ruta_archivo)) {
                return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
            }

            res.download(ruta_archivo, nombre_personalizado);

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({
            error: 'Error al descargar documento',
            details: error.message
        });
    }
};

/**
 * Eliminar una factura completa (solo SUPER_ADMIN)
 */
const eliminarFactura = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.usuario_id;

    try {
        const resultado = await facturaService.eliminarFactura(id, userId);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al eliminar factura:', error);

        if (error.message.includes('Solo SUPER_ADMIN')) {
            return res.status(403).json({
                error: 'Permiso denegado',
                details: error.message
            });
        }

        res.status(500).json({
            error: 'Error al eliminar factura',
            details: error.message
        });
    }
};

/**
 * Búsqueda avanzada de facturas
 */
const busquedaAvanzada = async (req, res) => {
    try {
        const userId = req.user.usuario_id;
        const filtros = req.query; // Recibir filtros desde query params

        const resultados = await facturaService.busquedaAvanzada(filtros, userId);

        res.status(200).json({
            success: true,
            count: resultados.length,
            facturas: resultados
        });

    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);

        if (error.message.includes('No tienes permisos')) {
            return res.status(403).json({
                error: 'Acceso denegado',
                details: error.message
            });
        }

        res.status(500).json({
            error: 'Error al realizar búsqueda',
            details: error.message
        });
    }
};

/**
 * Contar facturas pendientes de aprobación
 */
const contarPendientes = async (req, res) => {
    try {
        const userId = req.user.usuario_id;
        const total = await facturaService.contarFacturasPendientes(userId);

        res.status(200).json({
            success: true,
            pendientes: total
        });

    } catch (error) {
        console.error('Error al contar pendientes:', error);
        res.status(500).json({
            error: 'Error al contar pendientes',
            details: error.message
        });
    }
};

/**
 * Corregir datos de factura (Solo Ruta 1)
 */
const corregirFacturaRuta1 = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.usuario_id;
        const datosActualizados = req.body;

        const resultado = await facturaService.corregirFacturaRuta1(id, datosActualizados, userId);

        res.status(200).json({
            success: true,
            message: 'Factura actualizada exitosamente',
            factura: resultado
        });

    } catch (error) {
        console.error('Error al corregir factura:', error);

        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: 'Factura no encontrada', details: error.message });
        }
        if (error.message.includes('Solo')) {
            return res.status(403).json({ error: 'Permiso denegado', details: error.message });
        }
        if (error.message.includes('no existe')) {
            return res.status(400).json({ error: 'Datos inválidos', details: error.message });
        }

        res.status(500).json({
            error: 'Error al corregir factura',
            details: error.message
        });
    }
};

/**
 * Eliminar documento durante corrección (Solo Ruta 1)
 */
const eliminarDocumentoCorreccion = async (req, res) => {
    try {
        const { facturaId, documentoId } = req.params;
        const userId = req.user.usuario_id;

        const resultado = await facturaService.eliminarDocumentoRuta1(documentoId, facturaId, userId);

        res.status(200).json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('Error al eliminar documento:', error);

        if (error.message.includes('no encontrada') || error.message.includes('no encontrado')) {
            return res.status(404).json({ error: 'Documento o factura no encontrada', details: error.message });
        }
        if (error.message.includes('Solo')) {
            return res.status(403).json({ error: 'Permiso denegado', details: error.message });
        }
        if (error.message.includes('No se pueden eliminar')) {
            return res.status(400).json({ error: 'Operación no permitida', details: error.message });
        }

        res.status(500).json({
            error: 'Error al eliminar documento',
            details: error.message
        });
    }
};

/**
 * Agregar documento de corrección (Ruta 1 o 3)
 */
const agregarDocumentoCorreccion = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Archivo requerido',
                details: 'Debe enviar un archivo.'
            });
        }

        const { id } = req.params;
        const { nombre_personalizado, observacion } = req.body;
        const userId = req.user.usuario_id;

        const documento = await facturaService.agregarDocumentoCorreccion(
            id,
            req.file,
            nombre_personalizado,
            userId,
            observacion
        );

        res.status(201).json({
            success: true,
            message: 'Documento de corrección agregado exitosamente',
            documento
        });

    } catch (error) {
        console.error('Error al agregar documento de corrección:', error);

        // Limpieza de archivo si falla
        if (req.file) {
            const UPLOAD_DIR = 'D:\\FacturasClinica';
            const filePath = path.join(UPLOAD_DIR, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: 'Factura no encontrada', details: error.message });
        }
        if (error.message.includes('Solo') || error.message.includes('no puede agregar')) {
            return res.status(403).json({ error: 'Permiso denegado', details: error.message });
        }

        res.status(500).json({
            error: 'Error al agregar documento de corrección',
            details: error.message
        });
    }
};

module.exports = {
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
};


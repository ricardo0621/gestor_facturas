const tipoSoporteService = require('../services/tipoSoporte.service');

/**
 * Listar tipos de soporte
 * GET /api/tipos-soporte
 */
async function listar(req, res) {
    try {
        const soloActivos = req.query.activos !== 'false'; // Por defecto true
        const tipos = await tipoSoporteService.listarTiposSoporte(soloActivos);

        res.json({
            success: true,
            tipos
        });
    } catch (error) {
        console.error('Error en listar tipos de soporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error al listar tipos de soporte',
            details: error.message
        });
    }
}

/**
 * Obtener tipo de soporte por ID
 * GET /api/tipos-soporte/:id
 */
async function obtener(req, res) {
    try {
        const { id } = req.params;
        const tipo = await tipoSoporteService.obtenerTipoSoporte(id);

        res.json({
            success: true,
            tipo
        });
    } catch (error) {
        console.error('Error en obtener tipo de soporte:', error);
        res.status(404).json({
            success: false,
            error: 'Tipo de soporte no encontrado',
            details: error.message
        });
    }
}

/**
 * Crear tipo de soporte
 * POST /api/tipos-soporte
 * Solo SUPER_ADMIN
 */
async function crear(req, res) {
    try {
        const { codigo, nombre, descripcion, orden } = req.body;

        if (!codigo || !nombre) {
            return res.status(400).json({
                success: false,
                error: 'Código y nombre son requeridos'
            });
        }

        const nuevoTipo = await tipoSoporteService.crearTipoSoporte({
            codigo,
            nombre,
            descripcion,
            orden
        });

        res.status(201).json({
            success: true,
            message: 'Tipo de soporte creado exitosamente',
            tipo: nuevoTipo
        });
    } catch (error) {
        console.error('Error en crear tipo de soporte:', error);
        res.status(400).json({
            success: false,
            error: 'Error al crear tipo de soporte',
            details: error.message
        });
    }
}

/**
 * Actualizar tipo de soporte
 * PUT /api/tipos-soporte/:id
 * Solo SUPER_ADMIN
 */
async function actualizar(req, res) {
    try {
        const { id } = req.params;
        const { codigo, nombre, descripcion, orden, activo } = req.body;

        const tipoActualizado = await tipoSoporteService.actualizarTipoSoporte(id, {
            codigo,
            nombre,
            descripcion,
            orden,
            activo
        });

        res.json({
            success: true,
            message: 'Tipo de soporte actualizado exitosamente',
            tipo: tipoActualizado
        });
    } catch (error) {
        console.error('Error en actualizar tipo de soporte:', error);
        res.status(400).json({
            success: false,
            error: 'Error al actualizar tipo de soporte',
            details: error.message
        });
    }
}

/**
 * Eliminar (desactivar) tipo de soporte
 * DELETE /api/tipos-soporte/:id
 * Solo SUPER_ADMIN
 */
async function eliminar(req, res) {
    try {
        const { id } = req.params;

        const tipoEliminado = await tipoSoporteService.eliminarTipoSoporte(id);

        res.json({
            success: true,
            message: 'Tipo de soporte desactivado exitosamente',
            tipo: tipoEliminado
        });
    } catch (error) {
        console.error('Error en eliminar tipo de soporte:', error);
        res.status(400).json({
            success: false,
            error: 'Error al eliminar tipo de soporte',
            details: error.message
        });
    }
}

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    eliminar
};

const db = require('../config/db');

/**
 * Listar tipos de soporte
 * @param {boolean} soloActivos - Si true, solo devuelve tipos activos
 */
async function listarTiposSoporte(soloActivos = true) {
    try {
        let query = 'SELECT * FROM tipos_soporte';

        if (soloActivos) {
            query += ' WHERE activo = true';
        }

        query += ' ORDER BY orden ASC, nombre ASC';

        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error al listar tipos de soporte:', error);
        throw error;
    }
}

/**
 * Obtener tipo de soporte por ID
 */
async function obtenerTipoSoporte(id) {
    try {
        const result = await db.query(
            'SELECT * FROM tipos_soporte WHERE tipo_soporte_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            throw new Error('Tipo de soporte no encontrado');
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error al obtener tipo de soporte:', error);
        throw error;
    }
}

/**
 * Crear nuevo tipo de soporte
 */
async function crearTipoSoporte(data) {
    const { codigo, nombre, descripcion, orden } = data;

    try {
        // Verificar que el código no exista
        const existe = await db.query(
            'SELECT tipo_soporte_id FROM tipos_soporte WHERE codigo = $1',
            [codigo]
        );

        if (existe.rows.length > 0) {
            throw new Error('Ya existe un tipo de soporte con ese código');
        }

        const result = await db.query(
            `INSERT INTO tipos_soporte (codigo, nombre, descripcion, orden, activo)
             VALUES ($1, $2, $3, $4, true)
             RETURNING *`,
            [codigo, nombre, descripcion || null, orden || 0]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error al crear tipo de soporte:', error);
        throw error;
    }
}

/**
 * Actualizar tipo de soporte
 */
async function actualizarTipoSoporte(id, data) {
    const { codigo, nombre, descripcion, orden, activo } = data;

    try {
        // Verificar que existe
        await obtenerTipoSoporte(id);

        // Si se cambia el código, verificar que no exista otro con ese código
        if (codigo) {
            const existe = await db.query(
                'SELECT tipo_soporte_id FROM tipos_soporte WHERE codigo = $1 AND tipo_soporte_id != $2',
                [codigo, id]
            );

            if (existe.rows.length > 0) {
                throw new Error('Ya existe otro tipo de soporte con ese código');
            }
        }

        const result = await db.query(
            `UPDATE tipos_soporte 
             SET codigo = COALESCE($1, codigo),
                 nombre = COALESCE($2, nombre),
                 descripcion = COALESCE($3, descripcion),
                 orden = COALESCE($4, orden),
                 activo = COALESCE($5, activo)
             WHERE tipo_soporte_id = $6
             RETURNING *`,
            [codigo, nombre, descripcion, orden, activo, id]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error al actualizar tipo de soporte:', error);
        throw error;
    }
}

/**
 * Eliminar (desactivar) tipo de soporte
 */
async function eliminarTipoSoporte(id) {
    try {
        // Verificar que existe
        await obtenerTipoSoporte(id);

        // Soft delete: solo desactivar
        const result = await db.query(
            `UPDATE tipos_soporte 
             SET activo = false
             WHERE tipo_soporte_id = $1
             RETURNING *`,
            [id]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error al eliminar tipo de soporte:', error);
        throw error;
    }
}

module.exports = {
    listarTiposSoporte,
    obtenerTipoSoporte,
    crearTipoSoporte,
    actualizarTipoSoporte,
    eliminarTipoSoporte
};

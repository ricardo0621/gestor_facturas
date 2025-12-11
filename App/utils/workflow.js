/**
 * Máquina de Estados del Flujo de Facturas
 * Define las transiciones permitidas y la lógica de negocio del workflow.
 */

const { ESTADOS, ESTADOS_RUTA_2, ACCIONES } = require('../constants');

/**
 * Obtiene el siguiente estado basado en la acción y el estado actual.
 * @param {string} estadoActualCodigo - Código del estado actual (ej: RUTA_1)
 * @param {string} accion - Acción a realizar (APROBAR, RECHAZAR, etc.)
 * @param {string} [estadoRetornoCorreccion] - (Opcional) A dónde volver tras corregir (ej: RUTA_3)
 * @returns {Object} - { nuevoEstado, esRechazo, estadoRetorno? }
 */
const calcularTransicion = (estadoActualCodigo, accion, estadoRetornoCorreccion = null) => {

    // 1. ANULACIÓN (Solo posible en RUTA_1)
    if (accion === ACCIONES.ANULAR) {
        if (estadoActualCodigo === ESTADOS.RUTA_1) {
            return { nuevoEstado: ESTADOS.ANULADA, esRechazo: false };
        }
        throw new Error('Solo se pueden anular facturas que estén en gestión por el usuario (Ruta 1).');
    }

    // 2. CORRECCIÓN (Puede ser en RUTA_1, RUTA_2 o RUTA_3 cuando fue devuelta)
    if (accion === ACCIONES.CORREGIR) {
        const esRuta2 = ESTADOS_RUTA_2.includes(estadoActualCodigo);
        const esRuta3 = estadoActualCodigo === ESTADOS.RUTA_3;
        const esRuta1 = estadoActualCodigo === ESTADOS.RUTA_1;

        if (!esRuta1 && !esRuta2 && !esRuta3) {
            throw new Error('La corrección solo se puede realizar en Ruta 1, 2 o 3.');
        }

        if (!estadoRetornoCorreccion) {
            // Si no hay estado de retorno, asume que va a Ruta 2 por defecto (flujo normal desde Ruta 1)
            return { nuevoEstado: ESTADOS.RUTA_2, esRechazo: false };
        }
        return { nuevoEstado: estadoRetornoCorreccion, esRechazo: false };
    }

    // 3. APROBACIÓN (Flujo Normal)
    if (accion === ACCIONES.APROBAR) {
        // Todos los estados de Ruta 2 avanzan a Ruta 3
        if (ESTADOS_RUTA_2.includes(estadoActualCodigo)) {
            return { nuevoEstado: ESTADOS.RUTA_3, esRechazo: false };
        }

        switch (estadoActualCodigo) {
            case ESTADOS.RUTA_3:
                return { nuevoEstado: ESTADOS.RUTA_4, esRechazo: false };
            case ESTADOS.RUTA_4:
                return { nuevoEstado: ESTADOS.FINALIZADA, esRechazo: false };
            default:
                throw new Error(`Acción APROBAR no permitida en estado ${estadoActualCodigo}`);
        }
    }

    // 4. RECHAZO LINEAL (Devolución a ruta inmediatamente anterior)
    if (accion === ACCIONES.RECHAZAR) {
        let destino;

        // Determinar destino según estado actual (LINEAL: 4→3, 3→2, 2→1)
        if (estadoActualCodigo === ESTADOS.RUTA_4) {
            destino = ESTADOS.RUTA_3;
        } else if (estadoActualCodigo === ESTADOS.RUTA_3) {
            destino = ESTADOS.RUTA_2; // Por defecto, puede ser cualquier Ruta 2
        } else if (ESTADOS_RUTA_2.includes(estadoActualCodigo)) {
            destino = ESTADOS.RUTA_1;
        } else {
            throw new Error('Solo las rutas 2, 3 y 4 pueden rechazar facturas.');
        }

        return {
            nuevoEstado: destino,
            esRechazo: true,
            estadoRetorno: estadoActualCodigo // Guardamos quién rechazó para volver ahí después
        };
    }

    // 5. PAGO (Ruta 4)
    if (accion === ACCIONES.PAGAR) {
        if (estadoActualCodigo !== ESTADOS.RUTA_4) {
            throw new Error('Solo Tesorería (Ruta 4) puede marcar como pagada.');
        }
        return { nuevoEstado: ESTADOS.FINALIZADA, esRechazo: false };
    }

    throw new Error(`Acción ${accion} no reconocida o no válida.`);
};

/**
 * Mapea un código de rol de Ruta 2 a su estado correspondiente
 * @param {string} codigoRol - Código del rol (ej: RUTA_2_CONTROL_INTERNO)
 * @returns {string|null} - Código del estado correspondiente
 */
const mapearRolAEstado = (codigoRol) => {
    const mapeo = {
        'RUTA_2_CONTROL_INTERNO': ESTADOS.RUTA_2_CONTROL_INTERNO,
        'RUTA_2_DIRECCION_MEDICA': ESTADOS.RUTA_2_DIRECCION_MEDICA,
        'RUTA_2_DIRECCION_FINANCIERA': ESTADOS.RUTA_2_DIRECCION_FINANCIERA,
        'RUTA_2_DIRECCION_ADMINISTRATIVA': ESTADOS.RUTA_2_DIRECCION_ADMINISTRATIVA,
        'RUTA_2_DIRECCION_GENERAL': ESTADOS.RUTA_2_DIRECCION_GENERAL,
        'RUTA_2': ESTADOS.RUTA_2 // Legacy
    };

    return mapeo[codigoRol] || null;
};

module.exports = {
    calcularTransicion,
    mapearRolAEstado
};

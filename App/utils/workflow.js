/**
 * Máquina de Estados del Flujo de Facturas
 * Define las transiciones permitidas y la lógica de negocio del workflow.
 */

const ESTADOS = {
    RUTA_1: 'RUTA_1',
    RUTA_2: 'RUTA_2', // Legacy - mantener para compatibilidad
    RUTA_2_CONTROL_INTERNO: 'RUTA_2_CONTROL_INTERNO',
    RUTA_2_DIRECCION_MEDICA: 'RUTA_2_DIRECCION_MEDICA',
    RUTA_2_DIRECCION_FINANCIERA: 'RUTA_2_DIRECCION_FINANCIERA',
    RUTA_2_DIRECCION_ADMINISTRATIVA: 'RUTA_2_DIRECCION_ADMINISTRATIVA',
    RUTA_2_DIRECCION_GENERAL: 'RUTA_2_DIRECCION_GENERAL',
    RUTA_3: 'RUTA_3',
    RUTA_4: 'RUTA_4',
    FINALIZADA: 'FINALIZADA',
    ANULADA: 'ANULADA'
};

const ACCIONES = {
    CARGAR: 'CARGAR',
    APROBAR: 'APROBAR',
    RECHAZAR: 'RECHAZAR',
    CORREGIR: 'CORREGIR',
    ANULAR: 'ANULAR',
    PAGAR: 'PAGAR'
};

/**
 * Obtiene el siguiente estado basado en la acción y el estado actual.
 * @param {string} estadoActualCodigo - Código del estado actual (ej: RUTA_1)
 * @param {string} accion - Acción a realizar (APROBAR, RECHAZAR, etc.)
 * @param {string} [estadoDestinoRechazo] - (Opcional) A qué ruta devolver si es rechazo (ej: RUTA_1)
 * @param {string} [estadoRetornoCorreccion] - (Opcional) A dónde volver tras corregir (ej: RUTA_3)
 */
const calcularTransicion = (estadoActualCodigo, accion, estadoDestinoRechazo = null, estadoRetornoCorreccion = null) => {

    // 1. ANULACIÓN (Solo posible en RUTA_1)
    if (accion === ACCIONES.ANULAR) {
        if (estadoActualCodigo === ESTADOS.RUTA_1) {
            return { nuevoEstado: ESTADOS.ANULADA, esRechazo: false };
        }
        throw new Error('Solo se pueden anular facturas que estén en gestión por el usuario (Ruta 1).');
    }

    // 2. CORRECCIÓN (Solo en RUTA_1 cuando fue devuelta)
    if (accion === ACCIONES.CORREGIR) {
        if (estadoActualCodigo !== ESTADOS.RUTA_1) {
            throw new Error('La corrección solo se realiza en la Ruta 1.');
        }
        if (!estadoRetornoCorreccion) {
            // Si no hay estado de retorno, asume que va a Ruta 2 por defecto (flujo normal)
            return { nuevoEstado: ESTADOS.RUTA_2, esRechazo: false };
        }
        return { nuevoEstado: estadoRetornoCorreccion, esRechazo: false };
    }

    // 3. APROBACIÓN (Flujo Normal)
    if (accion === ACCIONES.APROBAR) {
        // Todos los estados de Ruta 2 avanzan a Ruta 3
        if (estadoActualCodigo === ESTADOS.RUTA_2 ||
            estadoActualCodigo === ESTADOS.RUTA_2_CONTROL_INTERNO ||
            estadoActualCodigo === ESTADOS.RUTA_2_DIRECCION_MEDICA ||
            estadoActualCodigo === ESTADOS.RUTA_2_DIRECCION_FINANCIERA ||
            estadoActualCodigo === ESTADOS.RUTA_2_DIRECCION_ADMINISTRATIVA ||
            estadoActualCodigo === ESTADOS.RUTA_2_DIRECCION_GENERAL) {
            return { nuevoEstado: ESTADOS.RUTA_3, esRechazo: false };
        }

        switch (estadoActualCodigo) {
            case ESTADOS.RUTA_3: return { nuevoEstado: ESTADOS.RUTA_4, esRechazo: false };
            case ESTADOS.RUTA_4: return { nuevoEstado: ESTADOS.FINALIZADA, esRechazo: false };
            default: throw new Error(`Acción APROBAR no permitida en estado ${estadoActualCodigo}`);
        }
    }

    // 4. RECHAZO (Devolución)
    if (accion === ACCIONES.RECHAZAR) {
        // Lista de estados que pueden rechazar
        const estadosRuta2 = [
            ESTADOS.RUTA_2,
            ESTADOS.RUTA_2_CONTROL_INTERNO,
            ESTADOS.RUTA_2_DIRECCION_MEDICA,
            ESTADOS.RUTA_2_DIRECCION_FINANCIERA,
            ESTADOS.RUTA_2_DIRECCION_ADMINISTRATIVA,
            ESTADOS.RUTA_2_DIRECCION_GENERAL
        ];

        if (![...estadosRuta2, ESTADOS.RUTA_3, ESTADOS.RUTA_4].includes(estadoActualCodigo)) {
            throw new Error('Solo las rutas 2, 3 y 4 pueden rechazar facturas.');
        }

        // Si no se especifica destino, por defecto vuelve a RUTA_1
        const destino = estadoDestinoRechazo || ESTADOS.RUTA_1;

        // Validar que el destino sea una ruta inferior
        // Normalizar estados de Ruta 2 para comparación
        const normalizarEstado = (estado) => {
            if (estadosRuta2.includes(estado)) return 'RUTA_2';
            return estado;
        };

        const orden = [ESTADOS.RUTA_1, 'RUTA_2', ESTADOS.RUTA_3, ESTADOS.RUTA_4];
        const idxActual = orden.indexOf(normalizarEstado(estadoActualCodigo));
        const idxDestino = orden.indexOf(normalizarEstado(destino));

        if (idxDestino >= idxActual) {
            throw new Error('Solo se puede devolver la factura a una ruta inferior.');
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
 * @returns {string} - Código del estado correspondiente
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
    ESTADOS,
    ACCIONES,
    calcularTransicion,
    mapearRolAEstado
};

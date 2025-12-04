const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const { ESTADOS, ACCIONES, calcularTransicion } = require('../utils/workflow');

/**
 * Helper para obtener ID de estado por código
 */
const getEstadoIdByCodigo = async (client, codigo) => {
    const res = await client.query('SELECT estado_id FROM estados WHERE codigo = $1', [codigo]);
    if (res.rows.length === 0) throw new Error(`Estado ${codigo} no configurado en BD.`);
    return res.rows[0].estado_id;
};

/**
 * Helper para obtener código de estado por ID
 */
const getEstadoCodigoById = async (client, id) => {
    const res = await client.query('SELECT codigo FROM estados WHERE estado_id = $1', [id]);
    if (res.rows.length === 0) throw new Error(`Estado ID ${id} no encontrado.`);
    return res.rows[0].codigo;
};

/**
 * Crea una nueva factura y guarda el documento inicial
 */
const crearFactura = async (facturaData, file, userId) => {
    const { numero_factura, nit_proveedor, fecha_emision, monto, concepto } = facturaData;
    const client = await db.connect();

    if (!file || !file.filename) {
        throw new Error("Archivo no proporcionado.");
    }

    const UPLOAD_DIR = 'D:\\FacturasClinica';
    const filePath = path.join(UPLOAD_DIR, file.filename);

    try {
        await client.query('BEGIN');

        // 1. Validar Proveedor
        const proveedorRes = await client.query('SELECT proveedor_id FROM proveedores WHERE nit = $1', [nit_proveedor]);
        if (proveedorRes.rows.length === 0) throw new Error(`El proveedor con NIT ${nit_proveedor} no existe en la base de datos.`);
        const proveedorId = proveedorRes.rows[0].proveedor_id;

        // 2. Determinar Estado Inicial (RUTA_2)
        const estadoInicialId = await getEstadoIdByCodigo(client, ESTADOS.RUTA_2);

        // 3. Obtener Ruta ID (RUTA_1)
        const ruta1Res = await client.query("SELECT rol_id FROM roles WHERE codigo = 'RUTA_1'");
        const rutaId = ruta1Res.rows[0].rol_id;

        // 4. Insertar Factura
        const insertQuery = `
            INSERT INTO facturas (
                numero_factura, proveedor_id, fecha_emision, monto, 
                ruta_id, estado_id, usuario_creacion_id, concepto, 
                documento_path, documento_nombre
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING factura_id, numero_factura;
        `;

        const values = [
            numero_factura, proveedorId, fecha_emision, monto,
            rutaId, estadoInicialId, userId, concepto,
            filePath, file.filename
        ];

        const res = await client.query(insertQuery, values);
        const nuevaFactura = res.rows[0];

        // 5. Guardar documento inicial en factura_documentos
        await client.query(`
            INSERT INTO factura_documentos (
                factura_id, tipo_documento, nombre_archivo, nombre_personalizado,
                ruta_archivo, usuario_carga_id, observacion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            nuevaFactura.factura_id,
            'SOPORTE_INICIAL',
            file.filename,
            file.originalname || 'Documento inicial',
            filePath,
            userId,
            'Documento soporte inicial de la factura'
        ]);

        // 6. Registrar Historial
        await client.query(`
            INSERT INTO factura_historial (factura_id, estado_nuevo_id, usuario_id, accion, observacion)
            VALUES ($1, $2, $3, $4, $5)
        `, [nuevaFactura.factura_id, estadoInicialId, userId, ACCIONES.CARGAR, 'Carga inicial de factura']);

        await client.query('COMMIT');
        return nuevaFactura;

    } catch (error) {
        await client.query('ROLLBACK');
        if (file && fs.existsSync(filePath)) fs.unlinkSync(filePath);

        if (error.code === '23505') {
            throw new Error('Ya existe una factura activa con este número para este proveedor.');
        }
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Gestiona el flujo de la factura (Aprobar, Rechazar, Corregir, Anular, Pagar)
 */
const procesarFactura = async (facturaId, accion, userId, datosAdicionales = {}) => {
    const { observacion, estadoDestinoRechazoCodigo } = datosAdicionales;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener estado actual
        const facturaRes = await client.query(`
            SELECT f.*, e.codigo as estado_codigo 
            FROM facturas f 
            JOIN estados e ON f.estado_id = e.estado_id 
            WHERE f.factura_id = $1
        `, [facturaId]);

        if (facturaRes.rows.length === 0) throw new Error('La factura no fue encontrada.');
        const factura = facturaRes.rows[0];

        // Si es PAGAR, validar evidencia de pago
        if (accion === ACCIONES.PAGAR) {
            const validacion = await validarEvidenciaPago(facturaId, userId);
            if (validacion.requerida && !validacion.existe) {
                throw new Error('Debe subir la evidencia de pago antes de marcar como pagada.');
            }
        }

        // 2. Calcular Transición
        let estadoRetornoCorreccionCodigo = null;
        if (accion === ACCIONES.CORREGIR && factura.estado_retorno_id) {
            estadoRetornoCorreccionCodigo = await getEstadoCodigoById(client, factura.estado_retorno_id);
        }

        const transicion = calcularTransicion(
            factura.estado_codigo,
            accion,
            estadoDestinoRechazoCodigo,
            estadoRetornoCorreccionCodigo
        );

        const nuevoEstadoId = await getEstadoIdByCodigo(client, transicion.nuevoEstado);

        // 3. Actualizar Factura
        let updateQuery = `
            UPDATE facturas 
            SET estado_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP
        `;
        const updateParams = [nuevoEstadoId];
        let paramCount = 2;

        if (transicion.esRechazo) {
            const estadoRetornoId = await getEstadoIdByCodigo(client, transicion.estadoRetorno);
            updateQuery += `, estado_retorno_id = $${paramCount}`;
            updateParams.push(estadoRetornoId);
            paramCount++;
        } else if (accion === ACCIONES.CORREGIR) {
            updateQuery += `, estado_retorno_id = NULL`;
        } else if (accion === ACCIONES.ANULAR) {
            updateQuery += `, is_anulada = TRUE`;
        }

        updateQuery += ` WHERE factura_id = $${paramCount}`;
        updateParams.push(facturaId);

        await client.query(updateQuery, updateParams);

        // 4. Registrar Historial
        await client.query(`
            INSERT INTO factura_historial (
                factura_id, estado_anterior_id, estado_nuevo_id, 
                usuario_id, accion, observacion
            )
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            facturaId,
            factura.estado_id,
            nuevoEstadoId,
            userId,
            accion,
            observacion || 'Sin observación'
        ]);

        await client.query('COMMIT');
        return { mensaje: 'Proceso exitoso', nuevoEstado: transicion.nuevoEstado };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Agregar documento a una factura existente
 */
const agregarDocumento = async (facturaId, archivo, tipoDocumento, nombrePersonalizado, userId, observacion = null) => {
    const client = await db.connect();
    const UPLOAD_DIR = 'D:\\FacturasClinica';
    const filePath = path.join(UPLOAD_DIR, archivo.filename);

    try {
        await client.query('BEGIN');

        // Verificar que la factura existe
        const facturaCheck = await client.query(
            'SELECT factura_id, usuario_creacion_id FROM facturas WHERE factura_id = $1',
            [facturaId]
        );

        if (facturaCheck.rows.length === 0) {
            throw new Error('Factura no encontrada.');
        }

        const factura = facturaCheck.rows[0];

        // Validar permisos según tipo de documento
        if (tipoDocumento === 'DOCUMENTO_ADICIONAL') {
            if (factura.usuario_creacion_id !== userId) {
                throw new Error('Solo el creador de la factura puede agregar documentos adicionales.');
            }
        } else if (tipoDocumento === 'EVIDENCIA_PAGO') {
            const rolesCheck = await client.query(`
                SELECT r.codigo FROM usuario_roles ur
                JOIN roles r ON ur.rol_id = r.rol_id
                WHERE ur.usuario_id = $1 AND r.codigo = 'RUTA_4'
            `, [userId]);

            if (rolesCheck.rows.length === 0) {
                throw new Error('Solo usuarios de Tesorería (Ruta 4) pueden subir evidencia de pago.');
            }
        }

        // Insertar documento
        const insertQuery = `
            INSERT INTO factura_documentos (
                factura_id, tipo_documento, nombre_archivo, nombre_personalizado,
                ruta_archivo, usuario_carga_id, observacion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING documento_id, nombre_archivo, nombre_personalizado, fecha_carga
        `;

        const result = await client.query(insertQuery, [
            facturaId,
            tipoDocumento,
            archivo.filename,
            nombrePersonalizado || archivo.originalname,
            filePath,
            userId,
            observacion
        ]);

        await client.query('COMMIT');
        return result.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        if (archivo && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Listar documentos de una factura
 */
const listarDocumentos = async (facturaId) => {
    const client = await db.connect();
    try {
        const query = `
            SELECT 
                fd.documento_id, fd.tipo_documento, fd.nombre_archivo,
                fd.nombre_personalizado, fd.fecha_carga, fd.observacion,
                u.nombre as usuario_carga_nombre
            FROM factura_documentos fd
            JOIN usuarios u ON fd.usuario_carga_id = u.usuario_id
            WHERE fd.factura_id = $1
            ORDER BY fd.fecha_carga DESC
        `;
        const result = await client.query(query, [facturaId]);
        return result.rows;
        const client = await db.connect();
        try {
            const userQuery = `SELECT requiere_evidencia_pago FROM usuarios WHERE usuario_id = $1`;
            const userResult = await client.query(userQuery, [userId]);

            if (userResult.rows.length === 0 || !userResult.rows[0].requiere_evidencia_pago) {
                return { requerida: false, existe: true };
            }

            const evidenciaQuery = `
            SELECT documento_id FROM factura_documentos
            WHERE factura_id = $1 AND tipo_documento = 'EVIDENCIA_PAGO'
        `;
            const evidenciaResult = await client.query(evidenciaQuery, [facturaId]);

            return {
                requerida: true,
                existe: evidenciaResult.rows.length > 0
            };

        } finally {
            client.release();
        }
    };

    /**
     * Listar facturas con filtros
     */
    const listarFacturas = async (filtros, userId) => {
        const client = await db.connect();
        try {
            let query = `
            SELECT 
                f.factura_id, f.numero_factura, f.fecha_emision, f.monto, f.concepto,
                f.documento_nombre, f.is_anulada,
                p.nombre AS proveedor_nombre,
                e.nombre AS estado_nombre, e.codigo AS estado_codigo,
                u.nombre AS usuario_creacion_nombre
            FROM facturas f
            JOIN proveedores p ON f.proveedor_id = p.proveedor_id
            JOIN estados e ON f.estado_id = e.estado_id
            JOIN usuarios u ON f.usuario_creacion_id = u.usuario_id
            WHERE 1=1
        `;
            const params = [];
            let pCount = 1;

            if (filtros.busqueda) {
                query += ` AND (f.numero_factura ILIKE $${pCount} OR p.nombre ILIKE $${pCount})`;
                params.push(`%${filtros.busqueda}%`);
                pCount++;
            }

            query += ` ORDER BY f.fecha_actualizacion DESC`;

            const res = await client.query(query, params);
            return res.rows;
        } finally {
            client.release();
        }
    };

    const obtenerFacturaPorId = async (id) => {
        const client = await db.connect();
        try {
            const res = await client.query(`
            SELECT f.*, p.nombre as proveedor_nombre, e.nombre as estado_nombre, e.codigo as estado_codigo
            FROM facturas f
            JOIN proveedores p ON f.proveedor_id = p.proveedor_id
            JOIN estados e ON f.estado_id = e.estado_id
            WHERE f.factura_id = $1
        `, [id]);
            return res.rows[0];
        } finally {
            client.release();
        }
    };

    const obtenerHistorialFactura = async (id) => {
        const client = await db.connect();
        try {
            const res = await client.query(`
            SELECT h.*, u.nombre as usuario_nombre, ea.nombre as estado_anterior, en.nombre as estado_nuevo
            FROM factura_historial h
            JOIN usuarios u ON h.usuario_id = u.usuario_id
            LEFT JOIN estados ea ON h.estado_anterior_id = ea.estado_id
            JOIN estados en ON h.estado_nuevo_id = en.estado_id
            WHERE h.factura_id = $1
            ORDER BY h.fecha_transicion DESC
        `, [id]);
            return res.rows;
        } finally {
            client.release();
        }
    };

    const obtenerEstadisticas = async () => {
        const client = await db.connect();
        try {
            const res = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN estado_id = (SELECT estado_id FROM estados WHERE codigo='FINALIZADA') THEN 1 END) as finalizadas,
                COUNT(CASE WHEN is_anulada = TRUE THEN 1 END) as anuladas
            FROM facturas
        `);
            return res.rows[0];
        } finally {
            client.release();
        }
    };

    module.exports = {
        crearFactura,
        procesarFactura,
        listarFacturas,
        obtenerFacturaPorId,
        obtenerHistorialFactura,
        obtenerEstadisticas,
        agregarDocumento,
        listarDocumentos,
        eliminarDocumento,
        validarEvidenciaPago
    };
const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const { ESTADOS, ACCIONES } = require('../constants');
const { calcularTransicion } = require('../utils/workflow');

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
 * Crea una nueva factura y guarda el documento inicial (Legacy - un solo archivo)
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
        const proveedorRes = await client.query('SELECT id FROM proveedores WHERE nit = $1', [nit_proveedor]);
        if (proveedorRes.rows.length === 0) throw new Error(`El proveedor con NIT ${nit_proveedor} no existe en la base de datos.`);
        const proveedorId = proveedorRes.rows[0].id;

        // 2. Determinar Estado Inicial (RUTA_2)
        const estadoInicialId = await getEstadoIdByCodigo(client, ESTADOS.RUTA_2);

        // 3. Obtener Ruta ID (RUTA_1)
        const ruta1Res = await client.query("SELECT rol_id FROM roles WHERE codigo = 'RUTA_1'");
        if (ruta1Res.rows.length === 0) throw new Error("Rol RUTA_1 no configurado.");
        const rutaId = ruta1Res.rows[0].rol_id;

        // 4. Insertar Factura
        const insertQuery = `
            INSERT INTO facturas (
                numero_factura, proveedor_id, fecha_emision, monto, concepto,
                estado_id, usuario_creacion_id, ruta_id, documento_nombre
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING factura_id, numero_factura, fecha_emision, monto
        `;

        const nuevaFactura = (await client.query(insertQuery, [
            numero_factura, proveedorId, fecha_emision, monto, concepto || null,
            estadoInicialId, userId, rutaId, file.filename
        ])).rows[0];

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
 * Crea una nueva factura con múltiples archivos iniciales
 */
const crearFacturaConMultiplesArchivos = async (facturaData, files, tiposDocumento, userId, rolAprobadorRuta2 = null) => {
    const { numero_factura, nit_proveedor, fecha_emision, monto, concepto } = facturaData;
    const client = await db.connect();
    const UPLOAD_DIR = 'D:\\FacturasClinica';
    const { mapearRolAEstado } = require('../utils/workflow');

    try {
        await client.query('BEGIN');

        // 1. Validar Proveedor
        const proveedorRes = await client.query('SELECT id FROM proveedores WHERE nit = $1', [nit_proveedor]);
        if (proveedorRes.rows.length === 0) throw new Error(`El proveedor con NIT ${nit_proveedor} no existe en la base de datos.`);
        const proveedorId = proveedorRes.rows[0].id;

        // 2. Determinar Estado Inicial basado en el rol de Ruta 2
        let estadoInicialCodigo = ESTADOS.RUTA_2; // Por defecto (legacy)

        if (rolAprobadorRuta2) {
            // Usar el rol directamente para mapear al estado
            const estadoMapeado = mapearRolAEstado(rolAprobadorRuta2);

            if (estadoMapeado) {
                estadoInicialCodigo = estadoMapeado;
            }
        }

        const estadoInicialId = await getEstadoIdByCodigo(client, estadoInicialCodigo);

        // 3. Obtener Ruta ID (RUTA_1)
        const ruta1Res = await client.query("SELECT rol_id FROM roles WHERE codigo = 'RUTA_1'");
        if (ruta1Res.rows.length === 0) throw new Error("Rol RUTA_1 no configurado.");
        const rutaId = ruta1Res.rows[0].rol_id;

        // 4. Encontrar el primer archivo tipo FACTURA para referencia principal
        const indexFactura = tiposDocumento.findIndex(tipo => tipo === 'FACTURA');
        const archivoFactura = indexFactura !== -1 ? files[indexFactura] : files[0];

        // 5. Insertar Factura (con rol_aprobador_ruta2)
        const insertQuery = `
            INSERT INTO facturas (
                numero_factura, proveedor_id, fecha_emision, monto, concepto,
                estado_id, usuario_creacion_id, ruta_id, documento_nombre,
                rol_aprobador_ruta2
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING factura_id, numero_factura, fecha_emision, monto
        `;

        const nuevaFactura = (await client.query(insertQuery, [
            numero_factura, proveedorId, fecha_emision, monto, concepto || null,
            estadoInicialId, userId, rutaId, archivoFactura.filename,
            rolAprobadorRuta2
        ])).rows[0];

        // 6. Guardar TODOS los archivos en factura_documentos
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const tipo = tiposDocumento[i];
            const filePath = path.join(UPLOAD_DIR, file.filename);

            await client.query(`
                INSERT INTO factura_documentos (
                    factura_id, tipo_documento, nombre_archivo, nombre_personalizado,
                    ruta_archivo, usuario_carga_id, observacion
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                nuevaFactura.factura_id,
                tipo,
                file.filename,
                file.originalname,
                filePath,
                userId,
                `Documento ${tipo} - Carga inicial`
            ]);
        }

        // 7. Registrar Historial
        await client.query(`
            INSERT INTO factura_historial (factura_id, estado_nuevo_id, usuario_id, accion, observacion)
            VALUES ($1, $2, $3, $4, $5)
        `, [nuevaFactura.factura_id, estadoInicialId, userId, ACCIONES.CARGAR, `Carga inicial con ${files.length} documentos`]);

        await client.query('COMMIT');
        return nuevaFactura;

    } catch (error) {
        await client.query('ROLLBACK');

        // Limpiar archivos si falla
        if (files && files.length > 0) {
            files.forEach(file => {
                const filePath = path.join(UPLOAD_DIR, file.filename);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (e) {
                        console.error('Error eliminando archivo tras rollback:', e);
                    }
                }
            });
        }

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
    const { observacion } = datosAdicionales;
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

        // 2. Calcular Transición (sin estadoDestinoRechazo, ahora es automático)
        let estadoRetornoCorreccionCodigo = null;
        if (accion === ACCIONES.CORREGIR && factura.estado_retorno_id) {
            estadoRetornoCorreccionCodigo = await getEstadoCodigoById(client, factura.estado_retorno_id);
        }

        const transicion = calcularTransicion(
            factura.estado_codigo,
            accion,
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
 * Permite evidencia de pago en Ruta 4 y documentos de soporte en Ruta 3
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
        if (tipoDocumento === 'EVIDENCIA_PAGO') {
            // Solo usuarios de Ruta 4 pueden subir evidencia de pago
            const rolesCheck = await client.query(`
                SELECT r.codigo FROM usuario_roles ur
                JOIN roles r ON ur.rol_id = r.rol_id
                WHERE ur.usuario_id = $1 AND r.codigo = 'RUTA_4'
            `, [userId]);

            if (rolesCheck.rows.length === 0) {
                throw new Error('Solo usuarios de Tesorería (Ruta 4) pueden subir evidencia de pago.');
            }
        } else if (tipoDocumento === 'SOPORTE') {
            // Solo usuarios de Ruta 3 pueden subir documentos de soporte
            const rolesCheck = await client.query(`
                SELECT r.codigo FROM usuario_roles ur
                JOIN roles r ON ur.rol_id = r.rol_id
                WHERE ur.usuario_id = $1 AND r.codigo = 'RUTA_3'
            `, [userId]);

            if (rolesCheck.rows.length === 0) {
                throw new Error('Solo usuarios de Contabilidad (Ruta 3) pueden subir documentos de soporte.');
            }
        } else {
            // Otros tipos de documentos no están permitidos después de la carga inicial
            throw new Error('No se pueden agregar documentos de este tipo después de la carga inicial.');
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
    } finally {
        client.release();
    }
};

/**
 * Eliminar un documento
 * Solo SUPER_ADMIN puede eliminar documentos
 */
const eliminarDocumento = async (documentoId, userId) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Verificar que es SUPER_ADMIN
        const rolesCheck = await client.query(`
            SELECT r.codigo FROM usuario_roles ur
            JOIN roles r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = $1 AND r.codigo = 'SUPER_ADMIN'
        `, [userId]);

        if (rolesCheck.rows.length === 0) {
            throw new Error('Solo SUPER_ADMIN puede eliminar documentos.');
        }

        // Obtener ruta del archivo y tipo
        const docRes = await client.query(
            'SELECT ruta_archivo, tipo_documento FROM factura_documentos WHERE documento_id = $1',
            [documentoId]
        );

        if (docRes.rows.length === 0) {
            throw new Error('Documento no encontrado.');
        }

        const doc = docRes.rows[0];

        // No permitir eliminar SOPORTE_INICIAL
        if (doc.tipo_documento === 'SOPORTE_INICIAL') {
            throw new Error('No se puede eliminar el documento de soporte inicial.');
        }

        // Eliminar registro
        await client.query('DELETE FROM factura_documentos WHERE documento_id = $1', [documentoId]);

        // Eliminar archivo físico
        if (fs.existsSync(doc.ruta_archivo)) {
            fs.unlinkSync(doc.ruta_archivo);
        }

        await client.query('COMMIT');
        return { mensaje: 'Documento eliminado exitosamente' };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Eliminar una factura completa
 * Solo SUPER_ADMIN puede eliminar facturas
 */
const eliminarFactura = async (facturaId, userId) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Verificar que es SUPER_ADMIN
        const rolesCheck = await client.query(`
            SELECT r.codigo FROM usuario_roles ur
            JOIN roles r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = $1 AND r.codigo = 'SUPER_ADMIN'
        `, [userId]);

        if (rolesCheck.rows.length === 0) {
            throw new Error('Solo SUPER_ADMIN puede eliminar facturas.');
        }

        // Obtener y eliminar archivos físicos
        const docs = await client.query(
            'SELECT ruta_archivo FROM factura_documentos WHERE factura_id = $1',
            [facturaId]
        );

        for (const doc of docs.rows) {
            if (fs.existsSync(doc.ruta_archivo)) {
                fs.unlinkSync(doc.ruta_archivo);
            }
        }

        // Eliminar registros en orden
        await client.query('DELETE FROM factura_documentos WHERE factura_id = $1', [facturaId]);
        await client.query('DELETE FROM factura_historial WHERE factura_id = $1', [facturaId]);
        await client.query('DELETE FROM facturas WHERE factura_id = $1', [facturaId]);

        await client.query('COMMIT');
        return { mensaje: 'Factura eliminada exitosamente' };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Validar si existe evidencia de pago para una factura
 */
const validarEvidenciaPago = async (facturaId, userId) => {
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
 * Listar facturas con filtros y permisos por rol
 */
const listarFacturas = async (filtros, userId) => {
    const client = await db.connect();
    try {
        // Obtener roles del usuario
        const rolesRes = await client.query(`
            SELECT r.codigo FROM usuario_roles ur
            JOIN roles r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = $1
        `, [userId]);

        const roles = rolesRes.rows.map(r => r.codigo);

        let query = `
            SELECT 
                f.factura_id, f.numero_factura, f.fecha_emision, f.monto, f.concepto,
                f.documento_nombre, f.is_anulada, f.rol_aprobador_ruta2,
                p.nombre AS proveedor_nombre,
                e.nombre AS estado_nombre, e.codigo AS estado_codigo,
                u.nombre AS usuario_creacion_nombre
            FROM facturas f
            JOIN proveedores p ON f.proveedor_id = p.id
            JOIN estados e ON f.estado_id = e.estado_id
            JOIN usuarios u ON f.usuario_creacion_id = u.usuario_id
            WHERE 1=1
        `;
        const params = [];
        let pCount = 1;

        // Filtrar según rol
        if (roles.includes('SUPER_ADMIN')) {
            // SUPER_ADMIN ve todas las facturas
        } else if (roles.includes('RUTA_1') && !roles.some(r => r !== 'RUTA_1' && r !== 'SUPER_ADMIN')) {
            // RUTA_1 solo ve las facturas que él mismo creó
            query += ` AND f.usuario_creacion_id = $${pCount}`;
            params.push(userId);
            pCount++;
        } else {
            // Construir condiciones para cada rol que tenga el usuario
            const conditions = [];

            // Roles de Ruta 2 especializados
            const rolesRuta2 = [
                'RUTA_2',
                'RUTA_2_CONTROL_INTERNO',
                'RUTA_2_DIRECCION_MEDICA',
                'RUTA_2_DIRECCION_FINANCIERA',
                'RUTA_2_DIRECCION_ADMINISTRATIVA',
                'RUTA_2_DIRECCION_GENERAL'
            ];

            // Obtener los roles de Ruta 2 que tiene el usuario
            const rolesRuta2Usuario = roles.filter(rol => rolesRuta2.includes(rol));

            // Si tiene rol de Ruta 2
            if (rolesRuta2Usuario.length > 0) {
                // Filtrar por estados de Ruta 2 donde el rol_aprobador_ruta2 coincida con alguno de sus roles
                const rolesPlaceholders = rolesRuta2Usuario.map((rol, index) => {
                    params.push(rol);
                    return `$${pCount + index}`;
                }).join(', ');

                conditions.push(`(
                    e.codigo IN (
                        'RUTA_2',
                        'RUTA_2_CONTROL_INTERNO',
                        'RUTA_2_DIRECCION_MEDICA',
                        'RUTA_2_DIRECCION_FINANCIERA',
                        'RUTA_2_DIRECCION_ADMINISTRATIVA',
                        'RUTA_2_DIRECCION_GENERAL'
                    )
                    AND (f.rol_aprobador_ruta2 IN (${rolesPlaceholders}) OR f.rol_aprobador_ruta2 IS NULL)
                )`);
                pCount += rolesRuta2Usuario.length;
            }

            // Si tiene rol de Ruta 3
            if (roles.includes('RUTA_3')) {
                conditions.push(`e.codigo = 'RUTA_3'`);
            }

            // Si tiene rol de Ruta 4 - EXCLUIR facturas FINALIZADAS de la lista reciente
            if (roles.includes('RUTA_4')) {
                conditions.push(`e.codigo = 'RUTA_4'`);
            }

            // Aplicar condiciones con OR
            if (conditions.length > 0) {
                query += ` AND (${conditions.join(' OR ')})`;
            }
        }

        // IMPORTANTE: Excluir facturas FINALIZADAS para usuarios de Ruta 4 (solo en lista reciente)
        // Las facturas finalizadas solo se verán en búsqueda avanzada
        if (roles.includes('RUTA_4') && !roles.includes('SUPER_ADMIN')) {
            query += ` AND e.codigo != 'FINALIZADA'`;
        }

        // Filtro de estado (para Route 1 principalmente)
        if (filtros.estado_codigo) {
            query += ` AND e.codigo = $${pCount}`;
            params.push(filtros.estado_codigo);
            pCount++;
        }

        // Filtro de búsqueda general (legacy)
        if (filtros.busqueda) {
            query += ` AND (f.numero_factura ILIKE $${pCount} OR p.nombre ILIKE $${pCount})`;
            params.push(`%${filtros.busqueda}%`);
            pCount++;
        }

        // Filtros específicos
        if (filtros.numero_factura) {
            query += ` AND f.numero_factura ILIKE $${pCount}`;
            params.push(`%${filtros.numero_factura}%`);
            pCount++;
        }

        if (filtros.nit) {
            query += ` AND p.nit ILIKE $${pCount}`;
            params.push(`%${filtros.nit}%`);
            pCount++;
        }

        if (filtros.proveedor) {
            query += ` AND p.nombre ILIKE $${pCount}`;
            params.push(`%${filtros.proveedor}%`);
            pCount++;
        }

        // Filtro por estado (para usuarios Ruta 1)
        if (filtros.estado_codigo) {
            query += ` AND e.codigo = $${pCount}`;
            params.push(filtros.estado_codigo);
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
            SELECT f.*, p.nombre as proveedor_nombre, p.nit as nit_proveedor, e.nombre as estado_nombre, e.codigo as estado_codigo
            FROM facturas f
            JOIN proveedores p ON f.proveedor_id = p.id
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
            SELECT h.*, u.nombre as usuario_nombre, u.cargo as usuario_cargo, u.area as usuario_area, ea.nombre as estado_anterior, en.nombre as estado_nuevo
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

/**
 * Búsqueda avanzada de facturas con múltiples filtros
 */
const busquedaAvanzada = async (filtros, userId) => {
    const client = await db.connect();
    try {
        // Verificar que el usuario tenga permiso de búsqueda
        const rolesRes = await client.query(`
            SELECT r.codigo FROM usuario_roles ur
            JOIN roles r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = $1
        `, [userId]);

        const roles = rolesRes.rows.map(r => r.codigo);

        // Solo SUPER_ADMIN y BUSQUEDA_FACTURAS pueden usar búsqueda avanzada
        if (!roles.includes('SUPER_ADMIN') && !roles.includes('BUSQUEDA_FACTURAS')) {
            throw new Error('No tienes permisos para realizar búsquedas avanzadas');
        }

        let query = `
            SELECT 
                f.factura_id, f.numero_factura, f.fecha_emision, f.fecha_creacion,
                f.monto, f.concepto, f.documento_nombre, f.is_anulada,
                p.nombre AS proveedor_nombre, p.nit AS nit_proveedor,
                e.nombre AS estado_nombre, e.codigo AS estado_codigo,
                u.nombre AS usuario_creacion_nombre, u.email AS usuario_creacion_email
            FROM facturas f
            JOIN proveedores p ON f.proveedor_id = p.id
            JOIN estados e ON f.estado_id = e.estado_id
            JOIN usuarios u ON f.usuario_creacion_id = u.usuario_id
            WHERE 1=1
        `;

        const params = [];
        let pCount = 1;

        // Filtro por fecha de cargue (rango)
        if (filtros.fecha_desde) {
            query += ` AND f.fecha_creacion >= $${pCount}`;
            params.push(filtros.fecha_desde);
            pCount++;
        }

        if (filtros.fecha_hasta) {
            query += ` AND f.fecha_creacion <= $${pCount}`;
            params.push(filtros.fecha_hasta + ' 23:59:59'); // Incluir todo el día
            pCount++;
        }

        // Filtro por NIT del proveedor
        if (filtros.nit) {
            query += ` AND p.nit ILIKE $${pCount}`;
            params.push(`%${filtros.nit}%`);
            pCount++;
        }

        // Filtro por nombre del proveedor
        if (filtros.proveedor) {
            query += ` AND p.nombre ILIKE $${pCount}`;
            params.push(`%${filtros.proveedor}%`);
            pCount++;
        }

        // Filtro por usuario que cargó
        if (filtros.usuario) {
            query += ` AND u.nombre ILIKE $${pCount}`;
            params.push(`%${filtros.usuario}%`);
            pCount++;
        }

        // Filtro por número de factura
        if (filtros.numero_factura) {
            query += ` AND f.numero_factura ILIKE $${pCount}`;
            params.push(`%${filtros.numero_factura}%`);
            pCount++;
        }

        // Filtro por monto mayor a 2 millones
        if (filtros.monto_mayor_2m === 'true' || filtros.monto_mayor_2m === true) {
            query += ` AND f.monto > 2000000`;
        }

        // Filtro por estado
        if (filtros.estado) {
            query += ` AND e.codigo = $${pCount}`;
            params.push(filtros.estado);
            pCount++;
        }

        // Ordenar por fecha de creación descendente
        query += ` ORDER BY f.fecha_creacion DESC`;

        // Limitar resultados (opcional)
        if (filtros.limite) {
            query += ` LIMIT $${pCount}`;
            params.push(parseInt(filtros.limite));
            pCount++;
        }

        const res = await client.query(query, params);
        return res.rows;
    } finally {
        client.release();
    }
};

/**
 * Contar facturas pendientes de aprobación para el usuario
 */
const contarFacturasPendientes = async (userId) => {
    const client = await db.connect();
    try {
        // Obtener roles del usuario
        const rolesRes = await client.query(`
            SELECT r.codigo FROM usuario_roles ur
            JOIN roles r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = $1
        `, [userId]);

        const roles = rolesRes.rows.map(r => r.codigo);

        // Si es SUPER_ADMIN, no mostrar notificaciones (ve todo)
        if (roles.includes('SUPER_ADMIN')) {
            return 0;
        }

        let query = `
            SELECT COUNT(*) as total
            FROM facturas f
            JOIN estados e ON f.estado_id = e.estado_id
            WHERE f.is_anulada = FALSE
        `;

        const params = [];
        let pCount = 1;

        const conditions = [];

        // Roles de Ruta 2 especializados
        const rolesRuta2 = [
            'RUTA_2',
            'RUTA_2_CONTROL_INTERNO',
            'RUTA_2_DIRECCION_MEDICA',
            'RUTA_2_DIRECCION_FINANCIERA',
            'RUTA_2_DIRECCION_ADMINISTRATIVA',
            'RUTA_2_DIRECCION_GENERAL'
        ];

        const rolesRuta2Usuario = roles.filter(rol => rolesRuta2.includes(rol));

        if (rolesRuta2Usuario.length > 0) {
            const rolesPlaceholders = rolesRuta2Usuario.map((rol, index) => {
                params.push(rol);
                return `$${pCount + index}`;
            }).join(', ');

            conditions.push(`(
                e.codigo IN (
                    'RUTA_2',
                    'RUTA_2_CONTROL_INTERNO',
                    'RUTA_2_DIRECCION_MEDICA',
                    'RUTA_2_DIRECCION_FINANCIERA',
                    'RUTA_2_DIRECCION_ADMINISTRATIVA',
                    'RUTA_2_DIRECCION_GENERAL'
                )
                AND (f.rol_aprobador_ruta2 IN (${rolesPlaceholders}) OR f.rol_aprobador_ruta2 IS NULL)
            )`);
            pCount += rolesRuta2Usuario.length;
        }

        if (roles.includes('RUTA_3')) {
            conditions.push(`e.codigo = 'RUTA_3'`);
        }

        if (roles.includes('RUTA_4')) {
            conditions.push(`e.codigo = 'RUTA_4'`);
        }

        if (conditions.length > 0) {
            query += ` AND (${conditions.join(' OR ')})`;
        } else {
            // Si no tiene roles de aprobación, retornar 0
            return 0;
        }

        const res = await client.query(query, params);
        return parseInt(res.rows[0].total) || 0;
    } finally {
        client.release();
    }
};

/**
 * Corregir datos de factura (Solo Ruta 1)
 * Permite editar número, proveedor, fecha, monto y concepto
 */
const corregirFacturaRuta1 = async (facturaId, datosActualizados, userId) => {
    const { numero_factura, nit_proveedor, fecha_emision, monto, concepto } = datosActualizados;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar que la factura existe y obtener estado
        const facturaRes = await client.query(`
            SELECT f.*, e.codigo as estado_codigo
            FROM facturas f
            JOIN estados e ON f.estado_id = e.estado_id
            WHERE f.factura_id = $1
        `, [facturaId]);

        if (facturaRes.rows.length === 0) {
            throw new Error('Factura no encontrada.');
        }

        const factura = facturaRes.rows[0];

        // 2. Validar que está en RUTA_1
        if (factura.estado_codigo !== 'RUTA_1') {
            throw new Error('Solo se pueden editar facturas que estén en Ruta 1.');
        }

        // 3. Validar que el usuario es el creador
        if (factura.usuario_creacion_id !== userId) {
            throw new Error('Solo el usuario que creó la factura puede editarla.');
        }

        // 4. Validar que fue rechazada (tiene estado_retorno_id)
        if (!factura.estado_retorno_id) {
            throw new Error('Solo se pueden editar facturas que fueron devueltas para corrección.');
        }

        // 5. Validar proveedor si se cambió
        let proveedorId = factura.proveedor_id;
        if (nit_proveedor && nit_proveedor !== factura.nit_proveedor) {
            const proveedorRes = await client.query(
                'SELECT id FROM proveedores WHERE nit = $1',
                [nit_proveedor]
            );
            if (proveedorRes.rows.length === 0) {
                throw new Error(`El proveedor con NIT ${nit_proveedor} no existe.`);
            }
            proveedorId = proveedorRes.rows[0].id;
        }

        // 6. Actualizar factura
        const updateQuery = `
            UPDATE facturas
            SET numero_factura = $1,
                proveedor_id = $2,
                fecha_emision = $3,
                monto = $4,
                concepto = $5,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE factura_id = $6
            RETURNING factura_id, numero_factura, fecha_emision, monto, concepto
        `;

        const result = await client.query(updateQuery, [
            numero_factura || factura.numero_factura,
            proveedorId,
            fecha_emision || factura.fecha_emision,
            monto || factura.monto,
            concepto !== undefined ? concepto : factura.concepto,
            facturaId
        ]);

        // 7. Registrar en historial
        await client.query(`
            INSERT INTO factura_historial (
                factura_id, estado_anterior_id, estado_nuevo_id,
                usuario_id, accion, observacion
            )
            VALUES ($1, $2, $2, $3, $4, $5)
        `, [
            facturaId,
            factura.estado_id,
            userId,
            'EDITAR',
            'Datos de factura actualizados durante corrección'
        ]);

        await client.query('COMMIT');
        return result.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Eliminar documento durante corrección (Solo Ruta 1)
 */
const eliminarDocumentoRuta1 = async (documentoId, facturaId, userId) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar que la factura está en RUTA_1 y fue rechazada
        const facturaRes = await client.query(`
            SELECT f.*, e.codigo as estado_codigo
            FROM facturas f
            JOIN estados e ON f.estado_id = e.estado_id
            WHERE f.factura_id = $1
        `, [facturaId]);

        if (facturaRes.rows.length === 0) {
            throw new Error('Factura no encontrada.');
        }

        const factura = facturaRes.rows[0];

        if (factura.estado_codigo !== 'RUTA_1') {
            throw new Error('Solo se pueden eliminar documentos de facturas en Ruta 1.');
        }

        if (factura.usuario_creacion_id !== userId) {
            throw new Error('Solo el creador de la factura puede eliminar documentos.');
        }

        if (!factura.estado_retorno_id) {
            throw new Error('Solo se pueden eliminar documentos de facturas devueltas para corrección.');
        }

        // 2. Obtener documento
        const docRes = await client.query(
            'SELECT * FROM factura_documentos WHERE documento_id = $1 AND factura_id = $2',
            [documentoId, facturaId]
        );

        if (docRes.rows.length === 0) {
            throw new Error('Documento no encontrado.');
        }

        const doc = docRes.rows[0];

        // 3. PERMITIR eliminar cualquier tipo de documento durante corrección en RUTA_1
        // (Comentado: restricción removida según requerimiento del usuario)
        // if (doc.tipo_documento === 'SOPORTE_INICIAL' || doc.tipo_documento === 'FACTURA') {
        //     throw new Error('No se pueden eliminar documentos de soporte inicial o facturas.');
        // }

        // 4. Eliminar registro
        await client.query('DELETE FROM factura_documentos WHERE documento_id = $1', [documentoId]);

        // 5. Eliminar archivo físico
        if (fs.existsSync(doc.ruta_archivo)) {
            fs.unlinkSync(doc.ruta_archivo);
        }

        await client.query('COMMIT');
        return { mensaje: 'Documento eliminado exitosamente' };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Agregar documento de corrección (Ruta 1, 2 o 3)
 * Ruta 1: Puede agregar durante corrección avanzada
 * Ruta 3: Puede agregar durante corrección simple
 * Ruta 2: NO puede agregar documentos (solo observación)
 */
const agregarDocumentoCorreccion = async (facturaId, archivo, nombrePersonalizado, userId, observacion = null) => {
    const client = await db.connect();
    const UPLOAD_DIR = 'D:\\FacturasClinica';
    const filePath = path.join(UPLOAD_DIR, archivo.filename);

    try {
        await client.query('BEGIN');

        // 1. Verificar factura y estado
        const facturaRes = await client.query(`
            SELECT f.*, e.codigo as estado_codigo
            FROM facturas f
            JOIN estados e ON f.estado_id = e.estado_id
            WHERE f.factura_id = $1
        `, [facturaId]);

        if (facturaRes.rows.length === 0) {
            throw new Error('Factura no encontrada.');
        }

        const factura = facturaRes.rows[0];

        // 2. Obtener roles del usuario
        const rolesRes = await client.query(`
            SELECT r.codigo FROM usuario_roles ur
            JOIN roles r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = $1
        `, [userId]);

        const roles = rolesRes.rows.map(r => r.codigo);

        // 3. Validar permisos según estado y rol
        const estadosRuta2 = [
            'RUTA_2',
            'RUTA_2_CONTROL_INTERNO',
            'RUTA_2_DIRECCION_MEDICA',
            'RUTA_2_DIRECCION_FINANCIERA',
            'RUTA_2_DIRECCION_ADMINISTRATIVA',
            'RUTA_2_DIRECCION_GENERAL'
        ];

        if (factura.estado_codigo === 'RUTA_1') {
            // Solo el creador puede agregar en Ruta 1
            if (factura.usuario_creacion_id !== userId) {
                throw new Error('Solo el creador puede agregar documentos en Ruta 1.');
            }
            if (!factura.estado_retorno_id) {
                throw new Error('Solo se pueden agregar documentos a facturas devueltas para corrección.');
            }
        } else if (estadosRuta2.includes(factura.estado_codigo)) {
            // Ruta 2 NO puede agregar documentos
            throw new Error('Ruta 2 no puede agregar documentos de corrección. Solo puede aprobar o rechazar con observación.');
        } else if (factura.estado_codigo === 'RUTA_3') {
            // Verificar que el usuario tiene rol RUTA_3
            if (!roles.includes('RUTA_3')) {
                throw new Error('Solo usuarios de Ruta 3 pueden agregar documentos en este estado.');
            }
            if (!factura.estado_retorno_id) {
                throw new Error('Solo se pueden agregar documentos a facturas devueltas para corrección.');
            }
        } else {
            throw new Error('No se pueden agregar documentos de corrección en este estado.');
        }

        // 4. Insertar documento
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
            'DOCUMENTO_CORRECCION',
            archivo.filename,
            nombrePersonalizado || archivo.originalname,
            filePath,
            userId,
            observacion || 'Documento agregado durante corrección'
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


module.exports = {
    crearFactura,
    crearFacturaConMultiplesArchivos,
    procesarFactura,
    listarFacturas,
    obtenerFacturaPorId,
    obtenerHistorialFactura,
    obtenerEstadisticas,
    agregarDocumento,
    listarDocumentos,
    eliminarDocumento,
    eliminarFactura,
    validarEvidenciaPago,
    busquedaAvanzada,
    contarFacturasPendientes,
    corregirFacturaRuta1,
    eliminarDocumentoRuta1,
    agregarDocumentoCorreccion
};


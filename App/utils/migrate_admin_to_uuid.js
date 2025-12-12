const pool = require('../config/db');

/**
 * Script de migración para convertir el usuario_id del administrador de INTEGER a UUID
 * 
 * PROBLEMA: El usuario admin@clinica.com tiene usuario_id = 1 (INTEGER)
 * pero la tabla usuarios usa UUID como tipo de dato.
 * 
 * SOLUCIÓN: Generar un UUID para el admin y actualizar todas las referencias.
 */

async function migrateAdminToUUID() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('🔄 Iniciando migración del usuario administrador...\n');

        // 1. Verificar si existe el usuario con ID 1
        const checkAdmin = await client.query(
            `SELECT usuario_id, email, nombre FROM usuarios WHERE usuario_id = 1`
        );

        if (checkAdmin.rows.length === 0) {
            console.log('❌ No se encontró el usuario con ID 1');
            await client.query('ROLLBACK');
            return;
        }

        const adminActual = checkAdmin.rows[0];
        console.log('📋 Usuario actual:', adminActual);

        // 2. Generar un nuevo UUID para el admin
        const nuevoUUID = 'f9d2d7c0-1c3b-4e1a-8b0a-7c9e0d1f2a3b'; // UUID fijo para el admin
        console.log('🆔 Nuevo UUID para admin:', nuevoUUID);

        // 3. Verificar si ya existe un usuario con este UUID
        const checkUUID = await client.query(
            `SELECT usuario_id FROM usuarios WHERE usuario_id = $1`,
            [nuevoUUID]
        );

        if (checkUUID.rows.length > 0) {
            console.log('✅ El usuario admin ya tiene un UUID válido. No se requiere migración.');
            await client.query('ROLLBACK');
            return;
        }

        // 4. Actualizar referencias en otras tablas PRIMERO (para evitar violaciones de FK)
        console.log('\n📝 Actualizando referencias en tablas relacionadas...');

        // Actualizar usuario_roles
        const updateRoles = await client.query(
            `UPDATE usuario_roles SET usuario_id = $1 WHERE usuario_id = $2`,
            [nuevoUUID, adminActual.usuario_id]
        );
        console.log(`   ✓ usuario_roles: ${updateRoles.rowCount} registros actualizados`);

        // Actualizar facturas (usuario_creacion_id)
        const updateFacturas = await client.query(
            `UPDATE facturas SET usuario_creacion_id = $1 WHERE usuario_creacion_id = $2`,
            [nuevoUUID, adminActual.usuario_id]
        );
        console.log(`   ✓ facturas: ${updateFacturas.rowCount} registros actualizados`);

        // Actualizar factura_historial
        const updateHistorial = await client.query(
            `UPDATE factura_historial SET usuario_id = $1 WHERE usuario_id = $2`,
            [nuevoUUID, adminActual.usuario_id]
        );
        console.log(`   ✓ factura_historial: ${updateHistorial.rowCount} registros actualizados`);

        // Actualizar factura_documentos
        const updateDocumentos = await client.query(
            `UPDATE factura_documentos SET usuario_carga_id = $1 WHERE usuario_carga_id = $2`,
            [nuevoUUID, adminActual.usuario_id]
        );
        console.log(`   ✓ factura_documentos: ${updateDocumentos.rowCount} registros actualizados`);

        // 5. Finalmente, actualizar el usuario
        console.log('\n👤 Actualizando usuario administrador...');
        const updateUsuario = await client.query(
            `UPDATE usuarios SET usuario_id = $1 WHERE usuario_id = $2`,
            [nuevoUUID, adminActual.usuario_id]
        );
        console.log(`   ✓ usuarios: ${updateUsuario.rowCount} registro actualizado`);

        // 6. Verificar el resultado
        const verificar = await client.query(
            `SELECT usuario_id, email, nombre FROM usuarios WHERE usuario_id = $1`,
            [nuevoUUID]
        );

        console.log('\n✅ Migración completada exitosamente!');
        console.log('📋 Usuario actualizado:', verificar.rows[0]);

        await client.query('COMMIT');

        console.log('\n⚠️  IMPORTANTE: Debes cerrar sesión y volver a iniciar sesión como admin para obtener un nuevo token JWT con el UUID correcto.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error durante la migración:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        process.exit(0);
    }
}

// Ejecutar migración
console.log('═══════════════════════════════════════════════════════');
console.log('  MIGRACIÓN: Usuario Admin INTEGER → UUID');
console.log('═══════════════════════════════════════════════════════\n');

migrateAdminToUUID();

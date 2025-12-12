const pool = require('../config/db');

/**
 * Script ALTERNATIVO de migración para convertir usuario_id del admin
 * 
 * ESTRATEGIA: Crear un nuevo usuario con UUID, transferir datos y eliminar el viejo
 */

async function migrateAdminToUUID() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('🔄 Iniciando migración del usuario administrador...\n');

        // 1. Verificar si existe el usuario con ID 1
        const checkAdmin = await client.query(
            `SELECT * FROM usuarios WHERE usuario_id = 1`
        );

        if (checkAdmin.rows.length === 0) {
            console.log('✅ No hay usuario con ID 1. La migración no es necesaria.');
            await client.query('ROLLBACK');
            return;
        }

        const adminViejo = checkAdmin.rows[0];
        console.log('📋 Usuario con ID 1 encontrado:', {
            usuario_id: adminViejo.usuario_id,
            email: adminViejo.email,
            nombre: adminViejo.nombre
        });

        // 2. Generar un nuevo UUID
        const nuevoUUID = await client.query(`SELECT gen_random_uuid() as uuid`);
        const newId = nuevoUUID.rows[0].uuid;
        console.log('🆔 Nuevo UUID generado:', newId);

        // 3. Crear nuevo usuario con UUID
        console.log('\n👤 Creando nuevo usuario con UUID...');
        await client.query(`
            INSERT INTO usuarios (
                usuario_id, nombre, email, password_hash, 
                tipo_documento, numero_documento, area, cargo, activo, fecha_creacion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            newId,
            adminViejo.nombre,
            adminViejo.email + '.temp', // Email temporal para evitar conflicto
            adminViejo.password_hash,
            adminViejo.tipo_documento,
            adminViejo.numero_documento,
            adminViejo.area,
            adminViejo.cargo,
            adminViejo.activo,
            adminViejo.fecha_creacion
        ]);
        console.log('   ✓ Nuevo usuario creado');

        // 4. Copiar roles
        console.log('\n📝 Copiando roles...');
        await client.query(`
            INSERT INTO usuario_roles (usuario_id, rol_id)
            SELECT $1, rol_id FROM usuario_roles WHERE usuario_id = $2
        `, [newId, adminViejo.usuario_id]);
        console.log('   ✓ Roles copiados');

        // 5. Actualizar referencias en otras tablas
        console.log('\n📝 Actualizando referencias...');

        const updateFacturas = await client.query(
            `UPDATE facturas SET usuario_creacion_id = $1 WHERE usuario_creacion_id = $2`,
            [newId, adminViejo.usuario_id]
        );
        console.log(`   ✓ facturas: ${updateFacturas.rowCount} registros`);

        const updateHistorial = await client.query(
            `UPDATE factura_historial SET usuario_id = $1 WHERE usuario_id = $2`,
            [newId, adminViejo.usuario_id]
        );
        console.log(`   ✓ factura_historial: ${updateHistorial.rowCount} registros`);

        const updateDocumentos = await client.query(
            `UPDATE factura_documentos SET usuario_carga_id = $1 WHERE usuario_carga_id = $2`,
            [newId, adminViejo.usuario_id]
        );
        console.log(`   ✓ factura_documentos: ${updateDocumentos.rowCount} registros`);

        // 6. Eliminar usuario viejo
        console.log('\n🗑️  Eliminando usuario viejo...');
        await client.query(`DELETE FROM usuario_roles WHERE usuario_id = $1`, [adminViejo.usuario_id]);
        await client.query(`DELETE FROM usuarios WHERE usuario_id = $1`, [adminViejo.usuario_id]);
        console.log('   ✓ Usuario viejo eliminado');

        // 7. Actualizar email del nuevo usuario
        console.log('\n📧 Restaurando email original...');
        await client.query(
            `UPDATE usuarios SET email = $1 WHERE usuario_id = $2`,
            [adminViejo.email, newId]
        );
        console.log('   ✓ Email restaurado');

        // 8. Verificar resultado
        const verificar = await client.query(
            `SELECT usuario_id, email, nombre FROM usuarios WHERE usuario_id = $1`,
            [newId]
        );

        console.log('\n✅ Migración completada exitosamente!');
        console.log('📋 Nuevo usuario:', verificar.rows[0]);

        await client.query('COMMIT');

        console.log('\n⚠️  IMPORTANTE:');
        console.log('   1. Todos los usuarios admin deben cerrar sesión');
        console.log('   2. Volver a iniciar sesión para obtener nuevo token JWT');
        console.log('   3. El nuevo UUID es:', newId);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error durante la migración:', error.message);
        console.error('Detalle:', error.detail || 'N/A');
        console.error('Stack:', error.stack);
    } finally {
        client.release();
        process.exit(0);
    }
}

// Ejecutar migración
console.log('═══════════════════════════════════════════════════════');
console.log('  MIGRACIÓN ALTERNATIVA: Usuario Admin INTEGER → UUID');
console.log('═══════════════════════════════════════════════════════\n');

migrateAdminToUUID();

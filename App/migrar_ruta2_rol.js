/**
 * Migración: Cambiar de usuario_aprobador_ruta2_id a rol_aprobador_ruta2
 * Esto permite que cualquier usuario con el rol pueda aprobar, no solo uno específico
 */

const db = require('./config/db');

async function migrarColumnaRuta2() {
    const client = await db.connect();

    try {
        console.log('🚀 Iniciando migración: Cambio de usuario a rol en Ruta 2...\n');

        await client.query('BEGIN');

        // 1. Eliminar la columna anterior
        console.log('📝 Paso 1: Eliminando columna usuario_aprobador_ruta2_id...');
        await client.query(`
            ALTER TABLE facturas 
            DROP COLUMN IF EXISTS usuario_aprobador_ruta2_id CASCADE;
        `);
        console.log('✅ Columna eliminada\n');

        // 2. Crear nueva columna para el ROL
        console.log('📝 Paso 2: Creando columna rol_aprobador_ruta2...');
        await client.query(`
            ALTER TABLE facturas 
            ADD COLUMN rol_aprobador_ruta2 VARCHAR(100);
        `);
        console.log('✅ Columna creada\n');

        // 3. Crear índice para optimizar consultas
        console.log('📝 Paso 3: Creando índice...');
        await client.query(`
            CREATE INDEX idx_facturas_rol_aprobador_ruta2 
            ON facturas(rol_aprobador_ruta2);
        `);
        console.log('✅ Índice creado\n');

        // 4. Verificar cambios
        console.log('📝 Paso 4: Verificando cambios...\n');
        const columnResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'facturas' 
            AND column_name IN ('usuario_aprobador_ruta2_id', 'rol_aprobador_ruta2')
            ORDER BY column_name
        `);

        console.log('Columnas relacionadas con Ruta 2:');
        if (columnResult.rows.length > 0) {
            columnResult.rows.forEach(col => {
                console.log(`  ✓ ${col.column_name} (${col.data_type})`);
            });
        } else {
            console.log('  ⚠️  No se encontraron columnas (puede ser normal si se eliminó la anterior)');
        }

        await client.query('COMMIT');

        console.log('\n✅ ¡Migración completada exitosamente!\n');
        console.log('📋 Resumen:');
        console.log('   - Columna usuario_aprobador_ruta2_id eliminada');
        console.log('   - Columna rol_aprobador_ruta2 creada');
        console.log('   - Índice creado');
        console.log('\n🎉 Ahora el sistema usa ROLES en lugar de USUARIOS específicos\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error durante la migración:', error.message);
        console.error('\nDetalles del error:', error);
        throw error;
    } finally {
        client.release();
        process.exit(0);
    }
}

migrarColumnaRuta2();

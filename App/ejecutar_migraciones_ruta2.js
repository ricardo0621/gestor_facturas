/**
 * Script para ejecutar las migraciones de Ruta 2 Especializada
 * Ejecutar con: node ejecutar_migraciones_ruta2.js
 */

const db = require('./config/db');

async function ejecutarMigraciones() {
    const client = await db.connect();

    try {
        console.log('🚀 Iniciando migraciones de Ruta 2 Especializada...\n');

        await client.query('BEGIN');

        // =====================================================
        // 1. CREAR NUEVOS ROLES
        // =====================================================
        console.log('📝 Paso 1: Creando nuevos roles de Ruta 2...');

        const rolesQuery = `
            INSERT INTO roles (codigo, nombre) VALUES
            ('RUTA_2_CONTROL_INTERNO', 'Control Interno'),
            ('RUTA_2_DIRECCION_MEDICA', 'Dirección Médica'),
            ('RUTA_2_DIRECCION_FINANCIERA', 'Dirección Financiera'),
            ('RUTA_2_DIRECCION_ADMINISTRATIVA', 'Dirección Administrativa'),
            ('RUTA_2_DIRECCION_GENERAL', 'Dirección General')
            ON CONFLICT (codigo) DO NOTHING;
        `;

        await client.query(rolesQuery);
        console.log('✅ Roles creados correctamente\n');

        // =====================================================
        // 2. CREAR NUEVOS ESTADOS
        // =====================================================
        console.log('📝 Paso 2: Creando nuevos estados de Ruta 2...');

        const estadosQuery = `
            INSERT INTO estados (codigo, nombre, descripcion) VALUES
            ('RUTA_2_CONTROL_INTERNO', 'En Control Interno', 'Pendiente de aprobación por Control Interno'),
            ('RUTA_2_DIRECCION_MEDICA', 'En Dirección Médica', 'Pendiente de aprobación por Dirección Médica'),
            ('RUTA_2_DIRECCION_FINANCIERA', 'En Dirección Financiera', 'Pendiente de aprobación por Dirección Financiera'),
            ('RUTA_2_DIRECCION_ADMINISTRATIVA', 'En Dirección Administrativa', 'Pendiente de aprobación por Dirección Administrativa'),
            ('RUTA_2_DIRECCION_GENERAL', 'En Dirección General', 'Pendiente de aprobación por Dirección General')
            ON CONFLICT (codigo) DO NOTHING;
        `;

        await client.query(estadosQuery);
        console.log('✅ Estados creados correctamente\n');

        // =====================================================
        // 3. AGREGAR COLUMNA DE APROBADOR ASIGNADO
        // =====================================================
        console.log('📝 Paso 3: Agregando columna usuario_aprobador_ruta2_id...');

        // Verificar si la columna ya existe
        const checkColumnQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'facturas' AND column_name = 'usuario_aprobador_ruta2_id';
        `;

        const columnExists = await client.query(checkColumnQuery);

        if (columnExists.rows.length === 0) {
            await client.query(`
                ALTER TABLE facturas 
                ADD COLUMN usuario_aprobador_ruta2_id UUID REFERENCES usuarios(usuario_id);
            `);

            await client.query(`
                CREATE INDEX idx_facturas_aprobador_ruta2 ON facturas(usuario_aprobador_ruta2_id);
            `);

            console.log('✅ Columna agregada correctamente\n');
        } else {
            console.log('ℹ️  Columna ya existe, omitiendo...\n');
        }

        // =====================================================
        // 4. VERIFICACIÓN
        // =====================================================
        console.log('📝 Paso 4: Verificando cambios...\n');

        const rolesResult = await client.query(`
            SELECT codigo, nombre FROM roles WHERE codigo LIKE 'RUTA_2_%' ORDER BY codigo
        `);
        console.log('Roles creados:');
        rolesResult.rows.forEach(rol => {
            console.log(`  ✓ ${rol.codigo} - ${rol.nombre}`);
        });

        const estadosResult = await client.query(`
            SELECT codigo, nombre FROM estados WHERE codigo LIKE 'RUTA_2_%' ORDER BY codigo
        `);
        console.log('\nEstados creados:');
        estadosResult.rows.forEach(estado => {
            console.log(`  ✓ ${estado.codigo} - ${estado.nombre}`);
        });

        const columnResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'facturas' AND column_name = 'usuario_aprobador_ruta2_id'
        `);
        console.log('\nColumna agregada:');
        if (columnResult.rows.length > 0) {
            console.log(`  ✓ ${columnResult.rows[0].column_name} (${columnResult.rows[0].data_type})`);
        }

        // =====================================================
        // 5. COMMIT
        // =====================================================
        await client.query('COMMIT');

        console.log('\n✅ ¡Migración completada exitosamente!\n');
        console.log('📋 Resumen:');
        console.log(`   - ${rolesResult.rows.length} roles creados`);
        console.log(`   - ${estadosResult.rows.length} estados creados`);
        console.log(`   - 1 columna agregada`);
        console.log('\n🎉 ¡Todo listo! Ahora puedes asignar los nuevos roles a los usuarios.\n');

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

// Ejecutar migraciones
ejecutarMigraciones().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
});

/**
 * Script para verificar la estructura de las tablas
 */

const db = require('./config/db');

async function verificarEstructura() {
    const client = await db.connect();

    try {
        console.log('🔍 Verificando estructura de tablas...\n');

        // Verificar tabla roles
        console.log('📋 Estructura de tabla ROLES:');
        const rolesColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'roles'
            ORDER BY ordinal_position;
        `);
        rolesColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // Verificar tabla estados
        console.log('\n📋 Estructura de tabla ESTADOS:');
        const estadosColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'estados'
            ORDER BY ordinal_position;
        `);
        estadosColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // Verificar tabla facturas
        console.log('\n📋 Estructura de tabla FACTURAS:');
        const facturasColumns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'facturas'
            ORDER BY ordinal_position;
        `);
        facturasColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        // Verificar roles existentes
        console.log('\n📋 Roles existentes:');
        const rolesExistentes = await client.query(`SELECT * FROM roles ORDER BY rol_id`);
        rolesExistentes.rows.forEach(rol => {
            console.log(`  - ID: ${rol.rol_id}, Código: ${rol.codigo}, Nombre: ${rol.nombre}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        client.release();
        process.exit(0);
    }
}

verificarEstructura();

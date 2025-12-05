/**
 * Script para crear el rol de Búsqueda de Facturas
 */

const db = require('./config/db');

async function crearRolBusqueda() {
    const client = await db.connect();

    try {
        console.log('🚀 Creando rol de Búsqueda de Facturas...\n');

        await client.query('BEGIN');

        // Crear rol de búsqueda
        const rolQuery = `
            INSERT INTO roles (codigo, nombre) 
            VALUES ('BUSQUEDA_FACTURAS', 'Búsqueda de Facturas')
            ON CONFLICT (codigo) DO NOTHING
            RETURNING rol_id, codigo, nombre;
        `;

        const result = await client.query(rolQuery);

        if (result.rows.length > 0) {
            console.log('✅ Rol creado:');
            console.log(`   - Código: ${result.rows[0].codigo}`);
            console.log(`   - Nombre: ${result.rows[0].nombre}`);
        } else {
            console.log('ℹ️  El rol ya existía');
        }

        // Verificar
        const verificar = await client.query(`
            SELECT rol_id, codigo, nombre 
            FROM roles 
            WHERE codigo = 'BUSQUEDA_FACTURAS'
        `);

        console.log('\n📋 Rol en base de datos:');
        verificar.rows.forEach(rol => {
            console.log(`   ✓ ${rol.codigo} - ${rol.nombre} (ID: ${rol.rol_id})`);
        });

        await client.query('COMMIT');

        console.log('\n✅ ¡Rol de búsqueda creado exitosamente!\n');
        console.log('📝 Ahora puedes asignar este rol a los usuarios que necesiten');
        console.log('   acceso a la búsqueda avanzada de facturas.\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        console.error(error);
        throw error;
    } finally {
        client.release();
        process.exit(0);
    }
}

crearRolBusqueda();

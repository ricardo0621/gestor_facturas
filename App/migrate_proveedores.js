const pool = require('./config/db');

async function fixProveedoresTable() {
    try {
        console.log('🔧 Actualizando estructura de tabla proveedores...\n');

        // 1. Agregar columnas faltantes
        console.log('1. Agregando columnas faltantes...');
        await pool.query(`
            ALTER TABLE proveedores 
            ADD COLUMN IF NOT EXISTS direccion VARCHAR(255),
            ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
            ADD COLUMN IF NOT EXISTS email VARCHAR(100),
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        `);
        console.log('✅ Columnas agregadas exitosamente\n');

        // 2. Verificar si necesitamos renombrar proveedor_id a id
        console.log('2. Verificando nombre de columna ID...');
        const checkId = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'proveedores' 
            AND column_name IN ('id', 'proveedor_id');
        `);

        const hasId = checkId.rows.some(row => row.column_name === 'id');
        const hasProveedorId = checkId.rows.some(row => row.column_name === 'proveedor_id');

        if (hasProveedorId && !hasId) {
            console.log('   Renombrando proveedor_id a id...');

            // Primero, necesitamos actualizar las referencias en otras tablas
            await pool.query(`
                ALTER TABLE facturas 
                DROP CONSTRAINT IF EXISTS facturas_proveedor_id_fkey;
            `);

            await pool.query(`
                ALTER TABLE proveedores 
                RENAME COLUMN proveedor_id TO id;
            `);

            await pool.query(`
                ALTER TABLE facturas 
                ADD CONSTRAINT facturas_proveedor_id_fkey 
                FOREIGN KEY (proveedor_id) REFERENCES proveedores(id);
            `);

            console.log('✅ Columna renombrada exitosamente\n');
        } else if (hasId) {
            console.log('✅ La columna ya se llama "id"\n');
        }

        // 3. Verificar estructura final
        console.log('3. Estructura final de la tabla proveedores:');
        const finalStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'proveedores'
            ORDER BY ordinal_position;
        `);
        console.table(finalStructure.rows);

        console.log('\n✅ Migración completada exitosamente!');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

fixProveedoresTable();

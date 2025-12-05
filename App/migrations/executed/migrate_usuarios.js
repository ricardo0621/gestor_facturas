const pool = require('./config/db');

async function agregarCamposUsuarios() {
    try {
        console.log('🔧 Agregando campos a la tabla usuarios...\n');

        // Agregar columnas faltantes
        await pool.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(20),
            ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50),
            ADD COLUMN IF NOT EXISTS area VARCHAR(100),
            ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);
        `);

        console.log('✅ Columnas agregadas exitosamente\n');

        // Verificar estructura final
        console.log('Estructura final de la tabla usuarios:');
        const finalStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'usuarios'
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

agregarCamposUsuarios();

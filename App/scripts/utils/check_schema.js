const pool = require('./config/db');

async function checkSchema() {
    try {
        console.log('--- Columnas de la tabla PROVEEDORES ---');
        const resProveedores = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'proveedores';
        `);
        console.table(resProveedores.rows);

        console.log('\n--- Columnas de la tabla FACTURAS ---');
        const resFacturas = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'facturas';
        `);
        console.table(resFacturas.rows);

    } catch (err) {
        console.error('Error al consultar esquema:', err);
    } finally {
        // No cerramos el pool explícitamente porque db.js podría no exportar end(), 
        // pero el script terminará.
        process.exit();
    }
}

checkSchema();

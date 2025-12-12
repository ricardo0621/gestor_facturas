const pool = require('../config/db');
const fs = require('fs');

/**
 * Script para verificar el tipo de dato de usuario_id en la base de datos
 */
async function checkUserIdType() {
    const client = await pool.connect();
    try {
        // Verificar el tipo de dato de usuario_id
        const schemaQuery = `
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' AND column_name = 'usuario_id';
        `;
        const schemaResult = await client.query(schemaQuery);

        // Verificar un usuario de ejemplo
        const userQuery = `SELECT usuario_id, email FROM usuarios LIMIT 1;`;
        const userResult = await client.query(userQuery);

        const result = {
            schema: schemaResult.rows[0],
            example_user: userResult.rows[0],
            usuario_id_type: typeof userResult.rows[0].usuario_id,
            usuario_id_value: userResult.rows[0].usuario_id
        };

        console.log(JSON.stringify(result, null, 2));
        fs.writeFileSync('utils/db_check_result.json', JSON.stringify(result, null, 2));
        console.log('\n✅ Resultado guardado en utils/db_check_result.json');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkUserIdType();

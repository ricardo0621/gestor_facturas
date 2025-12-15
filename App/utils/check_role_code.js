const db = require('../config/db');

async function checkRoleCodes() {
    try {
        const result = await db.query(`
            SELECT rol_id, codigo, nombre 
            FROM roles 
            WHERE codigo LIKE '%BUSQUEDA%'
            ORDER BY codigo
        `);

        console.log('=== ROLES CON BUSQUEDA ===\n');
        result.rows.forEach(rol => {
            console.log(`ID: ${rol.rol_id}`);
            console.log(`Código: "${rol.codigo}"`);
            console.log(`Código (length): ${rol.codigo.length}`);
            console.log(`Código (bytes):`, Buffer.from(rol.codigo).toString('hex'));
            console.log(`Nombre: ${rol.nombre}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkRoleCodes();

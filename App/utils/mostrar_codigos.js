const db = require('../config/db');

async function mostrarCodigosExactos() {
    try {
        const result = await db.query(`
            SELECT codigo, nombre, activo 
            FROM tipos_soporte 
            WHERE activo = true
            ORDER BY nombre ASC
        `);

        console.log('=== CÓDIGOS EXACTOS EN BD ===\n');
        result.rows.forEach(tipo => {
            console.log(`Código: "${tipo.codigo}" | Nombre: "${tipo.nombre}"`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

mostrarCodigosExactos();

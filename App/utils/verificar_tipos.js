const db = require('../config/db');

async function verificarTiposSoporte() {
    try {
        console.log('=== VERIFICANDO TIPOS DE SOPORTE ===\n');

        // Obtener TODOS los tipos (activos e inactivos)
        const result = await db.query(`
            SELECT tipo_soporte_id, codigo, nombre, activo, orden 
            FROM tipos_soporte 
            ORDER BY orden ASC, nombre ASC
        `);

        console.log(`Total de tipos en BD: ${result.rows.length}\n`);

        result.rows.forEach((tipo, index) => {
            const estado = tipo.activo ? '✅ ACTIVO' : '❌ INACTIVO';
            console.log(`${index + 1}. ${estado} | Código: ${tipo.codigo.padEnd(20)} | Nombre: ${tipo.nombre}`);
        });

        console.log('\n=== TIPOS QUE DEBERÍAN APARECER EN DROPDOWN ===\n');
        const activos = result.rows.filter(t => t.activo && t.codigo !== 'FACTURA');
        activos.forEach(tipo => {
            console.log(`  - ${tipo.codigo}: ${tipo.nombre}`);
        });

        console.log(`\nTotal que deberían aparecer: ${activos.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verificarTiposSoporte();

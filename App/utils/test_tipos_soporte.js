const db = require('../config/db');

async function testTiposSoporte() {
    try {
        console.log('=== PROBANDO CARGA DE TIPOS DE SOPORTE ===');

        // Consulta directa a la base de datos
        const result = await db.query('SELECT * FROM tipos_soporte WHERE activo = true ORDER BY orden ASC, nombre ASC');

        console.log('\n📊 Tipos de soporte en BD:');
        console.log('Total:', result.rows.length);
        console.log('\nDetalle:');
        result.rows.forEach((tipo, index) => {
            console.log(`${index + 1}. Código: ${tipo.codigo} | Nombre: ${tipo.nombre} | Activo: ${tipo.activo}`);
        });

        console.log('\n=== FIN DE PRUEBA ===');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testTiposSoporte();

// Script para inicializar la base de datos en Neon
// Ejecutar con: node init-database.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('='.repeat(60));
    console.log('INICIALIZANDO BASE DE DATOS');
    console.log('='.repeat(60));

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Leer el archivo schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('\n📄 Ejecutando schema.sql...\n');

        // Ejecutar el schema
        await pool.query(schema);

        console.log('✅ Base de datos inicializada correctamente!\n');
        console.log('Tablas creadas:');
        console.log('  - estados');
        console.log('  - proveedores');
        console.log('  - usuarios');
        console.log('  - roles');
        console.log('  - usuario_roles');
        console.log('  - facturas');
        console.log('  - factura_historial');
        console.log('\nDatos iniciales insertados:');
        console.log('  - 9 estados del flujo');
        console.log('  - 2 proveedores de prueba');
        console.log('  - 4 roles (Rutas)');
        console.log('  - 1 usuario administrador');
        console.log('\n' + '='.repeat(60));
        console.log('CREDENCIALES DE ACCESO');
        console.log('='.repeat(60));
        console.log('Email:    admin@sistema.com');
        console.log('Password: admin123');
        console.log('='.repeat(60));
        console.log('\n⚠️  IMPORTANTE: Genera un hash real de contraseña ejecutando:');
        console.log('   node generate-admin-password.js');
        console.log('\n🚀 Ahora puedes iniciar el servidor con:');
        console.log('   npm start');
        console.log('\n');

    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:');
        console.error(error.message);
        console.error('\nDetalles del error:', error);
    } finally {
        await pool.end();
    }
}

initDatabase();

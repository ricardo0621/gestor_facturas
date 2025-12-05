// Script para generar y actualizar hash de contraseña para el usuario admin
// Ejecutar con: node update-admin-password.js

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

async function updateAdminPassword() {
    const password = 'admin123';
    const saltRounds = 10;

    console.log('='.repeat(60));
    console.log('ACTUALIZANDO CONTRASEÑA DEL ADMINISTRADOR');
    console.log('='.repeat(60));
    console.log('Generando hash para la contraseña:', password);

    const hash = await bcrypt.hash(password, saltRounds);

    console.log('Hash generado:', hash);
    console.log('\nActualizando en la base de datos...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const result = await pool.query(
            `UPDATE usuarios 
             SET password_hash = $1 
             WHERE email = 'admin@sistema.com'`,
            [hash]
        );

        if (result.rowCount > 0) {
            console.log('✅ Contraseña actualizada correctamente!\n');
            console.log('='.repeat(60));
            console.log('CREDENCIALES DE ACCESO');
            console.log('='.repeat(60));
            console.log('Email:    admin@sistema.com');
            console.log('Password:', password);
            console.log('='.repeat(60));
            console.log('\n🚀 Ahora puedes iniciar el servidor con:');
            console.log('   npm start');
            console.log('\n');
        } else {
            console.log('⚠️  No se encontró el usuario admin en la base de datos.');
            console.log('   Ejecuta primero: node init-database.js');
        }

    } catch (error) {
        console.error('❌ Error al actualizar la contraseña:');
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

updateAdminPassword().catch(console.error);

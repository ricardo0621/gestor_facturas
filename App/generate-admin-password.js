// Script para generar hash de contraseña para el usuario admin
// Ejecutar con: node generate-admin-password.js

const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'admin123';
    const saltRounds = 10;

    const hash = await bcrypt.hash(password, saltRounds);

    console.log('='.repeat(60));
    console.log('HASH GENERADO PARA CONTRASEÑA ADMIN');
    console.log('='.repeat(60));
    console.log('Contraseña:', password);
    console.log('Hash:', hash);
    console.log('='.repeat(60));
    console.log('\nActualiza el schema.sql con este hash en la línea del INSERT de usuarios:');
    console.log(`'${hash}'`);
    console.log('='.repeat(60));
}

generateHash().catch(console.error);

const jwt = require('jsonwebtoken');

/**
 * Script para decodificar un token JWT y ver qué contiene
 * Uso: node utils/decode_token.js "tu_token_aqui"
 */

const token = process.argv[2];

if (!token) {
    console.log('❌ Uso: node utils/decode_token.js "tu_token_jwt"');
    console.log('\nPuedes obtener el token desde:');
    console.log('1. Las DevTools del navegador (Application > Local Storage)');
    console.log('2. El header Authorization de una petición');
    process.exit(1);
}

try {
    // Decodificar sin verificar (solo para inspección)
    const decoded = jwt.decode(token);

    console.log('=== TOKEN DECODIFICADO ===\n');
    console.log(JSON.stringify(decoded, null, 2));

    console.log('\n=== INFORMACIÓN CLAVE ===');
    console.log('usuario_id:', decoded.usuario_id);
    console.log('Tipo:', typeof decoded.usuario_id);
    console.log('Email:', decoded.email);
    console.log('Roles:', decoded.roles);

} catch (error) {
    console.error('❌ Error al decodificar token:', error.message);
}

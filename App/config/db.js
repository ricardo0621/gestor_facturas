const { Pool } = require('pg');
require('dotenv').config();

// Configuración del Pool de Conexiones a PostgreSQL
// Usa la variable DATABASE_URL del archivo .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // =============================================================
    // CONFIGURACIÓN SSL ALTERNATIVA PARA NEON
    // =============================================================
    ssl: {
        // Intenta la conexión SSL y omite la verificación del certificado
        sslmode: 'require',
        rejectUnauthorized: false
    },

    // Configurar zona horaria de Colombia
    options: '-c timezone=America/Bogota'
});

module.exports = pool;
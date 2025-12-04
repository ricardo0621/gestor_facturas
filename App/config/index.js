// Archivo de configuración centralizado para extraer variables de entorno.
// Esto permite que otros módulos (como controladores y servicios) accedan a ellas
// sin depender directamente de process.env en cada archivo.

module.exports = {
    // Puerto de la aplicación
    PORT: process.env.PORT || 3000,
    
    // Clave Secreta para generar y verificar tokens JWT.
    // Es CRÍTICO que esta clave sea larga y aleatoria en producción.
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_no_usar_en_produccion',

    // La URL de la base de datos ya está siendo usada directamente en config/db.js
    // pero se incluye aquí si se necesitara en otra parte.
    DATABASE_URL: process.env.DATABASE_URL
};
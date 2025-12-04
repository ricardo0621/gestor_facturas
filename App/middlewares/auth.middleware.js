const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar la validez del token JWT en las peticiones.
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Acceso denegado. Se requiere un token JWT en el formato "Bearer [token]".'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adjuntar la información decodificada del usuario a req.user
        req.user = decoded;

        next();

    } catch (error) {
        console.error("Error de verificación de token:", error.message);
        return res.status(401).json({
            error: 'Token inválido o expirado.',
            details: error.message
        });
    }
};

/**
 * Middleware para verificar si el usuario es SUPER_ADMIN
 */
const isSuperAdmin = (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes('SUPER_ADMIN')) {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de Super Administrador.'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    isSuperAdmin
};
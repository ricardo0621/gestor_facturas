const authService = require('../services/auth.service');
const { JWT_SECRET } = require('../config/index'); // Asume que config/index.js tiene una exportación o toma directamente de process.env

const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // La lógica del servicio se encargará de verificar las credenciales y generar el token
        const result = await authService.loginUsuario(email, password);

        if (result.error) {
            return res.status(401).json({ error: result.error });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error en el controlador de login:', error);
        res.status(500).json({ error: 'Error interno del servidor al intentar iniciar sesión.' });
    }
};

module.exports = {
    loginUsuario,
};
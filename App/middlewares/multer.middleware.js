const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =============================================================
// CONFIGURACIÓN DE ALMACENAMIENTO (Destination)
// =============================================================
const destinationDir = 'D:\\SoportesFacturas'; // Carpeta de destino que definiste

// Asegurarse de que el directorio exista
if (!fs.existsSync(destinationDir)) {
    console.log(`Creando directorio de destino: ${destinationDir}`);
    fs.mkdirSync(destinationDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // La carpeta de destino donde se guardarán los archivos
        cb(null, destinationDir);
    },
    filename: (req, file, cb) => {
        // Renombrar el archivo para evitar colisiones: [timestamp]-[nombreoriginal].[ext]
        const extension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// =============================================================
// CONFIGURACIÓN DE INSTANCIA DE MULTER
// =============================================================
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Limitar a 20MB
    fileFilter: (req, file, cb) => {
        // Opcional: Filtro para aceptar solo PDFs, JPGs y PNGs
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extname) {
            return cb(null, true);
        }
        cb(new Error("Solo se permiten archivos de tipo PDF, JPG y PNG."));
    }
});

// =============================================================
// EXPORTACIÓN CRÍTICA
// =============================================================

// Exportamos la INSTANCIA completa de Multer, que es la que tiene los métodos .single(), .array(), etc.
module.exports = upload;
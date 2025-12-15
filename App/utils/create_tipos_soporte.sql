-- ============================================
-- SCRIPT: Crear tabla tipos_soporte
-- Descripción: Tabla para almacenar los tipos de documentos de soporte
-- ============================================

CREATE TABLE IF NOT EXISTS tipos_soporte (
    tipo_soporte_id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_tipos_soporte_activo ON tipos_soporte(activo);
CREATE INDEX IF NOT EXISTS idx_tipos_soporte_orden ON tipos_soporte(orden);

-- Insertar tipos de soporte por defecto
INSERT INTO tipos_soporte (codigo, nombre, descripcion, orden, activo) VALUES
('FACTURA', 'Factura', 'Documento principal de factura', 0, true),
('SOPORTE', 'Soporte', 'Documento de soporte general', 1, true),
('DISTRIBUCION_GASTO', 'Distribución de Gasto', 'Documento de distribución de gastos', 2, true),
('OTRO', 'Otro', 'Otro tipo de documento', 99, true)
ON CONFLICT (codigo) DO NOTHING;

-- Comentarios en la tabla
COMMENT ON TABLE tipos_soporte IS 'Catálogo de tipos de documentos de soporte para facturas';
COMMENT ON COLUMN tipos_soporte.codigo IS 'Código único del tipo de soporte (mayúsculas, sin espacios)';
COMMENT ON COLUMN tipos_soporte.nombre IS 'Nombre descriptivo del tipo de soporte';
COMMENT ON COLUMN tipos_soporte.orden IS 'Orden de visualización (menor = primero)';
COMMENT ON COLUMN tipos_soporte.activo IS 'Indica si el tipo está activo para su uso';

-- ============================================
-- GESTOR DE FACTURAS - SCHEMA COMPLETO
-- Base de Datos: PostgreSQL
-- ============================================

-- Eliminar tablas si existen (en orden correcto por dependencias)
DROP TABLE IF EXISTS factura_documentos CASCADE;
DROP TABLE IF EXISTS factura_historial CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS usuario_roles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS estados CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS tipos_soporte CASCADE;

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE roles (
    rol_id SERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT
);

-- ============================================
-- TABLA: estados
-- ============================================
CREATE TABLE estados (
    estado_id SERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT
);

-- ============================================
-- TABLA: proveedores
-- ============================================
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nit VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    contacto VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: tipos_soporte
-- ============================================
CREATE TABLE tipos_soporte (
    tipo_soporte_id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(50),
    numero_documento VARCHAR(50),
    area VARCHAR(255),
    cargo VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: usuario_roles (relación muchos a muchos)
-- ============================================
CREATE TABLE usuario_roles (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    rol_id INTEGER NOT NULL REFERENCES roles(rol_id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

-- ============================================
-- TABLA: facturas
-- ============================================
CREATE TABLE facturas (
    factura_id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(100) NOT NULL,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
    nit_proveedor VARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL,
    monto NUMERIC(15, 2) NOT NULL,
    concepto TEXT,
    documento_nombre VARCHAR(255),
    estado_id INTEGER NOT NULL REFERENCES estados(estado_id) ON DELETE RESTRICT,
    estado_retorno_id INTEGER REFERENCES estados(estado_id) ON DELETE SET NULL,
    usuario_creacion_id INTEGER NOT NULL REFERENCES usuarios(usuario_id) ON DELETE RESTRICT,
    rol_aprobador_ruta2 VARCHAR(100),
    is_anulada BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: factura_historial
-- ============================================
CREATE TABLE factura_historial (
    historial_id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(factura_id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id) ON DELETE RESTRICT,
    accion VARCHAR(100) NOT NULL,
    estado_anterior_id INTEGER REFERENCES estados(estado_id) ON DELETE SET NULL,
    estado_nuevo_id INTEGER REFERENCES estados(estado_id) ON DELETE SET NULL,
    observacion TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: factura_documentos
-- ============================================
CREATE TABLE factura_documentos (
    documento_id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(factura_id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    nombre_personalizado VARCHAR(255),
    observacion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX idx_facturas_estado ON facturas(estado_id);
CREATE INDEX idx_facturas_proveedor ON facturas(proveedor_id);
CREATE INDEX idx_facturas_usuario_creacion ON facturas(usuario_creacion_id);
CREATE INDEX idx_facturas_fecha_creacion ON facturas(fecha_creacion DESC);
CREATE INDEX idx_factura_historial_factura ON factura_historial(factura_id);
CREATE INDEX idx_factura_documentos_factura ON factura_documentos(factura_id);

-- ============================================
-- DATOS INICIALES: ROLES
-- ============================================
INSERT INTO roles (codigo, nombre, descripcion) VALUES
('SUPER_ADMIN', 'Super Administrador', 'Acceso total al sistema'),
('RUTA_1', 'Gestor de Facturas', 'Carga y gestiona facturas'),
('RUTA_2', 'Revisor General', 'Revisa facturas en Ruta 2'),
('RUTA_2_CONTROL_INTERNO', 'Control Interno', 'Revisión de Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'Dirección Médica', 'Revisión de Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'Dirección Financiera', 'Revisión de Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'Dirección Administrativa', 'Revisión de Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'Dirección General', 'Revisión de Dirección General'),
('RUTA_3', 'Contabilidad', 'Revisión contable'),
('RUTA_4', 'Tesorería', 'Aprobación final y pago');

-- ============================================
-- DATOS INICIALES: ESTADOS
-- ============================================
INSERT INTO estados (codigo, nombre, descripcion) VALUES
('RUTA_1', 'En Gestión', 'Factura en proceso de carga o devuelta para corrección'),
('RUTA_2', 'En Revisión General', 'Factura en revisión por Ruta 2'),
('RUTA_2_CONTROL_INTERNO', 'En Control Interno', 'Factura en revisión por Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'En Dirección Médica', 'Factura en revisión por Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'En Dirección Financiera', 'Factura en revisión por Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'En Dirección Administrativa', 'Factura en revisión por Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'En Dirección General', 'Factura en revisión por Dirección General'),
('RUTA_3', 'En Contabilidad', 'Factura en revisión contable'),
('RUTA_4', 'En Tesorería', 'Factura en proceso de pago'),
('FINALIZADA', 'Finalizada/Pagada', 'Factura aprobada y pagada'),
('ANULADA', 'Anulada', 'Factura cancelada');

-- ============================================
-- DATOS INICIALES: TIPOS DE SOPORTE
-- ============================================
INSERT INTO tipos_soporte (codigo, nombre, descripcion, orden) VALUES
('FACTURA', 'Factura', 'Documento de factura principal', 1),
('SOPORTE_INICIAL', 'Soporte Inicial', 'Documento de soporte al cargar factura', 2),
('SOPORTE', 'Soporte Adicional', 'Documento de soporte adicional', 3),
('EVIDENCIA_PAGO', 'Evidencia de Pago', 'Comprobante de pago', 4),
('ORDEN_COMPRA', 'Orden de Compra', 'Orden de compra relacionada', 5),
('REMISION', 'Remisión', 'Documento de remisión', 6),
('ACTA_RECEPCION', 'Acta de Recepción', 'Acta de recepción de bienes/servicios', 7),
('CERTIFICACION', 'Certificación', 'Certificación o documento de cumplimiento', 8);

-- ============================================
-- USUARIO ADMINISTRADOR INICIAL
-- Contraseña: admin123 (debe cambiarse en producción)
-- ============================================
INSERT INTO usuarios (nombre, email, password_hash, tipo_documento, numero_documento, area, cargo) VALUES
('Administrador', 'admin@clinica.com', '$2b$10$XqZ8kYZ8kYZ8kYZ8kYZ8kO', 'CC', '1234567890', 'Sistemas', 'Administrador');

-- Asignar rol SUPER_ADMIN al usuario administrador
INSERT INTO usuario_roles (usuario_id, rol_id) 
SELECT u.usuario_id, r.rol_id 
FROM usuarios u, roles r 
WHERE u.email = 'admin@clinica.com' AND r.codigo = 'SUPER_ADMIN';

-- ============================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================
-- 1. Ejecutar este script en PostgreSQL:
--    psql -U postgres -d gestor_facturas -f database_schema.sql
--
-- 2. Cambiar la contraseña del administrador después del primer login
--
-- 3. Configurar variables de entorno en .env:
--    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
--
-- 4. Crear directorio para almacenar archivos:
--    UPLOAD_PATH=D:\\FacturasClinica

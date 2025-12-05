-- Archivo: schema.sql
-- Propósito: Esquema de base de datos optimizado para el flujo de aprobación complejo.

-- =============================================================
-- 1. LIMPIEZA
-- =============================================================
DROP TABLE IF EXISTS factura_documentos;
DROP TABLE IF EXISTS factura_historial;
DROP TABLE IF EXISTS facturas;
DROP TABLE IF EXISTS estados;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS usuario_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS usuarios;

-- =============================================================
-- 2. TABLAS MAESTRAS
-- =============================================================

CREATE TABLE estados (
    estado_id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL, -- Ej: RUTA_1, RUTA_2, FINALIZADA
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE proveedores (
    proveedor_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nit VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE roles (
    rol_id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL, -- Ej: RUTA_1, SUPER_ADMIN
    nombre VARCHAR(100) NOT NULL
);

-- =============================================================
-- 3. SEGURIDAD
-- =============================================================

CREATE TABLE usuarios (
    usuario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    requiere_evidencia_pago BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_roles (
    usuario_rol_id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(usuario_id),
    rol_id INTEGER NOT NULL REFERENCES roles(rol_id),
    UNIQUE (usuario_id, rol_id)
);

-- =============================================================
-- 4. FACTURACIÓN (CORE)
-- =============================================================

CREATE TABLE facturas (
    factura_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos de la factura
    numero_factura VARCHAR(50) NOT NULL,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(proveedor_id),
    fecha_emision DATE NOT NULL,
    monto NUMERIC(15, 2) NOT NULL,
    concepto TEXT,
    
    -- Control de Flujo
    ruta_id INTEGER NOT NULL REFERENCES roles(rol_id), -- Ruta/Rol que creó la factura
    estado_id INTEGER NOT NULL REFERENCES estados(estado_id),
    estado_retorno_id INTEGER REFERENCES estados(estado_id), -- Si es rechazado, aquí se guarda a dónde debe volver tras corrección
    
    -- Auditoría
    usuario_creacion_id UUID NOT NULL REFERENCES usuarios(usuario_id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Archivos (mantener por compatibilidad, pero usar factura_documentos)
    documento_path VARCHAR(500) NOT NULL,
    documento_nombre VARCHAR(255) NOT NULL,
    
    -- Validaciones
    is_anulada BOOLEAN DEFAULT FALSE
);

-- Índice único parcial: Solo aplica si NO está anulada
CREATE UNIQUE INDEX idx_facturas_unicas_activas 
ON facturas (numero_factura, proveedor_id) 
WHERE is_anulada = FALSE;

CREATE TABLE factura_historial (
    historial_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(factura_id),
    estado_anterior_id INTEGER REFERENCES estados(estado_id),
    estado_nuevo_id INTEGER NOT NULL REFERENCES estados(estado_id),
    usuario_id UUID NOT NULL REFERENCES usuarios(usuario_id),
    accion VARCHAR(50) NOT NULL, -- APROBAR, RECHAZAR, CORREGIR, CARGAR, ANULAR
    observacion TEXT,
    fecha_transicion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE factura_documentos (
    documento_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(factura_id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL, -- SOPORTE_INICIAL, DOCUMENTO_ADICIONAL, EVIDENCIA_PAGO
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_personalizado VARCHAR(255),
    ruta_archivo VARCHAR(500) NOT NULL,
    usuario_carga_id UUID NOT NULL REFERENCES usuarios(usuario_id),
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT
);

CREATE INDEX idx_factura_docs ON factura_documentos(factura_id);
CREATE INDEX idx_tipo_doc ON factura_documentos(tipo_documento);

-- =============================================================
-- 5. SEEDS (Datos Iniciales)
-- =============================================================

-- Estados Simplificados por Ruta
INSERT INTO estados (codigo, nombre, descripcion) VALUES
('RUTA_1', 'En Gestión (Ruta 1)', 'Factura en poder del usuario cargador (inicial o devuelta).'),
('RUTA_2', 'Revisión Dirección (Ruta 2)', 'Pendiente de aprobación por Dirección Administrativa.'),
('RUTA_3', 'Revisión Contabilidad (Ruta 3)', 'Pendiente de aprobación por Contabilidad.'),
('RUTA_4', 'Revisión Tesorería (Ruta 4)', 'Pendiente de aprobación por Tesorería.'),
('FINALIZADA', 'Finalizada / Pagada', 'Proceso concluido exitosamente.'),
('ANULADA', 'Anulada', 'Factura anulada, no permite más acciones.');

INSERT INTO roles (codigo, nombre) VALUES
('RUTA_1', 'Cargador de Facturas'),
('RUTA_2', 'Dirección Administrativa'),
('RUTA_3', 'Contabilidad'),
('RUTA_4', 'Tesorería'),
('SUPER_ADMIN', 'Super Administrador');

INSERT INTO proveedores (nombre, nit) VALUES
('SoftTech S.A.S.', '900123456-1'),
('Logistica Rápida Ltda.', '800987654-2');

-- Usuario Admin (Hash: admin123)
INSERT INTO usuarios (usuario_id, nombre, email, password_hash) VALUES
('f9d2d7c0-1c3b-4e1a-8b0a-7c9e0d1f2a3b', 'Super Admin', 'admin@sistema.com', '$2b$10$YQx.eQJ8vZ8vZ8vZ8vZ8vOqJ8vZ8vZ8vZ8vZ8vZ8vZ8vZ8vZ8vZ8u');

-- Asignar rol SUPER_ADMIN y todos los demás para pruebas
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT 'f9d2d7c0-1c3b-4e1a-8b0a-7c9e0d1f2a3b', rol_id FROM roles;

-- Ajustar secuencias
SELECT setval('estados_estado_id_seq', (SELECT MAX(estado_id) FROM estados));
SELECT setval('roles_rol_id_seq', (SELECT MAX(rol_id) FROM roles));
SELECT setval('proveedores_proveedor_id_seq', (SELECT MAX(proveedor_id) FROM proveedores));
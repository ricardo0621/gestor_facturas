-- ═══════════════════════════════════════════════════════
-- MIGRACIÓN: Usuario Admin INTEGER → UUID
-- ═══════════════════════════════════════════════════════
-- 
-- PROBLEMA: El usuario admin tiene usuario_id = 1 (INTEGER)
-- pero la tabla usa UUID como tipo de dato.
--
-- SOLUCIÓN: Crear nuevo usuario con UUID y transferir datos
-- ═══════════════════════════════════════════════════════

BEGIN;

-- 1. Verificar usuario actual con ID 1
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM usuarios WHERE usuario_id = 1) INTO admin_exists;
    
    IF NOT admin_exists THEN
        RAISE NOTICE '✅ No hay usuario con ID 1. Migración no necesaria.';
        ROLLBACK;
        RETURN;
    END IF;
    
    RAISE NOTICE '📋 Usuario con ID 1 encontrado. Iniciando migración...';
END $$;

-- 2. Crear nuevo usuario con UUID
INSERT INTO usuarios (
    usuario_id, nombre, email, password_hash, 
    tipo_documento, numero_documento, area, cargo, activo, fecha_creacion
)
SELECT 
    gen_random_uuid(),  -- Generar nuevo UUID
    nombre,
    email || '.migrating',  -- Email temporal
    password_hash,
    tipo_documento,
    numero_documento,
    area,
    cargo,
    activo,
    fecha_creacion
FROM usuarios
WHERE usuario_id = 1;

-- 3. Obtener el nuevo UUID generado
DO $$
DECLARE
    new_uuid UUID;
    old_id INTEGER := 1;
BEGIN
    SELECT usuario_id INTO new_uuid 
    FROM usuarios 
    WHERE email LIKE '%.migrating';
    
    RAISE NOTICE '🆔 Nuevo UUID: %', new_uuid;
    
    -- 4. Copiar roles
    INSERT INTO usuario_roles (usuario_id, rol_id)
    SELECT new_uuid, rol_id 
    FROM usuario_roles 
    WHERE usuario_id = old_id;
    
    RAISE NOTICE '✓ Roles copiados';
    
    -- 5. Actualizar referencias en facturas
    UPDATE facturas 
    SET usuario_creacion_id = new_uuid 
    WHERE usuario_creacion_id = old_id;
    
    RAISE NOTICE '✓ Facturas actualizadas';
    
    -- 6. Actualizar referencias en factura_historial
    UPDATE factura_historial 
    SET usuario_id = new_uuid 
    WHERE usuario_id = old_id;
    
    RAISE NOTICE '✓ Historial actualizado';
    
    -- 7. Actualizar referencias en factura_documentos
    UPDATE factura_documentos 
    SET usuario_carga_id = new_uuid 
    WHERE usuario_carga_id = old_id;
    
    RAISE NOTICE '✓ Documentos actualizados';
    
    -- 8. Eliminar usuario viejo
    DELETE FROM usuario_roles WHERE usuario_id = old_id;
    DELETE FROM usuarios WHERE usuario_id = old_id;
    
    RAISE NOTICE '✓ Usuario viejo eliminado';
    
    -- 9. Restaurar email original
    UPDATE usuarios 
    SET email = REPLACE(email, '.migrating', '') 
    WHERE usuario_id = new_uuid;
    
    RAISE NOTICE '✓ Email restaurado';
    RAISE NOTICE '✅ Migración completada! Nuevo UUID: %', new_uuid;
END $$;

COMMIT;

-- Verificar resultado
SELECT usuario_id, email, nombre 
FROM usuarios 
WHERE email NOT LIKE '%.migrating'
ORDER BY fecha_creacion
LIMIT 5;

-- ═══════════════════════════════════════════════════════
-- CREAR TABLA tipos_soporte
-- ═══════════════════════════════════════════════════════

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

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tabla tipos_soporte creada exitosamente';
    RAISE NOTICE 'Total de tipos de soporte: %', (SELECT COUNT(*) FROM tipos_soporte);
END $$;

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

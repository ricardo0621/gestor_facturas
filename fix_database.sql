-- ============================================
-- SCRIPT DE CORRECCIÓN PARA GESTOR DE FACTURAS
-- ============================================
-- Ejecutar este script en pgAdmin o en la consola de PostgreSQL

-- 1. Conectarse a la base de datos gestor_facturas
\c gestor_facturas

-- 2. Hacer que la columna documento_path sea nullable
ALTER TABLE facturas 
ALTER COLUMN documento_path DROP NOT NULL;

-- 3. Verificar que el cambio se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'facturas' 
  AND column_name = 'documento_path';

-- 4. Mensaje de confirmación
SELECT '✅ Corrección aplicada exitosamente. La columna documento_path ahora es nullable.' AS resultado;

-- ============================================
-- INFORMACIÓN ADICIONAL
-- ============================================
-- Esta corrección es necesaria porque el sistema ahora usa
-- la tabla documentos_factura para almacenar múltiples documentos
-- por factura, en lugar de usar la columna documento_path.

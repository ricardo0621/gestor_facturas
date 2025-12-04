-- ============================================
-- VERIFICACIÓN Y CORRECCIÓN DE LA BASE DE DATOS
-- ============================================

-- 1. Verificar el estado actual de la columna documento_path
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'facturas' 
  AND column_name = 'documento_path';

-- Si is_nullable = 'NO', ejecutar la corrección:

ALTER TABLE facturas 
ALTER COLUMN documento_path DROP NOT NULL;

-- Verificar nuevamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'facturas' 
  AND column_name = 'documento_path';

-- Debería mostrar is_nullable = 'YES'

SELECT '✅ Corrección completada. La columna documento_path ahora es nullable.' AS resultado;

-- Script para actualizar la tabla proveedores con las columnas necesarias
-- y corregir el nombre de la columna de ID

-- 1. Agregar columnas faltantes a la tabla proveedores
ALTER TABLE proveedores 
ADD COLUMN IF NOT EXISTS direccion VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Renombrar proveedor_id a id para que coincida con el controlador
-- Primero verificamos si existe la columna id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proveedores' AND column_name = 'id'
    ) THEN
        ALTER TABLE proveedores RENAME COLUMN proveedor_id TO id;
    END IF;
END $$;

-- 3. Verificar el resultado
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'proveedores'
ORDER BY ordinal_position;

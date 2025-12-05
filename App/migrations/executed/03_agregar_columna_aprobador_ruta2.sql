-- =====================================================
-- Script: Agregar Campo de Aprobador Asignado
-- Descripción: Agrega columna para almacenar el usuario
--              aprobador asignado de Ruta 2
-- Fecha: 2025-12-04
-- =====================================================

-- Agregar columna para almacenar el usuario aprobador asignado de Ruta 2
ALTER TABLE facturas 
ADD COLUMN usuario_aprobador_ruta2_id INTEGER REFERENCES usuarios(usuario_id);

-- Agregar comentario a la columna
COMMENT ON COLUMN facturas.usuario_aprobador_ruta2_id IS 'Usuario específico de Ruta 2 asignado para aprobar esta factura';

-- Crear índice para mejorar consultas de filtrado
CREATE INDEX idx_facturas_aprobador_ruta2 ON facturas(usuario_aprobador_ruta2_id);

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'facturas' AND column_name = 'usuario_aprobador_ruta2_id';

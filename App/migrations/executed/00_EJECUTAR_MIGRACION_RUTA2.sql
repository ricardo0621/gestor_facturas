-- =====================================================
-- Script Maestro: Migración Ruta 2 Especializada
-- Descripción: Ejecuta todas las migraciones necesarias
--              para implementar Ruta 2 especializada
-- Fecha: 2025-12-04
-- =====================================================

-- IMPORTANTE: Ejecutar este script en orden
-- Asegúrate de tener backup de la base de datos antes de ejecutar

BEGIN;

-- =====================================================
-- 1. CREAR NUEVOS ROLES
-- =====================================================
\echo '=== Creando nuevos roles de Ruta 2 ==='

INSERT INTO roles (codigo, nombre, descripcion) VALUES
('RUTA_2_CONTROL_INTERNO', 'Control Interno', 'Aprobador de Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'Dirección Médica', 'Aprobador de Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'Dirección Financiera', 'Aprobador de Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'Dirección Administrativa', 'Aprobador de Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'Dirección General', 'Aprobador de Dirección General');

\echo '✓ Roles creados correctamente'

-- =====================================================
-- 2. CREAR NUEVOS ESTADOS
-- =====================================================
\echo '=== Creando nuevos estados de Ruta 2 ==='

INSERT INTO estados (codigo, nombre, descripcion) VALUES
('RUTA_2_CONTROL_INTERNO', 'En Control Interno', 'Pendiente de aprobación por Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'En Dirección Médica', 'Pendiente de aprobación por Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'En Dirección Financiera', 'Pendiente de aprobación por Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'En Dirección Administrativa', 'Pendiente de aprobación por Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'En Dirección General', 'Pendiente de aprobación por Dirección General');

\echo '✓ Estados creados correctamente'

-- =====================================================
-- 3. AGREGAR COLUMNA DE APROBADOR ASIGNADO
-- =====================================================
\echo '=== Agregando columna usuario_aprobador_ruta2_id ==='

ALTER TABLE facturas 
ADD COLUMN usuario_aprobador_ruta2_id INTEGER REFERENCES usuarios(usuario_id);

COMMENT ON COLUMN facturas.usuario_aprobador_ruta2_id IS 'Usuario específico de Ruta 2 asignado para aprobar esta factura';

CREATE INDEX idx_facturas_aprobador_ruta2 ON facturas(usuario_aprobador_ruta2_id);

\echo '✓ Columna agregada correctamente'

-- =====================================================
-- 4. VERIFICACIÓN
-- =====================================================
\echo '=== Verificando cambios ==='

\echo 'Roles creados:'
SELECT codigo, nombre FROM roles WHERE codigo LIKE 'RUTA_2_%' ORDER BY codigo;

\echo 'Estados creados:'
SELECT codigo, nombre FROM estados WHERE codigo LIKE 'RUTA_2_%' ORDER BY codigo;

\echo 'Columna agregada:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'facturas' AND column_name = 'usuario_aprobador_ruta2_id';

-- =====================================================
-- 5. COMMIT
-- =====================================================
COMMIT;

\echo '=== ✓ Migración completada exitosamente ==='

-- =====================================================
-- Script: Crear Nuevos Roles de Ruta 2
-- Descripción: Agrega roles específicos para diferentes
--              áreas de aprobación en Ruta 2
-- Fecha: 2025-12-04
-- =====================================================

-- Insertar nuevos roles de Ruta 2
INSERT INTO roles (codigo, nombre, descripcion) VALUES
('RUTA_2_CONTROL_INTERNO', 'Control Interno', 'Aprobador de Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'Dirección Médica', 'Aprobador de Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'Dirección Financiera', 'Aprobador de Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'Dirección Administrativa', 'Aprobador de Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'Dirección General', 'Aprobador de Dirección General');

-- Verificar que se insertaron correctamente
SELECT * FROM roles WHERE codigo LIKE 'RUTA_2_%' ORDER BY codigo;

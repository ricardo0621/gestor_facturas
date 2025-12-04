-- =====================================================
-- Script: Crear Nuevos Estados de Ruta 2
-- Descripción: Agrega estados específicos para cada
--              área de aprobación en Ruta 2
-- Fecha: 2025-12-04
-- =====================================================

-- Insertar nuevos estados específicos de Ruta 2
INSERT INTO estados (codigo, nombre, descripcion) VALUES
('RUTA_2_CONTROL_INTERNO', 'En Control Interno', 'Pendiente de aprobación por Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'En Dirección Médica', 'Pendiente de aprobación por Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'En Dirección Financiera', 'Pendiente de aprobación por Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'En Dirección Administrativa', 'Pendiente de aprobación por Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'En Dirección General', 'Pendiente de aprobación por Dirección General');

-- Verificar que se insertaron correctamente
SELECT * FROM estados WHERE codigo LIKE 'RUTA_2_%' ORDER BY codigo;

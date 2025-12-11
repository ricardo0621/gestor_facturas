/**
 * Servicio de Tipos de Soporte
 * Encapsula todas las operaciones relacionadas con tipos de soporte
 */

import { fetchAPI } from './api.service.js';

/**
 * Listar tipos de soporte
 * @param {boolean} soloActivos - Si solo listar activos
 */
export async function listarTiposSoporte(soloActivos = true) {
    const url = soloActivos ? '/tipos-soporte' : '/tipos-soporte?activos=false';
    const response = await fetchAPI(url);
    return response.json();
}

/**
 * Obtener tipo de soporte por ID
 */
export async function obtenerTipoSoporte(id) {
    const response = await fetchAPI(`/tipos-soporte/${id}`);
    return response.json();
}

/**
 * Crear nuevo tipo de soporte
 */
export async function crearTipoSoporte(data) {
    const response = await fetchAPI('/tipos-soporte', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Actualizar tipo de soporte
 */
export async function actualizarTipoSoporte(id, data) {
    const response = await fetchAPI(`/tipos-soporte/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Eliminar (desactivar) tipo de soporte
 */
export async function eliminarTipoSoporte(id) {
    const response = await fetchAPI(`/tipos-soporte/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

/**
 * Activar/Desactivar tipo de soporte
 */
export async function toggleTipoSoporte(id, activo) {
    const response = await fetchAPI(`/tipos-soporte/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo })
    });
    return response.json();
}

/**
 * Obtener tipos activos para dropdown
 */
export async function obtenerTiposActivos() {
    const data = await listarTiposSoporte(true);
    return data.tipos || [];
}

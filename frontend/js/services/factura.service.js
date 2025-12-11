/**
 * Servicio de Facturas
 * Encapsula todas las operaciones relacionadas con facturas
 */

import { fetchAPI } from './api.service.js';

/**
 * Listar facturas con filtros opcionales
 */
export async function listarFacturas(filtros = {}) {
    const params = new URLSearchParams();

    Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
            params.append(key, filtros[key]);
        }
    });

    const queryString = params.toString();
    const url = queryString ? `/facturas?${queryString}` : '/facturas';

    const response = await fetchAPI(url);
    return response.json();
}

/**
 * Obtener factura por ID
 */
export async function obtenerFactura(id) {
    const response = await fetchAPI(`/facturas/${id}`);
    return response.json();
}

/**
 * Obtener historial de factura
 */
export async function obtenerHistorial(id) {
    const response = await fetchAPI(`/facturas/${id}/historial`);
    return response.json();
}

/**
 * Obtener documentos de factura
 */
export async function obtenerDocumentos(id) {
    const response = await fetchAPI(`/facturas/${id}/documentos`);
    return response.json();
}

/**
 * Obtener estadísticas
 */
export async function obtenerEstadisticas() {
    const response = await fetchAPI('/facturas/estadisticas');
    return response.json();
}

/**
 * Contar facturas pendientes
 */
export async function contarPendientes() {
    const response = await fetchAPI('/facturas/pendientes/count');
    return response.json();
}

/**
 * Procesar estado de factura
 */
export async function procesarEstado(id, data) {
    const response = await fetchAPI(`/facturas/${id}/procesar`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Procesar estado con documento
 */
export async function procesarEstadoConDocumento(id, formData) {
    const response = await fetchAPI(`/facturas/${id}/procesar-con-documento`, {
        method: 'POST',
        body: formData,
        isFormData: true
    });
    return response.json();
}

/**
 * Agregar documento a factura
 */
export async function agregarDocumento(id, formData) {
    const response = await fetchAPI(`/facturas/${id}/documentos`, {
        method: 'POST',
        body: formData,
        isFormData: true
    });
    return response.json();
}

/**
 * Eliminar documento
 */
export async function eliminarDocumento(facturaId, documentoId) {
    const response = await fetchAPI(`/facturas/${facturaId}/documentos/${documentoId}`, {
        method: 'DELETE'
    });
    return response.json();
}

/**
 * Descargar documento
 */
export function descargarDocumento(facturaId, documentoId) {
    window.open(`/api/facturas/${facturaId}/documentos/${documentoId}/descargar`, '_blank');
}

/**
 * Eliminar factura
 */
export async function eliminarFactura(id) {
    const response = await fetchAPI(`/facturas/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

/**
 * Búsqueda avanzada
 */
export async function busquedaAvanzada(filtros) {
    return listarFacturas(filtros);
}

/**
 * Corregir factura (Ruta 1)
 */
export async function corregirFactura(id, data) {
    const response = await fetchAPI(`/facturas/${id}/corregir`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Servicio de Proveedores
 * Encapsula todas las operaciones relacionadas con proveedores
 */

import { fetchAPI } from './api.service.js';

/**
 * Listar todos los proveedores
 */
export async function listarProveedores() {
    const response = await fetchAPI('/proveedores');
    return response.json();
}

/**
 * Obtener proveedor por ID
 */
export async function obtenerProveedor(id) {
    const response = await fetchAPI(`/proveedores/${id}`);
    return response.json();
}

/**
 * Buscar proveedor por NIT
 */
export async function buscarPorNit(nit) {
    const response = await fetchAPI(`/proveedores/nit/${nit}`);
    return response.json();
}

/**
 * Crear nuevo proveedor
 */
export async function crearProveedor(data) {
    const response = await fetchAPI('/proveedores', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Actualizar proveedor
 */
export async function actualizarProveedor(id, data) {
    const response = await fetchAPI(`/proveedores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Eliminar proveedor
 */
export async function eliminarProveedor(id) {
    const response = await fetchAPI(`/proveedores/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

/**
 * Activar/Desactivar proveedor
 */
export async function toggleProveedor(id, activo) {
    const response = await fetchAPI(`/proveedores/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: activo })
    });
    return response.json();
}

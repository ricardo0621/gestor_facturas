/**
 * Servicio de Usuarios
 * Encapsula todas las operaciones relacionadas con usuarios
 */

import { fetchAPI } from './api.service.js';

/**
 * Listar todos los usuarios
 */
export async function listarUsuarios() {
    const response = await fetchAPI('/usuarios');
    return response.json();
}

/**
 * Obtener usuario por ID
 */
export async function obtenerUsuario(id) {
    const response = await fetchAPI(`/usuarios/${id}`);
    return response.json();
}

/**
 * Crear nuevo usuario
 */
export async function crearUsuario(data) {
    const response = await fetchAPI('/usuarios', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Actualizar usuario
 */
export async function actualizarUsuario(id, data) {
    const response = await fetchAPI(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Desactivar usuario
 */
export async function desactivarUsuario(id) {
    const response = await fetchAPI(`/usuarios/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

/**
 * Activar usuario
 */
export async function activarUsuario(id) {
    const response = await fetchAPI(`/usuarios/${id}/activar`, {
        method: 'PATCH'
    });
    return response.json();
}

/**
 * Asignar roles a usuario
 */
export async function asignarRoles(id, rolesIds) {
    const response = await fetchAPI(`/usuarios/${id}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roles_ids: rolesIds })
    });
    return response.json();
}

/**
 * Listar todos los roles disponibles
 */
export async function listarRoles() {
    const response = await fetchAPI('/roles');
    return response.json();
}

/**
 * Cambiar contraseña
 */
export async function cambiarContrasena(id, data) {
    const response = await fetchAPI(`/usuarios/${id}/cambiar-contrasena`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Utilidades de Autenticación
 */

import { CONFIG } from '../config/config.js';

export function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
}

export function isAuthenticated() {
    return !!getToken();
}

export function getCurrentUser() {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            nombre: payload.nombre,
            usuario_id: payload.usuario_id,
            roles: payload.roles
        };
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
}

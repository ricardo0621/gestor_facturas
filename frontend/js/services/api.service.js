/**
 * Servicio de API - Wrapper para fetch
 */

import { CONFIG } from '../config/config.js';
import { getToken, removeToken } from '../utils/auth.js';

/**
 * Realizar petición a la API
 */
export async function fetchAPI(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        removeToken();
        window.location.reload();
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    return response;
}

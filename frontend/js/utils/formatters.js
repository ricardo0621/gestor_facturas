/**
 * Utilidades de Formateo
 */

import { TIMEZONE } from '../config/config.js';

/**
 * Formatear fecha a formato colombiano con hora 12h
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

/**
 * Formatear moneda colombiana
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

/**
 * Obtener clase de badge según estado
 */
export function getEstadoBadgeClass(estadoCodigo) {
    if (!estadoCodigo) return 'badge-secondary';

    if (estadoCodigo === 'FINALIZADA') return 'badge-success';
    if (estadoCodigo === 'ANULADA') return 'badge-error';
    if (estadoCodigo === 'RUTA_1') return 'badge-warning';
    return 'badge-info';
}

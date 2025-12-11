/**
 * Componente de Badge (Insignias de Estado)
 * Genera badges con estilos consistentes
 */

/**
 * Crear badge HTML
 * @param {string} text - Texto del badge
 * @param {string} type - Tipo: success, error, warning, info, secondary
 * @returns {string} HTML del badge
 */
export function createBadge(text, type = 'secondary') {
    return `<span class="badge badge-${type}">${text}</span>`;
}

/**
 * Crear badge de estado de factura
 * @param {string} estadoCodigo - Código del estado
 * @param {string} estadoNombre - Nombre del estado
 * @returns {string} HTML del badge
 */
export function createEstadoBadge(estadoCodigo, estadoNombre) {
    const badgeClass = getEstadoBadgeClass(estadoCodigo);
    return `<span class="badge badge-${badgeClass}">${estadoNombre}</span>`;
}

/**
 * Obtener clase de badge según estado
 * @param {string} estadoCodigo - Código del estado
 * @returns {string} Clase CSS del badge
 */
function getEstadoBadgeClass(estadoCodigo) {
    const estadoMap = {
        'RUTA_1': 'warning',
        'RUTA_2_DIRECCION_ADMINISTRATIVA': 'info',
        'RUTA_2_DIRECCION_FINANCIERA': 'info',
        'RUTA_2_DIRECCION_MEDICA': 'info',
        'RUTA_2_CONTROL_INTERNO': 'info',
        'RUTA_3': 'primary',
        'RUTA_4': 'primary',
        'FINALIZADA': 'success',
        'ANULADA': 'error'
    };

    return estadoMap[estadoCodigo] || 'secondary';
}

/**
 * Crear badge de estado activo/inactivo
 * @param {boolean} activo - Si está activo
 * @returns {string} HTML del badge
 */
export function createActivoBadge(activo) {
    return activo
        ? '<span class="badge badge-success">Activo</span>'
        : '<span class="badge badge-error">Inactivo</span>';
}

/**
 * Crear badge con contador
 * @param {string} label - Etiqueta
 * @param {number} count - Contador
 * @param {string} type - Tipo de badge
 * @returns {string} HTML del badge con contador
 */
export function createCountBadge(label, count, type = 'primary') {
    return `
        <span class="badge badge-${type}" style="display: inline-flex; align-items: center; gap: 0.5rem;">
            ${label}
            <span style="background: rgba(255,255,255,0.2); padding: 0.125rem 0.5rem; border-radius: 1rem; font-weight: bold;">
                ${count}
            </span>
        </span>
    `;
}

/**
 * Crear grupo de badges
 * @param {Array} badges - Array de {text, type}
 * @returns {string} HTML de badges agrupados
 */
export function createBadgeGroup(badges) {
    return `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${badges.map(b => createBadge(b.text, b.type)).join('')}
        </div>
    `;
}

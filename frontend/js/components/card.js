/**
 * Componente de Card (Tarjetas)
 * Genera cards reutilizables con header, body y footer
 */

/**
 * Crear card HTML
 * @param {Object} config - Configuración del card
 * @returns {string} HTML del card
 */
export function createCard(config) {
    const {
        title,
        subtitle,
        content,
        footer,
        headerActions,
        className = ''
    } = config;

    const headerHTML = title ? `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                ${title ? `<h2 class="card-title">${title}</h2>` : ''}
                ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
            </div>
            ${headerActions ? `<div>${headerActions}</div>` : ''}
        </div>
    ` : '';

    const footerHTML = footer ? `
        <div class="card-footer">
            ${footer}
        </div>
    ` : '';

    return `
        <div class="card ${className}">
            ${headerHTML}
            <div class="card-body">
                ${content}
            </div>
            ${footerHTML}
        </div>
    `;
}

/**
 * Crear card de estadística
 * @param {string} label - Etiqueta
 * @param {string|number} value - Valor
 * @param {string} icon - Icono (opcional)
 * @returns {string} HTML del stat card
 */
export function createStatCard(label, value, icon = '') {
    return `
        <div class="stat-card">
            ${icon ? `<div class="stat-icon">${icon}</div>` : ''}
            <div class="stat-label">${label}</div>
            <div class="stat-value">${value}</div>
        </div>
    `;
}

/**
 * Crear grid de cards
 * @param {Array} cards - Array de configuraciones de cards
 * @param {number} columns - Número de columnas
 * @returns {string} HTML del grid
 */
export function createCardGrid(cards, columns = 3) {
    const cardsHTML = cards.map(card => createCard(card)).join('');

    return `
        <div class="grid grid-cols-${columns}">
            ${cardsHTML}
        </div>
    `;
}

/**
 * Crear card con loading
 * @param {string} message - Mensaje de carga
 * @returns {string} HTML del card con spinner
 */
export function createLoadingCard(message = 'Cargando...') {
    return `
        <div class="card">
            <div class="card-body text-center" style="padding: 2rem;">
                <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto 1rem;"></div>
                <p>${message}</p>
            </div>
        </div>
    `;
}

/**
 * Crear card de error
 * @param {string} message - Mensaje de error
 * @returns {string} HTML del card de error
 */
export function createErrorCard(message) {
    return `
        <div class="card">
            <div class="card-body text-center" style="padding: 2rem; color: var(--color-error);">
                <p>⚠️ ${message}</p>
            </div>
        </div>
    `;
}

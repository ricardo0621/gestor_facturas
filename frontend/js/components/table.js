/**
 * Componente de Tabla Genérica
 * Genera tablas HTML reutilizables con configuración flexible
 */

/**
 * Crear tabla HTML genérica
 * @param {Object} config - Configuración de la tabla
 * @param {Array} config.columns - Array de columnas [{key, label, render}]
 * @param {Array} config.data - Array de datos a mostrar
 * @param {Object} config.actions - Acciones por fila {label, onClick, className}
 * @param {string} config.emptyMessage - Mensaje cuando no hay datos
 * @returns {string} HTML de la tabla
 */
export function createTable(config) {
    const { columns, data, actions, emptyMessage = 'No hay datos para mostrar' } = config;

    if (!data || data.length === 0) {
        return `
            <div class="text-center" style="padding: 2rem; color: var(--color-text-secondary);">
                <p>${emptyMessage}</p>
            </div>
        `;
    }

    // Generar encabezados
    const headers = columns.map(col => `<th>${col.label}</th>`).join('');
    const actionsHeader = actions ? '<th>Acciones</th>' : '';

    // Generar filas
    const rows = data.map((item, index) => {
        const cells = columns.map(col => {
            const value = col.render
                ? col.render(item[col.key], item, index)
                : item[col.key] || '-';
            return `<td>${value}</td>`;
        }).join('');

        const actionButtons = actions
            ? `<td>${renderActions(actions, item, index)}</td>`
            : '';

        return `<tr>${cells}${actionButtons}</tr>`;
    }).join('');

    return `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>${headers}${actionsHeader}</tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Renderizar botones de acción
 */
function renderActions(actions, item, index) {
    if (Array.isArray(actions)) {
        return actions.map(action => {
            const className = action.className || 'btn btn-sm btn-primary';
            const onClick = action.onClick
                ? `onclick="${action.onClick}('${item.id || index}')"`
                : '';
            const label = typeof action.label === 'function'
                ? action.label(item)
                : action.label;

            return `<button class="${className}" ${onClick}>${label}</button>`;
        }).join(' ');
    }
    return '';
}

/**
 * Crear tabla simple (sin configuración compleja)
 * @param {Array} headers - Array de strings con nombres de columnas
 * @param {Array} rows - Array de arrays con datos
 */
export function createSimpleTable(headers, rows) {
    const headerHTML = headers.map(h => `<th>${h}</th>`).join('');
    const rowsHTML = rows.map(row => {
        const cells = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    return `
        <div class="table-container">
            <table class="table">
                <thead><tr>${headerHTML}</tr></thead>
                <tbody>${rowsHTML}</tbody>
            </table>
        </div>
    `;
}

/**
 * Agregar paginación a una tabla
 * @param {string} containerId - ID del contenedor
 * @param {Array} allData - Todos los datos
 * @param {number} itemsPerPage - Items por página
 * @param {Function} renderFunction - Función para renderizar
 */
export function addPagination(containerId, allData, itemsPerPage, renderFunction) {
    const totalPages = Math.ceil(allData.length / itemsPerPage);
    let currentPage = 1;

    function render(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = allData.slice(start, end);

        renderFunction(pageData);
        renderPaginationControls(page, totalPages);
    }

    function renderPaginationControls(page, total) {
        const container = document.getElementById(containerId);
        const paginationHTML = `
            <div class="pagination" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-sm" ${page === 1 ? 'disabled' : ''} onclick="window.goToPage(${page - 1})">
                    ← Anterior
                </button>
                <span style="padding: 0.5rem 1rem;">Página ${page} de ${total}</span>
                <button class="btn btn-sm" ${page === total ? 'disabled' : ''} onclick="window.goToPage(${page + 1})">
                    Siguiente →
                </button>
            </div>
        `;

        const existingPagination = container.querySelector('.pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        container.insertAdjacentHTML('beforeend', paginationHTML);
    }

    window.goToPage = function (page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            render(currentPage);
        }
    };

    render(currentPage);
}

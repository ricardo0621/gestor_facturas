/**
 * Utilidades para Formularios
 * Funciones helper para crear y validar formularios
 */

/**
 * Crear campo de formulario
 * @param {Object} config - Configuración del campo
 * @returns {string} HTML del campo
 */
export function createFormField(config) {
    const {
        type = 'text',
        id,
        name,
        label,
        placeholder = '',
        required = false,
        value = '',
        options = [], // Para select
        className = 'form-input'
    } = config;

    const requiredAttr = required ? 'required' : '';
    const requiredLabel = required ? ' *' : '';

    if (type === 'select') {
        return `
            <div class="form-group">
                <label class="form-label" for="${id}">${label}${requiredLabel}</label>
                <select id="${id}" name="${name}" class="form-select" ${requiredAttr}>
                    <option value="">Seleccionar...</option>
                    ${options.map(opt => `
                        <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
                            ${opt.label}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    if (type === 'textarea') {
        return `
            <div class="form-group">
                <label class="form-label" for="${id}">${label}${requiredLabel}</label>
                <textarea 
                    id="${id}" 
                    name="${name}" 
                    class="${className}" 
                    placeholder="${placeholder}"
                    ${requiredAttr}
                >${value}</textarea>
            </div>
        `;
    }

    return `
        <div class="form-group">
            <label class="form-label" for="${id}">${label}${requiredLabel}</label>
            <input 
                type="${type}" 
                id="${id}" 
                name="${name}" 
                class="${className}" 
                placeholder="${placeholder}"
                value="${value}"
                ${requiredAttr}
            >
        </div>
    `;
}

/**
 * Crear formulario completo
 * @param {Object} config - Configuración del formulario
 * @returns {string} HTML del formulario
 */
export function createForm(config) {
    const {
        id,
        fields,
        submitLabel = 'Guardar',
        cancelLabel = 'Cancelar',
        onCancel = 'hideModal()',
        gridColumns = 1
    } = config;

    const fieldsHTML = fields.map(field => createFormField(field)).join('');
    const gridStyle = gridColumns > 1 ? `style="display: grid; grid-template-columns: repeat(${gridColumns}, 1fr); gap: 1rem;"` : '';

    return `
        <form id="${id}">
            <div ${gridStyle}>
                ${fieldsHTML}
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="${onCancel}">
                    ${cancelLabel}
                </button>
                <button type="submit" class="btn btn-primary">
                    ${submitLabel}
                </button>
            </div>
        </form>
    `;
}

/**
 * Obtener datos del formulario
 * @param {string} formId - ID del formulario
 * @returns {Object} Datos del formulario
 */
export function getFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    return data;
}

/**
 * Validar formulario
 * @param {string} formId - ID del formulario
 * @returns {boolean} Si es válido
 */
export function validateForm(formId) {
    const form = document.getElementById(formId);
    return form.checkValidity();
}

/**
 * Limpiar formulario
 * @param {string} formId - ID del formulario
 */
export function clearForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
}

/**
 * Establecer valores en formulario
 * @param {string} formId - ID del formulario
 * @param {Object} data - Datos a establecer
 */
export function setFormData(formId, data) {
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = data[key];
        }
    });
}

/**
 * Deshabilitar formulario
 * @param {string} formId - ID del formulario
 * @param {boolean} disabled - Si deshabilitar
 */
export function disableForm(formId, disabled = true) {
    const form = document.getElementById(formId);
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = disabled;
    }
}

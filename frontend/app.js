// ============================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ============================================

const API_BASE_URL = '/api';
let currentUser = null;
let currentView = 'login';

// ============================================
// UTILIDADES
// ============================================

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

async function fetchAPI(endpoint, options = {}) {
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        removeToken();
        showLogin();
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    return response;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.25s reverse';
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';

    // Crear fecha desde el string (que viene en UTC desde PostgreSQL)
    const date = new Date(dateString);

    // Formatear directamente en zona horaria de Colombia
    return new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

function getEstadoBadgeClass(estadoCodigo) {
    if (!estadoCodigo) return 'badge-secondary';

    if (estadoCodigo === 'FINALIZADA') return 'badge-success';
    if (estadoCodigo === 'ANULADA') return 'badge-error';
    if (estadoCodigo === 'RUTA_1') return 'badge-warning'; // En corrección
    return 'badge-info'; // En proceso (Ruta 2, 3, 4)
}

// ============================================
// MODAL
// ============================================

function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.add('active');
}

function hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
}

// ============================================
// AUTENTICACIÓN
// ============================================

function showLogin() {
    currentView = 'login';
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('mainContainer').innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                <h1 class="login-title">Gestor Facturas SAN FRANCISCO</h1>
                    <p class="login-subtitle">Inicia sesión para continuar</p>
                </div>
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label" for="email">Correo Electrónico</label>
                        <input type="email" id="email" class="form-input" placeholder="correo" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">Contraseña</label>
                        <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Iniciar Sesión</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            setToken(data.token);
            currentUser = data.usuario;
            showToast('Inicio de sesión exitoso', 'success');
            showDashboard();
        } else {
            showToast(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
    }
}

function handleLogout() {
    removeToken();
    currentUser = null;
    showToast('Sesión cerrada exitosamente', 'info');
    showLogin();
}

// ============================================
// DASHBOARD
// ============================================

async function showDashboard() {
    currentView = 'dashboard';
    document.getElementById('navbar').style.display = 'block';
    updateNavigation();

    // Renderizar estructura base inmediatamente
    document.getElementById('mainContainer').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h1 class="card-title">Gestión de Facturas</h1>
                <p class="card-subtitle">Resumen general del sistema de facturas</p>
            </div>
            <div class="grid grid-cols-3">
                <div class="stat-card">
                    <div class="stat-label">Total Facturas</div>
                    <div class="stat-value" id="stat-total">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Finalizadas</div>
                    <div class="stat-value" id="stat-finalizadas">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Anuladas</div>
                    <div class="stat-value" id="stat-anuladas">-</div>
                </div>
            </div>
        </div>

        <div class="card mt-4">
            <div class="card-header">
                <h2 class="card-title">Facturas Recientes</h2>
            </div>
            <div id="recentInvoices">
                <div class="text-center" style="padding: 2rem;">
                    <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto;"></div>
                </div>
            </div>
        </div>
    `;

    try {
        // Cargar estadísticas
        const response = await fetchAPI('/facturas/estadisticas');
        const data = await response.json();
        const stats = data.estadisticas;

        // Actualizar valores
        document.getElementById('stat-total').textContent = stats.total || 0;
        document.getElementById('stat-finalizadas').textContent = stats.finalizadas || 0;
        document.getElementById('stat-anuladas').textContent = stats.anuladas || 0;

        // Cargar facturas recientes
        loadRecentInvoices();
    } catch (error) {
        console.error('Error en dashboard:', error);
        showToast('Error al cargar estadísticas', 'error');

        // Poner ceros si falla
        document.getElementById('stat-total').textContent = '0';
        document.getElementById('stat-finalizadas').textContent = '0';
        document.getElementById('stat-anuladas').textContent = '0';
        document.getElementById('recentInvoices').innerHTML = '<p class="text-center error-text">No se pudo cargar la información</p>';
    }
}

async function loadRecentInvoices() {
    try {
        const response = await fetchAPI('/facturas');

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error loading recent invoices:', errorData);
            throw new Error(errorData.error || errorData.details || 'Error desconocido');
        }

        const data = await response.json();
        const facturas = data.facturas.slice(0, 5);
        renderInvoiceTable(facturas, 'recentInvoices');
    } catch (error) {
        console.error('Error al cargar facturas recientes:', error);
        document.getElementById('recentInvoices').innerHTML = `
            <p class="text-center error-text">
                Error al cargar facturas: ${error.message}
            </p>
        `;
    }
}

// ============================================
// LISTA DE FACTURAS
// ============================================

async function showFacturas() {
    currentView = 'facturas';
    updateNavigation();

    document.getElementById('mainContainer').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h1 class="card-title">Gestión de Facturas</h1>
                <p class="card-subtitle">Consulta y administra todas las facturas del sistema</p>
            </div>

            <div class="filter-bar">
                <input type="text" id="searchInput" class="form-input" placeholder="Buscar por número o proveedor...">
                <button class="btn btn-primary" onclick="applyFilters()">Filtrar</button>
            </div>

            <div id="facturasTable">
                <div class="text-center" style="padding: 2rem;">
                    <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto;"></div>
                </div>
            </div>
        </div>
    `;

    loadFacturas();
}

async function loadFacturas(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.busqueda) params.append('busqueda', filters.busqueda);

        const response = await fetchAPI(`/facturas?${params.toString()}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData.error || errorData.details || 'Error desconocido');
        }

        const data = await response.json();
        renderInvoiceTable(data.facturas, 'facturasTable');
    } catch (error) {
        console.error('Error al cargar facturas:', error);
        showToast('Error al cargar facturas: ' + error.message, 'error');
        document.getElementById('facturasTable').innerHTML = `
            <p class="text-center" style="padding: 2rem; color: var(--color-error);">
                Error al cargar facturas: ${error.message}
            </p>
        `;
    }
}

function applyFilters() {
    const busqueda = document.getElementById('searchInput').value;
    loadFacturas({ busqueda });
}

function renderInvoiceTable(facturas, containerId) {
    const container = document.getElementById(containerId);

    if (!facturas || facturas.length === 0) {
        container.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--color-text-tertiary);">No se encontraron facturas</p>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Proveedor</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${facturas.map(factura => `
                        <tr>
                            <td><strong>${factura.numero_factura}</strong></td>
                            <td>${factura.proveedor_nombre}</td>
                            <td>${formatCurrency(factura.monto)}</td>
                            <td><span class="badge ${getEstadoBadgeClass(factura.estado_codigo)}">${factura.estado_nombre}</span></td>
                            <td>${formatDate(factura.fecha_emision)}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewInvoiceDetails('${factura.factura_id}')">
                                    Ver Detalles
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============================================
// DETALLES Y ACCIONES
// ============================================

async function viewInvoiceDetails(facturaId) {
    try {
        const [facturaResponse, historialResponse] = await Promise.all([
            fetchAPI(`/facturas/${facturaId}`),
            fetchAPI(`/facturas/${facturaId}/historial`)
        ]);

        const facturaData = await facturaResponse.json();
        const historialData = await historialResponse.json();
        const factura = facturaData.factura;
        const historial = historialData.historial;

        // Cargar documentos
        const documentosHtml = await mostrarDocumentosFactura(facturaId);

        // Determinar acciones disponibles
        const acciones = getAvailableActions(factura);

        const content = `
            <div style="margin-bottom: 1.5rem;">
                <div class="grid grid-cols-2" style="gap: 1rem;">
                    <div><strong>Número:</strong> ${factura.numero_factura}</div>
                    <div><strong>Estado:</strong> <span class="badge ${getEstadoBadgeClass(factura.estado_codigo)}">${factura.estado_nombre}</span></div>
                    <div><strong>NIT:</strong> ${factura.nit_proveedor || 'N/A'}</div>
                    <div><strong>Monto:</strong> ${formatCurrency(factura.monto)}</div>
                    <div style="grid-column: 1 / -1;"><strong>Proveedor:</strong> ${factura.proveedor_nombre}</div>
                    <div style="grid-column: 1 / -1;"><strong>Concepto:</strong> ${factura.concepto || 'N/A'}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Documentos Adjuntos</h3>
                </div>
                ${documentosHtml}
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h3>Historial</h3>
                <div class="timeline">
                    ${historial.map(h => `
                        <div class="timeline-item">
                            <div class="timeline-date">${formatDate(h.fecha_transicion)}</div>
                            <div class="timeline-content">
                                <strong>${h.accion}</strong> - ${h.usuario_nombre}
                                ${h.usuario_cargo || h.usuario_area ? `<span style="color: var(--color-text-tertiary); text-transform: uppercase; font-size: 0.75rem;"> CARGO: ${h.usuario_cargo || 'N/A'}  AREA: ${h.usuario_area || 'N/A'}</span>` : ''}<br>
                                <small>${h.estado_anterior || 'Inicio'} ➔ ${h.estado_nuevo}</small><br>
                                <em>${h.observacion || ''}</em>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="hideModal()">Cerrar</button>
                ${currentUser.roles.includes('SUPER_ADMIN') ?
                `<button class="btn btn-danger" onclick="eliminarFacturaCompleta('${facturaId}')">
                        🗑️ Eliminar Factura
                    </button>` : ''}
                ${factura.estado_codigo === 'RUTA_4' && currentUser.roles.includes('RUTA_4') ?
                `<button class="btn btn-success" onclick="hideModal(); setTimeout(() => showFormularioPago('${facturaId}'), 100)">
                        💳 Marcar como Pagada
                    </button>` : ''}
                ${acciones.map(accion => `
                    <button class="btn ${getActionButtonClass(accion)}" onclick="showActionForm('${facturaId}', '${accion}', '${factura.estado_codigo}')">
                        ${accion}
                    </button>
                `).join('')}
            </div>
        `;

        showModal(`Factura ${factura.numero_factura}`, content);
    } catch (error) {
        console.error(error);
        showToast('Error al cargar detalles', 'error');
    }
}

function getAvailableActions(factura) {
    if (!currentUser || !currentUser.roles) return [];

    const estado = factura.estado_codigo;
    const roles = currentUser.roles;
    const actions = [];

    // Definir roles de Ruta 2
    const rolesRuta2 = [
        'RUTA_2',
        'RUTA_2_CONTROL_INTERNO',
        'RUTA_2_DIRECCION_MEDICA',
        'RUTA_2_DIRECCION_FINANCIERA',
        'RUTA_2_DIRECCION_ADMINISTRATIVA',
        'RUTA_2_DIRECCION_GENERAL'
    ];

    // Definir estados de Ruta 2
    const estadosRuta2 = [
        'RUTA_2',
        'RUTA_2_CONTROL_INTERNO',
        'RUTA_2_DIRECCION_MEDICA',
        'RUTA_2_DIRECCION_FINANCIERA',
        'RUTA_2_DIRECCION_ADMINISTRATIVA',
        'RUTA_2_DIRECCION_GENERAL'
    ];

    // Verificar si el usuario tiene algún rol de Ruta 2
    const tieneRolRuta2 = roles.some(rol => rolesRuta2.includes(rol));

    // Mapa de permisos: Estado -> Rol Requerido
    const permissions = {
        'RUTA_1': 'RUTA_1', // En corrección -> Cargador
        'RUTA_3': 'RUTA_3', // En Contabilidad -> Contador
        'RUTA_4': 'RUTA_4'  // En Tesorería -> Tesorero
    };

    const requiredRole = permissions[estado];

    // Si el usuario tiene el rol requerido para el estado actual
    if (requiredRole && roles.includes(requiredRole)) {
        if (estado === 'RUTA_1') {
            actions.push('CORREGIR');
            actions.push('ANULAR');
        } else {
            actions.push('APROBAR');
            actions.push('RECHAZAR');
        }
    }

    // Si es un estado de Ruta 2 y el usuario tiene rol de Ruta 2
    if (estadosRuta2.includes(estado) && tieneRolRuta2) {
        actions.push('APROBAR');
        actions.push('RECHAZAR');
    }

    return actions;
}

function getActionButtonClass(accion) {
    switch (accion) {
        case 'APROBAR': return 'btn-success';
        case 'RECHAZAR': return 'btn-danger';
        case 'ANULAR': return 'btn-danger';
        case 'CORREGIR': return 'btn-primary';
        default: return 'btn-secondary';
    }
}

function showActionForm(facturaId, accion, estadoActual) {
    // Determinar si se requiere documento de soporte
    const requiereDocumento = (accion === 'APROBAR' && estadoActual === 'RUTA_3');

    const content = `
        <form id="actionForm">
            <div class="form-group">
                <label class="form-label">Acción: <strong>${accion}</strong></label>
            </div>
            
            <div class="form-group">
                <label class="form-label">Observación *</label>
                <textarea id="observacion" class="form-textarea" required placeholder="Ingrese una observación..."></textarea>
            </div>

            ${requiereDocumento ? `
                <div class="form-group">
                    <label class="form-label">Documento de Soporte * <small style="color: var(--color-warning);">(Obligatorio para Contabilidad)</small></label>
                    <input type="file" id="documentoSoporte" class="form-file" style="display: none;" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" required>
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('documentoSoporte').click()">
                        📂 Seleccionar Archivo
                    </button>
                    <div id="archivo-seleccionado" style="margin-top: 0.5rem; color: var(--color-text-secondary); font-size: 0.875rem;"></div>
                </div>
            ` : ''}

            ${accion === 'CORREGIR' ? `
                <div class="form-group">
                    <label class="form-label">Nuevo Documento (Opcional)</label>
                    <input type="file" id="nuevoDocumento" class="form-file" style="display: none;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('nuevoDocumento').click()">
                        📂 Seleccionar Archivo
                    </button>
                </div>
            ` : ''}

            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="viewInvoiceDetails('${facturaId}')">Volver</button>
                <button type="submit" class="btn ${getActionButtonClass(accion)}">Confirmar</button>
            </div>
        </form>
    `;

    showModal(`Confirmar ${accion}`, content);

    // Event listener para mostrar nombre del archivo seleccionado
    if (requiereDocumento) {
        document.getElementById('documentoSoporte').addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || 'Ningún archivo seleccionado';
            document.getElementById('archivo-seleccionado').textContent = `📄 ${fileName}`;
        });
    }

    document.getElementById('actionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await executeAction(facturaId, accion, requiereDocumento);
    });
}

async function executeAction(facturaId, accion, requiereDocumento) {
    const observacion = document.getElementById('observacion').value;

    try {
        let response;

        if (requiereDocumento) {
            // Validar que se haya seleccionado un archivo
            const fileInput = document.getElementById('documentoSoporte');
            if (!fileInput.files || fileInput.files.length === 0) {
                showToast('Debe seleccionar un documento de soporte', 'error');
                return;
            }

            // Usar FormData para enviar archivo + datos
            const formData = new FormData();
            formData.append('accion', accion);
            formData.append('observacion', observacion);
            formData.append('documentoSoporte', fileInput.files[0]);

            response = await fetch(`${API_BASE_URL}/facturas/${facturaId}/estado-con-documento`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });
        } else {
            // Envío normal con JSON
            const body = {
                accion,
                observacion
            };

            response = await fetchAPI(`/facturas/${facturaId}/estado`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        }

        const data = await response.json();

        if (response.ok) {
            showToast('Acción realizada exitosamente', 'success');
            hideModal();
            if (currentView === 'facturas') loadFacturas();
            else showDashboard();
        } else {
            showToast(data.error || 'Error al procesar acción', 'error');
        }
    } catch (error) {
        console.error('Error en executeAction:', error);
        showToast('Error de conexión', 'error');
    }
}

// ============================================
// CARGAR FACTURA
// ============================================



async function showCargarFactura() {
    currentView = 'cargar';
    updateNavigation();

    // Reiniciar archivos seleccionados
    archivosSeleccionados = [];

    // Cargar proveedores para el select
    let proveedoresOptions = '<option value="">Seleccionar...</option>';
    try {
        const response = await fetchAPI('/proveedores');
        if (response.ok) {
            const proveedores = await response.json();
            proveedores.forEach(prov => {
                if (prov.is_active) {
                    proveedoresOptions += `<option value="${prov.nit}">${prov.nombre}</option>`;
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
    }

    // Cargar roles de Ruta 2 para el select (en lugar de usuarios)
    const rolesRuta2Options = `
        <option value="">Seleccionar área...</option>
        <option value="RUTA_2_CONTROL_INTERNO">Control Interno</option>
        <option value="RUTA_2_DIRECCION_MEDICA">Dirección Médica</option>
        <option value="RUTA_2_DIRECCION_FINANCIERA">Dirección Financiera</option>
        <option value="RUTA_2_DIRECCION_ADMINISTRATIVA">Dirección Administrativa</option>
        <option value="RUTA_2_DIRECCION_GENERAL">Dirección General</option>
    `;

    document.getElementById('mainContainer').innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <div class="card-header">
                <h1 class="card-title">Cargar Nueva Factura</h1>
            </div>
            <form id="cargarFacturaForm">
                <div class="grid grid-cols-2">
                    <div class="form-group">
                        <label class="form-label">Número de Factura *</label>
                        <input type="text" id="numeroFactura" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">NIT Proveedor *</label>
                        <select id="nitProveedor" class="form-select" required>
                            ${proveedoresOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha Emisión *</label>
                        <input type="date" id="fechaEmision" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Monto *</label>
                        <input type="number" id="monto" class="form-input" required>
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Área de Aprobación (Ruta 2) *</label>
                        <select id="aprobadorRuta2" class="form-select" required>
                            ${rolesRuta2Options}
                        </select>
                        <small style="display: block; margin-top: 0.5rem; color: var(--color-text-tertiary);">
                            Selecciona el área que debe aprobar esta factura
                        </small>
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Concepto</label>
                        <textarea id="concepto" class="form-textarea"></textarea>
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Documentos *</label>
                        <div class="file-upload-container">
                            <input type="file" id="documentos" class="form-file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" style="display: none;">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('documentos').click()">
                                📂 Seleccionar Archivos
                            </button>
                        </div>
                        <small style="display: block; margin-top: 0.5rem; color: var(--color-text-tertiary);">
                            Selecciona uno o varios archivos. Al menos uno debe ser tipo "Factura".
                        </small>
                        <div id="archivos-lista" style="margin-top: 1rem;"></div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button type="submit" class="btn btn-primary">Cargar Factura</button>
                </div>
            </form>
        </div>
    `;

    // Event listener para carga acumulativa
    document.getElementById('documentos').addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);
        // Filtrar duplicados por nombre
        const existingNames = new Set(archivosSeleccionados.map(f => f.name));
        const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));

        if (uniqueNewFiles.length < newFiles.length) {
            showToast('Algunos archivos ya estaban seleccionados y se omitieron duplicados', 'info');
        }

        archivosSeleccionados = [...archivosSeleccionados, ...uniqueNewFiles];
        renderArchivos();
        e.target.value = ''; // Limpiar input para permitir seleccionar más
    });

    document.getElementById('cargarFacturaForm').addEventListener('submit', handleCargarFactura);
}

function renderArchivos() {
    const container = document.getElementById('archivos-lista');

    if (archivosSeleccionados.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-tertiary); text-align: center;">No hay archivos seleccionados</p>';
        return;
    }

    let html = '<div class="archivos-grid">';
    archivosSeleccionados.forEach((file, index) => {
        html += `
            <div class="archivo-item" id="archivo-${index}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <span class="archivo-nombre" title="${file.name}">📄 ${file.name}</span>
                    <button type="button" class="btn-icon-small" onclick="eliminarArchivo(${index})" style="color: var(--color-error);">
                        ✕
                    </button>
                </div>
                <div style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-bottom: 0.5rem;">
                    ${(file.size / 1024).toFixed(2)} KB
                </div>
                <select id="tipo-${index}" class="form-select archivo-tipo" required>
                    <option value="">Seleccionar tipo...</option>
                    <option value="FACTURA" ${index === 0 && !document.querySelector('.archivo-tipo[value="FACTURA"]') ? 'selected' : ''}>Factura</option>
                    <option value="SOPORTE">Soporte</option>
                    <option value="DISTRIBUCION_GASTO">Distribución de Gasto</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>
        `;
    });
    html += '</div>';
    html += `<p style="margin-top: 1rem; color: var(--color-text-secondary); font-size: 0.875rem;">
        Total de archivos: ${archivosSeleccionados.length}
    </p>`;
    container.innerHTML = html;
}

function eliminarArchivo(index) {
    archivosSeleccionados.splice(index, 1);
    renderArchivos();
}


async function handleCargarFactura(e) {
    e.preventDefault();

    if (archivosSeleccionados.length === 0) {
        showToast('Debes seleccionar al menos un archivo', 'error');
        return;
    }

    // Validar que al menos uno es tipo FACTURA
    let tieneFactura = false;
    const tiposDocumento = [];

    for (let i = 0; i < archivosSeleccionados.length; i++) {
        const tipoSelect = document.getElementById(`tipo-${i}`);
        if (!tipoSelect || !tipoSelect.value) {
            showToast(`Por favor selecciona el tipo para el archivo: ${archivosSeleccionados[i].name}`, 'error');
            return;
        }
        if (tipoSelect.value === 'FACTURA') {
            tieneFactura = true;
        }
        tiposDocumento.push(tipoSelect.value);
    }

    if (!tieneFactura) {
        showToast('Debes marcar al menos un archivo como "Factura"', 'error');
        return;
    }

    // Validar que se haya seleccionado un área de Ruta 2
    const aprobadorRuta2 = document.getElementById('aprobadorRuta2').value;
    if (!aprobadorRuta2) {
        showToast('Debes seleccionar un área de aprobación para Ruta 2', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('numero_factura', document.getElementById('numeroFactura').value);
    formData.append('nit_proveedor', document.getElementById('nitProveedor').value);
    formData.append('fecha_emision', document.getElementById('fechaEmision').value);
    formData.append('monto', document.getElementById('monto').value);
    formData.append('concepto', document.getElementById('concepto').value);
    formData.append('rol_aprobador_ruta2', aprobadorRuta2);

    // Agregar archivos y tipos desde archivosSeleccionados
    for (let i = 0; i < archivosSeleccionados.length; i++) {
        formData.append('documentos', archivosSeleccionados[i]);
        formData.append('tipos_documento', tiposDocumento[i]);
    }

    try {
        const response = await fetchAPI('/facturas/cargar', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Factura cargada exitosamente', 'success');
            archivosSeleccionados = []; // Limpiar archivos
            showDashboard();
        } else {
            showToast(data.error || 'Error al cargar factura', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión', 'error');
    }
}



// Array global para almacenar archivos seleccionados
let archivosSeleccionados = [];

function mostrarArchivosSeleccionados() {
    const input = document.getElementById('documentos');
    const container = document.getElementById('archivos-lista');

    if (!input.files || input.files.length === 0) {
        container.innerHTML = '';
        archivosSeleccionados = [];
        return;
    }

    // Convertir FileList a Array y agregar a archivosSeleccionados
    archivosSeleccionados = Array.from(input.files);

    renderArchivos();
}

function renderArchivos() {
    const container = document.getElementById('archivos-lista');

    if (archivosSeleccionados.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-tertiary); text-align: center;">No hay archivos seleccionados</p>';
        return;
    }

    let html = '<div class="archivos-grid">';
    archivosSeleccionados.forEach((file, index) => {
        html += `
            <div class="archivo-item" id="archivo-${index}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <div class="archivo-nombre" style="flex: 1; word-break: break-word;">
                        📄 ${file.name}
                        <small style="display: block; color: var(--color-text-tertiary); font-size: 0.75rem;">
                            ${(file.size / 1024).toFixed(2)} KB
                        </small>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger" onclick="eliminarArchivo(${index})" 
                            style="padding: 0.25rem 0.5rem; margin-left: 0.5rem;">
                        ✕
                    </button>
                </div>
                <select id="tipo-${index}" class="archivo-tipo">
                    <option value="">Seleccionar tipo...</option>
                    <option value="FACTURA" ${index === 0 ? 'selected' : ''}>Factura</option>
                    <option value="SOPORTE">Soporte</option>
                    <option value="DISTRIBUCION_GASTO">Distribución de Gasto</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>
        `;
    });
    html += '</div>';
    html += `<p style="margin-top: 1rem; color: var(--color-text-secondary); font-size: 0.875rem;">
        Total de archivos: ${archivosSeleccionados.length}
    </p>`;
    container.innerHTML = html;
}

function eliminarArchivo(index) {
    archivosSeleccionados.splice(index, 1);
    renderArchivos();

    // Actualizar el input file
    const input = document.getElementById('documentos');
    const dt = new DataTransfer();
    archivosSeleccionados.forEach(file => dt.items.add(file));
    input.files = dt.files;

    showToast('Archivo eliminado', 'info');
}


// GESTIÓN DE USUARIOS (SUPER_ADMIN)
// ============================================

async function showUsuarios() {
    if (!currentUser || !currentUser.roles.includes('SUPER_ADMIN')) {
        showToast('No tienes permisos para acceder a esta sección', 'error');
        return;
    }

    currentView = 'usuarios';
    updateNavigation();

    try {
        const response = await fetchAPI('/usuarios');
        const data = await response.json();

        const content = document.getElementById('mainContainer');
        content.innerHTML = `
            <div class="page-header">
                <h1>Gestión de Usuarios</h1>
                <button class="btn btn-primary" onclick="showCrearUsuario()">
                    <i class="icon">➕</i> Crear Usuario
                </button>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Roles</th>
                            <th>Estado</th>
                            <th>Evidencia Pago</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.usuarios.map(usuario => `
                            <tr>
                                <td>${usuario.nombre}</td>
                                <td>${usuario.email}</td>
                                <td>
                                    ${usuario.roles ? usuario.roles.map(rol =>
            `<span class="badge badge-info">${rol}</span>`
        ).join(' ') : 'Sin roles'}
                                </td>
                                <td>
                                    <span class="badge ${usuario.is_active ? 'badge-success' : 'badge-error'}">
                                        ${usuario.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    ${usuario.requiere_evidencia_pago ?
                '<span class="badge badge-warning">Requerida</span>' :
                '<span class="badge badge-secondary">No requerida</span>'}
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="showEditarUsuario('${usuario.usuario_id}')">
                                        Editar
                                    </button>
                                    <button class="btn btn-sm btn-info" onclick="showAsignarRoles('${usuario.usuario_id}')">
                                        Roles
                                    </button>
                                    ${usuario.is_active ?
                `<button class="btn btn-sm btn-error" onclick="desactivarUsuario('${usuario.usuario_id}')">Desactivar</button>` :
                `<button class="btn btn-sm btn-success" onclick="activarUsuario('${usuario.usuario_id}')">Activar</button>`
            }
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showToast('Error al cargar usuarios: ' + error.message, 'error');
    }
}

async function showCrearUsuario() {
    showModal('Crear Usuario', `
        <form id="formCrearUsuario" onsubmit="crearUsuario(event)">
            <div class="grid grid-cols-2">
                <div class="form-group">
                    <label class="form-label">Nombre Completo *</label>
                    <input type="text" name="nombre" required class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" name="email" required class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Tipo de Documento *</label>
                    <select name="tipo_documento" required class="form-select">
                        <option value="">Seleccionar...</option>
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="TI">Tarjeta de Identidad</option>
                        <option value="PA">Pasaporte</option>
                        <option value="NIT">NIT</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Número de Documento *</label>
                    <input type="text" name="numero_documento" required class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Área *</label>
                    <input type="text" name="area" required class="form-input" placeholder="Ej: Contabilidad, Tesorería, etc.">
                </div>
                <div class="form-group">
                    <label class="form-label">Cargo *</label>
                    <input type="text" name="cargo" required class="form-input" placeholder="Ej: Contador, Tesorero, etc.">
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label class="form-label">Contraseña *</label>
                    <input type="password" name="password" required minlength="6" class="form-input">
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label class="form-label">
                        <input type="checkbox" name="requiere_evidencia_pago">
                        Requiere evidencia de pago (para Ruta 4)
                    </label>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Usuario</button>
            </div>
        </form>
    `);
}

async function crearUsuario(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const datos = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        password: formData.get('password'),
        tipo_documento: formData.get('tipo_documento'),
        numero_documento: formData.get('numero_documento'),
        area: formData.get('area'),
        cargo: formData.get('cargo'),
        requiere_evidencia_pago: formData.get('requiere_evidencia_pago') === 'on'
    };

    try {
        const response = await fetchAPI('/usuarios', {
            method: 'POST',
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Usuario creado exitosamente', 'success');
            hideModal();
            showUsuarios();
        } else {
            showToast(data.details || 'Error al crear usuario', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function showEditarUsuario(usuarioId) {
    try {
        const response = await fetchAPI(`/usuarios/${usuarioId}`);
        const data = await response.json();
        const usuario = data.usuario;

        showModal('Editar Usuario', `
            <form id="formEditarUsuario" onsubmit="editarUsuario(event, '${usuarioId}')">
                <div class="grid grid-cols-2">
                    <div class="form-group">
                        <label class="form-label">Nombre Completo *</label>
                        <input type="text" name="nombre" value="${usuario.nombre || ''}" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" name="email" value="${usuario.email || ''}" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo de Documento *</label>
                        <select name="tipo_documento" required class="form-select">
                            <option value="">Seleccionar...</option>
                            <option value="CC" ${usuario.tipo_documento === 'CC' ? 'selected' : ''}>Cédula de Ciudadanía</option>
                            <option value="CE" ${usuario.tipo_documento === 'CE' ? 'selected' : ''}>Cédula de Extranjería</option>
                            <option value="TI" ${usuario.tipo_documento === 'TI' ? 'selected' : ''}>Tarjeta de Identidad</option>
                            <option value="PA" ${usuario.tipo_documento === 'PA' ? 'selected' : ''}>Pasaporte</option>
                            <option value="NIT" ${usuario.tipo_documento === 'NIT' ? 'selected' : ''}>NIT</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Número de Documento *</label>
                        <input type="text" name="numero_documento" value="${usuario.numero_documento || ''}" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Área *</label>
                        <input type="text" name="area" value="${usuario.area || ''}" required class="form-input" placeholder="Ej: Contabilidad, Tesorería, etc.">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cargo *</label>
                        <input type="text" name="cargo" value="${usuario.cargo || ''}" required class="form-input" placeholder="Ej: Contador, Tesorero, etc.">
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Nueva Contraseña (dejar en blanco para no cambiar)</label>
                        <input type="password" name="password" minlength="6" class="form-input">
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">
                            <input type="checkbox" name="requiere_evidencia_pago" ${usuario.requiere_evidencia_pago ? 'checked' : ''}>
                            Requiere evidencia de pago (para Ruta 4)
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        `);
    } catch (error) {
        showToast('Error al cargar usuario: ' + error.message, 'error');
    }
}

async function editarUsuario(event, usuarioId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const datos = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        tipo_documento: formData.get('tipo_documento'),
        numero_documento: formData.get('numero_documento'),
        area: formData.get('area'),
        cargo: formData.get('cargo'),
        requiere_evidencia_pago: formData.get('requiere_evidencia_pago') === 'on'
    };

    const password = formData.get('password');
    if (password) datos.password = password;

    try {
        const response = await fetchAPI(`/usuarios/${usuarioId}`, {
            method: 'PUT',
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Usuario actualizado exitosamente', 'success');
            hideModal();
            showUsuarios();
        } else {
            showToast(data.details || 'Error al actualizar usuario', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function showAsignarRoles(usuarioId) {
    try {
        const [usuarioRes, rolesRes] = await Promise.all([
            fetchAPI(`/usuarios/${usuarioId}`),
            fetchAPI('/usuarios/roles')
        ]);

        const usuarioData = await usuarioRes.json();
        const rolesData = await rolesRes.json();

        const usuario = usuarioData.usuario;
        const rolesDisponibles = rolesData.roles;
        const rolesActuales = usuario.roles_ids || [];

        showModal(`Asignar Roles - ${usuario.nombre}`, `
            <form id="formAsignarRoles" onsubmit="asignarRoles(event, '${usuarioId}')">
                <div class="form-group">
                    <p>Selecciona los roles para este usuario:</p>
                    ${rolesDisponibles.map(rol => `
                        <label style="display: block; margin: 10px 0;">
                            <input type="checkbox" name="roles" value="${rol.rol_id}" 
                                ${rolesActuales.includes(rol.rol_id) ? 'checked' : ''}>
                            <strong>${rol.nombre}</strong> (${rol.codigo})
                        </label>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Roles</button>
                </div>
            </form>
        `);
    } catch (error) {
        showToast('Error al cargar roles: ' + error.message, 'error');
    }
}

async function asignarRoles(event, usuarioId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const rolesIds = formData.getAll('roles').map(id => parseInt(id));

    try {
        const response = await fetchAPI(`/usuarios/${usuarioId}/roles`, {
            method: 'PUT',
            body: JSON.stringify({ roles_ids: rolesIds })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Roles asignados exitosamente', 'success');
            hideModal();
            showUsuarios();
        } else {
            showToast(data.details || 'Error al asignar roles', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function desactivarUsuario(usuarioId) {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;

    try {
        const response = await fetchAPI(`/usuarios/${usuarioId}`, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
            showToast('Usuario desactivado exitosamente', 'success');
            showUsuarios();
        } else {
            showToast(data.details || 'Error al desactivar usuario', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function activarUsuario(usuarioId) {
    try {
        const response = await fetchAPI(`/usuarios/${usuarioId}/activar`, { method: 'PATCH' });
        const data = await response.json();

        if (response.ok) {
            showToast('Usuario activado exitosamente', 'success');
            showUsuarios();
        } else {
            showToast(data.details || 'Error al activar usuario', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ============================================
// EVIDENCIA DE PAGO (RUTA 4)
// ============================================

async function showFormularioPago(facturaId) {
    if (!currentUser.roles.includes('RUTA_4')) {
        showToast('Solo usuarios de Tesorería pueden realizar pagos', 'error');
        return;
    }

    showModal('Marcar como Pagada', `
        <form id="formPago" onsubmit="procesarPago(event, '${facturaId}')">
            <div class="alert alert-info">
                <strong>Importante:</strong> Debes subir la evidencia de pago antes de marcar como pagada.
            </div>
            <div class="form-group">
                <label>Evidencia de Pago *</label>
                <input type="file" name="evidencia" required class="form-control" accept=".pdf,.jpg,.jpeg,.png">
                <small>Comprobante de transferencia, recibo, etc.</small>
            </div>
            <div class="form-group">
                <label>Nombre del Documento</label>
                <input type="text" name="nombre_personalizado" class="form-control" placeholder="Ej: Comprobante transferencia">
            </div>
            <div class="form-group">
                <label>Observación</label>
                <textarea name="observacion" class="form-control" rows="3" placeholder="Detalles del pago..."></textarea>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
                <button type="submit" class="btn btn-success">Subir Evidencia y Marcar como Pagada</button>
            </div>
        </form>
    `);
}

async function procesarPago(event, facturaId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        // 1. Subir evidencia de pago
        const evidenciaFormData = new FormData();
        evidenciaFormData.append('documento', formData.get('evidencia'));
        evidenciaFormData.append('tipo_documento', 'EVIDENCIA_PAGO');
        evidenciaFormData.append('nombre_personalizado', formData.get('nombre_personalizado') || 'Evidencia de pago');
        evidenciaFormData.append('observacion', formData.get('observacion') || '');

        const uploadResponse = await fetchAPI(`/facturas/${facturaId}/documentos`, {
            method: 'POST',
            body: evidenciaFormData
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.details || 'Error al subir evidencia');
        }

        // 2. Marcar como pagada
        const pagarResponse = await fetchAPI(`/facturas/${facturaId}/estado`, {
            method: 'PUT',
            body: JSON.stringify({
                accion: 'PAGAR',
                observacion: formData.get('observacion') || 'Pago realizado'
            })
        });

        const pagarData = await pagarResponse.json();

        if (pagarResponse.ok) {
            showToast('Factura marcada como pagada exitosamente', 'success');
            hideModal();
            viewInvoiceDetails(facturaId);
        } else {
            showToast(pagarData.details || 'Error al marcar como pagada', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ============================================
// NAVEGACIÓN
// ============================================

function updateNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === currentView) link.classList.add('active');
    });
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.nombre;

        // Mostrar enlace de Usuarios solo para SUPER_ADMIN
        const navUsuarios = document.getElementById('navUsuarios');
        if (navUsuarios) {
            navUsuarios.style.display = currentUser.roles && currentUser.roles.includes('SUPER_ADMIN') ? 'block' : 'none';
        }

        // Mostrar enlace de Proveedores solo para SUPER_ADMIN
        const navProveedores = document.getElementById('navProveedores');
        if (navProveedores) {
            navProveedores.style.display = currentUser.roles && currentUser.roles.includes('SUPER_ADMIN') ? 'block' : 'none';
        }

        // Ocultar "Cargar Factura" para RUTA_2, RUTA_3, RUTA_4
        const navCargar = document.querySelector('.nav-link[data-view="cargar"]');
        if (navCargar) {
            const esRutaAprobacion = currentUser.roles && (
                currentUser.roles.includes('RUTA_2') ||
                currentUser.roles.includes('RUTA_3') ||
                currentUser.roles.includes('RUTA_4')
            );
            const esSuperAdmin = currentUser.roles && currentUser.roles.includes('SUPER_ADMIN');
            const esRuta1 = currentUser.roles && currentUser.roles.includes('RUTA_1');

            // Solo SUPER_ADMIN y RUTA_1 pueden cargar facturas
            navCargar.style.display = (esSuperAdmin || esRuta1) && !esRutaAprobacion ? 'block' : 'none';
        }
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;

            switch (view) {
                case 'dashboard':
                    showDashboard();
                    break;
                case 'cargar':
                    showCargarFactura();
                    break;
                case 'usuarios':
                    showUsuarios();
                    break;
                case 'proveedores':
                    showProveedores();
                    break;
            }
        });
    });

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }

    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }
}

/**
 * Descargar un documento
 */
async function descargarDocumento(documentoId) {
    try {
        const token = getToken();
        if (!token) {
            showToast('No hay sesión activa. Por favor, inicia sesión nuevamente.', 'error');
            return;
        }

        const url = `${API_BASE_URL}/facturas/documentos/${documentoId}/descargar`;
        console.log('Descargando documento desde:', url);

        // Usar fetch para descargar con el token en el header
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || 'Error al descargar');
        }

        // Obtener el blob y el nombre del archivo
        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'documento';

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Crear un enlace temporal y hacer clic en él para descargar
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        showToast('Documento descargado exitosamente', 'success');
    } catch (error) {
        console.error('Error al descargar documento:', error);
        showToast('Error al descargar documento: ' + error.message, 'error');
    }
}


// ============================================

/**
 * Mostrar documentos de una factura
 */
async function mostrarDocumentosFactura(facturaId) {
    try {
        const response = await fetchAPI(`/facturas/${facturaId}/documentos`);
        const data = await response.json();
        const documentos = data.documentos || [];

        if (documentos.length === 0) {
            return '<p class="text-center" style="color: var(--color-text-tertiary);">No hay documentos adjuntos</p>';
        }

        const tipoIconos = {
            'SOPORTE_INICIAL': '📄',
            'DOCUMENTO_ADICIONAL': '📎',
            'EVIDENCIA_PAGO': '💳'
        };

        const tipoNombres = {
            'SOPORTE_INICIAL': 'Soporte Inicial',
            'DOCUMENTO_ADICIONAL': 'Documento Adicional',
            'EVIDENCIA_PAGO': 'Evidencia de Pago'
        };

        return `
            <div class="documentos-lista">
                ${documentos.map(doc => `
                    <div class="documento-item">
                        <div class="documento-info">
                            <span class="documento-icono">${tipoIconos[doc.tipo_documento] || '📄'}</span>
                            <div>
                                <strong>${doc.nombre_personalizado || doc.nombre_archivo}</strong>
                                <small>
                                    ${tipoNombres[doc.tipo_documento]} • 
                                    Subido por ${doc.usuario_carga_nombre} • 
                                    ${formatDate(doc.fecha_carga)}
                                </small>
                                ${doc.observacion ? `<div class="documento-obs">${doc.observacion}</div>` : ''}
                            </div>
                        </div>
                        <div class="documento-acciones">
                            <button class="btn btn-sm btn-secondary" onclick="descargarDocumento('${doc.documento_id}')">
                                ⬇️ Descargar
                            </button>
                            ${currentUser.roles.includes('SUPER_ADMIN') && doc.tipo_documento !== 'SOPORTE_INICIAL' ?
                `<button class="btn btn-sm btn-danger" onclick="eliminarDocumento('${doc.documento_id}', '${facturaId}')">
                                    🗑️ Eliminar
                                </button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar documentos:', error);
        return '<p class="alert alert-error">Error al cargar documentos</p>';
    }
}


/**
 * Eliminar un documento (solo SUPER_ADMIN)
 */
async function eliminarDocumento(documentoId, facturaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetchAPI(`/facturas/documentos/${documentoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Documento eliminado exitosamente', 'success');
            // Recargar detalles de la factura
            hideModal();
            setTimeout(() => viewInvoiceDetails(facturaId), 300);
        } else {
            const data = await response.json();
            showToast(data.details || 'Error al eliminar documento', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        showToast('Error al eliminar documento', 'error');
    }
}

/**
 * Eliminar una factura completa (solo SUPER_ADMIN)
 */
async function eliminarFacturaCompleta(facturaId) {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar esta factura COMPLETA?\n\nEsta acción eliminará:\n- La factura\n- Todos los documentos adjuntos\n- Todo el historial\n\nEsta acción NO se puede deshacer.')) {
        return;
    }

    // Segunda confirmación
    if (!confirm('Esta es tu última oportunidad. ¿Realmente deseas eliminar esta factura?')) {
        return;
    }

    try {
        const response = await fetchAPI(`/facturas/${facturaId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Factura eliminada exitosamente', 'success');
            hideModal();
            // Recargar dashboard
            setTimeout(() => showDashboard(), 300);
        } else {
            const data = await response.json();
            showToast(data.details || 'Error al eliminar factura', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        showToast('Error al eliminar factura', 'error');
    }
}



// GESTIÓN DE PROVEEDORES (SUPER_ADMIN)
// ============================================

async function showProveedores() {
    if (!currentUser || !currentUser.roles.includes('SUPER_ADMIN')) {
        showToast('No tienes permisos para acceder a esta sección', 'error');
        return;
    }

    updateNavigation();

    document.getElementById('mainContainer').innerHTML = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h1 class="card-title">Gestión de Proveedores</h1>
                <button class="btn btn-primary" onclick="showCrearProveedor()">
                    + Nuevo Proveedor
                </button>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>NIT</th>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="proveedoresTableBody">
                            <tr>
                                <td colspan="6" class="text-center">Cargando proveedores...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetchAPI('/proveedores');
        const proveedores = await response.json();

        const tbody = document.getElementById('proveedoresTableBody');
        if (proveedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay proveedores registrados</td></tr>';
            return;
        }

        tbody.innerHTML = proveedores.map(prov => `
            <tr>
                <td>${prov.nit}</td>
                <td>${prov.nombre}</td>
                <td>${prov.telefono || '-'}</td>
                <td>${prov.email || '-'}</td>
                <td>
                    <span class="badge ${prov.is_active ? 'badge-success' : 'badge-error'}">
                        ${prov.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="showEditarProveedor('${prov.id}', '${prov.nit}', '${prov.nombre}', '${prov.direccion || ''}', '${prov.telefono || ''}', '${prov.email || ''}', ${prov.is_active})">
                        Editar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        document.getElementById('proveedoresTableBody').innerHTML =
            '<tr><td colspan="6" class="text-center" style="color: var(--color-error)">Error al cargar datos</td></tr>';
    }
}

function showCrearProveedor() {
    const content = `
        <form id="crearProveedorForm">
            <div class="form-group">
                <label class="form-label">NIT *</label>
                <input type="text" id="provNit" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input type="text" id="provNombre" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" id="provDireccion" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" id="provTelefono" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="provEmail" class="form-input">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
        </form>
    `;

    showModal('Nuevo Proveedor', content);

    document.getElementById('crearProveedorForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            nit: document.getElementById('provNit').value,
            nombre: document.getElementById('provNombre').value,
            direccion: document.getElementById('provDireccion').value,
            telefono: document.getElementById('provTelefono').value,
            email: document.getElementById('provEmail').value
        };

        try {
            const response = await fetchAPI('/proveedores', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                showToast('Proveedor creado exitosamente', 'success');
                hideModal();
                showProveedores();
            } else {
                const error = await response.json();
                showToast(error.error || 'Error al crear proveedor', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error de conexión', 'error');
        }
    });
}

function showEditarProveedor(id, nit, nombre, direccion, telefono, email, isActive) {
    const content = `
        <form id="editarProveedorForm">
            <div class="form-group">
                <label class="form-label">NIT *</label>
                <input type="text" id="provNit" class="form-input" value="${nit}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input type="text" id="provNombre" class="form-input" value="${nombre}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" id="provDireccion" class="form-input" value="${direccion}">
            </div>
            <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" id="provTelefono" class="form-input" value="${telefono}">
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="provEmail" class="form-input" value="${email}">
            </div>
            <div class="form-group">
                <label class="form-label">Estado</label>
                <select id="provEstado" class="form-select">
                    <option value="true" ${isActive ? 'selected' : ''}>Activo</option>
                    <option value="false" ${!isActive ? 'selected' : ''}>Inactivo</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar</button>
            </div>
        </form>
    `;

    showModal('Editar Proveedor', content);

    document.getElementById('editarProveedorForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            nit: document.getElementById('provNit').value,
            nombre: document.getElementById('provNombre').value,
            direccion: document.getElementById('provDireccion').value,
            telefono: document.getElementById('provTelefono').value,
            email: document.getElementById('provEmail').value,
            is_active: document.getElementById('provEstado').value === 'true'
        };

        try {
            const response = await fetchAPI(`/proveedores/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                showToast('Proveedor actualizado exitosamente', 'success');
                hideModal();
                showProveedores();
            } else {
                const error = await response.json();
                showToast(error.error || 'Error al actualizar proveedor', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error de conexión', 'error');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    const token = getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = {
                nombre: payload.nombre,
                usuario_id: payload.usuario_id,
                roles: payload.roles
            };
            showDashboard();
        } catch (error) {
            removeToken();
            showLogin();
        }
    } else {
        showLogin();
    }
});

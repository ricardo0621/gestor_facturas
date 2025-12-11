/**
 * Vista de Dashboard
 * Muestra estadísticas y facturas recientes
 */

import { fetchAPI } from '../services/api.service.js';
import { showToast } from '../components/toast.js';
import { formatDate, formatCurrency, getEstadoBadgeClass } from '../utils/formatters.js';

/**
 * Mostrar vista de dashboard
 */
export async function showDashboard() {
    // Mostrar navbar y actualizar navegación
    document.getElementById('navbar').style.display = 'flex';

    // Actualizar navegación (función global)
    if (typeof window.updateNavigation === 'function') {
        window.updateNavigation();
    }

    // Obtener usuario actual
    const currentUser = window.currentUser;
    if (!currentUser) {
        console.error('Usuario no autenticado');
        return;
    }

    // Renderizar estructura base
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
            
            <!-- Formulario de Búsqueda -->
            <div class="card-body" style="border-bottom: 1px solid var(--color-border);">
                <form id="dashboardSearchForm" style="display: grid; grid-template-columns: ${currentUser.roles.includes('RUTA_1') ? 'repeat(4, 1fr) auto' : 'repeat(3, 1fr) auto'}; gap: 1rem; align-items: end;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Número de Factura</label>
                        <input type="text" id="searchNumeroFactura" class="form-input" placeholder="Ej: 12345">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">NIT Proveedor</label>
                        <input type="text" id="searchNit" class="form-input" placeholder="Ej: 900123456">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Nombre Proveedor</label>
                        <input type="text" id="searchProveedor" class="form-input" placeholder="Ej: Proveedor XYZ">
                    </div>
                    ${currentUser.roles.includes('RUTA_1') ? `
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Estado</label>
                        <select id="searchEstado" class="form-select">
                            <option value="">Todos</option>
                            <option value="RUTA_1">Devuelta</option>
                            <option value="RUTA_2_DIRECCION_ADMINISTRATIVA">Dirección Administrativa</option>
                            <option value="RUTA_2_DIRECCION_FINANCIERA">Dirección Financiera</option>
                            <option value="RUTA_2_DIRECCION_MEDICA">Dirección Médica</option>
                            <option value="RUTA_2_CONTROL_INTERNO">Control Interno</option>
                            <option value="RUTA_3">Contabilidad</option>
                            <option value="RUTA_4">Tesorería</option>
                            <option value="ANULADA">Anulada</option>
                            <option value="FINALIZADA">Finalizada/Pagada</option>
                        </select>
                    </div>
                    ` : ''}
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn btn-primary">🔍 Buscar</button>
                        <button type="button" id="btnLimpiarDashboard" class="btn btn-secondary">🔄 Limpiar</button>
                    </div>
                </form>
            </div>
            
            <div id="recentInvoices">
                <div class="text-center" style="padding: 2rem;">
                    <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto;"></div>
                </div>
            </div>
        </div>
    `;

    // Event listeners
    document.getElementById('dashboardSearchForm').addEventListener('submit', handleDashboardSearch);
    document.getElementById('btnLimpiarDashboard').addEventListener('click', () => {
        document.getElementById('dashboardSearchForm').reset();
        loadRecentInvoices();
    });

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

/**
 * Manejar búsqueda en dashboard
 */
async function handleDashboardSearch(e) {
    e.preventDefault();

    const filtros = {
        numero_factura: document.getElementById('searchNumeroFactura').value,
        nit: document.getElementById('searchNit').value,
        proveedor: document.getElementById('searchProveedor').value,
        estado_codigo: document.getElementById('searchEstado')?.value || ''
    };

    loadRecentInvoices(filtros);
}

/**
 * Cargar facturas recientes
 */
async function loadRecentInvoices(filtros = {}) {
    try {
        // Construir query params
        const params = new URLSearchParams();

        Object.keys(filtros).forEach(key => {
            if (filtros[key]) {
                params.append(key, filtros[key]);
            }
        });

        const response = await fetchAPI(`/facturas?${params.toString()}`);
        const data = await response.json();

        renderInvoiceTable(data.facturas, 'recentInvoices');
    } catch (error) {
        console.error('Error al cargar facturas:', error);
        document.getElementById('recentInvoices').innerHTML =
            '<p class="text-center error-text">Error al cargar facturas</p>';
    }
}

/**
 * Renderizar tabla de facturas
 */
function renderInvoiceTable(facturas, containerId) {
    const container = document.getElementById(containerId);

    if (!facturas || facturas.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 2rem; color: var(--color-text-secondary);">
                <p>No hay facturas para mostrar</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Proveedor</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${facturas.map(factura => `
                        <tr>
                            <td>${factura.numero_factura}</td>
                            <td>
                                <div><strong>${factura.proveedor_nombre}</strong></div>
                                <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
                                    NIT: ${factura.nit_proveedor}
                                </div>
                            </td>
                            <td>${formatCurrency(factura.monto)}</td>
                            <td>${formatDate(factura.fecha_creacion)}</td>
                            <td>
                                <span class="badge badge-${getEstadoBadgeClass(factura.estado_codigo)}">
                                    ${factura.estado_nombre}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="window.viewInvoiceDetails('${factura.factura_id}')">
                                    Ver Detalles
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

/**
 * Vista de Búsqueda Avanzada
 */

import { fetchAPI } from '../services/api.service.js';
import { showToast } from '../components/toast.js';
import { formatDate, formatCurrency, getEstadoBadgeClass } from '../utils/formatters.js';

/**
 * Mostrar vista de búsqueda avanzada
 */
export async function showBusquedaAvanzada() {
    if (typeof window.updateNavigation === 'function') {
        window.updateNavigation();
    }

    try {
        // Cargar datos para los dropdowns
        const [proveedoresRes, usuariosRes] = await Promise.all([
            fetchAPI('/proveedores'),
            fetchAPI('/usuarios')
        ]);

        const proveedoresData = await proveedoresRes.json();
        const usuariosData = await usuariosRes.json();

        const proveedores = proveedoresData.proveedores || proveedoresData || [];
        const usuarios = usuariosData.usuarios || [];

        document.getElementById('mainContainer').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">Búsqueda Avanzada</h1>
                </div>
                
                <div class="card-body">
                    <form id="advancedSearchForm" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">Número de Factura</label>
                            <input type="text" id="advNumeroFactura" class="form-input" placeholder="Ej: 12345">
                        </div>

                        <div class="form-group">
                            <label class="form-label">NIT Proveedor</label>
                            <select id="advNit" class="form-select">
                                <option value="">Todos</option>
                                ${proveedores.map(p => `
                                    <option value="${p.nit}">${p.nit} - ${p.nombre}</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Nombre Proveedor</label>
                            <select id="advProveedor" class="form-select">
                                <option value="">Todos</option>
                                ${proveedores.map(p => `
                                    <option value="${p.nombre}">${p.nombre}</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Usuario que Carga</label>
                            <select id="advUsuario" class="form-select">
                                <option value="">Todos</option>
                                ${usuarios.map(u => `
                                    <option value="${u.usuario_id}">${u.nombre} (${u.email})</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Estado de Factura</label>
                            <select id="advEstado" class="form-select">
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

                        <div class="form-group">
                            <label class="form-label">Monto Mayor a 2 Millones</label>
                            <select id="advMontoMayor2M" class="form-select">
                                <option value="">Todos</option>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                            </select>
                        </div>

                        <div style="grid-column: 1 / -1; display: flex; gap: 0.5rem; justify-content: flex-end;">
                            <button type="button" class="btn btn-secondary" onclick="window.limpiarBusquedaAvanzada()">🔄 Limpiar</button>
                            <button type="submit" class="btn btn-primary">🔍 Buscar</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header">
                    <h2 class="card-title">Resultados</h2>
                </div>
                <div id="advancedSearchResults">
                    <p class="text-center" style="padding: 2rem; color: var(--color-text-secondary);">
                        Utiliza los filtros para buscar facturas
                    </p>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('advancedSearchForm').addEventListener('submit', handleAdvancedSearch);

        // Sincronizar NIT y Nombre de Proveedor
        document.getElementById('advNit').addEventListener('change', (e) => {
            const selectedNit = e.target.value;
            if (selectedNit) {
                const proveedor = proveedores.find(p => p.nit === selectedNit);
                if (proveedor) {
                    document.getElementById('advProveedor').value = proveedor.nombre;
                }
            }
        });

        document.getElementById('advProveedor').addEventListener('change', (e) => {
            const selectedNombre = e.target.value;
            if (selectedNombre) {
                const proveedor = proveedores.find(p => p.nombre === selectedNombre);
                if (proveedor) {
                    document.getElementById('advNit').value = proveedor.nit;
                }
            }
        });

    } catch (error) {
        console.error('Error al cargar búsqueda avanzada:', error);
        showToast('Error al cargar búsqueda avanzada', 'error');
    }
}

async function handleAdvancedSearch(e) {
    e.preventDefault();

    const filtros = {
        numero_factura: document.getElementById('advNumeroFactura').value,
        nit: document.getElementById('advNit').value,
        proveedor: document.getElementById('advProveedor').value,
        usuario_id: document.getElementById('advUsuario').value,
        estado: document.getElementById('advEstado').value,
        monto_mayor_2m: document.getElementById('advMontoMayor2M').value
    };

    // Remover filtros vacíos
    Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
    });

    try {
        const params = new URLSearchParams(filtros);
        const response = await fetchAPI(`/facturas?${params.toString()}`);
        const data = await response.json();

        renderSearchResults(data.facturas);
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        showToast('Error al realizar búsqueda', 'error');
    }
}

function renderSearchResults(facturas) {
    const container = document.getElementById('advancedSearchResults');

    if (!facturas || facturas.length === 0) {
        container.innerHTML = `
            <p class="text-center" style="padding: 2rem; color: var(--color-text-secondary);">
                No se encontraron facturas con los criterios especificados
            </p>
        `;
        return;
    }

    const facturasHTML = facturas.map(factura => `
        <div class="card" style="margin-bottom: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <strong>Número:</strong> ${factura.numero_factura}<br>
                    <strong>Proveedor:</strong> ${factura.proveedor_nombre}<br>
                    <strong>NIT:</strong> ${factura.nit_proveedor}
                </div>
                <div>
                    <strong>Monto:</strong> ${formatCurrency(factura.monto)}<br>
                    <strong>Fecha Emisión:</strong> ${new Date(factura.fecha_emision).toLocaleDateString('es-CO')}<br>
                    <strong>Fecha Carga:</strong> ${formatDate(factura.fecha_creacion)}
                </div>
                <div>
                    <strong>Estado:</strong> <span class="badge badge-${getEstadoBadgeClass(factura.estado_codigo)}">${factura.estado_nombre}</span><br>
                    <strong>Cargada por:</strong> ${factura.usuario_creacion_nombre}<br>
                    ${factura.is_anulada ? '<span class="badge badge-danger">ANULADA</span>' : ''}
                </div>
                <div style="display: flex; align-items: center; justify-content: flex-end;">
                    <button class="btn btn-primary" onclick="window.viewInvoiceDetails('${factura.factura_id}')">Ver Detalles</button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Resultados de Búsqueda (${facturas.length})</h3>
        </div>
        ${facturasHTML}
    `;
}

window.showBusquedaAvanzada = showBusquedaAvanzada;
window.limpiarBusquedaAvanzada = function () {
    document.getElementById('advNumeroFactura').value = '';
    document.getElementById('advNit').value = '';
    document.getElementById('advProveedor').value = '';
    document.getElementById('advUsuario').value = '';
    document.getElementById('advEstado').value = '';
    document.getElementById('advMontoMayor2M').value = '';

    document.getElementById('advancedSearchResults').innerHTML = `
        <p class="text-center" style="padding: 2rem; color: var(--color-text-secondary);">
            Utiliza los filtros para buscar facturas
        </p>
    `;
};

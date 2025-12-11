/**
 * Vista de Gestión de Proveedores (SUPER_ADMIN)
 */

import { fetchAPI } from '../services/api.service.js';
import { showToast } from '../components/toast.js';

/**
 * Mostrar vista de proveedores
 */
export async function showProveedores() {
    const currentUser = window.currentUser;

    if (!currentUser || !currentUser.roles.includes('SUPER_ADMIN')) {
        showToast('No tienes permisos para acceder a esta sección', 'error');
        return;
    }

    if (typeof window.updateNavigation === 'function') {
        window.updateNavigation();
    }

    document.getElementById('mainContainer').innerHTML = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h1 class="card-title">Gestión de Proveedores</h1>
                <button class="btn btn-primary" onclick="window.showCrearProveedor()">
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
                            <tr><td colspan="6" class="text-center">Cargando proveedores...</td></tr>
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
                    <button class="btn btn-sm btn-secondary" onclick='window.showEditarProveedor(${JSON.stringify(prov).replace(/'/g, "&apos;")})'>
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

window.showProveedores = showProveedores;

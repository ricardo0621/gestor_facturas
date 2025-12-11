/**
 * Vista de Gestión de Tipos de Soporte (SUPER_ADMIN)
 */

import { fetchAPI } from '../services/api.service.js';
import { showToast } from '../components/toast.js';

/**
 * Mostrar vista de tipos de soporte
 */
export async function showTiposSoporte() {
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
                <h1 class="card-title">Gestión de Tipos de Soporte</h1>
                <button class="btn btn-primary" onclick="window.showCrearTipoSoporte()">
                    + Nuevo Tipo de Soporte
                </button>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Orden</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tiposSoporteTableBody">
                            <tr><td colspan="6" class="text-center">Cargando tipos de soporte...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetchAPI('/tipos-soporte?activos=false');
        const data = await response.json();
        const tipos = data.tipos || [];

        const tbody = document.getElementById('tiposSoporteTableBody');
        if (tipos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay tipos de soporte registrados</td></tr>';
            return;
        }

        tbody.innerHTML = tipos.map(tipo => `
            <tr>
                <td>${tipo.codigo}</td>
                <td>${tipo.nombre}</td>
                <td>${tipo.descripcion || '-'}</td>
                <td>${tipo.orden}</td>
                <td>
                    <span class="badge ${tipo.activo ? 'badge-success' : 'badge-error'}">
                        ${tipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick='window.showEditarTipoSoporte(${JSON.stringify(tipo)})'>
                        Editar
                    </button>
                    <button class="btn btn-sm ${tipo.activo ? 'btn-warning' : 'badge-success'}" 
                            onclick="window.toggleTipoSoporteActivo(${tipo.tipo_soporte_id}, ${!tipo.activo})">
                        ${tipo.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar tipos de soporte:', error);
        document.getElementById('tiposSoporteTableBody').innerHTML =
            '<tr><td colspan="6" class="text-center" style="color: var(--color-error)">Error al cargar datos</td></tr>';
    }
}

window.showTiposSoporte = showTiposSoporte;

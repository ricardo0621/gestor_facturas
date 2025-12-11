/**
 * Vista de Gestión de Usuarios (SUPER_ADMIN)
 */

import { fetchAPI } from '../services/api.service.js';
import { showToast } from '../components/toast.js';
import { showModal, hideModal } from '../components/modal.js';

/**
 * Mostrar vista de usuarios
 */
export async function showUsuarios() {
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
                <h1 class="card-title">Gestión de Usuarios</h1>
                <button class="btn btn-primary" onclick="window.showCrearUsuario()">
                    + Nuevo Usuario
                </button>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Roles</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="usuariosTableBody">
                            <tr><td colspan="5" class="text-center">Cargando usuarios...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetchAPI('/usuarios');
        const data = await response.json();
        const usuarios = data.usuarios || [];

        const tbody = document.getElementById('usuariosTableBody');
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(usuario => `
            <tr>
                <td>${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td>${usuario.roles ? usuario.roles.join(', ') : '-'}</td>
                <td>
                    <span class="badge ${usuario.activo ? 'badge-success' : 'badge-error'}">
                        ${usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="window.showAsignarRoles('${usuario.usuario_id}', '${usuario.nombre}')">
                        Roles
                    </button>
                    ${usuario.activo ?
                `<button class="btn btn-sm btn-error" onclick="window.desactivarUsuario('${usuario.usuario_id}')">Desactivar</button>` :
                `<button class="btn btn-sm btn-success" onclick="window.activarUsuario('${usuario.usuario_id}')">Activar</button>`
            }
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        document.getElementById('usuariosTableBody').innerHTML =
            '<tr><td colspan="5" class="text-center" style="color: var(--color-error)">Error al cargar datos</td></tr>';
    }
}

// Exportar funciones auxiliares para uso global
window.showUsuarios = showUsuarios;

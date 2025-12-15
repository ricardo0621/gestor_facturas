// ============================================
// TIPOS DE SOPORTE (SUPER_ADMIN)
// ============================================

/**
 * Mostrar vista de gestión de tipos de soporte
 */
async function showTiposSoporte() {
    currentView = 'tiposSoporte';

    if (!currentUser || !currentUser.roles.includes('SUPER_ADMIN')) {
        showToast('No tienes permisos para acceder a esta sección', 'error');
        showDashboard();
        return;
    }

    document.getElementById('mainContainer').innerHTML = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 class="card-title">Gestión de Tipos de Soporte</h1>
                    <p class="card-subtitle">Administra los tipos de documentos disponibles para las facturas</p>
                </div>
                <button class="btn btn-primary" id="btnNuevoTipo">
                    + Nuevo Tipo de Soporte
                </button>
            </div>
            <div class="card-body">
                <div class="filter-bar" style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" id="mostrarInactivos" style="width: auto;">
                        <span>Mostrar tipos inactivos</span>
                    </label>
                </div>
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

    // Event listeners
    document.getElementById('btnNuevoTipo').addEventListener('click', () => showModalTipoSoporte());
    document.getElementById('mostrarInactivos').addEventListener('change', cargarTiposSoporte);

    // Cargar datos iniciales
    await cargarTiposSoporte();
}

/**
 * Cargar tipos de soporte en la tabla
 */
async function cargarTiposSoporte() {
    const mostrarInactivos = document.getElementById('mostrarInactivos')?.checked || false;

    try {
        const url = mostrarInactivos ? '/tipos-soporte?activos=false' : '/tipos-soporte';
        const response = await fetchAPI(url);
        const data = await response.json();
        const tipos = data.tipos || [];

        const tbody = document.getElementById('tiposSoporteTableBody');
        if (tipos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay tipos de soporte registrados</td></tr>';
            return;
        }

        tbody.innerHTML = tipos.map(tipo => `
            <tr>
                <td><strong>${tipo.codigo}</strong></td>
                <td>${tipo.nombre}</td>
                <td>${tipo.descripcion || '-'}</td>
                <td>${tipo.orden}</td>
                <td>
                    <span class="badge ${tipo.activo ? 'badge-success' : 'badge-error'}">
                        ${tipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editarTipoSoporte(${tipo.tipo_soporte_id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm ${tipo.activo ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleTipoSoporteActivo(${tipo.tipo_soporte_id}, ${!tipo.activo})">
                        ${tipo.activo ? '🚫 Desactivar' : '✅ Activar'}
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar tipos de soporte:', error);
        document.getElementById('tiposSoporteTableBody').innerHTML =
            '<tr><td colspan="6" class="text-center" style="color: var(--color-error)">Error al cargar datos</td></tr>';
        showToast('Error al cargar tipos de soporte', 'error');
    }
}

/**
 * Mostrar modal para crear/editar tipo de soporte
 */
async function showModalTipoSoporte(tipoId = null) {
    let tipo = null;
    let titulo = 'Nuevo Tipo de Soporte';

    if (tipoId) {
        try {
            const response = await fetchAPI(`/tipos-soporte/${tipoId}`);
            const data = await response.json();
            tipo = data.tipo;
            titulo = 'Editar Tipo de Soporte';
        } catch (error) {
            showToast('Error al cargar tipo de soporte', 'error');
            return;
        }
    }

    const content = `
        <form id="formTipoSoporte">
            <div class="form-group">
                <label class="form-label">Código *</label>
                <input type="text" id="codigo" class="form-input" 
                       value="${tipo?.codigo || ''}" 
                       ${tipo ? 'readonly' : ''} 
                       required 
                       pattern="[A-Z0-9_]+" 
                       title="Solo mayúsculas, números y guiones bajos"
                       placeholder="Ej: CONTRATO">
                <small style="color: var(--color-text-tertiary);">Solo mayúsculas, números y guiones bajos</small>
            </div>

            <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input type="text" id="nombre" class="form-input" 
                       value="${tipo?.nombre || ''}" 
                       required 
                       maxlength="100"
                       placeholder="Ej: Contrato de Servicios">
            </div>

            <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea id="descripcion" class="form-textarea" 
                          placeholder="Descripción opcional del tipo de soporte">${tipo?.descripcion || ''}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Orden</label>
                <input type="number" id="orden" class="form-input" 
                       value="${tipo?.orden || 0}" 
                       min="0" 
                       placeholder="0">
                <small style="color: var(--color-text-tertiary);">Orden de visualización (menor = primero)</small>
            </div>

            ${tipo ? `
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" id="activo" ${tipo.activo ? 'checked' : ''} style="width: auto;">
                        <span>Activo</span>
                    </label>
                </div>
            ` : ''}

            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                    ${tipo ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    `;

    showModal(titulo, content);

    document.getElementById('formTipoSoporte').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarTipoSoporte(tipoId);
    });
}

/**
 * Guardar tipo de soporte (crear o actualizar)
 */
async function guardarTipoSoporte(tipoId) {
    const data = {
        codigo: document.getElementById('codigo').value.toUpperCase().trim(),
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        orden: parseInt(document.getElementById('orden').value) || 0
    };

    if (tipoId) {
        data.activo = document.getElementById('activo').checked;
    }

    try {
        const url = tipoId ? `/tipos-soporte/${tipoId}` : '/tipos-soporte';
        const method = tipoId ? 'PUT' : 'POST';

        const response = await fetchAPI(url, {
            method,
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showToast(tipoId ? 'Tipo de soporte actualizado exitosamente' : 'Tipo de soporte creado exitosamente', 'success');
            hideModal();
            await cargarTiposSoporte();
        } else {
            showToast(result.error || 'Error al guardar tipo de soporte', 'error');
        }
    } catch (error) {
        console.error('Error al guardar tipo de soporte:', error);
        showToast('Error al guardar tipo de soporte', 'error');
    }
}

/**
 * Editar tipo de soporte
 */
function editarTipoSoporte(tipoId) {
    showModalTipoSoporte(tipoId);
}

/**
 * Activar/Desactivar tipo de soporte
 */
async function toggleTipoSoporteActivo(tipoId, nuevoEstado) {
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (!confirm(`¿Está seguro que desea ${accion} este tipo de soporte?`)) {
        return;
    }

    try {
        const response = await fetchAPI(`/tipos-soporte/${tipoId}`, {
            method: 'PUT',
            body: JSON.stringify({ activo: nuevoEstado })
        });

        const result = await response.json();

        if (response.ok) {
            showToast(`Tipo de soporte ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
            await cargarTiposSoporte();
        } else {
            showToast(result.error || 'Error al cambiar estado', 'error');
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        showToast('Error al cambiar estado del tipo de soporte', 'error');
    }
}

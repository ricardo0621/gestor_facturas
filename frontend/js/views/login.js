/**
 * Vista de Login
 * Maneja la autenticación de usuarios
 */

import { fetchAPI } from '../services/api.service.js';
import { setToken } from '../utils/auth.js';
import { showToast } from '../components/toast.js';

/**
 * Mostrar vista de login
 */
export function showLogin() {
    // Ocultar navbar
    document.getElementById('navbar').style.display = 'none';

    // Renderizar formulario de login
    document.getElementById('mainContainer').innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <img src="logo-clinica.png" alt="Logo Clínica" class="login-logo" onerror="this.style.display='none'">
                    <h1>Gestor de Facturas</h1>
                    <p>Ingrese sus credenciales</p>
                </div>
                <form id="loginForm" class="login-form">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input 
                            type="email" 
                            id="loginEmail" 
                            class="form-input" 
                            placeholder="usuario@clinica.com"
                            required
                            autocomplete="email"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <input 
                            type="password" 
                            id="loginPassword" 
                            class="form-input" 
                            placeholder="••••••••"
                            required
                            autocomplete="current-password"
                        >
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </div>
    `;

    // Event listener para el formulario
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

/**
 * Manejar el envío del formulario de login
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Guardar token
            setToken(data.token);

            // Decodificar token para obtener información del usuario
            const payload = JSON.parse(atob(data.token.split('.')[1]));

            // Guardar usuario actual en variable global
            window.currentUser = {
                nombre: payload.nombre,
                usuario_id: payload.usuario_id,
                roles: payload.roles
            };

            showToast(`¡Bienvenido, ${payload.nombre}!`, 'success');

            // Redirigir al dashboard
            // La función showDashboard debe estar disponible globalmente
            if (typeof window.showDashboard === 'function') {
                window.showDashboard();
            } else {
                console.error('showDashboard no está disponible');
                location.reload();
            }
        } else {
            showToast(data.error || 'Credenciales inválidas', 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showToast('Error de conexión. Intente nuevamente.', 'error');
    }
}

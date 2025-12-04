const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3500/api';

async function runTest() {
    try {
        console.log('1. Iniciando sesión como Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@sistema.com',
            password: 'admin123' // Password from update-admin-password.js
        });

        const token = loginRes.data.token;
        const userId = loginRes.data.usuario.usuario_id;
        console.log('Login exitoso. Token obtenido.');
        console.log('Roles:', loginRes.data.usuario.roles);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Crear Factura
        console.log('\n2. Cargando nueva factura...');
        const form = new FormData();
        form.append('numero_factura', `TEST-${Date.now()}`);
        form.append('nit_proveedor', '900123456-1'); // SoftTech
        form.append('fecha_emision', '2023-10-27');
        form.append('monto', '150000');
        form.append('concepto', 'Prueba de flujo automatizada');

        // Crear archivo dummy
        const dummyPath = path.join(__dirname, 'dummy.pdf');
        fs.writeFileSync(dummyPath, 'Dummy PDF content');
        form.append('documento', fs.createReadStream(dummyPath));

        const createRes = await axios.post(`${API_URL}/facturas/cargar`, form, {
            headers: { ...headers, ...form.getHeaders() }
        });

        const facturaId = createRes.data.factura.factura_id;
        console.log(`Factura creada ID: ${facturaId}`);
        console.log(`Estado Inicial: ${createRes.data.factura.estado_id} (Debería ser RUTA_2)`);

        // 3. Aprobar (Ruta 2 -> Ruta 3)
        console.log('\n3. Aprobando factura (Ruta 2 -> Ruta 3)...');
        const aprobarRes = await axios.put(`${API_URL}/facturas/${facturaId}/estado`, {
            accion: 'APROBAR',
            observacion: 'Aprobado por Dirección'
        }, { headers });
        console.log('Resultado:', aprobarRes.data);

        // 4. Rechazar (Ruta 3 -> Ruta 2)
        console.log('\n4. Rechazando factura (Ruta 3 -> Ruta 2)...');
        const rechazarRes = await axios.put(`${API_URL}/facturas/${facturaId}/estado`, {
            accion: 'RECHAZAR',
            observacion: 'Devuelto a Dirección por error en monto',
            estadoDestinoRechazoCodigo: 'RUTA_2' // Opcional, pero probamos
        }, { headers });
        console.log('Resultado:', rechazarRes.data);

        // 5. Verificar Historial
        console.log('\n5. Verificando Historial...');
        const historialRes = await axios.get(`${API_URL}/facturas/${facturaId}/historial`, { headers });
        console.log('Entradas de historial:', historialRes.data.count);
        historialRes.data.historial.forEach(h => {
            console.log(`- ${h.accion}: ${h.estado_anterior} -> ${h.estado_nuevo} (${h.observacion})`);
        });

        console.log('\n¡PRUEBA EXITOSA!');

    } catch (error) {
        console.error('ERROR EN PRUEBA:', error.response ? error.response.data : error.message);
    }
}

runTest();

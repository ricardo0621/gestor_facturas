const pool = require('../config/db');
const fs = require('fs');

async function findAdminUser() {
    const client = await pool.connect();
    try {
        // Buscar usuarios que podrían ser admin
        const result = await client.query(`
            SELECT u.usuario_id, u.email, u.nombre, r.codigo as rol
            FROM usuarios u
            LEFT JOIN usuario_roles ur ON u.usuario_id = ur.usuario_id
            LEFT JOIN roles r ON ur.rol_id = r.rol_id
            WHERE r.codigo = 'SUPER_ADMIN' OR u.email LIKE '%admin%'
            ORDER BY u.usuario_id
        `);

        const admins = result.rows.map(user => ({
            usuario_id: user.usuario_id,
            tipo: typeof user.usuario_id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol
        }));

        console.log(JSON.stringify(admins, null, 2));
        fs.writeFileSync('utils/admin_users.json', JSON.stringify(admins, null, 2));
        console.log('\n✅ Guardado en utils/admin_users.json');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

findAdminUser();

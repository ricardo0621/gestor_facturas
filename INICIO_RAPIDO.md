# 🚀 Inicio Rápido - Gestor de Facturas

## Pasos para Iniciar el Sistema

### 1. Instalar Dependencias (solo la primera vez)

```bash
cd App
npm install
```

### 2. Inicializar la Base de Datos (solo la primera vez)

```bash
node init-database.js
```

Este comando:
- ✅ Crea todas las tablas necesarias
- ✅ Inserta los datos iniciales (estados, roles, proveedores)
- ✅ Crea el usuario administrador

### 3. Actualizar Contraseña del Admin (solo la primera vez)

```bash
node update-admin-password.js
```

Este comando genera un hash bcrypt real para la contraseña `admin123`.

### 4. Iniciar el Servidor

```bash
npm start
```

### 5. Acceder al Sistema

Abre tu navegador en: **http://localhost:3500**

**Credenciales:**
- Email: `admin@sistema.com`
- Contraseña: `admin123`

---

## 📝 Comandos Útiles

```bash
# Ver logs del servidor
npm start

# Reiniciar la base de datos (CUIDADO: borra todos los datos)
node init-database.js

# Actualizar contraseña del admin
node update-admin-password.js
```

---

## 🔧 Configuración

La configuración está en el archivo `.env`:

```env
PORT=3500
JWT_SECRET=ricardo_gestor_facturas_2025_secret_key
DATABASE_URL=postgresql://neondb_owner:npg_1ceCjh5dFQIW@ep-dark-salad-ac9uqdid-pooler.sa-east-1.aws.neon.tech/gestorfactgravity?sslmode=require&channel_binding=require
```

---

## ✅ Verificación

Si todo está correcto, deberías ver:

```
Servidor de Gestor de Facturas corriendo en http://localhost:3500
```

Y al acceder a http://localhost:3500 verás la pantalla de login.

---

## 🆘 Problemas Comunes

### Error de conexión a la base de datos
- Verifica que la `DATABASE_URL` en `.env` sea correcta
- Verifica que tengas conexión a internet (Neon es cloud)

### Error "Cannot find module"
- Ejecuta `npm install` en la carpeta `App`

### Error al iniciar sesión
- Verifica que hayas ejecutado `node update-admin-password.js`
- Usa las credenciales: `admin@sistema.com` / `admin123`

---

## 📚 Más Información

- Ver `README.md` para documentación completa
- Ver `walkthrough.md` para detalles técnicos

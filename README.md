# Sistema de Gestión y Seguimiento de Facturas

Sistema completo para la gestión de facturas con flujo de aprobación, seguimiento de estados y auditoría completa.

## 🚀 Características

- **Gestión Completa de Facturas**: Carga, consulta y seguimiento de facturas
- **Flujo de Aprobación**: Sistema de estados con múltiples rutas de aprobación
- **Historial y Auditoría**: Registro completo de todos los cambios de estado
- **Autenticación Segura**: JWT con bcrypt para contraseñas
- **Interfaz Moderna**: Diseño premium con modo oscuro y animaciones
- **Dashboard Estadístico**: Visualización de métricas en tiempo real
- **Responsive**: Funciona en desktop, tablet y móvil

## 📋 Requisitos Previos

- Node.js 14+ 
- PostgreSQL 12+
- npm o yarn

## 🛠️ Instalación

### 1. Clonar o ubicarse en el proyecto

```bash
cd d:\Gestor_Facturas
```

### 2. Configurar Base de Datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE gestor_facturas;"

# Ejecutar el schema
psql -U postgres -d gestor_facturas -f App/schema.sql
```

### 3. Generar Hash de Contraseña

```bash
cd App
node generate-admin-password.js
```

Copia el hash generado y actualiza `schema.sql` línea 133, luego vuelve a ejecutar:

```bash
psql -U postgres -d gestor_facturas -f schema.sql
```

### 4. Configurar Variables de Entorno

Edita el archivo `App/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestor_facturas
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres
JWT_SECRET=tu_clave_secreta_jwt_aqui
PORT=3500
```

### 5. Instalar Dependencias

```bash
cd App
npm install
```

### 6. Iniciar el Servidor

```bash
npm start
```

El sistema estará disponible en: **http://localhost:3500**

## 🔐 Credenciales de Acceso

**Email:** admin@sistema.com  
**Contraseña:** admin123

## 📁 Estructura del Proyecto

```
Gestor_Facturas/
├── App/
│   ├── config/           # Configuración de BD
│   ├── controller/       # Controladores
│   ├── middlewares/      # Middlewares (auth, multer)
│   ├── routes/           # Rutas de la API
│   ├── services/         # Lógica de negocio
│   ├── soportes_facturas/# Archivos subidos
│   ├── server.js         # Servidor principal
│   ├── schema.sql        # Esquema de BD
│   └── .env              # Variables de entorno
└── frontend/
    ├── index.html        # Aplicación web
    ├── styles.css        # Estilos
    └── app.js            # Lógica frontend
```

## 🔄 Flujo de Estados

1. **CARGADO_INICIAL** - Factura recién cargada
2. **PENDIENTE_ADMIN** - Esperando aprobación de Administración
3. **RECHAZADO_ADMIN** - Rechazada por Administración
4. **PENDIENTE_CONTABILIDAD** - Esperando aprobación de Contabilidad
5. **RECHAZADO_CONTABILIDAD** - Rechazada por Contabilidad
6. **PENDIENTE_TESORERIA** - Esperando aprobación de Tesorería
7. **RECHAZADO_TESORERIA** - Rechazada por Tesorería
8. **APROBADO_FINAL** - Aprobada completamente
9. **ANULADO_SISTEMA** - Anulada manualmente

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Facturas
- `GET /api/facturas` - Listar facturas (con filtros)
- `GET /api/facturas/estadisticas` - Obtener estadísticas
- `GET /api/facturas/:id` - Obtener detalles de una factura
- `GET /api/facturas/:id/historial` - Obtener historial de cambios
- `POST /api/facturas/cargar` - Cargar nueva factura
- `PUT /api/facturas/:id/estado` - Actualizar estado

Todas las rutas de facturas requieren autenticación (Bearer token).

## 💻 Uso del Sistema

### 1. Iniciar Sesión
Accede a http://localhost:3500 e inicia sesión con las credenciales de admin.

### 2. Ver Dashboard
El dashboard muestra estadísticas generales y las facturas más recientes.

### 3. Cargar Factura
1. Click en "Cargar Factura"
2. Completa el formulario
3. Selecciona el archivo PDF/JPG/PNG
4. Click en "Cargar Factura"

### 4. Gestionar Facturas
1. Click en "Facturas" para ver la lista completa
2. Usa los filtros para buscar facturas específicas
3. Click en "Ver Detalles" para ver información completa
4. Click en "Actualizar Estado" para cambiar el estado

### 5. Ver Historial
En los detalles de cada factura, verás un timeline visual con todos los cambios de estado realizados.

## 🎨 Características de la Interfaz

- **Diseño Oscuro Premium**: Modo oscuro elegante con gradientes
- **Glassmorphism**: Efectos de vidrio esmerilado
- **Animaciones Suaves**: Transiciones y micro-interacciones
- **Responsive**: Se adapta a cualquier tamaño de pantalla
- **Notificaciones Toast**: Feedback visual de acciones
- **Timeline Visual**: Seguimiento cronológico de cambios

## 🔧 Tecnologías Utilizadas

### Backend
- Node.js + Express
- PostgreSQL
- JWT (jsonwebtoken)
- Bcrypt
- Multer (carga de archivos)

### Frontend
- HTML5
- CSS3 (Variables, Grid, Flexbox)
- JavaScript Vanilla (ES6+)
- Fetch API

## 📝 Notas Importantes

- El puerto por defecto es **3500** (configurable en .env)
- Los archivos se guardan en `D:\FacturasClinica`
- El sistema usa JWT con expiración de 8 horas
- Las contraseñas se hashean con bcrypt (10 rounds)

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
Verifica que PostgreSQL esté corriendo y las credenciales en `.env` sean correctas.

### Error "Token inválido"
El token ha expirado. Cierra sesión y vuelve a iniciar sesión.

### No se puede cargar archivo
Verifica que la carpeta `soportes_facturas` exista y tenga permisos de escritura.

## 📄 Licencia

ISC

## 👤 Autor

Ricardo Andres Castillo

---

**¿Necesitas ayuda?** Revisa el archivo `walkthrough.md` para más detalles sobre la implementación.

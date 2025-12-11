# Gestor de Facturas - Documentación Completa

## 📋 Índice
1. [Descripción del Sistema](#descripción-del-sistema)
2. [Arquitectura](#arquitectura)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Roles y Permisos](#roles-y-permisos)
5. [Características Principales](#características-principales)
6. [Base de Datos](#base-de-datos)
7. [Instalación y Configuración](#instalación-y-configuración)
8. [API Endpoints](#api-endpoints)
9. [Frontend Modular](#frontend-modular)

---

## Descripción del Sistema

Sistema de gestión y seguimiento de facturas con flujo de aprobación multinivel para Clínica San Francisco.

### Tecnologías
- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL
- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Autenticación**: JWT

---

## Arquitectura

### Backend
```
App/
├── constants/       # Constantes centralizadas (estados, roles, acciones)
├── config/          # Configuración de BD
├── controller/      # Controladores de rutas
├── services/        # Lógica de negocio
├── routes/          # Definición de endpoints
├── middlewares/     # Autenticación y validación
├── utils/           # Utilidades (workflow)
└── server.js        # Punto de entrada
```

### Frontend (Modular)
```
frontend/
├── js/
│   ├── config/          # Configuración global
│   │   └── config.js
│   ├── utils/           # Utilidades
│   │   ├── auth.js
│   │   └── formatters.js
│   ├── services/        # Servicios API
│   │   └── api.service.js
│   ├── components/      # Componentes UI
│   │   ├── modal.js
│   │   └── toast.js
│   └── views/           # Vistas (próximamente)
├── css/
│   └── styles.css
├── index.html
└── app.js              # Punto de entrada modular
```

---

## Flujo de Trabajo

### Estados de Factura
1. **RUTA_1** - Gestión/Devuelta (Usuario cargador)
2. **RUTA_2** - Revisión (Direcciones especializadas)
   - RUTA_2_DIRECCION_ADMINISTRATIVA
   - RUTA_2_DIRECCION_FINANCIERA
   - RUTA_2_DIRECCION_MEDICA
   - RUTA_2_CONTROL_INTERNO
3. **RUTA_3** - Contabilidad
4. **RUTA_4** - Tesorería
5. **FINALIZADA** - Pagada/Aprobada
6. **ANULADA** - Cancelada

### Flujo de Rechazo (Lineal)
- RUTA_4 → RUTA_3
- RUTA_3 → RUTA_2
- RUTA_2 → RUTA_1

### Corrección
- **RUTA_1**: Corrección avanzada (editar datos, eliminar/agregar documentos)
- **RUTA_2**: Solo observación (sin corrección)
- **RUTA_3**: Corrección simple (observación + archivo opcional)

---

## Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **SUPER_ADMIN** | Acceso total al sistema |
| **RUTA_1** | Cargar facturas, corregir (avanzado) |
| **RUTA_2_*** | Aprobar/Rechazar en su dirección |
| **RUTA_3** | Aprobar/Rechazar, corregir (simple) |
| **RUTA_4** | Aprobar/Rechazar, marcar como pagada |

---

## Características Principales

### 1. Gestión de Facturas
- Carga de facturas con documentos
- Seguimiento de estado
- Historial de acciones
- Observaciones por ruta

### 2. Corrección Flexible
- **Ruta 1**: Edición completa de datos y documentos
- **Ruta 3**: Agregar observación y documento opcional
- **Ruta 2**: Solo observación

### 3. Búsqueda Avanzada
- Filtros por NIT, proveedor, usuario, estado
- Dropdowns dinámicos
- Resultados en tiempo real

### 4. Notificaciones
- Contador de facturas pendientes
- Actualización automática cada 30s

---

## Base de Datos

### Tablas Principales

#### `facturas`
```sql
- factura_id (PK)
- numero_factura
- proveedor_id (FK)
- fecha_emision
- monto
- concepto
- estado_id (FK)
- estado_retorno_id (FK)
- usuario_creacion_id (FK)
- rol_aprobador_ruta2
- is_anulada
```

Ver `database_schema.sql` para el schema completo.

---

## Instalación y Configuración

### 1. Requisitos
- Node.js 18+
- PostgreSQL 12+

### 2. Variables de Entorno (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestor_facturas
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secret_key
PORT=3500
UPLOAD_PATH=D:\\FacturasClinica
```

### 3. Instalación
```bash
cd App
npm install
```

### 4. Base de Datos
```bash
psql -U postgres -d gestor_facturas -f database_schema.sql
```

### 5. Iniciar Servidor
```bash
npm start
```

El sistema estará disponible en: **http://localhost:3500**

---

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Facturas
- `GET /api/facturas` - Listar facturas (con filtros)
- `GET /api/facturas/:id` - Detalle de factura
- `POST /api/facturas` - Crear factura
- `PUT /api/facturas/:id/estado` - Cambiar estado
- `PUT /api/facturas/:id/corregir-datos` - Editar datos (Ruta 1)
- `DELETE /api/facturas/:facturaId/documentos/:documentoId/correccion` - Eliminar documento
- `POST /api/facturas/:id/documentos/correccion` - Agregar documento

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario

### Proveedores
- `GET /api/proveedores` - Listar proveedores
- `POST /api/proveedores` - Crear proveedor

---

## Frontend Modular

### Arquitectura ES6 Modules

El frontend utiliza módulos ES6 para mejor organización y mantenibilidad.

#### Módulos Principales

**config/config.js**
```javascript
export const CONFIG = {
    API_BASE_URL: '/api',
    TOKEN_KEY: 'token',
    POLLING_INTERVAL: 30000
};
```

**utils/auth.js**
```javascript
export function getToken() { ... }
export function setToken(token) { ... }
export function getCurrentUser() { ... }
```

**services/api.service.js**
```javascript
export async function fetchAPI(endpoint, options) { ... }
```

**components/modal.js**
```javascript
export function showModal(title, content) { ... }
export function hideModal() { ... }
```

### Uso en Desarrollo

Los módulos se cargan automáticamente con:
```html
<script type="module" src="app.js"></script>
```

### Migración en Progreso

Actualmente en modo híbrido:
- ✅ Utilidades básicas modularizadas
- ✅ Componentes UI separados
- 🔄 Vistas en proceso de migración
- 📦 Código legacy en `app.js.old`

---

## Notas de Desarrollo

### Constantes Backend
Importar desde módulo centralizado:
```javascript
const { ESTADOS, ROLES, ACCIONES } = require('../constants');
```

### Workflow
Define la lógica de transición de estados:
```javascript
const { calcularTransicion } = require('../utils/workflow');
```

---

## Mantenimiento

### Logs
Los logs se guardan en `App/logs/`

### Backups
Recomendado: Backup diario de PostgreSQL
```bash
pg_dump -U postgres gestor_facturas > backup_$(date +%Y%m%d).sql
```

---

**Fecha**: 2025-12-10  
**Versión**: 2.0 (Modular)  
**Estado**: ✅ Backend Refactorizado | 🔄 Frontend en Migración

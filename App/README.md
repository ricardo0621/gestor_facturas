# Gestor de Facturas - Clínica San Francisco

Sistema de gestión y seguimiento de facturas con flujo de aprobación multi-ruta.

## 🚀 Características Principales

- ✅ **Gestión de Facturas**: Carga, seguimiento y aprobación
- ✅ **Flujo Multi-Ruta**: 4 rutas de aprobación especializadas
- ✅ **Roles Especializados**: Control granular de permisos
- ✅ **Búsqueda Avanzada**: Filtros por fecha, NIT, proveedor, etc.
- ✅ **Notificaciones en Tiempo Real**: Alertas sonoras y visuales
- ✅ **Historial Completo**: Trazabilidad de todas las acciones
- ✅ **Gestión de Documentos**: Múltiples archivos por factura

## 📋 Requisitos

- Node.js >= 14.x
- PostgreSQL >= 12.x
- npm >= 6.x

## 🛠️ Instalación

```bash
# 1. Clonar el repositorio
git clone [url-del-repo]

# 2. Instalar dependencias
cd App
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Inicializar base de datos
node scripts/database/init-database.js

# 5. Iniciar servidor
npm start
```

## 📁 Estructura del Proyecto

```
Gestor_Facturas/
├── App/                    # Backend (Node.js + Express)
│   ├── config/            # Configuración
│   ├── controller/        # Controladores
│   ├── middlewares/       # Middlewares
│   ├── routes/            # Rutas API
│   ├── services/          # Lógica de negocio
│   ├── utils/             # Utilidades
│   ├── migrations/        # Migraciones de BD
│   ├── scripts/           # Scripts de utilidad
│   ├── docs/              # Documentación
│   ├── logs/              # Archivos de log
│   └── uploads/           # Archivos subidos
│
└── frontend/              # Frontend (Vanilla JS)
    ├── assets/            # Recursos estáticos
    ├── css/               # Estilos
    ├── js/                # JavaScript
    └── index.html         # Página principal
```

## 🔐 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `SUPER_ADMIN` | Acceso total al sistema |
| `RUTA_1` | Carga de facturas |
| `RUTA_2_*` | Aprobadores especializados (6 tipos) |
| `RUTA_3` | Contabilidad |
| `RUTA_4` | Tesorería |
| `BUSQUEDA_FACTURAS` | Búsqueda avanzada |

## 📚 Documentación

- [Guía de Instalación](docs/guides/instalacion.md)
- [Guía de Usuario](docs/guides/usuario.md)
- [API Documentation](docs/api/README.md)
- [Características](docs/features/README.md)

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start                    # Iniciar servidor

# Administración
node scripts/admin/generate-admin-password.js
node scripts/admin/update-admin-password.js

# Base de Datos
node scripts/database/init-database.js
node scripts/utils/check_schema.js
```

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Facturas
- `GET /api/facturas` - Listar facturas
- `POST /api/facturas/cargar` - Cargar factura
- `GET /api/facturas/:id` - Obtener detalles
- `PUT /api/facturas/:id/estado` - Cambiar estado
- `GET /api/facturas/busqueda-avanzada` - Búsqueda avanzada
- `GET /api/facturas/pendientes/count` - Contar pendientes

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario

### Proveedores
- `GET /api/proveedores` - Listar proveedores
- `POST /api/proveedores` - Crear proveedor

## 🔔 Sistema de Notificaciones

- **Polling**: Cada 30 segundos
- **Badge Visual**: Contador en el menú
- **Toast Notifications**: Mensajes emergentes
- **Sonido**: Alerta sonora para nuevas facturas

## 🛡️ Seguridad

- Autenticación JWT
- Bcrypt para contraseñas
- Validación de permisos por rol
- Sanitización de inputs
- CORS configurado

## 📝 Changelog

Ver [CHANGELOG.md](docs/changelog/README.md) para el historial de cambios.

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es propiedad de **Clínica San Francisco S.A.**

## 📞 Soporte

Para soporte técnico, contactar a: soporte@clinicasanfrancisco.com

---

**Desarrollado para Clínica San Francisco S.A.** 🏥

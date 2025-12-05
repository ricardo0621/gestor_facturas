# 🏗️ PLAN DE REORGANIZACIÓN DEL PROYECTO

## 📊 ANÁLISIS ACTUAL

### Archivos que se pueden ELIMINAR ❌

#### Scripts de Migración Ejecutados (Ya no necesarios):
- `migrar_ruta2_rol.js` - Migración ya ejecutada
- `migrate_usuarios.js` - Migración ya ejecutada
- `migrate_proveedores.js` - Migración ya ejecutada
- `ejecutar_migraciones_ruta2.js` - Migración ya ejecutada
- `crear_rol_busqueda.js` - Rol ya creado
- `fix_proveedores_table.sql` - Fix ya aplicado

#### Scripts de Utilidad Temporal:
- `check_schema.js` - Solo para verificación inicial
- `verificar_estructura_bd.js` - Solo para verificación
- `test-workflow.js` - Script de prueba
- `dummy.pdf` - Archivo de prueba

#### Backups Antiguos:
- `services_backup_20251130_211807/` - Backup antiguo

#### Archivos de Log:
- `error.log` - Se regenera automáticamente

### Archivos que se pueden MOVER a carpeta `/docs` 📚

Todos los archivos `.md` de documentación:
- `BUSQUEDA_AVANZADA.md`
- `CAMBIOS_ROL_Y_AISLAMIENTO.md`
- `CORRECCIONES_APLICADAS.md`
- `CORRECCION_RUTA3_DOCUMENTO.md`
- `IMPLEMENTACION_COMPLETA_RUTA2.md`
- `INSTRUCCIONES_DEBUG.md`
- `INSTRUCCIONES_REINICIAR_SERVIDOR.md`
- `INSTRUCCIONES_RUTA3_DOCUMENTO.md`
- `PLAN_RUTA2_ESPECIALIZADA.md`
- `PROGRESO_RUTA2_ESPECIALIZADA.md`
- `RESUMEN_CORRECCIONES_2025-12-04.md`
- `SOPORTE_MULTIPLES_ROLES.md`

### Archivos que se pueden MOVER a carpeta `/scripts` 🔧

Scripts de utilidad que se mantienen:
- `generate-admin-password.js`
- `update-admin-password.js`
- `init-database.js`
- `schema.sql`

---

## 🎯 NUEVA ESTRUCTURA PROPUESTA

```
Gestor_Facturas/
├── App/
│   ├── config/                    # ✅ Ya existe
│   │   ├── database.js
│   │   └── env.js
│   │
│   ├── controller/                # ✅ Ya existe
│   │   ├── auth.controller.js
│   │   ├── factura.controller.js
│   │   ├── proveedor.controller.js
│   │   ├── usuario.controller.js
│   │   └── workflow.controller.js
│   │
│   ├── middlewares/               # ✅ Ya existe
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   │
│   ├── routes/                    # ✅ Ya existe
│   │   ├── auth.route.js
│   │   ├── factura.route.js
│   │   ├── proveedor.route.js
│   │   └── usuario.route.js
│   │
│   ├── services/                  # ✅ Ya existe
│   │   ├── auth.service.js
│   │   ├── factura.service.js
│   │   ├── proveedor.service.js
│   │   ├── usuario.service.js
│   │   ├── workflow.service.js
│   │   ├── estado.service.js
│   │   └── rol.service.js
│   │
│   ├── utils/                     # ✅ Ya existe
│   │   └── jwt.js
│   │
│   ├── migrations/                # ✅ Ya existe - MOVER scripts ejecutados aquí
│   │   ├── executed/              # 🆕 NUEVA - Migraciones ya ejecutadas
│   │   │   ├── 001_migrar_ruta2_rol.js
│   │   │   ├── 002_migrate_usuarios.js
│   │   │   ├── 003_migrate_proveedores.js
│   │   │   └── 004_crear_rol_busqueda.js
│   │   │
│   │   └── pending/               # 🆕 NUEVA - Migraciones futuras
│   │       └── .gitkeep
│   │
│   ├── scripts/                   # 🆕 NUEVA - Scripts de utilidad
│   │   ├── admin/
│   │   │   ├── generate-admin-password.js
│   │   │   └── update-admin-password.js
│   │   │
│   │   ├── database/
│   │   │   ├── init-database.js
│   │   │   └── schema.sql
│   │   │
│   │   └── utils/
│   │       ├── check_schema.js
│   │       └── verificar_estructura_bd.js
│   │
│   ├── docs/                      # 🆕 NUEVA - Documentación
│   │   ├── features/              # Documentación de características
│   │   │   ├── busqueda-avanzada.md
│   │   │   ├── ruta2-especializada.md
│   │   │   ├── ruta3-documento.md
│   │   │   └── notificaciones.md
│   │   │
│   │   ├── guides/                # Guías de uso
│   │   │   ├── debug.md
│   │   │   ├── reiniciar-servidor.md
│   │   │   └── deployment.md
│   │   │
│   │   └── changelog/             # Historial de cambios
│   │       ├── 2025-11-30.md
│   │       ├── 2025-12-04.md
│   │       └── README.md
│   │
│   ├── uploads/                   # 🆕 NUEVA - Archivos subidos
│   │   └── .gitkeep
│   │
│   ├── logs/                      # 🆕 NUEVA - Logs
│   │   ├── error.log
│   │   └── .gitkeep
│   │
│   ├── .env                       # ✅ Mantener
│   ├── .gitignore                 # 🆕 CREAR
│   ├── package.json               # ✅ Mantener
│   ├── package-lock.json          # ✅ Mantener
│   ├── server.js                  # ✅ Mantener
│   └── README.md                  # 🆕 CREAR
│
└── frontend/                      # ✅ Ya existe
    ├── assets/                    # 🆕 NUEVA - Recursos estáticos
    │   ├── images/
    │   │   ├── logo-clinica.png
    │   │   └── clinica-bg.jpg
    │   │
    │   └── sounds/
    │       └── notification.mp3
    │
    ├── css/                       # 🆕 NUEVA - Estilos organizados
    │   ├── styles.css
    │   ├── badge-notif.css
    │   └── components/
    │       ├── navbar.css
    │       ├── cards.css
    │       └── forms.css
    │
    ├── js/                        # 🆕 NUEVA - JavaScript organizado
    │   ├── app.js
    │   ├── config.js
    │   └── modules/
    │       ├── auth.js
    │       ├── facturas.js
    │       ├── usuarios.js
    │       └── notifications.js
    │
    ├── index.html                 # ✅ Mantener
    └── README.md                  # 🆕 CREAR
```

---

## 📝 ARCHIVOS NUEVOS A CREAR

### 1. `.gitignore`
```
node_modules/
.env
error.log
logs/*.log
uploads/*
!uploads/.gitkeep
soportes_facturas/*
```

### 2. `App/README.md`
Documentación principal del backend

### 3. `frontend/README.md`
Documentación del frontend

### 4. `docs/README.md`
Índice de toda la documentación

---

## 🚀 PLAN DE EJECUCIÓN

### Fase 1: Crear Estructura de Carpetas
1. Crear `/docs` con subcarpetas
2. Crear `/scripts` con subcarpetas
3. Crear `/migrations/executed` y `/migrations/pending`
4. Crear `/logs`
5. Crear `/uploads`
6. Crear `/frontend/assets` con subcarpetas
7. Crear `/frontend/css/components`
8. Crear `/frontend/js/modules`

### Fase 2: Mover Archivos
1. Mover documentación `.md` a `/docs`
2. Mover scripts de migración a `/migrations/executed`
3. Mover scripts de utilidad a `/scripts`
4. Mover imágenes a `/frontend/assets/images`
5. Mover CSS adicional a `/frontend/css`

### Fase 3: Eliminar Archivos Obsoletos
1. Eliminar scripts de migración ya ejecutados (después de moverlos)
2. Eliminar backups antiguos
3. Eliminar archivos de prueba

### Fase 4: Crear Archivos de Documentación
1. Crear `.gitignore`
2. Crear `README.md` principal
3. Crear `docs/README.md`
4. Actualizar referencias en código si es necesario

---

## ⚠️ PRECAUCIONES

1. **Backup**: Hacer backup completo antes de reorganizar
2. **Git**: Si usas Git, hacer commit antes de reorganizar
3. **Rutas**: Verificar que no haya rutas hardcodeadas que se rompan
4. **Testing**: Probar la aplicación después de cada fase

---

## 📊 BENEFICIOS

✅ **Organización**: Estructura clara y profesional
✅ **Mantenibilidad**: Fácil encontrar archivos
✅ **Escalabilidad**: Preparado para crecer
✅ **Documentación**: Todo bien documentado
✅ **Limpieza**: Sin archivos obsoletos
✅ **Estándares**: Sigue mejores prácticas de Node.js

---

## 🎯 PRÓXIMOS PASOS

¿Quieres que proceda con la reorganización?

1. ✅ Puedo ejecutar automáticamente las Fases 1-3
2. ✅ Crear los archivos de documentación
3. ✅ Generar un script de migración seguro

**¿Procedemos?** 🚀

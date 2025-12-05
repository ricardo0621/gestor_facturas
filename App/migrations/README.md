# 📁 Migraciones de Base de Datos

Esta carpeta contiene las migraciones de la base de datos del proyecto.

## 📂 Estructura

```
migrations/
├── executed/          ← Migraciones YA EJECUTADAS (no volver a ejecutar)
│   ├── *.sql         SQL ejecutados
│   └── *.js          Scripts ejecutados
│
└── pending/           ← Migraciones FUTURAS (pendientes de ejecutar)
    └── .gitkeep
```

---

## ✅ Migraciones Ejecutadas (`/executed`)

**⚠️ NO EJECUTAR NUEVAMENTE - Ya están aplicadas en la base de datos**

### Scripts SQL:
1. `00_EJECUTAR_MIGRACION_RUTA2.sql` - Migración completa Ruta 2
2. `01_crear_roles_ruta2_especializada.sql` - Roles especializados
3. `02_crear_estados_ruta2_especializada.sql` - Estados especializados
4. `03_agregar_columna_aprobador_ruta2.sql` - Columna rol_aprobador_ruta2

### Scripts JavaScript:
1. `migrar_ruta2_rol.js` - Migración de usuario a rol en Ruta 2
2. `migrate_usuarios.js` - Migración de usuarios
3. `migrate_proveedores.js` - Migración de proveedores
4. `ejecutar_migraciones_ruta2.js` - Ejecutor de migraciones Ruta 2
5. `crear_rol_busqueda.js` - Creación del rol BUSQUEDA_FACTURAS

---

## 🔄 Migraciones Pendientes (`/pending`)

**Carpeta para futuras migraciones**

Cuando necesites crear una nueva migración:

1. Crea un archivo en `/pending`
2. Usa nomenclatura: `YYYY-MM-DD_descripcion.sql` o `.js`
3. Documenta qué hace la migración
4. Después de ejecutarla, muévela a `/executed`

### Ejemplo:
```
pending/
└── 2025-12-05_agregar_campo_observaciones.sql
```

---

## 📝 Cómo Crear una Nueva Migración

### 1. Crear archivo SQL:
```sql
-- migrations/pending/2025-12-05_descripcion.sql

-- Descripción: Agregar campo observaciones a facturas
-- Fecha: 2025-12-05
-- Autor: [Tu nombre]

BEGIN;

ALTER TABLE facturas 
ADD COLUMN observaciones TEXT;

COMMIT;
```

### 2. Ejecutar:
```bash
psql -U usuario -d gestor_facturas -f migrations/pending/2025-12-05_descripcion.sql
```

### 3. Mover a executed:
```bash
mv migrations/pending/2025-12-05_descripcion.sql migrations/executed/
```

---

## ⚠️ IMPORTANTE

- ✅ **NUNCA** modifiques archivos en `/executed`
- ✅ **SIEMPRE** crea nuevas migraciones en `/pending`
- ✅ **DOCUMENTA** cada migración
- ✅ **PRUEBA** en desarrollo antes de producción
- ✅ **MUEVE** a `/executed` después de aplicar

---

## 🔍 Ver Migraciones Ejecutadas

```bash
# Listar archivos SQL ejecutados
ls migrations/executed/*.sql

# Listar scripts JS ejecutados
ls migrations/executed/*.js
```

---

## 📚 Documentación

Para más información sobre migraciones:
- Ver `docs/guides/` para guías de base de datos
- Ver `scripts/database/schema.sql` para el esquema completo

---

**Última actualización**: Diciembre 2025

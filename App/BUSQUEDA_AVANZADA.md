# ✅ Búsqueda Avanzada de Facturas - Implementación Completa

## 🎯 Funcionalidad Implementada

Se ha creado una nueva sección de **Búsqueda Avanzada de Facturas** con permisos configurables.

---

## 🔐 Control de Acceso

### Nuevo Rol Creado
- **Código**: `BUSQUEDA_FACTURAS`
- **Nombre**: Búsqueda de Facturas
- **Descripción**: Permite acceso a la búsqueda avanzada de facturas

### Usuarios con Acceso
- ✅ **SUPER_ADMIN** (acceso total)
- ✅ **BUSQUEDA_FACTURAS** (acceso específico)

---

## 🔍 Filtros Disponibles

La búsqueda avanzada incluye los siguientes filtros:

### 1. **Fecha de Cargue (Rango)**
- Fecha Desde
- Fecha Hasta
- Busca por `fecha_creacion` de la factura

### 2. **NIT del Proveedor**
- Búsqueda parcial (ILIKE)
- Ejemplo: "900" encuentra "900123456"

### 3. **Nombre del Proveedor**
- Búsqueda parcial (ILIKE)
- Ejemplo: "Proveedor" encuentra "Proveedor XYZ"

### 4. **Usuario que Cargó**
- Búsqueda por nombre del usuario
- Búsqueda parcial (ILIKE)

### 5. **Número de Factura**
- Búsqueda parcial
- Ejemplo: "123" encuentra "FAC-12345"

### 6. **Facturas Mayores a $2,000,000**
- Checkbox para filtrar solo facturas con monto > 2 millones
- Útil para auditorías de montos altos

---

## 📋 Información Mostrada

Cada resultado muestra:

| Campo | Descripción |
|-------|-------------|
| **Número** | Número de factura |
| **Proveedor** | Nombre del proveedor |
| **NIT** | NIT del proveedor |
| **Monto** | Monto formateado en pesos colombianos |
| **Fecha Emisión** | Fecha de emisión de la factura |
| **Fecha Carga** | Fecha y hora de carga en el sistema |
| **Estado** | Estado actual con badge de color |
| **Cargada por** | Usuario que cargó la factura |
| **Anulada** | Badge si está anulada |
| **Acciones** | Botón "Ver Detalles" |

---

## 🛠️ Implementación Técnica

### Backend

#### 1. **Rol** (`crear_rol_busqueda.js`)
```sql
INSERT INTO roles (codigo, nombre) 
VALUES ('BUSQUEDA_FACTURAS', 'Búsqueda de Facturas')
```

#### 2. **Servicio** (`services/factura.service.js`)
- Función: `busquedaAvanzada(filtros, userId)`
- Validación de permisos
- Query dinámica con múltiples filtros
- Soporte para todos los filtros solicitados

#### 3. **Controlador** (`controller/factura.controller.js`)
- Función: `busquedaAvanzada(req, res)`
- Recibe filtros desde query params
- Manejo de errores 403 (sin permisos)

#### 4. **Ruta** (`routes/factura.route.js`)
- Endpoint: `GET /api/facturas/busqueda-avanzada`
- Requiere autenticación (`verifyToken`)
- Query params para filtros

### Frontend

#### 1. **HTML** (`index.html`)
- Nuevo enlace de navegación "Búsqueda Avanzada"
- Visible solo para usuarios con permiso

#### 2. **JavaScript** (`app.js`)
- `showBusquedaAvanzada()`: Muestra formulario de búsqueda
- `handleBusqueda()`: Procesa la búsqueda
- `mostrarResultadosBusqueda()`: Renderiza resultados
- `getEstadoBadgeClass()`: Colorea badges según estado

---

## 🎨 Interfaz de Usuario

### Formulario de Búsqueda
```
┌─────────────────────────────────────────────────┐
│  🔍 Búsqueda Avanzada de Facturas              │
├─────────────────────────────────────────────────┤
│  [Fecha Desde]  [Fecha Hasta]  [Núm. Factura] │
│  [NIT]          [Proveedor]    [Usuario]       │
│  [✓] Solo facturas mayores a $2,000,000        │
│  [🔍 Buscar]  [🔄 Limpiar]                     │
└─────────────────────────────────────────────────┘
```

### Resultados
```
┌─────────────────────────────────────────────────┐
│  Resultados de Búsqueda (X)                    │
├─────────────────────────────────────────────────┤
│  Número: FAC-001    Monto: $3,500,000         │
│  Proveedor: XYZ     Estado: [En Ruta 3]       │
│  NIT: 900123456     Cargada por: Juan Pérez    │
│                     [Ver Detalles]             │
└─────────────────────────────────────────────────┘
```

---

## 📝 Ejemplos de Uso

### Caso 1: Buscar facturas de un proveedor específico
```
NIT: 900123456
[Buscar]
```

### Caso 2: Buscar facturas altas del último mes
```
Fecha Desde: 2025-11-01
Fecha Hasta: 2025-11-30
[✓] Solo facturas mayores a $2,000,000
[Buscar]
```

### Caso 3: Buscar facturas cargadas por un usuario
```
Usuario: Juan Pérez
[Buscar]
```

### Caso 4: Búsqueda combinada
```
Fecha Desde: 2025-11-01
Proveedor: Proveedor XYZ
[✓] Solo facturas mayores a $2,000,000
[Buscar]
```

---

## 🔄 Para Aplicar los Cambios

### 1. Crear Rol (Ya ejecutado ✅)
```bash
node crear_rol_busqueda.js
```

### 2. Reiniciar Servidor
```bash
# Detener: Ctrl + C
npm run start
```

### 3. Asignar Rol a Usuarios
1. Ir a "Usuarios"
2. Seleccionar usuario
3. Asignar rol "Búsqueda de Facturas"
4. Guardar

### 4. Recargar Navegador
```
Ctrl + Shift + R
```

---

## ✅ Verificación

### 1. Verificar Enlace de Navegación
- Iniciar sesión con usuario que tenga el rol
- Verificar que aparezca "Búsqueda Avanzada" en el menú

### 2. Probar Búsqueda
- Hacer clic en "Búsqueda Avanzada"
- Ingresar criterios de búsqueda
- Hacer clic en "Buscar"
- Verificar resultados

### 3. Probar Permisos
- Iniciar sesión con usuario SIN el rol
- Verificar que NO aparezca el enlace
- Intentar acceder directamente (debe denegar acceso)

---

## 📊 Archivos Modificados/Creados

### Backend (5 archivos)
1. ✅ `crear_rol_busqueda.js` - Script de creación de rol
2. ✅ `services/factura.service.js` - Función busquedaAvanzada
3. ✅ `controller/factura.controller.js` - Controlador busquedaAvanzada
4. ✅ `routes/factura.route.js` - Ruta GET /busqueda-avanzada

### Frontend (2 archivos)
5. ✅ `index.html` - Enlace de navegación
6. ✅ `app.js` - Funciones de búsqueda y UI

### Documentación (1 archivo)
7. ✅ Este archivo

---

## 🎯 Beneficios

1. **Búsqueda Flexible**: Múltiples criterios combinables
2. **Control de Acceso**: Solo usuarios autorizados
3. **Auditoría**: Filtro especial para montos altos
4. **Trazabilidad**: Ver quién cargó cada factura
5. **Eficiencia**: Búsqueda rápida sin navegar todas las facturas

---

## ⚠️ Notas Importantes

- Los filtros son **opcionales** y **combinables**
- La búsqueda es **case-insensitive** (no distingue mayúsculas/minúsculas)
- Los resultados se ordenan por **fecha de creación descendente** (más recientes primero)
- El botón "Ver Detalles" abre el modal con información completa
- **SUPER_ADMIN** siempre tiene acceso a búsqueda avanzada

---

**Fecha**: 2025-12-04  
**Estado**: ✅ Implementado y listo para usar  
**Requiere**: Reiniciar servidor y asignar roles

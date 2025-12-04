# Plan de Implementación: Ruta 2 Especializada

## 🎯 Objetivo
Permitir que Ruta 1 (Cargador) seleccione el aprobador específico de Ruta 2 al cargar una factura, y que solo ese aprobador pueda ver y procesar esa factura.

---

## 📋 Nuevos Roles de Ruta 2

### Roles Actuales
- ❌ `RUTA_2` (genérico) - Se eliminará o quedará como legacy

### Nuevos Roles Específicos
1. ✅ `RUTA_2_CONTROL_INTERNO` - Control Interno
2. ✅ `RUTA_2_DIRECCION_MEDICA` - Dirección Médica
3. ✅ `RUTA_2_DIRECCION_FINANCIERA` - Dirección Financiera
4. ✅ `RUTA_2_DIRECCION_ADMINISTRATIVA` - Dirección Administrativa
5. ✅ `RUTA_2_DIRECCION_GENERAL` - Dirección General

---

## 🗄️ Cambios en Base de Datos

### 1. Tabla `roles` - Agregar nuevos roles

```sql
-- Insertar nuevos roles de Ruta 2
INSERT INTO roles (codigo, nombre, descripcion) VALUES
('RUTA_2_CONTROL_INTERNO', 'Control Interno', 'Aprobador de Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'Dirección Médica', 'Aprobador de Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'Dirección Financiera', 'Aprobador de Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'Dirección Administrativa', 'Aprobador de Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'Dirección General', 'Aprobador de Dirección General');
```

### 2. Tabla `estados` - Agregar nuevos estados

```sql
-- Insertar nuevos estados específicos de Ruta 2
INSERT INTO estados (codigo, nombre, descripcion) VALUES
('RUTA_2_CONTROL_INTERNO', 'En Control Interno', 'Pendiente de aprobación por Control Interno'),
('RUTA_2_DIRECCION_MEDICA', 'En Dirección Médica', 'Pendiente de aprobación por Dirección Médica'),
('RUTA_2_DIRECCION_FINANCIERA', 'En Dirección Financiera', 'Pendiente de aprobación por Dirección Financiera'),
('RUTA_2_DIRECCION_ADMINISTRATIVA', 'En Dirección Administrativa', 'Pendiente de aprobación por Dirección Administrativa'),
('RUTA_2_DIRECCION_GENERAL', 'En Dirección General', 'Pendiente de aprobación por Dirección General');
```

### 3. Tabla `facturas` - Agregar campo de aprobador asignado

```sql
-- Agregar columna para almacenar el usuario aprobador asignado
ALTER TABLE facturas 
ADD COLUMN usuario_aprobador_ruta2_id INTEGER REFERENCES usuarios(usuario_id);

-- Agregar índice para mejorar consultas
CREATE INDEX idx_facturas_aprobador_ruta2 ON facturas(usuario_aprobador_ruta2_id);
```

---

## 🔄 Cambios en el Flujo de Trabajo

### Flujo Anterior
```
Ruta 1 carga factura → RUTA_2 (genérico) → Cualquier usuario de Ruta 2 puede aprobar
```

### Nuevo Flujo
```
Ruta 1 carga factura 
    ↓
Selecciona aprobador específico de Ruta 2
    ↓
Estado: RUTA_2_[TIPO_ESPECIFICO]
    ↓
Solo el usuario asignado ve la factura
    ↓
Usuario asignado aprueba/rechaza
    ↓
Si aprueba → RUTA_3 (Contabilidad)
    ↓
RUTA_4 (Tesorería)
    ↓
FINALIZADA
```

---

## 💻 Cambios en el Código

### 1. Backend - `factura.service.js`

#### Modificar `crearFacturaConMultiplesArchivos`
- Agregar parámetro `usuarioAprobadorRuta2Id`
- Determinar estado inicial según el rol del aprobador
- Guardar `usuario_aprobador_ruta2_id` en la factura

#### Modificar `listarFacturas`
- Filtrar facturas según el rol específico de Ruta 2
- Mostrar solo facturas asignadas al usuario logueado

#### Modificar `procesarFactura`
- Validar que el usuario que aprueba sea el asignado
- Actualizar transiciones de estado

### 2. Backend - `factura.controller.js`

#### Modificar `cargarFactura`
- Recibir `usuarioAprobadorRuta2Id` del frontend
- Validar que el usuario seleccionado tenga un rol de Ruta 2
- Pasar el parámetro al servicio

### 3. Backend - `usuario.controller.js`

#### Crear `listarUsuariosRuta2`
- Endpoint para obtener lista de usuarios con roles de Ruta 2
- Usado en el frontend para el selector

### 4. Frontend - `app.js`

#### Modificar `showCargarFactura`
- Agregar selector de aprobador de Ruta 2
- Cargar lista de usuarios de Ruta 2 disponibles
- Validar que se seleccione un aprobador antes de enviar

#### Modificar `listarFacturas`
- Actualizar filtros para nuevos estados de Ruta 2

---

## 🎨 Cambios en la Interfaz

### Formulario de Carga de Factura

**Agregar campo**:
```html
<div class="form-group">
    <label class="form-label">Aprobador de Ruta 2 *</label>
    <select id="aprobadorRuta2" class="form-select" required>
        <option value="">Seleccionar aprobador...</option>
        <option value="1">Juan Pérez - Control Interno</option>
        <option value="2">María García - Dirección Médica</option>
        <option value="3">Carlos López - Dirección Financiera</option>
        <option value="4">Laura Rodríguez - Dirección Administrativa</option>
        <option value="5">Ana Martínez - Dirección General</option>
    </select>
</div>
```

---

## 📝 Archivos a Modificar

### Base de Datos
1. ✅ Script SQL para nuevos roles
2. ✅ Script SQL para nuevos estados
3. ✅ Script SQL para alterar tabla facturas

### Backend
1. ✅ `services/factura.service.js`
   - `crearFacturaConMultiplesArchivos`
   - `listarFacturas`
   - `procesarFactura`

2. ✅ `controller/factura.controller.js`
   - `cargarFactura`

3. ✅ `controller/usuario.controller.js`
   - Nueva función `listarUsuariosRuta2`

4. ✅ `routes/usuario.route.js`
   - Nueva ruta `GET /api/usuarios/ruta2`

5. ✅ `utils/workflow.js`
   - Actualizar transiciones de estado

### Frontend
1. ✅ `app.js`
   - `showCargarFactura` - Agregar selector
   - `handleCargarFactura` - Enviar aprobador
   - `listarFacturas` - Filtros actualizados
   - `getAvailableActions` - Validar permisos

---

## 🔐 Validaciones a Implementar

### Al Cargar Factura (Ruta 1)
- ✅ Validar que se haya seleccionado un aprobador de Ruta 2
- ✅ Validar que el usuario seleccionado exista y tenga rol de Ruta 2
- ✅ Validar que el usuario seleccionado esté activo

### Al Listar Facturas (Ruta 2)
- ✅ Mostrar solo facturas asignadas al usuario logueado
- ✅ Validar que el estado coincida con el rol del usuario

### Al Aprobar/Rechazar (Ruta 2)
- ✅ Validar que el usuario logueado sea el aprobador asignado
- ✅ Validar que el estado de la factura coincida con el rol del usuario

---

## 🧪 Casos de Prueba

### Caso 1: Carga de Factura
1. Usuario Ruta 1 carga factura
2. Selecciona "Juan Pérez - Control Interno"
3. Sistema crea factura con estado `RUTA_2_CONTROL_INTERNO`
4. Sistema asigna `usuario_aprobador_ruta2_id = 1`

### Caso 2: Visualización de Facturas
1. Juan Pérez (Control Interno) inicia sesión
2. Ve solo facturas en estado `RUTA_2_CONTROL_INTERNO` asignadas a él
3. María García (Dirección Médica) inicia sesión
4. Ve solo facturas en estado `RUTA_2_DIRECCION_MEDICA` asignadas a ella

### Caso 3: Aprobación
1. Juan Pérez aprueba factura
2. Sistema cambia estado a `RUTA_3`
3. Sistema limpia `usuario_aprobador_ruta2_id` (opcional)
4. Factura pasa a Contabilidad

### Caso 4: Rechazo
1. Juan Pérez rechaza factura
2. Sistema cambia estado a `RUTA_1`
3. Factura regresa a Cargador para corrección
4. Se mantiene `usuario_aprobador_ruta2_id` para re-envío

---

## 📊 Compatibilidad con Sistema Actual

### Migración de Datos Existentes
- Facturas existentes en estado `RUTA_2` se pueden:
  - Opción 1: Mantener como están (legacy)
  - Opción 2: Asignar a un aprobador por defecto
  - Opción 3: Requerir re-asignación manual

### Usuarios Existentes con Rol `RUTA_2`
- Se les puede asignar uno de los nuevos roles específicos
- O mantener el rol genérico para compatibilidad

---

## ⏱️ Estimación de Tiempo

1. **Scripts SQL**: 30 minutos
2. **Backend (servicios y controladores)**: 2 horas
3. **Frontend (interfaz y lógica)**: 1.5 horas
4. **Pruebas**: 1 hora
5. **Documentación**: 30 minutos

**Total estimado**: ~5.5 horas

---

## 🚀 Orden de Implementación

1. ✅ Crear scripts SQL (roles, estados, columna)
2. ✅ Ejecutar scripts en base de datos
3. ✅ Actualizar `workflow.js` con nuevas transiciones
4. ✅ Modificar servicios backend
5. ✅ Modificar controladores backend
6. ✅ Crear endpoint para listar usuarios Ruta 2
7. ✅ Actualizar frontend (formulario de carga)
8. ✅ Actualizar frontend (listado y filtros)
9. ✅ Probar funcionalidad completa
10. ✅ Documentar cambios

---

## 📌 Notas Importantes

- Esta implementación NO afecta Ruta 3 ni Ruta 4
- El flujo después de Ruta 2 sigue igual (Ruta 3 → Ruta 4 → Finalizada)
- Se mantiene la funcionalidad de documento de soporte en Ruta 3
- Los permisos se validan tanto en frontend como backend

---

**¿Procedo con la implementación?** 🚀

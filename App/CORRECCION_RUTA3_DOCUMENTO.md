# Corrección Final: Documento de Soporte en Ruta 3

## Problema Identificado

Después de implementar la ruta `/estado-con-documento`, al intentar aprobar una factura en Ruta 3 con documento de soporte, aparecía el error:

> **"No se pueden agregar documentos después de la carga inicial. Solo evidencia de pago."**

### Causa Raíz

La función `agregarDocumento` en `factura.service.js` tenía una validación restrictiva que **SOLO permitía agregar documentos de tipo `EVIDENCIA_PAGO`** (línea 330). Esto bloqueaba completamente la posibilidad de agregar documentos de tipo `SOPORTE`.

```javascript
// CÓDIGO ANTERIOR (BLOQUEABA SOPORTE)
if (tipoDocumento !== 'EVIDENCIA_PAGO') {
    throw new Error('No se pueden agregar documentos después de la carga inicial. Solo evidencia de pago.');
}
```

## Solución Implementada

### Modificación en `factura.service.js`

Se actualizó la función `agregarDocumento` para permitir **dos tipos de documentos** después de la carga inicial:

1. **`EVIDENCIA_PAGO`** → Solo usuarios de **Ruta 4 (Tesorería)**
2. **`SOPORTE`** → Solo usuarios de **Ruta 3 (Contabilidad)**

**Nueva lógica de validación**:

```javascript
// Validar permisos según tipo de documento
if (tipoDocumento === 'EVIDENCIA_PAGO') {
    // Solo usuarios de Ruta 4 pueden subir evidencia de pago
    const rolesCheck = await client.query(`
        SELECT r.codigo FROM usuario_roles ur
        JOIN roles r ON ur.rol_id = r.rol_id
        WHERE ur.usuario_id = $1 AND r.codigo = 'RUTA_4'
    `, [userId]);

    if (rolesCheck.rows.length === 0) {
        throw new Error('Solo usuarios de Tesorería (Ruta 4) pueden subir evidencia de pago.');
    }
} else if (tipoDocumento === 'SOPORTE') {
    // Solo usuarios de Ruta 3 pueden subir documentos de soporte
    const rolesCheck = await client.query(`
        SELECT r.codigo FROM usuario_roles ur
        JOIN roles r ON ur.rol_id = r.rol_id
        WHERE ur.usuario_id = $1 AND r.codigo = 'RUTA_3'
    `, [userId]);

    if (rolesCheck.rows.length === 0) {
        throw new Error('Solo usuarios de Contabilidad (Ruta 3) pueden subir documentos de soporte.');
    }
} else {
    // Otros tipos de documentos no están permitidos después de la carga inicial
    throw new Error('No se pueden agregar documentos de este tipo después de la carga inicial.');
}
```

## Flujo Completo de la Funcionalidad

### 1. Usuario en Ruta 3 (Contabilidad)
- Ve una factura pendiente de aprobación
- Hace clic en "APROBAR"

### 2. Frontend muestra formulario
- Campo de **Observación** (obligatorio)
- Campo de **Documento de Soporte** (obligatorio)
- Botón "Confirmar"

### 3. Frontend envía petición
```javascript
PUT /api/facturas/:id/estado-con-documento
Content-Type: multipart/form-data

FormData:
- accion: "APROBAR"
- observacion: "Texto de observación"
- documentoSoporte: [archivo]
```

### 4. Backend procesa (Controlador)
- `procesarEstadoConDocumento` recibe la petición
- Valida que exista el archivo
- Llama a `agregarDocumento` con tipo `SOPORTE`

### 5. Backend valida (Servicio)
- `agregarDocumento` verifica que el usuario tenga rol `RUTA_3`
- Inserta el documento en la base de datos
- Retorna al controlador

### 6. Backend procesa estado
- `procesarFactura` cambia el estado de la factura
- Registra en el historial
- Retorna éxito

## Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `App/controller/factura.controller.js` | ✅ Nueva función `procesarEstadoConDocumento` | 196-269 |
| `App/routes/factura.route.js` | ✅ Nueva ruta `PUT /:id/estado-con-documento` | 91 |
| `App/routes/factura.route.js` | ✅ Middlewares separados para documentos | 51-61 |
| `App/services/factura.service.js` | ✅ Actualizada validación en `agregarDocumento` | 329-355 |

## Validación

✅ Sintaxis verificada en todos los archivos
✅ No hay errores de compilación
✅ Lógica de permisos implementada correctamente

## Próximos Pasos

1. **Reiniciar el servidor** (ya en ejecución)
2. **Probar la funcionalidad**:
   - Iniciar sesión como usuario de Ruta 3 (Contabilidad)
   - Seleccionar una factura en estado RUTA_3
   - Hacer clic en "APROBAR"
   - Completar observación
   - Seleccionar archivo de soporte
   - Confirmar
   - Verificar que la aprobación sea exitosa

## Fecha de Corrección

2025-12-04 08:20 AM (Hora Colombia)

---

## Resumen de Cambios

**Antes**: Solo se podían agregar documentos de tipo `EVIDENCIA_PAGO` después de la carga inicial.

**Ahora**: Se pueden agregar dos tipos de documentos:
- `EVIDENCIA_PAGO` → Ruta 4 (Tesorería)
- `SOPORTE` → Ruta 3 (Contabilidad)

**Resultado**: Los usuarios de Contabilidad ahora pueden aprobar facturas con documentos de soporte obligatorios. ✅

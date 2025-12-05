# INSTRUCCIONES PARA COMPLETAR FUNCIONALIDAD DE DOCUMENTO OBLIGATORIO EN RUTA_3

## ESTADO ACTUAL

### ✅ COMPLETADO (Frontend)
1. **app.js** - Formulario actualizado para mostrar campo de archivo obligatorio en RUTA_3
2. **app.js** - Función `executeAction` modificada para enviar archivo con FormData
3. **app.js** - Llamada a `showActionForm` actualizada para pasar estado actual

### ⚠️ PENDIENTE (Backend)

El archivo `App/controller/factura.controller.js` se corrompió durante la edición.

## SOLUCIÓN MANUAL

### Paso 1: Restaurar factura.controller.js

El archivo tiene contenido duplicado. Necesitas:

1. Abrir `d:\Gestor_Facturas\App\controller\factura.controller.js`
2. Eliminar todo el contenido duplicado (líneas 428 en adelante)
3. Asegurarte de que termine correctamente con la función `eliminarFactura` y el `module.exports`

### Paso 2: Agregar nueva función

Agregar ANTES del `module.exports`:

```javascript
/**
 * Endpoint para procesar estado con documento de soporte (para RUTA_3)
 */
const procesarEstadoConDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { accion, observacion } = req.body;
        const userId = req.user.usuario_id;
        const file = req.file;

        if (!accion) {
            return res.status(400).json({
                error: 'Acción requerida.',
                details: 'Debe especificar la acción a realizar.'
            });
        }

        if (!file) {
            return res.status(400).json({
                error: 'Documento requerido.',
                details: 'Debe adjuntar un documento de soporte para aprobar desde Contabilidad.'
            });
        }

        // Primero procesar la factura
        const resultado = await facturaService.procesarFactura(id, accion, userId, {
            observacion
        });

        // Luego agregar el documento de soporte
        await facturaService.agregarDocumento(id, file, 'SOPORTE_CONTABILIDAD', userId, 'Documento de soporte de Contabilidad');

        res.status(200).json({
            success: true,
            ...resultado,
            documentoAgregado: true
        });

    } catch (error) {
        console.error('Error al procesar factura con documento:', error);

        // Limpiar archivo si hubo error
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Error eliminando archivo:', e);
            }
        }

        if (error.message.includes('no fue encontrada')) {
            return res.status(404).json({ error: 'Factura no encontrada', details: error.message });
        }
        if (error.message.includes('no permitida') || error.message.includes('Solo')) {
            return res.status(400).json({ error: 'Acción no válida para el estado actual.', details: error.message });
        }

        res.status(500).json({
            error: 'Error al procesar la factura.',
            details: error.message
        });
    }
};
```

### Paso 3: Actualizar module.exports

Cambiar el `module.exports` para incluir la nueva función:

```javascript
module.exports = {
    cargarFactura,
    listarFacturas,
    obtenerFactura,
    procesarEstado,
    procesarEstadoConDocumento,  // <-- AGREGAR ESTA LÍNEA
    obtenerHistorial,
    obtenerEstadisticas,
    agregarDocumento,
    listarDocumentos,
    eliminarDocumento,
    descargarDocumento,
    eliminarFactura
};
```

### Paso 4: Agregar ruta en routes/facturas.js

Abrir `d:\Gestor_Facturas\App\routes\facturas.js` y agregar:

```javascript
// Después de la ruta PUT /facturas/:id/estado
router.put('/:id/estado-con-documento', 
    authMiddleware, 
    upload.single('documentoSoporte'),  // Importante: usar 'documentoSoporte' como nombre del campo
    facturaController.procesarEstadoConDocumento
);
```

## VERIFICACIÓN

Después de hacer estos cambios:

1. Reiniciar el servidor: `npm run start`
2. Verificar que no hay errores en la consola
3. Probar aprobando una factura desde RUTA_3 (Contabilidad)
4. Verificar que el campo de archivo aparece y es obligatorio
5. Verificar que el documento se sube correctamente

## ARCHIVOS MODIFICADOS

- ✅ `frontend/app.js` - Ya modificado
- ⚠️ `App/controller/factura.controller.js` - Necesita corrección manual
- ⚠️ `App/routes/facturas.js` - Necesita agregar ruta

## BACKUP

Se creó backup en: `d:\Gestor_Facturas\App\controller\factura.controller.js.backup_duplicado`

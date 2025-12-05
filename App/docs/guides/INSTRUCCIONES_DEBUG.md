# 🔧 Instrucciones para Resolver Errores

## ✅ Cambios Aplicados

He mejorado el manejo de errores en el sistema para que ahora muestre mensajes más detallados. Esto nos ayudará a identificar exactamente qué está fallando.

## 📋 Pasos para Probar

### 1. **Recargar la Página Completamente**
   - Presiona `Ctrl + Shift + R` (o `Ctrl + F5`) para hacer una recarga forzada
   - Esto asegura que se cargue el nuevo código JavaScript

### 2. **Abrir la Consola del Navegador**
   - Presiona `F12` para abrir las herramientas de desarrollador
   - Ve a la pestaña "Console" (Consola)
   - Deja esta pestaña abierta mientras pruebas

### 3. **Cerrar Sesión e Iniciar Sesión Nuevamente**
   - Haz clic en "Cerrar Sesión"
   - Vuelve a iniciar sesión con tus credenciales
   - Esto asegura que tengas un token válido

### 4. **Probar la Carga de Facturas**
   - Haz clic en "Facturas" en el menú
   - **Mira la consola del navegador** - debería mostrar mensajes de error detallados si algo falla
   - Toma una captura de pantalla de cualquier error que aparezca en la consola

### 5. **Probar la Descarga de Documentos**
   - Abre una factura (haz clic en "Ver Detalles")
   - Intenta descargar un documento
   - **Mira la consola del navegador** - debería mostrar la URL que está intentando usar
   - Si falla, toma una captura de pantalla del error

## 🔍 Qué Buscar en la Consola

Los mensajes ahora mostrarán:
- `Error loading recent invoices:` - Error al cargar facturas recientes
- `Error al cargar facturas:` - Error al cargar la lista de facturas
- `Descargando documento desde:` - URL que se está usando para descargar
- `Error al descargar documento:` - Error en la descarga

## 📸 Información Necesaria

Si los errores persisten, por favor comparte:
1. **Captura de pantalla de la consola del navegador** (pestaña Console)
2. **Captura de pantalla de la pestaña Network** (Red) mostrando las peticiones fallidas
3. El **rol del usuario** con el que estás probando (SUPER_ADMIN, RUTA_1, RUTA_2, etc.)

## ⚠️ Problemas Comunes

### Error: "No hay sesión activa"
**Solución:** Cierra sesión y vuelve a iniciar sesión

### Error: "Token inválido o expirado"
**Solución:** Cierra sesión y vuelve a iniciar sesión

### Error: "Error al cargar facturas"
**Posibles causas:**
- El servidor no está corriendo
- Hay un problema con la base de datos
- El usuario no tiene permisos

**Solución:** Revisa la consola del navegador para ver el mensaje de error específico

## 🚀 Servidor

El servidor está corriendo en: `http://172.16.2.230:3500`

Asegúrate de que el servidor esté activo antes de probar.

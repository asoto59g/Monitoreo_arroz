# Guía de Sincronización: App de Monitoreo -> Google Sheets

Siga estos pasos para asegurar que los datos viajen correctamente de su teléfono a su Excel:

## PASO 1: Abrir el Editor de Apps Script
1. En su **Hoja de Cálculo de Google**, vaya a: **Extensiones** > **Apps Script**.

## PASO 2: Pegar el Código Corregido
1. Borre el código actual y pegue este (actualizado para mayor confiabilidad):

....Javascript
function doPost(e) {
  // NOTA: Si presiona "Ejecutar" en el editor verá un error de 'postData', es NORMAL.
  // El script solo funciona cuando recibe datos de la App.
  if (!e || !e.postData) return ContentService.createTextOutput("Error: Ejecute 'testSheet' para probar.").setMimeType(ContentService.MimeType.TEXT);

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  try {
    var rawContent = e.postData.contents;
    var data = JSON.parse(rawContent);
    if (Array.isArray(data)) {
      data.forEach(function(record) { appendRecord(sheet, record); });
    } else {
      appendRecord(sheet, data);
    }
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    sheet.appendRow(["ERROR_SYNC", new Date(), err.toString(), "Contenido: " + (e.postData ? e.postData.contents : "NULO")]);
    return ContentService.createTextOutput("Error").setMimeType(ContentService.MimeType.TEXT);
  }
}

function appendRecord(sheet, r) {
  var h = r.header || {}; var c = r.coords || {}; var g = r.growth || {};
  var u = r.user || {};
  sheet.appendRow([
    r.timestamp, h.ciclo_name || h.ciclo, h.finca_name || h.finca,
    h.lote_name || h.lote, h.variedad, c.lat, c.lon,
    JSON.stringify(r.pests), JSON.stringify(r.diseases), JSON.stringify(r.weeds),
    g.poblacion, g.altura, g.lamina, g.fenologia,
    u.name, u.email
  ]);
}

function testSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow(["TEST", new Date(), "Prueba de conexión exitosa"]);
  Logger.log("Fila de prueba añadida correctamente.");
}
... final

2. Haga clic en **Guardar** y luego en **Ejecutar** seleccionando la función **`testSheet`** (arriba, al lado del botón Ejecutar) para dar permisos.
   > [!CAUTION]
   > NO presione "Ejecutar" con la función `doPost` seleccionada, ya que siempre dará el error que usted vio. `doPost` solo se activa automáticamente cuando la App envía datos.

## PASO 3: Publicar (Implementar) - CRÍTICO
1. Botón azul **Implementar** > **Gestionar implementaciones**.
2. Seleccione la implementación actual (el icono de lápiz) y elija **Añadir versión**.
3. **O BIEN:** Haga clic en **Nueva implementación**.
4. Tipo: **Aplicación Web**.
5. Ejecutar como: **Yo**.
6. **Quién tiene acceso: Cualquier persona** (o *Anyone*).
7. Haga clic en **Implementar** y COPIE la URL terminada en `/exec`.

> [!IMPORTANT]
> Si solo hace clic en "Guardar", el script NO se actualiza para la App. **DEBE generar una nueva versión** cada vez que cambie el código interno para que los cambios surtan efecto.

## PASO 4: Configurar y Sincronizar
1. En la App, use el botón **Sincronizar Todo** en el historial.
2. Pegue la URL del paso anterior.

> [!TIP]
> Si no ve los datos, revise la primera fila del Excel: si hay un error técnico, el script escribirá una fila indicando el problema (ERROR_SYNC).


# Instalación y Uso de la Aplicación en Campo

https://asoto59g.github.io/Monitoreo_arroz/

## 2. Instalar en el Teléfono

1. Abra la **URL de GitHub Pages** en el navegador de su teléfono.

2. Según el dispositivo:

### Android
- Toque el menú (tres puntos).
- Seleccione **"Instalar aplicación"** o **"Agregar a pantalla de inicio"**.

### iPhone
- Toque el botón **"Compartir"** (cuadrado con una flecha hacia arriba).
- Seleccione **"Agregar a pantalla de inicio"**.

---

## 3. Configurar la Nube

1. Siga los pasos de la **Guía de Sincronización**.
2. Copie la **URL de su Google Script App**.
3. Abra la aplicación en su teléfono.
4. Presione **Sincronizar**.
5. Pegue la **URL del Google Script** cuando se le solicite.

   https://script.google.com/macros/s/AKfycbzleBdROD0XcjYXt1M13YgadNdUQUbQpEQhd-jAmsJZq-OfLJNnPgDZbl7qLIqN9Nbd/exec

---

# Flujo de Trabajo en Campo

## Administración
Registre la información básica del sistema:

- **Ciclos**
- **Fincas**
- **Lotes**

---

## Monitoreo

1. Seleccione el **Ciclo** y el **Lote**.  
   - Los datos de **Variedad** y **Área** se completarán automáticamente.

2. Ingrese los niveles observados de:
   - **Plagas**
   - **Enfermedades**
   - **Malezas**

3. Guarde el **registro final**.

---

## Sincronización

Cuando regrese de la finca y tenga conexión a internet:

1. Presione el **botón de la nube** en el *dashboard*.
2. La aplicación enviará **todos los registros acumulados** a su **Google Sheets** automáticamente.
# GUÍA DE CONFIGURACIÓN – SINCRONIZACIÓN GOOGLE SHEETS

Siga estos pasos exactos para que los datos de su teléfono lleguen a su hoja de cálculo.

---

# PASO 1: Preparar la Hoja de Cálculo

1. Abra una **Hoja de Cálculo de Google** nueva o existente.

2. En el menú superior vaya a:

Extensiones > Apps Script

3. Se abrirá una nueva pestaña con el editor de **Apps Script**.

4. Si aparece algún código en el editor, **bórrelo completamente**.

---

# PASO 2: Copiar y Pegar el Código

1. Copie **TODO el código del script de sincronización**.

2. Péguelo dentro del editor de **Apps Script**.

---

# PASO 3: Dar Permisos (PASO VITAL)

1. En la barra superior del editor de Apps Script verifique que el menú desplegable muestre:

testSheet

2. Haga clic en el botón **Ejecutar (▶️)**.

3. Google solicitará permisos.

4. Haga clic en:

Revisar permisos

5. Seleccione su **cuenta de Google**.

6. Aparecerá el mensaje:

Google no ha verificado esta aplicación

7. Haga clic en:

Configuración avanzada

8. Luego seleccione:

Ir a [Nombre de su proyecto] (no seguro)

9. Haga clic en:

Permitir

10. Verifique que el sistema haya escrito **una fila de prueba en su hoja de cálculo**.

---

# PASO 4: Publicar (Implementar)

1. Haga clic en el botón azul:

Implementar

2. Seleccione:

Nueva implementación

3. Tipo de implementación:

Aplicación web

4. Configure los siguientes parámetros:

Ejecutar como: Yo (su correo)

Quién tiene acceso: Cualquier persona

Este paso es **fundamental** para que la aplicación del teléfono pueda enviar datos.

5. Haga clic en:

Implementar

6. Google generará una **URL de la aplicación web**.

7. **Copie esa URL**.

---

# PASO 5: Configurar en el Teléfono

1. Abra la **aplicación de monitoreo** en su teléfono.

2. Presione el botón:

Sincronizar

3. Pegue la **URL de la aplicación web** que copió en el paso anterior.

---

# RESULTADO

Cuando registre datos en el campo y presione **Sincronizar**, todos los registros se enviarán automáticamente a **Google Sheets**.

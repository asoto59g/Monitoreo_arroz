# 🌾 Plagueo en Arroz
### Sistema de Monitoreo Fitosanitario para Cultivos de Arroz
**Desarrollado por [ABC Geomática Agrícola SRL](https://abcgeomatica.com)** · Temporada 2026

---

## 📋 Descripción

**Plagueo en Arroz** es una **Progressive Web App (PWA)** diseñada para que técnicos y plagueros de campo registren monitoreos fitosanitarios directamente desde su dispositivo móvil, sin necesidad de papel ni conexión a internet permanente.

La aplicación permite registrar plagas, enfermedades, malezas y datos de crecimiento para lotes de arroz, y sincronizar los registros a una hoja de Google Sheets en la nube.

---

## 🚀 Funcionalidades

### 1. 📍 Datos del Encabezado
Antes de iniciar cada recorrido, el plaguero selecciona:
- **Ciclo agrícola** (ej: Verano 2026)
- **Finca** y **Lote / Parcela**
- Edad del cultivo (DDS), variedad y área (autocompletados desde la base de datos)
- Nombre del plaguero

El sistema captura automáticamente las **coordenadas GPS** al iniciar el monitoreo.

---

### 2. 🐛 Plagas

Se evalúan más de **20 especies** clasificadas en tres grupos:

| Grupo | Ejemplos |
|---|---|
| 🔴 Plagas Invertebradas | Spodoptera, Sogata, Minador, Rupella, Acaro Spinki, Diatrea… |
| 🔵 Plagas Vertebradas | Ratas, Piches, Gallito Azul, Zanate… |
| 🟢 Benéficos | Mariquitas, Arañas, Avispas, Libelulas, Crisopas… |

Cada plaga se califica con 4 niveles:

| Nivel | Significado |
|---|---|
| 🚫 NULO | Sin presencia (0%) |
| 🌿 BAJO | Presencia baja (25%) |
| ✋ MEDIO | Presencia moderada (50%) |
| 🔥 ALTO | Presencia alta (75%+) |

---

### 3. 🦠 Enfermedades

Se registran **13 enfermedades** con dos tipos de escala:
- **Escala 0–3** para enfermedades bacterianas y fungosas (Sarocladium, Xhantomonas, Helminstosporium…)
- **Escala 0–9 (IRRI)** para enfermedades de mayor impacto (Piricularia Follaje, Piricularia Cuello, Rizoctonia…) 3 niveles de incidendencia y 3 niveles de severidad

---

### 4. 🌿 Malezas

Se evalúan **23 especies de malezas** (gramíneas y de hoja ancha) con 3 escalas de densidad y 3 escalas de poblacion **0–9**:

> Arroz Rojo, Echinochloa, Leptochloa, Digitaria, Cyperus iria, Ludwigia, Sesbania, Rottboellia, entre otras.

---

### 5. 📈 Crecimiento del Cultivo

Datos agronómicos adicionales:
- 🌱 Población (plantas/m²)
- 📏 Altura de planta (cm)
- 💧 Lámina de agua (Seco / Saturado / Lámina)
- 🌾 Estado fenológico (Vegetativo / Reproductivo / Maduración / Cosecha)

---

### 6. ☁️ Sincronización con Google Sheets

Los registros se guardan localmente en el dispositivo y pueden sincronizarse a una hoja de cálculo de Google mediante un **Google Apps Script**. Compatible con trabajo sin internet.

---

### 7.  Rapidamente con esta informacion se genera mapas de problemas

arroz voluntario.png

---

## ⚙️ Administración

La sección **Admin** permite gestionar:
- 🔄 **Ciclos agrícolas** (crear/eliminar temporadas)
- 🏠 **Fincas** (registrar propiedades)
- 🗂️ **Lotes/Parcelas** (asociados a fincas y ciclos, con variedad y área)

---

## 📱 Instalación como App

Esta PWA puede instalarse en cualquier dispositivo móvil sin necesidad de tienda de aplicaciones:

- **Android (Chrome):** Menú ⋮ → *Instalar app*
- **iPhone (Safari):** Botón compartir 🔗 → *Agregar a pantalla de inicio*

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 / CSS3 | Estructura y estilos |
| JavaScript (Vanilla) | Lógica de la aplicación |
| Service Worker | Modo offline (PWA) |
| LocalStorage | Almacenamiento local de datos |
| Google Apps Script | Sincronización a Google Sheets |
| Lucide Icons | Íconos de interfaz |
| Google Fonts (Outfit) | Tipografía |

---

## 📁 Estructura del Proyecto

```
📦 Plagueo en Arroz/
├── index.html        # Estructura principal de la app
├── app.js            # Lógica de la aplicación
├── style.css         # Estilos y diseño UI
├── sw.js             # Service Worker (modo offline)
├── manifest.json     # Configuración PWA
└── icon-512.png      # Ícono de la app
```

---

## 👤 Créditos

**Desarrollado por:** ABC Geomática Agrícola SRL  
**Temporada:** 2026  
**Versión:** 1.0

---

> *Sistema de Monitoreo Fitosanitario — Todos los derechos reservados © 2026 ABC Geomática Agrícola SRL*


# Instalación y Uso de la Aplicación en Campo


## 2. Instalar en el Teléfono

1. Abra la **URL de GitHub Pages** en el navegador de su teléfono.

   https://asoto59g.github.io/Monitoreo_arroz/

3. Según el dispositivo:

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
5. Pegue la **URL del Google Script** cuando se le solicite. Este solo prueba

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

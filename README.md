# 🌾 Plagueo en Arroz
### Sistema de Monitoreo Fitosanitario para Cultivos de Arroz
**Desarrollado por ABC Geomática Agrícola SRL** · Temporada 2026

---

## 📋 Descripción

**Plagueo en Arroz** es una **Progressive Web App (PWA)** diseñada para que técnicos y plagueros de campo registren monitoreos fitosanitarios directamente desde su dispositivo móvil, sin necesidad de papel ni conexión a internet permanente.

La aplicación permite registrar plagas, enfermedades, malezas y datos de crecimiento para lotes de arroz, y sincronizar los registros a una hoja de Google Sheets en la nube.

---

##  🚀 Funcionalidades

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
- **Escala 0–9 (IRRI)** para enfermedades de mayor impacto (Piricularia Follaje, Piricularia Cuello, Rizoctonia…)

---

### 4. 🌿 Malezas

Se evalúan **23 especies de malezas** (gramíneas y de hoja ancha) con escala de densidad **0–9**:

> Arroz Rojo, Echinochloa, Leptochloa, Digitaria, Cyperus iria, Ludwigia, Sesbania, Rottboellia, entre otras.

---

### 5. 📈 Crecimiento del Cultivo

Datos agronómicos adicionales:
- 🌱 Población (plantas/m²)
- 📏 Altura de planta (cm)
- 💧 Lámina de agua (Seco / Saturado / Lámina)
- 🌾 Estado fenológico (Vegetativo / Reproductivo / Maduración / Cosecha)

---
### 6. 📱 Instalación como App

Esta PWA puede instalarse en cualquier dispositivo móvil sin necesidad de tienda de aplicaciones desde siguiente link:

https://asoto59g.github.io/Monitoreo_arroz/

- **Android (Chrome):** Menú ⋮ → *Instalar app*
- **iPhone (Safari):** Botón compartir 🔗 → *Agregar a pantalla de inicio*

---
### 7. ☁️ Sincronización con Google Sheets

Los registros se guardan localmente en el dispositivo y pueden sincronizarse a una hoja de cálculo de Google mediante un **Google Apps Script**. Compatible con trabajo sin internet.

https://script.google.com/macros/s/AKfycbxqg_ZNkjEH2Bx73aZnsqMIAGd_9c2ChMHeEWO5dAcOUbGVIbVnL57JLNWUDmdYpfv7/exec

---


### 8. ⚙️ Administración

La sección **Admin** permite gestionar:
- 🔄 **Ciclos agrícolas** (crear/eliminar temporadas)
- 🏠 **Fincas** (registrar propiedades)
- 🗂️ **Lotes/Parcelas** (asociados a fincas y ciclos, con variedad y área)

---


### 9. 🛠️ Tecnologías Utilizadas

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

### 10. 📁 Estructura del Proyecto

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

### 11. 👤 Créditos

**Desarrollado por:** ABC Geomática Agrícola SRL  
**Temporada:** 2026  
**Versión:** 1.0

---

> *Sistema de Monitoreo Fitosanitario — Todos los derechos reservados © 2026 ABC Geomática Agrícola SRL*

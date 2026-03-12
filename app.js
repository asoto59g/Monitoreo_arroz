/**
 * Plagueo en Arroz - Core Application Logic
 */

const APP_STATE = {
    currentView: 'dashboard',
    collections: {
        fincas: JSON.parse(localStorage.getItem('abc_fincas') || '[]'),
        lotes: JSON.parse(localStorage.getItem('abc_lotes') || '[]'),
        ciclos: JSON.parse(localStorage.getItem('abc_ciclos') || '[]'),
    },
    monitoring: {
        coords: null,
        header: {
            finca: null,
            lote: null,
            ciclo: null,
            edad: 0,
            variedad: "",
            area: "",
            plaguero: ""
        },
        pests: {},
        diseases: {},
        weeds: [],
        growth: {
            poblacion: 0,
            altura: 0,
            lamina: 0,
            fenologia: 0
        }
    },
    deferredPrompt: null
};

function saveData() {
    localStorage.setItem('abc_fincas', JSON.stringify(APP_STATE.collections.fincas));
    localStorage.setItem('abc_lotes', JSON.stringify(APP_STATE.collections.lotes));
    localStorage.setItem('abc_ciclos', JSON.stringify(APP_STATE.collections.ciclos));
}

const PEST_DB = {
    invertebrates: [
        { id: "spodoptera", name: "Spodoptera" },
        { id: "sogata", name: "Sogata" },
        { id: "mocis", name: "Mocis" },
        { id: "oebalus", name: "Oebalus" },
        { id: "tibraca", name: "Tibraca" },
        { id: "minador", name: "Minador" },
        { id: "acarospinki", name: "Acaro Spinki" },
        { id: "rupella", name: "Rupella" },
        { id: "salton", name: "Salton" },
        { id: "tetranychus", name: "Tetranychus" },
        { id: "afidos", name: "Afidos" },
        { id: "nematodos", name: "Nematodos" },
        { id: "marasmia", name: "Marasmia" },
        { id: "diatrea", name: "Diatrea" },
        { id: "gorgojo", name: "Gorgojo Agua" }
    ],
    vertebrates: [
        { id: "ratas", name: "Ratas" },
        { id: "gallito", name: "Gallito Azul" },
        { id: "piches", name: "Piches" },
        { id: "piuses", name: "Piuses" },
        { id: "sargento", name: "Sargento" },
        { id: "zarseta", name: "Zarseta" },
        { id: "zanate", name: "Zanate" }
    ],
    beneficials: [
        { id: "pentatomidos", name: "Pentatomidos" },
        { id: "libelulas", name: "Libelulas" },
        { id: "aranas", name: "Arañas" },
        { id: "mariquitas", name: "Mariquitas" },
        { id: "crisopas", name: "Crisopas" },
        { id: "avispas", name: "Avispas" },
        { id: "hongos", name: "Hongos" },
        { id: "parasitacion", name: "Parasitacion" }
    ]
};

const DISEASE_DB = [
    { id: "sarocladium", name: "Sarocladium", scale: 3 },
    { id: "xhantomonas", name: "Xhantomonas", scale: 3 },
    { id: "pseudomonas", name: "Pseudomonas", scale: 3 },
    { id: "burkholderia", name: "Burkholderia", scale: 3 },
    { id: "helminstosporium", name: "Helminstosporium", scale: 3 },
    { id: "dreslera", name: "Dreslera", scale: 3 },
    { id: "erwinia", name: "Erwinia", scale: 3 },
    { id: "hojablanca", name: "Hoja Blanca", scale: 3 },
    { id: "falsocarbon", name: "Falso Carbon", scale: 3 },
    { id: "piriculariaf", name: "Piricularia Follaje", scale: 9 },
    { id: "piriculariac", name: "Piricularia Cuello", scale: 9 },
    { id: "manchadograno", name: "Manchado Grano", scale: 3 },
    { id: "rizoctonia", name: "Rizoctonia", scale: 9 }
];
const WEED_DB = [
    "Arroz Rojo", "Echinochloa", "Leptochloa", "Arroz Pato", "Arroz Voluntario",
    "Digitaria", "Eleusine", "Rottboellia", "Ischaemun", "Aeschynomene",
    "Cyperus iria", "Eclipta alba", "Fimbrystilis", "Caperonia", "C. rotundus",
    "Ludwigia", "Navajuela", "Murdannia", "Sesbania", "Portulaca",
    "Heterantera", "Amarantus", "Esfenoclea"
];

const THRESHOLDS = {
    spodoptera: {
        stages: [
            { cond: "Arroz < 20 ddg", levels: [1, 3, 3] },
            { cond: "Arroz > 20 y < 45 ddg", levels: [6, 10, 10] },
            { cond: "Arroz > 45 ddg", levels: [10, 15, 15] }
        ]
    }
    // ... more thresholds to be added
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderView('dashboard');
});

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    APP_STATE.deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    renderView(APP_STATE.currentView);
});

window.addEventListener('appinstalled', (e) => {
    console.log('PWA instalado con éxito');
    APP_STATE.deferredPrompt = null;
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            APP_STATE.currentView = view;
            renderView(view);
            window.scrollTo(0, 0);
        });
    });
}

function renderView(viewName) {
    APP_STATE.currentView = viewName;
    const mainContent = document.getElementById('main-content');

    switch (viewName) {
        case 'dashboard':
            mainContent.innerHTML = renderDashboard();
            break;
        case 'admin':
            mainContent.innerHTML = renderAdmin();
            break;
        case 'admin_ciclos':
            mainContent.innerHTML = renderAdminCiclos();
            break;
        case 'admin_fincas':
            mainContent.innerHTML = renderAdminFincas();
            break;
        case 'records':
            mainContent.innerHTML = renderRecords();
            break;
        case 'monitor_header':
            mainContent.innerHTML = renderMonitorHeader();
            break;
        case 'monitor_pests':
            mainContent.innerHTML = renderMonitorPests();
            break;
        case 'monitor_diseases':
            mainContent.innerHTML = renderMonitorDiseases();
            break;
        case 'monitor_weeds':
            mainContent.innerHTML = renderMonitorWeeds();
            break;
        case 'admin_areas':
            mainContent.innerHTML = renderAdminAreas();
            break;
        case 'admin_lotes':
            mainContent.innerHTML = renderAdminLotes();
            break;
        case 'monitor_growth':
            mainContent.innerHTML = renderMonitorGrowth();
            break;
        default:
            mainContent.innerHTML = `<div class="card"><h2>${viewName}</h2><p>En desarrollo...</p></div>`;
    }
}

function renderDashboard() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const pending = records.filter(r => !r.synced).length;
    const synced = records.length - pending;
    const percent = records.length > 0 ? Math.round((synced / records.length) * 100) : 0;

    return `
        <div class="card">
            <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Hola, Plaguero</h1>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Listo para el monitoreo de hoy.</p>
        </div>
        
        <div class="card" style="text-align: center; border: 1px dashed var(--accent-emerald);">
            <p style="margin-bottom: 1.5rem;">Comience un nuevo registro de monitoreo</p>
            <button class="btn btn-primary" onclick="startMonitoring()">NUEVO MONITOREO</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="card" style="margin-bottom: 0;">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">TOTAL REGISTROS</p>
                <p style="font-size: 1.5rem; font-weight: 600;">${records.length}</p>
            </div>
            <div class="card" style="margin-bottom: 0;">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">PENDIENTES</p>
                <p style="font-size: 1.5rem; font-weight: 600; color: ${pending > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)'};">${pending}</p>
            </div>
        </div>

            ☁️ SINCRONIZAR CON GOOGLE SHEETS
        </button>

        <div id="pwa-install-container" style="margin-top: 1.5rem;">
            ${APP_STATE.deferredPrompt ? `
                <div class="card" style="text-align: center; border: 1px solid var(--accent-emerald); background: rgba(0, 242, 254, 0.05);">
                    <p style="font-size: 0.9rem; margin-bottom: 1rem;">📲 Instale la App en su pantalla de inicio para acceso rápido.</p>
                    <button class="btn btn-primary" style="width: 100%;" onclick="installPWA()">INSTALAR APP AHORA</button>
                </div>
            ` : `
                <div class="card" style="border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.03); padding: 1rem;">
                    <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem;">💡 ¿Cómo instalar esta App?</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                        Si no ve el botón de instalar, puede hacerlo manualmente:
                        <br><br>
                        <strong>En Android (Chrome):</strong> Toque los 3 puntos (⋮) arriba a la derecha y seleccione <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla de inicio".
                        <br><br>
                        <strong>En iPhone (Safari):</strong> Toque el botón compartir (󰐧) y seleccione <strong>"Agregar a la pantalla de inicio"</strong>.
                    </p>
                </div>
            `}
        </div>
    `;
}

function renderAdmin() {
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Administración</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('dashboard')">VOLVER</button>
        </div>
        
        <div class="card" onclick="renderView('admin_ciclos')">
            <h3>🔄 Ciclos</h3>
            <p style="color: var(--text-secondary);">${APP_STATE.collections.ciclos.length} registrados</p>
        </div>
        <div class="card" onclick="renderView('admin_fincas')">
            <h3>🏢 Fincas</h3>
            <p style="color: var(--text-secondary);">${APP_STATE.collections.fincas.length} registradas</p>
        </div>
        <div class="card" onclick="renderView('admin_lotes')">
            <h3>🚜 Lotes</h3>
            <p style="color: var(--text-secondary);">${APP_STATE.collections.lotes.length} registrados</p>
        </div>
    `;
}

function renderAdminCiclos() {
    const list = APP_STATE.collections.ciclos.map(c => `
        <div class="card" style="padding: 1rem; border-left: 4px solid var(--accent-emerald);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${c.nombre}</strong>
                <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; color: var(--accent-red);" onclick="deleteItem('ciclos', '${c.id}')">Eliminar</button>
            </div>
        </div>
    `).join('') || '<p style="text-align: center; color: var(--text-secondary);">No hay ciclos.</p>';

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Ciclos Agricolas</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('admin')">ATRÁS</button>
        </div>
        
        <div class="card" style="background: var(--nav-bg);">
            <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">Ej: Verano 2026, Invierno 2025</label>
            <input type="text" id="new-ciclo" placeholder="Nombre de Ciclo" class="input-modern">
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addItem('ciclos')">AGREGAR CICLO</button>
        </div>
        
        <div class="list-container">${list}</div>
    `;
}

function renderAdminFincas() {
    const list = APP_STATE.collections.fincas.map(f => `
        <div class="card" style="padding: 1rem; border-left: 4px solid var(--accent-emerald);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${f.nombre}</strong>
                <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; color: var(--accent-red);" onclick="deleteItem('fincas', '${f.id}')">Eliminar</button>
            </div>
        </div>
    `).join('') || '<p style="text-align: center; color: var(--text-secondary);">No hay fincas.</p>';

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Fincas</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('admin')">ATRÁS</button>
        </div>
        
        <div class="card" style="background: var(--nav-bg);">
            <input type="text" id="new-finca" placeholder="Nombre de Finca" class="input-modern">
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addItem('fincas')">AGREGAR FINCA</button>
        </div>
        
        <div class="list-container">${list}</div>
    `;
}

function addItem(collection) {
    const selector = {
        'fincas': 'new-finca',
        'ciclos': 'new-ciclo',
        'areas': 'new-area',
        'lotes': 'new-lote'
    }[collection];

    const input = document.getElementById(selector);
    if (!input || !input.value) return;

    APP_STATE.collections[collection].push({
        id: Date.now().toString(),
        nombre: input.value
    });

    saveData();
    renderView('admin_' + collection);
}

// Areas removed as requested

function renderAdminLotes() {
    const list = APP_STATE.collections.lotes.map(l => {
        const ciclo = APP_STATE.collections.ciclos.find(c => c.id === l.cicloId)?.nombre || 'N/A';
        return `
            <div class="card" style="padding: 1rem; border-left: 4px solid var(--accent-emerald);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>${l.nombre}</strong>
                    <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; color: var(--accent-red);" onclick="deleteItem('lotes', '${l.id}')">Eliminar</button>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                    <div>🔄 Ciclo: ${ciclo}</div>
                    <div>📍 Área: ${l.area || '-'}</div>
                    <div>🌾 Variedad: ${l.variedad || '-'}</div>
                </div>
            </div>
        `;
    }).join('') || '<p style="text-align: center; color: var(--text-secondary);">No hay lotes.</p>';

    const cicloOptions = APP_STATE.collections.ciclos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Lotes</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('admin')">ATRÁS</button>
        </div>
        <div class="card" style="background: var(--nav-bg);">
            <div class="field-group">
                <label>Ciclo Asociado</label>
                <select id="new-lote-ciclo" class="input-modern">${cicloOptions}</select>
            </div>
            <div class="field-group">
                <label>Nombre del Lote</label>
                <input type="text" id="new-lote-nombre" placeholder="Ej: Lote 01" class="input-modern">
            </div>
            <div class="field-group">
                <label>Área</label>
                <input type="text" id="new-lote-area" placeholder="Ej: 10 Ha" class="input-modern">
            </div>
            <div class="field-group">
                <label>Variedad</label>
                <input type="text" id="new-lote-variedad" placeholder="Ej: Palmar 18" class="input-modern">
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addItemLote()">AGREGAR LOTE</button>
        </div>
        <div class="list-container">${list}</div>
    `;
}

// addItemArea removed

function addItemLote() {
    const nombreInput = document.getElementById('new-lote-nombre');
    const cicloInput = document.getElementById('new-lote-ciclo');
    const areaInput = document.getElementById('new-lote-area');
    const variedadInput = document.getElementById('new-lote-variedad');

    if (!nombreInput || !nombreInput.value || !cicloInput.value) return;

    APP_STATE.collections.lotes.push({
        id: Date.now().toString(),
        nombre: nombreInput.value,
        cicloId: cicloInput.value,
        area: areaInput.value,
        variedad: variedadInput.value
    });
    saveData();
    renderView('admin_lotes');
}

function deleteItem(collection, id) {
    APP_STATE.collections[collection] = APP_STATE.collections[collection].filter(i => i.id !== id);
    saveData();
    renderView('admin_' + collection);
}

function renderRecords() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const pending = records.filter(r => !r.synced).length;

    const list = records.slice().reverse().map((r, idx) => {
        const date = new Date(r.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const originalIdx = records.length - 1 - idx;

        const h = r.header || {};
        const coords = r.coords || {};

        return `
            <div class="card" style="padding: 1rem; border-left: 4px solid ${r.synced ? 'var(--accent-green)' : 'var(--accent-yellow)'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
                    <div>
                        <div style="font-weight: 600; font-size: 1.1rem; color: var(--accent-emerald);">${h.lote_name || 'Lote Descon.'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-primary);">${dateStr} - ${timeStr}</div>
                    </div>
                    <span style="font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: rgba(255,255,255,0.1); color: ${r.synced ? 'var(--accent-green)' : 'var(--accent-yellow)'}; font-weight: 600;">
                        ${r.synced ? 'SINC' : 'PEND'}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    <div><strong>Ciclo:</strong> ${h.ciclo_name || '-'}</div>
                    <div><strong>Variedad:</strong> ${h.variedad || '-'}</div>
                    <div><strong>Plaguero:</strong> ${h.plaguero || '-'}</div>
                    <div><strong>Área:</strong> ${h.area || '-'}</div>
                </div>

                <div style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 8px; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    📍 Lat: ${coords.lat?.toFixed(5) || '?'}, Lon: ${coords.lon?.toFixed(5) || '?'}
                </div>

                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.8rem; color: var(--accent-red); border-color: rgba(248,113,113,0.3);" onclick="deleteRecord(${originalIdx})">ELIMINAR REGISTRO LOCAL</button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Historial</h2>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${records.length} registros</div>
        </div>

        ${pending > 0 ? `
        <div class="card" style="border: 1px solid var(--accent-yellow); padding: 1rem; text-align: center; margin-bottom: 1.5rem;">
            <p style="font-size: 0.85rem; color: var(--accent-yellow); margin-bottom: 0.8rem;">⚠️ Tiene ${pending} registros sin respaldar</p>
            <button id="sync-btn-all" class="btn btn-primary" style="width: 100%;" onclick="syncWithGoogleSheets()">SINCRONIZAR TODO AHORA</button>
        </div>
        ` : ''}
        
        <div class="monitoring-scroll">
            ${list || '<p style="text-align: center; color: var(--text-secondary); margin-top: 3rem;">No hay registros locales.</p>'}
        </div>
    `;
}

function deleteRecord(index) {
    if (!confirm('¿Está seguro de eliminar este registro local?')) return;
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    records.splice(index, 1);
    localStorage.setItem('abc_monitoring_records', JSON.stringify(records));
    renderView('records');
}

function startMonitoring() {
    renderView('monitor_header');
    getGPSCoordinates();
}

function getGPSCoordinates() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            APP_STATE.monitoring.coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                alt: position.coords.altitude,
                acc: position.coords.accuracy
            };
            const gpsLabel = document.getElementById('gps-status');
            if (gpsLabel) {
                gpsLabel.innerHTML = `📡 Lat: ${position.coords.latitude.toFixed(5)}, Lon: ${position.coords.longitude.toFixed(5)}`;
                gpsLabel.style.color = 'var(--accent-emerald)';
            }
        }, (error) => {
            console.error("Error capturing GPS", error);
            const gpsLabel = document.getElementById('gps-status');
            if (gpsLabel) {
                gpsLabel.innerHTML = "❌ Error GPS";
                gpsLabel.style.color = 'var(--accent-red)';
            }
        }, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    }
}

function renderMonitorHeader() {
    const fincasOptions = APP_STATE.collections.fincas.map(f => `<option value="${f.id}">${f.nombre}</option>`).join('');
    const ciclosOptions = `<option value="">Seleccione Ciclo...</option>` + APP_STATE.collections.ciclos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Nuevo Monitoreo</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('dashboard')">CANCELAR</button>
        </div>
        
        <div id="gps-status" style="text-align: center; font-size: 0.8rem; margin-bottom: 1rem; color: var(--text-secondary);">
            ⌛ Capturando ubicación...
        </div>
        
        <div class="card">
            <div class="field-group">
                <label>Ciclo Agrícola</label>
                <select id="mon-ciclo" class="input-modern" onchange="updateLotesDropdown(this.value)">${ciclosOptions}</select>
            </div>
            <div class="field-group">
                <label>Finca</label>
                <select id="mon-finca" class="input-modern">${fincasOptions}</select>
            </div>
            <div class="field-group">
                <label>Lote</label>
                <select id="mon-lote" class="input-modern" onchange="autofillLoteData(this.value)">
                    <option value="">Seleccione Ciclo primero...</option>
                </select>
            </div>
            <div class="field-group">
                <label>Edad (Días)</label>
                <input type="number" id="mon-edad" class="input-modern" placeholder="0">
            </div>
            <div class="field-group">
                <label>Variedad</label>
                <input type="text" id="mon-variedad" class="input-modern" placeholder="Autocompletado...">
            </div>
            <div class="field-group" style="display:none;">
                <label>Área</label>
                <input type="text" id="mon-area" class="input-modern">
            </div>
            <div class="field-group">
                <label>Plaguero</label>
                <input type="text" id="mon-plaguero" class="input-modern" placeholder="Su nombre">
            </div>
            
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="saveHeaderAndNext()">CONTINUAR A PLAGAS</button>
        </div>
    `;
}

function updateLotesDropdown(cicloId) {
    const selector = document.getElementById('mon-lote');
    if (!selector) return;

    if (!cicloId) {
        selector.innerHTML = '<option value="">Seleccione Ciclo primero...</option>';
        return;
    }

    const lotes = APP_STATE.collections.lotes.filter(l => l.cicloId === cicloId);
    if (lotes.length === 0) {
        selector.innerHTML = '<option value="">No hay lotes en este ciclo</option>';
    } else {
        selector.innerHTML = '<option value="">Seleccione Lote...</option>' + lotes.map(l => `<option value="${l.id}">${l.nombre}</option>`).join('');
    }
}

function autofillLoteData(loteId) {
    const lote = APP_STATE.collections.lotes.find(l => l.id === loteId);
    if (lote) {
        document.getElementById('mon-variedad').value = lote.variedad || '';
        document.getElementById('mon-area').value = lote.area || '';
    }
}

function saveHeaderAndNext() {
    const cicloId = document.getElementById('mon-ciclo').value;
    const fincaId = document.getElementById('mon-finca').value;
    const loteId = document.getElementById('mon-lote').value;

    const cicloName = APP_STATE.collections.ciclos.find(c => c.id === cicloId)?.nombre || '';
    const fincaName = APP_STATE.collections.fincas.find(f => f.id === fincaId)?.nombre || '';
    const loteName = APP_STATE.collections.lotes.find(l => l.id === loteId)?.nombre || '';

    APP_STATE.monitoring.header = {
        ciclo: cicloId,
        ciclo_name: cicloName,
        finca: fincaId,
        finca_name: fincaName,
        lote: loteId,
        lote_name: loteName,
        edad: document.getElementById('mon-edad').value,
        variedad: document.getElementById('mon-variedad').value,
        area: document.getElementById('mon-area').value,
        plaguero: document.getElementById('mon-plaguero').value
    };
    renderView('monitor_pests');
}

function renderMonitorPests() {
    let pestsHtml = '';

    ['invertebrates', 'vertebrates', 'beneficials'].forEach(type => {
        const title = type === 'invertebrates' ? 'Plagas Invertebradas' : type === 'vertebrates' ? 'Plagas Vertebradas' : 'Benéficos';
        pestsHtml += `<h3 style="margin: 1.5rem 0 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">${title.toUpperCase()}</h3>`;

        PEST_DB[type].forEach(pest => {
            const currentLevel = APP_STATE.monitoring.pests[pest.id] || 0;
            const isLow = currentLevel > 0;
            const isMed = currentLevel > 1;
            const isHigh = currentLevel > 2;

            pestsHtml += `
                <div class="card" style="padding: 1rem; margin-bottom: 0.8rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                        <span style="font-weight: 600;">${pest.name}</span>
                        <span id="label-${pest.id}" class="level-label level-${currentLevel}">${getLevelName(currentLevel)}</span>
                    </div>

                    <div class="threshold-indicator">
                        <div class="threshold-dot green ${isLow ? 'active' : ''}" title="Nivel 1: Bajo"></div>
                        <div class="threshold-dot yellow ${isMed ? 'active' : ''}" title="Nivel 2: Medio"></div>
                        <div class="threshold-dot red ${isHigh ? 'active' : ''}" title="Nivel 3: Alto"></div>
                    </div>

                    <div class="level-selector">
                        <button class="level-btn ${currentLevel == 0 ? 'active' : ''}" data-level="0" onclick="setPestLevel('${pest.id}', 0)">0</button>
                        <button class="level-btn ${currentLevel == 1 ? 'active' : ''}" data-level="1" onclick="setPestLevel('${pest.id}', 1)">1</button>
                        <button class="level-btn ${currentLevel == 2 ? 'active' : ''}" data-level="2" onclick="setPestLevel('${pest.id}', 2)">2</button>
                        <button class="level-btn ${currentLevel == 3 ? 'active' : ''}" data-level="3" onclick="setPestLevel('${pest.id}', 3)">3</button>
                    </div>
                </div>
            `;
        });
    });

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Plagas 1/5</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('monitor_header')">ATRÁS</button>
        </div>
        
        <div class="monitoring-scroll">
            ${pestsHtml}
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="renderView('monitor_diseases')">CONTINUAR A ENFERMEDADES</button>
        </div>
    `;
}

function setPestLevel(id, level) {
    APP_STATE.monitoring.pests[id] = level;
    renderView('monitor_pests'); // Re-rendering to update threshold dots easily
}

function setDiseaseLevel(id, level) {
    APP_STATE.monitoring.diseases[id] = level;
    renderView('monitor_diseases');
}

function getLevelName(level, isAdvancedScale) {
    if (isAdvancedScale) {
        if (level === 0) return "Nulo";
        if (level <= 3) return "Bajo";
        if (level <= 6) return "Medio";
        return "Alto";
    }
    const names = ["Nulo", "Bajo", "Medio", "Alto"];
    return names[level] || "Nulo";
}

function renderMonitorDiseases() {
    let diseaseHtml = '';
    DISEASE_DB.forEach(d => {
        const currentLevel = APP_STATE.monitoring.diseases[d.id] || 0;
        const scale = d.scale || 3;
        const isAdvancedScale = scale === 9;

        let buttons = '';
        if (isAdvancedScale) {
            // Button 0 (Special)
            buttons += `<button class="level-btn level-btn-zero ${currentLevel == 0 ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', 0)">0</button>`;
            // Buttons 1-3 (Green)
            for (let i = 1; i <= 3; i++) buttons += `<button class="level-btn btn-green ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            // Buttons 4-6 (Yellow)
            for (let i = 4; i <= 6; i++) buttons += `<button class="level-btn btn-yellow ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            // Buttons 7-9 (Red)
            for (let i = 7; i <= 9; i++) buttons += `<button class="level-btn btn-red ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
        } else {
            for (let i = 0; i <= scale; i++) {
                buttons += `<button class="level-btn ${currentLevel == i ? 'active' : ''}" data-level="${i}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            }
        }
        const isLow = currentLevel > 0;
        const isMed = isAdvancedScale ? currentLevel > 3 : currentLevel > 1;
        const isHigh = isAdvancedScale ? currentLevel > 6 : currentLevel > 2;

        diseaseHtml += `
            <div class="card" style="padding: 1rem; margin-bottom: 0.8rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                    <div>
                        <span style="font-weight: 600;">${d.name}</span>
                        <div style="font-size: 0.7rem; color: var(--text-secondary);">${isAdvancedScale ? 'Escala 0-9 (IRRI)' : 'Escala 0-3'}</div>
                    </div>
                    <span id="label-dis-${d.id}" class="level-label level-${currentLevel}">${getLevelName(currentLevel, isAdvancedScale)}</span>
                </div>
                
                <div class="threshold-indicator">
                    <div class="threshold-dot green ${isLow ? 'active' : ''}" title="Nivel 1: Bajo"></div>
                    <div class="threshold-dot yellow ${isMed ? 'active' : ''}" title="Nivel 2: Medio"></div>
                    <div class="threshold-dot red ${isHigh ? 'active' : ''}" title="Nivel 3: Alto"></div>
                </div>

                <div class="${isAdvancedScale ? 'grid-0-9' : 'level-selector'}">
                    ${buttons}
                </div>
            </div>
        `;
    });

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Enfermedades 2/5</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('monitor_pests')">ATRÁS</button>
        </div>
        <div class="monitoring-scroll">${diseaseHtml}</div>
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="renderView('monitor_weeds')">CONTINUAR A MALEZAS</button>
        </div>
    `;
}

function setDiseaseLevel(id, level) {
    APP_STATE.monitoring.diseases[id] = level;
    renderView('monitor_diseases'); // Re-rendering is easier for now to keep state synced without complex DOM selecors
}

function renderMonitorWeeds() {
    const activeWeeds = APP_STATE.monitoring.weeds.map((w, idx) => {
        const currentLevel = w.level || 0;

        // Use the same threshold logic as 0-9 diseases
        const isLow = currentLevel > 0;
        const isMed = currentLevel > 3;
        const isHigh = currentLevel > 6;

        let buttons = '';
        // Special 0-9 grid for weeds
        buttons += `<button class="level-btn level-btn-zero ${currentLevel == 0 ? 'active' : ''}" onclick="setWeedLevel(${idx}, 0)">0</button>`;
        for (let i = 1; i <= 3; i++) buttons += `<button class="level-btn btn-green ${currentLevel == i ? 'active' : ''}" onclick="setWeedLevel(${idx}, ${i})">${i}</button>`;
        for (let i = 4; i <= 6; i++) buttons += `<button class="level-btn btn-yellow ${currentLevel == i ? 'active' : ''}" onclick="setWeedLevel(${idx}, ${i})">${i}</button>`;
        for (let i = 7; i <= 9; i++) buttons += `<button class="level-btn btn-red ${currentLevel == i ? 'active' : ''}" onclick="setWeedLevel(${idx}, ${i})">${i}</button>`;

        return `
            <div class="card" style="padding: 1rem; margin-bottom: 0.8rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                    <div>
                        <span style="font-weight: 600;">${w.name}</span>
                        <div style="font-size: 0.7rem; color: var(--text-secondary);">Densidad (0-9)</div>
                    </div>
                    <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; color: var(--accent-red);" onclick="removeWeed(${idx})">Remover</button>
                </div>

                <div class="threshold-indicator">
                    <div class="threshold-dot green ${isLow ? 'active' : ''}" title="Nivel 1: Bajo"></div>
                    <div class="threshold-dot yellow ${isMed ? 'active' : ''}" title="Nivel 2: Medio"></div>
                    <div class="threshold-dot red ${isHigh ? 'active' : ''}" title="Nivel 3: Alto"></div>
                </div>

                <div class="grid-0-9">
                    ${buttons}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Malezas 3/5</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('monitor_diseases')">ATRÁS</button>
        </div>

        <div class="card" style="background: var(--nav-bg);">
            <label style="font-size: 0.8rem; display: block; margin-bottom: 0.5rem;">Agregar Maleza</label>
            <select id="weed-search" class="input-modern" onchange="addWeedFromSelect(this)">
                <option value="">Seleccione para agregar...</option>
                ${WEED_DB.map(w => `<option value="${w}">${w}</option>`).join('')}
            </select>
        </div>

        <div class="monitoring-scroll">
            ${activeWeeds || '<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No ha agregado malezas aún.</p>'}
        </div>

        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="renderView('monitor_growth')">CONTINUAR A CRECIMIENTO</button>
        </div>
    `;
}

function addWeedFromSelect(select) {
    if (!select.value) return;
    APP_STATE.monitoring.weeds.push({ name: select.value, level: 0 });
    renderView('monitor_weeds');
}

function removeWeed(index) {
    APP_STATE.monitoring.weeds.splice(index, 1);
    renderView('monitor_weeds');
}

function setWeedLevel(index, level) {
    APP_STATE.monitoring.weeds[index].level = parseInt(level);
    renderView('monitor_weeds');
}

function renderMonitorGrowth() {
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Manejo 4/5</h2>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="renderView('monitor_weeds')">ATRÁS</button>
        </div>

        <div class="card">
            <h3 style="margin-bottom: 1rem; color: var(--accent-emerald);">Crecimiento y Riego</h3>
            
            <div class="field-group">
                <label>Población (Plantas/m²)</label>
                <input type="number" id="mon-poblacion" class="input-modern" value="${APP_STATE.monitoring.growth.poblacion}">
            </div>
            
            <div class="field-group">
                <label>Altura Planta (cm)</label>
                <input type="number" id="mon-altura" class="input-modern" value="${APP_STATE.monitoring.growth.altura}">
            </div>
            
            <div class="field-group">
                <label>Lámina de Agua (cm)</label>
                <input type="number" id="mon-lamina" class="input-modern" value="${APP_STATE.monitoring.growth.lamina}">
            </div>
            
            <div class="field-group">
                <label>Estado Fenológico</label>
                <select id="mon-fenologia" class="input-modern">
                    <option value="0">0 - Nulo</option>
                    <option value="1">1 - Germinación (S3)</option>
                    <option value="2">2 - Plántula (V3)</option>
                    <option value="3">3 - Inicio Macollamiento (V4)</option>
                    <option value="4">4 - Elongación tallo (V5-V9)</option>
                    <option value="5">5 - Inicio primordio [V9 (VF-4) o R0]</option>
                    <option value="6">6 - Floración (R3)</option>
                    <option value="7">7 - Grano en leche (R6)</option>
                    <option value="8">8 - Grano en masa (R7-R8)</option>
                    <option value="9">9 - Maduración (R9)</option>
                    <option value="10">10 - Cosecha</option>
                </select>
            </div>
        </div>

        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="saveAndFinish()">GUARDAR REGISTRO FINAL</button>
        </div>
    `;
}

function saveAndFinish() {
    APP_STATE.monitoring.growth = {
        poblacion: document.getElementById('mon-poblacion').value,
        altura: document.getElementById('mon-altura').value,
        lamina: document.getElementById('mon-lamina').value,
        fenologia: document.getElementById('mon-fenologia').value
    };

    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    records.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        coords: APP_STATE.monitoring.coords,
        ...APP_STATE.monitoring
    });
    localStorage.setItem('abc_monitoring_records', JSON.stringify(records));

    APP_STATE.monitoring = {
        header: null,
        pests: {},
        diseases: {},
        weeds: [],
        growth: { poblacion: 0, altura: 0, lamina: 0, fenologia: 0 }
    };

    alert('¡Registro guardado exitosamente!');
    window.scrollTo(0, 0);
    renderView('dashboard');
}

async function syncWithGoogleSheets() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const toSync = records.filter(r => !r.synced);

    if (toSync.length === 0) {
        alert('No hay registros nuevos para sincronizar.');
        return;
    }

    const btn = document.getElementById('sync-btn') || document.getElementById('sync-btn-all');
    const originalText = btn ? btn.innerHTML : 'Sincronizar';
    if (btn) {
        btn.innerHTML = '⏳ Transfiriendo...';
        btn.disabled = true;
    }

    let scriptURL = localStorage.getItem('abc_sync_url');
    if (!scriptURL || scriptURL === 'null') {
        scriptURL = prompt('Por favor, ingrese la URL de su Google Apps Script (Aplicación Web):');
        if (scriptURL && scriptURL.trim() !== '') {
            localStorage.setItem('abc_sync_url', scriptURL.trim());
        } else {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            return;
        }
    }

    try {
        console.log('Iniciando sincronización...', toSync.length, 'registros');

        // Enviar registros como texto plano para evitar preflight CORS y asegurar que llegue el body
        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(toSync)
        });

        // Con no-cors no podemos ver el éxito real, pero si no tira error, asumimos envío
        toSync.forEach(r => r.synced = true);
        localStorage.setItem('abc_monitoring_records', JSON.stringify(records));

        alert(`✅ Envío completado: ${toSync.length} registros procesados.\n\nPor favor, verifique su hoja de Excel en unos segundos.`);
        renderView(APP_STATE.currentView);
    } catch (error) {
        console.error('Error en sincronización:', error);
        alert('No se pudo conectar con el servidor. Verifique que el script esté publicado correctamente como "Cualquier persona".');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

async function installPWA() {
    if (!APP_STATE.deferredPrompt) return;

    // Show the install prompt
    APP_STATE.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await APP_STATE.deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    APP_STATE.deferredPrompt = null;

    // Refresh UI
    renderView(APP_STATE.currentView);
}

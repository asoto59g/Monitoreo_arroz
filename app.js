/**
 * Plagueo en Arroz - Core Application Logic
 */

// ═══════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback para navegadores antiguos
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

// ═══════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════
const APP_STATE = {
    currentView: 'dashboard',
    user: JSON.parse(localStorage.getItem('abc_user') || 'null'),
    collections: {
        fincas: JSON.parse(localStorage.getItem('abc_fincas') || '[]'),
        lotes: JSON.parse(localStorage.getItem('abc_lotes') || '[]'),
        ciclos: JSON.parse(localStorage.getItem('abc_ciclos') || '[]'),
        lotesHistoricos: JSON.parse(localStorage.getItem('abc_lotes_historicos') || '[]'),
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
        weeds: {},
        growth: {
            poblacion: 0,
            altura: 0,
            lamina: 0,
            fenologia: 0
        },
        notes: ''
    },
    deferredPrompt: null,
    isOnline: navigator.onLine,
    editingRecordIdx: null   // índice del registro local que se está editando (null = nuevo)
};

function saveData() {
    localStorage.setItem('abc_fincas', JSON.stringify(APP_STATE.collections.fincas));
    localStorage.setItem('abc_lotes', JSON.stringify(APP_STATE.collections.lotes));
    localStorage.setItem('abc_ciclos', JSON.stringify(APP_STATE.collections.ciclos));
    localStorage.setItem('abc_lotes_historicos', JSON.stringify(APP_STATE.collections.lotesHistoricos));
}

// ═══════════════════════════════════════════════════
// BASE DE DATOS DE PLAGAS, ENFERMEDADES Y MALEZAS
// ═══════════════════════════════════════════════════
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
    { id: "piriculariaf", name: "Piricularia Follaje", scale: 3 },
    { id: "piriculariac", name: "Piricularia Cuello", scale: 3 },
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

const THRESHOLDS_DATA = {
    // PLAGAS
    spodoptera: {
        name: "Spodoptera",
        rows: [
            { cond: "Arroz < 20 ddg", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "cant/m2" },
            { cond: "Arroz > 20 y < 45 ddg", n1: "<= 6", n2: "> 6 y < 10", n3: ">= 10", obs: "" },
            { cond: "Arroz > 45 ddg", n1: "<= 10", n2: "> 10 y < 15", n3: ">= 15", obs: "" }
        ]
    },
    sogata: {
        name: "Sogata",
        rows: [{ cond: "Variedades resistente VHB", n1: "<= 10", n2: "> 10 y < 20", n3: ">= 20", obs: "" }]
    },
    mocis: {
        name: "Mocis",
        rows: [
            { cond: "Arroz < 20 ddg", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "" },
            { cond: "Arroz > 20 y < 45 ddg", n1: "<= 4", n2: "> 4 y < 6", n3: ">= 6", obs: "" },
            { cond: "Arroz > 45 ddg", n1: "<= 6", n2: "> 6 y < 10", n3: ">= 10", obs: "" }
        ]
    },
    oebalus: {
        name: "Oebalus",
        rows: [
            { cond: "Arroz en grano leche", n1: "<= 2", n2: "> 2 y < 3", n3: ">= 3", obs: "" },
            { cond: "Arroz en grano masa", n1: "<= 3", n2: "> 3 y < 4", n3: ">= 4", obs: "" },
            { cond: "Arroz en grano duro", n1: "N/A", n2: "N/A", n3: "N/A", obs: "No aplicar" }
        ]
    },
    tibraca: {
        name: "Tibraca",
        rows: [{ cond: "Ninfas + adultos", n1: "<= 1", n2: "> 1 y < 2", n3: ">= 2", obs: "" }]
    },
    minador: {
        name: "Minador",
        rows: [{ cond: "Sintomas en plantas", n1: "<= 3", n2: "> 3 y < 5", n3: ">= 5", obs: "" }]
    },
    acarospinki: {
        name: "Acaro Spinki",
        rows: [{ cond: "En vaina 1", n1: "<= 3", n2: "> 3 y < 4", n3: ">= 4", obs: "" }]
    },
    rupella: {
        name: "Rupella",
        rows: [{ cond: "Conteo de adultos/m2", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "" }]
    },
    salton: {
        name: "Salton",
        rows: [{ cond: "Mayor problema en floracion", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "" }]
    },
    tetranychus: {
        name: "Tetranychus",
        rows: [{ cond: "Daño en area foliar", n1: "<= 2%", n2: "> 2% y < 5%", n3: ">= 5%", obs: "" }]
    },
    afidos: {
        name: "Afidos",
        rows: [{ cond: "Daño en area foliar", n1: "<= 2%", n2: "> 2% y < 5%", n3: ">= 5%", obs: "" }]
    },
    nematodos: {
        name: "Nematodos",
        rows: [{ cond: "Nodulos por planta", n1: "<= 2", n2: "> 2 y < 5", n3: ">= 5", obs: "" }]
    },
    marasmia: {
        name: "Marasmia",
        rows: [{ cond: "Cant/m2", n1: "<= 1", n2: "> 1 y < 2", n3: ">= 2", obs: "" }]
    },
    diatrea: {
        name: "Diatrea",
        rows: [{ cond: "Cant/m2", n1: "<= 1", n2: "> 1 y < 2", n3: ">= 2", obs: "" }]
    },
    gorgojo: {
        name: "Gorgojo Agua",
        rows: [{ cond: "Cant/m2", n1: "<= 2", n2: "> 2 y < 3", n3: ">= 3", obs: "" }]
    },
    ratas: {
        name: "Ratas",
        rows: [{ cond: "Presencia/Daño", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "Daño en Area" }]
    },
    gallito: {
        name: "Gallito Azul",
        rows: [{ cond: "Presencia/Daño", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "Daño en Area" }]
    },
    piches: {
        name: "Piches",
        rows: [{ cond: "Presencia/Daño", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "Daño en Area" }]
    },
    piuses: {
        name: "Piuses",
        rows: [{ cond: "Presencia/Daño", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "Daño en Area" }]
    },
    sargento: {
        name: "Sargento",
        rows: [{ cond: "Presencia/Daño", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "Daño en Area" }]
    },
    zarseta: {
        name: "Zarseta",
        rows: [{ cond: "Presencia/Daño", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "Daño en Area" }]
    },
    zanate: {
        name: "Zanate",
        rows: [{ cond: "Presencia/Daño", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "Daño en Area" }]
    },
    beneficos: {
        name: "Benéficos",
        isInverted: true,
        rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Depredadores / Parasitoides / Hongos" }]
    },
    pentatomidos: { name: "Pentatómidos", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Organismos depredadores" }] },
    libelulas: { name: "Libélulas", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Organismos depredadores" }] },
    aranas: { name: "Arañas", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Organismos depredadores" }] },
    mariquitas: { name: "Mariquitas", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Organismos depredadores" }] },
    crisopas: { name: "Crisopas", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Organismos depredadores" }] },
    avispas: { name: "Avispas", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Organismos parasitoides" }] },
    parasitacion: { name: "Parasitación", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Organismos parasitoides" }] },
    hongos: { name: "Hongos Entomopatógenos", isInverted: true, rows: [{ cond: "Control natural", n1: "<= 1", n2: "> 1 y < 3", n3: ">= 3", obs: "Hongos que controlan plagas" }] },

    // ENFERMEDADES
    rizoctonia: {
        name: "Rizoctonia",
        rows: [
            { cond: "Rizoc. 3er tercio", n1: "7", n2: "8", n3: "9", obs: "Severidad definida por ubicación" },
            { cond: "Rizoc. 2do tercio", n1: "4", n2: "5", n3: "6", obs: "de signos" },
            { cond: "Rizoc. 1er tercio", n1: "1", n2: "2", n3: "3", obs: "Incidencia definida por cantidad" }
        ]
    },
    dreslera: {
        name: "Dreslera",
        rows: [{ cond: "Daño en area foliar", n1: "<= 2%", n2: "> 2% y < 4%", n3: ">= 4%", obs: "" }]
    },
    helminstosporium: {
        name: "Helminstosporium",
        rows: [{ cond: "Daño en area foliar", n1: "<= 2%", n2: "> 2% y < 4%", n3: ">= 4%", obs: "" }]
    },
    burkholderia: {
        name: "Burkholderia",
        rows: [{ cond: "Evaluacion en panicula", n1: "No pres.", n2: "Presente", n3: "-", obs: "Una vez emergida" }]
    },
    hojablanca: {
        name: "Hoja Blanca",
        rows: [{ cond: "En variedades suceptibles", n1: "<= 1%", n2: "1%", n3: ">= 1%", obs: "" }]
    },
    manchadograno: {
        name: "Manchado Grano",
        rows: [{ cond: "Granos manchados", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "" }]
    },
    falsocarbon: {
        name: "Falso Carbon",
        rows: [{ cond: "Paniculas afectadas", n1: "<= 2%", n2: "> 2% y < 4%", n3: ">= 4%", obs: "" }]
    },
    piriculariaf: {
        name: "Piricularia Follaje",
        rows: [{ cond: "Daño en area foliar", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "" }]
    },
    piriculariac: {
        name: "Piricularia Cuello",
        rows: [{ cond: "Paniculas afectadas", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "" }]
    },
    sarocladium: {
        name: "Sarocladium",
        rows: [{ cond: "Vaina foliar", n1: "No hay les.", n2: "Incipientes", n3: "Muchas les.", obs: "" }]
    },
    pseudomonas: {
        name: "Pseudomonas",
        rows: [{ cond: "Vaina y hoja bandera", n1: "No hay les.", n2: "Incipientes", n3: "Muchas les.", obs: "" }]
    },
    xhantomonas: {
        name: "Xhantomonas",
        rows: [{ cond: "Daño sintomas area foliar", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "" }]
    },
    erwinia: {
        name: "Erwinia",
        rows: [{ cond: "Daño sintomas area foliar", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "" }]
    },
    richosporium: {
        name: "Richosporium",
        rows: [{ cond: "Daño sintomas area foliar", n1: "<= 1%", n2: "> 1% y < 2%", n3: ">= 2%", obs: "" }]
    },

    // MALEZAS common grid
    malezas_grid: {
        name: "Malezas / m2",
        isGrid: true,
        header: ["Tamaño", "<=0.5", ">0.5 y <3", ">=3", "Referencia"],
        rows: [
            ["Grandes", "3", "6", "9", "Mas 4 hojas o macolladas"],
            ["Medianas", "2", "5", "8", "Malezas de 2 a 4 hojas"],
            ["Pequeñas", "1", "4", "7", "Malezas menos de 2 hojas"]
        ]
    },
    malezas_grandes: { alias: "malezas_grid" },
    malezas_medianas: { alias: "malezas_grid" },
    malezas_pequenas: { alias: "malezas_grid" },

    // CRECIMIENTO
    poblacion: {
        name: "Población",
        rows: [{ cond: "Inicio a Macollamiento", n1: "Medir", n2: "Medir", n3: "Medir", obs: "Generalmente al inicio del ciclo (máx macollamiento) y en floración." }]
    },
    altura: {
        name: "Altura Planta",
        rows: [{ cond: "Suelo a hoja estirada", n1: "cm", n2: "cm", n3: "cm", obs: "Por ejemplo una altura promedio medida de 12.5cm, la casilla a marcar es la de 10cm." }]
    },
    lamina: {
        name: "Lámina de Agua",
        rows: [{ cond: "Desde el suelo", n1: "cm", n2: "cm", n3: "cm", obs: "Por ejemplo una altura medida de 3.40cm, la casilla a marcar es la de 2cm." }]
    }
};

// ═══════════════════════════════════════════════════
// INICIALIZACIÓN Y NAVEGACIÓN
// ═══════════════════════════════════════════════════
// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initOnlineStatus();
    renderView('dashboard');
});

function initOnlineStatus() {
    const update = () => {
        APP_STATE.isOnline = navigator.onLine;
        const syncEl = document.getElementById('sync-status');
        if (syncEl) {
            if (APP_STATE.isOnline) {
                syncEl.innerHTML = '🟢 EN LÍNEA';
                syncEl.style.color = 'var(--accent-green)';
            } else {
                syncEl.innerHTML = '🔴 SIN RED';
                syncEl.style.color = 'var(--accent-red)';
            }
        }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    // Estado inicial
    setTimeout(update, 500);
}

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

function renderView(viewName, preserveScroll) {
    const mainContent = document.getElementById('main-content');
    const bottomNav = document.querySelector('.bottom-nav');
    if (!mainContent) return;
    const savedScroll = preserveScroll ? (document.documentElement.scrollTop || document.body.scrollTop) : 0;

    // Check for registration first
    if (!APP_STATE.user && viewName !== 'registration') {
        APP_STATE.currentView = 'registration';
        mainContent.innerHTML = renderRegistration();
        if (bottomNav) bottomNav.style.display = 'none';
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    if (bottomNav) bottomNav.style.display = 'flex';
    APP_STATE.currentView = viewName;

    switch (viewName) {
        case 'registration':
            mainContent.innerHTML = renderRegistration();
            if (bottomNav) bottomNav.style.display = 'none';
            break;
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
        case 'admin_lotes':
            mainContent.innerHTML = renderAdminLotes();
            break;
        case 'records':
            mainContent.innerHTML = renderRecords();
            break;
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
        case 'monitor_growth':
            mainContent.innerHTML = renderMonitorGrowth();
            break;
        default:
            mainContent.innerHTML = `<div class="card"><h2>${viewName}</h2><p>En desarrollo...</p></div>`;
    }

    // Scroll to top on view change, or restore previous scroll position if preserveScroll is set
    if (preserveScroll) {
        window.scrollTo(0, savedScroll);
    } else {
        window.scrollTo(0, 0);
    }

    // Ejecutar scripts post-render específicos de la vista
    if (viewName === 'admin_lotes' && typeof updateLotesSugeridos === 'function') {
        updateLotesSugeridos();
    }

    // Initialize Lucide icons after rendering
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderDashboard() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const pending = records.filter(r => !r.synced).length;
    const userName = APP_STATE.user?.name?.split(' ')[0] || 'Usuario';

    return `
        <div class="dashboard-hero slide-up">
            <div class="card welcome-card">
                <h1 class="hero-title">Sistema de Monitoreo de Plagas</h1>
                <p class="hero-greeting"><span class="emoji-rice">🌾</span> Hola, ${userName} 👋</p>
            </div>
            
            <div class="card action-container">
                <div class="action-main" onclick="startMonitoring()">
                    <div class="action-icon-rocket">🚀</div>
                    <span class="action-label">INICIAR MONITOREO</span>
                </div>
                
                <div class="status-pill ${pending > 0 ? 'has-pending' : ''}">
                    <div class="status-icon"><i data-lucide="cloud-upload"></i></div>
                    <div class="status-info">
                        <strong>${pending} REGISTROS PENDIENTES</strong>
                        <span>Listos para sincronizar</span>
                    </div>
                </div>
            </div>

            <div class="config-link-row">
                <a href="#" class="config-link" onclick="localStorage.removeItem('abc_sync_url'); alert('URL borrada. Presione Sincronizar para pegar la nueva.'); renderView('dashboard'); return false;">
                    Configurar URL de Script
                </a>
            </div>

            <div class="sync-section">
                <button id="sync-btn" class="btn btn-sync-neon" onclick="syncWithGoogleSheets()">
                    <i data-lucide="cloud-upload"></i> SINCRONIZAR AHORA
                </button>
            </div>

            <div id="pwa-install-container">
                ${APP_STATE.deferredPrompt ? `
                    <div class="card install-card">
                        <p>📲 Instale la App para acceso rápido.</p>
                        <button class="btn btn-primary btn-small" onclick="installPWA()">INSTALAR APP</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderAdmin() {
    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="settings"></i></div>
                <h2 class="view-title">Administración</h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('dashboard')" style="max-width: 100px;">
                <i data-lucide="arrow-left"></i> VOLVER
            </button>
        </div>
        
        <div class="card admin-menu-card" onclick="renderView('admin_ciclos')">
            <div class="admin-icon-wrap" style="background: linear-gradient(135deg, #0891b2, #0e7490);">
                <i data-lucide="refresh-cw"></i>
            </div>
            <div class="admin-text">
                <h3>Ciclos Agrícolas</h3>
                <p>${APP_STATE.collections.ciclos.length} registrados</p>
            </div>
            <i data-lucide="chevron-right" class="admin-chevron"></i>
        </div>
        
        <div class="card admin-menu-card" onclick="renderView('admin_fincas')">
            <div class="admin-icon-wrap" style="background: linear-gradient(135deg, #d97706, #b45309);">
                <i data-lucide="home"></i>
            </div>
            <div class="admin-text">
                <h3>Fincas</h3>
                <p>${APP_STATE.collections.fincas.length} registradas</p>
            </div>
            <i data-lucide="chevron-right" class="admin-chevron"></i>
        </div>
        
        <div class="card admin-menu-card" onclick="renderView('admin_lotes')">
            <div class="admin-icon-wrap" style="background: linear-gradient(135deg, #059669, #047857);">
                <i data-lucide="layers"></i>
            </div>
            <div class="admin-text">
                <h3>Lotes / Parcelas</h3>
                <p>${APP_STATE.collections.lotes.length} registrados</p>
            </div>
            <i data-lucide="chevron-right" class="admin-chevron"></i>
        </div>

        <div class="card admin-menu-card danger" onclick="confirmDeleteSynced()">
            <div class="admin-icon-wrap" style="background: linear-gradient(135deg, #dc2626, #991b1b);">
                <i data-lucide="trash-2"></i>
            </div>
            <div class="admin-text">
                <h3>Limpieza de Datos</h3>
                <p>Borrar registros sincronizados</p>
            </div>
            <i data-lucide="chevron-right" class="admin-chevron"></i>
        </div>

        <div class="card admin-menu-card" onclick="exportDataAsJSON()">
            <div class="admin-icon-wrap" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);">
                <i data-lucide="download"></i>
            </div>
            <div class="admin-text">
                <h3>Exportar Respaldo</h3>
                <p>Descargar datos como archivo JSON</p>
            </div>
            <i data-lucide="chevron-right" class="admin-chevron"></i>
        </div>

        <div class="card user-profile-card">
            <div class="user-info-section">
                <div class="user-avatar">
                    <i data-lucide="user"></i>
                </div>
                <div class="user-details">
                    <h4>${APP_STATE.user?.name || 'Usuario'}</h4>
                    <p>${APP_STATE.user?.email || 'No registrado'}</p>
                </div>
            </div>
            <button class="btn btn-secondary btn-small" style="width: 100%;" onclick="localStorage.removeItem('abc_user'); location.reload();">
                CAMBIAR USUARIO
            </button>
        </div>
    `;
}

function renderAdminCiclos() {
    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="refresh-cw"></i></div>
                <h2 class="view-title">Ciclos</h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('admin')" style="max-width: 100px;">
                <i data-lucide="arrow-left"></i> VOLVER
            </button>
        </div>
        
        <div class="card add-item-card">
            <h3 class="card-subtitle">Agregar Nuevo Ciclo</h3>
            <div class="field-group">
                <input type="text" id="new-ciclo-nombre" class="input-modern" placeholder="Ej: Verano 2026">
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="addItemCiclo()">
                <i data-lucide="plus"></i> AÑADIR CICLO
            </button>
        </div>

        <div class="list-container">
            ${APP_STATE.collections.ciclos.map(c => `
                <div class="card list-item-card">
                    <span class="item-name">${c.nombre}</span>
                    <button class="btn-icon-only delete" onclick="deleteItem('ciclos', '${c.id}', 'admin_ciclos')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `).join('') || '<p class="empty-list-msg">No hay ciclos registrados.</p>'}
        </div>
    `;
}

function renderAdminFincas() {
    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="building-2"></i></div>
                <h2 class="view-title">Fincas</h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('admin')" style="max-width: 100px;">
                <i data-lucide="arrow-left"></i> VOLVER
            </button>
        </div>
        
        <div class="card add-item-card">
            <h3 class="card-subtitle">Agregar Nueva Finca</h3>
            <div class="field-group">
                <input type="text" id="new-finca-nombre" class="input-modern" placeholder="Ej: Finca La Esperanza">
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="addItemFinca()">
                <i data-lucide="plus"></i> AÑADIR FINCA
            </button>
        </div>

        <div class="list-container">
            ${APP_STATE.collections.fincas.map(f => `
                <div class="card list-item-card">
                    <span class="item-name">${f.nombre}</span>
                    <button class="btn-icon-only delete" onclick="deleteItem('fincas', '${f.id}', 'admin_fincas')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `).join('') || '<p class="empty-list-msg">No hay fincas registradas.</p>'}
        </div>
    `;
}

function renderAdminLotes() {
    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="layers"></i></div>
                <h2 class="view-title">Lotes</h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('admin')" style="max-width: 100px;">
                <i data-lucide="arrow-left"></i> VOLVER
            </button>
        </div>
        
        <div class="card add-item-card">
            <h3 class="card-subtitle">Agregar Nuevo Lote</h3>
            <div class="grid-2">
                <div class="field-group">
                    <label>Ciclo</label>
                    <select id="new-lote-ciclo" class="input-modern">
                        ${APP_STATE.collections.ciclos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="field-group">
                    <label>Finca</label>
                    <select id="new-lote-finca" class="input-modern" onchange="updateLotesSugeridos()">
                        ${APP_STATE.collections.fincas.map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="field-group">
                <label>Nombre del Lote</label>
                <input type="text" id="new-lote-nombre" class="input-modern" placeholder="Ej: Lote 1 - Sección A" list="lotes-historicos" autocomplete="off">
                <datalist id="lotes-historicos"></datalist>
            </div>
            <div class="grid-2">
                <div class="field-group">
                    <label>Variedad</label>
                    <input type="text" id="new-lote-variedad" class="input-modern" placeholder="Ej: Fedearroz 67">
                </div>
                <div class="field-group">
                    <label>Área (Ha)</label>
                    <input type="number" id="new-lote-area" class="input-modern" placeholder="Ej: 5.5">
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="addItemLote()">
                <i data-lucide="plus"></i> AÑADIR LOTE
            </button>
        </div>

        <div class="list-container">
            ${APP_STATE.collections.lotes.slice().reverse().map(l => {
        const ciclo = APP_STATE.collections.ciclos.find(c => c.id === l.cicloId)?.nombre || '---';
        const finca = APP_STATE.collections.fincas.find(f => f.id === l.fincaId)?.nombre || '---';
        return `
                <div class="card list-item-nested-card">
                    <div class="item-header">
                        <span class="item-name">${l.nombre}</span>
                        <button class="btn-icon-only delete" onclick="deleteItem('lotes', '${l.id}', 'admin_lotes')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                    <div class="item-details-grid">
                        <div class="detail-row"><span>Ciclo:</span> <strong>${ciclo}</strong></div>
                        <div class="detail-row"><span>Finca:</span> <strong>${finca}</strong></div>
                        <div class="detail-row"><span>Var:</span> <strong>${l.variedad || '-'}</strong> | <span>Área:</span> <strong>${l.area || '-'} Ha</strong></div>
                    </div>
                </div>
            `;
    }).join('') || '<p class="empty-list-msg">No hay lotes registrados.</p>'}
        </div>
        <script>
            setTimeout(() => { if (typeof updateLotesSugeridos === "function") updateLotesSugeridos(); }, 0);
        </script>
    `;
}

function updateLotesSugeridos() {
    const fincaSelect = document.getElementById('new-lote-finca');
    const datalist = document.getElementById('lotes-historicos');
    if (!fincaSelect || !datalist) return;

    const fincaId = fincaSelect.value;
    if (!fincaId) {
        datalist.innerHTML = '';
        return;
    }

    // Filtrar lotes de la Bóveda Histórica para esta finca
    const lotesHistoricoFinca = APP_STATE.collections.lotesHistoricos.filter(l => l.fincaId === fincaId);
    
    // Obtener nombres únicos usando Set (y ordenar alfabéticamente)
    const nombresUnicos = [...new Set(lotesHistoricoFinca.map(l => l.nombre))].sort();
    
    // Llenar datalist
    datalist.innerHTML = nombresUnicos.map(nombre => `<option value="${nombre}">`).join('');
}

// Administrative Helpers
function addItemCiclo() {
    const nombreInput = document.getElementById('new-ciclo-nombre');
    if (!nombreInput || !nombreInput.value.trim()) {
        alert('Por favor ingrese un nombre para el ciclo.');
        return;
    }

    APP_STATE.collections.ciclos.push({
        id: generateId(),
        nombre: nombreInput.value.trim()
    });
    saveData();
    renderView('admin_ciclos');
}

function addItemFinca() {
    const nombreInput = document.getElementById('new-finca-nombre');
    if (!nombreInput || !nombreInput.value.trim()) {
        alert('Por favor ingrese un nombre para la finca.');
        return;
    }

    APP_STATE.collections.fincas.push({
        id: generateId(),
        nombre: nombreInput.value.trim()
    });
    saveData();
    renderView('admin_fincas');
}

function addItemLote() {
    const nombreInput = document.getElementById('new-lote-nombre');
    const cicloInput = document.getElementById('new-lote-ciclo');
    const fincaInput = document.getElementById('new-lote-finca');
    const areaInput = document.getElementById('new-lote-area');
    const variedadInput = document.getElementById('new-lote-variedad');

    if (!nombreInput || !nombreInput.value || !cicloInput.value || !fincaInput.value) return;

    const loteNombreTrimmed = nombreInput.value.trim();

    // 1. Validar que no exista un lote duplicado en el MISMO ciclo y MISMA finca
    const isDuplicate = APP_STATE.collections.lotes.some(
        l => l.nombre.toLowerCase() === loteNombreTrimmed.toLowerCase() && 
             l.cicloId === cicloInput.value && 
             l.fincaId === fincaInput.value
    );

    if (isDuplicate) {
        alert("ALERTA: Este lote ya se encuentra registrado para esta Finca en este Ciclo. No se puede duplicar.");
        return;
    }

    // 2. Guardar el lote en el ciclo activo
    APP_STATE.collections.lotes.push({
        id: generateId(),
        nombre: loteNombreTrimmed,
        cicloId: cicloInput.value,
        fincaId: fincaInput.value,
        area: areaInput.value,
        variedad: variedadInput.value
    });

    // 3. Guardar el nombre en el Historial Permanente (si no existe ya para esta finca)
    const isHistoric = APP_STATE.collections.lotesHistoricos.some(
        h => h.nombre.toLowerCase() === loteNombreTrimmed.toLowerCase() && 
             h.fincaId === fincaInput.value
    );

    if (!isHistoric) {
        APP_STATE.collections.lotesHistoricos.push({
            nombre: loteNombreTrimmed,
            fincaId: fincaInput.value
        });
    }

    saveData();
    renderView('admin_lotes');
}

function deleteItem(collection, id) {
    APP_STATE.collections[collection] = APP_STATE.collections[collection].filter(i => i.id !== id);
    saveData();
    renderView('admin_' + collection);
}

function confirmDeleteSynced() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const syncedCount = records.filter(r => r.synced).length;
    
    if (syncedCount === 0) {
        alert("No hay registros sincronizados para borrar.");
        return;
    }

    if (confirm(`¿Desea borrar permanentemente los ${syncedCount} registros que ya fueron sincronizados al Excel?`)) {
        const remaining = records.filter(r => !r.synced);
        localStorage.setItem('abc_monitoring_records', JSON.stringify(remaining));
        if (remaining.length === 0) {
            localStorage.setItem('abc_record_counter', '0');
        }
        alert(`✅ Se han borrado ${syncedCount} registros.`);
        renderView('admin');
    }
}

function renderRecords(filterStatus, filterFinca) {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const pending = records.filter(r => !r.synced).length;

    // Obtener fincas únicas de los registros
    const fincasEnRegistros = [...new Set(records.map(r => r.header?.finca_name).filter(Boolean))].sort();

    // Aplicar filtros
    let filtered = records;
    if (filterStatus === 'pending') filtered = filtered.filter(r => !r.synced);
    else if (filterStatus === 'synced') filtered = filtered.filter(r => r.synced);
    if (filterFinca) filtered = filtered.filter(r => r.header?.finca_name === filterFinca);

    const list = filtered.slice().reverse().map((r, idx) => {
        const originalIdx = records.indexOf(r);
        const date = new Date(r.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const recNum = r.num ? `<span style="font-size:0.6rem;font-weight:900;padding:0.15rem 0.5rem;border-radius:99px;background:rgba(255,255,255,0.07);color:var(--text-secondary);border:1px solid var(--glass-border);margin-right:0.4rem;">#${r.num}</span>` : '';

        const h = r.header || {};
        const coords = r.coords || {};

        // --- chip helpers ---
        const chipStyle = (valStr, maxScale, isInverted) => {
            const val = parseInt(valStr, 10);
            let cat = 'high';
            if (maxScale === 9) {
                if (val <= 3) cat = 'low';
                else if (val <= 6) cat = 'medium';
            } else if (maxScale === 3) {
                if (val === 1) cat = 'low';
                else if (val === 2) cat = 'medium';
            } else {
                const pct = val / maxScale;
                if (pct <= 0.34) cat = 'low';
                else if (pct <= 0.67) cat = 'medium';
            }
            if (isInverted) {
                if (cat === 'low') cat = 'high';
                else if (cat === 'high') cat = 'low';
            }
            if (cat === 'low') return 'background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.5);color:#10b981;';
            if (cat === 'medium') return 'background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);color:#f59e0b;';
            return 'background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5);color:#ef4444;';
        };
        const chip = (label, val, maxScale, isInverted) =>
            `<span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.18rem 0.5rem;border-radius:99px;${chipStyle(val,maxScale,isInverted)}font-size:0.65rem;font-weight:700;margin:0.15rem;">${label}&nbsp;<strong>${val}</strong></span>`;

        // --- Plagas ---
        const allPestNames = {};
        const beneficialIds = new Set((PEST_DB.beneficials||[]).map(p => p.id));
        [...(PEST_DB.invertebrates||[]),...(PEST_DB.vertebrates||[]),...(PEST_DB.beneficials||[])].forEach(p=>allPestNames[p.id]=p.name);
        const pestChips = Object.entries(r.pests||{}).filter(([,v])=>v>0)
            .map(([id,val])=>chip(allPestNames[id]||id, val, 3, beneficialIds.has(id))).join('');

        // --- Enfermedades ---
        const allDiseaseInfo = {};
        (DISEASE_DB||[]).forEach(d=>allDiseaseInfo[d.id]={name:d.name,scale:d.scale||3});
        const diseaseChips = Object.entries(r.diseases||{}).filter(([,v])=>v>0)
            .map(([id,val])=>{ const i=allDiseaseInfo[id]||{name:id,scale:9}; return chip(i.name, val, i.scale); }).join('');

        // --- Malezas ---
        const weedChips = Object.entries(r.weeds||{}).filter(([,v])=>v>0)
            .map(([name,val])=>chip(name, val, 9)).join('');

        // --- Crecimiento ---
        const g = r.growth || {};
        const blueChip = (label) => `<span style="padding:0.18rem 0.5rem;border-radius:99px;background:rgba(59,130,246,0.18);border:1px solid rgba(59,130,246,0.4);color:#60a5fa;font-size:0.65rem;font-weight:700;margin:0.15rem;">${label}</span>`;
        const purpleChip = (label) => `<span style="padding:0.18rem 0.5rem;border-radius:99px;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.4);color:#a78bfa;font-size:0.65rem;font-weight:700;margin:0.15rem;">${label}</span>`;
        const growthChips = [
            g.poblacion ? blueChip(`👥 ${g.poblacion} pl/m²`) : '',
            g.altura    ? blueChip(`📏 ${g.altura} cm`) : '',
            g.agua      ? blueChip(`💧 ${g.agua}`) : '',
            g.fenologia ? purpleChip(`🌱 ${g.fenologia}`) : ''
        ].filter(Boolean).join('');

        const section = (emoji, label, chips) => chips ? `
            <div class="record-detail-section">
                <div class="record-detail-label">${emoji} ${label}</div>
                <div class="record-detail-chips">${chips}</div>
            </div>` : '';

        const details = [
            section('🐛', 'Plagas', pestChips),
            section('🦠', 'Enfermedades', diseaseChips),
            section('🌿', 'Malezas', weedChips),
            section('📈', 'Crecimiento', growthChips)
        ].filter(Boolean).join('');

        // Notas
        const notesHtml = r.notes ? `
            <div style="margin-top:0.75rem; padding:0.75rem; background:rgba(245,158,11,0.08); border-radius:0.75rem; border:1px solid rgba(245,158,11,0.2);">
                <div style="font-size:0.6rem; font-weight:800; color:#f59e0b; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.3rem;">📝 Notas</div>
                <div style="font-size:0.8rem; color:#e2e8f0; line-height:1.3;">${r.notes}</div>
            </div>` : '';

        return `
            <div class="card record-card ${r.synced ? 'synced' : 'pending'}">
                <div class="record-header">
                    <div class="record-info">
                        <div class="record-icon-wrap">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <div class="record-text">
                            <div class="record-title">${recNum}${h.lote_name || 'Lote Descon.'}</div>
                            <div class="record-meta">
                                <i data-lucide="calendar"></i>
                                <span>${dateStr} • ${timeStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="record-status-badge ${r.synced ? 'synced' : 'pending'}">
                        ${r.synced ? 'SINC' : 'PEND'}
                    </div>
                </div>

                <div class="record-grid">
                    <div class="grid-item"><strong>Ciclo:</strong> ${h.ciclo_name || '-'}</div>
                    <div class="grid-item"><strong>Variedad:</strong> ${h.variedad || '-'}</div>
                    <div class="grid-item"><strong>Plaguero:</strong> ${h.plaguero || '-'}</div>
                    <div class="grid-item"><strong>Área:</strong> ${h.area || '-'} Ha</div>
                </div>

                <div class="record-coords">
                    <i data-lucide="navigation"></i>
                    <span>${coords.lat?.toFixed(5) || '?'}, ${coords.lon?.toFixed(5) || '?'}</span>
                </div>

                ${details ? `<div class="record-details">${details}</div>` : ''}
                ${notesHtml}

                <div class="record-actions">
                    ${!r.synced ? `<button class="btn btn-secondary btn-small" onclick="editRecord(${originalIdx})"><i data-lucide="edit-3"></i> EDITAR</button>` : ''}
                    <button class="btn btn-secondary btn-small delete-btn" onclick="deleteRecord(${originalIdx})"><i data-lucide="trash-2"></i> ELIMINAR</button>
                </div>
            </div>
        `;
    }).join('');

    // Filtros actuales para estado activo de botones
    const fAll = !filterStatus ? 'active' : '';
    const fPend = filterStatus === 'pending' ? 'active' : '';
    const fSync = filterStatus === 'synced' ? 'active' : '';

    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="history"></i></div>
                <h2 class="view-title">Registros</h2>
            </div>
            <div class="header-count">${filtered.length}/${records.length}</div>
        </div>

        <div class="card" style="padding:1rem 1.25rem; margin-bottom:1rem;">
            <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                <button class="btn btn-small ${fAll ? 'btn-primary' : 'btn-secondary'}" style="flex:1; min-width:60px;" onclick="filterRecords()">
                    TODOS
                </button>
                <button class="btn btn-small ${fPend ? 'btn-primary' : 'btn-secondary'}" style="flex:1; min-width:60px;" onclick="filterRecords('pending', '${filterFinca || ''}')">
                    ⏳ PEND
                </button>
                <button class="btn btn-small ${fSync ? 'btn-primary' : 'btn-secondary'}" style="flex:1; min-width:60px;" onclick="filterRecords('synced', '${filterFinca || ''}')">
                    ✅ SINC
                </button>
            </div>
            ${fincasEnRegistros.length > 1 ? `
                <select class="input-modern" style="padding:0.6rem 1rem; font-size:0.8rem;" onchange="filterRecords('${filterStatus || ''}', this.value)">
                    <option value="">🏠 Todas las fincas</option>
                    ${fincasEnRegistros.map(f => `<option value="${f}" ${filterFinca === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
            ` : ''}
        </div>

        ${pending > 0 ? `
            <div class="card pending-summary-card">
                <p>Tienes <span class="neon-text">${pending}</span> registros pendientes</p>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-primary sync-all-btn" style="flex:2;" onclick="syncWithGoogleSheets()">
                        <i data-lucide="cloud-upload"></i> SINCRONIZAR
                    </button>
                    <button class="btn btn-secondary btn-small" style="flex:1;" onclick="exportRecordsAsCSV()">
                        <i data-lucide="file-spreadsheet"></i> CSV
                    </button>
                </div>
            </div>
        ` : ''}

        <div class="monitoring-scroll">
            ${list || `
                <div class="empty-state">
                    <i data-lucide="inbox"></i>
                    <p>${filterStatus || filterFinca ? 'No hay registros con estos filtros.' : 'No hay registros locales.'}</p>
                </div>
            `}
        </div>
    `;
}

// Función wrapper para filtros que actualiza el DOM directamente
function filterRecords(status, finca) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.innerHTML = renderRecords(status, finca);
    if (window.lucide) window.lucide.createIcons();
}

function exportRecordsAsCSV() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    if (records.length === 0) {
        alert('No hay registros para exportar.');
        return;
    }

    // Obtener todas las plagas, enfermedades y malezas posibles
    const allPestIds = [...PEST_DB.invertebrates, ...PEST_DB.vertebrates, ...PEST_DB.beneficials].map(p => p.id);
    const allPestNames = {};
    [...PEST_DB.invertebrates, ...PEST_DB.vertebrates, ...PEST_DB.beneficials].forEach(p => allPestNames[p.id] = p.name);
    const allDiseaseIds = DISEASE_DB.map(d => d.id);
    const allDiseaseNames = {};
    DISEASE_DB.forEach(d => allDiseaseNames[d.id] = d.name);

    // Encabezados
    const headers = [
        'Num', 'Fecha', 'Hora', 'Sincronizado',
        'Ciclo', 'Finca', 'Lote', 'Edad_DDS', 'Variedad', 'Area_Ha', 'Plaguero',
        'Lat', 'Lon', 'Precision_m',
        ...allPestIds.map(id => allPestNames[id]),
        ...allDiseaseIds.map(id => allDiseaseNames[id]),
        ...WEED_DB,
        'Poblacion', 'Altura_cm', 'Lamina_Agua', 'Fenologia',
        'Notas'
    ];

    const rows = records.map(r => {
        const h = r.header || {};
        const g = r.growth || {};
        const coords = r.coords || {};
        const date = new Date(r.timestamp);

        return [
            r.num || '',
            date.toLocaleDateString(),
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            r.synced ? 'SI' : 'NO',
            h.ciclo_name || '', h.finca_name || '', h.lote_name || '',
            h.edad || '', h.variedad || '', h.area || '', h.plaguero || '',
            coords.lat || '', coords.lon || '', coords.acc ? Math.round(coords.acc) : '',
            ...allPestIds.map(id => (r.pests || {})[id] || 0),
            ...allDiseaseIds.map(id => (r.diseases || {})[id] || 0),
            ...WEED_DB.map(w => (r.weeds || {})[w] || 0),
            g.poblacion || '', g.altura || '', g.lamina || g.agua || '', g.fenologia || '',
            (r.notes || '').replace(/"/g, '""')
        ].map(v => `"${v}"`).join(',');
    });

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
    const BOM = '\uFEFF'; // Para soporte de caracteres especiales en Excel
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `RiceMon_Registros_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`✅ CSV descargado: RiceMon_Registros_${dateStr}.csv\n\nPuede abrirlo en Excel o Google Sheets.`);
}

function deleteRecord(index) {
    if (!confirm('¿Está seguro de eliminar este registro local?')) return;
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    records.splice(index, 1);
    localStorage.setItem('abc_monitoring_records', JSON.stringify(records));
    if (records.length === 0) {
        localStorage.setItem('abc_record_counter', '0');
    }
    renderView('records');
}

function editRecord(index) {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const rec = records[index];
    if (!rec) return;

    // Cargar datos del registro al estado de monitoreo
    APP_STATE.editingRecordIdx = index;
    APP_STATE.monitoring.coords  = rec.coords  || null;
    APP_STATE.monitoring.header  = rec.header  || {};
    APP_STATE.monitoring.pests   = rec.pests   || {};
    APP_STATE.monitoring.diseases = rec.diseases || {};
    APP_STATE.monitoring.weeds   = rec.weeds   || {};
    APP_STATE.monitoring.growth  = rec.growth  || { poblacion:0, altura:0, lamina:0, fenologia:0 };

    // Asegurar que todas las especies tengan al menos un valor
    PEST_DB.invertebrates.forEach(p => { if (!(p.id in APP_STATE.monitoring.pests))   APP_STATE.monitoring.pests[p.id] = 0; });
    PEST_DB.vertebrates.forEach(p   => { if (!(p.id in APP_STATE.monitoring.pests))   APP_STATE.monitoring.pests[p.id] = 0; });
    PEST_DB.beneficials.forEach(p   => { if (!(p.id in APP_STATE.monitoring.pests))   APP_STATE.monitoring.pests[p.id] = 0; });
    DISEASE_DB.forEach(d => { if (!(d.id in APP_STATE.monitoring.diseases)) APP_STATE.monitoring.diseases[d.id] = 0; });
    WEED_DB.forEach(w    => { if (!(w    in APP_STATE.monitoring.weeds))    APP_STATE.monitoring.weeds[w] = 0; });

    renderView('monitor_pests');
}

function startMonitoring() {
    APP_STATE.editingRecordIdx = null; // nuevo monitoreo, no edición

    // Reset and Initialize with zeros for ALL species
    APP_STATE.monitoring.pests = {};
    PEST_DB.invertebrates.forEach(p => APP_STATE.monitoring.pests[p.id] = 0);
    PEST_DB.vertebrates.forEach(p => APP_STATE.monitoring.pests[p.id] = 0);
    PEST_DB.beneficials.forEach(p => APP_STATE.monitoring.pests[p.id] = 0);

    APP_STATE.monitoring.diseases = {};
    DISEASE_DB.forEach(d => APP_STATE.monitoring.diseases[d.id] = 0);

    APP_STATE.monitoring.weeds = {};
    WEED_DB.forEach(w => APP_STATE.monitoring.weeds[w] = 0);

    // Validar GPS antes de continuar
    if (!("geolocation" in navigator)) {
        alert("Su dispositivo no soporta geolocalización. Imposible continuar sin coordenadas.");
        return;
    }

    const gpsLabel = document.getElementById('gps-status');
    if (gpsLabel) {
        gpsLabel.innerHTML = "📡 Buscando GPS...";
        gpsLabel.style.color = 'var(--text-secondary)';
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            // GPS OK
            APP_STATE.monitoring.coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                alt: position.coords.altitude,
                acc: position.coords.accuracy
            };
            if (gpsLabel) {
                gpsLabel.innerHTML = `📡 Lat: ${position.coords.latitude.toFixed(5)}, Lon: ${position.coords.longitude.toFixed(5)} `;
                gpsLabel.style.color = 'var(--accent-emerald)';
            }
            // Navegar al encabezado solo si hay éxito
            renderView('monitor_header');
        },
        (error) => {
            // Error de GPS
            console.error("Error capturing GPS", error);
            if (gpsLabel) {
                gpsLabel.innerHTML = "❌ Error GPS";
                gpsLabel.style.color = 'var(--accent-red)';
            }
            
            let errorMsg = "No se pudo obtener la ubicación. Por favor revise que el GPS esté encendido en su dispositivo y tenga permisos.";
            if (error.code === error.PERMISSION_DENIED) errorMsg = "Permiso de ubicación denegado. Debe autorizar el GPS para esta app.";
            else if (error.code === error.POSITION_UNAVAILABLE) errorMsg = "Información de ubicación no disponible. Encienda o acerque el dispositivo al aire libre.";
            else if (error.code === error.TIMEOUT) errorMsg = "Tiempo de espera agotado buscando señal GPS. Asegúrese de tener el GPS encendido.";
            
            alert(`⚠️ ALERTA GPS: ${errorMsg}`);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function renderMonitorHeader() {
    const fincasOptions = APP_STATE.collections.fincas.map(f => `<option value="${f.id}">${f.nombre}</option>`).join('');
    const ciclosOptions = `<option value="">Seleccione Ciclo...</option>` + APP_STATE.collections.ciclos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="file-text"></i></div>
                <h2 class="view-title">Encabezado</h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('dashboard')">
                <i data-lucide="x"></i> CANCELAR
            </button>
        </div>
        
        <div class="card">
            <div class="field-group">
                <label>Ciclo Agrícola</label>
                <div style="position: relative;">
                    <i data-lucide="refresh-cw" style="position: absolute; left: 1rem; top: 1.1rem; width: 18px; color: var(--text-secondary);"></i>
                    <select id="mon-ciclo" class="input-modern" style="padding-left: 3rem;" onchange="updateLotesDropdown()">${ciclosOptions}</select>
                </div>
            </div>
            <div class="field-group">
                <label>Finca</label>
                <div style="position: relative;">
                    <i data-lucide="building-2" style="position: absolute; left: 1rem; top: 1.1rem; width: 18px; color: var(--text-secondary);"></i>
                    <select id="mon-finca" class="input-modern" style="padding-left: 3rem;" onchange="updateLotesDropdown()">${fincasOptions}</select>
                </div>
            </div>
            <div class="field-group">
                <label>Lote (Parcela)</label>
                <div style="position: relative;">
                    <i data-lucide="grid-3x3" style="position: absolute; left: 1rem; top: 1.1rem; width: 18px; color: var(--text-secondary);"></i>
                    <select id="mon-lote" class="input-modern" style="padding-left: 3rem;" onchange="autofillLoteData(this.value)">
                        <option value="">Seleccione Ciclo y Finca primero...</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="card">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="field-group">
                    <label>Edad (DDS)</label>
                    <input type="number" id="mon-edad" class="input-modern" placeholder="Días">
                </div>
                <div class="field-group">
                    <label>Plaguero</label>
                    <input type="text" id="mon-plaguero" class="input-modern" placeholder="Nombre" value="${APP_STATE.user?.name || ''}">
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="field-group">
                    <label>Variedad</label>
                    <input type="text" id="mon-variedad" class="input-modern" readonly style="opacity: 0.7;">
                </div>
                <div class="field-group">
                    <label>Área (Ha)</label>
                    <input type="text" id="mon-area" class="input-modern" readonly style="opacity: 0.7;">
                </div>
            </div>
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="saveHeaderAndNext()">
                EMPEZAR MONITOREO <i data-lucide="chevron-right" style="width: 18px; height: 18px;"></i>
            </button>
        </div>
`;
}

function updateLotesDropdown() {
    const cicloId = document.getElementById('mon-ciclo').value;
    const fincaId = document.getElementById('mon-finca').value;
    const selector = document.getElementById('mon-lote');

    if (!selector) return;

    if (!cicloId || !fincaId) {
        selector.innerHTML = '<option value="">Seleccione Ciclo y Finca...</option>';
        return;
    }

    const lotes = APP_STATE.collections.lotes.filter(l => l.cicloId === cicloId && l.fincaId === fincaId);
    if (lotes.length === 0) {
        selector.innerHTML = '<option value="">No hay lotes coincidentes</option>';
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
    const edad = document.getElementById('mon-edad').value;
    const plaguero = document.getElementById('mon-plaguero').value;

    if (!cicloId || !fincaId || !loteId || !edad || !plaguero) {
        alert('⚠️ Por favor complete todos los datos del encabezado (Ciclo, Finca, Lote, Edad y Plaguero) para continuar.');
        return;
    }

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
        edad: edad,
        variedad: document.getElementById('mon-variedad').value,
        area: document.getElementById('mon-area').value,
        plaguero: plaguero
    };
    renderView('monitor_pests');
}

function renderMonitorNav(activeView) {
    const steps = [
        { id: 'monitor_pests',    emoji: '🐛', label: 'Plagas' },
        { id: 'monitor_diseases', emoji: '🦠', label: 'Enfer.' },
        { id: 'monitor_weeds',    emoji: '🌿', label: 'Malezas' },
        { id: 'monitor_growth',   emoji: '📈', label: 'Crecim.' }
    ];

    return `
        <div class="monitor-steps">
            ${steps.map(step => `
                <div class="step-item ${activeView === step.id ? 'active' : ''}" onclick="window.scrollTo(0,0); renderView('${step.id}')">
                    <span class="step-emoji">${step.emoji}</span>
                    <span class="step-label">${step.label}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderMonitorPests() {
    let pestsHtml = '';

    // Unified 4-step navigation
    const navHtml = renderMonitorNav('monitor_pests');

    // Rich emoji icon map per pest, with colors per type
    const pestIconMap = {
        // Invertebrates
        spodoptera: { emoji: '🐛', bg: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'rgba(124,58,237,0.3)' },
        sogata:     { emoji: '🦗', bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'rgba(220,38,38,0.3)' },
        mocis:      { emoji: '🦋', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'rgba(124,58,237,0.3)' },
        oebalus:    { emoji: '🪲', bg: 'linear-gradient(135deg,#b45309,#92400e)', border: 'rgba(180,83,9,0.3)' },
        tibraca:    { emoji: '🪳', bg: 'linear-gradient(135deg,#374151,#1f2937)', border: 'rgba(55,65,81,0.4)' },
        minador:    { emoji: '🐜', bg: 'linear-gradient(135deg,#d97706,#b45309)', border: 'rgba(217,119,6,0.3)' },
        acarospinki:{ emoji: '🕷️', bg: 'linear-gradient(135deg,#dc2626,#991b1b)', border: 'rgba(220,38,38,0.3)' },
        rupella:    { emoji: '🦟', bg: 'linear-gradient(135deg,#0d9488,#0f766e)', border: 'rgba(13,148,136,0.3)' },
        salton:     { emoji: '🦗', bg: 'linear-gradient(135deg,#65a30d,#4d7c0f)', border: 'rgba(101,163,13,0.3)' },
        tetranychus:{ emoji: '🕸️', bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'rgba(220,38,38,0.3)' },
        afidos:     { emoji: '🐝', bg: 'linear-gradient(135deg,#ca8a04,#a16207)', border: 'rgba(202,138,4,0.3)' },
        nematodos:  { emoji: '🪱', bg: 'linear-gradient(135deg,#854d0e,#713f12)', border: 'rgba(133,77,14,0.3)' },
        marasmia:   { emoji: '🦎', bg: 'linear-gradient(135deg,#166534,#14532d)', border: 'rgba(22,101,52,0.3)' },
        diatrea:    { emoji: '🐛', bg: 'linear-gradient(135deg,#c2410c,#9a3412)', border: 'rgba(194,65,12,0.3)' },
        gorgojo:    { emoji: '🪲', bg: 'linear-gradient(135deg,#1e3a5f,#1e40af)', border: 'rgba(30,58,138,0.3)' },
        // Vertebrates
        ratas:      { emoji: '🐀', bg: 'linear-gradient(135deg,#475569,#334155)', border: 'rgba(71,85,105,0.4)' },
        gallito:    { emoji: '🦤', bg: 'linear-gradient(135deg,#06b6d4,#0284c7)', border: 'rgba(6,182,212,0.3)' },
        piches:     { emoji: '🦆', bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)', border: 'rgba(14,165,233,0.3)' },
        piuses:     { emoji: '🐦', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'rgba(124,58,237,0.3)' },
        sargento:   { emoji: '🐦‍⬛', bg: 'linear-gradient(135deg,#1e40af,#1e3a8a)', border: 'rgba(30,64,175,0.3)' },
        zarseta:    { emoji: '🦅', bg: 'linear-gradient(135deg,#92400e,#78350f)', border: 'rgba(146,64,14,0.3)' },
        zanate:     { emoji: '🐦', bg: 'linear-gradient(135deg,#111827,#030712)', border: 'rgba(75,85,99,0.4)' },
        // Beneficials
        pentatomidos:{ emoji: '🪲', bg: 'linear-gradient(135deg,#059669,#047857)', border: 'rgba(5,150,105,0.3)' },
        libelulas:  { emoji: '🪰', bg: 'linear-gradient(135deg,#0891b2,#0e7490)', border: 'rgba(8,145,178,0.3)' },
        aranas:     { emoji: '🕷️', bg: 'linear-gradient(135deg,#9f1239,#881337)', border: 'rgba(159,18,57,0.3)' },
        mariquitas: { emoji: '🐞', bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'rgba(220,38,38,0.3)' },
        crisopas:   { emoji: '🦗', bg: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'rgba(22,163,74,0.3)' },
        avispas:    { emoji: '🐝', bg: 'linear-gradient(135deg,#d97706,#b45309)', border: 'rgba(217,119,6,0.3)' },
        hongos:     { emoji: '🍄', bg: 'linear-gradient(135deg,#9f1239,#881337)', border: 'rgba(159,18,57,0.3)' },
        parasitacion:{ emoji: '🦠', bg: 'linear-gradient(135deg,#0d9488,#0f766e)', border: 'rgba(13,148,136,0.3)' },
    };

    ['invertebrates', 'vertebrates', 'beneficials'].forEach(type => {
        const sectionColors = {
            invertebrates: { label: 'PLAGAS INVERTEBRADAS', accent: '#ef4444' },
            vertebrates:   { label: 'PLAGAS VERTEBRADAS',   accent: '#3b82f6' },
            beneficials:   { label: 'BENÉFICOS',            accent: '#10b981' }
        }[type];
        pestsHtml += `<div style="display:flex;align-items:center;gap:0.5rem;margin:1.5rem 0 0.75rem;">
            <div style="width:3px;height:14px;border-radius:2px;background:${sectionColors.accent};"></div>
            <h3 style="color:${sectionColors.accent};font-size:0.72rem;letter-spacing:1.5px;font-weight:800;">${sectionColors.label}</h3>
        </div>`;

        PEST_DB[type].forEach(pest => {
            const currentLevel = APP_STATE.monitoring.pests[pest.id] || 0;
            const isLow = currentLevel > 0;
            const isMed = currentLevel > 1;
            const isHigh = currentLevel > 2;
            const iconInfo = pestIconMap[pest.id] || {
                emoji: type === 'beneficials' ? '🌿' : '🐛',
                bg: type === 'beneficials' ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                border: type === 'beneficials' ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.3)'
            };

            pestsHtml += `
                <div id="pest-${pest.id}" class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="pest-icon-badge" style="background:${iconInfo.bg}; border:1px solid ${iconInfo.border};" onclick="showThreshold('${pest.id}')">
                                ${iconInfo.emoji}
                            </div>
                            <div>
                                <span style="font-weight: 700; font-size: 1rem; letter-spacing: -0.5px; display:block;">${pest.name}</span>
                                <span style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Nivel de Población</span>
                            </div>
                        </div>
                        <div class="threshold-indicator" style="margin-bottom: 0;">
                            <div class="threshold-dot ${type === 'beneficials' ? 'red' : 'green'} ${isLow ? 'active' : ''}"></div>
                            <div class="threshold-dot yellow ${isMed ? 'active' : ''}"></div>
                            <div class="threshold-dot ${type === 'beneficials' ? 'green' : 'red'} ${isHigh ? 'active' : ''}"></div>
                        </div>
                    </div>

                    <div class="level-selector-premium ${type === 'beneficials' ? 'inverted-levels' : ''}">
                        <div class="level-card nulo ${currentLevel == 0 ? 'active' : ''}" onclick="setPestLevel('${pest.id}', 0)">
                            <div class="level-icon-wrap">🚫</div>
                            <span>NULO</span>
                            <small>0%</small>
                        </div>
                        <div class="level-card bajo ${currentLevel == 1 ? 'active' : ''}" onclick="setPestLevel('${pest.id}', 1)">
                            <div class="level-icon-wrap">🌿</div>
                            <span>BAJO</span>
                            <small>25%</small>
                        </div>
                        <div class="level-card medio ${currentLevel == 2 ? 'active' : ''}" onclick="setPestLevel('${pest.id}', 2)">
                            <div class="level-icon-wrap">✋</div>
                            <span>MEDIO</span>
                            <small>50%</small>
                        </div>
                        <div class="level-card alto ${currentLevel == 3 ? 'active' : ''}" onclick="setPestLevel('${pest.id}', 3)">
                            <div class="level-icon-wrap">🔥</div>
                            <span>ALTO</span>
                            <small>75%+</small>
                        </div>
                    </div>
                </div>
            `;
        });
    });

    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="bug"></i></div>
                <h2 class="view-title">Plagas <span class="step-indicator">1/4</span></h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('monitor_header')">
                <i data-lucide="chevron-left"></i> ATRÁS
            </button>
        </div>
        
        ${navHtml}
        
        <div class="monitoring-scroll">
            ${pestsHtml}
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="renderView('monitor_diseases')">
                CONTINUAR <i data-lucide="arrow-right"></i>
            </button>
        </div>
`;
}

// ═══════════════════════════════════════════════════
// FUNCIONES DE NIVEL (Optimizadas - #7)
// ═══════════════════════════════════════════════════
function setPestLevel(id, level) {
    APP_STATE.monitoring.pests[id] = level;
    // Actualización dirigida del DOM en vez de re-render completo
    const card = document.getElementById('pest-' + id);
    if (card) {
        // Actualizar level-cards activos
        card.querySelectorAll('.level-card').forEach(lc => {
            const cardLevel = ['nulo','bajo','medio','alto'].indexOf(
                [...lc.classList].find(c => ['nulo','bajo','medio','alto'].includes(c))
            );
            lc.classList.toggle('active', cardLevel === level);
        });
        // Actualizar dots de semáforo
        const isBeneficial = (PEST_DB.beneficials || []).some(p => p.id === id);
        const dots = card.querySelectorAll('.threshold-dot');
        if (dots.length === 3) {
            dots[0].classList.toggle('active', level > 0);
            dots[1].classList.toggle('active', level > 1);
            dots[2].classList.toggle('active', level > 2);
        }
    } else {
        renderView('monitor_pests', true);
    }
}

// setDiseaseLevel se define más abajo (una sola vez)

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
            buttons += `<button class="level-btn level-btn-zero ${currentLevel == 0 ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', 0)">0</button>`;
            
            // Fila 1: 1, 4, 7 (Verdes)
            [1, 4, 7].forEach(i => {
                buttons += `<button class="level-btn btn-green ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            });
            // Fila 2: 2, 5, 8 (Amarillos)
            [2, 5, 8].forEach(i => {
                buttons += `<button class="level-btn btn-yellow ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            });
            // Fila 3: 3, 6, 9 (Rojos)
            [3, 6, 9].forEach(i => {
                buttons += `<button class="level-btn btn-red ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            });
        } else {
            for (let i = 0; i <= scale; i++) {
                buttons += `<button class="level-btn ${currentLevel == i ? 'active' : ''}" data-level="${i}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            }
        }
        const isLow = currentLevel > 0;
        const isMed = isAdvancedScale ? currentLevel > 3 : currentLevel > 1;
        const isHigh = isAdvancedScale ? currentLevel > 6 : currentLevel > 2;

        // Disease emoji icons
        const diseaseIconMap_local = {
            sarocladium: '🍂', xhantomonas: '🦠', pseudomonas: '🔬',
            burkholderia: '⚗️', helminstosporium: '🍁', dreslera: '🌾',
            erwinia: '🧫', hojablanca: '🌿', falsocarbon: '⬛',
            piriculariaf: '🌫️', piriculariac: '💀', manchadograno: '🟤',
            rizoctonia: '🍄'
        };
        const dEmoji = diseaseIconMap_local[d.id] || '🦠';

        diseaseHtml += `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <div class="disease-icon-badge" onclick="showThreshold('${d.id}')">${dEmoji}</div>
                        <div>
                            <span style="font-weight: 700; font-size: 1rem; letter-spacing: -0.5px; display:block;">${d.name}</span>
                            <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
                                ${isAdvancedScale ? 'Escala 0-9 (IRRI)' : 'Escala 0-3'}
                            </div>
                        </div>
                    </div>
                    <div class="threshold-indicator" style="margin-bottom: 0;">
                        <div class="threshold-dot green ${isLow ? 'active' : ''}"></div>
                        <div class="threshold-dot yellow ${isMed ? 'active' : ''}"></div>
                        <div class="threshold-dot red ${isHigh ? 'active' : ''}"></div>
                    </div>
                </div>
                
                ${isAdvancedScale ? `
                    <div class="grid-0-9">
                        ${buttons}
                    </div>
                ` : `
                    <div class="level-selector-premium">
                        <div class="level-card nulo ${currentLevel == 0 ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', 0)">
                            <div class="level-icon-wrap">🚫</div>
                            <span>NULO</span>
                            <small>0%</small>
                        </div>
                        <div class="level-card bajo ${currentLevel == 1 ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', 1)">
                            <div class="level-icon-wrap">🌿</div>
                            <span>BAJO</span>
                            <small>25%</small>
                        </div>
                        <div class="level-card medio ${currentLevel == 2 ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', 2)">
                            <div class="level-icon-wrap">✋</div>
                            <span>MEDIO</span>
                            <small>50%</small>
                        </div>
                        <div class="level-card alto ${currentLevel == 3 ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', 3)">
                            <div class="level-icon-wrap">🔥</div>
                            <span>ALTO</span>
                            <small>75%+</small>
                        </div>
                    </div>
                `}
            </div>
        `;
    });

    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="microscope"></i></div>
                <h2 class="view-title">Enfermedades <span class="step-indicator">2/4</span></h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('monitor_pests')">
                <i data-lucide="chevron-left"></i> ATRÁS
            </button>
        </div>
        
        ${renderMonitorNav('monitor_diseases')}
        
        <div class="monitoring-scroll">
            ${diseaseHtml}
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="renderView('monitor_weeds')">
                CONTINUAR <i data-lucide="arrow-right"></i>
            </button>
        </div>
    `;
}

function setDiseaseLevel(id, level) {
    APP_STATE.monitoring.diseases[id] = level;
    // Optimización: actualizar solo la card afectada
    const diseaseInfo = DISEASE_DB.find(d => d.id === id);
    const isAdvanced = diseaseInfo && diseaseInfo.scale === 9;

    // Buscar la card de esta enfermedad
    const cards = document.querySelectorAll('.monitoring-scroll .card');
    let targetCard = null;
    cards.forEach(card => {
        const nameEl = card.querySelector('span[style*="font-weight: 700"]');
        if (nameEl && nameEl.textContent.trim() === (diseaseInfo?.name || id)) targetCard = card;
    });

    if (targetCard) {
        // Actualizar botones (grid 0-9 o level-cards)
        if (isAdvanced) {
            targetCard.querySelectorAll('.level-btn').forEach(btn => {
                const btnLevel = parseInt(btn.textContent.trim());
                btn.classList.toggle('active', btnLevel === level);
            });
        } else {
            targetCard.querySelectorAll('.level-card').forEach(lc => {
                const cardLevel = ['nulo','bajo','medio','alto'].indexOf(
                    [...lc.classList].find(c => ['nulo','bajo','medio','alto'].includes(c))
                );
                lc.classList.toggle('active', cardLevel === level);
            });
        }
        // Actualizar dots
        const dots = targetCard.querySelectorAll('.threshold-dot');
        if (dots.length === 3) {
            dots[0].classList.toggle('active', level > 0);
            dots[1].classList.toggle('active', isAdvanced ? level > 3 : level > 1);
            dots[2].classList.toggle('active', isAdvanced ? level > 6 : level > 2);
        }
    } else {
        renderView('monitor_diseases', true);
    }
}

function renderMonitorWeeds() {
    let selectedHtml = '';
    WEED_DB.forEach(wName => {
        const currentLevel = APP_STATE.monitoring.weeds[wName] || 0;

        const isLow = currentLevel > 0;
        const isMed = currentLevel > 3;
        const isHigh = currentLevel > 6;

        let buttons = '';
        buttons += `<button class="level-btn level-btn-zero ${currentLevel == 0 ? 'active' : ''}" onclick="setWeedLevel('${wName}', 0)">0</button>`;
        for (let i = 1; i <= 3; i++) buttons += `<button class="level-btn btn-green ${currentLevel == i ? 'active' : ''}" onclick="setWeedLevel('${wName}', ${i})">${i}</button>`;
        for (let i = 4; i <= 6; i++) buttons += `<button class="level-btn btn-yellow ${currentLevel == i ? 'active' : ''}" onclick="setWeedLevel('${wName}', ${i})">${i}</button>`;
        for (let i = 7; i <= 9; i++) buttons += `<button class="level-btn btn-red ${currentLevel == i ? 'active' : ''}" onclick="setWeedLevel('${wName}', ${i})">${i}</button>`;

        // Weed emoji map
        const weedEmojiMap = {
            'Arroz Rojo':'🌾','Echinochloa':'🌱','Leptochloa':'🌿','Arroz Pato':'🦆',
            'Arroz Voluntario':'🌾','Digitaria':'🌱','Eleusine':'🌿','Rottboellia':'🌱',
            'Ischaemun':'🍃','Aeschynomene':'🌿','Cyperus iria':'🌱','Eclipta alba':'🌼',
            'Fimbrystilis':'🌿','Caperonia':'🍀','C. rotundus':'🌱','Ludwigia':'💧',
            'Navajuela':'⚔️','Murdannia':'🌿','Sesbania':'🌺','Portulaca':'🌸',
            'Heterantera':'💧','Amarantus':'🌱','Esfenoclea':'🌿'
        };
        const wEmoji = weedEmojiMap[wName] || '🌱';

        selectedHtml += `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <div class="weed-icon-badge" onclick="showThreshold('malezas_${currentLevel >= 7 ? 'grandes' : (currentLevel >= 4 ? 'medianas' : 'pequenas')}')">${wEmoji}</div>
                        <div>
                            <span style="font-weight: 700; font-size: 1rem; letter-spacing: -0.5px; display:block;">${wName}</span>
                            <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Densidad (0-9)</div>
                        </div>
                    </div>
                    <div class="threshold-indicator" style="margin-bottom: 0;">
                        <div class="threshold-dot green ${isLow ? 'active' : ''}"></div>
                        <div class="threshold-dot yellow ${isMed ? 'active' : ''}"></div>
                        <div class="threshold-dot red ${isHigh ? 'active' : ''}"></div>
                    </div>
                </div>

                <div class="grid-0-9">
                    ${buttons}
                </div>
            </div>
        `;
    });

    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="sprout"></i></div>
                <h2 class="view-title">Malezas <span class="step-indicator">3/4</span></h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('monitor_diseases')">
                <i data-lucide="chevron-left"></i> ATRÁS
            </button>
        </div>
        
        ${renderMonitorNav('monitor_weeds')}
        
        <div class="monitoring-scroll">
            ${selectedHtml}
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="renderView('monitor_growth')">
                CONTINUAR <i data-lucide="arrow-right"></i>
            </button>
        </div>
    `;
}

function setWeedLevel(wName, level) {
    APP_STATE.monitoring.weeds[wName] = parseInt(level);
    // Actualización dirigida del DOM en vez de re-render completo
    // Buscar la card de esta maleza por nombre
    const cards = document.querySelectorAll('.monitoring-scroll .card');
    let targetCard = null;
    cards.forEach(card => {
        const nameEl = card.querySelector('span[style*="font-weight: 700"]');
        if (nameEl && nameEl.textContent.trim() === wName) targetCard = card;
    });
    if (targetCard) {
        const lvl = parseInt(level);
        // Actualizar botones del grid
        targetCard.querySelectorAll('.level-btn').forEach(btn => {
            const btnLevel = parseInt(btn.textContent.trim());
            btn.classList.toggle('active', btnLevel === lvl);
        });
        // Actualizar dots
        const dots = targetCard.querySelectorAll('.threshold-dot');
        if (dots.length === 3) {
            dots[0].classList.toggle('active', lvl > 0);
            dots[1].classList.toggle('active', lvl > 3);
            dots[2].classList.toggle('active', lvl > 6);
        }
    } else {
        renderView('monitor_weeds', true);
    }
}

function renderMonitorGrowth() {
    return `
        <div class="view-header">
            <div class="header-main">
                <div class="card-icon"><i data-lucide="line-chart"></i></div>
                <h2 class="view-title">Crecimiento <span class="step-indicator">4/4</span></h2>
            </div>
            <button class="btn btn-secondary btn-small" onclick="renderView('monitor_weeds')">
                <i data-lucide="chevron-left"></i> ATRÁS
            </button>
        </div>

        ${renderMonitorNav('monitor_growth')}
        
        <div class="monitoring-scroll">
            <div class="card">
                <div class="field-group">
                    <label onclick="showThreshold('poblacion')" style="cursor:pointer; text-decoration:underline;">Población (plantas/m2) ℹ️</label>
                    <input type="number" id="mon-poblacion" class="input-modern" value="${APP_STATE.monitoring.growth.poblacion || ''}" placeholder="Ej: 250">
                </div>
                <div class="field-group">
                    <label onclick="showThreshold('altura')" style="cursor:pointer; text-decoration:underline;">Altura Planta (cm) ℹ️</label>
                    <input type="number" id="mon-altura" class="input-modern" value="${APP_STATE.monitoring.growth.altura || ''}" placeholder="Ej: 45">
                </div>
                <div class="field-group">
                    <label onclick="showThreshold('lamina')" style="cursor:pointer; text-decoration:underline;">Lámina de Agua ℹ️</label>
                    <select id="mon-lamina" class="input-modern">
                        <option value="Seco" ${APP_STATE.monitoring.growth.lamina === 'Seco' ? 'selected' : ''}>Seco</option>
                        <option value="Saturado" ${APP_STATE.monitoring.growth.lamina === 'Saturado' ? 'selected' : ''}>Saturado</option>
                        <option value="Lámina" ${APP_STATE.monitoring.growth.lamina === 'Lámina' ? 'selected' : ''}>Lámina</option>
                    </select>
                </div>
                <div class="field-group">
                    <label>Estado Fenológico</label>
                    <select id="mon-fenologia" class="input-modern">
                        <option value="Vegetativo" ${APP_STATE.monitoring.growth.fenologia === 'Vegetativo' ? 'selected' : ''}>Vegetativo</option>
                        <option value="Reproductivo" ${APP_STATE.monitoring.growth.fenologia === 'Reproductivo' ? 'selected' : ''}>Reproductivo</option>
                        <option value="Maduración" ${APP_STATE.monitoring.growth.fenologia === 'Maduración' ? 'selected' : ''}>Maduración</option>
                        <option value="Cosecha" ${APP_STATE.monitoring.growth.fenologia === 'Cosecha' ? 'selected' : ''}>Cosecha</option>
                    </select>
                </div>
                <div class="field-group">
                    <label>📝 Observaciones / Notas</label>
                    <textarea id="mon-notes" class="input-modern" rows="3" placeholder="Ej: Aplicación reciente, condiciones climáticas, observaciones generales..." style="resize: vertical; min-height: 80px;">${APP_STATE.monitoring.notes || ''}</textarea>
                </div>
            </div>
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%;" onclick="showPreSaveSummary()">
                <i data-lucide="check-circle"></i>
                FINALIZAR MONITOREO
            </button>
        </div>
`;
}

function showPreSaveSummary() {
    const poblacion = document.getElementById('mon-poblacion')?.value;
    const altura = document.getElementById('mon-altura')?.value;
    const agua = document.getElementById('mon-lamina')?.value;
    const fenologia = document.getElementById('mon-fenologia')?.value;
    const notes = document.getElementById('mon-notes')?.value || '';

    if (!poblacion || !altura || !agua || !fenologia) {
        alert('⚠️ Por favor complete todos los parámetros de crecimiento (Población, Altura, Agua y Fenología) antes de finalizar.');
        return;
    }

    APP_STATE.monitoring.growth = { poblacion, altura, lamina: agua, fenologia };
    APP_STATE.monitoring.notes = notes;

    // Contar plagas/enfermedades/malezas con valores > 0
    const pestCount = Object.values(APP_STATE.monitoring.pests).filter(v => v > 0).length;
    const diseaseCount = Object.values(APP_STATE.monitoring.diseases).filter(v => v > 0).length;
    const weedCount = Object.values(APP_STATE.monitoring.weeds).filter(v => v > 0).length;
    const h = APP_STATE.monitoring.header || {};

    // Construir resumen
    const existing = document.getElementById('summary-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'summary-modal';
    modal.className = 'threshold-modal-overlay';
    modal.innerHTML = `
        <div class="threshold-modal-card">
            <div class="threshold-header">
                <div>
                    <h3 style="margin:0; font-size:1.1rem; color:#fff;">📋 Resumen del Monitoreo</h3>
                    <p style="margin:0; font-size:0.8rem; color:#94a3b8;">Verifique los datos antes de guardar</p>
                </div>
                <button class="close-modal" onclick="document.getElementById('summary-modal').remove()">×</button>
            </div>
            <div class="threshold-body" style="padding:1.25rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
                    <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:0.75rem;">
                        <div style="font-size:0.6rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Finca</div>
                        <div style="font-weight:700; font-size:0.95rem;">${h.finca_name || '-'}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:0.75rem;">
                        <div style="font-size:0.6rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Lote</div>
                        <div style="font-weight:700; font-size:0.95rem;">${h.lote_name || '-'}</div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; margin-bottom:1rem;">
                    <div style="background:${pestCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)'}; padding:0.75rem; border-radius:0.75rem; text-align:center;">
                        <div style="font-size:1.3rem;">🐛</div>
                        <div style="font-weight:800; font-size:1.1rem; color:${pestCount > 0 ? '#ef4444' : '#64748b'};">${pestCount}</div>
                        <div style="font-size:0.6rem; color:#94a3b8;">PLAGAS</div>
                    </div>
                    <div style="background:${diseaseCount > 0 ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'}; padding:0.75rem; border-radius:0.75rem; text-align:center;">
                        <div style="font-size:1.3rem;">🦠</div>
                        <div style="font-weight:800; font-size:1.1rem; color:${diseaseCount > 0 ? '#8b5cf6' : '#64748b'};">${diseaseCount}</div>
                        <div style="font-size:0.6rem; color:#94a3b8;">ENFERM.</div>
                    </div>
                    <div style="background:${weedCount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)'}; padding:0.75rem; border-radius:0.75rem; text-align:center;">
                        <div style="font-size:1.3rem;">🌿</div>
                        <div style="font-weight:800; font-size:1.1rem; color:${weedCount > 0 ? '#10b981' : '#64748b'};">${weedCount}</div>
                        <div style="font-size:0.6rem; color:#94a3b8;">MALEZAS</div>
                    </div>
                </div>
                <div style="background:rgba(59,130,246,0.1); padding:0.75rem; border-radius:0.75rem; margin-bottom:1rem;">
                    <div style="font-size:0.6rem; color:#60a5fa; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">📈 Crecimiento</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; font-size:0.8rem;">
                        <span>👥 <strong>${poblacion}</strong> pl/m²</span>
                        <span>📏 <strong>${altura}</strong> cm</span>
                        <span>💧 <strong>${agua}</strong></span>
                        <span>🌱 <strong>${fenologia}</strong></span>
                    </div>
                </div>
                ${notes ? `<div style="background:rgba(245,158,11,0.1); padding:0.75rem; border-radius:0.75rem; margin-bottom:0.5rem;">
                    <div style="font-size:0.6rem; color:#f59e0b; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.3rem;">📝 Notas</div>
                    <div style="font-size:0.85rem; color:#e2e8f0; line-height:1.4;">${notes}</div>
                </div>` : ''}
            </div>
            <div class="threshold-footer" style="display:flex; gap:0.75rem;">
                <button class="btn btn-secondary" style="flex:1;" onclick="document.getElementById('summary-modal').remove()">
                    ✏️ EDITAR
                </button>
                <button class="btn btn-primary" style="flex:2;" onclick="document.getElementById('summary-modal').remove(); saveAndFinish()">
                    ✅ CONFIRMAR Y GUARDAR
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function saveAndFinish() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');

    if (APP_STATE.editingRecordIdx !== null) {
        // ── MODO EDICIÓN: reemplazar registro existente ──
        const existing = records[APP_STATE.editingRecordIdx] || {};
        records[APP_STATE.editingRecordIdx] = {
            id:        existing.id,
            num:       existing.num,
            timestamp: existing.timestamp,
            editedAt:  new Date().toISOString(),
            synced:    false,
            coords:    APP_STATE.monitoring.coords || existing.coords,
            user:      APP_STATE.user,
            header:    APP_STATE.monitoring.header,
            pests:     APP_STATE.monitoring.pests,
            diseases:  APP_STATE.monitoring.diseases,
            weeds:     APP_STATE.monitoring.weeds,
            growth:    APP_STATE.monitoring.growth,
            notes:     APP_STATE.monitoring.notes
        };
        localStorage.setItem('abc_monitoring_records', JSON.stringify(records));
        alert(`✅ Registro #${existing.num || ''} actualizado correctamente.`);
    } else {
        // ── MODO NUEVO: asignar autonúmero y agregar ──
        if (records.length === 0) {
            localStorage.setItem('abc_record_counter', '0');
        }
        let counter = parseInt(localStorage.getItem('abc_record_counter') || '0') + 1;
        localStorage.setItem('abc_record_counter', counter.toString());

        records.push({
            id: generateId(),
            num: counter,
            timestamp: new Date().toISOString(),
            coords: APP_STATE.monitoring.coords,
            user: APP_STATE.user,
            ...APP_STATE.monitoring
        });
        localStorage.setItem('abc_monitoring_records', JSON.stringify(records));
        alert(`✅ Registro #${counter} guardado exitosamente.`);
    }

    // Limpiar estado
    APP_STATE.editingRecordIdx = null;
    APP_STATE.monitoring = {
        coords: null,
        header: null,
        pests: {},
        diseases: {},
        weeds: {},
        growth: { poblacion: 0, altura: 0, lamina: 0, fenologia: 0 },
        notes: ''
    };

    window.scrollTo(0, 0);
    renderView('records');
}

// ═══════════════════════════════════════════════════
// SINCRONIZACIÓN Y EXPORTACIÓN
// ═══════════════════════════════════════════════════
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
        if (!scriptURL.includes('/exec')) {
            alert('⚠️ ADVERTENCIA: La URL no parece ser de una "Aplicación Web" (debe terminar en /exec). Por favor, use el enlace "Cambiar URL" para corregirla.');
        }

        // Crear respaldo automático antes de sincronizar
        try {
            localStorage.setItem('abc_sync_backup', JSON.stringify(toSync));
        } catch (e) { /* backup no es crítico */ }

        const response = await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(toSync.map(r => ({
                ...r,
                user: r.user || APP_STATE.user
            })))
        });

        // NOTA: Con mode: 'no-cors', response.type es 'opaque' y no podemos verificar el estado.
        // Advertir al usuario que confirme en el Excel.
        const isOpaque = response.type === 'opaque';

        // Marcar localmente los registros como sincronizados
        toSync.forEach(ts => {
            const index = records.findIndex(r => r.id === ts.id);
            if (index !== -1) {
                records[index].synced = true;
                records[index].syncedAt = new Date().toISOString();
            }
        });
        localStorage.setItem('abc_monitoring_records', JSON.stringify(records));

        if (isOpaque) {
            alert(`📤 Sincronización enviada: ${toSync.length} registros.\n\n⚠️ IMPORTANTE: Verifique en su Google Sheet que los datos hayan llegado correctamente. Si no aparecen, use "Exportar Respaldo" en Admin para no perder datos.`);
        } else {
            alert(`✅ Sincronización exitosa: ${toSync.length} registros procesados.`);
        }
        renderView('records');
    } catch (error) {
        console.error('Error en sincronización:', error);
        alert('❌ No se pudo conectar con el servidor.\n\nSus datos están seguros localmente. Verifique:\n1. Conexión a internet\n2. Que el script esté publicado como "Cualquier persona"\n3. Use "Exportar Respaldo" en Admin como medida de seguridad.');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        renderView(APP_STATE.currentView);
    }
}

function exportDataAsJSON() {
    const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: 'v43',
        user: APP_STATE.user,
        collections: APP_STATE.collections,
        records: JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]')
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `RiceMon_Respaldo_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`✅ Respaldo descargado: RiceMon_Respaldo_${dateStr}.json\n\nGuarde este archivo en un lugar seguro.`);
}

async function installPWA() {
    if (!APP_STATE.deferredPrompt) return;

    // Show the install prompt
    APP_STATE.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await APP_STATE.deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome} `);

    // We've used the prompt, and can't use it again, throw it away
    APP_STATE.deferredPrompt = null;

    // Refresh UI
    renderView(APP_STATE.currentView);
}

// ═══════════════════════════════════════════════════
// REGISTRO Y AUTENTICACIÓN
// ═══════════════════════════════════════════════════
function renderRegistration() {
    return `
        <div class="card registration-card">
            <div class="registration-header">
                <div class="registration-icon-wrap">
                    <i data-lucide="user-plus"></i>
                </div>
                <h2 class="view-title">Registro de Dispositivo</h2>
                <p class="view-subtitle">Complete sus datos para habilitar el uso de la aplicación.</p>
            </div>

            <div class="field-group">
                <label>Nombre Completo</label>
                <div class="input-with-icon">
                    <i data-lucide="user"></i>
                    <input type="text" id="reg-name" class="input-modern" placeholder="Ej: Mario Garcia">
                </div>
            </div>

            <div class="field-group">
                <label>Correo Electrónico</label>
                <div class="input-with-icon">
                    <i data-lucide="mail"></i>
                    <input type="email" id="reg-email" class="input-modern" placeholder="Ej: mario@geomatica.com">
                </div>
            </div>

            <div class="field-group">
                <label>PIN de Acceso (4 dígitos)</label>
                <div class="input-with-icon">
                    <i data-lucide="lock"></i>
                    <input type="password" id="reg-pin" class="input-modern" placeholder="Ej: 1234" maxlength="4" inputmode="numeric" pattern="[0-9]{4}">
                </div>
            </div>

            <div class="field-group">
                <label>Confirmar PIN</label>
                <div class="input-with-icon">
                    <i data-lucide="lock"></i>
                    <input type="password" id="reg-pin-confirm" class="input-modern" placeholder="Repita el PIN" maxlength="4" inputmode="numeric" pattern="[0-9]{4}">
                </div>
            </div>

            <button class="btn btn-primary registration-btn" onclick="saveRegistration()">
                REGISTRAR DISPOSITIVO
            </button>
            <p style="font-size: 0.75rem; color: var(--text-secondary); text-align: center; margin-top: 1.5rem; line-height: 1.4;">
                🔒 El PIN protege su acceso a esta app en este dispositivo.
            </p>
        </div>
    `;
}

async function hashPin(pin) {
    // Hash simple usando SHA-256 (disponible en navegadores modernos)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + '_abc_rice_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: almacenar codificado en base64 (no ideal pero mejor que plano)
    return btoa(pin + '_abc_rice');
}

async function saveRegistration() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pin = document.getElementById('reg-pin').value;
    const pinConfirm = document.getElementById('reg-pin-confirm').value;

    if (!name || name.length < 3) {
        alert('Por favor, ingrese un nombre completo (mínimo 3 caracteres).');
        return;
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
        alert('Por favor, ingrese un correo electrónico válido.');
        return;
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        alert('El PIN debe ser de exactamente 4 dígitos numéricos.');
        return;
    }

    if (pin !== pinConfirm) {
        alert('Los PINs no coinciden. Por favor, verifique.');
        return;
    }

    const pinHash = await hashPin(pin);
    const userData = { name, email, pinHash, registeredAt: new Date().toISOString() };
    APP_STATE.user = userData;
    localStorage.setItem('abc_user', JSON.stringify(userData));

    alert('¡Dispositivo registrado con éxito! 🎉');
    renderView('dashboard');
}

function showThreshold(id) {
    console.log('Solicitando umbral para:', id);
    let data = THRESHOLDS_DATA[id];
    if (data && data.alias) data = THRESHOLDS_DATA[data.alias];
    
    if (!data) {
        console.error('No threshold data for ID:', id);
        return;
    }

    // Remove existing if any
    const existing = document.getElementById('threshold-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'threshold-modal';
    modal.className = 'threshold-modal-overlay';
    
    let bodyHtml = '';
    
    if (data.isGrid) {
        // Special 4x5 Grid for Weeds
        let tableRows = data.rows.map(row => `
            <tr>
                <td style="font-weight:700; color:#fff; background: rgba(255,255,255,0.05);">${row[0]}</td>
                <td style="background: rgba(16, 185, 129, 0.4); color: #fff; font-weight: 800; text-align:center;">${row[1]}</td>
                <td style="background: rgba(245, 158, 11, 0.4); color: #fff; font-weight: 800; text-align:center;">${row[2]}</td>
                <td style="background: rgba(239, 68, 68, 0.4); color: #fff; font-weight: 800; text-align:center;">${row[3]}</td>
                <td style="font-size: 0.7rem; opacity: 0.8; line-height: 1.1; vertical-align: middle;">${row[4]}</td>
            </tr>
        `).join('');

        bodyHtml = `
            <table class="threshold-table weed-grid">
                <thead>
                    <tr>
                        <th style="background:#1e293b;">${data.header[0]}</th>
                        <th style="background:#10b981; color:#fff; text-align:center;">${data.header[1]}</th>
                        <th style="background:#f59e0b; color:#fff; text-align:center;">${data.header[2]}</th>
                        <th style="background:#ef4444; color:#fff; text-align:center;">${data.header[3]}</th>
                        <th style="background:#1e293b;">${data.header[4]}</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    } else {
        // Standard Rows
        const c1 = data.isInverted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.15)';
        const t1 = data.isInverted ? '#ef4444' : '#10b981';
        const c3 = data.isInverted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.15)';
        const t3 = data.isInverted ? '#10b981' : '#ef4444';

        let rowsHtml = data.rows.map(row => `
            <tr>
                <td>${row.cond}</td>
                <td style="background: ${c1}; color: ${t1}; font-weight: 700;">${row.n1}</td>
                <td style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-weight: 700;">${row.n2}</td>
                <td style="background: ${c3}; color: ${t3}; font-weight: 700;">${row.n3}</td>
                <td style="font-size: 0.75rem; opacity: 0.8;">${row.obs}</td>
            </tr>
        `).join('');
        
        bodyHtml = `
            <table class="threshold-table">
                <thead>
                    <tr>
                        <th>Condición</th>
                        <th>Nivel 1</th>
                        <th>Nivel 2</th>
                        <th>Nivel 3</th>
                        <th>Obs.</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    }

    modal.innerHTML = `
        <div class="threshold-modal-card">
            <div class="threshold-header">
                <div>
                    <h3 style="margin:0; font-size:1.1rem; color:#fff;">Umbrales: ${data.name}</h3>
                    <p style="margin:0; font-size:0.8rem; color:#94a3b8;">Guía de niveles para el control</p>
                </div>
                <button class="close-modal" onclick="hideThreshold()">×</button>
            </div>
            <div class="threshold-body">
                <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                    ${bodyHtml}
                </div>
            </div>
            <div class="threshold-footer">
                <button class="btn btn-primary" style="width: 100%;" onclick="hideThreshold()">ENTENDIDO</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function hideThreshold() {
    const modal = document.getElementById('threshold-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Global variable icon CSS & Threshold Modal CSS
if (!document.getElementById('threshold-styles')) {
    const styles = document.createElement('style');
    styles.id = 'threshold-styles';
    styles.innerHTML = `
        .pest-icon-badge, .disease-icon-badge, .weed-icon-badge {
            cursor: pointer;
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .pest-icon-badge:hover, .disease-icon-badge:hover, .weed-icon-badge:hover {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(255,255,255,0.2);
        }
        .pest-icon-badge::after, .disease-icon-badge::after, .weed-icon-badge::after {
            content: "\\2139\\FE0F";
            position: absolute;
            top: -5px;
            right: -5px;
            font-size: 10px;
            background: #1e293b;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none; /* Make sure it doesn't block the click */
        }

        .threshold-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000; opacity: 0; transition: opacity 0.3s;
            padding: 1rem;
        }
        .threshold-modal-overlay.active { opacity: 1; }
        .threshold-modal-card {
            background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px; width: 100%; max-width: 600px;
            overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            transform: translateY(20px); transition: transform 0.3s;
            max-height: 90vh; display: flex; flex-direction: column;
        }
        .threshold-modal-overlay.active .threshold-modal-card { transform: translateY(0); }
        .threshold-header {
            padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex; justify-content: space-between; align-items: center;
            flex-shrink: 0;
        }
        .close-modal {
            background: rgba(255,255,255,0.05); border: none; color: #fff;
            width: 32px; height: 32px; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; font-size: 1.2rem;
            cursor: pointer;
        }
        .threshold-body { 
            padding: 0; 
            overflow-y: auto;
            flex-grow: 1;
        }
        .threshold-table {
            width: 100%; border-collapse: collapse; min-width: 450px;
        }
        .threshold-table th {
            text-align: left; padding: 1rem; font-size: 0.7rem;
            text-transform: uppercase; letter-spacing: 1px; color: #64748b;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            position: sticky; top: 0; background: #1e293b;
        }
        .threshold-table td {
            padding: 0.85rem 1rem; font-size: 0.85rem; color: #cbd5e1;
            border-bottom: 1px solid rgba(255,255,255,0.02);
        }
        .threshold-footer { padding: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
    `;
    document.head.appendChild(styles);
}

console.log('Sistema de Umbrales inyectado correctamente.');

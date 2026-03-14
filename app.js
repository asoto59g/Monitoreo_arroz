/**
 * Plagueo en Arroz - Core Application Logic
 */

const APP_STATE = {
    currentView: 'dashboard',
    user: JSON.parse(localStorage.getItem('abc_user') || 'null'),
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
        weeds: {},
        growth: {
            poblacion: 0,
            altura: 0,
            lamina: 0,
            fenologia: 0
        }
    },
    deferredPrompt: null,
    editingRecordIdx: null   // índice del registro local que se está editando (null = nuevo)
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

    // Initialize Lucide icons after rendering
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderDashboard() {
    const records = JSON.parse(localStorage.getItem('abc_monitoring_records') || '[]');
    const pending = records.filter(r => !r.synced).length;

    return `
        <div class="card" style="margin-top: 1rem; background: linear-gradient(135deg, rgba(0,242,254,0.08), rgba(59,130,246,0.05)); border-color: rgba(0,242,254,0.15);">
            <div style="display:flex;align-items:center;gap:1rem;">
                <div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#00c6fb,#005bea);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0;">🌾</div>
                <div>
                    <h1 style="font-size: 1.4rem; margin-bottom: 0.2rem;">Hola, ${APP_STATE.user?.name || 'Plaguero'} 👋</h1>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">Sistema de Monitoreo de Plagas</p>
                </div>
            </div>
        </div>
        
        <div class="card" style="border: 1px solid rgba(0,242,254,0.25); background: linear-gradient(135deg,rgba(0,242,254,0.05),rgba(0,91,234,0.03));">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
                <span style="font-size:1.4rem;">📋</span>
                <p style="font-weight: 600; font-size:1rem;">Nuevo Registro de Campo</p>
            </div>
            <button class="btn btn-primary" style="width: 100%; box-shadow: 0 4px 20px rgba(0, 242, 254, 0.35); font-size:1rem;" onclick="startMonitoring()">🚀 INICIAR MONITOREO</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="card" style="margin-bottom: 0; padding: 1.25rem; text-align: center; background: linear-gradient(135deg,rgba(59,130,246,0.08),rgba(37,99,235,0.04));">
                <div style="font-size:1.6rem;margin-bottom:0.4rem;">📊</div>
                <p style="font-size:0.65rem; color: var(--text-secondary); margin-bottom: 0.3rem;font-weight:700;letter-spacing:1px;">TOTAL</p>
                <p style="font-size: 1.5rem; font-weight: 800;">${records.length}</p>
            </div>
            <div class="card" style="margin-bottom: 0; padding: 1.25rem; text-align: center; background: linear-gradient(135deg,${pending>0?'rgba(245,158,11,0.08)':'rgba(16,185,129,0.08)'},transparent);">
                <div style="font-size:1.6rem;margin-bottom:0.4rem;">${pending > 0 ? '⏳' : '✅'}</div>
                <p style="font-size:0.65rem; color: var(--text-secondary); margin-bottom: 0.3rem;font-weight:700;letter-spacing:1px;">PENDIENTES</p>
                <p style="font-size: 1.5rem; font-weight: 800; color: ${pending > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)'};">${pending}</p>
            </div>
        </div>

        <div class="card" style="padding: 1.2rem; border-color: ${pending > 0 ? 'var(--accent-emerald)' : 'var(--glass-border)'};">
            <button id="sync-btn" class="btn btn-primary" 
                    style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" 
                    onclick="syncWithGoogleSheets()">
                <i data-lucide="cloud-upload" style="width: 20px; height: 20px;"></i>
                SINCRONIZAR AHORA
            </button>
            <div style="text-align: center; margin-top: 0.8rem;">
                <a href="#" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: underline; display: inline-flex; align-items: center; gap: 0.3rem;" onclick="localStorage.removeItem('abc_sync_url'); alert('URL borrada. Presione Sincronizar para pegar la nueva.'); renderView('dashboard'); return false;">
                    <i data-lucide="pincode-locked" style="width: 12px; height: 12px;"></i>
                    Configurar URL de Script
                </a>
            </div>
        </div>

        <div id="pwa-install-container">
            ${APP_STATE.deferredPrompt ? `
                <div class="card" style="text-align: center; border: 1px solid var(--accent-emerald); background: rgba(0, 242, 254, 0.05);">
                    <p style="font-size: 0.9rem; margin-bottom: 1rem;">📲 Instale la App para acceso rápido.</p>
                    <button class="btn btn-primary" style="width: 100%;" onclick="installPWA()">INSTALAR APP</button>
                </div>
            ` : `
                <div class="card" style="border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.03); padding: 1rem;">
                    <h4 style="margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--accent-emerald);">💡 ¿Cómo instalar esta App?</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">
                        Si no ve el botón, use el menú de su navegador:<br>
                        <strong>Android:</strong> ⋮ > Instalar app.<br>
                        <strong>iPhone:</strong> 󰐧 > Agregar a inicio.
                    </p>
                </div>
            `}
        </div>
    `;
}

function renderAdmin() {
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00c6fb,#005bea);display:flex;align-items:center;justify-content:center;font-size:1.3rem;">⚙️</div>
                <h2 style="font-size: 1.25rem;">Administración</h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="renderView('dashboard')">← VOLVER</button>
        </div>
        
        <div class="card" style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 1.25rem; background: linear-gradient(135deg,rgba(0,198,251,0.07),rgba(0,91,234,0.04));" onclick="renderView('admin_ciclos')">
            <div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#0891b2,#0e7490);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">🔄</div>
            <div>
                <h3 style="font-size: 1.05rem; margin-bottom: 0.2rem;">Ciclos Agrícolas</h3>
                <p style="color: var(--text-secondary); font-size: 0.8rem;">${APP_STATE.collections.ciclos.length} registrados</p>
            </div>
            <i data-lucide="chevron-right" style="margin-left: auto; width: 18px; color: var(--text-secondary); opacity: 0.5;"></i>
        </div>
        
        <div class="card" style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 1.25rem; background: linear-gradient(135deg,rgba(245,158,11,0.07),rgba(180,83,9,0.04));" onclick="renderView('admin_fincas')">
            <div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">🏠</div>
            <div>
                <h3 style="font-size: 1.05rem; margin-bottom: 0.2rem;">Fincas</h3>
                <p style="color: var(--text-secondary); font-size: 0.8rem;">${APP_STATE.collections.fincas.length} registradas</p>
            </div>
            <i data-lucide="chevron-right" style="margin-left: auto; width: 18px; color: var(--text-secondary); opacity: 0.5;"></i>
        </div>
        
        <div class="card" style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 1.25rem; background: linear-gradient(135deg,rgba(16,185,129,0.07),rgba(5,150,105,0.04));" onclick="renderView('admin_lotes')">
            <div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#059669,#047857);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">🗂️</div>
            <div>
                <h3 style="font-size: 1.05rem; margin-bottom: 0.2rem;">Lotes / Parcelas</h3>
                <p style="color: var(--text-secondary); font-size: 0.8rem;">${APP_STATE.collections.lotes.length} registrados</p>
            </div>
            <i data-lucide="chevron-right" style="margin-left: auto; width: 18px; color: var(--text-secondary); opacity: 0.5;"></i>
        </div>

        <div class="card" style="margin-top: 1.5rem; border-color: rgba(255, 255, 255, 0.05);">
            <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem;">
                <div class="card-icon" style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.05); border-radius: 50%;"><i data-lucide="user"></i></div>
                <div>
                    <h4 style="font-size: 1rem;">${APP_STATE.user?.name || 'Usuario'}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${APP_STATE.user?.email || 'No registrado'}</p>
                </div>
            </div>
            <button class="btn btn-secondary" style="width: 100%; font-size: 0.75rem; padding: 0.6rem;" onclick="localStorage.removeItem('abc_user'); location.reload();">
                CAMBIAR USUARIO / RE-REGISTRAR
            </button>
        </div>
    `;
}

function renderAdminCiclos() {
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="refresh-cw"></i></div>
                <h2 style="font-size: 1.25rem;">Ciclos</h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="renderView('admin')">VOLVER</button>
        </div>
        
        <div class="card" style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; margin-bottom: 1rem;">Agregar Nuevo Ciclo</h3>
            <div class="field-group">
                <input type="text" id="new-ciclo-nombre" class="input-modern" placeholder="Ej: Verano 2026">
            </div>
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="addItemCiclo()">
                <i data-lucide="plus" style="width: 18px; height: 18px;"></i> AÑADIR CICLO
            </button>
        </div>

        <div class="list-container">
            ${APP_STATE.collections.ciclos.map(c => `
                <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
                    <span style="font-weight: 600;">${c.nombre}</span>
                    <button class="btn btn-secondary" style="color: var(--accent-red); padding: 0.4rem; border: none; background: transparent;" onclick="deleteItem('ciclos', '${c.id}', 'admin_ciclos')">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            `).join('') || '<p style="text-align: center; color: var(--text-secondary);">No hay ciclos.</p>'}
        </div>
`;
}

function renderAdminFincas() {
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="building-2"></i></div>
                <h2 style="font-size: 1.25rem;">Fincas</h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="renderView('admin')">VOLVER</button>
        </div>
        
        <div class="card" style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; margin-bottom: 1rem;">Agregar Nueva Finca</h3>
            <div class="field-group">
                <input type="text" id="new-finca-nombre" class="input-modern" placeholder="Ej: Finca La Esperanza">
            </div>
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="addItemFinca()">
                <i data-lucide="plus" style="width: 18px; height: 18px;"></i> AÑADIR FINCA
            </button>
        </div>

        <div class="list-container">
            ${APP_STATE.collections.fincas.map(f => `
                <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
                    <span style="font-weight: 600;">${f.nombre}</span>
                    <button class="btn btn-secondary" style="color: var(--accent-red); padding: 0.4rem; border: none; background: transparent;" onclick="deleteItem('fincas', '${f.id}', 'admin_fincas')">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            `).join('') || '<p style="text-align: center; color: var(--text-secondary);">No hay fincas.</p>'}
        </div>
`;
}

function renderAdminLotes() {
    const cicloOptions = APP_STATE.collections.ciclos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    const fincaOptions = APP_STATE.collections.fincas.map(f => `<option value="${f.id}">${f.nombre}</option>`).join('');

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="grid-3x3"></i></div>
                <h2 style="font-size: 1.25rem;">Lotes</h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="renderView('admin')">VOLVER</button>
        </div>
        
        <div class="card" style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1rem; margin-bottom: 1rem;">Nuevo Lote</h3>
            <div class="field-group">
                <label>Ciclo Agrícola</label>
                <select id="new-lote-ciclo" class="input-modern">${cicloOptions}</select>
            </div>
            <div class="field-group">
                <label>Finca</label>
                <select id="new-lote-finca" class="input-modern">${fincaOptions}</select>
            </div>
            <div class="field-group">
                <label>Nombre del Lote</label>
                <input type="text" id="new-lote-nombre" class="input-modern" placeholder="Ej: Lote A1">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="field-group">
                    <label>Variedad</label>
                    <input type="text" id="new-lote-variedad" class="input-modern" placeholder="Ej: Palmar 18">
                </div>
                <div class="field-group">
                    <label>Área (Ha)</label>
                    <input type="number" id="new-lote-area" class="input-modern" placeholder="0.0">
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="addItemLote()">
                <i data-lucide="plus" style="width: 18px; height: 18px;"></i> AÑADIR LOTE
            </button>
        </div>

        <div class="list-container">
            ${APP_STATE.collections.lotes.map(l => {
        const ciclo = APP_STATE.collections.ciclos.find(c => c.id === l.cicloId)?.nombre || 'N/A';
        const finca = APP_STATE.collections.fincas.find(f => f.id === l.fincaId)?.nombre || 'N/A';
        return `
                    <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
                        <div>
                            <span style="font-weight: 700; display: block;">${l.nombre}</span>
                            <span style="font-size: 0.7rem; color: var(--text-secondary);">${ciclo} • ${finca}</span>
                        </div>
                        <button class="btn btn-secondary" style="color: var(--accent-red); padding: 0.4rem; border: none; background: transparent;" onclick="deleteItem('lotes', '${l.id}', 'admin_lotes')">
                            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                        </button>
                    </div>
                `;
    }).join('') || '<p style="text-align: center; color: var(--text-secondary);">No hay lotes.</p>'}
        </div>
`;
}

// Administrative Helpers
function addItemCiclo() {
    const nombreInput = document.getElementById('new-ciclo-nombre');
    if (!nombreInput || !nombreInput.value.trim()) {
        alert('Por favor ingrese un nombre para el ciclo.');
        return;
    }

    APP_STATE.collections.ciclos.push({
        id: Date.now().toString(),
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
        id: Date.now().toString(),
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

    APP_STATE.collections.lotes.push({
        id: Date.now().toString(),
        nombre: nombreInput.value,
        cicloId: cicloInput.value,
        fincaId: fincaInput.value,
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
        const recNum = r.num ? `<span style="font-size:0.6rem;font-weight:900;padding:0.15rem 0.5rem;border-radius:99px;background:rgba(255,255,255,0.07);color:var(--text-secondary);border:1px solid var(--glass-border);margin-right:0.4rem;">#${r.num}</span>` : '';

        const h = r.header || {};
        const coords = r.coords || {};

        // --- chip helpers ---
        const chipStyle = (val, maxScale) => {
            const pct = val / maxScale;
            if (pct <= 0.33) return 'background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.5);color:#10b981;';
            if (pct <= 0.66) return 'background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);color:#f59e0b;';
            return 'background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5);color:#ef4444;';
        };
        const chip = (label, val, maxScale) =>
            `<span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.18rem 0.5rem;border-radius:99px;${chipStyle(val,maxScale)}font-size:0.65rem;font-weight:700;margin:0.15rem;">${label}&nbsp;<strong>${val}</strong></span>`;

        // --- Plagas ---
        const allPestNames = {};
        [...(PEST_DB.invertebrates||[]),...(PEST_DB.vertebrates||[]),...(PEST_DB.beneficials||[])].forEach(p=>allPestNames[p.id]=p.name);
        const pestChips = Object.entries(r.pests||{}).filter(([,v])=>v>0)
            .map(([id,val])=>chip(allPestNames[id]||id, val, 3)).join('');

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
            <div style="margin-bottom:0.5rem;">
                <div style="font-size:0.58rem;font-weight:800;letter-spacing:1.2px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:0.3rem;">${emoji} ${label}</div>
                <div style="display:flex;flex-wrap:wrap;">${chips}</div>
            </div>` : '';

        const details = section('🐛','Plagas',pestChips)
                      + section('🦠','Enfermedades',diseaseChips)
                      + section('🌿','Malezas',weedChips)
                      + section('📈','Crecimiento',growthChips);

        return `
            <div class="card" style="padding: 1.25rem; border-left: 5px solid ${r.synced ? 'var(--accent-green)' : 'var(--accent-yellow)'}; animation: slideUp 0.4s ease-out backwards; animation-delay: ${idx * 0.05}s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div style="display: flex; gap: 0.75rem;">
                        <div class="card-icon" style="margin-top: 0.2rem;">
                            <i data-lucide="map-pin" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary); letter-spacing: -0.5px;">${recNum}${h.lote_name || 'Lote Descon.'}</div>
                            <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.3rem;">
                                <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
                                ${dateStr} • ${timeStr}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.4rem;">
                        ${!r.synced ? `<button onclick="editRecord(${originalIdx})" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.55rem;border-radius:99px;background:rgba(59,130,246,0.18);border:1px solid rgba(59,130,246,0.45);color:#60a5fa;font-size:0.65rem;font-weight:800;cursor:pointer;">✏️ EDITAR</button>` : ''}
                        <span style="font-size: 0.65rem; padding: 0.25rem 0.6rem; border-radius: 99px; background: rgba(255,255,255,0.05); color: ${r.synced ? 'var(--accent-green)' : 'var(--accent-yellow)'}; font-weight: 800; border: 1px solid currentColor; white-space:nowrap;">
                            ${r.synced ? 'SINC' : 'PEND'}
                        </span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 0.6rem;">
                    <div><strong>Ciclo:</strong> ${h.ciclo_name || '-'}</div>
                    <div><strong>Variedad:</strong> ${h.variedad || '-'}</div>
                    <div><strong>Plaguero:</strong> ${h.plaguero || '-'}</div>
                    <div><strong>Área:</strong> ${h.area || '-'} Ha | <strong>Edad:</strong> ${h.edad || '-'} dds</div>
                </div>

                <div style="background: rgba(0,0,0,0.2); padding: 0.4rem 0.6rem; border-radius: 8px; font-size: 0.68rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                    📍 ${coords.lat?.toFixed(5) || '?'}, ${coords.lon?.toFixed(5) || '?'}
                </div>

                ${details ? `<div style="border-top:1px solid var(--glass-border);padding-top:0.65rem;margin-bottom:0.75rem;">${details}</div>` : ''}

                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.75rem; color: var(--accent-red); border-color: rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; gap: 0.3rem;" onclick="deleteRecord(${originalIdx})">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> ELIMINAR
                    </button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="history"></i></div>
                <h2 style="font-size: 1.5rem; letter-spacing: -0.5px;">Registros</h2>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${records.length} TOTAL</div>
        </div>

    ${pending > 0 ? `
        <div class="card" style="border: 1px solid var(--accent-emerald); background: rgba(0, 242, 254, 0.05); padding: 1.25rem; text-align: center; margin-bottom: 1.5rem; animation: slideUp 0.4s ease-out;">
            <p style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 1rem; font-weight: 500;">Tiene <span style="color: var(--accent-emerald); font-weight: 700;">${pending}</span> registros pendientes</p>
            <button id="sync-btn-all" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="syncWithGoogleSheets()">
                <i data-lucide="cloud-upload" style="width: 18px; height: 18px;"></i> SINCRONIZAR TODO
            </button>
        </div>
        ` : ''
        }

<div class="monitoring-scroll">
    ${list || '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-secondary);"> <i data-lucide="inbox" style="width: 48px; height: 48px; opacity: 0.2; margin-bottom: 1rem;"></i><p>No hay registros locales.</p></div>'}
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
                gpsLabel.innerHTML = `📡 Lat: ${position.coords.latitude.toFixed(5)}, Lon: ${position.coords.longitude.toFixed(5)} `;
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
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="file-text"></i></div>
                <h2 style="font-size: 1.25rem; letter-spacing: -0.5px;">Encabezado</h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem;" onclick="renderView('dashboard')">
                <i data-lucide="x" style="width: 14px; height: 14px;"></i> CANCELAR
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
                    <span style="font-size:1.3rem;line-height:1;">${step.emoji}</span>
                    <span>${step.label}</span>
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
                <div id="pest-${pest.id}" class="card" style="padding: 1.25rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="pest-icon-badge" style="background:${iconInfo.bg};border:1px solid ${iconInfo.border};">
                                ${iconInfo.emoji}
                            </div>
                            <div>
                                <span style="font-weight: 700; font-size: 1rem; letter-spacing: -0.5px; display:block;">${pest.name}</span>
                                <span style="font-size:0.65rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Nivel de Población</span>
                            </div>
                        </div>
                        <div class="threshold-indicator" style="margin-bottom: 0;">
                            <div class="threshold-dot green ${isLow ? 'active' : ''}"></div>
                            <div class="threshold-dot yellow ${isMed ? 'active' : ''}"></div>
                            <div class="threshold-dot red ${isHigh ? 'active' : ''}"></div>
                        </div>
                    </div>

                    <div class="level-selector-premium">
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
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="bug"></i></div>
                <h2 style="font-size: 1.25rem; letter-spacing: -0.5px;">Plagas <span style="color: var(--text-secondary); font-size: 0.9rem;">1/5</span></h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem;" onclick="renderView('monitor_header')">
                <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i> ATRÁS
            </button>
        </div>
        
        ${navHtml}
        
        <div class="monitoring-scroll">
            ${pestsHtml}
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="renderView('monitor_diseases')">
                CONTINUAR <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
            </button>
        </div>
`;
}

function setPestLevel(id, level) {
    APP_STATE.monitoring.pests[id] = level;
    renderView('monitor_pests', true); // preserve scroll position while selecting levels
}

function setDiseaseLevel(id, level) {
    APP_STATE.monitoring.diseases[id] = level;
    renderView('monitor_diseases', true);
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
            buttons += `<button class="level-btn level-btn-zero ${currentLevel == 0 ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', 0)">0</button>`;
            for (let i = 1; i <= 3; i++) buttons += `<button class="level-btn btn-green ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            for (let i = 4; i <= 6; i++) buttons += `<button class="level-btn btn-yellow ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
            for (let i = 7; i <= 9; i++) buttons += `<button class="level-btn btn-red ${currentLevel == i ? 'active' : ''}" onclick="setDiseaseLevel('${d.id}', ${i})">${i}</button>`;
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
            <div class="card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <div class="disease-icon-badge">${dEmoji}</div>
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
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="thermometer-sun"></i></div>
                <h2 style="font-size: 1.25rem; letter-spacing: -0.5px;">Enfermedades <span style="color: var(--text-secondary); font-size: 0.9rem;">2/5</span></h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem;" onclick="renderView('monitor_pests')">
                <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i> ATRÁS
            </button>
        </div>
        
        ${renderMonitorNav('monitor_diseases')}
        
        <div class="monitoring-scroll">
            ${diseaseHtml}
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="renderView('monitor_weeds')">
                CONTINUAR <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
            </button>
        </div>
    `;
}

function setDiseaseLevel(id, level) {
    APP_STATE.monitoring.diseases[id] = level;
    renderView('monitor_diseases'); // Re-rendering is easier for now to keep state synced without complex DOM selecors
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
            <div class="card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <div class="weed-icon-badge">${wEmoji}</div>
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
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="sprout"></i></div>
                <h2 style="font-size: 1.25rem; letter-spacing: -0.5px;">Malezas <span style="color: var(--text-secondary); font-size: 0.9rem;">3/5</span></h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem;" onclick="renderView('monitor_diseases')">
                <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i> ATRÁS
            </button>
        </div>
        
        ${renderMonitorNav('monitor_weeds')}
        
        <div class="monitoring-scroll">
            ${selectedHtml}
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="renderView('monitor_growth')">
                CONTINUAR <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
            </button>
        </div>
    `;
}

function setWeedLevel(wName, level) {
    APP_STATE.monitoring.weeds[wName] = parseInt(level);
    renderView('monitor_weeds', true); // preserve scroll position while selecting levels
}

function renderMonitorGrowth() {
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="card-icon"><i data-lucide="line-chart"></i></div>
                <h2 style="font-size: 1.25rem; letter-spacing: -0.5px;">Crecimiento <span style="color: var(--text-secondary); font-size: 0.9rem;">4/5</span></h2>
            </div>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem;" onclick="renderView('monitor_weeds')">
                <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i> ATRÁS
            </button>
        </div>

        ${renderMonitorNav('monitor_growth')}
        
        <div class="monitoring-scroll">
            <div class="card">
                <div class="field-group">
                    <label>Población (plantas/m2)</label>
                    <input type="number" id="mon-poblacion" class="input-modern" value="${APP_STATE.monitoring.growth.poblacion || ''}" placeholder="Ej: 250">
                </div>
                <div class="field-group">
                    <label>Altura Planta (cm)</label>
                    <input type="number" id="mon-altura" class="input-modern" value="${APP_STATE.monitoring.growth.altura || ''}" placeholder="Ej: 45">
                </div>
                <div class="field-group">
                    <label>Lámina de Agua</label>
                    <select id="mon-agua" class="input-modern">
                        <option value="Seco" ${APP_STATE.monitoring.growth.agua === 'Seco' ? 'selected' : ''}>Seco</option>
                        <option value="Saturado" ${APP_STATE.monitoring.growth.agua === 'Saturado' ? 'selected' : ''}>Saturado</option>
                        <option value="Lámina" ${APP_STATE.monitoring.growth.agua === 'Lámina' ? 'selected' : ''}>Lámina</option>
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
            </div>
        </div>
        
        <div class="sticky-footer">
            <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="saveAndFinish()">
                <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
                FINALIZAR MONITOREO
            </button>
        </div>
`;
}

function saveAndFinish() {
    const poblacion = document.getElementById('mon-poblacion')?.value;
    const altura = document.getElementById('mon-altura')?.value;
    const agua = document.getElementById('mon-agua')?.value;
    const fenologia = document.getElementById('mon-fenologia')?.value;

    if (!poblacion || !altura || !agua || !fenologia) {
        alert('⚠️ Por favor complete todos los parámetros de crecimiento (Población, Altura, Agua y Fenología) antes de finalizar.');
        return;
    }

    APP_STATE.monitoring.growth = { poblacion, altura, agua, fenologia };

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
            growth:    APP_STATE.monitoring.growth
        };
        localStorage.setItem('abc_monitoring_records', JSON.stringify(records));
        alert(`✅ Registro #${existing.num || ''} actualizado correctamente.`);
    } else {
        // ── MODO NUEVO: asignar autonúmero y agregar ──
        let counter = parseInt(localStorage.getItem('abc_record_counter') || '0') + 1;
        localStorage.setItem('abc_record_counter', counter.toString());

        records.push({
            id: Date.now().toString(),
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
        growth: { poblacion: 0, altura: 0, lamina: 0, fenologia: 0 }
    };

    window.scrollTo(0, 0);
    renderView('records');
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
        if (!scriptURL.includes('/exec')) {
            alert('⚠️ ADVERTENCIA: La URL no parece ser de una "Aplicación Web" (debe terminar en /exec). Por favor, use el enlace "Cambiar URL" para corregirla.');
        }

        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(toSync)
        });

        // Borrar localmente los registros que fueron sincronizados
        const remainingRecords = records.filter(r => !toSync.some(ts => ts.id === r.id));
        localStorage.setItem('abc_monitoring_records', JSON.stringify(remainingRecords));

        alert(`✅ Sincronización exitosa: ${toSync.length} registros enviados y eliminados del dispositivo.`);
        renderView(APP_STATE.currentView);
    } catch (error) {
        console.error('Error en sincronización:', error);
        alert('No se pudo conectar con el servidor. Verifique que el script esté publicado correctamente como "Cualquier persona".');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        renderView(APP_STATE.currentView);
    }
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

function renderRegistration() {
    return `
        <div class="card" style="margin-top: 2rem; padding: 2rem;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div class="card-icon" style="margin-bottom: 1rem; transform: scale(1.5);"><i data-lucide="user-plus"></i></div>
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Registro de Dispositivo</h2>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Complete sus datos para habilitar el uso de la aplicación.</p>
            </div>

            <div class="field-group">
                <label>Nombre Completo</label>
                <div style="position: relative;">
                    <i data-lucide="user" style="position: absolute; left: 1rem; top: 1.1rem; width: 18px; color: var(--text-secondary);"></i>
                    <input type="text" id="reg-name" class="input-modern" style="padding-left: 3rem;" placeholder="Ej: Mario Garcia">
                </div>
            </div>

            <div class="field-group">
                <label>Correo Electrónico</label>
                <div style="position: relative;">
                    <i data-lucide="mail" style="position: absolute; left: 1rem; top: 1.1rem; width: 18px; color: var(--text-secondary);"></i>
                    <input type="email" id="reg-email" class="input-modern" style="padding-left: 3rem;" placeholder="usuario@ejemplo.com">
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="saveRegistration()">
                REGISTRAR DISPOSITIVO
            </button>
            <p style="font-size: 0.7rem; color: var(--text-secondary); text-align: center; margin-top: 1.5rem;">
                La contraseña y validación de seguridad se habilitarán en una fase posterior.
            </p>
        </div>
    `;
}

function saveRegistration() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;

    if (!name || !email || !email.includes('@')) {
        alert('Por favor, ingrese un nombre y correo electrónico válido.');
        return;
    }

    const userData = { name, email, registeredAt: new Date().toISOString() };
    APP_STATE.user = userData;
    localStorage.setItem('abc_user', JSON.stringify(userData));

    alert('¡Dispositivo registrado con éxito!');
    renderView('dashboard');
}

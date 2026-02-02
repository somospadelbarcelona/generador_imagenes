/**
 * admin-entrenos.js
 * View Controller for Entrenos Management.
 * Version: 5001 - Optimized for Mobile Actions
 */
console.log("🚀 AdminEntrenos Loaded (v5001)");

window.AdminViews = window.AdminViews || {};

// Main Management View
// 1. GESTOR DE ENTRENOS (Listado y Filtros)
window.AdminViews.entrenos_mgmt = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Gestor de Entrenos';
    content.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Cargando todos los entrenos...</p></div>';

    try {
        // Forzar recarga de datos saltando caché si es posible
        if (window.CacheService) window.CacheService.remove(`all_entrenos`);

        const entrenos = await EventService.getAll(AppConstants.EVENT_TYPES.ENTRENO);
        const sortedEntrenos = entrenos.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 📅 Get available months for filter list
        const availableMonths = [...new Set(sortedEntrenos.map(e => {
            if (!e.date) return null;
            if (e.date.includes('-')) return e.date.substring(0, 7); // YYYY-MM
            if (e.date.includes('/')) {
                const p = e.date.split('/');
                return `${p[2]}-${p[0].padStart(2, '0')}`;
            }
            return null;
        }))].filter(Boolean).sort((a, b) => b.localeCompare(a));

        const monthNames = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };
        const monthOptions = availableMonths.map(m => {
            const [y, mm] = m.split('-');
            return `<option value="${m}">${(monthNames[mm] || mm).toUpperCase()} ${y}</option>`;
        }).join('');

        const listHtml = sortedEntrenos.map(evt => renderEntrenoCard(evt)).join('');

        content.innerHTML = `
            <div class="planning-area" id="entrenos-planning-area" style="display: flex; flex-direction: column; height: calc(100vh - 140px);">
                
                <!-- FILTER BAR -->
                <div class="filter-bar-pro" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); align-items: center;">
                    <div style="position:relative; grid-column: span 2;">
                        <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3); font-size:0.8rem;"></i>
                        <input type="text" id="entreno-search-input" placeholder="Buscar por nombre..."
                            style="padding-left:35px; height:45px; font-size:0.9rem; width:100%; border-radius:12px; background:rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white;">
                    </div>
                    <select id="filter-month" class="pro-input" style="height:45px; font-size: 0.8rem;">
                        <option value="all">MES: TODOS</option>
                        ${monthOptions}
                    </select>
                    <select id="filter-status" class="pro-input" style="height:45px; font-size: 0.8rem;">
                        <option value="all">ESTADO: TODOS</option>
                        <option value="open">🟢 ABIERTO</option>
                        <option value="live">🎾 EN JUEGO</option>
                        <option value="finished">🏁 FINALIZADO</option>
                        <option value="pairing">🔀 EMPAREJANDO</option>
                    </select>
                    <select id="filter-category" class="pro-input" style="height:45px; font-size: 0.8rem;">
                        <option value="all">CATEGORÍA: TODAS</option>
                        <option value="male">MASCULINO</option>
                        <option value="female">FEMENINO</option>
                        <option value="mixed">MIXTO</option>
                        <option value="open">OPEN / TODOS</option>
                    </select>
                    <div style="display:flex; gap: 8px;">
                        <button class="btn-outline-pro" onclick="document.getElementById('entreno-search-input').value=''; document.getElementById('filter-month').value='all'; document.getElementById('filter-status').value='all'; document.getElementById('filter-category').value='all'; loadAdminView('entrenos_mgmt')" style="flex:1; height:45px; font-size: 0.7rem; padding: 0;">
                            <i class="fas fa-eraser"></i> LIMPIAR
                        </button>
                        <button class="btn-outline-pro" onclick="loadAdminView('entrenos_mgmt')" style="width: 45px; height:45px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- SCROLLABLE LIST -->
                <div class="entreno-scroll-list" id="entrenos-list-container" style="overflow-y: auto; padding-right: 10px; flex: 1;">
                    ${listHtml.length ? listHtml : '<div class="glass-card-enterprise" style="text-align:center; padding: 5rem; color: var(--text-muted);"><i class="fas fa-terminal" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i><br>No se encontraron entrenos con los filtros actuales.</div>'}
                </div>
            </div>
        `;

        setupFilters();

    } catch (e) {
        console.error("Error en Gestor Entrenos:", e);
        content.innerHTML = `<div class="error-box"><h3>Error de conexión</h3><p>${e.message}</p></div>`;
    }
};

// 2. CREAR ENTRENO (Formulario Dedicado)
window.AdminViews.entrenos_create = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Crear Nuevo Entreno';

    content.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto;">
            <div class="glass-card-enterprise" style="padding: 2.5rem;">
                <h3 style="color: var(--primary); margin-bottom: 2rem; display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-plus-circle" style="font-size: 1.5rem;"></i> CONFIGURACIÓN DEL EVENTO
                </h3>
                
                <form id="create-entreno-form" class="pro-form">
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label>NOMBRE DEL EVENTO</label>
                        <input type="text" name="name" class="pro-input" placeholder="Ej: Entreno Mañanero Intensivo" required style="font-weight:800; font-size: 1.1rem; height: 50px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>FECHA DEL EVENTO</label>
                            <input type="date" name="date" class="pro-input" required style="height: 50px;">
                        </div>
                        <div class="form-group">
                            <label>HORA DE INICIO</label>
                            <input type="time" name="time" class="pro-input" value="10:00" required style="height: 50px;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>CATEGORÍA / GÉNERO</label>
                            <select name="category" class="pro-input" style="height: 50px;">
                                <option value="open">TODOS / OPEN</option>
                                <option value="male">MASCULINO</option>
                                <option value="female">FEMENINO</option>
                                <option value="mixed">MIXTO</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>SEDE / UBICACIÓN</label>
                            <select name="location" class="pro-input" style="height: 50px;">
                                <option value="Barcelona Pádel el Prat">EL PRAT</option>
                                <option value="Delfos Cornellá">DELFOS</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>NÚMERO DE PISTAS</label>
                            <input type="number" name="max_courts" class="pro-input" value="4" min="1" style="height: 50px;">
                        </div>
                         <div class="form-group">
                            <label>MODO DE JUEGO</label>
                            <select name="pair_mode" class="pro-input" style="height: 50px;">
                                <option value="fixed">🔒 PAREJA FIJA</option>
                                <option value="rotating">🌪️ TWISTER (Individual)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 2rem;">
                        <label>URL DE IMAGEN (OPCIONAL)</label>
                        <input type="text" name="image_url" class="pro-input" placeholder="Se asignará una automática si se deja vacío" style="font-size: 0.85rem; height: 50px;">
                    </div>

                    <input type="hidden" name="status" value="open">
                    
                    <div style="display: flex; gap: 15px; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                        <button type="button" class="btn-outline-pro" onclick="loadAdminView('entrenos_mgmt')" style="flex: 1; height: 55px; font-weight: 700;">
                            CANCELAR
                        </button>
                        <button type="submit" class="btn-primary-pro" style="flex: 2; height: 55px; font-weight: 900; font-size: 1.1rem; box-shadow: 0 8px 25px rgba(204,255,0,0.3);">
                            PUBLICAR ENTRENO 🚀
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupCreateForm();
};

// --- HELPER FUNCTIONS --- //

function renderEntrenoCard(e) {
    const playersCount = e.players?.length || 0;
    const maxPlayers = (parseInt(e.max_courts) || 4) * 4;

    const isCancelled = e.status === 'cancelled';
    const statusLabel = e.status === 'live' ? 'EN JUEGO' : e.status === 'finished' ? 'FINALIZADA' : e.status === 'pairing' ? 'EMPAREJAMIENTO' : (isCancelled ? 'ANULADO' : 'ABIERTA');
    const statusColor = e.status === 'live' ? '#FF2D55' : e.status === 'finished' ? '#888' : e.status === 'pairing' ? '#22D3EE' : (isCancelled ? '#F43F5E' : '#00E36D');

    // Determine Month for filter
    let month = '';
    if (e.date) {
        if (e.date.includes('-')) month = e.date.substring(0, 7); // 2024-01-25 -> 2024-01
        else if (e.date.includes('/')) {
            const p = e.date.split('/');
            month = `${p[2]}-${p[1].padStart(2, '0')}`;
        }
    }

    // Calculate Duration
    let durationText = '';
    if (e.time && e.time_end) {
        try {
            const [startH, startM] = e.time.split(':').map(Number);
            const [endH, endM] = e.time_end.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            const durationMinutes = endMinutes - startMinutes;

            if (durationMinutes > 0) {
                const hours = Math.floor(durationMinutes / 60);
                const mins = durationMinutes % 60;
                if (hours > 0) {
                    durationText = `${hours}h ${mins > 0 ? mins + 'min' : ''}`;
                } else {
                    durationText = `${mins}min`;
                }
            }
        } catch (err) {
            console.warn('Error calculating duration:', err);
        }
    }

    return `
        <div class="glass-card-enterprise entreno-card-item" 
             data-month="${month}" 
             data-status="${e.status || 'open'}" 
             data-category="${e.category || 'open'}"
             style="margin-bottom: 1.2rem; display: flex; flex-direction: column; padding: 1.2rem; border-left: 4px solid ${statusColor}; background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%); gap: 1rem;">
            
            <div style="display: flex; gap: 1.2rem; align-items: flex-start;">
                <div class="entreno-preview-img" style="width: 60px; height: 60px; border-radius: 12px; background: url('${(e.image_url || '').replace(/ /g, '%20')}') center/cover; border: 1px solid rgba(255,255,255,0.1); position:relative; flex-shrink: 0;">
                    <div style="position:absolute; bottom:-5px; right:-5px; background:${statusColor}; width:12px; height:12px; border-radius:50%; border:2px solid #1a1c23;"></div>
                </div>
                <div class="entreno-info-pro" style="flex: 1; min-width: 0;">
                    <div style="font-weight: 950; font-size: 1.1rem; color: #FFFFFF; margin-bottom: 0.4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                        ${e.name.toUpperCase()}
                    </div>
                    <div style="display: flex; gap: 0.8rem; font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap; align-items: center;">
                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-calendar-alt" style="color: #60A5FA;"></i> <span style="color:#eee; font-weight: 600;">${formatDate(e.date)}</span></span>
                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-clock" style="color: #A78BFA;"></i> <span style="color:#eee; font-weight: 600;">${e.time || '10:00'}</span></span>
                         <span onclick='window.openEditEntrenoModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' style="cursor:pointer; display: flex; align-items: center; gap: 5px;" title="Gestionar participantes">
                            <i class="fas fa-users" style="color: #34D399;"></i> <span style="color:var(--primary); font-weight:800;">${playersCount}</span><span style="opacity:0.5;">/${maxPlayers}</span>
                         </span>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:6px 10px; border-radius:8px; font-size:0.7rem; font-weight:900; color:var(--primary); border: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;">
                    ${e.price_members || 15}€
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.03);">
                <!-- Status Selector -->
                <div style="position: relative; flex: 1; min-width: 120px;">
                    <select onchange="window.updateEntrenoStatus('${e.id}', this.value)" 
                            style="
                                width: 100%;
                                appearance: none; 
                                background: ${statusColor}15; 
                                color: #FFFFFF; 
                                border: 1px solid ${statusColor}; 
                                padding: 8px 12px; 
                                border-radius: 8px; 
                                font-weight: 800; 
                                font-size: 0.65rem; 
                                cursor: pointer; 
                                text-transform: uppercase;
                                outline: none;
                            ">
                        <option value="open" ${e.status === 'open' ? 'selected' : ''}>🟢 ABIERTA</option>
                        <option value="pairing" ${e.status === 'pairing' ? 'selected' : ''}>🔀 EMPAREJAMIENTO</option>
                        <option value="live" ${e.status === 'live' ? 'selected' : ''}>🎾 EN JUEGO</option>
                        <option value="finished" ${e.status === 'finished' ? 'selected' : ''}>🏁 FINALIZADA</option>
                        <option value="cancelled" ${e.status === 'cancelled' ? 'selected' : ''}>⛔ ANULADO</option>
                    </select>
                </div>

                <!-- Action Group -->
                <div style="display: flex; gap: 8px; flex-shrink: 0; justify-content: flex-end; flex: 1;">
                    ${(e.status === 'open' || e.status === 'live') ? `
                    <button class="btn-micro" 
                            style="background: #FFD700 !important; color: #000 !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick="window.launchBatSignalEntreno('${e.id}')"
                            title="Batseñal">
                        <i class="fas fa-bullhorn" style="font-size: 1rem; color: #000 !important;"></i>
                    </button>
                    ` : ''}

                    <button class="btn-micro" 
                            style="background: #25D366 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick="window.launchWhatsAppShareEntreno('${e.id}')"
                            title="WhatsApp">
                        <i class="fab fa-whatsapp" style="font-size: 1.1rem; color: #fff !important;"></i>
                    </button>
                    
                    <button class="btn-micro" 
                            style="background: #475569 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick='window.duplicateEntreno(${JSON.stringify(e).replace(/'/g, "&#39;")})' 
                            title="Duplicar">
                        <i class="fas fa-clone" style="font-size: 0.9rem; color: #fff !important;"></i>
                    </button>
                    
                    <button class="btn-micro" 
                            style="background: #3B82F6 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick='window.openEditEntrenoModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' 
                            title="Editar">
                        <i class="fas fa-pen" style="font-size: 0.9rem; color: #fff !important;"></i>
                    </button>
                    
                    <button class="btn-micro" 
                            style="background: #EF4444 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick="window.deleteEntreno('${e.id}')" 
                            title="Eliminar">
                        <i class="fas fa-trash-alt" style="font-size: 0.9rem; color: #fff !important;"></i>
                    </button>
                </div>
            </div>
        </div>`;
}

function setupCreateForm() {
    const form = document.getElementById('create-entreno-form');
    if (!form) return;

    // Auto-Sync Logic (Images & Names)
    const cat = form.querySelector('[name=category]');
    const loc = form.querySelector('[name=location]');
    const img = form.querySelector('[name=image_url]');
    const name = form.querySelector('[name=name]');
    const date = form.querySelector('[name=date]');

    // Pre-fill date with today
    if (date && !date.value) {
        date.valueAsDate = new Date();
    }

    const sync = () => {
        const cVal = cat.value;
        const lVal = loc.value;

        // Smart Default Image
        const autoImg = EventService.getAutoImage(lVal, cVal, 'entreno');
        if (img && !img.value) img.value = autoImg; // Only set if empty

        // Name Sync (Optional, only if user hasn't typed a custom name)
        // if (!name.value || name.value.startsWith('ENTRENO')) {
        //     name.value = `ENTRENO ${ cVal.toUpperCase() } `;
        // }
    };

    if (cat) cat.onchange = sync;
    if (loc) loc.onchange = sync;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        try {
            // Validations
            if (!data.name) throw new Error("El nombre es obligatorio");
            if (!data.date) throw new Error("La fecha es obligatoria");

            const newEventId = await EventService.createEvent('entreno', data);

            // Notify
            if (window.NotificationService) NotificationService.showToast("Entreno Creado Correctamente", "success");

            // Reload
            window.loadAdminView('entrenos_mgmt');

        } catch (err) { alert("Error al crear: " + err.message); }
    };
}

function setupFilters() {
    const searchInput = document.getElementById('entreno-search-input');
    const monthSelect = document.getElementById('filter-month');
    const statusSelect = document.getElementById('filter-status');
    const catSelect = document.getElementById('filter-category');

    const applyFilters = () => {
        const query = searchInput?.value.toLowerCase() || '';
        const month = monthSelect?.value || 'all';
        const status = statusSelect?.value || 'all';
        const cat = catSelect?.value || 'all';

        const cards = document.querySelectorAll('#entrenos-list-container > .entreno-card-item');
        cards.forEach(card => {
            const cMonth = card.getAttribute('data-month');
            const cStatus = card.getAttribute('data-status');
            const cCat = card.getAttribute('data-category');
            const cText = card.innerText.toLowerCase();

            const matchesSearch = !query || cText.includes(query);
            const matchesMonth = month === 'all' || cMonth === month;
            const matchesStatus = status === 'all' || cStatus === status;
            const matchesCat = cat === 'all' || cCat === cat;

            card.style.display = (matchesSearch && matchesMonth && matchesStatus && matchesCat) ? 'flex' : 'none';
        });
    };

    if (searchInput) searchInput.oninput = applyFilters;
    if (monthSelect) monthSelect.onchange = applyFilters;
    if (statusSelect) statusSelect.onchange = applyFilters;
    if (catSelect) catSelect.onchange = applyFilters;
}

function formatDate(dateStr) {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// --- AUTOMATION LOGIC (Isolated) ---
window.api = window.api || {};
window.api.runAutomation = () => {
    // console.log("🤖 [AdminBot] Checking for auto-start events...");
    EventService.getAll(AppConstants.EVENT_TYPES.ENTRENO).then(evts => {
        const now = new Date();
        evts.forEach(evt => {
            if (evt.status === 'finished' || evt.status === 'cancelled') return;

            let start, end;
            try {
                const parts = (evt.time || '10:00').split('-').map(s => s.trim());
                let dateIso = evt.date;
                // Handle DD/MM/YYYY
                if (evt.date && evt.date.includes('/')) {
                    const [d, m, y] = evt.date.split('/');
                    dateIso = `${y}-${m}-${d}`;
                }
                start = new Date(`${dateIso}T${parts[0]}:00`);
                if (parts[1]) end = new Date(`${dateIso}T${parts[1]}:00`);
                else end = new Date(start.getTime() + 90 * 60000); // 90 mins default
            } catch (e) { return; }

            // 1. AUTO START
            if ((evt.status === 'open' || evt.status === 'pairing') && now >= start && now < end) {
                const players = evt.players || [];
                // Simplification: if it has players, start it
                if (players.length >= 4) {
                    console.log(`⚡ Admin Auto - Start: ${evt.name}`);
                    updateEntrenoStatus(evt.id, 'live');
                }
            }
            // 2. AUTO FINISH
            else if (evt.status === 'live' && now >= end) {
                console.log(`🏁 Admin Auto - Finish: ${evt.name}`);
                updateEntrenoStatus(evt.id, 'finished');
            }
        });
    }).catch(e => console.warn("Auto-bot error", e));
};

// --- GLOBAL EXPORTS (KEEPING EXISTING APIs) --- //

window.duplicateEntreno = async (e) => {
    if (!confirm(`¿Duplicar "${e.name}" ?`)) return;
    const copy = { ...e };
    delete copy.id;
    copy.status = 'open';
    copy.players = [];
    copy.waitlist = [];
    copy.fixed_pairs = [];

    // Attempt to set next week
    try {
        if (copy.date) {
            const d = new Date(copy.date);
            d.setDate(d.getDate() + 7);
            copy.date = d.toISOString().split('T')[0];
        }
    } catch (err) { }

    try {
        await EventService.createEvent('entreno', copy);
        window.loadAdminView('entrenos_mgmt');
    } catch (err) { alert(err.message); }
};

window.updateEntrenoStatus = async (id, newStatus) => {
    try {
        await EventService.updateEvent('entreno', id, { status: newStatus });

        // Auto-Gen Match R1 if Live
        if (newStatus === 'live' && window.MatchMakingService) {
            // Check if matches exist logic... (omitted for brevity, assume service handles or user generates)
            // Or call simple generation:
            try {
                await window.MatchMakingService.generateRound(id, 'entreno', 1);
            } catch (e) { console.log("R1 gen skipped or failed", e); }
        }

        window.loadAdminView('entrenos_mgmt');
    } catch (e) { alert("Error status: " + e.message); }
};

window.deleteEntreno = async (id) => {
    if (!confirm("⚠️ ¿Seguro que quieres eliminar este entreno permanentemente?")) return;
    await EventService.deleteEvent('entreno', id);
    window.loadAdminView('entrenos_mgmt');
};

window.openEditEntrenoModal = async (entreno) => {
    const modal = document.getElementById('admin-entreno-modal');
    const form = document.getElementById('edit-entreno-form');
    if (!modal || !form) return console.error("Edit modal misplaced");

    // Populate Form
    for (const [key, value] of Object.entries(entreno)) {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) input.value = value;
    }

    // Special Image Preview
    const preview = document.getElementById('edit-entreno-img-preview');
    if (preview && entreno.image_url) preview.src = entreno.image_url;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // Hook Sub-modules
    if (window.loadEntrenoParticipantsUI) window.loadEntrenoParticipantsUI(entreno.id);
    if (window.PairsUI) window.PairsUI.load('entreno-fixed-pairs-area', entreno.id, 'entreno');

    // Attach Submit
    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        const id = data.id;
        delete data.id;

        try {
            await EventService.updateEvent('entreno', id, data);
            alert("✅ Guardado");
            window.closeEntrenoModal();
            window.loadAdminView('entrenos_mgmt'); // Refresh list
        } catch (err) { alert("Error: " + err.message); }
    };
};

window.closeEntrenoModal = () => {
    const modal = document.getElementById('admin-entreno-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

// WhatsApp Share - Using Unified Service
window.launchWhatsAppShareEntreno = (id) => {
    console.log("🔗 launchWhatsAppShareEntreno called for:", id);
    EventService.getById('entreno', id).then(evt => {
        if (!evt) return;

        // Ensure WhatsAppService is ready (Small safety delay for Mobile)
        const triggerShare = () => {
            if (window.WhatsAppService) {
                console.log("🚀 Triggering Unified WhatsApp Service...");
                window.WhatsAppService.shareStartFromAdmin(evt);
            } else {
                console.warn("⚠️ WhatsAppService not found, retrying...");
                setTimeout(triggerShare, 500);
            }
        };

        triggerShare();
    });
};

// --- SUB-UI MANAGERS (Participants & Helpers) --- //

window.selectEntrenoImage = (url) => {
    const input = document.getElementById('edit-entreno-img-input');
    if (input) input.value = url;
};

window.loadEntrenoParticipantsUI = async (id) => {
    const list = document.getElementById('participants-list-entreno');
    if (!list) return;
    list.innerHTML = 'Loading...';

    try {
        const [event, users] = await Promise.all([
            EventService.getById('entreno', id),
            FirebaseDB.players.getAll()
        ]);

        const players = event.players || [];

        // Integración Autocomplete (si module exists)
        if (window.PlayerAutocomplete) {
            const enrolledIds = new Set(players.map(p => p.id || p.uid));
            window.PlayerAutocomplete.render(
                'autocomplete-container-entreno',
                users,
                enrolledIds,
                async (uid) => {
                    const u = users.find(x => x.id === uid);
                    if (u) {
                        await ParticipantService.addPlayer(id, 'entreno', u);
                        window.loadEntrenoParticipantsUI(id);
                    }
                },
                "🔍 Buscar jugador para añadir..."
            );
        }

        // Render List with Batseñal Button Header
        list.innerHTML = `
        <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
             <span style="font-size:0.75rem; color:#888;">${players.length} Inscritos</span>
             <button onclick="window.launchBatSignalEntreno('${id}')" class="btn-micro" style="background:rgba(255, 215, 0, 0.1); color:#ffd700; border:1px solid rgba(255, 215, 0, 0.3);">
                🦇 Batseñal
             </button>
        </div>
        ` + players.map(p => {
            const pid = p.id || p.uid;
            if (!pid) return ''; // Skip invalid

            // Level Reliability Icon
            let relIcon = '';
            if (window.LevelReliabilityService) {
                const rel = window.LevelReliabilityService.getReliability(p);
                relIcon = `<i class="fas ${rel.icon}" style="color: ${rel.color} !important; font-size: 0.75rem;" title="${rel.label}"></i>`;
            }

            return `
             <div class="player-row" style="display:flex; justify-content:space-between; align-items:center; padding: 6px; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; align-items:center; gap:10px;">
                    ${relIcon}
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:700; font-size:0.85rem;">${p.name}</span>
                        <span style="font-size:0.65rem; color:#888;">Nivel: ${p.level}</span>
                    </div>
                </div>
                <button onclick="window.removeEntrenoPlayer('${id}', '${pid}')" class="btn-delete-micro" title="Eliminar">🗑️</button>
             </div>
             `;
        }).join('');

    } catch (e) {
        console.error("Error loading participants:", e);
        list.innerHTML = '<div style="color:#ff4444; padding:10px;">Error loading players</div>';
    }
};

window.removeEntrenoPlayer = async (eid, uid) => {
    if (!confirm("¿Eliminar jugador de este entreno?")) return;
    try {
        await ParticipantService.removePlayer(eid, 'entreno', uid);
        window.loadEntrenoParticipantsUI(eid);
    } catch (e) { alert(e.message); }
};

window.launchBatSignalEntreno = async (eventId) => {
    if (!window.SmartAlertsService) return alert("⚠️ Smart Alerts no disponible");

    const btn = document.activeElement;
    const originalText = btn.innerText;
    btn.innerText = "🦇 Buscando...";
    btn.disabled = true;

    try {
        const event = await EventService.getById('entreno', eventId);
        const candidates = await window.SmartAlertsService.findSubstitutes(event);

        if (candidates.length === 0) {
            alert("No se han encontrado candidatos óptimos.");
            return;
        }

        const msg = `🦇 BATSEÑAL: Se han encontrado ${candidates.length} candidatos ideales.\n¿Enviar alertas push?`;
        if (confirm(msg)) {
            const res = await window.SmartAlertsService.sendBatSignal(candidates, event);
            alert(`🚀 Enviado a ${res.count} usuarios.`);
        }

    } catch (e) {
        console.error("Batseñal error:", e);
        alert("Error: " + e.message);
    }
    finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// --- INITIALIZATION ---
if (window.adminAutoInterval) clearInterval(window.adminAutoInterval);
if (window.api && window.api.runAutomation) {
    window.api.runAutomation();
    window.adminAutoInterval = setInterval(window.api.runAutomation, 30000);
}

console.log("✅ Admin Entrenos Module v3.5 - Splitted & Optimized");

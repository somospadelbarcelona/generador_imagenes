/**
 * admin-americanas.js
 * View Controller for Americanas Management.
 * Uses EventService, ParticipantService, PairsUI.
 */

window.AdminViews = window.AdminViews || {};

window.AdminViews.americanas_mgmt = async function () {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Cargando gestión de Americanas...</p>
        </div>`;

    // Clear previous listener if exists
    if (window.AdminViews.americanasUnsub) {
        window.AdminViews.americanasUnsub();
        window.AdminViews.americanasUnsub = null;
    }

    try {
        // Real-time Listener
        window.AdminViews.americanasUnsub = window.db.collection('americanas')
            .onSnapshot(async snapshot => {
                const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const sorted = events.sort((a, b) => new Date(b.date) - new Date(a.date));

                // 📅 Get available months for filter list
                const availableMonths = [...new Set(sorted.map(e => {
                    if (!e.date) return null;
                    if (e.date.includes('-')) return e.date.substring(0, 7); // YYYY-MM
                    if (e.date.includes('/')) {
                        const p = e.date.split('/');
                        return `${p[2]}-${p[1].padStart(2, '0')}`;
                    }
                    return null;
                }))].filter(Boolean).sort((a, b) => b.localeCompare(a));

                const monthNames = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };
                const monthOptions = availableMonths.map(m => {
                    const [y, mm] = m.split('-');
                    return `<option value="${m}">${monthNames[mm]?.toUpperCase() || 'MES'} ${y}</option>`;
                }).join('');

                const listHtml = sorted.map(e => renderAmericanaCard(e)).join('');

                // Initial Render (Structure)
                if (!document.getElementById('americanas-list-container')) {
                    content.innerHTML = `
                        <div class="dashboard-grid-enterprise" style="grid-template-columns: 400px 1fr; gap: 2.5rem;">
                            <!-- Create Form -->
                            <div class="glass-card-enterprise" style="background: var(--grad-dark); height: fit-content; padding: 2rem; position: sticky; top: var(--admin-sticky-top); z-index: 10;">
                                <h3 style="margin-bottom: 2rem; color: var(--primary); display: flex; align-items: center; gap: 10px; font-weight: 950; letter-spacing: 1px;">
                                    <span style="font-size: 1.5rem;">✨</span> CONFIGURAR AMERICANAS
                                </h3>
                                ${renderCreateAmericanaForm()}
                            </div>
                            
                            <!-- List -->
                            <div class="planning-area" id="americanas-planning-area">
                                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 20px;">
                                    <div style="flex:1;">
                                        <h3 style="margin:0; letter-spacing: 2px; font-size: 0.85rem; color: var(--text-muted); font-weight: 800;">TORNEOS EN EL RADAR</h3>
                                    </div>
                                </div>

                                <!-- 🔍 ADVANCED FILTERS BAR -->
                                <div class="filter-bar-pro" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 2rem; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); align-items: center;">
                                    <div style="position:relative;">
                                        <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3); font-size:0.8rem;"></i>
                                        <input type="text" id="americana-search-input" placeholder="Buscar por nombre..." 
                                            style="padding-left:35px; height:40px; font-size:0.8rem; width:100%; border-radius:10px; background:rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: white;">
                                    </div>
                                    <select id="filter-month" style="height:40px; border-radius:10px; background:#1a1c23; color:white; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; font-weight:700; padding:0 10px; cursor:pointer;">
                                        <option value="all">TODOS LOS MESES</option>
                                        ${monthOptions}
                                    </select>
                                    <select id="filter-status" style="height:40px; border-radius:10px; background:#1a1c23; color:white; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; font-weight:700; padding:0 10px; cursor:pointer;">
                                        <option value="all">TODOS LOS ESTADOS</option>
                                        <option value="open">🟢 ABIERTA</option>
                                        <option value="pairing">🔀 EMPAREJAMIENTO</option>
                                        <option value="live">🎾 EN JUEGO</option>
                                        <option value="finished">🏁 FINALIZADA</option>
                                        <option value="cancelled">⛔ ANULADO</option>
                                    </select>
                                    <select id="filter-category" style="height:40px; border-radius:10px; background:#1a1c23; color:white; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; font-weight:700; padding:0 10px; cursor:pointer;">
                                        <option value="all">TODAS LAS CATEGORÍAS</option>
                                        <option value="male">MASCULINA</option>
                                        <option value="female">FEMENINA</option>
                                        <option value="mixed">MIXTA</option>
                                        <option value="open">OPEN</option>
                                    </select>
                                    <button class="btn-outline-pro" onclick="loadAdminView('americanas_mgmt')" style="padding: 0 1rem; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                                        <i class="fas fa-sync-alt"></i>
                                    </button>
                                </div>

                                <div id="americanas-list-container" class="americana-scroll-list">
                                    <div class="loader"></div>
                                </div>
                            </div>
                        </div>`;
                    setupCreateAmericanaForm();

                    // Setup Search Logic
                    const searchInput = document.getElementById('americana-search-input');
                    const monthSelect = document.getElementById('filter-month');
                    const statusSelect = document.getElementById('filter-status');
                    const catSelect = document.getElementById('filter-category');

                    const applyFilters = () => {
                        const query = searchInput?.value.toLowerCase() || '';
                        const month = monthSelect?.value || 'all';
                        const status = statusSelect?.value || 'all';
                        const cat = catSelect?.value || 'all';

                        const cards = document.querySelectorAll('#americanas-list-container > .americana-card-item');
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

                // Update List Content
                const listContainer = document.getElementById('americanas-list-container');
                if (listContainer) {
                    listContainer.innerHTML = listHtml.length ? listHtml : '<div class="glass-card-enterprise text-center" style="padding:4rem; color:#666;">Sin torneos.</div>';
                }

            }, error => {
                console.error("Americanas List Error:", error);
                const listContainer = document.getElementById('americanas-list-container');
                if (listContainer) listContainer.innerHTML = `Error: ${error.message}`;
            });

    } catch (e) {
        content.innerHTML = `Error: ${e.message}`;
    }
};

function renderAmericanaCard(e) {
    const playersCount = e.players?.length || 0;
    const maxPlayers = (parseInt(e.max_courts) || 6) * 4;

    const isCancelled = e.status === 'cancelled';
    const statusLabel = e.status === 'live' ? 'EN JUEGO' : e.status === 'finished' ? 'FINALIZADA' : e.status === 'pairing' ? 'EMPAREJAMIENTO' : (isCancelled ? 'ANULADO' : 'ABIERTA');
    const statusColor = e.status === 'live' ? '#FF2D55' : e.status === 'finished' ? '#888' : e.status === 'pairing' ? '#22D3EE' : (isCancelled ? '#F43F5E' : '#00E36D');

    // Generate Month Key for Filtering (Standardized YYYY-MM)
    let eMonth = '';
    if (e.date && e.date.includes('-')) eMonth = e.date.substring(0, 7);
    else if (e.date && e.date.includes('/')) {
        const p = e.date.split('/');
        eMonth = `${p[2]}-${p[1].padStart(2, '0')}`;
    }

    return `
        <div class="glass-card-enterprise americana-card-item" 
             data-month="${eMonth}" 
             data-status="${e.status || 'open'}" 
             data-category="${e.category || 'open'}"
             style="margin-bottom: 1.2rem; display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; border-left: 4px solid ${statusColor}; background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);">
            <div style="display: flex; gap: 1.2rem; align-items: center; flex: 1;">
                <div class="americana-preview-img" style="width: 70px; height: 70px; border-radius: 12px; background: url('${(e.image_url || '').replace(/ /g, '%20')}') center/cover; border: 1px solid rgba(255,255,255,0.1); position:relative;">
                    <div style="position:absolute; bottom:-5px; right:-5px; background:${statusColor}; width:12px; height:12px; border-radius:50%; border:2px solid #1a1c23;"></div>
                </div>
                <div class="americana-info-pro" style="flex: 1;">
                    <div style="font-weight: 950; font-size: 1.2rem; color: #FFFFFF; margin-bottom: 0.3rem;">${e.name.toUpperCase()}</div>
                    <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap;">
                         <span>📅 <span style="color:#eee">${e.date}</span></span>
                         <span>🕒 <span style="color:#eee">${e.time || '18:30'}</span></span>
                         <span onclick='window.openEditAmericanaModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' style="cursor:pointer;" title="Gestionar participantes">👥 <span style="color:var(--primary); font-weight:800;">${playersCount}</span><span style="opacity:0.5">/${maxPlayers}</span></span>
                    </div>
                </div>
            </div>
            
             <!-- RIGHT ACTIONS AREA -->
            <div style="display: flex; align-items: center; gap: 12px;">
                
                <!-- Status Selector (Dropdown) -->
                <div style="position: relative; min-width: 140px;">
                    <select onchange="window.updateAmericanaStatus('${e.id}', this.value)" 
                            style="
                                width: 100%;
                                appearance: none; 
                                background: ${statusColor}15; 
                                color: #FFFFFF; 
                                border: 1px solid ${statusColor}; 
                                padding: 8px 10px; 
                                border-radius: 8px; 
                                font-weight: 800; 
                                font-size: 0.7rem; 
                                cursor: pointer; 
                                text-align: center;
                                outline: none;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            ">
                        <option value="open" ${e.status === 'open' ? 'selected' : ''}>🟢 ABIERTA</option>
                        <option value="pairing" ${e.status === 'pairing' ? 'selected' : ''}>🔀 EMPAREJAMIENTO</option>
                        <option value="live" ${e.status === 'live' ? 'selected' : ''}>🎾 EN JUEGO</option>
                        <option value="finished" ${e.status === 'finished' ? 'selected' : ''}>🏁 FINALIZADA</option>
                        <option value="cancelled" ${e.status === 'cancelled' ? 'selected' : ''}>⛔ ANULADO</option>
                    </select>
                    <i class="fas fa-chevron-down" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 0.6rem; color: #FFFFFF; pointer-events: none;"></i>
                </div>

                <!-- Action Menu -->
                <div style="display: flex; gap: 6px;">
                    <!-- [NEW] Batseñal Button (Only for Open/Live events) -->
                    ${(e.status === 'open' || e.status === 'live') ? `
                    <button class="btn-micro" 
                            style="background:rgba(255, 215, 0, 0.15); color:#FFD700; border:1px solid rgba(255, 215, 0, 0.3);" 
                            onclick='window.SmartAlertsService.openUI(${JSON.stringify(e).replace(/'/g, "&#39;")})'
                            title="Lanzar Batseñal (Buscar Sustitutos)">
                        <i class="fas fa-bullhorn"></i>
                    </button>
                    ` : ''}

                    <button class="btn-micro" 
                            style="background:rgba(37, 211, 102, 0.1); color:#25D366;" 
                            onclick='window.WhatsAppService.shareStartFromAdmin(${JSON.stringify(e).replace(/'/g, "&#39;")})'
                            title="Enviar WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn-micro" style="background:rgba(255,255,255,0.05);" onclick='window.duplicateAmericana(${JSON.stringify(e).replace(/'/g, "&#39;")})' title="Duplicar">📋</button>
                    <button class="btn-micro" style="background:rgba(255,255,255,0.05);" onclick='window.openEditAmericanaModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' title="Editar">✏️</button>
                    <button class="btn-micro" style="background:rgba(239, 68, 68, 0.1); color:#ef4444;" onclick="window.deleteAmericana('${e.id}')" title="Eliminar">🗑️</button>
                </div>

                <!-- Price/Badge -->
                <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:8px; font-size:0.75rem; font-weight:900; color:var(--primary); min-width:60px; text-align:center; border: 1px solid rgba(255,255,255,0.05);">
                    ${e.price_members || 20}€
                </div>
            </div>
        </div>`;
}

function renderCreateAmericanaForm() {
    return `
        <form id="create-americana-form" class="pro-form compact-admin-form">
            <div class="form-group">
                <label><i class="fas fa-trophy"></i> NOMBRE DE LA AMERICANA</label>
                <input type="text" name="name" class="pro-input" required placeholder="Ej: Americana Mixta...">
            </div>
            
            <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px;">
                <div class="form-group">
                    <label><i class="fas fa-calendar-alt"></i> FECHA</label>
                    <input type="date" name="date" class="pro-input" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-clock"></i> HORA</label>
                    <input type="time" name="time" value="18:30" class="pro-input" required>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label><i class="fas fa-map-marker-alt"></i> SEDE</label>
                    <select name="location" class="pro-input">
                        <option value="Barcelona Pádel el Prat">El Prat</option>
                        <option value="Delfos Cornellá">Delfos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-tags"></i> CATEGORÍA</label>
                    <select name="category" class="pro-input">
                        <option value="open">TODOS</option>
                        <option value="male">MASCULINA</option>
                        <option value="female">FEMENINA</option>
                        <option value="mixed">MIXTA</option>
                    </select>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:12px;">
                <div class="form-group">
                    <label><i class="fas fa-users"></i> MODO</label>
                    <select name="pair_mode" class="pro-input">
                        <option value="rotating">🌪️ TWISTER</option>
                        <option value="fixed">🔒 POZO (Fijos)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-image"></i> IMAGEN (URL)</label>
                    <input type="text" name="image_url" id="create-americana-img-input" class="pro-input" placeholder="https://..." value="img/americana masculina.jpg" oninput="document.getElementById('create-americana-img-preview').src=this.value; document.getElementById('create-americana-img-preview').style.display='block';">
                </div>
            </div>

            <!-- Preview -->
            <div style="margin-bottom: 15px; text-align: center;">
                <img id="create-americana-img-preview" src="img/americana masculina.jpg" style="max-height: 80px; border-radius: 8px; border: 1px solid var(--primary); display: block;" onerror="this.style.display='none'">
            </div>

            <!-- Quick Select Buttons -->
            <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 15px;">
                <button type="button" class="btn-micro" onclick="window.selectCreateAmericanaImage('img/americana masculina.jpg')" style="background: #25d366; color: black;">Masculina</button>
                <button type="button" class="btn-micro" onclick="window.selectCreateAmericanaImage('img/americana femeninas.jpg')" style="background: #ff69b4; color: black;">Femenina</button>
                <button type="button" class="btn-micro" onclick="window.selectCreateAmericanaImage('img/americana mixta.jpg')" style="background: #ccff00; color: black;">Mixta</button>
                <button type="button" class="btn-micro" onclick="window.selectCreateAmericanaImage('img/entreno todo prat.jpg')" style="background: #ffffff; color: black;">Prat</button>
                <button type="button" class="btn-micro" onclick="window.selectCreateAmericanaImage('img/entreno todo delfos.jpg')" style="background: #ffffff; color: black;">Delfos</button>
            </div>

            <button type="submit" class="btn-primary-pro" style="width:100%; margin-top:0.5rem; height: 50px; font-weight: 900; letter-spacing: 1px;">LANZAR AMERICANA 🚀</button>
        </form>
    `;
}

function setupCreateAmericanaForm() {
    const form = document.getElementById('create-americana-form');
    if (!form) return;

    const cat = form.querySelector('[name=category]');
    const loc = form.querySelector('[name=location]');
    const img = form.querySelector('[name=image_url]');
    const name = form.querySelector('[name=name]');

    const sync = () => {
        const cVal = cat.value;
        const lVal = loc.value;

        // Auto-Name
        if (!name.value || name.value.startsWith('AMERICANA')) {
            name.value = `AMERICANA ${cVal.toUpperCase()}`;
        }
    };

    window.selectCreateAmericanaImage = (url) => {
        const input = document.getElementById('create-americana-img-input');
        const preview = document.getElementById('create-americana-img-preview');
        if (input) {
            input.value = url;
            if (preview) {
                preview.src = url;
                preview.style.display = 'block';
            }
        }
    };
    cat.onchange = sync;
    loc.onchange = sync;
    sync();

    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        try {
            const newEventId = await EventService.createEvent('americana', data);

            // --- NOTIFICATION: NEW AMERICANA ---
            if (window.NotificationService && window.db) {
                try {
                    const usersSnap = await window.db.collection('players')
                        .orderBy('lastLogin', 'desc')
                        .limit(50)
                        .get();

                    if (!usersSnap.empty) {
                        usersSnap.docs.forEach(doc => {
                            window.NotificationService.sendNotificationToUser(
                                doc.id,
                                "Nueva Americana Disponible",
                                `Torneo: ${data.name} en ${data.location}. ¡Plazas limitadas!`,
                                { url: 'live', eventId: newEventId }
                            ).catch(e => { });
                        });
                    }
                } catch (e) { console.warn("Notif broadcast error", e); }
            }

            alert("✅ Americana creada y notificada");
            window.loadAdminView('americanas_mgmt');
        } catch (err) { alert(err.message); }
    };
}

window.deleteAmericana = async (id) => {
    if (!confirm("Confirmar borrado?")) return;
    await EventService.deleteEvent('americana', id);
    window.loadAdminView('americanas_mgmt');
};

window.duplicateAmericana = async (e) => {
    if (!confirm(`¿Duplicar "${e.name}"? Se creará una copia en estado ABIERTO.`)) return;
    const copy = { ...e };
    delete copy.id;
    copy.status = 'open';
    copy.players = [];
    copy.waitlist = [];
    copy.fixed_pairs = [];

    try {
        if (copy.date) {
            const current = new Date(copy.date);
            current.setDate(current.getDate() + 7);
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            copy.date = `${y}-${m}-${d}`;
        }
        await EventService.createEvent('americana', copy);
        if (window.NotificationService) NotificationService.showToast("Americana duplicada para la próxima semana", "success");
        window.loadAdminView('americanas_mgmt');
    } catch (err) { alert(err.message); }
};

window.updateAmericanaStatus = async (id, newStatus) => {
    try {
        const evt = await EventService.getById('americana', id);
        if (!evt) throw new Error("Evento no encontrado");

        await EventService.updateEvent('americana', id, { status: newStatus });

        // Broadcast notification
        if (window.NotificationService) {
            const statusMap = {
                'pairing': { title: "🔀 AMERICANA: EMPAREJAMIENTOS", body: `¡Ya puedes ver los grupos de ${evt.name}!`, url: 'control-tower' },
                'live': { title: "🎾 ¡AMERICANA EN JUEGO!", body: `El torneo ${evt.name} ha comenzado.`, url: 'live' },
                'finished': { title: "🏁 AMERICANA FINALIZADA", body: `El torneo ${evt.name} ha terminado. Mira los resultados.`, url: 'finished' }
            };
            const config = statusMap[newStatus];
            if (config) {
                await window.broadcastCommunityNotification(config.title, config.body, {
                    url: config.url,
                    eventId: id,
                    push: true
                });
            }
        }
        // View will auto-reload via snapshot listener
    } catch (e) {
        alert("Error cambiando estado: " + e.message);
    }
};

window.openEditAmericanaModal = async (e) => {
    const modal = document.getElementById('admin-americana-modal');
    const form = document.getElementById('edit-americana-form');
    if (!modal || !form) return;

    try {
        // MAP FIELDS (Robust)
        if (form.querySelector('[name=id]')) form.querySelector('[name=id]').value = e.id;
        if (form.querySelector('[name=name]')) form.querySelector('[name=name]').value = e.name || '';
        if (form.querySelector('[name=date]')) form.querySelector('[name=date]').value = e.date || '';
        if (form.querySelector('[name=time]')) form.querySelector('[name=time]').value = e.time || '18:30';
        if (form.querySelector('[name=time_end]')) form.querySelector('[name=time_end]').value = e.time_end || '';
        if (form.querySelector('[name=category]')) form.querySelector('[name=category]').value = e.category || 'open';
        if (form.querySelector('[name=location]')) form.querySelector('[name=location]').value = e.location || 'Barcelona Pádel el Prat';
        if (form.querySelector('[name=pair_mode]')) form.querySelector('[name=pair_mode]').value = e.pair_mode || 'rotating';
        if (form.querySelector('[name=image_url]')) form.querySelector('[name=image_url]').value = e.image_url || '';

        // --- DYNAMIC VISIBILITY OF FIXED PAIRS (AMERICANA) ---
        const pairModeSelect = form.querySelector('[name=pair_mode]');
        const pairsArea = document.getElementById('americana-fixed-pairs-area');

        const togglePairsArea = () => {
            if (pairsArea) {
                if (pairModeSelect.value === 'fixed') {
                    pairsArea.style.display = 'block';
                } else {
                    pairsArea.style.display = 'none';
                }
            }
        };

        if (pairModeSelect) {
            pairModeSelect.onchange = togglePairsArea; // Bind change listener
            togglePairsArea(); // Init state based on loaded value
        }

        // Preview Image
        const preview = document.getElementById('edit-americana-img-preview');
        if (preview && e.image_url) {
            preview.src = e.image_url;
            preview.style.display = 'block';
        }
    } catch (err) { console.error("Error mapping Americana fields", err); }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // ASYNC SUBMIT HANDLER
    form.onsubmit = async (evt) => {
        evt.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        const id = data.id;
        delete data.id;

        try {
            // Convert numbers
            if (data.max_courts) data.max_courts = parseInt(data.max_courts);
            if (data.price_members) data.price_members = parseFloat(data.price_members);
            if (data.price_external) data.price_external = parseFloat(data.price_external);

            await EventService.updateEvent('americana', id, data);
            alert("✅ Americana actualizada");

            // --- NOTIFICATION: UPDATE (ENROLLED) ---
            if (window.NotificationService && (data.status === 'live' || data.date || data.time)) {
                try {
                    const updatedEvt = await EventService.getById('americana', id);
                    if (updatedEvt && updatedEvt.players && updatedEvt.players.length > 0) {
                        const isLive = data.status === 'live';
                        const title = isLive ? "¡AMERICANA EN JUEGO!" : "Actualización de Torneo";
                        const msg = isLive
                            ? `${updatedEvt.name} ha comenzado. ¡Suerte!`
                            : `Cambios en ${updatedEvt.name}. Revisa la hora/sede.`;

                        updatedEvt.players.forEach(p => {
                            const pid = p.uid || p.id;
                            window.NotificationService.sendNotificationToUser(pid, title, msg, { url: 'live', eventId: id }).catch(e => { });
                        });
                    }
                } catch (e) { console.warn("Update notif error", e); }
            }

            window.loadAdminView('americanas_mgmt');
            window.closeAmericanaModal();

        } catch (err) {
            alert("Error al actualizar: " + err.message);
        }
    };

    await window.loadAmericanaParticipantsUI(e.id);
    if (window.PairsUI) await window.PairsUI.load('americana-fixed-pairs-area', e.id, 'americana');
};

window.closeAmericanaModal = () => {
    const modal = document.getElementById('admin-americana-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        // Clear preview
        const preview = document.getElementById('edit-americana-img-preview');
        if (preview) preview.style.display = 'none';
    }
};


// PARTICIPANTS UI (Dedicated wrapper around Service)
window.loadAmericanaParticipantsUI = async (id) => {
    const list = document.getElementById('participants-list'); // Existing HTML ID
    const select = document.getElementById('add-player-select');
    const btn = document.getElementById('btn-add-player');

    if (!list) return;

    const [event, users] = await Promise.all([
        EventService.getById('americana', id),
        FirebaseDB.players.getAll()
    ]);

    // AUTO-REPAIR: Fix players without IDs
    let needsRepair = false;
    const repairedPlayers = (event.players || []).map(player => {
        const playerId = player.id || player.uid || player.player_id;
        if (!playerId && player.name) {
            const foundPlayer = users.find(u =>
                u.name.toLowerCase().trim() === player.name.toLowerCase().trim()
            );
            if (foundPlayer) {
                console.log(`🔧 Auto-repair: ${player.name} -> ${foundPlayer.id}`);
                needsRepair = true;
                return {
                    ...player,
                    id: foundPlayer.id,
                    uid: foundPlayer.id
                };
            }
        }
        return player;
    });

    // Save repaired data
    if (needsRepair) {
        await EventService.updateEvent('americana', id, { players: repairedPlayers });
        console.log('✅ IDs reparados automáticamente');
    }

    // Use repaired data for rendering
    const finalPlayers = needsRepair ? repairedPlayers : (event.players || []);

    // NEW: Render Autocomplete
    if (window.PlayerAutocomplete) {
        const enrolledIds = new Set(finalPlayers.map(p => p.id || p.uid));
        window.PlayerAutocomplete.render(
            'autocomplete-container-americana',
            users,
            enrolledIds,
            async (uid) => {
                try {
                    const user = users.find(u => u.id === uid);
                    if (!user) return;
                    await ParticipantService.addPlayer(id, 'americana', user);
                    window.loadAmericanaParticipantsUI(id);
                } catch (e) { alert(e.message); }
            },
            "🔍 Buscar jugador para añadir..."
        );
    } else {
        // Fallback or Error if component missing
        console.warn("PlayerAutocomplete not found");
    }

    // Render List Header with Batseñal
    list.innerHTML = `
        <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:#888;">${finalPlayers.length} Inscritos</span>
            <button onclick="window.launchBatSignal('${id}')" class="btn-micro" style="background:rgba(255, 215, 0, 0.1); color:#ffd700; border:1px solid rgba(255, 215, 0, 0.3);">
                🦇 Batseñal
            </button>
        </div>
    ` + finalPlayers.map((p, i) => {
        const playerId = p.id || p.uid || p.player_id || '';
        if (!playerId) {
            console.warn('Player without ID:', p);
            return `
                <div class="player-row">
                    <span>${p.name || 'Sin nombre'}</span>
                    <button disabled style="opacity:0.5" title="No se puede eliminar: falta ID">🗑️</button>
                </div>
            `;
        }
        return `
            <div class="player-row" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    ${(() => {
                if (window.LevelReliabilityService) {
                    const rel = window.LevelReliabilityService.getReliability(p);
                    return `<i class="fas ${rel.icon}" style="color: ${rel.color} !important; font-size: 0.75rem;" title="${rel.label}"></i>`;
                }
                return '';
            })()}
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:700;">${p.name || 'JUGADOR'}</span>
                        <span style="font-size:0.65rem; color:#888;">${p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                </div>
                <button onclick="window.removeAmericanaPlayer('${id}', '${playerId}')" class="btn-delete-micro">🗑️</button>
            </div>
        `;
    }).join('');
};

window.launchBatSignal = async (eventId) => {
    if (!window.SmartAlertsService) return alert("⚠️ Servicio Smart Alerts no disponible");

    // 1. Get Event
    const event = await EventService.getById('americana', eventId);
    if (!event) return;

    // 2. Find Candidates
    const btn = document.activeElement;
    const oldText = btn.innerHTML;
    btn.innerHTML = '🦇 Buscando...';
    btn.disabled = true;

    try {
        const candidates = await window.SmartAlertsService.findSubstitutes(event);

        if (candidates.length === 0) {
            alert("🦇 No se encontraron candidatos adecuados (filtro nivel/género).");
            btn.innerHTML = oldText;
            btn.disabled = false;
            return;
        }

        const confirmMsg = `🦇 BATSEÑAL ENCONTRADA\n\nHemos detectado ${candidates.length} jugadores ideales:\n` +
            candidates.slice(0, 5).map(u => `- ${u.name} (${u.level})`).join('\n') +
            (candidates.length > 5 ? `\n...y ${candidates.length - 5} más.` : '') +
            `\n\n¿Enviar alerta prioritaria a estos ${candidates.length} usuarios?`;

        if (confirm(confirmMsg)) {
            const res = await window.SmartAlertsService.sendBatSignal(candidates, event);
            if (res.success) {
                alert(`🚀 Alertas enviadas a ${res.count} usuarios.`);
            } else {
                alert("❌ Error enviando alertas.");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Error en Batseñal: " + e.message);
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
};

window.removeAmericanaPlayer = async (eid, uid) => {
    if (!uid || uid === 'undefined' || uid === 'null') {
        alert('❌ Error: No se puede eliminar este jugador (ID inválido). Por favor contacta al administrador.');
        console.error('Invalid player ID:', uid);
        return;
    }

    if (!confirm("Borrar jugador? Si hay partidos creados, se sustituirá por VACANTE.")) return;

    try {
        // 1. Safe Name Fetch (Typeless comparison)
        const event = await EventService.getById('americana', eid);
        const player = (event.players || []).find(p => String(p.id || p.uid) === String(uid));
        const oldName = player ? player.name : '';
        console.log(`🗑️ REMOVE AMERICANA PLAYER: ${uid}, Name=${oldName}`);

        // 2. Remove from List
        const res = await ParticipantService.removePlayer(eid, 'americana', uid);

        if (res.promoted) {
            alert(`♻️ Sustitución automática: ${oldName} -> ${res.promoted.name}`);
        } else {
            alert(`ℹ️ Jugador eliminado.`);
        }

        window.loadAmericanaParticipantsUI(eid);
        if (window.PairsUI) window.PairsUI.load('americana-fixed-pairs-area', eid, 'americana');
    } catch (e) {
        alert("Error al borrar: " + e.message);
    }
};

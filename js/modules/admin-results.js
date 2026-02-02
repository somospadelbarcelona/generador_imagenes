/**
 * admin-results.js
 * Unified Controller for Results Management (Americanas & Entrenos).
 * Replaces old admin-matches.js and embedded entreno results logic.
 */

window.AdminViews = window.AdminViews || {};

window.AdminController = {
    currentRound: 1,
    activeEvent: null,
    activeTab: 'matches', // 'matches', 'standings', 'stats'
    matchesBuffer: []
};

/**
 * Generic Entry Point
 * @param {string} forcedType - Optional, forces 'americana' or 'entreno' context
 */
window.loadResultsView = async function (forcedType = null) {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Control de Resultados';
    content.innerHTML = '<div class="loader"></div>';

    // 1. Fetch Candidates (Live or Open)
    // We fetch ALL events if no type forced, or specific.
    // For simplicity, let's fetch both and merge, OR use the forcedType to decide.

    let events = [];
    if (!forcedType || forcedType === 'entreno') {
        const ent = await EventService.getAll('entreno');
        events.push(...ent.map(e => ({ ...e, type: 'entreno' })));
    }
    if (!forcedType || forcedType === 'americana') {
        const am = await EventService.getAll('americana');
        events.push(...am.map(e => ({ ...e, type: 'americana' })));
    }

    // Sort: Live first, then Date
    events.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (a.status !== 'live' && b.status === 'live') return 1;
        return new Date(b.date) - new Date(a.date);
    });

    let activeEvent = events[0];
    if (window.selectedEventId) {
        activeEvent = events.find(e => e.id === window.selectedEventId) || activeEvent;
    }

    if (!activeEvent) {
        content.innerHTML = `<div class="glass-card-enterprise text-center" style="padding: 4rem;"><p>No hay eventos activos.</p></div>`;
        return;
    }

    window.AdminController.activeEvent = activeEvent;

    // 2. Render UI
    renderResultsFrame(content, activeEvent, events);

    // 3. Load Matches
    renderMatchesGrid(activeEvent.id, activeEvent.type, window.AdminController.currentRound);

    // 4. REMOVED: statusInterval - Now using Real-Time onSnapshot listeners
    // The Smart DOM Patching handles all updates automatically
    if (window.AdminController.statusInterval) {
        clearInterval(window.AdminController.statusInterval);
        window.AdminController.statusInterval = null;
    }

};

// Aliases for Sidebar access
window.AdminViews.americanas_results = () => window.loadResultsView('americana');
window.AdminViews.entrenos_results = () => window.loadResultsView('entreno');
window.AdminViews.matches = () => window.loadResultsView(); // Generic fallback

// Helper: Render Frame
// Helper: Render Frame
function renderResultsFrame(container, activeEvent, allEvents) {
    const isEntreno = activeEvent.type === 'entreno';
    const color = isEntreno ? '#FF2D55' : '#CCFF00';

    // --- REAL-TIME HEADER UDPATES ---
    // If we have an active listener for the event doc, clear it first
    if (window.AdminController.eventUnsubscribe) {
        window.AdminController.eventUnsubscribe();
    }

    // Determine collection
    const collectionName = isEntreno ? 'entrenos' : 'americanas';

    // Setup Listener
    window.AdminController.eventUnsubscribe = window.db.collection(collectionName).doc(activeEvent.id)
        .onSnapshot(doc => {
            if (doc.exists) {
                const newData = doc.data();
                // Update local ref
                window.AdminController.activeEvent = { ...activeEvent, ...newData };

                // Update Badge UI directly
                const badge = document.getElementById('event-status-badge');
                if (badge) {
                    const status = newData.status; // 'open', 'live', 'finished'
                    const isLive = status === 'live';
                    // Determine color based on event type AND status
                    // If Entreno: Red/Live, or defined color. 
                    // Let's keep the logic simple:
                    const baseColor = isEntreno ? '#FF2D55' : '#CCFF00';

                    const badgeColor = isLive ? '#E11D48' : baseColor;
                    const badgeBg = isLive ? '#E11D48' : 'transparent';
                    const badgeShadow = isLive ? '0 0 15px #E11D48' : 'none';
                    const badgeText = (isEntreno ? 'CONTROL DE CLASE/ENTRENO' : 'CONTROL DE TORNEO') + ' | ' + status.toUpperCase();

                    badge.style.color = isLive ? '#fff' : baseColor;
                    badge.style.background = isLive ? '#E11D48' : 'transparent'; // Fix: transparent for non-live?
                    // Actually, let's just reset the whole style string or innerHTML
                    badge.innerHTML = badgeText;
                    badge.style.boxShadow = badgeShadow;
                    // Optional: Update title if changed
                    const titleEl = document.getElementById('event-title-header');
                    if (titleEl && newData.name) titleEl.innerText = newData.name;
                }
            }
        });

    container.innerHTML = `
        <div class="dashboard-header-pro" style="margin-bottom: 2rem; background: linear-gradient(135deg, #0a0a0a 0%, #111 100%); padding: 2.5rem; border-radius: 24px;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="font-size: 2.5rem; text-shadow: 0 0 20px ${color}40;">${isEntreno ? '🏋️' : '🏆'}</div>
                    <div>
                        <h1 id="event-title-header" style="margin:0; color: white; font-size: 2.2rem; font-weight: 900;">${activeEvent.name}</h1>
                        <span id="event-status-badge" style="color: ${activeEvent.status === 'live' ? '#fff' : color}; background: ${activeEvent.status === 'live' ? '#E11D48' : 'transparent'}; padding: 2px 10px; border-radius: 4px; font-weight: 800; letter-spacing: 2px; font-size: 0.8rem; text-transform: uppercase; box-shadow: ${activeEvent.status === 'live' ? '0 0 15px #E11D48' : 'none'};">
                            ${isEntreno ? 'CONTROL DE CLASE/ENTRENO' : 'CONTROL DE TORNEO'} | ${activeEvent.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-primary-pro" onclick="window.Actions.generateRound()" style="background: #3498db; color:white;">⚡ GENERAR RONDA</button>
                    <button class="btn-primary-pro" onclick="window.Actions.simulateRound()" style="background: #e67e22; color:white;">🎲 SIMULACIÓN</button>
                    <button class="btn-primary-pro" onclick="window.Actions.finishEvent()" style="background: #27ae60; color:white;">🏁 FINALIZAR</button>
                    <button class="btn-primary-pro" onclick="window.Actions.recalculateLevels()" style="background: #9b59b6; color:white;">⚖️ RECALCULAR NIVELES</button>
                    <button class="btn-primary-pro" onclick="window.Actions.resetEvent()" style="background: #e74c3c; color:white;">🗑️ REINICIAR</button>
                </div>
            </div>

            <!-- FILTERS & TABS -->
             <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                 <div style="display: flex; gap: 10px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 16px;">
                    <button onclick="window.setTab('matches')" class="tab-btn active" id="tab-matches" style="flex:1; border:none; padding:10px; border-radius:10px; font-weight:900; background:var(--primary); color:black;">PARTIDOS</button>
                    <button onclick="window.setTab('standings')" class="tab-btn" id="tab-standings" style="flex:1; border:none; padding:10px; border-radius:10px; font-weight:900; background:transparent; color:white;">POSICIONES</button>
                    <button onclick="window.setTab('stats')" class="tab-btn" id="tab-stats" style="flex:1; border:none; padding:10px; border-radius:10px; font-weight:900; background:transparent; color:white;">ESTADÍSTICAS</button>
                 </div>
                 
                 <div style="display: flex; gap: 1rem;">
                     <div style="flex:1;">
                        <select id="event-selector" class="pro-input" onchange="window.locationSelectEvent(this.value)" style="width:100%;">
                            ${allEvents.map(e => `<option value="${e.id}" ${e.id === activeEvent.id ? 'selected' : ''}>[${e.type.substring(0, 3).toUpperCase()}] ${e.name}</option>`).join('')}
                        </select>
                     </div>
                     <div style="display:flex; gap:10px;">
                        <input type="number" id="quick-courts" value="${activeEvent.max_courts || 4}" class="pro-input" style="width:60px; text-align:center;">
                        <button class="btn-outline-pro" onclick="window.Actions.updateCourts()">💾</button>
                    </div>
                 </div>
             </div>
             
             <!-- ROUND TABS -->
             <div id="round-tabs-container" style="display: flex; gap: 1rem; margin-top: 2rem; overflow-x: auto; padding-bottom: 5px;">
                ${[1, 2, 3, 4, 5, 6].map(r => `
                    <button class="btn-round-tab ${window.AdminController.currentRound === r ? 'active' : ''}" 
                            onclick="window.Actions.switchRound(${r})">
                        RONDA ${r}
                    </button>`).join('')}
             </div>
        </div>

        <div id="results-main-layout" style="display: grid; grid-template-columns: 3fr 1fr; gap: 2rem;">
            <div id="matches-grid"><div class="loader"></div></div>
            <div id="sidebar-container" class="glass-card-enterprise">
                <h3 style="margin:0 0 1rem 0; color:white; font-size:1rem;">CLASIFICACIÓN</h3>
                <div id="standings-list"></div>
            </div>
        </div>
    `;
}

async function renderMatchesGrid(eventId, type, round) {
    const container = document.getElementById('matches-grid');
    if (!container) return;

    // Clear Listeners
    if (window.AdminController.matchesUnsubscribers) {
        window.AdminController.matchesUnsubscribers.forEach(u => u && u());
    }
    window.AdminController.matchesUnsubscribers = [];
    if (window.AdminController.matchesUnsubscribe) {
        window.AdminController.matchesUnsubscribe();
        window.AdminController.matchesUnsubscribe = null;
    }

    // Initial Loader only if empty
    if (!container.innerHTML.includes('match-card') && !container.innerHTML.includes('smart-grid')) {
        container.innerHTML = '<div class="loader"></div>';
    }

    window.AdminController.matchesBuffer = [];

    const updateUI = () => {
        const gridContainer = document.getElementById('matches-grid');
        if (!gridContainer) return;

        if (window.AdminController.activeTab === 'standings') {
            gridContainer.innerHTML = '<div class="glass-card-enterprise" style="padding:2rem;">' + document.getElementById('standings-list').innerHTML.replace(/display:flex/g, 'display:grid; grid-template-columns: 1fr auto; font-size: 1.2rem; padding: 15px;') + '</div>';
            return;
        }

        if (window.AdminController.activeTab === 'stats') {
            renderFullStatsView(gridContainer, window.AdminController.matchesBuffer);
            return;
        }

        const roundMatches = window.AdminController.matchesBuffer
            .filter(m => (m.round == round) || (!m.round && round == 1))
            .sort((a, b) => a.court - b.court);

        if (roundMatches.length === 0) {
            container.innerHTML = `
            <div style="text-align:center; padding: 4rem; color: #666;">
                <h3>Sin partidos en Ronda ${round}</h3>
                <p>Genera los cruces o comprueba otra ronda.</p>
            </div>`;
            return;
        }

        // Setup Grid Container
        let grid = container.querySelector('.smart-grid');
        if (!grid) {
            container.innerHTML = `<div class="smart-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; animation: fadeIn 0.3s;"></div>`;
            grid = container.querySelector('.smart-grid');
        }

        const validIds = new Set();

        roundMatches.forEach(match => {
            validIds.add(match.id);
            const cardId = `card-${match.id}`;
            let el = document.getElementById(cardId);

            if (el) {
                // --- SMART UPDATE ---
                // 1. Status
                const statusEl = document.getElementById(`status-${match.id}`);
                const isFinished = match.status === 'finished';
                const newStatusHTML = isFinished ?
                    '<span style="font-size:0.6rem; background:#00ff64; color:black; padding:2px 6px; border-radius:4px; font-weight:800;">FINALIZADO</span>' :
                    '<span style="font-size:0.6rem; color:#ff9f43; animation: blink 1s infinite;">EN JUEGO</span>';

                if (statusEl && statusEl.innerHTML !== newStatusHTML) {
                    statusEl.innerHTML = newStatusHTML;
                    el.style.border = isFinished ? '1px solid #333' : '1px solid var(--primary-glow)';

                    // Update Action Button too
                    const btnFinish = document.getElementById(`btn-finish-${match.id}`);
                    if (btnFinish) {
                        btnFinish.innerText = isFinished ? '✓ RESULTADO CONFIRMADO' : 'ACEPTAR RESULTADO';
                        btnFinish.style.background = isFinished ? 'rgba(255,255,255,0.05)' : 'var(--primary)';
                        btnFinish.style.color = isFinished ? '#666' : 'black';
                        btnFinish.setAttribute('onclick', `window.Actions.finishMatch('${match.id}', ${!isFinished})`);
                    }
                }

                // 2. Scores (Update Spans)
                const sA_el = document.getElementById(`score-a-${match.id}`);
                const sB_el = document.getElementById(`score-b-${match.id}`);
                const pA_el = document.getElementById(`score-primary-a-${match.id}`);
                const pB_el = document.getElementById(`score-primary-b-${match.id}`);

                const scoreA = match.score_a || 0;
                const scoreB = match.score_b || 0;

                if (sA_el && sA_el.innerText != scoreA) sA_el.innerText = scoreA;
                if (sB_el && sB_el.innerText != scoreB) sB_el.innerText = scoreB;
                if (pA_el && pA_el.innerText != scoreA) pA_el.innerText = scoreA;
                if (pB_el && pB_el.innerText != scoreB) pB_el.innerText = scoreB;

                // 3. Names (Update names if they changed)
                const nameAEl = document.getElementById(`name-a-${match.id}`);
                const nameBEl = document.getElementById(`name-b-${match.id}`);
                const teamAStr = match.teamA || (Array.isArray(match.team_a_names) ? match.team_a_names.join(' / ') : match.team_a_names);
                const teamBStr = match.teamB || (Array.isArray(match.team_b_names) ? match.team_b_names.join(' / ') : match.team_b_names);

                if (nameAEl && nameAEl.innerText !== teamAStr) nameAEl.innerText = teamAStr;
                if (nameBEl && nameBEl.innerText !== teamBStr) nameBEl.innerText = teamBStr;

            } else {
                // --- INSERT ---
                grid.insertAdjacentHTML('beforeend', renderMatchCard(match));
            }
        });

        // Remove old
        grid.querySelectorAll('.match-card').forEach(card => {
            const id = card.id.replace('card-', '');
            if (!validIds.has(id)) card.remove();
        });

        renderStandingsInternal(window.AdminController.matchesBuffer);
    };

    const primaryColl = (type === 'entreno') ? 'entrenos_matches' : 'matches';

    try {
        const sub = window.db.collection(primaryColl)
            .where('americana_id', '==', eventId)
            .onSnapshot(snap => {
                window.AdminController.matchesBuffer = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                updateUI();
            });

        window.AdminController.matchesUnsubscribers = [sub];
    } catch (e) {
        container.innerHTML = `Error: ${e.message}`;
    }
}

function renderMatchCard(match) {
    const isFinished = match.status === 'finished';
    const sA = match.score_a || 0;
    const sB = match.score_b || 0;

    const formatNameSimple = (fullName) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length <= 2) return fullName;
        return `${parts[0]} ${parts[1]}`;
    };

    const formatTeam = (names) => {
        if (!names) return 'Equipo';
        if (Array.isArray(names)) return names.map(n => formatNameSimple(n)).join(' / ');
        if (typeof names === 'string' && names.includes(' / ')) {
            return names.split(' / ').map(n => formatNameSimple(n)).join(' / ');
        }
        return formatNameSimple(names);
    };

    const teamA = formatTeam(match.teamA || match.team_a_names);
    const teamB = formatTeam(match.teamB || match.team_b_names);

    const scoreControls = `
        <div style="display: flex; gap: 15px; justify-content: center; align-items: center; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 16px; margin-top: 15px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <button onclick="window.Actions.adjustScore('${match.id}', 'score_a', -1)" style="width:32px; height:32px; border-radius:50%; border:1px solid #444; background:#222; color:white; font-weight:900;">-</button>
                <span id="score-a-${match.id}" style="width: 30px; text-align: center; font-weight: 950; font-size: 1.4rem; color: var(--primary);">${sA}</span>
                <button onclick="window.Actions.adjustScore('${match.id}', 'score_a', 1)" style="width:32px; height:32px; border-radius:50%; border:1px solid var(--primary); background:#222; color:var(--primary); font-weight:900;">+</button>
            </div>
            <div style="font-weight: 900; color: rgba(255,255,255,0.1); font-size: 1.5rem;">VS</div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button onclick="window.Actions.adjustScore('${match.id}', 'score_b', -1)" style="width:32px; height:32px; border-radius:50%; border:1px solid #444; background:#222; color:white; font-weight:900;">-</button>
                <span id="score-b-${match.id}" style="width: 30px; text-align: center; font-weight: 950; font-size: 1.4rem; color: var(--primary);">${sB}</span>
                <button onclick="window.Actions.adjustScore('${match.id}', 'score_b', 1)" style="width:32px; height:32px; border-radius:50%; border:1px solid var(--primary); background:#222; color:var(--primary); font-weight:900;">+</button>
            </div>
        </div>
    `;

    return `
        <div id="card-${match.id}" class="glass-card-enterprise match-card" style="padding:0; overflow:hidden; border: 1px solid ${isFinished ? '#333' : 'var(--primary-glow)'}; transition: all 0.3s; position:relative;">
            <div style="background: rgba(255,255,255,0.03); padding: 12px 20px; display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">
                <span style="font-weight:900; color:var(--primary); font-size:0.75rem; letter-spacing:1px;">PISTA ${match.court}</span>
                <div id="status-${match.id}">
                    ${isFinished ?
            '<span style="font-size:0.65rem; background:#00ff64; color:black; padding:3px 8px; border-radius:6px; font-weight:950;">FINALIZADO</span>' :
            '<span style="font-size:0.65rem; color:#CCFF00; font-weight:900; text-shadow:0 0 10px #CCFF0040;">⚡ EN JUEGO</span>'}
                </div>
            </div>
            <div style="padding: 1.8rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isFinished && sA > sB ? '<i class="fas fa-trophy" style="color:var(--primary); font-size:0.8rem;"></i>' : ''}
                        <span id="name-a-${match.id}" style="font-weight:800; color:${isFinished && sA > sB ? 'white' : 'white'}; font-size:0.95rem; ${isFinished && sA > sB ? 'border-bottom: 3px solid var(--primary); padding-bottom: 2px;' : ''}">${teamA}</span>
                    </div>
                    <span id="score-primary-a-${match.id}" style="font-weight:950; font-size:1.4rem; color:${isFinished && sA > sB ? 'var(--primary)' : 'rgba(255,255,255,0.3)'};">${sA}</span>
                </div>
                <div style="height:1px; background:rgba(255,255,255,0.05); margin-bottom:12px;"></div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isFinished && sB > sA ? '<i class="fas fa-trophy" style="color:var(--primary); font-size:0.8rem;"></i>' : ''}
                        <span id="name-b-${match.id}" style="font-weight:800; color:${isFinished && sB > sA ? 'white' : 'white'}; font-size:0.95rem; ${isFinished && sB > sA ? 'border-bottom: 3px solid var(--primary); padding-bottom: 2px;' : ''}">${teamB}</span>
                    </div>
                    <span id="score-primary-b-${match.id}" style="font-weight:950; font-size:1.4rem; color:${isFinished && sB > sA ? 'var(--primary)' : 'rgba(255,255,255,0.3)'};">${sB}</span>
                </div>
                
                ${scoreControls}
                
                <div style="margin-top:20px; display:flex; flex-direction:column; gap:8px;">
                     <button id="btn-finish-${match.id}" class="btn-primary-pro" onclick="${isFinished ? '' : `window.Actions.finishMatch('${match.id}', true)`}" 
                             style="width:100%; padding:12px; font-size:0.85rem; font-weight:900; background:${isFinished ? 'rgba(0,255,100,0.1)' : 'var(--primary)'}; color:${isFinished ? '#00ff64' : 'black'}; border:none; cursor:${isFinished ? 'default' : 'pointer'};">
                        ${isFinished ? '✓ RESULTADO CONFIRMADO' : 'ACEPTAR RESULTADO'}
                     </button>
                     ${isFinished ? `
                        <button class="btn-outline-pro" onclick="window.Actions.finishMatch('${match.id}', false)" 
                                style="width:100%; padding:10px; font-size:0.8rem; font-weight:900; color:#CCFF00; border:1px solid #CCFF00; background:transparent;">
                            <i class="fas fa-undo"></i> REABRIR / EDITAR MARCADO
                        </button>
                     ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderStandingsInternal(matches) {
    const container = document.getElementById('standings-list');
    if (!container) return;

    const stats = {};
    const evt = window.AdminController.activeEvent;
    const isRotating = evt && evt.pair_mode === 'rotating';

    matches.forEach(m => {
        if (m.status === 'finished') {
            const processTeams = (namesGroup, score) => {
                // Determine if we should treat names as separate individuals or a single pair
                let namesToProcess = [];
                if (Array.isArray(namesGroup)) {
                    if (isRotating) namesToProcess = namesGroup; // Process each player
                    else namesToProcess = [namesGroup.join(' / ')]; // Process as one pair
                } else if (typeof namesGroup === 'string') {
                    namesToProcess = [namesGroup];
                }

                namesToProcess.forEach(name => {
                    if (!name || name.includes('VACANTE')) return;
                    if (!stats[name]) stats[name] = { played: 0, games: 0, wins: 0 };
                    stats[name].played++;
                    stats[name].games += parseInt(score || 0);
                });
            };

            processTeams(m.team_a_names, m.score_a);
            processTeams(m.team_b_names, m.score_b);
        }
    });

    const sorted = Object.entries(stats)
        .map(([k, v]) => ({ name: k, ...v }))
        .sort((a, b) => b.games - a.games);

    container.innerHTML = sorted.map((s, i) => `
        <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                <span style="color:var(--primary); font-weight:900; min-width:25px;">#${i + 1}</span> 
                <span style="color:white; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</span>
            </div>
            <div style="color:white; font-weight:700; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px;">${s.games}</div>
        </div>
    `).join('') || '<div style="padding:1rem; opacity:0.5; text-align:center;">Esperando resultados...</div>';
}


// --- ACTIONS EXPOSED TO WINDOW ---
window.Actions = {
    async generateRound() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;

        // Confirmation?
        // RESTRICTION: Specific Status Check
        if (evt.status !== 'live' && evt.status !== 'pairing') {
            if (evt.status === 'open') {
                alert("⛔ EL EVENTO ESTÁ 'ABIERTO'\n\nPara empezar a generar partidos, cambia el estado a 'EN JUEGO' o 'EMPAREJAMIENTO'.");
            } else if (evt.status === 'finished') {
                alert("⛔ EL EVENTO ESTÁ 'FINALIZADO'\n\nYa no se pueden generar más rondas.");
            } else {
                alert(`⛔ Estado actual: ${evt.status.toUpperCase()}\n\nEl evento debe estar 'EN JUEGO' o 'EMPAREJAMIENTO' para generar rondas.`);
            }
            return;
        }

        try {
            await MatchMakingService.generateRound(evt.id, evt.type, round);
            window.loadResultsView(evt.type); // Refresh
        } catch (e) { alert(e.message); }
    },

    async simulateRound() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;

        if (!evt.is_simulation && !confirm("Simular resultados aleatorios?")) return;

        try {
            await MatchMakingService.simulateRound(evt.id, round, evt.type);

            // IF SIMULATION MODE: Auto-chain to next rounds until R6
            if (evt.is_simulation && round < 6) {
                console.log(`🤖 Auto-Chaining Simulation: Round ${round} -> ${round + 1}`);
                const nextRound = round + 1;
                await MatchMakingService.generateRound(evt.id, evt.type, nextRound);
                await MatchMakingService.simulateRound(evt.id, nextRound, evt.type);

                // Recursively call for next round (or just loop)
                // For simplicity, we can just reload and the finishMatch logic will handle it if we triggered it.
                // But better to do it here explicitly for a "One-Click" feel.
                for (let r = nextRound + 1; r <= 6; r++) {
                    await MatchMakingService.generateRound(evt.id, evt.type, r);
                    await MatchMakingService.simulateRound(evt.id, r, evt.type);
                }
                window.Actions.switchRound(6);
            } else {
                window.loadResultsView(evt.type);
            }
        } catch (e) { alert(e.message); }
    },

    async updateScore(matchId, field, value) {
        const evt = window.AdminController.activeEvent;
        const collection = (evt && evt.type === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
        await collection.update(matchId, { [field]: parseInt(value) });
    },

    async adjustScore(matchId, field, delta) {
        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (!match) return;

        // CHECK CASCADE
        await this.checkAndPurge(matchId);

        let newVal = (match[field] || 0) + delta;
        if (newVal < 0) newVal = 0;
        await this.updateScore(matchId, field, newVal);
    },

    async checkAndPurge(matchId) {
        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (!match) return;

        const maxRound = Math.max(...window.AdminController.matchesBuffer.map(m => parseInt(m.round) || 1));
        if (match.round < maxRound) {
            if (confirm(`⚠️ ATENCIÓN: Estás editando la Ronda ${match.round}, pero ya existen rondas posteriores (hasta R${maxRound}).\n\nLos cruces actuales de las rondas R${match.round + 1} a R${maxRound} ya no son válidos con este cambio.\n\n¿Deseas BORRAR las rondas posteriores y regenerar el torneo desde aquí?`)) {
                const evt = window.AdminController.activeEvent;
                const currentRoundNum = parseInt(match.round);

                console.log(`🧹 Purging rounds > ${currentRoundNum} for ${evt.id}`);
                await MatchMakingService.purgeSubsequentRounds(evt.id, currentRoundNum, evt.type);

                // --- AUTO REGENERATE FOR SIMULATIONS ---
                if (evt.is_simulation) {
                    console.log("🤖 [Simulation] Auto-regenerating chain after purge...");
                    // Small delay to let DB settle
                    setTimeout(async () => {
                        for (let r = currentRoundNum + 1; r <= 6; r++) {
                            console.log(`🤖 Regenerating R${r}...`);
                            try {
                                await MatchMakingService.generateRound(evt.id, evt.type, r);
                                await MatchMakingService.simulateRound(evt.id, r, evt.type);
                            } catch (err) {
                                console.error(`Error regenerating R${r}:`, err);
                                break;
                            }
                        }
                        window.Actions.switchRound(6);
                        window.loadResultsView(evt.type);
                    }, 500);
                } else {
                    window.loadResultsView(evt.type);
                }
            }
        }
    },

    async finishMatch(matchId, isFinish) {
        alert(`${isFinish ? '🏁 Finalizando' : '🔓 Reabriendo'} partido: ${matchId}`);
        const evt = window.AdminController.activeEvent;
        const collection = (evt && evt.type === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
        const newStatus = isFinish ? 'finished' : 'live';

        // CHECK CASCADE ON REOPEN
        if (!isFinish) {
            alert("🧹 Verificando cascada de purga...");
            await this.checkAndPurge(matchId);
        }

        try {
            await collection.update(matchId, { status: newStatus });

            // --- NEW: AJUSTE DE NIVEL AUTOMÁTICO Y FIABILIDAD ---
            if (isFinish) {
                const updatedMatch = window.AdminController.matchesBuffer.find(m => m.id === matchId);
                if (updatedMatch) {
                    // 1. Ajuste de nivel (Pro Smart)
                    if (window.LevelAdjustmentService) {
                        LevelAdjustmentService.processMatchResults(updatedMatch).catch(e => {
                            console.error("Error ajustando nivel:", e);
                        });
                    }

                    // 2. Actualizar fecha de actividad (Semáforo)
                    if (window.LevelReliabilityService) {
                        const playerIds = [
                            ...(updatedMatch.team_a_ids || []),
                            ...(updatedMatch.team_b_ids || [])
                        ];
                        window.LevelReliabilityService.updateLastMatchDate(playerIds).catch(e => {
                            console.error("Error actualizando fiabilidad:", e);
                        });
                    }
                }
            }

            console.log("✅ Estado actualizado en DB.");
        } catch (e) {
            alert("❌ Error DB: " + e.message);
        }

        if (isFinish) {
            setTimeout(async () => {
                const round = window.AdminController.currentRound;
                const roundMatches = window.AdminController.matchesBuffer.filter(m => parseInt(m.round) === round);
                const pending = roundMatches.filter(m => m.status !== 'finished');

                if (pending.length === 0 && roundMatches.length > 0) {
                    // LIMIT TO 6 ROUNDS
                    if (round >= 6) {
                        alert("🏁 ENTRENO FINALIZADO\n(6 rondas completadas con éxito)");
                        return;
                    }

                    const nextRound = round + 1;
                    const autoGenerate = evt.is_simulation;

                    if (autoGenerate || confirm(`Ronda ${round} finalizada. ¿Generar Ronda ${nextRound}?`)) {
                        try {
                            await MatchMakingService.generateRound(evt.id, evt.type, nextRound);
                            if (autoGenerate) {
                                await MatchMakingService.simulateRound(evt.id, nextRound, evt.type);
                            }
                            window.Actions.switchRound(nextRound);
                        } catch (e) { alert(e.message); }
                    }
                }
            }, 500);
        }
    },

    async recalculateLevels() {
        if (window.LevelAdjustmentService) {
            await LevelAdjustmentService.recalculateAllLevels();
        } else {
            alert("Error: LevelAdjustmentService no disponible.");
        }
    },

    switchRound(r) {
        window.AdminController.currentRound = r;
        const evt = window.AdminController.activeEvent;
        renderMatchesGrid(evt.id, evt.type, r);

        // Update Tabs UI
        document.querySelectorAll('.btn-round-tab').forEach(b => b.classList.remove('active'));
        // Find button by text or index... easier to re-render context but that's expensive.
        // We just re-render frame? No. 
        // Just cheat and update generic style
    },

    async updateCourts() {
        const val = document.getElementById('quick-courts').value;
        const evt = window.AdminController.activeEvent;
        await EventService.updateEvent(evt.type, evt.id, { max_courts: parseInt(val) });
        alert("Pistas actualizadas");
    },

    async resetEvent() {
        if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsta acción es irreversible:\n1. Borrará TODOS los partidos y resultados.\n2. Reiniciará el evento a estado 'Live'.\n3. Generará automáticamente la Ronda 1.\n\n¿Continuar?")) return;

        const evt = window.AdminController.activeEvent;
        if (!evt || !evt.id) {
            alert("❌ Error: No hay evento activo");
            return;
        }

        const loader = document.getElementById('matches-grid');
        if (loader) loader.innerHTML = '<div class="loader"></div>';

        try {
            console.log(`🔄 Reiniciando evento: ${evt.name} (${evt.id})`);

            // 1. Delete all matches for this event (Search in BOTH collections)
            const collections = ['matches', 'entrenos_matches'];
            let totalDeleted = 0;

            for (const collName of collections) {
                try {
                    const snap = await window.db.collection(collName).where('americana_id', '==', evt.id).get();
                    if (!snap.empty) {
                        const batch = window.db.batch();
                        snap.docs.forEach(doc => {
                            batch.delete(doc.ref);
                            totalDeleted++;
                        });
                        await batch.commit();
                        console.log(`✅ Deleted ${snap.size} matches from ${collName}`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Error deleting from ${collName}:`, err);
                }
            }

            console.log(`🔥 Purged ${totalDeleted} matches across all collections.`);

            // 2. Reset Event Status to LIVE (Immediate Restart)
            console.log("📝 Updating event status to 'live'...");

            // Clean update payload - remove any undefined fields
            const updatePayload = {
                status: 'live'
            };

            // Use EventService if available, otherwise direct DB update
            if (window.EventService && window.EventService.updateEvent) {
                await EventService.updateEvent(evt.type, evt.id, updatePayload);
            } else {
                // Fallback to direct DB update
                const collectionName = evt.type === 'entreno' ? 'entrenos' : 'americanas';
                await window.db.collection(collectionName).doc(evt.id).update(updatePayload);
            }

            console.log("✅ Event status updated to 'live'");

            // 3. Auto-Generate Round 1
            console.log("🚀 Auto-generating Round 1 after reset...");

            if (!window.MatchMakingService) {
                throw new Error("MatchMakingService no está disponible");
            }

            await MatchMakingService.generateRound(evt.id, evt.type, 1);
            console.log("✅ Round 1 generated successfully");

            alert("✅ Evento reiniciado y Ronda 1 generada automáticamente.");

            // Reload view
            if (window.loadResultsView) {
                window.loadResultsView(evt.type);
            } else {
                location.reload();
            }

        } catch (e) {
            console.error("❌ Error al reiniciar evento:", e);
            alert(`❌ Error al reiniciar: ${e.message}\n\nRevisa la consola para más detalles.`);

            // Restore UI
            if (loader) {
                loader.innerHTML = '<div style="padding:2rem; text-align:center; color:#ff4444;">Error al reiniciar. Recarga la página.</div>';
            }
        }
    },

    async finishEvent() {
        const evt = window.AdminController.activeEvent;
        if (!evt || !evt.id) {
            alert("❌ Error: No hay evento activo");
            return;
        }

        // Check if all matches are finished
        const allMatches = window.AdminController.matchesBuffer || [];
        const unfinished = allMatches.filter(m => m.status !== 'finished');

        if (unfinished.length > 0) {
            if (!confirm(`⚠️ ATENCIÓN\n\nAún hay ${unfinished.length} partidos sin finalizar.\n\n¿Deseas finalizar el evento de todas formas?`)) {
                return;
            }
        }

        if (!confirm(`🏁 ¿Finalizar el evento "${evt.name}"?\n\nEsto marcará el evento como terminado y no se podrán generar más rondas.`)) {
            return;
        }

        try {
            console.log(`🏁 Finalizando evento: ${evt.name}`);

            // Update event status to finished
            const updatePayload = {
                status: 'finished',
                finishedAt: new Date().toISOString()
            };

            if (window.EventService && window.EventService.updateEvent) {
                await EventService.updateEvent(evt.type, evt.id, updatePayload);
            } else {
                const collectionName = evt.type === 'entreno' ? 'entrenos' : 'americanas';
                await window.db.collection(collectionName).doc(evt.id).update(updatePayload);
            }

            alert("✅ Evento finalizado correctamente");

            // Reload view
            if (window.loadResultsView) {
                window.loadResultsView(evt.type);
            } else {
                location.reload();
            }

        } catch (e) {
            console.error("❌ Error al finalizar evento:", e);
            alert(`❌ Error: ${e.message}`);
        }
    },

    async runRescue1101() {
        if (window.LevelReliabilityService) {
            await window.LevelReliabilityService.runRescue1101();
        } else {
            alert("Error: LevelReliabilityService no disponible.");
        }
    }
};

window.setTab = (tab) => {
    window.AdminController.activeTab = tab;
    // UI Update
    document.querySelectorAll('.tab-btn').forEach(b => {
        const isTarget = b.id === `tab-${tab}`;
        b.style.background = isTarget ? 'var(--primary)' : 'transparent';
        b.style.color = isTarget ? 'black' : 'white';
    });

    // Toggle containers
    const grid = document.getElementById('results-main-layout');
    const roundNav = document.getElementById('round-tabs-container');
    const sidebar = document.getElementById('sidebar-container');

    if (tab === 'matches') {
        grid.style.gridTemplateColumns = '3fr 1fr';
        roundNav.style.display = 'flex';
        sidebar.style.display = 'block';
    } else {
        grid.style.gridTemplateColumns = '1fr';
        roundNav.style.display = 'none';
        sidebar.style.display = 'none';
    }

    window.renderMatchesGrid(window.AdminController.activeEvent.id, window.AdminController.activeEvent.type, window.AdminController.currentRound);
};

function renderFullStatsView(container, matches) {
    const statsMap = {};
    matches.forEach(m => {
        if (m.status !== 'finished') return;
        const process = (ids, names, score, oppScore) => {
            ids.forEach((id, i) => {
                if (!statsMap[id]) statsMap[id] = { name: names[i] || id, pj: 0, wins: 0, games: 0 };
                statsMap[id].pj++;
                statsMap[id].games += score;
                if (score > oppScore) statsMap[id].wins++;
            });
        };
        process(m.team_a_ids, m.team_a_names, m.score_a, m.score_b);
        process(m.team_b_ids, m.team_b_names, m.score_b, m.score_a);
    });

    const sorted = Object.values(statsMap).sort((a, b) => b.wins - a.wins || b.games - a.games);

    container.innerHTML = `
        <div class="glass-card-enterprise animate-fade-in" style="padding: 2.5rem; border-color: rgba(204,255,0,0.2);">
            <h2 style="color: var(--primary); margin: 0 0 2rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 15px;">
                <i class="fas fa-chart-line"></i> Estadísticas Detalladas del Entreno
            </h2>
            <div style="overflow-x: auto; background: rgba(0,0,0,0.2); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: rgba(255,255,255,0.03);">
                        <tr>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900;">#</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900;">JUGADOR</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">PJ</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">V</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">JUEGOS</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">RENDIMIENTO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map((p, i) => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                                <td style="padding: 15px 20px; font-weight: 900; color: var(--primary);">${i + 1}</td>
                                <td style="padding: 15px 20px; font-weight: 800; color: white;">${p.name}</td>
                                <td style="padding: 15px 20px; text-align: center; color: #888;">${p.pj}</td>
                                <td style="padding: 15px 20px; text-align: center; color: #00ff64; font-weight: 900;">${p.wins}</td>
                                <td style="padding: 15px 20px; text-align: center; font-weight: 900;">${p.games}</td>
                                <td style="padding: 15px 20px; text-align: center;">
                                    <span style="background: rgba(204,255,0,0.1); color: #ccff00; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 0.75rem;">
                                        ${Math.round((p.wins / Math.max(1, p.pj)) * 100)}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- NAVIGATION HANDLER ---
window.locationSelectEvent = function (id) {
    console.log("🔄 Changing Event to:", id);
    if (!id) return;
    window.selectedEventId = id;

    // Attempt to preserve the current "Filter Context" (Americana vs Entreno)
    // based on the current active event's type.
    const currentType = window.AdminController.activeEvent ? window.AdminController.activeEvent.type : null;

    // Reload the view
    window.loadResultsView(currentType);
};

console.log("🏆 Admin-Results Optimized Loaded");

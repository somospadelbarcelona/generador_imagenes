/**
 * EventsController.js
 * Enhanced Real-time Events Management with Submenu
 */
(function () {
    class EventsController {
        constructor() {
            this.state = {
                activeTab: 'events',
                americanas: [],
                entrenos: [],
                users: [], // For ranking
                personalMatches: [], // NEW: User's history
                loading: true,
                initialized: false,
                loadingResults: false,
                currentUser: null,
                filters: {
                    month: 'all',
                    category: 'all'
                }
            };
            this.unsubscribeEvents = null;
            this.unsubscribeEntrenos = null;
            this.unsubscribeUsers = null;
        }

        setFilter(type, value) {
            if (this.state.filters[type] === value) return;
            this.state.filters[type] = value;
            this.render();
        }

        getAvailableMonths(events) {
            const months = new Set();
            events.forEach(e => {
                const d = new Date(e.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.add(key);
            });
            return Array.from(months).sort();
        }

        renderFilterBar(events) {
            const months = this.getAvailableMonths(events);
            const currentMonth = this.state.filters.month;
            const currentCat = this.state.filters.category;
            const monthLabels = { '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC' };

            return `
                <div class="filters-container" style="padding: 0 15px 15px 15px; display: flex; flex-direction: column; gap: 10px;">
                    <!-- Month Filters -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('month', 'all')" 
                                style="white-space: nowrap; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; 
                                ${currentMonth === 'all' ? 'background: #fff; color: #000; box-shadow: 0 4px 10px rgba(255,255,255,0.3);' : 'background: rgba(255,255,255,0.1); color: #888;'}">TODO</button>
                        ${months.map(m => {
                const [year, month] = m.split('-');
                const label = `${monthLabels[month]} '${year.slice(2)}`;
                const isActive = currentMonth === m;
                return `<button onclick="window.EventsController.setFilter('month', '${m}')" style="white-space: nowrap; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; ${isActive ? 'background: #fff; color: #000; box-shadow: 0 4px 10px rgba(255,255,255,0.3);' : 'background: rgba(255,255,255,0.1); color: #888;'}">${label}</button>`;
            }).join('')}
                    </div>
                    <!-- Category Filters -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('category', 'all')" style="white-space: nowrap; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; ${currentCat === 'all' ? 'background: var(--playtomic-neon); color: #000; box-shadow: 0 4px 10px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.1); color: #888;'}">TODAS</button>
                        <button onclick="window.EventsController.setFilter('category', 'male')" style="white-space: nowrap; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; ${currentCat === 'male' ? 'background: #00E36D; color: #000;' : 'background: rgba(255,255,255,0.05); color: #888;'}">MASC</button>
                        <button onclick="window.EventsController.setFilter('category', 'female')" style="white-space: nowrap; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; ${currentCat === 'female' ? 'background: #FF00CC; color: white;' : 'background: rgba(255,255,255,0.05); color: #888;'}">FEM</button>
                        <button onclick="window.EventsController.setFilter('category', 'mixed')" style="white-space: nowrap; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; ${currentCat === 'mixed' ? 'background: #FFD700; color: black;' : 'background: rgba(255,255,255,0.05); color: #888;'}">MIXTO</button>
                    </div>
                </div>
            `;
        }

        getTodayStr() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        getAllSortedEvents() {
            // Merge Americanas and Entrenos
            const all = [
                ...this.state.americanas.map(e => ({ ...e, type: 'americana' })),
                ...this.state.entrenos.map(e => ({ ...e, type: 'entreno' }))
            ];
            // Sort by Date ASC (nearest first) or DESC depending on need?
            // Usually for "Upcoming" we want nearest date (ASC). 
            // The previous code had .orderBy('date', 'desc') for Americanas, which puts future dates at the top if they are far future? No, desc means 2025 before 2024.
            // Actually for a calendar "Disponibles", usually you want the *soonest* event first.
            // Let's stick to the previous ordering logic which seemed to be DESC (newest created? or furthest date? 'date' is usually event date).
            // Wait, previous code: .orderBy('date', 'desc'). 
            // If date is "2024-10-30", then DESC will show 2025 before 2024.
            // Let's replicate strict string comparison sort.
            return all.sort((a, b) => {
                if (a.date === b.date) return a.time.localeCompare(b.time);
                return a.date.localeCompare(b.date); // ASC: Nearest date first seems more logical for a calendar
            });
            // Re-reading: The previous code had orderBy('date', 'desc'). If the user enters dates like "2024-05-20", descending means "2024-05-21" comes BEFORE "2024-05-20".
            // That sounds like "Latest News" order, not "Calendar" order. 
            // However, I will stick to ASC (Chronological) which makes more sense for "Agenda" and "Upcoming".
        }

        init() {
            if (this.state.initialized) {
                console.log("🎟️ [EventsController] Already initialized, rendering current state.");
                this.render();
                return;
            }
            console.log("🎟️ [EventsController] Initializing for the first time...");
            this.state.initialized = true;

            // grab user from global store (auth)
            this.state.currentUser = window.Store ? window.Store.getState('currentUser') : null;

            // 1. Real-time Americanas Listener
            if (this.unsubscribeEvents) this.unsubscribeEvents();
            this.unsubscribeEvents = window.db.collection('americanas')
                .orderBy('date', 'asc') // Changed to ASC for chronological order
                .onSnapshot(snapshot => {
                    this.state.americanas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.checkLoading();
                }, err => console.error("Error fetching americanas:", err));

            // 1b. Real-time Entrenos Listener
            if (this.unsubscribeEntrenos) this.unsubscribeEntrenos();
            this.unsubscribeEntrenos = window.db.collection('entrenos')
                .orderBy('date', 'asc')
                .onSnapshot(snapshot => {
                    this.state.entrenos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.checkLoading();
                }, err => console.error("Error fetching entrenos:", err));


            // 2. Real-time Users Listener (For Ranking)
            if (this.unsubscribeUsers) this.unsubscribeUsers();
            this.unsubscribeUsers = window.db.collection('players')
                .limit(50)
                .onSnapshot(snapshot => {
                    this.state.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Only re-render if we are on the ranking tab to avoid flicker
                    if (this.state.activeTab === 'ranking') this.render();
                });

            // Initial render call not needed here as onSnapshot will trigger it via checkLoading
        }

        checkLoading() {
            // Loading is complete if both are non-null
            if (this.state.americanas !== null && this.state.entrenos !== null) {
                this.state.loading = false;
                console.log("🎟️ [EventsController] Loading complete. Events:", this.state.americanas.length + this.state.entrenos.length);
                this.render();
            }
        }

        async setTab(tabName) {
            this.state.activeTab = tabName;

            // Haptic Feedback
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }

            // If switching to results, fetch personal matches
            if (tabName === 'results' && this.state.currentUser) {
                this.state.loadingResults = true;
                this.render();
                try {
                    const matches = await window.FirebaseDB.matches.getByPlayer(this.state.currentUser.uid);
                    this.state.personalMatches = matches;
                } catch (e) {
                    console.error("Error fetching personal matches:", e);
                } finally {
                    this.state.loadingResults = false;
                    this.render();
                }
            } else {
                this.render();
            }
        }

        render() {
            const container = document.getElementById('content-area');
            if (!container) return;

            // --- 1. SUBMENU NAVIGATION ---
            const tabs = [
                { id: 'events', label: 'DISPONIBLES', icon: 'fa-trophy' },
                { id: 'agenda', label: 'AGENDA', icon: 'fa-circle' },
                { id: 'results', label: 'MIS RESULTADOS', icon: 'fa-poll' },
                { id: 'finished', label: 'FINALIZADAS', icon: 'fa-history' }
            ];

            const navHtml = `
                <div class="events-submenu-container" style="
                    background: #232a32; 
                    padding: 10px 4px; 
                    border-bottom: 1px solid rgba(204,255,0,0.15); 
                    margin-bottom: 0px; 
                    display: flex; 
                    justify-content: space-around; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    position: sticky;
                    top: 180px; 
                    z-index: 11000; /* Higher than header z-index */
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                ">
                    ${tabs.map(tab => {
                const isActive = this.state.activeTab === tab.id;
                const isPadelBall = tab.id === 'agenda';

                return `
                <button onclick="window.EventsController.setTab('${tab.id}')" 
                                style="
                                    background: transparent; 
                                    border: none; 
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 8px;
                                    color: ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.4)'}; 
                                    font-weight: 800; 
                                    padding: 8px 4px; /* Increased hit area */
                                    font-size: 0.55rem;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    flex: 1;
                                    letter-spacing: 0.3px;
                                    position: relative;
                                    min-width: 0;
                                ">
                            <div style="
                                width: 44px; height: 44px; 
                                border-radius: 14px; 
                                background: ${isActive ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)'};
                                display: flex; align-items: center; justify-content: center; 
                                border: 1.5px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.1)'};
                                transition: all 0.3s;
                                box-shadow: ${isActive ? '0 0 15px rgba(204,255,0,0.3)' : 'none'};
                                margin-bottom: 2px;
                            ">
                                ${isPadelBall ?
                        `<div style="
                                        width: 22px; height: 22px; 
                                        background: ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.5)'}; 
                                        border-radius: 50%; 
                                        position: relative;
                                        border: 2px solid ${isActive ? '#000' : 'transparent'};
                                    ">
                                        <div style="position:absolute; top:20%; left:10%; width:80%; height:60%; border:1.5px solid rgba(0,0,0,0.2); border-radius:50%; border-top:none; border-bottom:none;"></div>
                                    </div>` :
                        `<i class="fas ${tab.icon}" style="font-size: 1.1rem; color: ${isActive ? '#CCFF00' : '#888'};"></i>`
                    }
                            </div>
                            <span style="text-transform: uppercase; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${tab.label}</span>
                            ${isActive ? `<div style="width: 16px; height: 3px; background: #CCFF00; border-radius: 10px; margin-top: 4px; box-shadow: 0 0 10px #CCFF00;"></div>` : ''}
                        </button>
                    `}).join('')}
                </div>
            `;

            // --- 2. CONTENT AREA ---
            let contentHtml = '';

            if (this.state.loading) {
                contentHtml = '<div style="padding:40px; text-align:center;"><div class="loader"></div></div>';
            } else {
                switch (this.state.activeTab) {
                    case 'events':
                        contentHtml = this.renderEventsList(false);
                        break;
                    case 'agenda':
                        contentHtml = this.renderAgendaView();
                        break;
                    case 'results':
                        contentHtml = this.renderResultsView(); // Personal results
                        break;
                    case 'finished':
                        contentHtml = this.renderFinishedView();
                        break;
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;
        }

        // --- VIEW RENDERERS ---

        renderEventsList(onlyMine) {
            let events = this.getAllSortedEvents();
            const { month, category } = this.state.filters;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            const todayStr = this.getTodayStr();

            // 0. General Filter (Available)
            if (!onlyMine) {
                events = events.filter(e => e.status !== 'finished' && e.date >= todayStr);
            } else if (onlyMine) {
                if (!uid) return `<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>`;
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            // 1. Apply Month Filter
            if (month !== 'all') {
                events = events.filter(e => e.date.startsWith(month));
            }

            // 2. Apply Category Filter
            if (category !== 'all') {
                events = events.filter(e => e.category === category);
            }

            const eventsHtml = events.map(evt => this.renderCard(evt)).join('');

            // Pass unfiltered (time-wise valid) events to renderFilterBar to show all valid month options
            const availableEvents = this.getAllSortedEvents().filter(e => e.status !== 'finished' && e.date >= todayStr);
            const filterBarHtml = !onlyMine ? this.renderFilterBar(availableEvents) : '';

            return `
                <div style="min-height: 80vh; padding-top: 15px;">
                    <div style="
                        padding: 16px 20px; 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        background: linear-gradient(135deg, #0f172a 0%, #000000 100%); 
                        border-radius: 20px; 
                        margin: 0 10px 10px 10px;
                        box-shadow: 0 0 25px rgba(204,255,0,0.25), 0 10px 40px rgba(0,0,0,0.6);
                        border: 2px solid #CCFF00;
                        position: relative;
                        overflow: hidden;
                        animation: pulse-border 3s infinite alternate;
                    ">
                        <!-- Neon background glow -->
                        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                        
                        <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                            <div style="
                                width: 44px; height: 44px; 
                                background: #000; 
                                border: 2.5px solid #CCFF00;
                                border-radius: 50%;
                                display: flex; align-items: center; justify-content: center;
                                box-shadow: 0 0 20px rgba(204,255,0,0.7), inset 0 0 10px rgba(204,255,0,0.3);
                                position: relative;
                                overflow: hidden;
                            ">
                                <!-- Pelota de Padel Neón -->
                                <div style="
                                    width: 26px; height: 26px; 
                                    background: #CCFF00; 
                                    border-radius: 50%; 
                                    position: relative;
                                    box-shadow: 0 0 15px #CCFF00, 0 0 30px rgba(204,255,0,0.5);
                                    animation: ball-float 3s ease-in-out infinite;
                                ">
                                    <!-- Costuras de la pelota -->
                                    <div style="position:absolute; top:15%; left:-5%; width:110%; height:70%; border:1.8px solid rgba(0,0,0,0.3); border-radius:50%; border-top:none; border-bottom:none;"></div>
                                </div>
                            </div>
                            <div>
                                <h2 style="font-size: 1.15rem; font-weight: 950; margin: 0; color: white; display: flex; align-items: center; gap: 8px; text-shadow: 0 0 15px rgba(204,255,0,0.4); letter-spacing: -0.5px;">
                                    Eventos <span style="color: #CCFF00;">Somospadel BCN</span>
                                </h2>
                                <p style="color: rgba(204,255,0,0.9); font-size: 0.65rem; font-weight: 850; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-family: 'Outfit', sans-serif; animation: glow-text 2s ease-in-out infinite alternate;">¡Apúntate en tiempo real!</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;">
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.85rem; 
                                color: #fff; 
                                background: #000; 
                                padding: 6px 14px; 
                                border-radius: 14px; 
                                font-weight: 950; 
                                border: 1.5px solid #00E36D;
                                box-shadow: 0 0 15px rgba(0,227,109,0.5);
                                animation: pulse-counter 2s infinite;
                            ">
                                <i class="fas fa-bolt" style="color: #00E36D; animation: bolt-shake 1s infinite;"></i> ${events.length}
                            </span>
                        </div>
                    </div>
                    <style>
                        @keyframes pulse-counter {
                            0% { box-shadow: 0 0 10px rgba(0,227,109,0.4); transform: scale(1); }
                            50% { box-shadow: 0 0 20px rgba(0,227,109,0.8); transform: scale(1.05); }
                            100% { box-shadow: 0 0 10px rgba(0,227,109,0.4); transform: scale(1); }
                        }
                        @keyframes bolt-shake {
                            0% { transform: translateY(0); }
                            25% { transform: translateY(-2px); }
                            50% { transform: translateY(0); }
                            75% { transform: translateY(2px); }
                            100% { transform: translateY(0); }
                        }
                        @keyframes ball-float {
                            0% { transform: scale(1) rotate(0deg); }
                            50% { transform: scale(1.1) rotate(10deg); }
                            100% { transform: scale(1) rotate(0deg); }
                        }
                        @keyframes glow-text {
                            from { text-shadow: 0 0 5px rgba(204,255,0,0.2); }
                            to { text-shadow: 0 0 15px rgba(204,255,0,0.6); }
                        }
                        @keyframes pulse-border {
                            0% { border-color: #CCFF00; box-shadow: 0 0 15px rgba(204,255,0,0.2); }
                            100% { border-color: #00E36D; box-shadow: 0 0 30px rgba(0,227,109,0.4); }
                        }
                    </style>

                    ${filterBarHtml}

                    <div style="padding-bottom: 120px; padding-left:10px; padding-right:10px;">
                        ${eventsHtml.length ? eventsHtml : `
                            <div style="padding:100px 40px; text-align:center; color:#444;">
                                <i class="fas fa-filter" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.1;"></i>
                                <h3 style="color: #666; font-weight: 800;">SIN RESULTADOS</h3>
                                <p style="font-size: 0.85rem; color: #888;">No hay eventos que coincidan con los filtros seleccionados.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        renderAgendaView() {
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            if (!uid) return `<div style="text-align:center; padding:80px 20px; color:#888;"><i class="fas fa-lock" style="font-size:4rem; margin-bottom:20px; opacity:0.05;"></i><br><h3 style="color:#666;">ACCESO RESTRINGIDO</h3><p style="font-size:0.85rem;">Inicia sesión para ver tu agenda profesional.</p></div>`;

            const todayStr = this.getTodayStr();

            // Filter events where user is participant and NOT finished AND not past
            const myEvents = this.getAllSortedEvents().filter(e => {
                if (e.status === 'finished') return false;
                if (e.date < todayStr && e.status !== 'live') return false;
                const players = e.players || e.registeredPlayers || [];
                return players.some(p => p.uid === uid || p.id === uid);
            });

            if (myEvents.length === 0) {
                return `
                    <div style="text-align:center; padding:100px 40px; color:#999;">
                        <div style="width:80px; height:80px; background:#1a1a1a; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; border:1px solid #333;">
                            <i class="far fa-calendar-alt" style="font-size:2.5rem; color:#444;"></i>
                        </div>
                        <h3 style="color:#fff; font-weight:800;">AGUARDA TU MOMENTO</h3>
                        <p style="font-size:0.85rem; color:#666; max-width:200px; margin:10px auto;">No tienes torneos ni entrenos próximos en los que estés inscrit@.</p>
                        <button onclick="window.EventsController.setTab('events')" style="margin-top:25px; background:var(--playtomic-neon); color:black; border:none; padding:12px 25px; border-radius:30px; font-weight:900; font-size:0.8rem; cursor:pointer; box-shadow:0 10px 20px rgba(0,227,109,0.2);">EXPLORAR EVENTOS</button>
                    </div>
                `;
            }

            return `
                <div style="padding: 20px; background: #f8fafc; min-height: 80vh;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px; background: white; padding: 20px; border-radius: 24px; border: 1px solid #edf2f7; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                        <div style="width: 50px; height: 50px; background: var(--playtomic-neon); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: black; box-shadow: 0 5px 15px rgba(204, 255, 0, 0.3);"><i class="fas fa-calendar-check"></i></div>
                        <div>
                            <h2 style="font-size: 1.25rem; font-weight: 900; margin: 0; color: #1e293b; letter-spacing: -0.5px;">Mi Agenda Pro</h2>
                            <p style="font-size: 0.7rem; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;">${myEvents.length} RESERVAS ACTIVAS</p>
                        </div>
                    </div>

                    ${myEvents.map(evt => {
                const isLive = evt.status === 'live';
                const location = evt.location || 'Somospadel';
                return `
                            <div style="background: white; border: 1px solid #f1f5f9; border-radius: 24px; margin-bottom: 16px; overflow: hidden; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.04); transition: transform 0.2s;" ontouchstart="this.style.transform='scale(0.98)'" ontouchend="this.style.transform='scale(1)'">
                                ${isLive ? `<div style="position:absolute; top:0; right:0; background:#FF2D55; color:white; font-size:0.6rem; font-weight:900; padding:6px 14px; border-bottom-left-radius:16px; animation:pulse-bg 2s infinite; letter-spacing: 1px;">LIVE NOW</div>` : ''}
                                <div style="padding: 24px;">
                                    <div style="display: flex; gap: 18px; align-items: center;">
                                        <div style="text-align: center; background: #f8fafc; padding: 12px; border-radius: 18px; min-width: 60px; height: fit-content; border: 1px solid #e2e8f0;">
                                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 900; text-transform: uppercase;">${new Date(evt.date).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()}</div>
                                            <div style="font-size: 1.6rem; font-weight: 950; color: #1e293b; line-height: 1; margin-top: 2px;">${new Date(evt.date).getDate()}</div>
                                        </div>
                                        <div style="flex: 1;">
                                            <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 850; letter-spacing: -0.3px;">${evt.name}</h3>
                                            <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px;">
                                                <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px;"><i class="far fa-clock" style="color: var(--playtomic-neon);"></i> ${evt.time}</span>
                                                <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px;"><i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> ${location}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-top: 20px; background: #f8fafc; border-radius: 16px; padding: 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0;">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="width: 28px; height: 28px; background: rgba(0, 227, 109, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #008a42;"><i class="fas fa-check"></i></div>
                                            <span style="font-size: 0.75rem; color: #475569; font-weight: 700;">Plaza Reservada</span>
                                        </div>
                                        <button onclick="window.ControlTowerView.load('${evt.id}'); window.Router.navigate('live');" 
                                                style="background: #111; color: #fff; border: none; padding: 10px 20px; border-radius: 12px; font-size: 0.75rem; font-weight: 850; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                            VER DETALLES
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
            }).join('')}
                    <div style="padding-bottom: 100px;"></div>
                </div>
                <style>
                    @keyframes pulse-bg { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
                </style>
            `;
        }

        renderFinishedView() {
            const todayStr = this.getTodayStr();
            const { month, category } = this.state.filters;

            // Show all finished americanas OR past americanas
            let finishedEvents = this.getAllSortedEvents().filter(e => e.status === 'finished' || e.date < todayStr);

            // 1. Apply Month Filter
            if (month !== 'all') finishedEvents = finishedEvents.filter(e => e.date.startsWith(month));

            // 2. Apply Category Filter
            if (category !== 'all') finishedEvents = finishedEvents.filter(e => e.category === category);

            // Get valid months for filter bar from ALL finished events, not just filtered ones
            const allFinished = this.getAllSortedEvents().filter(e => e.status === 'finished' || e.date < todayStr);

            if (finishedEvents.length === 0) {
                return `
                    <div style="padding: 20px; background: #0a0a0a; min-height: 80vh;">
                         <div style="margin-bottom: 25px;">
                            <h2 style="font-size: 1.5rem; font-weight: 950; margin: 0; color: white; letter-spacing:-1px;">HISTORIAL <span style="color:var(--playtomic-neon);">DE EVENTOS</span></h2>
                            <p style="font-size: 0.75rem; color: #666; margin: 5px 0 0 0;">RESULTADOS DE AMERICANAS Y ENTRENOS FINALIZADOS</p>
                        </div>
                        ${this.renderFilterBar(allFinished)}
                        <div style="text-align:center; padding:50px 40px; color:#666;">
                            <i class="fas fa-filter" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.1;"></i>
                            <h3 style="color:#fff;">SIN DATOS</h3>
                            <p style="font-size:0.85rem;">No hay eventos finalizados para estos filtros.</p>
                        </div>
                    </div>
                `;
            }

            return `
                <div style="padding: 20px; background: #0a0a0a; min-height: 80vh;">
                    <div style="margin-bottom: 25px;">
                        <h2 style="font-size: 1.5rem; font-weight: 950; margin: 0; color: white; letter-spacing:-1px;">HISTORIAL <span style="color:var(--playtomic-neon);">DE EVENTOS</span></h2>
                        <p style="font-size: 0.75rem; color: #666; margin: 5px 0 0 0;">RESULTADOS DE AMERICANAS Y ENTRENOS FINALIZADOS</p>
                    </div>

                    ${this.renderFilterBar(allFinished)}
                    
                    <div style="display: grid; gap: 15px; padding-bottom: 120px;">
                        ${finishedEvents.map(evt => this.renderCard(evt)).join('')}
                    </div>
                </div>
            `;
        }

        renderResultsView() {
            const matches = this.state.personalMatches || [];
            if (this.state.loadingResults) {
                return `<div style="padding:100px; text-align:center;"><div class="loader"></div><p style="color:#666; font-size:0.8rem; margin-top:15px;">CARGANDO TU HISTORIAL...</p></div>`;
            }

            if (!this.state.currentUser) {
                return `<div style="padding:100px 40px; text-align:center;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:20px; color:#444;"></i><h3 style="color:#fff;">ACCESO PRIVADO</h3><p style="color:#666; font-size:0.85rem;">Inicia sesión para ver tus resultados personales.</p></div>`;
            }

            if (matches.length === 0) {
                return `
                    <div style="padding:100px 40px; text-align:center; color:#666; background: #000; min-height: 80vh;">
                        <div style="font-size: 5rem; margin-bottom: 25px; animation: float 3s ease-in-out infinite;">🎾</div>
                        <h2 style="color:#fff; font-weight: 900; letter-spacing: -1px;">SIN PARTIDOS REGISTRADOS</h2>
                        <p style="font-size:0.95rem; line-height: 1.4; max-width: 250px; margin: 0 auto 30px;">Tus resultados aparecerán aquí tras tu primera americana.</p>
                        <button onclick="window.EventsController.setTab('events')" style="background: #00E36D; color: black; border: none; padding: 15px 40px; border-radius: 14px; font-weight: 950; text-transform: uppercase; cursor: pointer;">IR A JUGAR</button>
                    </div>
                `;
            }

            return `
                <div style="padding: 25px; background: #000; min-height: 80vh; position: relative;">
                    <!-- BG Effect -->
                    <div style="position: absolute; inset: 0; background: radial-gradient(circle at 100% 0%, rgba(0, 227, 109, 0.05) 0%, transparent 50%); pointer-events: none;"></div>

                    <div style="margin-bottom: 35px; position: relative; z-index: 2;">
                        <h2 style="font-size: 2.2rem; font-weight: 950; margin: 0; color: white; letter-spacing: -1.5px; line-height: 1;">MI <span style="color:#00E36D;">HISTORIAL</span></h2>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 2px;">VÍDEO / RESULTADOS</span>
                            <div style="flex: 1; height: 1px; background: #222;"></div>
                        </div>
                    </div>

                    <div style="padding-bottom: 120px; position: relative; z-index: 2;">
                        ${matches.map((m, i) => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(this.state.currentUser.uid);
                const won = (isTeamA && s1 > s2) || (!isTeamA && s2 > s1);
                const draw = s1 === s2;
                const resultColor = draw ? '#FFCC00' : (won ? '#00E36D' : '#FF2D55');

                return `
                                <div style="
                                    background: rgba(255, 255, 255, 0.03); 
                                    border: 1px solid rgba(255,255,255,0.05); 
                                    border-radius: 20px; margin-bottom: 15px; 
                                    overflow: hidden; 
                                    backdrop-filter: blur(10px);
                                    animation: floatUp 0.5s ease-out forwards;
                                    animation-delay: ${i * 0.1}s; opacity: 0;
                                ">
                                    <div style="padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <span style="font-size: 0.75rem; color: #666; font-weight: 900; letter-spacing: 1px;">ROUND ${m.round || '?'} • PISTA ${m.court || '?'}</span>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${resultColor}; box-shadow: 0 0 10px ${resultColor};"></div>
                                            <span style="font-size: 0.75rem; color: ${resultColor}; font-weight: 950; text-transform: uppercase;">${draw ? 'EMPATE' : (won ? 'VICTORIA' : 'DERROTA')}</span>
                                        </div>
                                    </div>
                                    
                                    <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                                        <div style="flex: 1; text-align: center;">
                                            <div style="font-size: 0.95rem; font-weight: 900; color: ${isTeamA ? 'white' : 'rgba(255,255,255,0.4)'}; line-height: 1.1;">
                                                ${m.team_a_names ? m.team_a_names.join('<br>') : 'Pareja A'}
                                            </div>
                                        </div>
                                        
                                        <div style="
                                            display: flex; align-items: center; gap: 10px; 
                                            background: #000; padding: 10px 18px; border-radius: 14px; 
                                            border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                                        ">
                                            <span style="font-family: 'Arial Black', sans-serif; font-size: 1.6rem; font-weight: 900; color: ${isTeamA && won ? '#00E36D' : 'white'};">${s1}</span>
                                            <span style="color: #333; font-weight: 900;">:</span>
                                            <span style="font-family: 'Arial Black', sans-serif; font-size: 1.6rem; font-weight: 900; color: ${!isTeamA && won ? '#00E36D' : 'white'};">${s2}</span>
                                        </div>

                                        <div style="flex: 1; text-align: center;">
                                            <div style="font-size: 0.95rem; font-weight: 900; color: ${!isTeamA ? 'white' : 'rgba(255,255,255,0.4)'}; line-height: 1.1;">
                                                ${m.team_b_names ? m.team_b_names.join('<br>') : 'Pareja B'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style="padding: 10px 20px; background: rgba(0,0,0,0.5); display: flex; justify-content: space-between; align-items: center;">
                                         <span style="font-size: 0.7rem; color: #444; font-weight: 700;">
                                            <i class="far fa-calendar-alt"></i> ${m.created_at ? new Date(m.created_at.seconds * 1000).toLocaleDateString() : 'REAL TIME'}
                                         </span>
                                         <button onclick="window.ControlTowerView.load('${m.americana_id}'); window.Router.navigate('live');" 
                                                 style="background: transparent; border: 1px solid #333; color: white; padding: 5px 12px; border-radius: 8px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;">
                                            VER PARTIDO <i class="fas fa-play" style="margin-left:5px; font-size: 0.5rem; color: #00E36D;"></i>
                                         </button>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        renderPlayerStatsView() {
            // Replaces old 'standings' view
            return `
                <div style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📈</div>
                    <h3 style="color: white; margin-bottom: 0.5rem;">Mis Estadísticas</h3>
                    <p style="color: #666; font-size: 0.9rem;">Tu rendimiento detallado, victorias y evolución de nivel.</p>
                </div>
            `;
        }

        // --- CARD RENDERER (OPTION C: THE HYBRID - REFINED) ---
        renderCard(evt) {
            const players = evt.players || evt.registeredPlayers || [];
            const playerCount = players.length;
            const maxPlayers = (evt.max_courts || 0) * 4;

            const d = new Date(evt.date);
            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', '');
            const dayNum = d.getDate();

            const user = this.state.currentUser;
            const uid = user ? user.uid : '-';
            const isJoined = players.some(p => p.uid === uid || p.id === uid);
            const isFull = playerCount >= maxPlayers;

            const todayStr = this.getTodayStr();
            const isPast = evt.date < todayStr;
            const isFinished = evt.status === 'finished' || (isPast && evt.status !== 'live');
            const isLive = evt.status === 'live';

            // --- 1. ACTION BUTTON STATE (FAB STYLE) ---
            let btnContent = '<i class="fas fa-plus"></i>';
            let btnStyle = 'background: #00E36D; color: #000; box-shadow: 0 4px 15px rgba(0, 227, 109, 0.5);';
            let btnAction = `event.stopPropagation(); window.EventsController.joinEvent('${evt.id}')`;
            let btnDisabled = false;

            if (isFinished) {
                // Initial setup, will be refined below
                btnContent = '<i class="fas fa-trophy"></i>';
                btnStyle = 'background: #333; color: #fff; border: 2px solid #555;';
                btnAction = `window.ControlTowerView.prepareLoad('${evt.id}'); window.Router.navigate('live');`;
            } else if (isLive) {
                btnContent = '<span style="font-size:0.6rem; font-weight:800;">LIVE</span>';
                btnStyle = 'background: #FF2D55; color: white; animation: pulse 2s infinite; padding: 0;';
                btnAction = `window.ControlTowerView.load('${evt.id}'); window.Router.navigate('live');`;
            } else if (isJoined) {
                btnContent = '<i class="fas fa-check"></i>';
                btnStyle = 'background: #000; color: #00E36D; border: 2px solid #00E36D;';
                btnDisabled = true;
            } else if (isFull) {
                btnContent = '<i class="fas fa-hourglass-half"></i>';
                btnStyle = 'background: #333; color: #888; border: 2px solid #444;';
                btnDisabled = true;
            }

            // --- 2. LABELS & CATEGORY COLOR ---
            const categoryMap = { 'male': 'MASCULINA', 'female': 'FEMENINA', 'mixed': 'MIXTA', 'open': 'TWISTER' };
            const categoryLabel = categoryMap[evt.category] || 'TWISTER';

            // Category Color Logic (User Custom Request)
            let catColor = '#666'; // Default Gray
            if (evt.category === 'female') catColor = '#FF00CC';    // ROSA
            else if (evt.category === 'male') catColor = '#00E36D';   // VERDE
            else if (evt.category === 'mixed') catColor = '#FFD700';  // AMARILLO (Updated)
            else if (evt.category === 'open') catColor = '#00CCFF';   // AZUL

            let bgImage = evt.image_url || 'img/americana-neon-bg.jpg';
            if (!evt.image_url) {
                if (evt.category === 'mixed') bgImage = 'img/ball-mixta.png';
            }

            // --- 3. PRICES ---
            const pMember = evt.price_members || 12;
            const pExternal = evt.price_external || 14;

            // --- 4. FULL & FINISHED STATE VISUALS ---
            let isClosed = false;
            // Check if finished date is past today? Or just status.
            if (isFinished) {
                isClosed = true;
                btnContent = '<div style="display:flex; flex-direction:column; align-items:center; line-height:1;"><i class="fas fa-chart-bar" style="font-size: 1rem; margin-bottom: 2px;"></i><span style="font-size:0.55rem; font-weight:900;">REPORTE</span></div>';
                // Green for success/results
                btnStyle = 'background: #00E36D; color: black; border: none; box-shadow: 0 0 15px rgba(0,227,109, 0.4); width: 60px; height: 60px;';
                btnDisabled = false; // Enabled to see results!
                btnAction = `window.ControlTowerView.prepareLoad('${evt.id}'); window.Router.navigate('live'); event.stopPropagation();`;
            } else if (isFull) {
                btnContent = '<span style="font-size:0.65rem; font-weight:800; letter-spacing:0.5px;">LLENO</span>';
                btnStyle = 'background: #FF2D55; color: white; border: none; box-shadow: 0 4px 15px rgba(255, 45, 85, 0.4);';
                btnDisabled = true;
            }

            // OPTION C HTML STRUCTURE: THE HYBRID (REFINED - DARK MODE & ICONS)
            return `
                <div id="event-card-${evt.id}" class="card-hybrid-c" onclick="window.ControlTowerView.prepareLoad('${evt.id}'); window.Router.navigate('live');" 
                     style="
                        position: relative; 
                        background: #111;
                        border-radius: 24px; 
                        overflow: hidden; 
                        margin-bottom: 20px; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                        border: 1px solid #222;
                        display: flex;
                        flex-direction: column;
                     ">
                    
                    <!-- TOP HALF: IMAGE -->
                    <div style="
                        height: 140px;
                        width: 100%;
                        background: url('${bgImage}') no-repeat center center / cover;
                        position: relative;
                    ">
                        
                        <!-- PRICE PILL (TOP RIGHT) - OPTIMIZED & COOL -->
                         <div style="
                            position: absolute; top: 12px; right: 12px;
                            background: rgba(0,0,0,0.6); 
                            backdrop-filter: blur(8px);
                            border: 1px solid rgba(255,255,255,0.1);
                            border-radius: 12px;
                            padding: 4px;
                            display: flex; gap: 4px; align-items: center;
                        ">
                            <div style="background:#444; color:white; padding:4px 8px; border-radius:8px; font-weight:800; font-size:0.75rem;">${pMember}€ <span style="font-weight:600; opacity:0.7; font-size: 0.65rem;">SOC</span></div>
                            <div style="background:#eee; color:#111; padding:4px 8px; border-radius:8px; font-weight:800; font-size:0.75rem;">${pExternal}€ <span style="font-weight:600; opacity:0.6; font-size: 0.65rem;">EXT</span></div>
                        </div>

                        <!-- DATE BADGE (TOP LEFT) -->
                        <div style="
                            position: absolute; top: 12px; left: 12px;
                            background: #000; 
                            border: 1px solid var(--playtomic-neon);
                            border-radius: 14px;
                            padding: 8px 12px;
                            min-width: 58px;
                            text-align: center;
                            color: white;
                            line-height: 1;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                        ">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--playtomic-neon); margin-bottom: 4px; text-transform:uppercase; letter-spacing:1px;">${dayName}</div>
                            <div style="font-size: 1.5rem; font-weight: 900; letter-spacing: -1px; color:white;">${dayNum}</div>
                        </div>

                        ${isClosed ? `
                        <div style="
                            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                            background: rgba(0,0,0,0.7);
                            backdrop-filter: blur(2px);
                            display: flex; align-items: center; justify-content: center;
                            z-index: 5;
                        ">
                            <div style="
                                border: 2px solid #00E36D; color: #00E36D; 
                                padding: 8px 20px; font-weight: 900; letter-spacing: 2px;
                                transform: rotate(-10deg); font-size: 1.2rem;
                                text-shadow: 0 0 10px rgba(0,227,109,0.5);
                                background: rgba(0,0,0,0.8);
                            ">CERRADA</div>
                        </div>
                        ` : ''}

                    </div>

                    <!-- FLOATING ACTION BUTTON -->
                    <div style="
                        position: absolute;
                        top: 115px; /* On the seam */
                        right: 20px;
                        z-index: 10;
                    ">
                        <button onclick="${btnAction}" 
                                ${btnDisabled ? 'disabled' : ''}
                                style="
                                    width: 54px; height: 54px;
                                    border-radius: 50%;
                                    border: none;
                                    font-size: 1.4rem;
                                    display: flex; align-items: center; justify-content: center;
                                    cursor: pointer;
                                    transition: transform 0.2s;
                                    ${btnStyle}
                                ">
                            ${btnContent}
                        </button>
                    </div>

                     <!-- BOTTOM HALF: CONTENT -->
                    <div style="
                        padding: 16px 20px 20px 20px;
                        background: #0a0a0a; 
                        border-top: 1px solid #222;
                    ">
                        <!-- Title -->
                        <h3 style="
                            color: white; 
                            font-size: 1.2rem; 
                            font-weight: 800; 
                            margin: 0 0 15px 0; 
                            line-height: 1.2;
                            padding-right: 60px; /* Space for FAB */
                            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                        ">
                            ${evt.name}
                        </h3>

                        <!-- NEW ICON GRID LAYOUT -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.75rem; font-weight: 700; color: #ccc;">
                            
                            <!-- ROW 1: Date & Time -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="far fa-calendar-alt" style="color: var(--playtomic-neon); width: 16px; text-align: center;"></i> 
                                ${evt.date ? evt.date.split('-').reverse().join('-') : 'Sin fecha'}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="far fa-clock" style="color: var(--playtomic-neon); width: 16px; text-align: center;"></i> 
                                ${evt.time || '00:00'}
                            </div>

                            <!-- ROW 2: Category & Mode -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 16px; height: 16px; border-radius: 4px; background: ${catColor}; box-shadow: 0 0 5px ${catColor};"></div>
                                <span style="color: ${catColor}; font-weight: 800;">${categoryLabel}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="${evt.pair_mode === 'fixed' || (evt.name && evt.name.toUpperCase().includes('FIJA')) ? 'fas fa-lock' : 'fas fa-sync-alt'}" 
                                   style="color: #bbb; width: 16px; text-align: center;"></i>
                                <span style="color: #bbb;">${evt.pair_mode === 'fixed' || (evt.name && evt.name.toUpperCase().includes('FIJA')) ? 'FIJA' : 'TWISTER'}</span>
                            </div>

                            <!-- ROW 3: Courts & Location -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-table-tennis" style="color: #e91e63; width: 16px; text-align: center;"></i> 
                                ${(evt.max_courts || 4)} Pistas
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-map-marker-alt" style="color: #ef4444; width: 16px; text-align: center;"></i> 
                                <span style="color: #eee;">${evt.location || 'Somospadel'}</span>
                            </div>

                            <!-- ROW 4: Players -->
                            <div onclick="event.stopPropagation(); window.EventsController.openPlayerListModal(this.getAttribute('data-players'))" 
                                 data-players='${JSON.stringify(players).replace(/'/g, "&apos;")}'
                                 style="grid-column: span 2; display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--playtomic-neon); margin-top: 5px;">
                                <i class="fas fa-users" style="width: 16px; text-align: center;"></i> 
                                <span style="text-decoration: underline;">${playerCount} Inscritos</span>
                            </div>

                        </div>
                    </div>
                </div>
            `;
        }

        openPlayerListModal(playersJson) {
            let players = [];
            try {
                players = typeof playersJson === 'string' ? JSON.parse(playersJson) : playersJson;
            } catch (e) {
                console.error("Error parsing players", e);
                return;
            }

            const modalId = 'player-list-modal';
            const existingModal = document.getElementById(modalId);
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle at center, #001a4d 0%, #000 100%);
                z-index: 10000; display: flex; flex-direction: column;
                animation: fadeInModal 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'Inter', 'Outfit', sans-serif;
            color: white;
                overflow: hidden;
            `;

            const content = `
                <!-- BACKGROUND FX: VIBRANT BROADCAST OVERLAYS -->
                <div style="position: absolute; inset: 0; pointer-events: none; z-index: 1;">
                    <!-- Electric Blue Gradient -->
                    <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% -20%, rgba(30, 64, 175, 0.4) 0%, transparent 70%);"></div>
                    <!-- Scanlines effect lighter -->
                    <div style="position: absolute; inset: 0; background: linear-gradient(rgba(255, 255, 255, 0.03) 50%, transparent 50%); background-size: 100% 4px;"></div>
                    <!-- White particles / Digital Grid -->
                    <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 30px 30px; opacity: 0.6;"></div>
                </div>

                <!-- MAIN HEADER: THE FOX VIBRANT BAR -->
                <div style="
                    position: relative; z-index: 10;
                    background: linear-gradient(90deg, #1e40af 0%, #001a4d 60%, #000 100%);
                    padding: 45px 30px 35px;
                    border-bottom: 5px solid #00E36D;
                    box-shadow: 0 15px 50px rgba(0,0,0,0.6);
                    display: flex; align-items: flex-end; justify-content: space-between;
                ">
                    <!-- Light Sweep on Header -->
                    <div style="position: absolute; inset: 0; background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%); pointer-events: none;"></div>
                    
                    <div>
                        <div style="
                            background: white; color: #1e40af;
                            display: inline-block; padding: 4px 15px;
                            font-weight: 900; font-size: 0.85rem;
                            text-transform: uppercase; letter-spacing: 2.5px;
                            transform: skew(-15deg); margin-bottom: 18px;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                        ">SOMOSPADEL LIVE</div>
                        
                        <div style="display: flex; flex-direction: column;">
                            <h2 style="margin: 0; font-size: 2.6rem; font-weight: 950; text-transform: uppercase; letter-spacing: -1px; line-height: 0.85; color: white; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5));">
                                PARTICIPANTES <br> 
                                <span style="color: #00E36D; font-size: 2.9rem;">CONFIRMADOS</span>
                            </h2>
                        </div>
                    </div>

                    <div style="text-align: right; min-width: 120px; border-left: 2px solid rgba(255,255,255,0.15); padding-left: 25px;">
                        <div style="font-size: 1.1rem; font-weight: 400; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 2px;">TOTAL</div>
                        <div style="font-size: 4.8rem; font-weight: 950; font-family: 'Montserrat', sans-serif; line-height: 0.8; margin-top: 5px; color: white;">${players.length}</div>
                        <div style="font-size: 0.8rem; color: #00E36D; font-weight: 900; letter-spacing: 1.5px; margin-top: 5px; text-transform: uppercase;">Jugadores</div>
                    </div>
                </div>

                <!-- PLAYER LIST: VIBRANT GRID -->
                <div style="
                    position: relative; z-index: 5;
                    flex: 1; overflow-y: auto; overflow-x: hidden;
                    padding: 35px 25px;
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
                    gap: 18px; align-content: start;
                    -webkit-overflow-scrolling: touch;
                ">
                    ${players.length === 0 ? `
                        <div style="grid-column: 1/-1; padding: 120px 20px; text-align: center; opacity: 0.6; color: white;">
                            <i class="fas fa-satellite-dish" style="font-size: 5rem; margin-bottom: 25px; animation: rotate 4s linear infinite;"></i>
                            <h3 style="font-weight: 900; letter-spacing: 3px;">BUSCANDO SEÑAL...</h3>
                        </div>
                    ` : players.map((p, i) => {
                const lvl = parseFloat(p.level || p.playtomic_level || 3.5);
                const lvlColor = lvl >= 4.5 ? '#FF2D55' : (lvl >= 4 ? '#FFCC00' : '#00E36D');

                return `
                        <div style="
                            background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%);
                            backdrop-filter: blur(12px);
                            border: 1px solid rgba(255,255,255,0.15);
                            border-top: 4px solid ${lvlColor};
                            border-radius: 12px;
                            padding: 25px 15px;
                            text-align: center;
                            position: relative;
                            box-shadow: 0 12px 25px rgba(0,0,0,0.2);
                            animation: enterCard 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.2) forwards;
                            opacity: 0;
                            animation-delay: ${0.1 + (i * 0.05)}s;
                        ">
                            <!-- Glow on level -->
                            <div style="
                                position: absolute; top: 12px; right: 10px;
                                background: ${lvlColor}; color: #000;
                                font-size: 0.75rem; font-weight: 950;
                                padding: 3px 8px; border-radius: 6px;
                                z-index: 2; box-shadow: 0 0 10px ${lvlColor}44;
                            ">${lvl.toFixed(2)}</div>

                            <!-- AVATAR: VIBRANT STYLE -->
                            <div style="
                                width: 75px; height: 75px; margin: 0 auto 18px;
                                background: white;
                                border-radius: 100px;
                                display: flex; align-items: center; justify-content: center;
                                border: 3px solid rgba(255,255,255,0.1);
                                position: relative; overflow: hidden;
                                box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                            ">
                                <i class="fas fa-user-ninja" style="font-size: 2.4rem; color: #1e40af; position: relative;"></i>
                                <div style="position: absolute; inset: 0; background: radial-gradient(circle, ${lvlColor}33 0%, transparent 70%); animation: slowPulse 3s infinite;"></div>
                            </div>

                            <!-- PLAYER NAME -->
                            <div style="position: relative; z-index: 2;">
                                <div style="
                                    font-size: 0.95rem; font-weight: 950; color: white;
                                    text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                                ">${p.name ? p.name.split(' ')[0] : 'JUGADOR'}</div>
                                <div style="
                                    font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.7);
                                    text-transform: uppercase; letter-spacing: 1.5px;
                                    margin-top: 5px;
                                ">${p.name && p.name.includes(' ') ? p.name.split(' ').slice(1).join(' ') : 'VERIFICADO'}</div>
                            </div>
                        </div>
                        `;
            }).join('')}
                </div>

                <!-- ANALYTICS TICKER FOOTER (LEIBLE Y ÚTIL) -->
                <div style="
                    position: relative; z-index: 100;
                    background: #000; padding: 0;
                    border-top: 2px solid var(--playtomic-neon);
                    height: 40px; display: flex; align-items: center;
                ">
                    <div style="
                        background: var(--playtomic-neon); color: black;
                        font-weight: 950; font-size: 0.75rem;
                        padding: 0 15px; height: 100%; display: flex; align-items: center;
                        text-transform: uppercase; letter-spacing: 1px;
                        z-index: 110; position: relative;
                        box-shadow: 5px 0 15px rgba(0,0,0,0.5);
                    ">INFO JUGADORES</div>
                    <div style="flex: 1; overflow: hidden; position: relative; height: 100%; display: flex; align-items: center;">
                        <div style="
                            position: absolute;
                            white-space: nowrap; font-size: 0.9rem; font-weight: 900;
                            color: white; text-transform: uppercase; letter-spacing: 1px;
                            animation: newsTicker 60s linear infinite;
                            display: flex; align-items: center; gap: 40px;
                        ">
                            <span>• NIVEL MEDIO: ${(players.reduce((a, b) => a + (parseFloat(b.level) || 3.5), 0) / (players.length || 1)).toFixed(2)}</span>
                            ${players.map(p => `<span>• ${p.name ? p.name.toUpperCase() : 'JUGADOR'} (LVL: ${(parseFloat(p.level || p.playtomic_level || 3.5)).toFixed(2)})</span>`).join('')}
                            <span>• SOMOSPADEL BCN ACTUALIZADO •</span>
                        </div>
                    </div>
                </div>

                <!-- CTA PANEL -->
                <div style="
                    position: relative; z-index: 10;
                    background: #000; padding: 25px;
                    display: flex; justify-content: center;
                    border-top: 1px solid #222;
                ">
                    <button onclick="document.getElementById('${modalId}').remove()" style="
                        background: #00E36D;
                        color: #000000;
                        border: none;
                        padding: 18px 100px;
                        border-radius: 12px;
                        font-family: 'Arial Black', sans-serif;
                        font-weight: 900;
                        font-size: 1.4rem;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        cursor: pointer;
                        box-shadow: 0 0 30px rgba(0,227,109,0.5);
                        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        line-height: 1;
                        display: block;
                    " onmouseover="this.style.transform='scale(1.05)';" 
                       onmouseout="this.style.transform='scale(1)';" >
                         SALIR
                    </button>
                </div>

                <style>
                    @keyframes fadeInModal { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
                    @keyframes newsTicker { 
                        0% { transform: translateX(100%); } 
                        100% { transform: translateX(-100%); } 
                    }
                    @keyframes enterCard { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes slowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.1; } }
                </style>
            `;

            modal.innerHTML = content;
            document.body.appendChild(modal);
        }


        renderAvatars(players, max = 3) {
            if (!players || !players.length) return `<div class="p-avatar-empty"></div>`;
            return players.slice(0, max).map(p => `
                <div class="p-avatar-mini" style="background: var(--playtomic-neon); color: black;">
                    ${(p.name || 'P').charAt(0)}
                </div>
            `).join('') + (players.length > max ? `<div class="p-avatar-plus">+${players.length - max}</div>` : '');
        }

        async joinEvent(eventId) {
            const user = this.state.currentUser;
            if (!user) {
                this.showPremiumAlert("ACCESSO DENEGADO", "Inicia sesión para apuntarte a este torneo.", "LOCK");
                window.location.hash = '#profile';
                return;
            }

            const confirmed = await this.showPremiumConfirm(
                "¿LISTO PARA EL RETO?",
                "¿Deseas confirmar tu inscripción oficial para este torneo? Una plaza quedará reservada a tu nombre.",
                "JOIN"
            );

            if (!confirmed) return;

            try {
                // Show loading state
                const overlay = this.showLoadingOverlay("RESERVANDO PLAZA...");

                const res = await window.AmericanaService.addPlayer(eventId, user);

                overlay.remove();

                if (!res.success) throw new Error(res.error);

                // SHOW SUCCESS ANIMATION
                await this.showSuccessModal("¡INSCRIPCIÓN ÉXITOSA!", "Tu plaza ha sido confirmada. ¡Nos vemos en la pista!");

            } catch (err) {
                this.showPremiumAlert("ERROR", err.message, "ERROR");
            }
        }

        showLoadingOverlay(text) {
            const div = document.createElement('div');
            div.style = "position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white;";
            div.innerHTML = `
                <div class="loader" style="width:50px; height:50px; border:5px solid #00E36D; border-top-color:transparent; border-radius:50%; animation: rotate 1s linear infinite;"></div>
                <h3 style="margin-top:20px; font-weight:900; letter-spacing:2px; font-size:1rem;">${text}</h3>
            `;
            document.body.appendChild(div);
            return div;
        }

        async showSuccessModal(title, msg) {
            return new Promise(resolve => {
                const div = document.createElement('div');
                div.style = "position:fixed; inset:0; z-index:10001; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; animation: fadeIn 0.3s forwards;";
                div.innerHTML = `
                    <div style="background:#111; border:2px solid #00E36D; padding:40px; border-radius:30px; text-align:center; max-width:90%; animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                        <div style="width:80px; height:80px; background:#00E36D; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 25px; box-shadow:0 0 30px rgba(0,227,109,0.5);">
                            <i class="fas fa-check" style="font-size:2.5rem; color:black;"></i>
                        </div>
                        <h2 style="color:white; font-weight:950; font-size:1.8rem; margin-bottom:10px;">${title}</h2>
                        <p style="color:#888; margin-bottom:30px; line-height:1.5;">${msg}</p>
                        <button id="success-close" style="background:#00E36D; color:black; border:none; padding:15px 40px; border-radius:12px; font-weight:950; text-transform:uppercase; cursor:pointer; width:100%;">ENTENDIDO</button>
                    </div>
                    <style>
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    </style>
                `;
                document.body.appendChild(div);
                div.querySelector('#success-close').onclick = () => { div.remove(); resolve(); };
            });
        }

        async showPremiumConfirm(title, msg, type) {
            return new Promise(resolve => {
                const div = document.createElement('div');
                div.style = "position:fixed; inset:0; z-index:10001; background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; animation: fadeIn 0.2s;";
                div.innerHTML = `
                    <div style="background:#111; border:1px solid rgba(255,255,255,0.1); border-top:5px solid #00c4ff; padding:35px; border-radius:24px; text-align:center; max-width:85%; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
                        <h2 style="color:white; font-weight:950; font-size:1.4rem; margin-bottom:15px; letter-spacing:-0.5px;">${title}</h2>
                        <p style="color:#aaa; margin-bottom:30px; font-size:0.95rem; line-height:1.4;">${msg}</p>
                        <div style="display:flex; gap:10px;">
                            <button id="conf-cancel" style="flex:1; background:#222; color:white; border:none; padding:15px; border-radius:12px; font-weight:800; cursor:pointer;">CANCELAR</button>
                            <button id="conf-ok" style="flex:1; background:#00c4ff; color:black; border:none; padding:15px; border-radius:12px; font-weight:900; cursor:pointer;">CONFIRMAR</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(div);
                div.querySelector('#conf-cancel').onclick = () => { div.remove(); resolve(false); };
                div.querySelector('#conf-ok').onclick = () => { div.remove(); resolve(true); };
            });
        }

        showPremiumAlert(title, msg, type) {
            const div = document.createElement('div');
            div.style = "position:fixed; inset:0; z-index:10001; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; animation: fadeIn 0.2s;";
            div.innerHTML = `
                    <div style="background:#111; border:1px solid rgba(255,255,255,0.1); border-top:5px solid ${type === 'ERROR' ? '#FF2D55' : '#FFCC00'}; padding:35px; border-radius:24px; text-align:center; max-width:85%;">
                        <div style="color:${type === 'ERROR' ? '#FF2D55' : '#FFCC00'}; font-size:2.5rem; margin-bottom:15px;">
                            <i class="fas ${type === 'LOCK' ? 'fa-lock' : (type === 'ERROR' ? 'fa-exclamation-circle' : 'fa-info-circle')}"></i>
                        </div>
                        <h2 style="color:white; font-weight:950; font-size:1.3rem; margin-bottom:10px;">${title}</h2>
                        <p style="color:#aaa; margin-bottom:25px; font-size:0.9rem;">${msg}</p>
                        <button id="alert-ok" style="background:#222; color:white; border:1px solid #333; padding:12px 30px; border-radius:10px; font-weight:800; cursor:pointer; width:100%;">CERRAR</button>
                    </div>
                `;
            document.body.appendChild(div);
            div.querySelector('#alert-ok').onclick = () => { div.remove(); };
        }

        highlightEvent(eventId) {
            if (!eventId) return;
            // Wait for render to finish (if just navigated)
            setTimeout(() => {
                const el = document.getElementById(`event-card-${eventId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'all 0.5s';
                    el.style.boxShadow = '0 0 30px #00E36D';
                    el.style.borderColor = '#00E36D';
                    el.style.transform = 'scale(1.02)';

                    setTimeout(() => {
                        el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
                        el.style.borderColor = '#222';
                        el.style.transform = 'scale(1)';
                    }, 2000);
                }
            }, 800);
        }
    }

    // Initialize globally
    window.EventsController = new EventsController();
    console.log("✅ [EventsController] Global instance initialized at window.EventsController");

})();

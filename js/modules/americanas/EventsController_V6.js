/**
 * EventsController_V6.js
 * Optimized version: Removed embedded views and added listener cleanup.
 */
(function () {
    console.log("🔥 [EventsController_V6] SCRIPT LOADED AND EXECUTING!");

    // Global handler for results navigation - USE PREMIUM CONTROLTOWER VIEW OR ENTRENO LIVE VIEW
    window.openResultsView = (id, type) => {
        console.log("🚀 [EventsController] Opening Results for:", id, "Type:", type);

        // For Americanas & Entrenos (Unified Pro View): Wait for ControlTowerView to be ready
        const waitForControlTower = (attempts = 0) => {
            if (window.ControlTowerView && typeof window.ControlTowerView.prepareLoad === 'function') {
                console.log("✅ ControlTowerView ready, loading event");
                window.ControlTowerView.prepareLoad(id, type);
                window.Router.navigate('live');
            } else if (attempts < 20) {
                console.log(`⏳ Waiting for ControlTowerView... (attempt ${attempts + 1})`);

                // NEW: Last ditch effort if instance missing but class exists
                if (!window.ControlTowerView && window.ControlTowerViewClass) {
                    try {
                        window.ControlTowerView = new window.ControlTowerViewClass();
                        console.log("⚠️ Force-Instantiated ControlTowerView from exported class in openResultsView");
                    } catch (e) { console.error("Error force-instantiating:", e); }
                }

                setTimeout(() => waitForControlTower(attempts + 1), 150);
            } else {
                console.error("❌ ControlTowerView not available, using fallback");
                window.location.href = `resultados.html?id=${id}`;
            }
        };

        waitForControlTower();
    };

    // Global handler for live event navigation
    window.openLiveEvent = async (id, type = 'americana') => {
        if (window.EventsController) {
            return await window.EventsController.openLiveEvent(id, type);
        } else {
            console.error("❌ EventsController not initialized");
        }
    };

    // Global handler for TV Mode
    window.openTVMode = (id, type) => {
        if (window.TVView) {
            window.TVView.load(id, type);
        } else {
            console.error("❌ TVView not loaded");
        }
    };

    class EventsController {
        constructor() {
            this.state = {
                activeTab: 'events',
                americanas: [],
                entrenos: [],
                users: [],
                personalMatches: [],
                loading: true,
                viewInitialized: false,
                bgInitialized: false,
                loadingResults: false,
                currentUser: null,
                playerCache: {},
                filters: {
                    month: 'all',
                    category: 'all'
                }
            };
            this.unsubscribeEvents = null;
            this.unsubscribeEntrenos = null;
            this.unsubscribeUsers = null;
            this.autoStartInterval = null;

            // AUTO-INIT: Start Background Services Immediately
            this.startBackgroundService();
        }

        /**
         * Cleans up all active Firebase listeners and intervals.
         * Crucial for preventing memory leaks.
         */
        destroy() {
            console.log("🧹 [EventsController] Cleaning up listeners...");
            if (this.unsubscribeEvents) this.unsubscribeEvents();
            if (this.unsubscribeEntrenos) this.unsubscribeEntrenos();
            if (this.unsubscribeUsers) this.unsubscribeUsers();
            if (this.unsubscribeMatchesA) this.unsubscribeMatchesA();
            if (this.unsubscribeMatchesB) this.unsubscribeMatchesB();
            if (this.unsubscribeEntrenosA) this.unsubscribeEntrenosA();
            if (this.unsubscribeEntrenosB) this.unsubscribeEntrenosB();
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);

            this.state.bgInitialized = false;
        }

        onDataUpdate() {
            // Check if we have received at least one update for each main collection
            if (this.state.americanas && this.state.entrenos) {
                this.state.loading = false;
                if (this.state.viewInitialized) this.render();
            }
        }

        startBackgroundService() {
            if (this.state.bgInitialized) return;
            console.log("🤖 [EventsController] Starting Background Automation Service...");
            this.state.bgInitialized = true;

            // 1. Data Listeners - Use a simpler query to be more robust
            this.unsubscribeEvents = window.db.collection('americanas')
                .onSnapshot(snap => {
                    this.state.americanas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.onDataUpdate();
                }, err => console.error("Error loading americanas:", err));

            this.unsubscribeEntrenos = window.db.collection('entrenos')
                .onSnapshot(snap => {
                    this.state.entrenos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.onDataUpdate();
                }, err => console.error("Error loading entrenos:", err));

            // 2. Automation Loop (Check every 30s)
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);
            this.autoStartInterval = setInterval(() => {
                this.checkAutoStartEvents();
                if (window.AmericanaService?.processWaitlistTimeouts) {
                    window.AmericanaService.processWaitlistTimeouts();
                }
            }, 30000);
        }

        init() {
            if (this.state.viewInitialized) {
                this.render();
                return;
            }
            this.state.viewInitialized = true;
            console.log("🎟️ [EventsController_V6] UI Initialized.");

            this.state.currentUser = window.Store ? window.Store.getState('currentUser') : null;

            this.render();
        }

        setFilter(type, value) {
            if (this.state.filters[type] === value) return;
            this.state.filters[type] = value;
            this.render();
        }

        getAvailableMonths(events) {
            const months = new Set();
            events.forEach(e => {
                if (!e.normDate || e.normDate === '9999-99-99') return;
                const [y, m] = e.normDate.split('-');
                months.add(`${y}-${m}`);
            });
            return Array.from(months).sort();
        }

        renderFilterBar(events) {
            const months = this.getAvailableMonths(events);
            const currentMonth = this.state.filters.month;
            const currentCat = this.state.filters.category;
            const monthLabels = { '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC' };

            return `
                <div class="filters-container" style="padding: 10px 15px 20px; display: flex; flex-direction: column; gap: 12px; background: transparent;">
                    <!-- Month Filters -->
                    <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('month', 'all')" 
                                style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentMonth === 'all' ? '#0f172a' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; 
                                ${currentMonth === 'all' ? 'background: #0f172a; color: #fff;' : 'background: #fff; color: #64748b;'}">TODO</button>
                        ${months.map(m => {
                const [year, month] = m.split('-');
                const label = `${monthLabels[month]} '${year.slice(2)}`;
                const isActive = currentMonth === m;
                return `<button onclick="window.EventsController.setFilter('month', '${m}')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${isActive ? '#0f172a' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${isActive ? 'background: #0f172a; color: #fff;' : 'background: #fff; color: #64748b;'}">${label}</button>`;
            }).join('')}
                    </div>
                    <!-- Category Filters -->
                    <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('category', 'all')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'all' ? '#84cc16' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'all' ? 'background: #84cc16; color: #fff;' : 'background: #fff; color: #64748b;'}">TODAS</button>
                        <button onclick="window.EventsController.setFilter('category', 'male')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'male' ? '#0ea5e9' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'male' ? 'background: #0ea5e9; color: #fff;' : 'background: #fff; color: #64748b;'}">MASCULINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'female')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'female' ? '#ec4899' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'female' ? 'background: #ec4899; color: #fff;' : 'background: #fff; color: #64748b;'}">FEMENINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'mixed')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'mixed' ? '#84cc16' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'mixed' ? 'background: #84cc16; color: #fff;' : 'background: #fff; color: #64748b;'}">MIXTA</button>
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
            const normalize = (d) => {
                if (!d) return '9999-99-99';
                if (d.includes('/')) {
                    const [day, month, year] = d.split('/');
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                return d;
            };

            const all = [
                ...(this.state.americanas || []).map(e => ({ ...e, type: 'americana', normDate: normalize(e.date) })),
                ...(this.state.entrenos || []).map(e => ({ ...e, type: 'entreno', normDate: normalize(e.date) }))
            ];

            return all.sort((a, b) => {
                if (a.normDate === b.normDate) return (a.time || '').localeCompare(b.time || '');
                return a.normDate.localeCompare(b.normDate);
            });
        }

        _parseDate(dateStr, timeStr) {
            if (!dateStr) return null;
            try {
                let dateBase = dateStr;
                if (dateStr.includes('/')) {
                    const [d, m, y] = dateStr.split('/');
                    dateBase = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }

                const start = timeStr ?
                    new Date(`${dateBase}T${timeStr.split('-')[0].trim()}:00`) :
                    new Date(`${dateBase}T00:00:00`);

                const end = (timeStr && timeStr.includes('-')) ?
                    new Date(`${dateBase}T${timeStr.split('-')[1].trim()}:00`) :
                    new Date(start.getTime() + 120 * 60000);

                return { start, end };
            } catch (e) {
                console.error("Error parsing date:", dateStr, timeStr, e);
                return null;
            }
        }

        hasEventStarted(dateStr, timeStr) {
            const times = this._parseDate(dateStr, timeStr);
            return times ? new Date() >= times.start : false;
        }

        getEventTimes(dateStr, timeStr) {
            return this._parseDate(dateStr, timeStr);
        }

        checkAutoStartEvents() {
            if (!this.state.americanas || !this.state.entrenos) return;
            const allEvents = [
                ...this.state.americanas.map(e => ({ ...e, type: 'americana' })),
                ...this.state.entrenos.map(e => ({ ...e, type: 'entreno' }))
            ];

            const now = new Date();

            allEvents.forEach(evt => {
                const times = this.getEventTimes(evt.date, evt.time);
                if (!times) return;

                const players = evt.players || evt.registeredPlayers || [];
                const defaultCourts = evt.name && evt.name.toUpperCase().includes('TWISTER') ? 3 : 4;
                const maxCourts = parseInt(evt.max_courts || evt.courts || defaultCourts);
                const requiredPlayers = maxCourts * 4;
                const isFull = players.length >= requiredPlayers;

                if (evt.status === 'open' && isFull) {
                    const diffMs = times.start - now;
                    const diffHours = diffMs / (1000 * 60 * 60);

                    // Changed from 4 to 3 hours as per user request
                    if (diffHours <= 3 && diffHours > 0) {
                        console.log(`⏰ [AutoAutomation] OPEN -> PAIRING (3h trigger): ${evt.name}`);
                        if (window.EventService && window.AmericanaService) {
                            window.EventService.updateEvent(evt.type, evt.id, { status: 'pairing' })
                                .then(() => window.AmericanaService.generateFirstRoundMatches(evt.id, evt.type))
                                .catch(e => console.error(e));
                        }
                    }
                }

                if (evt.status === 'open' || evt.status === 'pairing') {
                    if (now >= times.start && now < times.end) {
                        if (isFull) {
                            console.log(`⏰ [AutoAutomation] ${evt.status.toUpperCase()} -> LIVE: ${evt.name}`);
                            if (window.EventService && window.AmericanaService) {
                                window.EventService.updateEvent(evt.type, evt.id, { status: 'live' })
                                    .then(() => window.AmericanaService.generateFirstRoundMatches(evt.id, evt.type))
                                    .catch(e => console.error(e));
                            }
                        }
                    }
                }

                if (evt.status === 'live' && now >= times.end) {
                    console.log(`🏁 [AutoAutomation] LIVE -> FINISHED: ${evt.name}`);
                    if (window.EventService) {
                        window.EventService.updateEvent(evt.type, evt.id, { status: 'finished' })
                            .then(() => {
                                // 🤖 TRIGGER CAPTAIN ANALYSIS FOR ENTRENOS
                                if (evt.type === 'entreno' && window.CaptainView) {
                                    console.log(`🤖 [Captain] Auto-launching post-event analysis for: ${evt.name}`);
                                    setTimeout(() => {
                                        window.CaptainView.open(evt);
                                    }, 2000); // Small delay to ensure data is synced
                                }
                            })
                            .catch(e => console.error(e));
                    }
                }
            });
        }

        async setTab(tabName) {
            console.log("🎯 [EventsController_V6] setTab called with:", tabName);
            this.state.activeTab = tabName;

            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }

            if (tabName === 'results' && this.state.currentUser) {
                if (this.state.resultsInitialized) {
                    // Already initialized and listening. Just render.
                    await this.render();
                } else {
                    this.state.loadingResults = true;
                    this.state.resultsInitialized = true;
                    await this.render();

                    if (window.currentUser) {
                        this.state.currentUser = window.currentUser;
                    }
                    const uid = this.state.currentUser ? this.state.currentUser.uid : null;
                    if (!uid) return;

                    const updatePersonalMatches = () => {
                        const all = [
                            ...(this.state.rawMatchesA || []),
                            ...(this.state.rawMatchesB || []),
                            ...(this.state.rawEntrenosA || []),
                            ...(this.state.rawEntrenosB || [])
                        ].filter(m => m.status === 'finished');

                        const unique = [];
                        const seen = new Set();
                        all.forEach(m => {
                            if (!seen.has(m.id)) {
                                seen.add(m.id);
                                unique.push(m);
                            }
                        });

                        this.state.personalMatches = unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                        this.state.loadingResults = false;
                        this.render();
                    };

                    this.unsubscribeMatchesA = window.db.collection('matches').where('team_a_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawMatchesA = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                    this.unsubscribeMatchesB = window.db.collection('matches').where('team_b_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawMatchesB = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                    this.unsubscribeEntrenosA = window.db.collection('entrenos_matches').where('team_a_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawEntrenosA = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                    this.unsubscribeEntrenosB = window.db.collection('entrenos_matches').where('team_b_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawEntrenosB = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                }
            } else {
                await this.render();
            }
        }


        async loadEvents() {
            // Background service manages real-time updates now.
            // We just ensure we have data or show loader if empty.
            if (this.state.entrenos.length === 0 && this.state.americanas.length === 0) {
                this.showLoader();
            } else {
                this.state.loading = false;
                this.render();
            }
        }

        async render() {
            const container = document.getElementById('content-area');
            if (!container) return;

            const tabs = [
                { id: 'entrenos', label: 'ENTRENOS', icon: 'fa-user-ninja' },
                { id: 'events', label: 'AMERICANAS', icon: 'fa-trophy' },
                { id: 'agenda', label: 'AGENDA', icon: 'fa-circle' },
                { id: 'help', label: 'INFO', icon: 'fa-info-circle' },
                { id: 'finished', label: 'FINALIZADOS', icon: 'fa-history' }
            ];

            const navHtml = `
                <div class="events-submenu-container" style="background: #232a32; padding: 10px 4px; border-bottom: 2px solid #CCFF00; margin-bottom: 0px; display: flex; justify-content: space-around; box-shadow: 0 8px 32px rgba(0,0,0,0.5); position: sticky; top: 148px; z-index: 12000; backdrop-filter: blur(10px);">
                    ${tabs.map(tab => {
                const isActive = this.state.activeTab === tab.id;
                const isPadelBall = tab.id === 'agenda';

                return `
                <button onclick="window.EventsController.setTab('${tab.id}')" 
                                style="background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px; color: ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.4)'}; font-weight: 800; padding: 8px 4px; font-size: 0.55rem; cursor: pointer; transition: all 0.2s ease; flex: 1; letter-spacing: 0.3px; position: relative; min-width: 0;">
                            <div style="width: 44px; height: 44px; border-radius: 14px; background: ${isActive ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)'}; display: flex; align-items: center; justify-content: center; border: 1.5px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.1)'}; transition: all 0.3s; box-shadow: ${isActive ? '0 0 15px rgba(204,255,0,0.3)' : 'none'}; margin-bottom: 2px;">
                                ${isPadelBall ?
                        `<div style="width: 22px; height: 22px; background: ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.5)'}; border-radius: 50%; position: relative; border: 2px solid ${isActive ? '#000' : 'transparent'};">
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

            let contentHtml = '';
            if (this.state.loading) {
                contentHtml = '<div style="padding:40px; text-align:center;"><div class="loader"></div><p style="color:#888; margin-top:10px;">Cargando datos...</p></div>';
            } else {
                switch (this.state.activeTab) {
                    case 'events': contentHtml = this.renderEventsList(false, false); break;
                    case 'entrenos': contentHtml = this.renderEventsList(false, true); break;
                    case 'agenda': contentHtml = this.renderAgendaView(); break;
                    case 'results': contentHtml = await this.renderResultsView(); break;
                    case 'finished': contentHtml = this.renderFinishedView(); break;
                    case 'help': contentHtml = window.ControlTowerView ? window.ControlTowerView.renderHelpContent() : '<div style="padding:40px; color:white;">Cargando ayuda...</div>'; break;
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;

            // TRIGGER ASYNC CONTENT FOR ENTRENOS
            if (this.state.activeTab === 'entrenos') {
                this.loadSynergyWidget();
            }
        }

        async loadSynergyWidget() {
            const root = document.getElementById('predictive-synergy-entrenos-root');
            if (!root) return;

            const user = (window.Store ? window.Store.getState('currentUser') : null) || window.currentUser;
            if (!user) {
                root.innerHTML = `<div style="padding:20px; color:rgba(255,255,255,0.4); text-align:center;">🔒 Inicia sesión para ver tu análisis</div>`;
                return;
            }

            if (!window.DashboardView || !window.DashboardView.renderPredictiveSynergy) {
                console.warn("DashboardView not ready for synergy");
                return;
            }

            // Subscribirse si existe el servicio
            const userId = user.uid || user.id;
            if (window.PartnerSynergyService && window.PartnerSynergyService.subscribeToPlayerData) {
                window.PartnerSynergyService.subscribeToPlayerData(userId, async () => {
                    if (document.getElementById('predictive-synergy-entrenos-root')) {
                        const html = await window.DashboardView.renderPredictiveSynergy();
                        const newRoot = document.getElementById('predictive-synergy-entrenos-root');
                        if (newRoot && html) newRoot.innerHTML = html;
                    }
                });
            }

            // Initial Render
            const html = await window.DashboardView.renderPredictiveSynergy();
            if (html && document.getElementById('predictive-synergy-entrenos-root')) {
                document.getElementById('predictive-synergy-entrenos-root').innerHTML = html;
            }
        }

        renderEntrenoGuideModal() {
            const modalId = 'entreno-guide-modal';
            if (document.getElementById(modalId)) return;

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 13000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease; padding: 20px; box-sizing: border-box;`;

            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); width: 100%; max-width: 500px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <div style="padding: 25px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin:0; color: white; font-size: 1.4rem; font-weight: 800; font-family: 'Outfit', sans-serif;"><span style="color: #CCFF00;">INFO</span> ENTRENOS</h2>
                        <button id="close-guide-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fas fa-times"></i></button>
                    </div>
                    <div style="padding: 25px; overflow-y: auto; max-height: 70vh;">
                        <div style="margin-bottom: 30px;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                <div style="width: 40px; height: 40px; background: rgba(56, 189, 248, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-lock" style="color: #38bdf8; font-size: 1.2rem;"></i></div>
                                <h3 style="margin:0; color: white; font-size: 1.1rem; font-weight: 700;">Pareja Fija</h3>
                            </div>
                            <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 0.95rem; line-height: 1.6; list-style-type: disc;">
                                <li style="margin-bottom: 8px;">Juegas con tu compañero asignado todo el torneo.</li>
                                <li style="margin-bottom: 8px;">Si <strong>ganáis</strong>, subís de pista juntos.</li>
                                <li style="margin-bottom: 8px;">Si <strong>perdéi</strong>s, bajáis de pista juntos.</li>
                            </ul>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                <div style="width: 40px; height: 40px; background: rgba(236, 72, 153, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-random" style="color: #ec4899; font-size: 1.2rem;"></i></div>
                                <h3 style="margin:0; color: white; font-size: 1.1rem; font-weight: 700;">Twister (Individual)</h3>
                            </div>
                            <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 0.95rem; line-height: 1.6; list-style-type: disc;">
                                <li style="margin-bottom: 8px;">Te apuntas individualmente.</li>
                                <li style="margin-bottom: 8px;">Si ganas, <strong>TÚ</strong> subes de pista y te cambias de pareja.</li>
                                <li style="margin-bottom: 8px;">Si pierdes, <strong>TÚ</strong> bajas de pista y te cambias de pareja.</li>
                            </ul>
                        </div>
                    </div>
                    <div style="padding: 20px 25px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                        <button id="close-guide-action" style="background: #CCFF00; color: black; border: none; padding: 14px 40px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; width: 100%;">¡ENTENDIDO!</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            const close = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 300); };
            document.getElementById('close-guide-btn').onclick = close;
            document.getElementById('close-guide-action').onclick = close;
        }

        renderEventsList(onlyMine, onlyEntrenos = false, showBothTypes = false) {
            let events = this.getAllSortedEvents();
            const { month, category } = this.state.filters;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            const todayStr = this.getTodayStr();

            if (!onlyMine) {
                events = events.filter(e => {
                    const isCorrectType = showBothTypes ? true : (onlyEntrenos ? e.type === 'entreno' : e.type === 'americana');

                    // Si el evento está finalizado o anulado, no va en esta pestaña
                    if (e.status === 'finished' || e.status === 'cancelled') return false;

                    if (e.status === 'live') return isCorrectType;
                    return e.normDate >= todayStr && isCorrectType;
                });
            } else if (onlyMine) {
                if (!uid) return '<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>';
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            if (month !== 'all') events = events.filter(e => e.normDate.startsWith(month));
            if (category !== 'all') events = events.filter(e => e.category === category);

            const eventsHtml = events.map(evt => this.renderCard(evt)).join('');
            const filterBarHtml = !onlyMine ? this.renderFilterBar(this.getAllSortedEvents().filter(e => e.status !== 'finished' && (e.status === 'live' || e.normDate >= todayStr))) : '';

            return `
                <div style="min-height: 80vh; padding-top: 5px;">
                    <style>
                        @keyframes ball-physics {
                            0% { transform: translateY(0) scale(1) rotate(0deg); box-shadow: 0 0 15px rgba(204,255,0,0.4); }
                            15% { transform: translateY(-30px) scale(0.9, 1.1) rotate(45deg); box-shadow: 0 0 40px rgba(204,255,0,0.8); }
                            30% { transform: translateY(0) scale(1.2, 0.8) rotate(90deg); box-shadow: 0 0 20px rgba(204,255,0,0.6); }
                            45% { transform: translateY(-15px) scale(0.95, 1.05) rotate(135deg); box-shadow: 0 0 30px rgba(204,255,0,0.7); }
                            60% { transform: translateY(0) scale(1.1, 0.9) rotate(180deg); box-shadow: 0 0 15px rgba(204,255,0,0.5); }
                            100% { transform: translateY(0) scale(1) rotate(360deg); box-shadow: 0 0 15px rgba(204,255,0,0.4); }
                        }
                        @keyframes internal-spin {
                            0% { transform: rotate(0deg) scale(1); filter: brightness(1); }
                            50% { transform: rotate(180deg) scale(1.1); filter: brightness(1.3); }
                            100% { transform: rotate(360deg) scale(1); filter: brightness(1); }
                        }
                        @keyframes neon-flicker {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.8; transform: scale(1.02); }
                        }
                        .padel-ball-live {
                            animation: ball-physics 3s cubic-bezier(0.45, 0, 0.55, 1) infinite;
                        }
                        .ball-inner-spin {
                            animation: internal-spin 2s linear infinite;
                        }
                    </style>
                    <div style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #000000 100%); border-radius: 20px; margin: 15px; box-shadow: 0 0 25px rgba(204,255,0,0.25); border: 2px solid #CCFF00; position: relative; overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                            <div class="padel-ball-live" style="width: 44px; height: 44px; background: #000; border: 2.5px solid #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <div class="ball-inner-spin" style="width: 28px; height: 28px; background: radial-gradient(circle at 30% 30%, #e5ff00, #CCFF00 60%, #b3e600); border-radius: 50%; position: relative; box-shadow: inset -2px -2px 5px rgba(0,0,0,0.2);">
                                    <!-- Padel Seams -->
                                    <div style="position:absolute; top:0; left:20%; width:60%; height:100%; border:1.5px solid rgba(255,255,255,0.6); border-radius:50%; border-top:none; border-bottom:none; opacity: 0.7;"></div>
                                    <div style="position:absolute; top:20%; left:0; width:100%; height:60%; border:1.5px solid rgba(255,255,255,0.6); border-radius:50%; border-left:none; border-right:none; opacity: 0.7;"></div>
                                </div>
                            </div>
                            <div>
                                <h2 style="font-size: 1.15rem; font-weight: 950; margin: 0; color: white;">Eventos <span style="color: #CCFF00;">App Somospadel BCN</span></h2>
                                <p style="color: rgba(204,255,0,0.9); font-size: 0.65rem; font-weight: 850; text-transform: uppercase;">¡Apúntate en tiempo real!</p>
                            </div>
                        </div>
                        <div style="background: #000; padding: 6px 14px; border-radius: 14px; border: 1.5px solid #00E36D; color: white; font-weight: 950;"><i class="fas fa-bolt" style="color: #00E36D;"></i> ${events.length}</div>
                    </div>
                    ${filterBarHtml}
                    <div style="padding-bottom: 120px; padding-left:10px; padding-right:10px;">
                        ${events.length === 0 ? `<div style="padding:100px 40px; text-align:center; color:#444;"><i class="fas fa-filter" style="font-size: 4rem; opacity: 0.1;"></i><h3 style="color:#666;">SIN RESULTADOS</h3></div>` : eventsHtml}
                        ${(this.state.activeTab === 'entrenos') ? `
                        <div style="margin-top: 25px; display: flex; flex-direction: column; align-items: center; padding-bottom: 20px; gap: 20px;">
                            <button onclick="window.EventsController.renderEntrenoGuideModal()" style="background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 12px 25px; border-radius: 30px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-info-circle" style="color: #CCFF00;"></i> ¿CÓMO FUNCIONAN LOS FORMATOS?
                            </button>

                            <!-- PREDICTIVE SYNERGY WIDGET (MIRROR FROM DASHBOARD) -->
                            <div id="predictive-synergy-entrenos-root" style="width: 100%; max-width: 500px; margin: 0 auto;">
                                <div style="text-align: center; padding: 30px; color: rgba(255,255,255,0.2); font-weight: 800; background: rgba(0,0,0,0.1); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1);">
                                    <i class="fas fa-brain fa-spin" style="margin-bottom: 10px; font-size: 1.2rem; color: #CCFF00;"></i><br>
                                    Cargando tu compatibilidad...
                                </div>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `;
        }

        renderAgendaView() {
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            if (!uid) return `<div style="text-align:center; padding:80px 20px; color:#888;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px; opacity:0.1;"></i><br><h3 style="color:#64748b;">ACCESO RESTRINGIDO</h3><p style="font-size:0.85rem;">Inicia sesión para ver tu agenda.</p></div>`;

            const todayStr = this.getTodayStr();
            const myEvents = this.getAllSortedEvents().filter(e => {
                if (e.status === 'finished') return false;
                if (e.normDate < todayStr && e.status !== 'live') return false;
                const players = e.players || e.registeredPlayers || [];
                return players.some(p => p.uid === uid || p.id === uid);
            });

            return `
                <div style="padding: 25px 20px; background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%); min-height: 80vh; font-family: 'Outfit', sans-serif;">
                    <div style="margin-bottom: 30px; position: relative;">
                        <span style="background: rgba(204, 255, 0, 0.15); color: #84cc16; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; letter-spacing: 0.5px; border: 1px solid rgba(132, 204, 22, 0.2);">PRÓXIMOS RETOS</span>
                        <h2 style="font-size: 2.2rem; font-weight: 950; color: #0f172a; margin: 12px 0 5px;">Mi <span style="color: #84cc16;">Agenda</span></h2>
                        <div style="width: 50px; height: 4px; background: #CCFF00; border-radius: 10px;"></div>
                    </div>

                    ${myEvents.length === 0 ? `
                        <div style="text-align:center; padding: 80px 30px; background: white; border-radius: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
                            <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                                <i class="fas fa-calendar-times" style="font-size: 2rem; color: #cbd5e1;"></i>
                            </div>
                            <h3 style="color: #1e293b; font-weight: 900; font-size: 1.4rem; margin-bottom: 10px;">SIN PLANES</h3>
                            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 30px;">¡No te quedes fuera! Apúntate a un evento y empieza a sumar puntos.</p>
                            <button onclick="window.EventsController.setTab('events')" style="background: #0f172a; color: white; border: none; padding: 16px 32px; border-radius: 18px; font-weight: 800; cursor: pointer; transition: transform 0.2s;">BUSCAR AMERICANAS</button>
                        </div>
                    ` : `
                        <div style="padding-bottom: 120px; display: flex; flex-direction: column; gap: 0px; position: relative;">
                            <!-- Vertical Line -->
                            <div style="position: absolute; left: 30px; top: 10px; bottom: 40px; width: 2px; background: linear-gradient(to bottom, #CCFF00, #e2e8f0); z-index: 1;"></div>
                            
                            ${myEvents.map((evt, idx) => {
                const times = this._parseDate(evt.date);
                const d = times ? times.start : new Date();
                const isLive = evt.status === 'live';

                return `
                                <div style="display: flex; gap: 20px; margin-bottom: 30px; position: relative; z-index: 2;">
                                    <div style="min-width: 62px; height: 62px; background: ${isLive ? '#CCFF00' : 'white'}; border: 3px solid ${isLive ? '#CCFF00' : '#e2e8f0'}; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 8px 15px rgba(0,0,0,0.08); transition: transform 0.3s ease;">
                                        <span style="font-size: 0.65rem; font-weight: 900; color: ${isLive ? '#000' : '#94a3b8'};">${d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</span>
                                        <span style="font-size: 1.4rem; font-weight: 950; color: ${isLive ? '#000' : '#0f172a'}; line-height: 1;">${d.getDate()}</span>
                                    </div>
                                    <div style="flex: 1; background: white; border-radius: 26px; padding: 22px; border: 1px solid ${isLive ? '#CCFF00' : '#e2e8f0'}; box-shadow: 0 10px 25px rgba(0,0,0,0.03); position: relative; overflow: hidden;">
                                        ${isLive ? `<div style="position: absolute; top: 0; right: 0; background: #FF2D55; color: white; padding: 4px 12px; font-size: 0.6rem; font-weight: 900; border-bottom-left-radius: 12px; animation: pulse 2s infinite;">LIVE NOW</div>` : ''}
                                        
                                        <div style="font-size: 0.65rem; font-weight: 800; color: #84cc16; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">${evt.type === 'entreno' ? 'Entreno Pro' : 'Americana'}</div>
                                        <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 900; line-height: 1.2;">${evt.name}</h3>
                                        
                                        <div style="display: flex; gap: 15px; margin: 15px 0 20px; color: #64748b; font-size: 0.8rem; font-weight: 600;">
                                            <span><i class="far fa-clock" style="color: #CCFF00; margin-right: 5px;"></i> ${evt.time}</span>
                                            <span><i class="fas fa-map-marker-alt" style="color: #64748b; margin-right: 5px;"></i> SomosPadel BCN</span>
                                        </div>
                                        
                                        <button onclick="window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}');" 
                                                style="width: 100%; padding: 14px; background: ${isLive ? '#CCFF00' : '#0f172a'}; color: ${isLive ? '#000' : '#fff'}; border: none; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; box-shadow: ${isLive ? '0 5px 15px rgba(204,255,0,0.3)' : 'none'};">
                                            ${isLive ? '<i class="fas fa-play"></i> ENTRAR EN PISTA' : 'GESTIONAR MI PLAZA'}
                                        </button>
                                    </div>
                                </div>`;
            }).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        renderFinishedView() {
            const todayStr = this.getTodayStr();
            const { month, category } = this.state.filters;
            let finishedEvents = this.getAllSortedEvents().filter(e => e.status === 'finished' || e.status === 'cancelled' || e.date < todayStr);
            if (month !== 'all') finishedEvents = finishedEvents.filter(e => e.date.startsWith(month));
            if (category !== 'all') finishedEvents = finishedEvents.filter(e => e.category === category);

            return `
                <div style="padding: 25px; background: #f8fafc; min-height: 80vh; font-family: 'Outfit', sans-serif;">
                    <div style="margin-bottom: 10px;">
                        <span style="background: rgba(100, 116, 139, 0.1); color: #64748b; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800;">Archivo Histórico</span>
                        <h2 style="font-size: 2rem; font-weight: 950; color: #0f172a; margin: 10px 0;">Eventos <span style="color: #64748b;">Pasados</span></h2>
                    </div>
                    ${this.renderFilterBar(this.getAllSortedEvents().filter(e => e.status === 'finished' || e.date < todayStr))}
                    <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 120px;">
                        ${finishedEvents.length ? finishedEvents.map(evt => this.renderCard(evt, true)).join('') : '<p style="text-align:center; padding:40px; color:#94a3b8;">No hay eventos finalizados.</p>'}
                    </div>
                </div>
            `;
        }

        async renderResultsView() {
            const matches = this.state.personalMatches || [];
            const user = this.state.currentUser;

            if (this.state.loadingResults) return '<div style="padding:100px; text-align:center;"><div class="loader"></div></div>';
            if (!user) return '<div style="padding:80px; text-align:center; color:white;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px; opacity:0.2;"></i><p>Inicia sesión.</p></div>';

            const realMatches = matches.filter(m => {
                const s1 = parseInt(m.score_a || 0), s2 = parseInt(m.score_b || 0);
                if (s1 === 0 && s2 === 0) return false;
                if ((s1 + s2) < 2) return false;
                const hasNamesA = Array.isArray(m.team_a_names) && m.team_a_names.length > 0;
                const hasNamesB = Array.isArray(m.team_b_names) && m.team_b_names.length > 0;
                return hasNamesA && hasNamesB;
            });

            // === AI OPTIMIZATION: USE CENTRALIZED SERVICE (AUDIT FIX) ===
            let totalMatches = realMatches.length;
            let totalWins = 0;
            let winRate = 0;

            if (window.StandingsService && totalMatches > 0) {
                const stats = window.StandingsService.calculate(realMatches);
                const userStats = stats.find(p => p.uid === user.uid);
                if (userStats) {
                    totalWins = userStats.won;
                    winRate = Math.round((totalWins / totalMatches) * 100);
                }
            }

            return `
                <div style="padding: 20px 15px 120px; background: #080808; min-height: 90vh; font-family: 'Outfit', sans-serif; color: white; text-align: center;">
                    <div style="width: 80px; height: 80px; margin: 20px auto; border-radius: 50%; border: 2px solid #CCFF00; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        ${user.photoURL ? `<img src="${user.photoURL}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="color:#CCFF00; font-size:2rem;">${(user.name || 'P').charAt(0)}</span>`}
                    </div>
                    <h2>${user.name || 'Jugador'}</h2>
                    ${totalMatches === 0 ? '<p>No hay datos. ¡Juega tu primer torneo!</p>' : `
                        <div style="background: rgba(255,255,255,0.03); border-radius: 20px; padding: 20px; display: flex; justify-content: space-around; margin: 20px 0;">
                            <div><div style="font-size: 1.5rem; color:#CCFF00;">${totalMatches}</div><div>PARTIDOS</div></div>
                            <div><div style="font-size: 1.5rem;">${winRate}%</div><div>WINS</div></div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">${(await this.renderMatchCards(realMatches, user))}</div>
                    `}
                </div>
            `;
        }

        renderMatchCards(matches, user) {
            const list = [...matches].reverse();
            return list.map((m) => {
                const s1 = parseInt(m.score_a || 0), s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(user.uid);
                const won = (s1 === s2) ? null : ((isTeamA && s1 > s2) || (!isTeamA && s2 > s1));
                const color = won === null ? '#888' : (won ? '#CCFF00' : '#FF3B30');

                return `
                    <div style="background: #111; border-radius: 12px; height: 60px; display: flex; align-items: center; border-left: 5px solid ${color}; padding: 0 15px; justify-content: space-between;">
                        <span style="font-size:0.8rem;">${(m.team_a_names[0] || '').split(' ')[0]} vs ${(m.team_b_names[0] || '').split(' ')[0]}</span>
                        <div style="background:#222; padding:5px 10px; border-radius:8px;">${s1} - ${s2}</div>
                        <span style="color:${color}; font-weight:900;">${won === null ? '=' : (won ? 'W' : 'L')}</span>
                    </div>`;
            }).join('');
        }

        renderCard(evt, isFinished = false) {
            const players = evt.players || evt.registeredPlayers || [];
            const playerCount = players.length;
            const maxCourts = parseInt(evt.max_courts || evt.courts || 4);
            const maxPlayers = maxCourts * 4;
            const user = this.state.currentUser;
            const uid = user ? user.uid : '-';
            const isJoined = players.some(p => p.uid === uid || p.id === uid);
            const isFull = playerCount >= maxPlayers;
            const hasStarted = this.hasEventStarted(evt.date, evt.time);
            const isLive = evt.status === 'live' || (evt.status === 'open' && hasStarted);
            const isPairing = evt.status === 'pairing';
            const isCancelled = evt.status === 'cancelled';

            // Waitlist Logic
            const waitlist = evt.waitlist || [];
            const isWaitlistPending = evt.waitlist_pending_user && (evt.waitlist_pending_user.uid === uid);
            const isInWaitlist = waitlist.some(p => p.uid === uid);
            const waitlistPos = waitlist.findIndex(p => p.uid === uid) + 1;

            // Date Parsing
            const dateObj = this._parseDate(evt.date);
            const dayNum = dateObj ? dateObj.start.getDate() : '--';
            const dayName = dateObj ? dateObj.start.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', '') : '---';

            // Prices (Unified Field Names with Admin Panel)
            const priceSoc = evt.price_members || evt.price_socio || evt.price_member || '20€';
            const priceExt = evt.price_external || evt.price_externo || evt.price_external || '25€';

            // Category & Format Logic
            const catMap = { 'male': 'MASCULINO', 'female': 'FEMENINO', 'mixed': 'MIXTO', 'open': 'OPEN' };
            const categoryLabel = catMap[evt.category] || (evt.category || 'MASCULINO').toUpperCase();

            // Dynamic Icons and Colors per Category
            let categoryIcon = 'fa-mars';
            let categoryColor = '#38bdf8'; // Blue Default

            if (evt.category === 'female') {
                categoryIcon = 'fa-venus';
                categoryColor = '#ea4c89'; // Pink
            } else if (evt.category === 'mixed') {
                categoryIcon = 'fa-venus-mars';
                categoryColor = '#eab308'; // Yellow
            } else if (evt.category === 'open') {
                categoryIcon = 'fa-globe';
                categoryColor = '#84cc16'; // Green
            }

            // Event Format / Mode Logic (Robust detection)
            const mode = (evt.pair_mode || evt.format || '').toLowerCase();
            const nameUpper = (evt.name || '').toUpperCase();

            let isTwister = nameUpper.includes('TWISTER') || mode.includes('twister');
            let isRotating = nameUpper.includes('ROTATIVO') || mode.includes('rotating') || mode.includes('rotativo');
            let isFixed = nameUpper.includes('FIJA') || mode.includes('fixed') || mode.includes('fija');

            let formatLabel = 'PAREJA FIJA';
            let formatColor = '#a855f7'; // Purple for Fixed

            if (isTwister || isRotating) {
                formatLabel = 'TWISTER';
                formatColor = '#38bdf8'; // Blue for Twister
            }

            // Time Formatting (Range)
            const times = this._parseDate(evt.date, evt.time);
            let timeLabel = evt.time;
            if (times && !evt.time.includes('-')) {
                const pad = n => n.toString().padStart(2, '0');
                timeLabel = `${pad(times.start.getHours())}:${pad(times.start.getMinutes())} - ${pad(times.end.getHours())}:${pad(times.end.getMinutes())}`;
            }

            // Gender logical check
            const userGender = user ? (user.gender || '').toLowerCase() : '';
            const isChico = userGender === 'm' || userGender === 'chico';
            const isChica = userGender === 'f' || userGender === 'chica';
            const cat = (evt.category || 'open').toLowerCase();
            let isGenderMismatch = false;
            let mismatchCase = ''; // 'male', 'female', 'none'
            if (cat === 'male' && !isChico) { isGenderMismatch = true; mismatchCase = 'male'; }
            if (cat === 'female' && !isChica) { isGenderMismatch = true; mismatchCase = 'female'; }
            if (cat === 'mixed' && !isChico && !isChica) { isGenderMismatch = true; mismatchCase = 'none'; }

            // Button Logic
            let cardAction = `window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}')`;
            let fabAction = cardAction;
            let btnLabel = 'ENTRAR';
            let btnIcon = 'fa-play';
            let btnColor = '#CCFF00';

            if (isCancelled) {
                btnLabel = 'ANULADO'; btnIcon = 'fa-ban'; btnColor = '#ef4444'; // Red
                cardAction = "alert('⛔ Este evento ha sido cancelado por la organización.')";
                fabAction = cardAction;
            } else if (isFinished || evt.status === 'finished') {
                btnLabel = 'VER'; btnIcon = 'fa-history'; btnColor = '#64748b';
                cardAction = `window.openResultsView('${evt.id}', '${evt.type || 'americana'}')`;
                fabAction = cardAction;
            } else if (isPairing) {
                btnLabel = 'VER PAREJAS'; btnIcon = 'fa-list-ol'; btnColor = '#38bdf8';
                fabAction = cardAction;
            } else if (isLive) {
                btnLabel = 'LIVE'; btnIcon = 'fa-broadcast-tower'; btnColor = '#FF2D55';
                fabAction = cardAction;
            } else if (isWaitlistPending) {
                btnLabel = '¡NUEVA PLAZA! CONFIRMAR'; btnIcon = 'fa-star'; btnColor = '#CCFF00';
                fabAction = `window.EventsController.confirmWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (isGenderMismatch && !isJoined) {
                if (mismatchCase === 'male') { btnLabel = 'SOLO CHICOS'; btnIcon = 'fa-lock'; }
                else if (mismatchCase === 'female') { btnLabel = 'SOLO CHICAS'; btnIcon = 'fa-lock'; }
                else { btnLabel = 'GENERO?'; btnIcon = 'fa-user-cog'; }

                btnColor = '#4b5563';
                const msg = mismatchCase === 'none' ? 'Debes definir tu género en el perfil para apuntarte a un evento Mixto.' : `Este evento es exclusivo para ${mismatchCase === 'male' ? 'HOMBRES' : 'MUJERES'}.`;
                fabAction = `alert('⚠️ ${msg}')`;
            } else if (isInWaitlist) {
                btnLabel = `ESPERA (Pos ${waitlistPos})`; btnIcon = 'fa-hourglass-half'; btnColor = '#94a3b8';
                fabAction = `window.EventsController.leaveWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (isFull && !isJoined) {
                btnLabel = 'LISTA ESPERA'; btnIcon = 'fa-clock'; btnColor = '#eab308';
                fabAction = `window.EventsController.joinWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (!isJoined && !isFull) {
                btnLabel = 'APUNTARME'; btnIcon = 'fa-plus'; btnColor = '#CCFF00';
                fabAction = `window.EventsController.joinEvent('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (isJoined) {
                btnLabel = 'DENTRO'; btnIcon = 'fa-check'; btnColor = '#fff';
                fabAction = `window.EventsController.leaveEvent('${evt.id}', '${evt.type || 'americana'}')`;
            }

            return `
                <div onclick="${cardAction}" style="background: #000; border-radius: 28px; overflow: hidden; margin-bottom: 25px; border: 1px solid #222; box-shadow: 0 15px 35px rgba(0,0,0,0.4); font-family: 'Outfit', sans-serif; cursor: pointer;">
                    <!-- TOP IMAGE AREA -->
                    <div style="height: 200px; background: url('${(evt.image_url || 'img/padel-event.jpg').replace(/ /g, '%20')}') no-repeat center/cover; position: relative;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent, rgba(0,0,0,0.8));"></div>
                        
                        <!-- DATE BADGE -->
                        <div style="position: absolute; top: 15px; left: 15px; background: #fff; width: 70px; height: 70px; border-radius: 20px; border: 3px solid #CCFF00; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                            <div style="font-size: 0.7rem; font-weight: 900; color: #84cc16;">${dayName}</div>
                            <div style="font-size: 1.8rem; font-weight: 950; color: #000; line-height: 1;">${dayNum}</div>
                        </div>

                        <!-- PRICES -->
                        <div style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); color: white; padding: 8px 15px; border-radius: 12px; font-size: 0.75rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px;">
                            <span>${priceSoc}€ <small style="color:#888; font-size:0.6rem;">SOC</small></span>
                            <span style="border-left: 1px solid #444; padding-left: 10px;">${priceExt}€ <small style="color:#888; font-size:0.6rem;">EXT</small></span>
                        </div>

                        <!-- STATUS / PAREJAS BADGE -->
                        ${isCancelled ? `
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(20,20,20,0.85); backdrop-filter: grayscale(100%); z-index: 5; display: flex; align-items: center; justify-content: center;">
                            <div style="border: 4px solid #ef4444; color: #ef4444; padding: 10px 30px; border-radius: 12px; font-size: 2rem; font-weight: 900; transform: rotate(-15deg); text-transform: uppercase; letter-spacing: 5px; box-shadow: 0 0 30px rgba(239,68,68,0.3);">
                                ANULADO
                            </div>
                        </div>
                        ` : ''}

                        ${isPairing && !isCancelled ? `
                        <div style="position: absolute; top: 60px; right: 15px; background: rgba(0,183,255,0.2); border: 1px solid #00B7FF; color: #00B7FF; padding: 6px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 900; display: flex; align-items: center; gap: 8px; backdrop-filter: blur(5px);">
                            <i class="fas fa-random"></i> EMPAREJAMIENTO
                        </div>
                        ` : ''}

                        <!-- NEW FORMAT TAG -->
                        <div style="position: absolute; bottom: 15px; left: 15px; background: rgba(0,0,0,0.8); border: 1.5px solid ${formatColor}; color: ${formatColor}; padding: 6px 16px; border-radius: 10px; font-size: 0.8rem; font-weight: 950; letter-spacing: 2px; box-shadow: 0 0 15px ${formatColor}44; backdrop-filter: blur(5px);">
                            ${formatLabel}
                        </div>

                        <!-- MAIN FLOATING ACTION BUTTON -->
                        <div onclick="event.stopPropagation(); ${fabAction}" style="position: absolute; top: 65px; right: 15px; width: 70px; height: 70px; background: ${btnColor === '#fff' ? '#CCFF00' : (btnColor === '#CCFF00' ? '#38bdf8' : btnColor)}; color: ${btnColor === '#CCFF00' ? '#fff' : (btnColor === '#fff' ? '#000' : 'white')}; border-radius: 50%; border: 4px solid #000; box-shadow: 0 5px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: transform 0.2s;">
                            <i class="fas ${btnIcon}" style="font-size: 1.1rem; margin-bottom: 3px;"></i>
                            <span style="font-size: 0.5rem; font-weight: 950; text-align: center; line-height: 1;">${btnLabel}</span>
                        </div>

                        <!-- SECONDARY CHAT FAB (PINK) -->
                        <div onclick="event.stopPropagation(); window.ChatView.init('${evt.id}', '${evt.name.replace(/'/g, "\\'")}', '${evt.category || 'open'}', [${players.map(p => `'${p.uid || p.id}'`).join(',')}])" 
                             style="position: absolute; top: 145px; right: 22px; width: 56px; height: 56px; background: #FF2D55; color: white; border-radius: 50%; border: 3px solid #000; box-shadow: 0 5px 15px rgba(255,45,85,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; z-index: 11; transition: all 0.2s;">
                            <i class="fas fa-comment-dots" style="font-size: 0.9rem; margin-bottom: 2px;"></i>
                            <span style="font-size: 0.45rem; font-weight: 950; text-align: center;">CHAT</span>
                        </div>
                    </div>

                    <!-- CONTENT AREA -->
                    <div style="padding: 35px 24px 25px; color: white;">
                        <h3 style="margin: 0 0 20px; font-size: 1.4rem; font-weight: 950; line-height: 1.2; letter-spacing: -0.5px;">${evt.name}</h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="far fa-clock" style="color: #CCFF00; font-size: 1.3rem;"></i>
                                <span style="font-weight: 700; color: #ccc;">${timeLabel}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="fas ${categoryIcon}" style="color: ${categoryColor}; font-size: 1.3rem;"></i>
                                <span style="font-weight: 700; color: #ccc; text-transform: uppercase;">${categoryLabel}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="fas fa-th-large" style="color: #38bdf8; font-size: 1.3rem;"></i>
                                <span style="font-weight: 700; color: #ccc;">${maxCourts} Pistas</span>
                            </div>
                            <div onclick="event.stopPropagation(); window.EventsController.showInscritosModal('${evt.id}', '${evt.type || 'americana'}')" style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                <i class="fas fa-users" style="color: ${isFull ? '#FF3B30' : '#84cc16'}; font-size: 1.3rem;"></i>
                                <span style="font-weight: 800; color: ${isFull ? '#FF3B30' : '#fff'}; text-decoration: underline; text-underline-offset: 4px;">${playerCount} / ${maxPlayers} Plazas</span>
                                ${waitlist.length > 0 ? `<small style="color:#eab308; margin-left:5px;">(+${waitlist.length} en espera)</small>` : ''}
                            </div>
                        </div>

                        ${isWaitlistPending ? `
                        <div style="background: rgba(204,255,0,0.1); border: 1px dashed #CCFF00; padding: 12px; border-radius: 12px; margin-bottom: 20px; text-align: center; animation: pulse-soft 2s infinite;">
                            <div style="color: #CCFF00; font-weight: 900; font-size: 0.85rem;">🕒 ¡TIENES UNA PLAZA LIBRE!</div>
                            <div style="color: #ccc; font-size: 0.75rem; margin-top: 4px;">Confirma en menos de 10 min o pasará al siguiente.</div>
                        </div>
                        ` : ''}

                        <div style="display: flex; align-items: center; gap: 12px; color: #666; font-size: 0.9rem; font-weight: 700; padding-top: 15px; border-top: 1px solid #222;">
                            <div style="flex:1;">
                                <i class="fas fa-map-marker-alt" style="color: #FF3B30;"></i> Sede: ${evt.sede || evt.location || 'Barcelona Pádel el Prat'}
                            </div>
                            <div style="
                                background: ${isLive ? '#FF2D55' : (isCancelled ? '#ef4444' : (isPairing ? '#38bdf8' : (isFinished ? '#64748b' : '#84cc16')))};
                                color: ${isLive || isCancelled || isPairing || isFinished ? '#fff' : '#000'};
                                padding: 4px 10px;
                                border-radius: 6px;
                                font-size: 0.7rem;
                                font-weight: 800;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                box-shadow: 0 0 10px ${isLive ? 'rgba(255,45,85,0.4)' : 'transparent'};
                            ">
                                ${isLive ? '🔴 EN JUEGO' : (isCancelled ? '⛔ ANULADO' : (isPairing ? '🔀 EMPAREJAMIENTO' : (isFinished ? '🏁 FINALIZADA' : '🟢 ABIERTA')))}
                            </div>
                        </div>
                    </div>
                    
                    <!-- BOTTOM PROGRESS BAR -->
                    <div style="height: 6px; background: #222; width: 100%;">
                        <div style="height: 100%; background: #CCFF00; width: ${Math.min((playerCount / maxPlayers) * 100, 100)}%; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            `;
        }

        async openLiveEvent(id, type = 'americana', action = null) {
            if (!window.ControlTowerView && window.ControlTowerViewClass) {
                window.ControlTowerView = new window.ControlTowerViewClass();
            }
            if (window.ControlTowerView) {
                window.ControlTowerView.prepareLoad(id, type, action);
                window.Router.navigate('live');
            } else {
                alert("Cargando módulo de control...");
            }
        }

        async waitForService() {
            for (let i = 0; i < 10; i++) {
                if (window.AmericanaService && window.AmericanaService.db) return true;
                await new Promise(r => setTimeout(r, 200));
            }
            return false;
        }

        async joinEvent(id, type = 'americana') {
            if (!this.state.currentUser) { alert("Inicia sesión."); return; }
            if (await this.waitForService() && confirm("¿Inscribirse?")) {
                const res = await window.AmericanaService.addPlayer(id, this.state.currentUser, type);
                alert(res.success ? "Inscripción OK" : "Error: " + res.error);
            }
        }

        async leaveEvent(id, type = 'americana') {
            if (!this.state.currentUser) { alert("Inicia sesión."); return; }
            if (await this.waitForService() && confirm("¿Darse de baja?")) {
                const res = await window.AmericanaService.removePlayer(id, this.state.currentUser.uid, type);
                alert(res.success ? "Baja tramitada" : "Error: " + res.error);
            }
        }

        async joinWaitlist(id, type = 'americana') {
            if (!this.state.currentUser) { alert("Inicia sesión."); return; }
            if (confirm("Evento lleno. ¿Entrar en lista de espera? Te avisaremos si queda una plaza libre.")) {
                const res = await window.AmericanaService.addToWaitlist(id, this.state.currentUser, type);
                alert(res.success ? "En lista de espera ✅" : "Error: " + res.error);
            }
        }

        async confirmWaitlist(id, type = 'americana') {
            if (!this.state.currentUser) { alert("Inicia sesión."); return; }
            if (confirm("¿Confirmar tu plaza ahora?")) {
                const res = await window.AmericanaService.confirmWaitlist(id, this.state.currentUser.uid, type);
                alert(res.success ? "¡Bienvenido al evento! 🎾" : "Error: " + res.error);
            }
        }

        async leaveWaitlist(id, type = 'americana') {
            const service = window.AmericanaService._getCollectionService(type);
            const event = await service.getById(id);
            const newWaitlist = (event.waitlist || []).filter(p => p.uid !== this.state.currentUser.uid);
            await service.update(id, { waitlist: newWaitlist });
            alert("Has salido de la lista de espera.");
        }

        async showInscritosModal(id, type) {
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            const evt = events.find(e => e.id === id);
            if (!evt) return;

            let modal = document.getElementById('inscritos-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'inscritos-modal';
                document.body.appendChild(modal);
            }
            modal.style.cssText = `position: fixed; inset: 0; background: #000; z-index: 30000; overflow-y: auto; font-family: 'Outfit', sans-serif; color: white; display: flex; flex-direction: column;`;
            modal.innerHTML = `<div style="padding: 100px; text-align: center;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px;">DETECTANDO EQUIPOS Y NIVELES EN TIEMPO REAL...</p></div>`;
            modal.style.display = 'block';

            // FETCH FRESH DATA FOR ALL REGISTERED PLAYERS
            const registeredPlayersList = evt.players || evt.registeredPlayers || [];
            const playerUids = registeredPlayersList.map(p => (typeof p === 'string') ? p : (p.uid || p.id));

            const dbPlayers = [];
            try {
                const promises = playerUids.map(uid => window.db.collection('players').doc(uid).get());
                const snapshots = await Promise.all(promises);

                snapshots.forEach((snap, index) => {
                    // Obtener metadatos de la inscripción del evento original para recuperar joinedAt
                    const registrationMeta = (typeof registeredPlayersList[index] === 'object') ? registeredPlayersList[index] : { joinedAt: null };

                    let pData = null;
                    if (snap.exists) {
                        pData = { id: snap.id, ...snap.data() };
                    } else {
                        // Fallback al objeto que tengamos en el evento
                        pData = (typeof registeredPlayersList[index] === 'object') ? registeredPlayersList[index] : { id: playerUids[index], name: 'Usuario' };
                    }

                    // Priorizar el joinedAt del evento (que es el real de la inscripción)
                    pData.joinedAt = registrationMeta.joinedAt || pData.joinedAt || null;
                    dbPlayers.push(pData);
                });

                // ORDENAR POR ORDEN DE INSCRIPCIÓN (Antiguo -> Nuevo)
                dbPlayers.sort((a, b) => {
                    const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
                    const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
                    return timeA - timeB;
                });

            } catch (e) { console.error("Error fetching players:", e); }

            const maxCourts = parseInt(evt.max_courts || evt.courts || 4);
            const maxPlayers = maxCourts * 4;

            const cardsHtml = dbPlayers.map((p, index) => {
                const teams = Array.isArray(p.team_somospadel) ? p.team_somospadel : (p.team_somospadel ? [p.team_somospadel] : []);
                const level = parseFloat(p.level || 3.0).toFixed(2);
                const name = (p.name || 'JUGADOR').toUpperCase();
                const photo = p.photo_url || p.photoURL || 'img/logo_somospadel.png';

                const joinedAtRaw = p.joinedAt;
                const joinedAtStr = joinedAtRaw ? new Date(joinedAtRaw).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                const joinedDateStr = joinedAtRaw ? new Date(joinedAtRaw).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '';

                const teamsBadges = teams.length > 0 ? teams.map(t => {
                    let teamColor = '#38bdf8';
                    let textColor = '#000';
                    if (t.includes('4º')) teamColor = '#84cc16';
                    if (t.includes('3º')) teamColor = '#38bdf8';
                    if (t.includes('2º')) teamColor = '#f59e0b';
                    if (t.toUpperCase().includes('MIXTO')) { teamColor = '#ef4444'; textColor = '#fff'; }
                    return `<span style="background: ${teamColor}; color: ${textColor}; font-size: 0.55rem; font-weight: 950; padding: 3px 10px; border-radius: 4px; margin: 2px; display: inline-block; letter-spacing: 0.5px;">${t.toUpperCase()}</span>`;
                }).join('') : `<span style="background: #222; color: #666; font-size: 0.55rem; font-weight: 900; padding: 3px 10px; border-radius: 4px; margin: 2px; display: inline-block;">SIN EQUIPO</span>`;

                const rank = index + 1;

                return `
                    <div class="cnn-player-card" style="
                        background: linear-gradient(135deg, #0f172a 0%, #000000 100%);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 20px;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        overflow: hidden;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                        height: 100%;
                        min-height: 180px;
                    ">
                        <!-- Top Banner with Rank and Level -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="background: #CCFF00; color: #000; font-size: 0.7rem; font-weight: 950; padding: 2px 10px; border-radius: 6px; box-shadow: 0 0 15px rgba(204,255,0,0.4);">
                                RANK #${rank}
                            </div>
                            <div style="color: #CCFF00; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px;">
                                <small style="opacity: 0.7; font-size: 0.5rem; vertical-align: middle;">LVL</small> ${level}
                            </div>
                        </div>

                        <!-- Player Section -->
                        <div style="padding: 15px; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;">
                            <div style="width: 50px; height: 50px; border-radius: 12px; background: url('${photo}') center/cover; border: 2px solid #CCFF00; box-shadow: 0 0 15px rgba(204,255,0,0.2);"></div>
                            
                            <div style="width: 100%;">
                                <div style="font-weight: 950; font-size: 0.95rem; color: #fff; line-height: 1.1; margin-bottom: 4px; height: 2.2rem; display: flex; align-items: center; justify-content: center; overflow: hidden; text-overflow: ellipsis;">
                                    ${name}
                                </div>
                                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">
                                    ${teamsBadges}
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Broadcast Bar -->
                        <div style="background: #CCFF0010; padding: 8px 12px; border-top: 1px solid rgba(204,255,0,0.1); display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800;">REGS: <span style="color: #eee;">${joinedDateStr}</span></div>
                            <div style="font-size: 0.65rem; color: #fff; font-weight: 950; display: flex; align-items: center; gap: 5px;">
                                <div style="width: 6px; height: 6px; background: #00E36D; border-radius: 50%; box-shadow: 0 0 8px #00E36D; animation: neon-flicker 1.5s infinite;"></div>
                                ${joinedAtStr}
                            </div>
                        </div>
                        
                        <!-- Slanted decorative element (Holographic feel) -->
                        <div style="position: absolute; bottom: 0; right: 0; width: 40px; height: 40px; background: linear-gradient(135deg, transparent 50%, rgba(204,255,0,0.05) 50%); pointer-events: none;"></div>
                    </div>
                `;
            }).join('');

            modal.style.cssText = `position: fixed; inset: 0; background: #000; z-index: 30000; overflow-y: auto; font-family: 'Outfit', sans-serif; color: white; display: flex; flex-direction: column;`;
            modal.innerHTML = `
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Montserrat:wght@900&display=swap');
                </style>
                <div class="broadcast-container" style="padding: 40px 20px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                    <!-- HEADER HIGH-TECH -->
                    <div class="broadcast-header" style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        margin-bottom: 30px; 
                        background: linear-gradient(90deg, rgba(0,0,0,0.8), rgba(15,23,42,0.5)); 
                        padding: 25px; 
                        border-radius: 20px; 
                        border: 1px solid rgba(255,255,255,0.05); 
                        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                        gap: 20px;
                    ">
                        <div style="flex: 1; min-width: 250px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
                            <div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px; flex-wrap: wrap;">
                                <span style="background: #CCFF00; color: #000; padding: 3px 12px; border-radius: 6px; font-weight: 950; font-size: 0.7rem; letter-spacing: 2px;">BROADCAST</span>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="width: 8px; height: 8px; background: #FF2D55; border-radius: 50%; animation: pulse 1s infinite;"></div>
                                    <span style="font-size: 0.65rem; font-weight: 900; color: #FF2D55; letter-spacing: 1px;">PRE-PARTY LIVE</span>
                                </div>
                            </div>
                            <h1 class="hero-title" style="
                                margin: 0; 
                                font-family: 'Montserrat', sans-serif; 
                                font-size: 2.2rem; 
                                font-weight: 900; 
                                text-transform: uppercase; 
                                letter-spacing: -1.5px; 
                                line-height: 1;
                                display: flex;
                                align-items: center;
                                flex-wrap: wrap;
                                gap: 10px;
                            ">
                                INSCRITOS 
                                <span style="
                                    background: rgba(0,0,0,0.9);
                                    color: #CCFF00; 
                                    font-family: 'Syncopate', sans-serif;
                                    padding: 6px 20px;
                                    border: 2px solid #CCFF00;
                                    border-radius: 12px;
                                    font-size: 0.7em;
                                    letter-spacing: 2px;
                                    text-shadow: 0 0 10px #CCFF00;
                                    box-shadow: 0 0 25px rgba(204, 255, 0, 0.4), inset 0 0 10px rgba(204, 255, 0, 0.2);
                                    animation: neonColorShift 8s infinite linear;
                                    transform: skewX(-10deg);
                                    display: inline-block;
                                    white-space: nowrap;
                                ">CONFIRMADOS</span>
                            </h1>
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
                                <p style="margin: 0; color: #fff; font-weight: 900; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">${evt.name}</p>
                                <div style="display: flex; align-items: center; gap: 15px; color: #64748b; font-size: 0.75rem; font-weight: 800; flex-wrap: wrap;">
                                    <span style="display: flex; align-items: center; gap: 6px;"><i class="far fa-clock" style="color: #CCFF00; font-size: 1rem;"></i> ${evt.time || '17:00 - 19:00'}</span>
                                    <span style="display: flex; align-items: center; gap: 6px;"><i class="fas fa-map-marker-alt" style="color: #FF3B30; font-size: 1rem;"></i> ${evt.sede || evt.location || 'SomosPadel BCN'}</span>
                                </div>
                            </div>
                            <div class="broadcast-logo-container" style="display: flex; align-items: center; justify-content: center;">
                                <img src="img/logo_somospadel.png" style="
                                    width: 110px; 
                                    height: 110px; 
                                    object-fit: contain; 
                                    filter: drop-shadow(0 0 15px rgba(204,255,0,0.3)) brightness(1.1);
                                    margin-top: -15px;
                                " alt="Logo SomosPadel">
                            </div>
                        </div>
                        
                        <div class="cnn-ledger-glass" style="
                            text-align: center; 
                            background: rgba(0,0,0,0.5); 
                            backdrop-filter: blur(20px); 
                            border: 2px solid #CCFF00; 
                            padding: 15px 30px; 
                            border-radius: 24px; 
                            box-shadow: 0 0 30px rgba(204,255,0,0.2), inset 0 0 20px rgba(204,255,0,0.1); 
                            position: relative; 
                            overflow: hidden; 
                            min-width: 140px;
                        ">
                            <div style="font-size: 0.6rem; font-weight: 950; color: #CCFF00; margin-bottom: 5px; letter-spacing: 2px; text-transform: uppercase;">PLAYER COUNT</div>
                            <div style="font-size: 2.8rem; font-weight: 1000; color: #fff; text-shadow: 0 0 20px #CCFF00; line-height: 0.9;">
                                ${dbPlayers.length}<span style="color: rgba(255,255,255,0.2); font-size: 1.4rem; font-weight: 700; margin-left: 2px;">/${maxPlayers}</span>
                            </div>
                            <div class="led-pulse"></div>
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background: radial-gradient(circle at 50% 0%, rgba(204,255,0,0.1) 0%, transparent 70%);"></div>
                        </div>
                    </div>

                    <!-- HIGH DENSITY GRID -->
                    <div class="broadcast-grid" style="
                        display: grid; 
                        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
                        gap: 15px; 
                        margin-bottom: 40px;
                    ">
                        ${cardsHtml}
                    </div>

                    <!-- 🔗 RADAR DE SINERGIAS (PARTNER SUGGESTIONS) -->
                    <div id="event-synergy-radar-root" style="margin-bottom: 40px;">
                        <!-- Content loaded via JS -->
                    </div>

                    <!-- FOOTER ACTIONS -->
                    <div style="display: flex; justify-content: center; gap: 20px; padding-bottom: 60px;">
                        <button onclick="document.getElementById('inscritos-modal').style.display = 'none';" 
                                style="background: #CCFF00; color: #000; border: none; padding: 15px 40px; border-radius: 12px; font-weight: 950; cursor: pointer; text-transform: uppercase; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(204,255,0,0.2);">
                            VOLVER A LA APP
                        </button>
                    </div>
                </div>

                <div style="position: fixed; bottom: 0; left: 0; width: 100%; height: 35px; background: #CCFF00; display: flex; align-items: center; overflow: hidden; z-index: 30001;">
                    <div class="scrolling-text" style="white-space: nowrap; font-weight: 950; font-size: 0.75rem; color: black; text-transform: uppercase;">
                        ${dbPlayers.map(p => `• ${p.name} (LVL: ${p.level})`).join('  &nbsp;&nbsp;&nbsp;&nbsp;  ')} &nbsp;&nbsp;&nbsp;&nbsp; ${dbPlayers.map(p => `• ${p.name} (LVL: ${p.level})`).join('  &nbsp;&nbsp;&nbsp;&nbsp;  ')}
                    </div>
                </div>

                <style>
                    .scrolling-text { display: inline-block; animation: marquee 30s linear infinite; }
                    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    #inscritos-modal::-webkit-scrollbar { width: 6px; }
                    #inscritos-modal::-webkit-scrollbar-thumb { background: #CCFF00; border-radius: 10px; }
                    
                    @media (max-width: 768px) {
                        .broadcast-header {
                            flex-direction: column;
                            align-items: flex-start;
                            padding: 15px;
                        }
                        .hero-title {
                            font-size: 1.8rem !important;
                        }
                        .cnn-ledger-glass {
                            width: 100%;
                            box-sizing: border-box;
                        }
                        .broadcast-container {
                            padding: 20px 10px;
                        }
                        .broadcast-logo-container {
                            display: none !important;
                        }
                    }

                    @media (max-width: 550px) {
                        .broadcast-grid {
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 10px !important;
                        }
                    }
                    
                    .neon-ledger {
                        animation: led-glow 2s ease-in-out infinite alternate;
                    }
                    
                    @keyframes led-glow {
                        from { box-shadow: 0 0 10px rgba(204,255,0,0.2), inset 0 0 5px rgba(204,255,0,0.1); border-color: #84cc16; }
                        to { box-shadow: 0 0 25px rgba(204,255,0,0.5), inset 0 0 15px rgba(204,255,0,0.3); border-color: #CCFF00; }
                    }

                    .led-pulse {
                        position: absolute;
                        top: 0; left: -100%;
                        width: 50%; height: 100%;
                        background: linear-gradient(to right, transparent, rgba(204,255,0,0.3), transparent);
                        transform: skewX(-25deg);
                        animation: sweep 3s infinite;
                    }

                    @keyframes sweep {
                        0% { left: -100%; }
                        50% { left: 150%; }
                        100% { left: 150%; }
                    }

                    @keyframes neonColorShift {
                        0%, 100% { color: #CCFF00; border-color: #CCFF00; box-shadow: 0 0 25px rgba(204, 255, 0, 0.4), inset 0 0 10px rgba(204, 255, 0, 0.2); text-shadow: 0 0 10px #CCFF00; }
                        33% { color: #38bdf8; border-color: #38bdf8; box-shadow: 0 0 25px rgba(56, 189, 248, 0.4), inset 0 0 10px rgba(56, 189, 248, 0.2); text-shadow: 0 0 10px #38bdf8; }
                        66% { color: #FF2D55; border-color: #FF2D55; box-shadow: 0 0 25px rgba(255, 45, 85, 0.4), inset 0 0 10px rgba(255, 45, 85, 0.2); text-shadow: 0 0 10px #FF2D55; }
                    }
                </style>
            `;
            modal.style.display = 'block';

            // Initialize Partner Synergy Radar in Modal
            if (this.state.currentUser && window.PartnerSynergyWidget) {
                setTimeout(() => {
                    window.PartnerSynergyWidget.render(this.state.currentUser.uid || this.state.currentUser.id, 'event-synergy-radar-root', {
                        title: '🔗 PAREJAS IDEALES EN ESTE EVENTO',
                        subtitle: 'Sugerencias basadas en compatibilidad real',
                        limit: 3,
                        showDetails: true,
                        compact: false
                    }).catch(e => console.error('Synergy widget failed:', e));
                }, 100);
            }
        }
    }

    window.EventsController = new EventsController();
})();

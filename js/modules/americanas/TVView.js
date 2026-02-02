/**
 * TVView.js (Optimized & Secured)
 * Specialized view for "Center Court" displays (Smart TVs).
 * Features: High contrast, large fonts, auto-rotation, no admin controls.
 */
(function () {
    class TVView {
        constructor() {
            this.eventId = null;
            this.eventDoc = null;
            this.matches = [];
            this.standings = [];
            this.nextRoundMatches = [];
            this.currentSlide = 'matches'; // 'matches', 'standings', 'next'
            this.slideInterval = null;
            this.clockInterval = null;
            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
            this.upcomingEvents = [];
            this.tickerInterval = null;
        }

        /**
         * System Cleanup: Prevents memory leaks and redundant timers (Audit Fix)
         */
        destroy() {
            console.log("🧹 [TVView] Cleaning up system resources...");
            if (this.slideInterval) clearInterval(this.slideInterval);
            if (this.clockInterval) clearInterval(this.clockInterval);
            if (this.tickerInterval) clearInterval(this.tickerInterval);
            if (this.unsubscribeMatches) this.unsubscribeMatches();
            if (this.unsubscribeEvent) this.unsubscribeEvent();

            this.slideInterval = null;
            this.clockInterval = null;
            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
            this.eventId = null;
            this.eventDoc = null;
            this.matches = [];

            // Restore global UI
            const overlay = document.getElementById('tv-mode-overlay');
            if (overlay) overlay.remove();

            const appShell = document.getElementById('app-shell');
            if (appShell) {
                appShell.classList.remove('hidden');
                appShell.style.display = ''; // Ensure it shows if it was display:none
            }

            document.body.style.overflow = '';
            document.body.style.background = '';
        }

        async load(eventId, type = 'americana') {
            console.log("📺 [TV Mode] Loading for:", eventId);
            this.destroy(); // Clean up previous session if any

            this.eventId = eventId;
            this.type = type;

            this.renderLoader();

            // Hide app shell to avoid background content interaction
            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.add('hidden');

            // Load Initial Event Data
            try {
                let doc = await window.db.collection('americanas').doc(eventId).get();
                if (!doc.exists) {
                    doc = await window.db.collection('entrenos').doc(eventId).get();
                    this.type = 'entreno';
                }

                if (doc.exists) {
                    this.eventDoc = { id: doc.id, ...doc.data() };
                } else {
                    const overlay = document.getElementById('tv-mode-overlay');
                    if (overlay) overlay.innerHTML = '<h1 style="color:white; text-align:center; padding-top:20%;">EVENTO NO ENCONTRADO</h1>';
                    return;
                }
            } catch (e) {
                console.error("TV mode load error:", e);
            }

            this.startListeners();
            this.fetchUpcomingEvents();
            this.tickerInterval = setInterval(() => this.fetchUpcomingEvents(), 1000 * 60 * 15); // Refresh every 15 min
            this.startCycle();

            document.body.style.overflow = 'hidden';
            document.body.style.background = '#000';
        }

        startListeners() {
            const collection = this.type === 'entreno' ? 'entrenos' : 'americanas';
            this.unsubscribeEvent = window.db.collection(collection).doc(this.eventId)
                .onSnapshot(snap => {
                    if (snap.exists) {
                        this.eventDoc = { id: snap.id, ...snap.data() };
                        this.render();
                    }
                });

            const matchesColl = this.type === 'entreno' ? 'entrenos_matches' : 'matches';
            this.unsubscribeMatches = window.db.collection(matchesColl)
                .where('americana_id', '==', this.eventId)
                .onSnapshot(snap => {
                    const raw = snap.docs.map(d => d.data());
                    const seen = new Set();
                    this.matches = [];
                    raw.forEach(m => {
                        const sig = `${m.round}-${m.court}`;
                        if (!seen.has(sig)) {
                            seen.add(sig);
                            this.matches.push(m);
                        }
                    });

                    this.calculateStandings();
                    this.filterNextRound();

                    // --- DETECT NEW DRAW FOR ANIMATION ---
                    if (this.matches.length > 0 && window.ShuffleAnimator) {
                        const maxRound = Math.max(...this.matches.map(m => parseInt(m.round)));
                        const isNewRoundDetected = !this._lastAnimatedRound || maxRound > this._lastAnimatedRound;

                        // Only animate if matches are PENDING (not finished)
                        const currentMatches = this.matches.filter(m => parseInt(m.round) === maxRound);
                        const isPending = currentMatches.every(m => !m.score_a && m.status !== 'finished');

                        if (isNewRoundDetected && isPending) {
                            this._lastAnimatedRound = maxRound;
                            window.ShuffleAnimator.animate({
                                round: maxRound,
                                players: this.eventDoc?.players || [],
                                courts: this.eventDoc?.max_courts || 4,
                                matches: currentMatches
                            });
                        }
                    }

                    this.render();
                });
        }

        async fetchUpcomingEvents() {
            try {
                if (window.AmericanaService) {
                    const upcoming = await window.AmericanaService.getActiveAmericanas();
                    this.upcomingEvents = upcoming.filter(e => e.id !== this.eventId).slice(0, 5);
                }
            } catch (e) {
                console.warn("Error fetching upcoming events for ticker:", e);
            }
        }

        /**
         * UI Optimization: Use centralized logic (Audit Fix)
         */
        calculateStandings() {
            if (!window.StandingsService) return;
            // Use StandingsService for consistent data across app
            this.standings = window.StandingsService.calculate(this.matches, this.type);
        }

        filterNextRound() {
            const maxRound = this.matches.length > 0 ? Math.max(...this.matches.map(m => parseInt(m.round))) : 1;
            const nextRoundMatches = this.matches.filter(m => parseInt(m.round) === maxRound && m.status !== 'finished');

            const isAllPending = nextRoundMatches.length > 0 && nextRoundMatches.every(m => !m.score_a && m.status !== 'finished');
            if (isAllPending) {
                this.nextRoundMatches = nextRoundMatches.sort((a, b) => a.court - b.court);
            } else {
                this.nextRoundMatches = [];
            }
        }

        startCycle() {
            if (this.slideInterval) clearInterval(this.slideInterval);
            this.slideInterval = setInterval(() => {
                if (this.currentSlide === 'matches') {
                    this.currentSlide = 'standings';
                } else if (this.currentSlide === 'standings') {
                    if (this.nextRoundMatches.length > 0 && this.nextRoundMatches[0].round > 1) {
                        this.currentSlide = 'next';
                    } else {
                        this.currentSlide = 'matches';
                    }
                } else {
                    this.currentSlide = 'matches';
                }

                const container = document.getElementById('tv-content-container');
                if (container) {
                    container.style.opacity = '0';
                    setTimeout(() => {
                        this.renderContent();
                        container.style.opacity = '1';
                    }, 500);
                }
            }, 15000);
        }

        renderLoader() {
            let overlay = document.getElementById('tv-mode-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'tv-mode-overlay';
                overlay.style.cssText = 'position:fixed; inset:0; z-index:999999; background:#000; overflow:hidden;';
                document.body.appendChild(overlay);
            }

            overlay.innerHTML = `
                <div style="height:100vh; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:'Outfit', sans-serif;">
                    <img src="img/logo_somospadel.png" style="height:100px; margin-bottom:30px;">
                    <div class="loader"></div>
                    <p style="margin-top:20px; font-weight:700; letter-spacing:2px; color:#CCFF00;">CONECTANDO CON PISTA CENTRAL...</p>
                </div>
            `;
        }

        render() {
            let overlay = document.getElementById('tv-mode-overlay');
            if (!overlay) return; // Should not happen if load was called

            const root = document.getElementById('tv-root');
            if (!root) {
                overlay.innerHTML = `
                    <div id="tv-root" style="height: 100vh; display: flex; flex-direction: column; background: #050505; overflow: hidden; position: relative; font-family: 'Outfit', sans-serif;">
                        <!-- HEADER -->
                        <div style="height: 12vh; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; border-bottom: 2px solid #222; background: #000;">
                            <div style="display: flex; align-items: center; gap: 30px;">
                                <div onclick="window.TVView.destroy()" style="background: #111; color: #CCFF00; border: 2px solid #CCFF00; padding: 10px 20px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: 950; font-size: 1.2rem; box-shadow: 0 0 15px rgba(204,255,0,0.3);">
                                    <i class="fas fa-arrow-left"></i> VOLVER
                                </div>
                                <img src="img/logo_somospadel.png" style="height: 8vh;">
                                <div>
                                    <h1 style="margin: 0; font-size: 2.5rem; font-weight: 900; line-height: 1; text-transform: uppercase; color: white;">${this.eventDoc?.name || 'EVENTO'}</h1>
                                    <div style="color: #666; font-size: 1.2rem; margin-top: 5px; font-weight: 700; letter-spacing: 2px;">MODO ESPECTADOR • ${this.type === 'entreno' ? 'ENTRENO' : 'TORNEO'}</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div id="tv-clock" style="font-size: 3rem; font-weight: 900; color: #CCFF00; font-variant-numeric: tabular-nums;">--:--</div>
                            </div>
                        </div>

                        <!-- CONTENT AREA -->
                        <div id="tv-content-container" style="flex: 1; padding: 30px; transition: opacity 0.5s;">
                            <!-- DYNAMIC CONTENT -->
                        </div>

                        <!-- FOOTER TICKER (Audit Fix: CSS instead of marquee) -->
                        <style>
                            @keyframes tickerScroll {
                                0% { transform: translateX(10%); }
                                100% { transform: translateX(-100%); }
                            }
                            .tv-ticker-container {
                                display: flex;
                                white-space: nowrap;
                                animation: tickerScroll 40s linear infinite;
                            }
                        </style>
                        <div style="height: 7vh; background: #CCFF00; color: black; display: flex; align-items: center; overflow: hidden; font-weight: 950; font-size: 1.8rem; text-transform: uppercase; border-top: 4px solid black;">
                            <div style="padding: 0 40px; background: black; color: #CCFF00; height: 100%; display: flex; align-items: center; border-right: 4px solid black; position: relative; z-index: 10;">LIVE</div>
                            <div id="tv-ticker-content" class="tv-ticker-container">
                                <!-- Dynamic Ticker -->
                            </div>
                        </div>
                    </div>
                `;

                // Managed clock interval
                if (this.clockInterval) clearInterval(this.clockInterval);
                this.clockInterval = setInterval(() => {
                    const now = new Date();
                    const el = document.getElementById('tv-clock');
                    if (el) el.innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                }, 1000);
            }

            this.renderContent();
            this.updateTicker();
        }

        updateTicker() {
            const tickerEl = document.getElementById('tv-ticker-content');
            if (!tickerEl) return;

            // 1. Current Matches Results
            const currentRound = this.matches.length > 0 ? Math.max(...this.matches.map(m => parseInt(m.round))) : 1;
            const roundMatches = this.matches.filter(m => parseInt(m.round) === currentRound);
            const resultsText = roundMatches.map(m =>
                `<span style="color:black;">PISTA ${m.court}:</span> <span style="color:black; background:white; padding:0 10px; border-radius:5px; margin:0 10px;">${m.score_a || 0} - ${m.score_b || 0}</span>`
            ).join(' • ');

            // 2. Upcoming Events
            const nextEventsText = this.upcomingEvents.map(e =>
                `📅 PRÓXIMO EVENTO: <span style="font-weight:900;">${e.name.toUpperCase()}</span> (${e.date.split('-').reverse().join('/')} ${e.time})`
            ).join(' • ');

            // 3. Marketing Messages
            const marketing = "🎾 BIENVENIDOS A SOMOSPADEL BCN • EL MEJOR PÁDEL DE BARCELONA • 🏆 SIGUE TU CLASIFICACIÓN EN TIEMPO REAL • 🔥 NIVEL ÉPICO EN CADA PISTA";

            const fullTicker = `
                <span style="padding-left: 50px;">
                    ${resultsText} • ${nextEventsText} • ${marketing}
                </span>
            `;

            tickerEl.innerHTML = fullTicker + fullTicker; // Double for seamless loop if needed, though CSS animation handle it
        }

        renderContent() {
            const container = document.getElementById('tv-content-container');
            if (!container) return;

            if (this.currentSlide === 'matches') {
                container.innerHTML = this.getMatchesHTML();
            } else if (this.currentSlide === 'standings') {
                container.innerHTML = this.getStandingsHTML();
            } else if (this.currentSlide === 'next') {
                container.innerHTML = this.getNextRoundHTML();
            }
        }

        getMatchesHTML() {
            const currentRound = this.matches.length > 0 ? Math.max(...this.matches.map(m => parseInt(m.round))) : 1;
            const roundMatches = this.matches.filter(m => parseInt(m.round) === currentRound);

            return `
                <div class="fade-in">
                    <h2 style="color:#CCFF00; font-size:3rem; font-weight:900; text-align:center; margin-bottom:30px;">
                        RESULTADOS EN VIVO - RONDA ${currentRound}
                    </h2>
                    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:20px;">
                        ${roundMatches.map(m => `
                            <div style="background:rgba(255,255,255,0.05); padding:25px; border-radius:20px; border-left:10px solid #CCFF00; display:flex; align-items:center; justify-content:space-between;">
                                <div style="font-size:2rem; font-weight:900; color:#666; width:60px;">P${m.court}</div>
                                <div style="flex:1; text-align:right; font-size:1.8rem; font-weight:700; color:white;">${(m.team_a_names || []).join(' / ')}</div>
                                <div style="background:#000; padding:10px 20px; border-radius:10px; margin:0 25px; font-size:2.5rem; font-weight:900; color:#CCFF00; min-width:120px; text-align:center;">
                                    ${m.score_a || 0} - ${m.score_b || 0}
                                </div>
                                <div style="flex:1; text-align:left; font-size:1.8rem; font-weight:700; color:white;">${(m.team_b_names || []).join(' / ')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        getStandingsHTML() {
            const top10 = this.standings.slice(0, 10);
            return `
                <div class="fade-in">
                    <h2 style="color:#CCFF00; font-size:3rem; font-weight:900; text-align:center; margin-bottom:30px;">TOP 10 CLASIFICACIÓN</h2>
                    <div style="background:rgba(255,255,255,0.03); border-radius:30px; overflow:hidden;">
                        <table style="width:100%; border-collapse:collapse; font-size:1.8rem;">
                            <tr style="background:#111; color:#666;">
                                <th style="padding:20px; text-align:center;">#</th>
                                <th style="padding:20px; text-align:left;">JUGADOR</th>
                                <th style="padding:20px; text-align:center;">PJ</th>
                                <th style="padding:20px; text-align:center;">V</th>
                                <th style="padding:20px; text-align:center;">PTS</th>
                            </tr>
                            ${top10.map((p, i) => `
                                <tr style="border-bottom:1px solid #222; background:${i < 3 ? 'rgba(204,255,0,0.05)' : 'transparent'};">
                                    <td style="padding:20px; text-align:center; font-weight:900; color:${i === 0 ? '#CCFF00' : 'white'};">${i + 1}</td>
                                    <td style="padding:20px; font-weight:900; color:white;">${p.name.toUpperCase()}</td>
                                    <td style="padding:20px; text-align:center; color:#888;">${p.played}</td>
                                    <td style="padding:20px; text-align:center; color:#888;">${p.won}</td>
                                    <td style="padding:20px; text-align:center; font-weight:900; color:#CCFF00;">${p.points}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                </div>
            `;
        }

        getNextRoundHTML() {
            return `
                <div class="fade-in" style="text-align:center;">
                    <h2 style="color:#CCFF00; font-size:3rem; font-weight:900; margin-bottom:10px;">PRÓXIMOS PARTIDOS</h2>
                    <p style="color:#666; font-size:1.5rem; margin-bottom:40px;">Ronda de emparejamientos preparada</p>
                    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:20px;">
                        ${this.nextRoundMatches.map(m => `
                            <div style="background:rgba(255,255,255,0.05); padding:25px; border-radius:20px; border-left:10px solid #222; display:flex; align-items:center; justify-content:space-between;">
                                <div style="font-size:2rem; font-weight:900; color:#444; width:60px;">P${m.court}</div>
                                <div style="flex:1; text-align:right; font-size:1.8rem; font-weight:700; color:white;">${(m.team_a_names || []).join(' / ')}</div>
                                <div style="margin:0 30px; font-size:2rem; font-weight:900; color:#666;">VS</div>
                                <div style="flex:1; text-align:left; font-size:1.8rem; font-weight:700; color:white;">${(m.team_b_names || []).join(' / ')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    // Singleton instance
    window.TVView = new TVView();
    console.log("📺 TV View (Optimized) v2 Initialized");
})();

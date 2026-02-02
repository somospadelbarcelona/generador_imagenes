/**
 * ControlTowerView.js
 * The dedicated view for managing the live Americana.
 */
(function () {
    // --- GLOBAL DISPATCHER FOR SHARE BUTTONS ---
    window._matchRegistry = window._matchRegistry || {};
    class ControlTowerView {
        constructor() {
            this.mainSection = 'playing'; // 'playing', 'history', 'help'
            this.activeTab = 'results'; // 'results', 'standings', 'summary'
            this.selectedRound = 1;
            this.allMatches = [];
            this.currentAmericanaId = null;
            this.currentAmericanaDoc = null;
            this.userHistory = [];
            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
            this.pendingId = null;
            this.userMatches = [];
            this.userStats = {
                games: 0,
                wins: 0,
                mvps: 0 // Placeholder for future logic
            };
            this.autoStartInterval = null;
        }

        /**
         * System Cleanup: Essential for avoiding memory leaks (Audit Fix)
         */
        destroy() {
            console.log("🧹 [ControlTowerView] Cleaning up system resources...");
            if (this.unsubscribeMatches) this.unsubscribeMatches();
            if (this.unsubscribeEvent) this.unsubscribeEvent();
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);

            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
            this.autoStartInterval = null;
        }

        goToRound(round, evt) {
            if (evt) evt.stopPropagation();
            this.selectedRound = round;

            // Auto-scroll to top to prevent visual gaps
            window.scrollTo({ top: 0, behavior: 'smooth' });

            this.recalc();
        }

        prepareLoad(id, type = null, action = null) {
            console.log("🚀 [ControlTowerView] Preparing to load:", id, "Type:", type, "Action:", action);
            this.pendingId = id;
            this.pendingType = type;
            this.pendingAction = action;
            // Force load immediately to ensure navigation works even if route "flash" happens
            if (id) this.load(id, type);
        }

        async handleLiveRoute() {
            if (this.pendingId) {
                await this.load(this.pendingId, this.pendingType);

                if (this.pendingAction === 'confirm_waitlist') {
                    if (window.EventsController) {
                        await window.EventsController.confirmWaitlist(this.pendingId, this.pendingType);
                    }
                }

                this.pendingId = null;
                this.pendingType = null;
                this.pendingAction = null;
            } else {
                this.loadLatest();
            }
        }

        async load(eventId, forceType = null) {
            this.currentAmericanaId = eventId;
            this.selectedRound = 1;
            this.mainSection = 'playing'; // Ensure we show the game area

            // Show loading
            this.render({ status: 'LOADING' });

            try {
                let doc = null;
                let isEntreno = forceType === 'entreno';

                if (forceType) {
                    const collection = isEntreno ? 'entrenos' : 'americanas';
                    doc = await window.db.collection(collection).doc(eventId).get();
                }

                if (!doc || !doc.exists) {
                    // Auto-detection fallback
                    doc = await window.db.collection('americanas').doc(eventId).get();
                    isEntreno = false;

                    if (!doc.exists) {
                        doc = await window.db.collection('entrenos').doc(eventId).get();
                        isEntreno = true;
                    }
                }

                if (doc.exists) {
                    this.currentAmericanaDoc = { id: doc.id, ...doc.data(), isEntreno };

                    // UX Improvement: Check status explicitly
                    if (this.currentAmericanaDoc.status === 'finished') {
                        this.activeTab = 'results'; // Show matches grid first, even if finished
                    } else {
                        this.activeTab = 'results';
                    }
                } else {
                    console.error("Event not found in either americanas or entrenos:", eventId);
                    this.renderEmptyState();
                    return;
                }
            } catch (e) {
                console.error("Error loading event doc:", e);
            }

            // Unsubscribe previous listeners
            if (this.unsubscribeMatches) this.unsubscribeMatches();
            if (this.unsubscribeEvent) this.unsubscribeEvent();

            const isEntreno = this.currentAmericanaDoc?.isEntreno;

            // Real-time listener for EVENT STATUS CHANGES
            const eventCollection = isEntreno ? 'entrenos' : 'americanas';
            this.unsubscribeEvent = window.db.collection(eventCollection)
                .doc(eventId)
                .onSnapshot(eventDoc => {
                    if (!eventDoc.exists) return;

                    const updatedEvent = { id: eventDoc.id, ...eventDoc.data(), isEntreno };
                    const previousStatus = this.currentAmericanaDoc?.status;
                    this.currentAmericanaDoc = updatedEvent;

                    // AUTO-TRIGGER: If status just changed to 'live', generate matches
                    // FIX: Ignore if previous status was 'adjusting' (Manual Admin Intervention) to prevent duplicates
                    if (updatedEvent.status === 'live' && previousStatus !== 'live' && previousStatus !== 'adjusting') {
                        console.log("🚀 [ControlTowerView] Event status changed to LIVE. Auto-generating matches...");
                        if (window.AmericanaService) {
                            window.AmericanaService.generateFirstRoundMatches(eventId, isEntreno ? 'entreno' : 'americana');
                        }
                    }

                    if (previousStatus !== updatedEvent.status) {
                        this.recalc();
                    }
                }, err => {
                    console.error("Error watching event status:", err);
                });

            // AUTO-START CHECKER (Every 30s)
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);
            this.autoStartInterval = setInterval(async () => {
                const evt = this.currentAmericanaDoc;
                if (!evt || evt.status !== 'open' || !evt.date || !evt.time) return;

                // Check Time
                const now = new Date();
                const [h, m] = evt.time.split(':').map(Number);

                // NORMALIZE DATES (Handle YYYY-MM-DD and DD/MM/YYYY)
                // We convert both to YYYY-MM-DD for comparison
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                let evtDateNorm = evt.date;
                if (evt.date.includes('/')) {
                    // Assume DD/MM/YYYY
                    const [d, mo, y] = evt.date.split('/');
                    evtDateNorm = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }

                // Debug Log (User can see this in console)
                console.log(`⏰ Auto-Start Check: Today=${todayStr}, Event=${evtDateNorm}, Time=${now.getHours()}:${now.getMinutes()} vs ${h}:${m}`);

                if (evtDateNorm === todayStr) {
                    const nowTime = now.getHours() * 60 + now.getMinutes();
                    const schedTime = h * 60 + m;

                    // FULL CHECK: Ensure event is full before auto-start
                    const players = evt.players || evt.registeredPlayers || [];
                    const maxCourts = evt.max_courts || 4;
                    const isFull = players.length >= (maxCourts * 4);

                    // Allow start if time matches OR passed (within last 2 hours to avoid auto-starting old events?)
                    // Actually, if it's 'open' and time passed, it SHOULD go live.
                    if (nowTime >= schedTime) {
                        if (isFull) {
                            console.log("🚀 AUTO-START TRIGGERED: Changing status to LIVE and Generating Matches");
                            // 1. Update Status (Trigger listeners)
                            await window.EventService.updateEvent(isEntreno ? 'entreno' : 'americana', eventId, { status: 'live' });

                            // 2. Force Generation (Redundancy in case listener misses)
                            if (window.AmericanaService) {
                                await window.AmericanaService.generateFirstRoundMatches(eventId, isEntreno ? 'entreno' : 'americana');
                            }

                            // 3. Update Local State immediately
                            this.currentAmericanaDoc.status = 'live';
                            this.recalc();
                        } else {
                            console.warn(`⏳ [AutoStart] Live View trigger: Time reached but NOT FULL (${players.length}/${maxCourts * 4}). Waiting.`);
                        }
                    }
                }
            }, 30000); // Check every 30s

            // FIXED: Dynamic collection selection based on Event Type
            // Entrenos use 'entrenos_matches', Americanas use 'matches'
            const matchesCollection = isEntreno ? 'entrenos_matches' : 'matches';
            // NOTE: Both Entrenos and Americanas use 'americana_id' field for consistency in ID reference
            const fieldName = 'americana_id';

            console.log(`🔍 [ControlTowerView] Loading matches from ${matchesCollection} for event ${eventId} (IsEntreno: ${!!isEntreno})`);

            this.unsubscribeMatches = window.db.collection(matchesCollection)
                .where(fieldName, '==', eventId)
                .onSnapshot(snapshot => {
                    const rawMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // CRITICAL FIX: Deduplicate matches by unique signature (court + round + teams)
                    // This prevents UI duplicates even if Firebase has duplicate documents
                    const seen = new Map();
                    const deduplicated = [];

                    rawMatches.forEach(match => {
                        // Create unique signature based on match characteristics
                        const teamA = Array.isArray(match.team_a_names) ? match.team_a_names.sort().join('|') : match.team_a_names;
                        const teamB = Array.isArray(match.team_b_names) ? match.team_b_names.sort().join('|') : match.team_b_names;
                        const signature = `${match.court}-${match.round}-${teamA}-${teamB}`;

                        if (!seen.has(signature)) {
                            seen.set(signature, true);
                            deduplicated.push(match);
                        } else {
                            console.warn(`⚠️ [ControlTowerView] Duplicate match detected and filtered: Court ${match.court}, Round ${match.round}`);
                        }
                    });

                    this.allMatches = deduplicated;
                    console.log(`✅ [ControlTowerView] Loaded ${rawMatches.length} matches (${deduplicated.length} unique after deduplication)`);

                    // Safety net & Fullness Trigger: If event is live OR FULL, and NO matches exist, attempt auto-generation
                    const maxCourts = this.currentAmericanaDoc?.max_courts || 4;
                    const isFull = (this.currentAmericanaDoc?.players?.length || 0) >= (maxCourts * 4);
                    const shouldGenerate = (this.currentAmericanaDoc?.status === 'live') || (isFull && this.currentAmericanaDoc?.status === 'open');

                    if (shouldGenerate && this.allMatches.length === 0) {
                        console.warn("⚠️ Event Trigger (Live or Full) - No matches found. Attempting auto-generation...");
                        if (window.AmericanaService) {
                            window.AmericanaService.generateFirstRoundMatches(eventId, isEntreno ? 'entreno' : 'americana');
                        }
                    }

                    // --- DETECT NEW DRAW FOR ANIMATION (Improved for Sync) ---
                    if (this.allMatches.length > 0 && window.ShuffleAnimator && !this.isGeneratingRound) {
                        const maxRound = Math.max(...this.allMatches.map(m => parseInt(m.round)));
                        const isNewRoundDetected = !this._lastAnimatedRound || maxRound > this._lastAnimatedRound;

                        const isMainArea = this.mainSection === 'playing' && this.activeTab === 'results';
                        const currentMatches = this.allMatches.filter(m => parseInt(m.round) === maxRound);

                        // Check if it's really a new round with at least one match
                        if (isNewRoundDetected && currentMatches.length > 0 && isMainArea) {
                            // Debounce: Wait a bit for all matches of the round to arrive before animating
                            if (this._animTimeout) clearTimeout(this._animTimeout);
                            this._animTimeout = setTimeout(() => {
                                // RE-FETCH to get latest matches after delay
                                const finalMatches = this.allMatches.filter(m => parseInt(m.round) === maxRound);
                                const isStillPending = finalMatches.every(m => !m.score_a && m.status !== 'finished');

                                if (isStillPending) {
                                    console.log(`🎬 [Tower] Auto-starting animation for Round ${maxRound}`);
                                    this._lastAnimatedRound = maxRound;
                                    window.ShuffleAnimator.animate({
                                        round: maxRound,
                                        players: this.currentAmericanaDoc?.players || [],
                                        courts: this.currentAmericanaDoc?.max_courts || 4,
                                        matches: finalMatches
                                    }, () => {
                                        // Auto-switch to the new round tab
                                        this.goToRound(maxRound);
                                    });
                                }
                            }, 1500);
                        }
                    }

                    this.recalc();

                    // CHECK ROUND COMPLETION (Manual Advancement Prompt)
                    this.checkRoundCompletion(this.allMatches);

                }, err => {
                    console.error("Error watching matches:", err);
                });
        }

        checkRoundCompletion(matches) {
            if (!this.currentAmericanaDoc || matches.length === 0) return;

            // 1. Determine the Highest Round with matches
            const maxRound = Math.max(...matches.map(m => parseInt(m.round || 1)));

            // 2. Filter matches for this SPECIFIC max round
            const maxRoundMatches = matches.filter(m => parseInt(m.round) === maxRound);

            // 3. Check if ALL are finished in the highest round
            const allFinished = maxRoundMatches.length > 0 && maxRoundMatches.every(m => m.status === 'finished');

            // 4. Also check if the NEXT round already exists (if so, we don't need the prompt)
            const nextRound = maxRound + 1;
            const nextRoundExists = matches.some(m => parseInt(m.round) === nextRound);

            if (allFinished && !nextRoundExists) {
                // Check if already prompted/dismissed for this specific max round
                if (this.roundPromptDismissedFor === maxRound) return;

                // Check if Max Rounds reached (e.g. 6)
                const totalRounds = this.currentAmericanaDoc.rounds || 6;
                if (maxRound >= totalRounds) return;

                // SHOW PROMPT for the current completed round
                this.showRoundFinishedModal(maxRound);
            } else {
                // Reset dismissal if round is no longer finished or if we have moved on
                if (!allFinished || nextRoundExists) {
                    this.roundPromptDismissedFor = null;
                    this.closeRoundFinishedModal();
                }
            }
        }

        showRoundFinishedModal(round) {
            if (document.getElementById('round-finished-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'round-finished-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); z-index: 13000;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(5px); animation: fadeIn 0.3s ease;
            `;

            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #111 0%, #0a0a0a 100%); width: 90%; max-width: 400px; padding: 30px; border-radius: 24px; border: 2px solid #CCFF00; text-align: center; box-shadow: 0 0 50px rgba(204,255,0,0.2); position: relative;">
                    <div style="width: 60px; height: 60px; background: #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(204,255,0,0.6);">
                        <i class="fas fa-flag-checkered" style="font-size: 1.8rem; color: black;"></i>
                    </div>
                    <h2 style="color: white; font-weight: 950; font-size: 1.5rem; margin: 0 0 10px 0;">RONDA ${round} FINALIZADA</h2>
                    <p style="color: #bbb; font-size: 0.9rem; margin-bottom: 25px;">Todos los partidos han terminado. ¿Qué quieres hacer?</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button id="btn-next-round" style="background: #CCFF00; color: black; border: none; padding: 16px; border-radius: 14px; font-weight: 900; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 5px 15px rgba(204,255,0,0.3);">
                            ✅ SÍ, SIGUIENTE RONDA
                        </button>
                        <button id="btn-edit-round" style="background: transparent; color: white; border: 2px solid #333; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
                            ❌ NO, QUIERO EDITAR
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Bind Actions
            document.getElementById('btn-next-round').onclick = async () => {
                const btn = document.getElementById('btn-next-round');
                btn.innerHTML = '<div class="loader-spinner"></div> GENERANDO...';
                try {
                    const isEntreno = this.currentAmericanaDoc?.isEntreno;
                    // Trigger Generation
                    if (window.AmericanaService) {
                        await window.AmericanaService.generateNextRound(this.currentAmericanaDoc.id, round, isEntreno ? 'entreno' : 'americana');
                        // Dismiss modal 
                        this.roundPromptDismissedFor = null; // Reset for next
                        this.closeRoundFinishedModal();
                    }
                } catch (e) {
                    alert("Error: " + e.message);
                    btn.innerHTML = '✅ SÍ, SIGUIENTE RONDA';
                }
            };

            document.getElementById('btn-edit-round').onclick = () => {
                this.roundPromptDismissedFor = round;
                this.closeRoundFinishedModal();
            };
        }

        closeRoundFinishedModal() {
            const el = document.getElementById('round-finished-modal');
            if (el) el.remove();
        }

        async loadHistory() {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) return;

            try {
                const currentYear = new Date().getFullYear();
                console.log(`📊 [Tower] Loading History for year: ${currentYear}`);

                // 1. SMART ID RESOLUTION
                // Use all identities linked to this user (Admin + Player)
                const idsToSearch = (user.mergedIds && user.mergedIds.length > 0) ? user.mergedIds : [user.uid];
                console.log(`🔗 [Tower] Searching history for IDs: ${idsToSearch.join(', ')}`);

                // 2. FETCH MATCHES (using the Robust 'getByPlayer' we built)
                // We fetch matches for ALL IDs and deduplicate them.
                const matchPromises = idsToSearch.map(id => window.FirebaseDB.matches.getByPlayer(id));
                const resultsNested = await Promise.all(matchPromises);
                // Deduplicate matches by ID
                const uniqueMatches = new Map();
                resultsNested.flat().forEach(m => uniqueMatches.set(m.id, m));

                const parseSafeDate = (dateStr) => {
                    if (!dateStr) return null;
                    if (dateStr instanceof Date) return dateStr;
                    if (typeof dateStr !== 'string') return new Date(dateStr);
                    if (dateStr.includes('/')) {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    }
                    return new Date(dateStr);
                };

                this.userMatches = Array.from(uniqueMatches.values()).filter(m => {
                    const d = parseSafeDate(m.date);
                    // Filter for matches from Late 2025 (Nov/Dec) or 2026
                    if (!d) return false;
                    const year = d.getFullYear();
                    const month = d.getMonth(); // 0-indexed
                    return (year === 2026) || (year === 2025 && month >= 10);
                });

                // 3. CALCULATE STATS
                let g = 0;
                let w = 0;
                let l = 0;
                const uniqueEvents = new Set();

                const myName = (user.name || '').toLowerCase();

                this.userMatches.forEach(m => {
                    if (m.status === 'cancelled' || m.cancelled === true) return;

                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);

                    if (sA + sB > 0) {
                        let isTeamA = false;
                        let isTeamB = false;

                        // Check by ID
                        if (m.team_a_ids && idsToSearch.some(id => m.team_a_ids.includes(id))) isTeamA = true;
                        if (m.team_b_ids && idsToSearch.some(id => m.team_b_ids.includes(id))) isTeamB = true;

                        // Check by Name Fallback (If ID fails)
                        if (!isTeamA && !isTeamB && myName) {
                            const checkName = (names) => names && String(names).toLowerCase().includes(myName);
                            if (checkName(m.team_a_names) || checkName(m.player1_name) || checkName(m.p1_name)) isTeamA = true;
                            else if (checkName(m.team_b_names) || checkName(m.player3_name) || checkName(m.p3_name)) isTeamB = true;
                        }

                        if (isTeamA || isTeamB) {
                            if (m.americana_id) uniqueEvents.add(m.americana_id);
                            else if (m.id.includes('_m_')) uniqueEvents.add(m.id.split('_m_')[0]);

                            if (isTeamA) {
                                g += sA;
                                if (sA > sB) w++;
                                else if (sA < sB) l++;
                            } else {
                                g += sB;
                                if (sB > sA) w++;
                                else if (sB < sA) l++;
                            }
                        }
                    }
                });

                // STRICT COUNTING: Only count events derived from real matches found
                const eventCount = uniqueEvents.size;

                // REMOVED: Fallback guessing logic that was causing ghost data
                /* 
                if (eventCount === 0 && user.matches_played > 0) {
                    eventCount = Math.ceil(parseInt(user.matches_played) / 4); // Approx events
                    g = parseInt(user.games_played || 0); // If exists
                    w = parseInt(user.wins || 0);
                }
                */

                this.userStats = {
                    games: g,
                    wins: w,
                    losses: l,
                    events: eventCount
                };

                // Populate userHistory array for the list view
                // We map from uniqueEvents to dummy objects if we don't have full event data, 
                // or we rely on the matches having 'americana_name' / 'eventName'
                this.userHistory = this.userMatches.reduce((acc, m) => {
                    const evtId = m.americana_id || (m.id.includes('_m_') ? m.id.split('_m_')[0] : 'unknown');
                    if (!acc.find(e => e.id === evtId)) {
                        acc.push({
                            id: evtId,
                            name: m.eventName || m.americana_name || "Evento",
                            date: m.date,
                            category: "PRO"
                        });
                    }
                    return acc;
                }, []);

                console.log(`✅ [Tower] History Loaded: ${this.userStats.games} games, ${this.userStats.events} events.`);
                this.recalc();

            } catch (e) {
                console.error("History fail:", e);
                this.userStats = { games: 0, wins: 0, losses: 0, events: 0 };
                this.recalc();
            }
        }

        async loadLatest() {
            this.render({ status: 'LOADING' });
            try {
                const user = window.Store ? window.Store.getState('currentUser') : null;

                // Fetch both Americanas and Entrenos
                const [amsSnap, entsSnap] = await Promise.all([
                    window.db.collection('americanas').orderBy('date', 'desc').limit(5).get(),
                    window.db.collection('entrenos').orderBy('date', 'desc').limit(5).get()
                ]);

                const events = [
                    ...amsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'americana' })),
                    ...entsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'entreno' }))
                ];

                // Sort by prioritized relevance: Status (Live > Finished), then Date
                events.sort((a, b) => {
                    if (a.status === 'live' && b.status !== 'live') return -1;
                    if (b.status === 'live' && a.status !== 'live') return 1;
                    return new Date(b.date) - new Date(a.date);
                });

                // Priority for selection: 
                // 1. Live event where user plays
                // 2. Any live event
                // 3. User's most recent finished event
                // 4. Latest overall event

                const myLiveEvent = user ? events.find(e =>
                    e.status === 'live' && (
                        (e.players && e.players.some(p => (p.uid || p.id) === user.uid)) ||
                        (e.registeredPlayers && e.registeredPlayers.includes(user.uid))
                    )
                ) : null;

                const anyLiveEvent = events.find(e => e.status === 'live');

                const myFinishedEvent = user ? events.find(e =>
                    e.status === 'finished' && (
                        (e.players && e.players.some(p => (p.uid || p.id) === user.uid)) ||
                        (e.registeredPlayers && e.registeredPlayers.includes(user.uid))
                    )
                ) : null;

                const target = myLiveEvent || anyLiveEvent || myFinishedEvent || events[0];

                if (target) {
                    this.load(target.id, target.type);
                } else {
                    this.renderEmptyState();
                }
            } catch (e) {
                console.error("Error loading latest:", e);
                this.renderEmptyState();
            }
        }

        renderEmptyState() {
            const container = document.getElementById('content-area');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 80px 40px; text-align: center; color: #888; background: #F8F9FA; min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="width: 100px; height: 100px; background: white; border-radius: 30px; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #eee;">
                            <i class="fas fa-trophy" style="font-size: 3rem; color: #ddd;"></i>
                        </div>
                        <h3 style="color: #111; font-weight: 900; font-family: 'Outfit'; font-size: 1.5rem; letter-spacing: -0.5px;">CERO ACTIVIDAD</h3>
                        <p style="font-size: 1rem; line-height: 1.6; margin-top: 15px; color: #666; max-width: 300px;">
                            No hemos encontrado eventos activos o recientes para mostrar resultados.
                        </p>
                        <button onclick="window.Router.navigate('americanas')" style="margin-top: 30px; background: #000; color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
                            BUSCAR PARTIDOS 🎾
                        </button>
                    </div>
                `;
            }
        }

        recalc() {
            // Filtrado de élite: parseInt garantiza que "1", 1 y "1º" coincidan con parseInt(selectedRound)
            const sNum = parseInt(this.selectedRound) || 1;
            const currentRoundMatches = this.allMatches.filter(m => {
                const mNum = parseInt(m.round);
                return mNum === sNum;
            });

            console.log(`[Tower] Recalc. Ronda: ${sNum}. Partidos encontrados: ${currentRoundMatches.length} de ${this.allMatches.length}`);

            const roundData = {
                number: sNum,
                matches: currentRoundMatches.map(m => {
                    const namesA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.team_a_names || 'Equipo A');
                    const namesB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.team_b_names || 'Equipo B');

                    return {
                        court: m.court,
                        teamA: namesA,
                        teamB: namesB,
                        scoreA: m.score_a,
                        scoreB: m.score_b,
                        isFinished: m.status === 'finished',
                        isLive: m.status === 'live',
                        level_avg: m.level_avg || '3.5',
                        ...m
                    };
                }).sort((a, b) => a.court - b.court)
            };

            const maxMatchRound = this.allMatches.length > 0
                ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1)))
                : 1;
            const configRounds = this.currentAmericanaDoc?.rounds || 6;
            const roundsLimit = Math.max(maxMatchRound, configRounds);

            const roundsSchedule = Array.from({ length: roundsLimit }, (_, i) => ({ number: i + 1 }));

            this.render({
                currentRound: roundData,
                roundsSchedule: roundsSchedule,
                isLive: this.currentAmericanaDoc?.status === 'live'
            });
        }

        switchTab(tab) {
            this.activeTab = tab;
            this.recalc();
        }

        async switchSection(section) {
            this.mainSection = section;
            if (section === 'history') await this.loadHistory();
            this.recalc();
        }

        render(data) {
            const container = document.getElementById('content-area');
            if (!container) return;

            const user = window.Store ? window.Store.getState('currentUser') : null;
            const isPlayingHere = this.currentAmericanaDoc && user && (
                (this.currentAmericanaDoc.players || []).includes(user.uid) ||
                (this.currentAmericanaDoc.registeredPlayers || []).includes(user.uid)
            );

            // SMART PATCHING (Prevent Flash)
            if (this.mainSection === 'playing' && this.activeTab === 'results' && document.querySelector('.tour-grid-container')) {
                const rd = data?.currentRound || { matches: [] };
                const ar = data?.roundsSchedule || [];
                // Only smart update if we have matches, otherwise full render might be safer
                if (this.smartUpdateResults(rd, ar)) {
                    return;
                }
            }

            // --- STATE PRESERVATION ---
            const scrollPos = window.scrollY;
            const openEditIds = Array.from(document.querySelectorAll('[id^="edit-actions-"]'))
                .filter(el => el.style.display !== 'none')
                .map(el => el.id);
            // --------------------------

            container.innerHTML = `
                <div class="tournament-layout fade-in" style="background: #050505;">
                    
                    <!-- PREMIUM DARK LED SUBMENU -->
                    <style>
                        @keyframes ledPulse {
                            0% { box-shadow: 0 0 5px rgba(255,149,0,0.1), inset 0 0 5px rgba(255,149,0,0.05); }
                            50% { box-shadow: 0 0 15px rgba(255,149,0,0.4), inset 0 0 8px rgba(255,149,0,0.2); }
                            100% { box-shadow: 0 0 5px rgba(255,149,0,0.1), inset 0 0 5px rgba(255,149,0,0.05); }
                        }
                        .led-tab-active {
                            animation: ledPulse 2.5s infinite ease-in-out;
                            border: 1px solid #ff9500 !important;
                            color: #ff9500 !important;
                            background: rgba(255,149,0,0.05) !important;
                            text-shadow: 0 0 8px rgba(255,149,0,0.3);
                        }
                    </style>

                    <div style="background: #111; backdrop-filter: blur(20px); padding: 14px; display: flex; justify-content: center; gap: 12px; border-bottom: 2px solid #222; position: sticky; top: 0; z-index: 1002; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                        <button onclick="window.ControlTowerView.switchSection('playing')" class="${this.mainSection === 'playing' ? 'led-tab-active' : ''}" style="flex:1; border: 1px solid #333; background: rgba(255,255,255,0.05); color: #fff; padding: 14px 6px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; transition: 0.4s; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);">EN JUEGO</button>
                        <button onclick="window.ControlTowerView.switchSection('history')" class="${this.mainSection === 'history' ? 'led-tab-active' : ''}" style="flex:1; border: 1px solid #333; background: rgba(255,255,255,0.05); color: #fff; padding: 14px 6px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; transition: 0.4s; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);">MI PASADO</button>
                        <button onclick="window.ControlTowerView.switchSection('help')" class="${this.mainSection === 'help' ? 'led-tab-active' : ''}" style="flex:1; border: 1px solid #333; background: rgba(255,255,255,0.05); color: #fff; padding: 14px 6px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; transition: 0.4s; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);">INFO</button>
                    </div>

                    ${this.renderMainArea(data, isPlayingHere)}
                </div>
            `;

            // --- STATE RESTORATION ---
            if (openEditIds.length > 0) {
                openEditIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = 'flex';
                });
            }
            // Restore scroll only if we haven't navigated far (optional, but requested)
            // But if content height changes, scroll might be wrong. Usually safe for minor updates.
            if (scrollPos > 0) {
                window.scrollTo(0, scrollPos);
            }
            // --------------------------
        }

        renderMainArea(data, isPlayingHere) {
            if (this.mainSection === 'help') return this.renderHelpContent();
            if (this.mainSection === 'history') return this.renderHistoryContent();

            // --- PREMIUM CATEGORY ENGINE ---
            const category = this.currentAmericanaDoc?.category || 'pro';
            const isFemale = category === 'female';
            const isMixed = category === 'mixed';
            const isMale = category === 'male';

            let theme = {
                grad: 'linear-gradient(135deg, #CCFF00 0%, #00E36D 100%)',
                accent: '#CCFF00',
                glow: 'rgba(204, 255, 0, 0.4)',
                text: '#000',
                border: '#00E36D'
            };

            if (isFemale) {
                theme = {
                    grad: 'linear-gradient(135deg, #FF2D55 0%, #FF5E7B 100%)',
                    accent: '#FF2D55',
                    glow: 'rgba(255, 45, 85, 0.4)',
                    text: '#fff',
                    border: '#FF2D55'
                };
            } else if (isMixed) {
                theme = {
                    grad: 'linear-gradient(135deg, #FFD700 0%, #FF9500 100%)',
                    accent: '#FFD700',
                    glow: 'rgba(255, 215, 0, 0.4)',
                    text: '#000',
                    border: '#FF9500'
                };
            } else if (isMale) {
                theme = {
                    grad: 'linear-gradient(135deg, #00C4FF 0%, #0072FF 100%)',
                    accent: '#00C4FF',
                    glow: 'rgba(0, 196, 255, 0.4)',
                    text: '#fff',
                    border: '#0072FF'
                };
            }

            const roundData = data?.currentRound || { matches: [] };
            const amName = this.currentAmericanaDoc ? this.currentAmericanaDoc.name : "Americana Activa";

            return `
                <div class="tour-header-context" style="background: ${theme.grad}; padding: 45px 20px 35px; text-align: center; border-bottom: 2px solid rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                    <!-- AMBIENT GLOW -->
                    <div style="position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.2); filter: blur(60px); border-radius: 50%;"></div>
                    
                    <!-- ACTION BUTTONS -->
                    <div style="position:absolute; top:20px; right:20px; display:flex; gap:12px; z-index:10; flex-wrap: wrap; justify-content: flex-end;">
                         <div onclick="window.ControlTowerView.replayShuffleAnimation()" 
                               style="background:rgba(0,0,0,0.7); color:${theme.accent}; padding:8px 16px; border-radius:12px; font-weight:950; font-size:0.65rem; cursor:pointer; backdrop-filter: blur(10px); border: 1px solid ${theme.accent}40; letter-spacing: 1px;">
                             <i class="fas fa-random"></i> SORTEO
                         </div>
                         <div onclick="window.ChatView.init('${this.currentAmericanaDoc?.id}', '${amName}')" 
                               style="background:rgba(0,0,0,0.7); color:white; padding:8px 16px; border-radius:12px; font-weight:950; font-size:0.65rem; cursor:pointer; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); letter-spacing: 1px;">
                             <i class="fas fa-comment-dots"></i> CHAT
                         </div>
                         <div onclick="window.openTVMode('${this.currentAmericanaDoc?.id}', '${this.currentAmericanaDoc?.isEntreno ? 'entreno' : 'americana'}')" 
                               style="background:rgba(0,0,0,0.7); color:${theme.accent}; padding:8px 16px; border-radius:12px; font-weight:950; font-size:0.65rem; cursor:pointer; backdrop-filter: blur(10px); border: 1px solid ${theme.accent}40;">
                             <i class="fas fa-tv"></i> TV
                         </div>
                    </div>

                    ${isPlayingHere ? `
                        <div style="background: rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1); color: ${theme.text}; display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 0.65rem; font-weight: 950; margin-bottom: 20px; letter-spacing: 1px; text-transform: uppercase;">
                           PARTICIPANDO EN VIVO ✅
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; position: relative; z-index: 2;">
                        <div style="position: relative;">
                            <img src="${this.currentAmericanaDoc?.image_url || 'img/logo_somospadel.png'}" 
                                 style="width: 85px; height: 85px; border-radius: 50%; border: 4px solid white; box-shadow: 0 15px 35px rgba(0,0,0,0.3);"
                                 onerror="this.src='img/logo_somospadel.png'">
                            <div style="position: absolute; bottom: -5px; right: -5px; background: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                                <span style="font-size: 1.1rem;">${isFemale ? '♀️' : isMale ? '♂️' : '🎾'}</span>
                            </div>
                        </div>
                        <h1 style="color: ${theme.text}; margin: 0; font-family: 'Outfit'; font-weight: 1000; font-size: 1.8rem; letter-spacing: -1px; line-height: 0.9;">${amName.toUpperCase()}</h1>
                    </div>
                    
                    <div style="color: ${theme.text}; opacity: 0.7; font-size: 0.85rem; margin-top: 15px; font-weight: 900; letter-spacing: 0.5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <div style="background: rgba(0,0,0,0.05); padding: 4px 12px; border-radius: 8px;">
                            ${this.currentAmericanaDoc?.date || ''} • ${(isMale ? 'MASCULINA' : isFemale ? 'FEMENINA' : isMixed ? 'MIXTA' : 'CATEGORÍA PRO')}
                        </div>
                        
                        ${(() => {
                    const mode = (this.currentAmericanaDoc?.pair_mode || this.currentAmericanaDoc?.format || '').toLowerCase();
                    const nameUpper = (this.currentAmericanaDoc?.name || '').toUpperCase();
                    let label = 'PAREJA FIJA';
                    let modeColor = '#000';

                    if (nameUpper.includes('TWISTER') || mode.includes('twister') || nameUpper.includes('ROTATIVO') || mode.includes('rotating') || mode.includes('rotativo')) {
                        label = 'MODO TWISTER';
                    }

                    return `<div style="background: rgba(255,255,255,0.2); color: ${theme.text}; border: 1.5px solid rgba(255,255,255,0.3); padding: 5px 15px; border-radius: 12px; font-size: 0.7rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">${label}</div>`;
                })()}
                    </div>
                </div>

                <div class="tour-sub-nav" style="background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); padding: 14px; display: flex; gap: 10px; border-bottom: 2px solid ${theme.accent}; position: sticky; top: 62px; z-index: 1001; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <button class="tour-menu-item ${this.activeTab === 'results' ? 'active' : ''}" style="flex:1; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${this.activeTab === 'results' ? theme.grad : '#f5f5f5'}; color: ${this.activeTab === 'results' ? theme.text : '#888'}; border: none; box-shadow: ${this.activeTab === 'results' ? '0 8px 20px ' + theme.glow : 'none'}; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);" onclick="window.ControlTowerView.switchTab('results')">PARTIDOS</button>
                    <button class="tour-menu-item ${this.activeTab === 'standings' ? 'active' : ''}" style="flex:1; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${this.activeTab === 'standings' ? theme.grad : '#f5f5f5'}; color: ${this.activeTab === 'standings' ? theme.text : '#888'}; border: none; box-shadow: ${this.activeTab === 'standings' ? '0 8px 20px ' + theme.glow : 'none'}; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);" onclick="window.ControlTowerView.switchTab('standings')">POSICIONES</button>
                    <button class="tour-menu-item ${this.activeTab === 'summary' ? 'active' : ''}" style="flex:1; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${this.activeTab === 'summary' ? theme.grad : '#f5f5f5'}; color: ${this.activeTab === 'summary' ? theme.text : '#888'}; border: none; box-shadow: ${this.activeTab === 'summary' ? '0 8px 20px ' + theme.glow : 'none'}; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);" onclick="window.ControlTowerView.switchTab('summary')">STATS</button>
                    <button class="tour-menu-item ${this.activeTab === 'report' ? 'active' : ''}" style="flex:1; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${this.activeTab === 'report' ? theme.grad : '#f5f5f5'}; color: ${this.activeTab === 'report' ? theme.text : '#888'}; border: none; box-shadow: ${this.activeTab === 'report' ? '0 8px 20px ' + theme.glow : 'none'}; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);" onclick="window.ControlTowerView.switchTab('report')">INFORME</button>
                </div>

                ${this.renderActiveContent(data, roundData)}
            `;
        }

        renderActiveContent(data, roundData) {
            if (data?.status === 'LOADING') return '<div class="loader" style="margin:80px auto;"></div>';

            switch (this.activeTab) {
                case 'standings': return this.renderStandingsView();
                case 'summary': return this.renderSummaryView();
                case 'report': return this.renderReportView();
                default:
                case 'results': return this.renderResultsView(roundData, data?.roundsSchedule || [], data?.isLive);
            }
        }

        smartUpdateResults(roundData, allRounds) {
            const grid = document.querySelector('.tour-grid-container');
            if (!grid) return false;

            // 1. Update Round Tabs
            const filterBar = document.querySelector('.tour-filter-bar');
            if (filterBar) {
                // Detect Round Change -> If round changed, force full render to prevent stale prompts
                const activeTab = filterBar.querySelector('.round-tab.active');
                // Extract the round number from the button's text, e.g., "1º" -> 1
                const lastRoundInUI = activeTab ? parseInt(activeTab.innerText.replace('º', '')) : -1;
                if (lastRoundInUI !== roundData.number) {
                    console.log("[SmartUpdate] Round change detected. Forcing full render.");
                    return false;
                }

                const newTabs = this.renderRoundTabs(allRounds, roundData.number);
                if (filterBar.innerHTML !== newTabs) filterBar.innerHTML = newTabs;
            }

            const matches = roundData.matches;

            // IF EMPTY State needed
            if (matches.length === 0) {
                const existingCards = grid.querySelectorAll('.tour-match-card');
                if (existingCards.length > 0) {
                    console.log("🚀 [SmartUpdate] Detected empty match list. Forcing full re-render to clear UI.");
                    return false; // Force full render to show "Generando..." or empty state
                }
                // If already empty, standard logic handles it (or we allow re-render to update message)
                // Returning false is always safe for "Empty" state updates to ensure message is correct.
                return false;
            }

            const validIds = new Set(matches.map(m => m.id));

            // 2. Insert / Update Logic
            matches.forEach((match, index) => {
                const cardId = `tour-match-${match.id}`;
                let el = document.getElementById(cardId);

                if (el) {
                    // --- UPDATE EXISTING CARD ---
                    // 1. Status Badge
                    const statusArea = el.querySelector('.status-area');
                    const isFinished = match.isFinished;
                    const isLive = this.currentAmericanaDoc?.status === 'live' && !isFinished;
                    const newStatusHTML = isFinished ?
                        '<span style="background: #25D366; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">FINALIZADO</span>' :
                        (isLive ? '<span class="status-badge-live">⚡ EN JUEGO</span>' : '<span style="color:#BBB;">ESPERANDO</span>');

                    if (statusArea && statusArea.innerHTML !== newStatusHTML) statusArea.innerHTML = newStatusHTML;

                    // 2. Names (Hot Swap for Vacancies)
                    const getTeamNameStr = (m, side) => {
                        const namesArr = m[`team_${side.toLowerCase()}_names`];
                        const teamStr = m[`team${side.toUpperCase()}`];
                        if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
                        if (Array.isArray(namesArr)) return namesArr.join(' / ');
                        return String(namesArr || '');
                    };

                    const nameAStr = getTeamNameStr(match, 'a') || 'JUGADOR A';
                    const nameBStr = getTeamNameStr(match, 'b') || 'JUGADOR B';

                    const nameAEl = document.getElementById(`match-name-a-${match.id}`);
                    const nameBEl = document.getElementById(`match-name-b-${match.id}`);

                    if (nameAEl && nameAEl.innerText.trim() !== nameAStr) nameAEl.innerHTML = (match.isFinished && parseInt(match.score_a) > parseInt(match.score_b) ? '<i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.9rem;"></i> ' : '') + nameAStr;
                    if (nameBEl && nameBEl.innerText.trim() !== nameBStr) nameBEl.innerHTML = (match.isFinished && parseInt(match.score_b) > parseInt(match.score_a) ? '<i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.9rem;"></i> ' : '') + nameBStr;

                    // 3. Scores & Styling
                    const sA = parseInt(match.score_a || 0);
                    const sB = parseInt(match.score_b || 0);

                    const scoreAEl = document.getElementById(`match-score-a-${match.id}`);
                    const scoreBEl = document.getElementById(`match-score-b-${match.id}`);
                    const valAEl = document.getElementById(`score-a-val-${match.id}`);
                    const valBEl = document.getElementById(`score-b-val-${match.id}`);

                    if (scoreAEl && scoreAEl.innerText != sA) scoreAEl.innerText = sA;
                    if (scoreBEl && scoreBEl.innerText != sB) scoreBEl.innerText = sB;
                    if (valAEl && valAEl.innerText != sA) valAEl.innerText = sA;
                    if (valBEl && valBEl.innerText != sB) valBEl.innerText = sB;

                    // Update Styles for Winner
                    if (match.isFinished) {
                        const winStyle = "color: #111 !important; font-weight: 950 !important; border-bottom: 4px solid #CCFF00; padding-bottom: 2px; text-decoration: none; display: flex; align-items: center; gap: 10px; text-shadow: 0 0 10px rgba(204,255,0,0.2);";
                        const normStyle = "color: #111; font-weight: 800; padding: 6px 0; display: flex; align-items: center; gap: 10px;";

                        if (nameAEl) {
                            nameAEl.style.cssText = (sA > sB) ? winStyle : normStyle;
                            if (scoreAEl) {
                                scoreAEl.style.background = (sA > sB) ? 'var(--brand-neon)' : 'var(--bg-app)';
                                scoreAEl.style.color = (sA > sB) ? 'black' : 'var(--text-primary)';
                                scoreAEl.style.boxShadow = (sA > sB) ? 'var(--shadow-neon)' : 'inset 0 2px 4px rgba(0,0,0,0.05)';
                            }
                        }
                        if (nameBEl) {
                            nameBEl.style.cssText = (sB > sA) ? winStyle : normStyle;
                            if (scoreBEl) {
                                scoreBEl.style.background = (sB > sA) ? 'var(--brand-neon)' : 'var(--bg-app)';
                                scoreBEl.style.color = (sB > sA) ? 'black' : 'var(--text-primary)';
                                scoreBEl.style.boxShadow = (sB > sA) ? 'var(--shadow-neon)' : 'inset 0 2px 4px rgba(0,0,0,0.05)';
                            }
                        }
                    }

                } else {
                    // --- INSERT NEW CARD ---
                    // Find correct position?
                    // Naive append is safer for now, unless we want strict ordering.
                    // Given we filter by round, usually strict order isn't critical if sorting is done in 'recalc'.
                    // But if we insert in middle, we should use index.
                    // Let's just append for simplicity as 'smart update' implies structure is mostly same.
                    grid.insertAdjacentHTML('beforeend', this.renderTournamentCard(match));
                }
            });

            // 3. REMOVE STALE CARDS (The fix for the user)
            const allCards = Array.from(grid.querySelectorAll('.tour-match-card'));
            allCards.forEach(card => {
                // Extract ID from e.g. "tour-match-abc1234"
                const id = card.id.replace('tour-match-', '');
                if (!validIds.has(id)) {
                    console.log("[SmartUpdate] Removing stale card:", id);
                    card.remove();
                }
            });

            // 4. SYNC "NEXT ROUND" PROMPT
            const existingPrompt = document.getElementById('next-round-btn-container');
            const maxRound = this.allMatches.length > 0 ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1))) : 1;
            const isRoundComplete = roundData.matches.length > 0 && roundData.matches.every(m => m.isFinished);
            const shouldShowPrompt = isRoundComplete &&
                parseInt(roundData.number) === maxRound &&
                this.currentAmericanaDoc?.status === 'live';

            if (!shouldShowPrompt && existingPrompt) {
                existingPrompt.remove();
            } else if (shouldShowPrompt && !existingPrompt) {
                // If the prompt should be shown but isn't present, force a full re-render
                // to ensure it's inserted correctly by renderResultsView.
                return false;
            }

            return true;
        }

        renderResultsView(roundData, allRounds, isLiveEvent = false) {
            const tabs = this.renderRoundTabs(allRounds, roundData.number);

            // 🏁 SMART PROMPT LOGIC: Only show prompt if viewing the HIGHEST existing round
            const maxRound = this.allMatches.length > 0 ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1))) : 1;
            const isViewingMaxRound = parseInt(roundData.number) === maxRound;

            const isRoundComplete = roundData.matches.length > 0 && roundData.matches.every(m => m.isFinished);
            let nextRoundUI = '';

            if (isRoundComplete && isViewingMaxRound && this.currentAmericanaDoc?.status === 'live') {
                nextRoundUI = `
                    <div id="next-round-btn-container" class="animate-pop-in" style="margin-top: 30px; background: white; padding: 25px; border-radius: 20px; border: 2px solid #CCFF00; box-shadow: 0 10px 30px rgba(204,255,0,0.2); text-align: center;">
                        <h3 style="margin: 0 0 15px 0; font-weight: 900; font-size: 1.1rem;">🏁 RONDA ${roundData.number} FINALIZADA</h3>
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 20px;">
                            Todos los resultados han sido introducidos. ¿Deseas generar la siguiente ronda?
                        </p>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                             <button onclick="window.ControlTowerView.triggerNextRound(${roundData.number})" 
                                    class="btn-primary-pro"
                                    style="padding: 15px 30px; font-size: 1rem; background: var(--playtomic-neon); color: black; border: none; box-shadow: 0 5px 15px rgba(204,255,0,0.4);">
                                SI, SIGUIENTE RONDA 🚀
                            </button>
                             <button onclick="document.getElementById('next-round-btn-container').innerHTML='<p>Puedes editar los resultados usando el botón ✏️ en cada tarjeta.</p>'; setTimeout(() => window.ControlTowerView.recalc(), 3000);" 
                                    style="padding: 15px 20px; font-size: 0.9rem; background: #eee; border: none; border-radius: 12px; font-weight: 800; color: #666; cursor: pointer;">
                                NO, QUIERO EDITAR
                            </button>
                        </div>
                    </div>
                `;
            }

            let emptyMessage = isLiveEvent ?
                '<div style="display:flex; justify-content:center; padding:40px;"><div class="loader"></div></div>' :
                'Selecciona una ronda válida...';

            return `
                <div class="tour-filter-bar" style="background:#F8F9FA; padding: 12px; overflow-x: auto;">
                   ${tabs}
                </div>
                <div class="tour-grid-container" style="padding: 16px; display: grid; gap: 16px; padding-bottom: 100px;">
                    ${roundData.matches.length ? '' : `<div style="color:#999; width:100%; text-align:center; padding:80px; font-weight:700; line-height:1.5;">${emptyMessage}</div>`}
                    ${roundData.matches.map(match => this.renderTournamentCard(match)).join('')}
                    ${nextRoundUI}
                </div>
            `;
        }

        renderRoundTabs(rounds, currentNum) {
            const category = this.currentAmericanaDoc?.category || 'pro';

            let activeColor = '#CCFF00';
            if (category === 'female') activeColor = '#FF2D55';
            else if (category === 'mixed') activeColor = '#FFD700';
            else if (category === 'male') activeColor = '#00C4FF';

            let replayButtonHtml = '';
            if (this.allMatches && this.allMatches.some(m => parseInt(m.round) === parseInt(currentNum))) {
                replayButtonHtml = `
                    <div style="width: 1px; height: 30px; background: rgba(0,0,0,0.1); margin: 0 5px;"></div>
                    <button onclick="window.ControlTowerView.replayShuffleAnimation()" 
                        style="background: #111; color: #CCFF00; border: 1px solid #CCFF00; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0 10px rgba(204,255,0,0.3);"
                        title="Ver Sorteo Animado">
                        <i class="fas fa-play"></i>
                    </button>
                 `;
            }

            return `
                <style>
                    @keyframes neonPulse {
                        0% { box-shadow: 0 0 5px var(--active-color), 0 0 10px var(--active-color); transform: scale(1); }
                        50% { box-shadow: 0 0 20px var(--active-color), 0 0 30px var(--active-color); transform: scale(1.05); }
                        100% { box-shadow: 0 0 5px var(--active-color), 0 0 10px var(--active-color); transform: scale(1); }
                    }
                </style>
                <div class="round-tabs-container" style="display:flex; gap:8px; align-items: center; overflow-x: auto; padding: 5px 0;">
                    ${rounds.map(r => {
                const isSel = parseInt(r.number) === parseInt(currentNum);
                // Use a dedicated active class or inline style with custom property for animation
                return `
                        <button type="button" 
                                class="round-tab ${isSel ? 'active' : ''}" 
                                onclick="window.ControlTowerView.goToRound(${r.number}, event)"
                                style="--active-color: ${activeColor};
                                       background: ${isSel ? activeColor : 'rgba(255,255,255,0.05)'}; 
                                       color: ${isSel ? '#000' : '#999'}; 
                                       border: 1px solid ${isSel ? activeColor : 'rgba(255,255,255,0.1)'};
                                       padding: 12px 20px; border-radius: 14px; font-weight: 950; cursor: pointer; transition: 0.4s; min-width: 65px;
                                       box-shadow: ${isSel ? `0 0 20px ${activeColor}` : 'none'}; 
                                       animation: ${isSel ? 'neonPulse 2s infinite' : 'none'};
                                       text-transform: uppercase; font-size: 0.8rem;">
                            ${r.number}º
                        </button>
                    `}).join('')}
                    ${replayButtonHtml}
                </div>
            `;
        }

        renderStandingsView() {
            if (!window.ControlTowerStandings) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerStandings.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderSummaryView() {
            if (!window.ControlTowerStats) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerStats.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderTournamentCard(match) {
            try {
                const user = window.Store ? window.Store.getState('currentUser') : null;
                const isEntreno = this.currentAmericanaDoc?.isEntreno;
                const colorClass = `border-${(match.court % 4) + 1}`;

                // --- 1. USER CONTEXT & PERMISSIONS ---
                const getTeamName = (namesArr, teamStr) => {
                    if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
                    if (Array.isArray(namesArr)) return namesArr.join(' / ');
                    return String(namesArr || '');
                };

                const safeTeamA = getTeamName(match.team_a_names, match.teamA) || 'EQUIPO A';
                const safeTeamB = getTeamName(match.team_b_names, match.teamB) || 'EQUIPO B';

                const isPartA = user && (match.team_a_ids?.includes(user.uid) || safeTeamA.toLowerCase().includes((user.name || '').toLowerCase()));
                const isPartB = user && (match.team_b_ids?.includes(user.uid) || safeTeamB.toLowerCase().includes((user.name || '').toLowerCase()));
                const isMyMatch = isPartA || isPartB;
                const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain'].includes((user?.role || '').toLowerCase());

                // --- 2. STATUS & THEME ---
                const evtStatus = this.currentAmericanaDoc?.status;
                const isFinished = match.isFinished || match.status === 'finished';
                const isLive = evtStatus === 'live' && !isFinished;

                let statusBadge = '';
                if (isFinished) {
                    statusBadge = '<span style="background: #25D366; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">FINALIZADO</span>';
                } else if (isLive) {
                    statusBadge = '<span class="status-badge-live" style="animation: pulse 1s infinite alternate;">⚡ EN JUEGO</span>';
                } else {
                    statusBadge = '<span style="background: rgba(255,255,255,0.1); color: #888; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">PROGRAMADO</span>';
                }

                const sA = parseInt(match.score_a || 0);
                const sB = parseInt(match.score_b || 0);

                const timeLabel = (window.calculateMatchTime && typeof window.calculateMatchTime === 'function')
                    ? window.calculateMatchTime(this.currentAmericanaDoc?.time || "10:00", parseInt(match.round) || 1)
                    : "Seguido";

                // --- 3. DYNAMIC STYLES ---
                const cardStyle = isMyMatch && isLive
                    ? 'border: 3px solid #CCFF00; box-shadow: 0 0 35px rgba(204, 255, 0, 0.4); transform: scale(1.03); z-index: 10;'
                    : 'border: 1px solid var(--border-subtle);';

                const winnerA = isFinished && sA > sB;
                const winnerB = isFinished && sB > sA;

                // --- 4. ACTION AREA (UX REVOLUTION) ---
                const canEdit = (evtStatus === 'live' || evtStatus === 'adjusting') && user;
                let actionArea = '';

                if (isFinished) {
                    const userDelta = isPartA ? (match.delta_a || 0) : (match.delta_b || 0);
                    if (!window._matchRegistry) window._matchRegistry = {};
                    window._matchRegistry[match.id] = match;

                    actionArea = `
                        <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
                            <button onclick="shareVictory('${match.id}', ${userDelta})"
                                    style="background: linear-gradient(135deg, #CCFF00 0%, #00E36D 100%); color: black; border: none; padding: 14px; border-radius: 16px; font-size: 0.8rem; cursor: pointer; font-weight: 950; box-shadow: 0 4px 15px rgba(204,255,0,0.3); display: flex; align-items: center; gap: 10px; justify-content: center; text-transform: uppercase; width: 100%;">
                                <i class="fab fa-instagram" style="font-size: 1.1rem;"></i> COMPARTIR VICTORIA
                            </button>
                            ${isAdmin ? `
                                <button onclick="window.ControlTowerView.unlockMatch('${match.id}')" style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #666; padding: 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700;">
                                    <i class="fas fa-lock-open"></i> DESBLOQUEAR PARA EDITAR
                                </button>
                            ` : ''}
                        </div>
                    `;
                } else if (canEdit) {
                    // NEW HIGH-INTERACTION PAD FOR PLAYERS
                    actionArea = `
                        <div style="margin-top:20px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.05);">
                            <div style="text-align:center; margin-bottom:15px;">
                                <span style="font-size:0.6rem; font-weight:950; color:var(--brand-neon); letter-spacing:2px; text-transform:uppercase;">INTRODUCIR RESULTADO</span>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                                <!-- TEAM A CONTROLS -->
                                <div style="display:flex; flex-direction:column; align-items:center; gap:10px; background:rgba(255,255,255,0.02); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:0.6rem; color:#888; font-weight:900; text-transform:uppercase;">EQ. ARRIBA</div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', -1)" style="width:40px; height:40px; border-radius:50%; border:none; background:#333; color:white; font-size:1.5rem; display:flex; align-items:center; justify-content:center;">-</button>
                                        <span id="score-a-val-${match.id}" style="font-size:2rem; font-weight:950; color:white; min-width:40px; text-align:center;">${sA}</span>
                                        <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', 1)" style="width:40px; height:40px; border-radius:50%; border:none; background:var(--brand-neon); color:black; font-size:1.5rem; display:flex; align-items:center; justify-content:center;">+</button>
                                    </div>
                                </div>
                                <!-- TEAM B CONTROLS -->
                                <div style="display:flex; flex-direction:column; align-items:center; gap:10px; background:rgba(255,255,255,0.02); padding:15px; border-radius:20px; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:0.6rem; color:#888; font-weight:900; text-transform:uppercase;">EQ. ABAJO</div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', -1)" style="width:40px; height:40px; border-radius:50%; border:none; background:#333; color:white; font-size:1.5rem; display:flex; align-items:center; justify-content:center;">-</button>
                                        <span id="score-b-val-${match.id}" style="font-size:2rem; font-weight:950; color:white; min-width:40px; text-align:center;">${sB}</span>
                                        <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', 1)" style="width:40px; height:40px; border-radius:50%; border:none; background:var(--brand-neon); color:black; font-size:1.5rem; display:flex; align-items:center; justify-content:center;">+</button>
                                    </div>
                                </div>
                            </div>
                            <button onclick="window.ControlTowerView.finishMatch('${match.id}')" 
                                    style="width:100%; margin-top:20px; padding:18px; background:var(--brand-neon); color:black; font-weight:950; font-size:1rem; border:none; border-radius:20px; box-shadow: 0 10px 25px rgba(204,255,0,0.3); display:flex; align-items:center; justify-content:center; gap:12px; transition:0.3s;"
                                    onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                                <i class="fas fa-check-circle" style="font-size:1.2rem;"></i> FINALIZAR PARTIDO
                            </button>
                        </div>
                    `;
                } else if (!isFinished && !canEdit) {
                    actionArea = `
                        <div style="margin-top:15px; padding:12px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:12px; text-align:center;">
                            <span style="font-size:0.7rem; color:#666; font-weight:700;">MODO ESPECTADOR • SOLO LECTURA</span>
                        </div>
                    `;
                }

                return `
                    <div id="tour-match-${match.id}" class="tour-match-card ${colorClass}" style="
                        background: #0f172a; 
                        border-radius: 32px; 
                        overflow: hidden; 
                        box-shadow: 0 15px 40px rgba(0,0,0,0.4);
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        ${cardStyle}
                    ">
                        <!-- CARD HEADER -->
                        <div style="padding: 16px 24px; background: rgba(0,0,0,0.2); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <span style="font-size: 0.65rem; font-weight: 900; color: rgba(255,255,255,0.5); letter-spacing: 1.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 8px; height: 8px; background: var(--brand-neon); border-radius: 50%; box-shadow: 0 0 10px var(--brand-neon);"></div>
                                PISTA ${match.court} • P${match.round} • ${timeLabel}
                            </span>
                            <div class="status-area">${statusBadge}</div>
                        </div>
                        
                        <!-- TEAMS & SCORES -->
                        <div style="padding: 24px;">
                            <!-- TEAM A -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                                    <div style="font-size: 1.05rem; color: #fff; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px;">
                                        ${winnerA ? '<i class="fas fa-trophy" style="color: var(--brand-neon); font-size: 0.9rem;"></i>' : ''}
                                        <span style="${winnerA ? 'border-bottom: 2px solid var(--brand-neon);' : ''}">${safeTeamA}</span>
                                    </div>
                                    ${isPartA ? '<span style="color: var(--brand-neon); font-size: 0.6rem; font-weight: 950; letter-spacing: 1px;">TU EQUIPO ★</span>' : ''}
                                </div>
                                <div id="match-score-a-${match.id}" style="
                                    background: ${winnerA ? 'var(--brand-neon)' : 'rgba(255,255,255,0.05)'}; 
                                    color: ${winnerA ? 'black' : 'white'}; 
                                    min-width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; 
                                    font-weight: 950; font-size: 1.6rem; border: 1px solid ${winnerA ? 'var(--brand-neon)' : 'rgba(255,255,255,0.1)'};
                                    box-shadow: ${winnerA ? '0 0 20px rgba(204,255,0,0.3)' : 'none'};
                                    transition: all 0.3s;
                                ">${sA}</div>
                            </div>
                            
                            <!-- DIVIDER -->
                            <div style="height: 1px; background: linear-gradient(to right, rgba(204,255,0,0.4), transparent); margin-bottom: 20px; position: relative;">
                                <div style="position: absolute; left: 0; top: -1px; width: 40px; height: 3px; background: var(--brand-neon); border-radius: 10px;"></div>
                            </div>
                            
                            <!-- TEAM B -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                                    <div style="font-size: 1.05rem; color: #fff; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px;">
                                        ${winnerB ? '<i class="fas fa-trophy" style="color: var(--brand-neon); font-size: 0.9rem;"></i>' : ''}
                                        <span style="${winnerB ? 'border-bottom: 2px solid var(--brand-neon);' : ''}">${safeTeamB}</span>
                                    </div>
                                    ${isPartB ? '<span style="color: var(--brand-neon); font-size: 0.6rem; font-weight: 950; letter-spacing: 1px;">TU EQUIPO ★</span>' : ''}
                                </div>
                                <div id="match-score-b-${match.id}" style="
                                    background: ${winnerB ? 'var(--brand-neon)' : 'rgba(255,255,255,0.05)'}; 
                                    color: ${winnerB ? 'black' : 'white'}; 
                                    min-width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; 
                                    font-weight: 950; font-size: 1.6rem; border: 1px solid ${winnerB ? 'var(--brand-neon)' : 'rgba(255,255,255,0.1)'};
                                    box-shadow: ${winnerB ? '0 0 20px rgba(204,255,0,0.3)' : 'none'};
                                    transition: all 0.3s;
                                ">${sB}</div>
                            </div>
                            
                            <!-- ACTION AREA -->
                            ${actionArea}
                        </div>
                    </div>
                `;
            } catch (err) {
                console.error("Match Render Error:", err, match);
                return `<div style="padding:20px; color:red; font-size:0.7rem;">Error al cargar tarjeta de partido: ${err.message}</div>`;
            }
        }

        async adjustScore(matchId, field, delta) {
            // Find the match in local state
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            // 1. UPDATE LOCAL STATE (Optimistic)
            const currentVal = parseInt(match[field] || 0);
            const newVal = Math.max(0, currentVal + delta);
            match[field] = newVal;

            // 2. TRIGGER UI SYNC IMMEDIATELY
            // This will call recalc() -> render() -> smartUpdateResults()
            // Since we updated match[field], the UI will reflect it instantly.
            this.recalc();

            // 3. HAPTIC FEEDBACK
            if (window.navigator?.vibrate) window.navigator.vibrate(20);

            // 4. PERSIST TO FIREBASE
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            try {
                await window.db.collection(collection).doc(matchId).update({
                    [field]: newVal
                });
                console.log(`✅ Score synced to cloud: ${field} = ${newVal}`);
            } catch (e) {
                console.error("❌ Firebase update failed:", e);
                // On failure, the next snapshot will naturally roll back the UI
                alert("Error al guardar: " + (e.message.includes('permission') ? "No tienes permisos." : e.message));
            }
        }

        async finishMatch(matchId) {
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            // Haptic feedback
            if (window.navigator?.vibrate) window.navigator.vibrate([30, 50, 30]);

            try {
                await window.db.collection(collection).doc(matchId).update({
                    status: 'finished'
                });
                console.log("Match finished:", matchId);

                if (window.LevelService) {
                    const match = this.allMatches.find(m => m.id === matchId);
                    if (match) {
                        const updatedMatch = { ...match, status: 'finished' };
                        window.LevelService.processMatchResult(updatedMatch, isEntreno ? 'entreno' : 'americana');
                    }
                }
            } catch (e) {
                console.error("Finish match failed:", e);
            }
        }

        async unlockMatch(matchId) {
            if (!confirm("¿Desbloquear partido para corregir el resultado?")) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';
            try {
                await window.db.collection(collection).doc(matchId).update({
                    status: 'live'
                });
                console.log("Match unlocked:", matchId);
                this.recalc();
            } catch (e) {
                console.error("Unlock failed:", e);
            }
        }

        // KEEP LEGACY METHOD FOR ENTRENOS
        async setMatchWinner(matchId, winnerTeam, round) {
            const confirmMsg = "Confirmar resultado:\n\n" + (winnerTeam === 'A' ? "Gana Pareja 1" : "Gana Pareja 2");
            if (!confirm(confirmMsg)) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            try {
                const updateData = {
                    score_a: winnerTeam === 'A' ? 1 : 0,
                    score_b: winnerTeam === 'B' ? 1 : 0,
                    status: 'finished'
                };

                await window.db.collection(collection).doc(matchId).update(updateData);
                console.log(`✅ Match Result Saved.`);

                // 📈 UPDATE PLAYER LEVELS
                if (window.LevelService) {
                    const match = this.allMatches.find(m => m.id === matchId);
                    if (match) {
                        const updatedMatch = { ...match, ...updateData };
                        window.LevelService.processMatchResult(updatedMatch, isEntreno ? 'entreno' : 'americana');
                    }
                }
            } catch (e) {
                console.error("Error setting match winner:", e);
                alert("Error al guardar resultado.");
            }
        }

        async triggerNextRound(round) {
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const eventType = isEntreno ? 'entreno' : 'americana';
            const nextRound = round + 1;

            const nextRoundExists = this.allMatches.some(m => parseInt(m.round) === nextRound);

            let msg = "¿CONFIRMAR CAMBIO DE RONDA?\\n\\nAsegúrate de que todos los resultados sean correctos.";
            if (nextRoundExists) {
                msg = `⚠️ ATENCIÓN: LA RONDA ${nextRound} YA EXISTE\\n\\nAl confirmar, SE BORRARÁ la Ronda ${nextRound} actual y se regenerará con los nuevos resultados.\\n\\n¿Estás seguro de que deseas regenerar cruces?`;
            }

            if (!confirm(msg)) return;

            const btnContainer = document.getElementById('next-round-btn-container');
            if (btnContainer) {
                btnContainer.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; gap:15px; padding:20px;"><div class="loader"></div><span style="font-weight:800; color:#888;">GENERANDO...</span></div>';
            }

            try {
                if (nextRoundExists) {
                    console.log(`♻️ Regenerating Round ${nextRound}... deleting old matches.`);
                    await window.AmericanaService.deleteRound(this.currentAmericanaDoc.id, nextRound, eventType);
                }

                if (window.AmericanaService && window.AmericanaService.generateNextRound) {
                    await window.AmericanaService.generateNextRound(this.currentAmericanaDoc.id, round, eventType);
                } else if (window.AmericanaService && window.AmericanaService.generateEntrenoNextRound && isEntreno) {
                    await window.AmericanaService.generateEntrenoNextRound(this.currentAmericanaDoc.id, round);
                }

                // --- AUTO-TRANSITION LOGIC ---
                console.log("⏳ Waiting for matches to sync...");

                // Helper to wait for matches
                const waitForMatches = async () => {
                    let attempts = 0;
                    while (attempts < 20) { // Try for ~10 seconds
                        // Force a check/re-render might be needed if state is external, 
                        // but usually this.allMatches updates via listener. 
                        // We check this.allMatches directly.
                        const matchesForNextRound = this.allMatches.filter(m => parseInt(m.round) === nextRound);
                        if (matchesForNextRound.length > 0) return matchesForNextRound;

                        await new Promise(r => setTimeout(r, 500));
                        attempts++;
                    }
                    return [];
                };

                const newMatches = await waitForMatches();

                if (newMatches.length > 0 && window.ShuffleAnimator) {
                    // Play Animation
                    window.ShuffleAnimator.animate({
                        round: nextRound,
                        players: this.currentAmericanaDoc?.players || [],
                        courts: this.currentAmericanaDoc?.max_courts || 4,
                        matches: newMatches
                    }, () => {
                        // ON COMPLETE: Switch Tab
                        this.goToRound(nextRound);
                    });
                } else {
                    // Fallback if no animation or timeout
                    this.goToRound(nextRound);
                    alert("Ronda generada (Animación omitida por timeout de sincronización).");
                }

            } catch (e) {
                console.error(e);
                alert("Error al generar ronda: " + e.message);
                this.recalc();
            }
        }

        renderReportView() {
            if (!window.ControlTowerReport) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerReport.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderHistoryContent() {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const stats = this.userStats || { games: 0, wins: 0, events: 0 };
            const winRate = stats.events > 0 ? Math.round((stats.wins / (stats.wins + (stats.losses || 0) || 1)) * 100) : 0;

            return `
                <div class="fade-in" style="padding: 10px 5px 120px; font-family: 'Outfit', sans-serif;">
                    
                <!-- SOMOSPADEL LIVE DASHBOARD (Real Community Data) -->
                <div style="background: linear-gradient(135deg, #111 0%, #050505 100%); padding: 30px; border-radius: 32px; border: 1px solid rgba(204,255,0,0.15); margin-bottom: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.03; color: #CCFF00; transform: rotate(-15deg);"><i class="fas fa-users"></i></div>
                    
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                        <div style="width: 45px; height: 45px; background: #CCFF00; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 1.3rem; box-shadow: 0 0 20px rgba(204,255,0,0.4);">
                            <i class="fas fa-broadcast-tower"></i>
                        </div>
                        <div>
                            <h2 style="color: #fff; font-size: 1.15rem; font-weight: 950; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Panel de Comunidad</h2>
                            <p style="color: #64748b; font-size: 0.75rem; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Estatus Real • SomosPadel BCN</p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <!-- Real Data: Total Players -->
                        <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.65rem; color: #888; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Jugadores en Club</div>
                            <div style="font-size: 1.8rem; font-weight: 950; color: #fff; display: flex; align-items: baseline; gap: 5px;">
                                ${window.Store.getState('players')?.length || '120'}<span style="font-size: 0.8rem; color: #CCFF00;">+</span>
                            </div>
                        </div>
                        
                        <!-- Real Data: Next Event -->
                        <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.65rem; color: #888; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Próxima Cita</div>
                            <div style="font-size: 1rem; font-weight: 950; color: #3b82f6; margin-top: 5px; line-height: 1.2;">
                                📅 ${(window.Store.getState('americanas')?.[0]?.date) || 'Próximamente'}
                            </div>
                        </div>
                    </div>

                    <!-- Community Power Metric -->
                    <div style="background: rgba(204,255,0,0.05); padding: 15px; border-radius: 20px; border: 1px dashed rgba(204,255,0,0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.7rem; color: #fff; font-weight: 900; text-transform: uppercase;">Actividad Global de la Semana</span>
                            <span style="font-size: 0.7rem; color: #CCFF00; font-weight: 950;">ALTA 🔥</span>
                        </div>
                        <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                            <div style="width: 85%; height: 100%; background: #CCFF00; box-shadow: 0 0 10px #CCFF00;"></div>
                        </div>
                    </div>
                </div>

                    <!-- RECENT TIMELINE -->
                    <h3 style="font-family:'Outfit'; font-weight: 950; color: #fff; margin: 0 0 20px 5px; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; letter-spacing: 1px;">
                        <i class="fas fa-history" style="color: #CCFF00;"></i> CRONOLOGÍA HISTÓRICA
                    </h3>

                    <div style="display: grid; gap: 15px;">
                        ${this.userHistory.length === 0 ? `
                            <!-- EMPTY STATE: PRO DASHBOARD MODE (Copied to ControlTower) -->
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 25px; text-align: center; position: relative; overflow: hidden;">
                                
                                <!-- Simulated Radar Chart Visual -->
                                <div style="margin-bottom: 20px;">
                                    <div style="font-size: 0.8rem; color: #888; margin-bottom: 15px; font-weight: 700; text-transform:uppercase; letter-spacing:1px;">ANÁLISIS DE ATRIBUTOS (Nivel ${user && user.level ? parseFloat(user.level).toFixed(2) : '3.50'})</div>
                                    <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 100px; padding: 0 20px;">
                                        <!-- Bars Logic based on Level -->
                                        ${(() => {
                        const l = user ? parseFloat(user.level || 3.5) : 3.5;
                        const atk = Math.min(100, l * 15 + 20);
                        const def = Math.min(100, l * 12 + 30);
                        const tec = Math.min(100, l * 14 + 10);
                        const fis = Math.min(100, l * 10 + 40);

                        const bar = (h, color, label) => `
                                                <div style="display:flex; flex-direction:column; align-items:center; gap:8px; flex:1;">
                                                    <div style="width: 80%; height: 80px; background: rgba(255,255,255,0.05); border-radius: 10px; position: relative; overflow: hidden;">
                                                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${h}%; background: ${color}; transition: height 1s ease;"></div>
                                                    </div>
                                                    <span style="font-size: 0.6rem; font-weight: 800; color: #aaa;">${label}</span>
                                                </div>
                                            `;
                        return bar(atk, '#ef4444', 'ATAQUE') + bar(def, '#3b82f6', 'DEFENSA') + bar(tec, '#CCFF00', 'TÉCNICA') + bar(fis, '#f59e0b', 'FÍSICO');
                    })()}
                                    </div>
                                </div>

                                <p style="font-size: 0.85rem; color: #ddd; margin: 0 0 20px; font-weight: 500; line-height: 1.5;">
                                    Aún no hay partidos registrados este año, pero tu perfil está <b>listo para competir</b>.
                                </p>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <button onclick="window.Router.navigate('americanas')" style="background: #CCFF00; color: black; border: none; padding: 12px; border-radius: 14px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; cursor: pointer;">
                                        <i class="fas fa-trophy" style="margin-right: 5px;"></i> Competir
                                    </button>
                                    <button onclick="window.Router.navigate('ranking')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px; border-radius: 14px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; cursor: pointer;">
                                        <i class="fas fa-chart-bar" style="margin-right: 5px;"></i> Ranking
                                    </button>
                                </div>
                            </div>
                        ` :
                    this.userHistory.map((h, i) => {
                        const amDate = h.date ? new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha desconocida';
                        const isWin = i === 0; // Simple highlight for latest
                        return `
                            <div class="history-item-card" 
                                 onclick="window.ControlTowerView.load('${h.id}'); window.ControlTowerView.switchSection('playing');"
                                 style="
                                    background: rgba(255,255,255,0.03); 
                                    padding: 20px; 
                                    border: 1px solid rgba(255,255,255,0.05); 
                                    border-radius: 26px; 
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    cursor: pointer;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    position: relative;
                                    overflow: hidden;
                                 "
                                 onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(204,255,0,0.3)'; this.style.transform='scale(1.02)';"
                                 onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.05)'; this.style.transform='none';"
                            >
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.03); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #CCFF00; border: 1px solid rgba(255,255,255,0.05);">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 950; font-size: 1rem; color: #fff; margin-bottom: 4px; text-transform: uppercase; letter-spacing: -0.5px;">${h.name}</div>
                                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: #64748b; font-weight: 800;">
                                            <span style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 5px;"><i class="far fa-calendar-alt" style="margin-right: 4px;"></i> ${amDate}</span>
                                            <span style="color: #CCFF00; border: 1px solid rgba(204,255,0,0.2); background: rgba(204,255,0,0.05); padding: 1px 10px; border-radius: 20px; font-size: 0.6rem;">${(h.category || 'PRO').toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.55rem; color: #444; font-weight: 950; text-transform: uppercase;">Full Report</div>
                                        <div style="color: #CCFF00; font-size: 0.9rem;"><i class="fas fa-chevron-right"></i></div>
                                    </div>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            `;
        }

        renderHelpContent() {
            return `
                <div class="fade-in" style="padding: 25px; min-height: 80vh; background: #000; padding-bottom: 120px; font-family: 'Inter', sans-serif; color: white;">
                    <div style="margin-bottom: 30px; border-bottom: 3px solid #CCFF00; padding-bottom: 15px; display: inline-block;">
                        <h2 style="font-family:'Outfit'; font-weight: 950; color: #fff; font-size: 1.8rem; margin: 0; letter-spacing: -0.5px;">GUÍA <span style="color: #CCFF00;">SMART</span> JUGADOR</h2>
                    </div>

                    <div style="display: grid; gap: 25px;">
                        
                        <!-- 1. NIVEL Y RANKING ANUAL -->
                        <div style="background: linear-gradient(135deg, rgba(204,255,0,0.1) 0%, rgba(0,0,0,0) 100%); padding: 25px; border-radius: 30px; border: 1px solid rgba(204,255,0,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                            <div style="font-weight: 950; margin-bottom: 20px; color: #CCFF00; font-size: 1.2rem; display: flex; align-items: center; gap: 12px; text-transform: uppercase;">
                                <div style="width: 40px; height: 40px; background: #CCFF00; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #000;">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                Nivel y Ranking Anual
                            </div>
                            
                            <p style="font-size: 0.9rem; color: #aaa; line-height: 1.6; margin-bottom: 20px;">
                                Tu nivel SomosPadel (0.0 - 7.0) es tu <b>huella competitiva</b>. El <b>Ranking Oficial</b> es el resultado de la <u>suma de todos tus partidos registrados anualmente</u>. A más actividad y victorias, mejor posición.
                            </p>

                            <div style="display: grid; gap: 15px;">
                                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="color: #22c55e; font-weight: 900; font-size: 0.75rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-plus-circle"></i> ¿CÓMO SUMAR?
                                    </div>
                                    <p style="margin: 0; font-size: 0.8rem; color: #888;">Gana partidos, participa en eventos y vence a parejas de nivel superior para subir décimas y escalar en el ranking.</p>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="color: #64748b; font-weight: 900; font-size: 0.75rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-calendar-check"></i> CICLO ANUAL
                                    </div>
                                    <p style="margin: 0; font-size: 0.8rem; color: #888;">El ranking se reinicia cada temporada, premiando la regularidad y el esfuerzo de todo el año.</p>
                                </div>
                            </div>
                        </div>

                        <!-- 2. CHAT TÁCTICO (OPS ROOM) -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(59,130,246,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #3b82f6;">
                                    <i class="fas fa-comments"></i>
                                </div>
                                CHAT EVENTO
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                Canal de comunicación en tiempo real exclusivo de cada evento.
                                <br><br>
                                • <b>SOS:</b> grafía gigante y alto contraste para leer tu pista desde cualquier lugar , es un aviso para los demas compañeros/as por si quieren apuntarse y cubrir la posicion.
                            </div>
                        </div>

                        <!-- 3. MODO TV (CENTER COURT) -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(239,68,68,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                                    <i class="fas fa-tv"></i>
                                </div>
                                Modo TV
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                Diseñado para monitores , tablets  y Smart TVs. Accede desde cualquier evento activo. 
                                <br><br>
                                • <b>ROTACIÓN AUTO:</b> Pasa solo entre marcadores en vivo, clasificación y próximos cruces.
                                <br>• <b>ALTA VISIBILIDAD:</b> Tipografía gigante y alto contraste para leer tu pista desde cualquier lugar 
                            </div>
                        </div>

                        <!-- 4. FORMATOS -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(124,58,237,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #8b5cf6;">
                                    <i class="fas fa-sitemap"></i>
                                </div>
                                Formatos de Competición
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                • <b style="color: #0ea5e9;">🌪️ TWISTER:</b> Cambias de pareja en cada ronda. Sumas juegos individuales.
                                <br><br>
                                • <b style="color: #8b5cf6;">🔒 PAREJA FIJA (Pozo):</b> Juegas siempre con el mismo compañero. Ganas = Subes pista / Pierdes = Bajas pista.
                            </div>
                        </div>

                        <!-- 5. ANALYTICS (MÉTRICAS AVANZADAS) -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(16,185,129,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #10b981;">
                                    <i class="fas fa-robot"></i>
                                </div>
                                Análisis de Rendimiento
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                Tras cada evento, nuestro sistema analiza tu juego basándose en:
                                <br><br>
                                • <b style="color: white;">EFECTIVIDAD:</b> Mide tu peso real en el marcador. ¿Cuántos de los puntos ganados han pasado por tu pala?
                                <br>• <b style="color: white;">CONSISTENCIA:</b> Evalúa si mantienes el mismo nivel técnico en todas las rondas o si tienes picos y valles.
                                <br>• <b style="color: white;">RESISTENCIA:</b> Analiza si tu rendimiento baja en los últimos partidos por cansancio o si mantienes el ritmo.
                            </div>
                        </div>

                    </div>
                </div>
            `;
        }

        async replayShuffleAnimation() {
            if (!window.ShuffleAnimator) return;

            const currentRound = this.selectedRound || 1;
            const currentMatches = this.allMatches.filter(m => parseInt(m.round) === currentRound);

            if (currentMatches.length === 0) {
                alert("No hay emparejamientos en esta ronda para sortear.");
                return;
            }

            window.ShuffleAnimator.animate({
                round: currentRound,
                players: this.currentAmericanaDoc?.players || [],
                courts: this.currentAmericanaDoc?.max_courts || 4,
                matches: currentMatches
            }, () => {
                this.goToRound(currentRound);
            });
        }
    } // End of ControlTowerView class

    // Export class to global scope for fallback instantiation
    window.ControlTowerViewClass = ControlTowerView;
    window.ControlTowerView = new ControlTowerView();
    // --- GLOBAL ACTIONS ---
    window.shareVictory = async (matchId, userDelta) => {
        // 1. Get match data
        const match = window._matchRegistry ? window._matchRegistry[matchId] : null;
        if (!match) return alert("Error: Datos del partido no encontrados.");

        // 2. Format Data for Social View
        const getTeamName = (namesArr, teamStr) => {
            if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
            if (Array.isArray(namesArr)) return namesArr.join(' / ');
            return String(namesArr || '');
        };

        const teamA = getTeamName(match.team_a_names, match.teamA);
        const teamB = getTeamName(match.team_b_names, match.teamB);

        const sA = parseInt(match.score_a || 0);
        const sB = parseInt(match.score_b || 0);

        // Split names (Simple heuristic for demo)
        const splitNames = (str) => {
            const p = str.split(' / ');
            return { p1: p[0] || '', p2: p[1] || '' };
        };

        const tA = splitNames(teamA);
        const tB = splitNames(teamB);

        const socialData = {
            score: `${sA}-${sB}`,
            player1: tA.p1,
            partner1: tA.p2,
            player2: tB.p1,
            partner2: tB.p2,
            location: 'SomosPadel BCN',
            date: new Date().toLocaleDateString()
        };

        // 3. Open Creator Mode
        window.SocialShareView.open(socialData);
    };

    console.log("🗼 ControlTowerView (Pro) v4005 Initialized");
})();

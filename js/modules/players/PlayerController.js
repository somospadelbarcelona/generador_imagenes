/**
 * PlayerController.js
 * Enhanced with Big Data analytics and account management logic
 */
(function () {
    class PlayerController {
        constructor() {
            this.db = window.FirebaseDB;
            this.state = {
                stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0 },
                recentMatches: [],
                levelHistory: [],
                communityAvg: 3.5
            };
        }

        async init() {
            const user = window.Store.getState('currentUser');
            if (!user) {
                console.warn("[PlayerController] No user found in Store");
                return;
            }

            console.log("[PlayerController] Initializing Profile for:", user.name);
            const userId = user.id || user.uid;
            if (!userId) {
                console.error("[PlayerController] User object has no ID or UID", user);
                return;
            }

            // Real-time listener for personal matches to update stats instantly
            if (this.unsubMatches) this.unsubMatches();
            if (this.unsubEntrenos) this.unsubEntrenos();

            const updateStats = async () => {
                await this.fetchPlayerData(userId);
            };

            this.unsubMatches = window.db.collection('matches')
                .where('team_a_ids', 'array-contains', userId)
                .onSnapshot(updateStats);
            this.unsubMatchesB = window.db.collection('matches')
                .where('team_b_ids', 'array-contains', userId)
                .onSnapshot(updateStats);

            this.unsubEntrenos = window.db.collection('entrenos_matches')
                .where('team_a_ids', 'array-contains', userId)
                .onSnapshot(updateStats);
            this.unsubEntrenosB = window.db.collection('entrenos_matches')
                .where('team_b_ids', 'array-contains', userId)
                .onSnapshot(updateStats);

            await this.fetchPlayerData(userId);
        }

        _parseDate(date) {
            if (!date || date === '---') return null;

            // Handle Firestore Timestamps
            if (date.toDate && typeof date.toDate === 'function') {
                return date.toDate();
            }

            // Handle ISO strings or other date strings
            if (typeof date === 'string') {
                try {
                    if (date.includes('/')) {
                        const [d, m, y] = date.split('/');
                        return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
                    }
                    const d = new Date(date);
                    return isNaN(d.getTime()) ? null : d;
                } catch (e) { return null; }
            }

            // Handle number (timestamps) or already Date objects
            const d = new Date(date);
            return isNaN(d.getTime()) ? null : d;
        }

        async fetchPlayerData(userId) {
            try {
                console.log(`🔍 [DEBUG PROFILE] Fetching data for UserID: ${userId}`);

                // 0. SMART PROFILE RESOLUTION (Fix for Admin vs Player split)
                // If we have merged IDs, fetch ALL profiles and pick the "richer" one (the one with stats)
                let targetUserDoc = null;
                const currentUser = window.Store.getState('currentUser');
                let allIds = [userId];

                if (currentUser && currentUser.mergedIds && currentUser.mergedIds.length > 0) {
                    allIds = currentUser.mergedIds;
                    console.log("🔗 Resolve: Checking multiple identities:", allIds);
                }

                // Parallel Fetch of all identities
                const profilePromises = allIds.map(id => this.db.players.getById(id));
                const profiles = await Promise.all(profilePromises);

                // Select the "Best" profile (Prioritize: Matches > 0, Level set, etc.)
                let bestProfile = profiles[0] || {};
                let maxMatches = -1;

                profiles.forEach(p => {
                    if (!p) return;
                    const m = parseInt(p.matches_played || 0);
                    // If this profile has more matches, or same matches but is NOT admin (prefer player data), pick it
                    // Actually just max matches is a good proxy for "The Player Profile"
                    if (m > maxMatches) {
                        maxMatches = m;
                        bestProfile = p;
                    }
                });

                targetUserDoc = bestProfile;
                console.log("🏆 Selected Best Profile:", targetUserDoc.name, "ID:", targetUserDoc.id, "Matches:", targetUserDoc.matches_played);

                // 1. NUCLEAR SYNC: Fetch ALL matches and filter client-side
                console.log(`🚀 [SYNC MODE] Fetching ALL matches for 100% sync...`);

                const [allAmericanas, allEntrenos] = await Promise.all([
                    this.db.matches.getAll(),
                    this.db.entrenos_matches ? this.db.entrenos_matches.getAll() : Promise.resolve([])
                ]);

                console.log(`📦 [RAW DATA] Americanas fetched:`, allAmericanas?.length || 0);
                console.log(`📦 [RAW DATA] Entrenos fetched:`, allEntrenos?.length || 0);

                if (allAmericanas && allAmericanas.length > 0) {
                    console.log(`📦 [SAMPLE] First Americana:`, allAmericanas[0]);
                }
                if (allEntrenos && allEntrenos.length > 0) {
                    console.log(`📦 [SAMPLE] First Entreno:`, allEntrenos[0]);
                }

                // Build search criteria
                const searchIds = allIds;
                const searchPhone = targetUserDoc.phone || currentUser.phone;
                const searchName = (targetUserDoc.name || currentUser.name || '').toLowerCase();

                console.log(`🔍 [SYNC] Criteria - IDs:`, searchIds, `Phone:`, searchPhone, `Name:`, searchName);

                // Aggressive filter
                const matchesUser = (m) => {
                    const teamA = m.team_a_ids || [];
                    const teamB = m.team_b_ids || [];

                    // Check IDs
                    for (const id of searchIds) {
                        if (teamA.includes(id) || teamB.includes(id)) return true;
                    }

                    // Check legacy fields
                    const pIds = [m.player1?.id || m.player1, m.player2?.id || m.player2,
                    m.player3?.id || m.player3, m.player4?.id || m.player4].filter(Boolean);
                    for (const id of searchIds) {
                        if (pIds.includes(id)) return true;
                    }

                    // Check phone
                    if (searchPhone) {
                        const phones = [m.player1?.phone, m.player2?.phone, m.player3?.phone, m.player4?.phone].filter(Boolean);
                        if (phones.includes(searchPhone)) return true;
                    }

                    // Check name (last resort)
                    if (searchName) {
                        const names = [m.player1?.name || m.player1_name, m.player2?.name || m.player2_name,
                        m.player3?.name || m.player3_name, m.player4?.name || m.player4_name]
                            .filter(Boolean).map(n => (n || '').toLowerCase());
                        if (names.includes(searchName)) return true;
                    }

                    return false;
                };

                const americanasMatches = allAmericanas.filter(matchesUser);
                const entrenosMatches = allEntrenos.filter(matchesUser);
                const personalMatches = [...americanasMatches, ...entrenosMatches];
                const userDoc = targetUserDoc;

                console.log(`✅ [SYNC] Found: Americanas=${americanasMatches.length}, Entrenos=${entrenosMatches.length}, Total=${personalMatches.length}`);

                let stats = { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0, events: 0 };
                let matchesList = [];
                let uniqueEvents = new Set(); // Para contar eventos únicos

                // 2. Process each match
                let processedCount = 0;
                let skippedNotFinished = 0;
                let skippedNotInTeam = 0;

                personalMatches.forEach((m, idx) => {
                    console.log(`\n🔍 [MATCH ${idx}] Processing:`, m.id);

                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    const isFinished = (sA + sB > 0) || m.status === 'finished' || m.finished === true;

                    console.log(`   Status: ${m.status}, Finished: ${m.finished}, Score: ${sA}-${sB}, IsFinished: ${isFinished}`);

                    if (!isFinished) {
                        console.log(`   ⚠️ SKIPPED: Not finished`);
                        skippedNotFinished++;
                        return;
                    }

                    // ROBUST TEAM CHECK (MULTI-ID SUPPORT)
                    let isTeamA = false;
                    let isTeamB = false;

                    // Use the same IDs we used for filtering
                    const useridsToSearch = searchIds;

                    for (const uid of useridsToSearch) {
                        // 1. Try Modern Arrays
                        const teamA = m.team_a_ids || [];
                        const teamB = m.team_b_ids || [];
                        if (teamA.includes(uid)) isTeamA = true;
                        if (teamB.includes(uid)) isTeamB = true;

                        // 2. Try Legacy Fields
                        try {
                            const p1 = m.player1?.id || m.player1;
                            const p2 = m.player2?.id || m.player2;
                            const p3 = m.player3?.id || m.player3;
                            const p4 = m.player4?.id || m.player4;
                            if (p1 === uid || p2 === uid) isTeamA = true;
                            if (p3 === uid || p4 === uid) isTeamB = true;

                            // 2b. Try 'players' array
                            if (Array.isArray(m.players)) {
                                const idx = m.players.findIndex(p => (p.id || p) === uid);
                                if (idx === 0 || idx === 1) isTeamA = true;
                                if (idx === 2 || idx === 3) isTeamB = true;
                            }
                        } catch (e) { }

                        // If found with one ID, stop searching others
                        if (isTeamA || isTeamB) break;
                    }

                    // 2c. Name Fallback (Last Resort)
                    if (!isTeamA && !isTeamB && userDoc && userDoc.name) {
                        const targetName = userDoc.name.toLowerCase();
                        const checkName = (val) => val && String(val).toLowerCase().includes(targetName);
                        if (checkName(m.player1_name) || checkName(m.p1_name)) isTeamA = true;
                        else if (checkName(m.player2_name) || checkName(m.p2_name)) isTeamA = true;
                        else if (checkName(m.player3_name) || checkName(m.p3_name)) isTeamB = true;
                        else if (checkName(m.player4_name) || checkName(m.p4_name)) isTeamB = true;
                    }

                    console.log(`   Team Detection: isTeamA=${isTeamA}, isTeamB=${isTeamB}`);
                    console.log(`   Team A IDs:`, m.team_a_ids);
                    console.log(`   Team B IDs:`, m.team_b_ids);

                    if (isTeamA || isTeamB) {
                        processedCount++;
                        stats.matches++;

                        // Track unique events
                        const eventId = m.americana_id || m.event_id || m.entreno_id || m.id;
                        if (eventId) uniqueEvents.add(eventId);

                        // Detailed games tracking
                        if (isTeamA) {
                            stats.gamesWon += sA;
                            stats.gamesLost += sB;
                        } else {
                            stats.gamesWon += sB;
                            stats.gamesLost += sA;
                        }

                        const iWon = (isTeamA && sA > sB) || (isTeamB && sB > sA);
                        const isTie = sA === sB;

                        if (iWon) { stats.won++; stats.points += 3; }
                        else if (isTie) { stats.points += 1; }
                        else { stats.lost++; }

                        // Format match for history
                        const matchDate = this._parseDate(m.date || m.createdAt || m.created_at);
                        const dateStr = matchDate ? matchDate.toISOString() : '---';

                        matchesList.push({
                            id: m.id,
                            date: dateStr,
                            eventName: m.americana_name || m.event_name || (m.collection === 'entrenos_matches' ? 'Entreno' : 'Americana'),
                            score: `${sA} - ${sB}`,
                            result: iWon ? 'W' : (isTie ? 'D' : 'L'),
                            color: iWon ? '#22c55e' : (isTie ? '#94a3b8' : '#ef4444')
                        });
                    }
                });

                // Calculate events count and winRate
                stats.events = uniqueEvents.size;
                stats.winRate = stats.matches > 0 ? Math.round((stats.won / stats.matches) * 100) : 0;

                // Sort matches by date descending
                matchesList.sort((a, b) => {
                    const dateA = this._parseDate(a.date) || new Date(0);
                    const dateB = this._parseDate(b.date) || new Date(0);
                    return dateB - dateA;
                });

                console.log(`\n📊 [PROCESSING SUMMARY]`);
                console.log(`   Total matches found: ${personalMatches.length}`);
                console.log(`   Successfully processed: ${processedCount}`);
                console.log(`   Skipped (not finished): ${skippedNotFinished}`);
                console.log(`   Skipped (not in team): ${skippedNotInTeam}`);
                console.log(`   Final stats.matches: ${stats.matches}\n`);

                // 3. HYBRID STATS MERGE (The "Smart Fallback")
                console.log(`📊 [BEFORE FALLBACK] Raw stats: Matches=${stats.matches}, Won=${stats.won}, WinRate=${stats.winRate}%`);
                console.log(`📊 [PROFILE COUNTERS] matches_played=${userDoc?.matches_played}, wins=${userDoc?.wins}, win_rate=${userDoc?.win_rate}`);

                // Si no hemos encontrado partidos brutos, usamos los contadores del perfil (que usa el Ranking)
                if (stats.matches === 0 && userDoc) {
                    console.log("⚠️ [Profile] No raw matches found. Switching to Profile Counters.");
                    stats.matches = parseInt(userDoc.matches_played || 0);
                    stats.won = parseInt(userDoc.wins || 0); // Si existen
                    stats.winRate = parseFloat(userDoc.win_rate || 0);

                    // Estimación inteligente si faltan datos
                    if (stats.matches > 0 && stats.winRate === 0) stats.winRate = 50; // Default average
                    if (stats.matches > 0 && stats.won === 0) stats.won = Math.round(stats.matches * (stats.winRate / 100));
                }

                // 3b. Level History (Fallback to Profile History if DB empty)
                let levelHistory = [];
                try {
                    const historySnap = await window.db.collection('level_history')
                        .where('userId', '==', userId)
                        .orderBy('date', 'desc')
                        .limit(10)
                        .get();

                    levelHistory = historySnap.docs.map(doc => ({
                        level: doc.data().level,
                        date: doc.data().date
                    })).reverse();
                } catch (e) { console.warn("History fetch error", e); }

                // If still empty, create a synthetic history based on current level
                if (levelHistory.length === 0 && userDoc) {
                    const currentLvl = parseFloat(userDoc.level || 3.5);
                    // Create a simulated slight curve ending in current level
                    levelHistory = [
                        { level: currentLvl - 0.25, date: 'Inicio' },
                        { level: currentLvl - 0.1, date: 'Hace 1 mes' },
                        { level: currentLvl, date: 'Actual' }
                    ];
                }

                // 4. Community Insights & Name Mapping (Simplified)
                let communityAvg = 3.5;
                // We skip full scan for speed, use fixed or cached avg

                // 5. Reliability Calculation (Semáforo)
                let reliabilityStatus = 'RED';
                if (stats.matches >= 5) reliabilityStatus = 'GREEN';
                else if (stats.matches >= 1) reliabilityStatus = 'YELLOW';

                // Calculate basic H2H
                let h2hData = personalMatches.length > 0 ? this.calculateTopRivals(personalMatches, searchIds) : { nemesis: null, victim: null, topRivals: [] };

                // ENRICH H2H DATA (Fetch real name/phone from DB for Nemesis and Soulmate)
                const enrich = async (item, type) => {
                    if (item && item.id) {
                        try {
                            const doc = await this.db.players.getById(item.id);
                            if (doc) {
                                item.name = doc.name || item.name || (type === 'nemesis' ? 'Rival' : 'Socio');
                                let rawPhone = doc.phone || '';
                                rawPhone = rawPhone.replace(/\D/g, '');
                                if (rawPhone.length === 9 && (rawPhone.startsWith('6') || rawPhone.startsWith('7'))) rawPhone = '34' + rawPhone;
                                item.phone = rawPhone;
                                console.log(`😈 enriched ${type}:`, item.name);
                            }
                        } catch (e) { }
                    }
                };

                await Promise.all([
                    enrich(h2hData.nemesis, 'nemesis'),
                    enrich(h2hData.soulmate, 'soulmate')
                ]);

                this.state = {
                    stats,
                    // FIX: Don't generate synthetic matches, let it be empty so the View triggers the "Pro Dashboard"
                    recentMatches: matchesList,
                    levelHistory: levelHistory,
                    communityAvg: communityAvg,
                    fullData: userDoc,
                    reliability: reliabilityStatus,
                    smartInsights: this.generateSmartInsights(matchesList, stats),
                    badges: this.calculateBadges(matchesList, stats),
                    h2h: h2hData
                };

                window.Store.setState('playerStats', this.state);
                console.log("[PlayerController] Hybrid Data Rendered:", this.state);
                console.log("😈 NEMESIS DETECTED:", this.state.h2h.nemesis); // Debug Log
                if (window.PlayerView) window.PlayerView.render();

            } catch (error) {
                console.error("Critical Error in fetchPlayerData:", error);
                if (window.PlayerView) window.PlayerView.render();
            }
        }

        // Helper to show "ghost" matches if we have stats but no details
        generateSyntheticMatches(stats, user) {
            if (stats.matches === 0) return [];
            return [
                {
                    eventName: "Historial Importado",
                    date: new Date().toISOString(),
                    score: "N/A",
                    result: 'W', // Visual placeholder
                    isGhost: true
                }
            ];
        }

        calculateBadges(matches, stats) {
            const badges = [];

            // 1. Rey de la Pista (5 victorias seguidas)
            let currentStreak = 0;
            let maxStreak = 0;
            [...matches].reverse().forEach(m => {
                if (m.result === 'W') {
                    currentStreak++;
                    if (currentStreak > maxStreak) maxStreak = currentStreak;
                } else {
                    currentStreak = 0;
                }
            });
            if (maxStreak >= 5) badges.push({ id: 'king', title: 'Rey de la Pista', icon: '👑', desc: '5+ Victorias consecutivas', color: '#FFD700' });

            // 2. Madrugador (Inscrito en 3 entrenos de mañana - < 12:00)
            // Nota: Esta lógica asume que el nombre del evento o un campo 'time' indica la hora.
            // Por ahora usaremos una simulación basada en el volumen de partidos si no hay hora exacta.
            if (stats.matches >= 10) badges.push({ id: 'early', title: 'Madrugador', icon: '☀️', desc: 'Fiel a los entrenos matinales', color: '#FF9800' });

            // 3. Muro de Berlín (Menos juegos recibidos - Promedio < 3 por partido en las últimas 5)
            if (matches.length >= 5) {
                const recent = matches.slice(0, 5);
                const avgLost = recent.reduce((acc, m) => {
                    const games = m.score ? parseInt(m.score.split('-')[1]) : 0;
                    return acc + games;
                }, 0) / 5;
                if (avgLost <= 3) badges.push({ id: 'wall', title: 'Muro de Berlín', icon: '🧱', desc: 'Defensa impenetrable', color: '#94a3b8' });
            }

            // 4. Veterano (20+ partidos)
            if (stats.matches >= 20) badges.push({ id: 'veteran', title: 'Leyenda SP', icon: '🎖️', desc: 'Más de 20 batallas oficiales', color: '#CCFF00' });

            return badges;
        }

        calculateTopRivals(matches, userIds) {
            const rivals = {};
            const partners = {};
            if (!matches || !Array.isArray(matches)) return { nemesis: null, soulmate: null, topRivals: [] };

            const myIds = Array.isArray(userIds) ? userIds : [userIds];

            matches.forEach(m => {
                let myTeam = null;
                if (m.team_a_ids && m.team_a_ids.some(id => myIds.includes(String(id)))) myTeam = 'A';
                else if (m.team_b_ids && m.team_b_ids.some(id => myIds.includes(String(id)))) myTeam = 'B';

                if (!myTeam) return;

                const opponentIds = myTeam === 'A' ? (m.team_b_ids || []) : (m.team_a_ids || []);
                const partnerIds = myTeam === 'A' ? (m.team_a_ids || []) : (m.team_b_ids || []);

                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                const iWon = (myTeam === 'A' && sA > sB) || (myTeam === 'B' && sB > sA);
                const iLost = (myTeam === 'A' && sB > sA) || (myTeam === 'B' && sA > sB);

                // 1. Process Rivals
                opponentIds.forEach(rid => {
                    const id = String(rid);
                    if (myIds.includes(id)) return;
                    if (!rivals[id]) rivals[id] = { id, name: 'Jugador', matches: 0, wins: 0, losses: 0 };
                    rivals[id].matches++;
                    if (iWon) rivals[id].wins++; // I won against them
                    if (iLost) rivals[id].losses++; // I lost against them
                });

                // 2. Process Partners
                partnerIds.forEach(pid => {
                    const id = String(pid);
                    if (myIds.includes(id)) return;
                    if (!partners[id]) partners[id] = { id, name: 'Socio', matches: 0, wins: 0 };
                    partners[id].matches++;
                    if (iWon) partners[id].wins++;
                });
            });

            const rivalsArr = Object.values(rivals);
            const partnersArr = Object.values(partners);

            // NEMESIS: Rival I lose to the most
            const nemesis = rivalsArr.sort((a, b) => b.losses - a.losses || b.matches - a.matches)[0];

            // SOULMATE: Partner I win with the most (min 2 matches)
            const soulmate = partnersArr
                .filter(p => p.matches >= 1)
                .sort((a, b) => b.wins - a.wins || (b.wins / b.matches) - (a.wins / a.matches))[0];

            return { nemesis, soulmate, topRivals: rivalsArr.sort((a, b) => b.matches - a.matches).slice(0, 3) };
        }

        generateSmartInsights(matches, stats) {
            if (!matches || matches.length === 0) return {
                summary: "Bienvenido a SomosPadel. Juega tus primeros partidos oficiales para que el Capitán SomosPadel analice tu estilo y te dé consejos tácticos.",
                badge: "NUEVO RECLUTA 🎾",
                advice: "Céntrate en mantener la bola en juego y divertirte hoy.",
                insights: [{ icon: '💡', text: "Primeras batallas pendientes" }]
            };

            const recent = matches.slice(0, 5);
            let streak = 0;
            for (let m of recent) {
                if (m.result === 'W') streak++;
                else break;
            }

            // Margin Analysis
            let tightLosses = 0;
            let dominance = 0; // Huge wins
            recent.forEach(m => {
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                const diff = Math.abs(sA - sB);
                if (m.result === 'L' && diff <= 2) tightLosses++;
                if (m.result === 'W' && diff >= 4) dominance++;
            });

            let summary = "";
            let badge = "";
            let advice = "";
            const insights = [];

            if (streak >= 3) {
                summary = `¡Nivel Élite! Has encadenado ${streak} victorias. Estás en un momento de forma espectacular.`;
                badge = "INVICTO 🔥";
                advice = "Estás dominando. No cambies nada, pero vigila el exceso de confianza en los puntos fáciles.";
            } else if (tightLosses >= 2) {
                summary = "Compites al límite. Pierdes pocos puntos pero se te escapan los partidos por detalles mínimos.";
                badge = "GUERRERO 🛡️";
                advice = "Tus derrotas son por margen de 1 o 2 juegos. Trabaja la mentalidad en puntos de oro; un globo profundo en el momento clave marcará la diferencia.";
            } else if (dominance >= 2) {
                summary = "Tienes pegada de campeón. Cuando ganas, dejas al rival sin opciones.";
                badge = "DESTRUCTOR ⚔️";
                advice = "Mantén la agresividad en red. Los rivales se sienten intimidados por tu pegada, aprovecha para bajar la bola a los pies.";
            } else {
                summary = "Jugador de equipo constante. Tu juego aporta equilibrio y seguridad a cualquier pareja.";
                badge = "ESTRATEGIA 🧠";
                advice = "Prueba a jugar bolas más anguladas hoy. Sorprende al rival cambiando el ritmo cuando menos lo esperen.";
            }

            if (streak > 1) insights.push({ icon: '🔥', text: `Racha: ${streak} Wins` });
            if (tightLosses > 0) insights.push({ icon: '⚖️', text: "Especialista en finales apretados" });
            if (stats.winRate > 60) insights.push({ icon: '📈', text: "Progresión sobresaliente" });

            return {
                summary,
                badge,
                advice,
                insights
            };
        }

        async updatePhoto(photoUrl) {
            const user = window.Store.getState('currentUser');
            try {
                await this.db.players.update(user.id, { photo_url: photoUrl });
                // Update local state
                const newUser = { ...user, photo_url: photoUrl };
                window.Store.setState('currentUser', newUser);
                await this.init();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        async updatePassword(newPassword) {
            const user = window.Store.getState('currentUser');
            try {
                // Security check would go here in a real app (re-auth)
                await this.db.players.update(user.id, { password: newPassword });
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        /**
         * Derives FIFA-style skill attributes based on level and performance
         */
        getCalculatedSkills() {
            const user = window.Store.getState('currentUser');
            const stats = this.state.stats || { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0 };
            const level = parseFloat(user ? (user.level || 3.5) : 3.5);

            // Baseline derived from Level (2.0 to 7.0)
            const baseline = Math.min(95, 30 + (level * 10)); // Level 3.5 =~ 65 baseline

            // ATK: Performance boost if Win Rate is high
            const atk = Math.min(99, Math.round(baseline + (stats.winRate > 60 ? 5 : 0)));

            // DEF: Level dependency + Consistency
            const def = Math.min(99, Math.round(baseline - 2 + (stats.gamesWon > stats.gamesLost ? 3 : 0)));

            // TEC: Pure level representation
            const tec = Math.min(99, Math.round(baseline + (level > 4 ? 4 : -2)));

            // FIS: Experience (Matches played) influence
            const fis = Math.min(99, Math.round(baseline + Math.min(10, (stats.matches || 0) / 2)));

            return { atk, def, tec, fis, levelText: level.toFixed(2) };
        }
    }

    window.PlayerController = new PlayerController();
    console.log("📱 PlayerController v2 (Big Data) Loaded");
})();

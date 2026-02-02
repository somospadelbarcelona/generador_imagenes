/**
 * CaptainService.js
 * The brain behind "Capitán SomosPadel".
 * Analyzes player history to provide heuristic insights.
 */
(function () {
    class CaptainService {
        constructor() {
            this.heuristics = [
                this.analyzeActivity,
                this.analyzeStreak,
                this.analyzePartners,
                this.analyzeRivals
            ];
        }

        /**
         * Main entry point to get insights for a user.
         * @param {Object} user - The current user object.
         * @param {Array} matchHistory - Array of past matches.
         * @param {Object} eventDoc - Optional: Specific event to analyze (for post-event analysis)
         * @returns {Array} List of insight objects { type, message, level }
         */
        analyze(user, matchHistory, eventDoc = null) {
            if (!user || !matchHistory || matchHistory.length === 0) {
                const name = user && user.name ? user.name.split(' ')[0].toUpperCase() : 'JUGADOR';
                return [{
                    type: 'welcome',
                    level: 'info',
                    icon: '👋',
                    title: `¡BIENVENIDO, ${name}!`,
                    message: 'Soy tu Capitán. Juega unos cuantos partidos para que pueda analizar tu estilo.'
                }];
            }

            const insights = [];
            const finishedMatches = matchHistory.filter(m => m.status === 'finished' || m.isFinished);

            // 0. EVENT-SPECIFIC ANALYSIS (if provided)
            if (eventDoc) {
                const eventInsights = this.analyzeEventPerformance(user, finishedMatches, eventDoc);
                insights.push(...eventInsights);
            } else {
                // 1. CAREER SUMMARY (Always first for general analysis)
                insights.push(this.getCareerSummary(user, finishedMatches));

                // Run all heuristics
                this.heuristics.forEach(h => {
                    const result = h.call(this, user, finishedMatches);
                    if (result) insights.push(result);
                });
            }

            // Fallback if no specific insights found
            if (insights.length === 0) {
                insights.push({
                    type: 'generic',
                    level: 'info',
                    icon: '🎾',
                    title: 'Todo en orden',
                    message: 'Sigue jugando para desbloquear más estadísticas avanzadas.'
                });
            }

            return insights;
        }

        getCareerSummary(user, matches) {
            let wins = 0;
            let totalGames = 0;

            matches.forEach(m => {
                if (this._didUserWin(user, m)) wins++;
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                totalGames += (sA + sB);
            });

            const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

            return {
                type: 'summary',
                level: 'info',
                icon: '📊',
                title: 'TU EXPEDIENTE X',
                message: `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:5px;">
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; text-align:center;">
                            <div style="font-size:1.2rem; font-weight:900; color:#fff;">${matches.length}</div>
                            <div style="font-size:0.55rem; color:#888;">PARTIDOS</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; text-align:center;">
                            <div style="font-size:1.2rem; font-weight:900; color:${winRate >= 50 ? '#4ade80' : '#f87171'};">${winRate}%</div>
                            <div style="font-size:0.55rem; color:#888;">WIN RATE</div>
                        </div>
                    </div>
                `
            };
        }

        /**
         * Analiza el rendimiento del usuario en un evento específico (Entreno)
         * @param {Object} user - Usuario actual
         * @param {Array} allMatches - Historial completo de partidos del usuario
         * @param {Object} eventDoc - Documento del evento a analizar
         * @returns {Array} Insights específicos del evento
         */
        analyzeEventPerformance(user, allMatches, eventDoc) {
            const insights = [];
            const name = user.name ? user.name.split(' ')[0].toUpperCase() : 'JUGADOR';

            // 1. FILTRADO ULTRA-RESILIENTE
            const normalize = (s) => (s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const searchNames = normalize(user.name).split(' ').filter(t => t.length > 2);
            const userUID = user.uid;

            const eventMatches = allMatches.filter(m => {
                const isCorrectEvent = m.event_id === eventDoc.id || m.americana_id === eventDoc.id;
                if (!isCorrectEvent) return false;

                const teamA_IDs = m.team_a_ids || [];
                const teamB_IDs = m.team_b_ids || [];
                const playersList = m.players || [];

                if (teamA_IDs.includes(userUID) || teamB_IDs.includes(userUID) || playersList.includes(userUID)) return true;

                // Si no hay UID, buscar por nombres
                const checkNames = (input) => {
                    const combined = (Array.isArray(input) ? input.join(' ') : String(input || ""));
                    const normalizedInput = normalize(combined);
                    return searchNames.some(t => normalizedInput.includes(t));
                };

                return checkNames(m.team_a_names) || checkNames(m.team_b_names);
            });

            if (eventMatches.length === 0) {
                return [{
                    type: 'event_summary',
                    level: 'info',
                    icon: '🎾',
                    title: `INFORME VACÍO`,
                    message: `¡Hola ${name}! No he encontrado registros tuyos en este evento. Si jugaste, es posible que tu nombre no coincida exactamente.`
                }];
            }

            // 2. FILTRADO DE UNICIDAD (Evitar duplicados si hay re-scaneo)
            const uniqueMatches = [];
            const seenRounds = new Set();

            // Ordenar por fecha o ronda para consistencia
            eventMatches.sort((a, b) => (a.round || 0) - (b.round || 0));

            eventMatches.forEach(m => {
                const roundKey = m.round || Math.random();
                // Permitimos múltiples partidos por ronda si son legítimos (ej: tie-breaks o formatos raros)
                // Pero si son idénticos en equipos, los filtramos
                const matchHash = `${m.round}-${JSON.stringify(m.team_a_names)}-${JSON.stringify(m.team_b_names)}`;
                if (!seenRounds.has(matchHash)) {
                    uniqueMatches.push(m);
                    seenRounds.add(matchHash);
                }
            });

            // 3. CÁLCULO DE ESTADÍSTICAS
            let wins = 0;
            let totalPoints = 0;
            let totalPointsAgainst = 0;
            const partnerStats = {};
            const roundsArr = new Set();

            uniqueMatches.forEach(m => {
                const won = this._didUserWin(user, m);
                if (won) wins++;

                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);

                const teamA = m.team_a_ids || [];
                const namesA = m.team_a_names || [];
                const isTeamA = teamA.includes(userUID) || (Array.isArray(namesA) ? namesA.some(n => normalize(n).includes(searchNames[0])) : normalize(namesA).includes(searchNames[0]));

                totalPoints += isTeamA ? sA : sB;
                totalPointsAgainst += isTeamA ? sB : sA;

                const partner = this._getPartner(user, m);
                if (partner) {
                    if (!partnerStats[partner]) partnerStats[partner] = { played: 0, won: 0 };
                    partnerStats[partner].played++;
                    if (won) partnerStats[partner].won++;
                }
                if (m.round) roundsArr.add(m.round);
            });

            const matchCount = uniqueMatches.length;
            const winRate = matchCount > 0 ? Math.round((wins / matchCount) * 100) : 0;
            const avgPointsFor = matchCount > 0 ? (totalPoints / matchCount).toFixed(1) : "0.0";
            const avgPointsAgainst = matchCount > 0 ? (totalPointsAgainst / matchCount).toFixed(1) : "0.0";

            // Determinar nivel de rendimiento
            let performanceIcon = '📊', performanceTitle = 'RENDIMIENTO SÓLIDO', performanceLevel = 'info';
            let performanceMessage = `Has completado <b>${matchCount} partidos</b>.`;

            if (winRate >= 80) {
                performanceIcon = '💥'; performanceTitle = '¡MODO DIOS!'; performanceLevel = 'success';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b>. Has arrasado en la pista, ${name}. Nivel profesional.`;
            } else if (winRate >= 60) {
                performanceIcon = '🏆'; performanceTitle = 'ELITE PLAYER'; performanceLevel = 'success';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b>. Una actuación contundente y muy inteligente.`;
            } else if (winRate >= 40) {
                performanceIcon = '💪'; performanceTitle = 'GUERRERO'; performanceLevel = 'info';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b>. Has dado la cara en cada punto. Buen trabajo.`;
            } else {
                performanceIcon = '🎯'; performanceTitle = 'RECALIBRANDO'; performanceLevel = 'warning';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b>. Un día difícil para tus estadísticas, pero excelente para aprender.`;
            }

            insights.push({
                type: 'event_summary',
                level: performanceLevel,
                icon: performanceIcon,
                title: performanceTitle,
                message: `
                    ${performanceMessage}
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:12px; text-align:center; border: 1px solid rgba(74, 222, 128, 0.2);">
                            <div style="font-size:1.1rem; font-weight:900; color:#4ade80;">${avgPointsFor}</div>
                            <div style="font-size:0.55rem; color:#888; font-weight:800;">PTS FAVOR</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:12px; text-align:center; border: 1px solid rgba(248, 113, 113, 0.2);">
                            <div style="font-size:1.1rem; font-weight:900; color:#f87171;">${avgPointsAgainst}</div>
                            <div style="font-size:0.55rem; color:#888; font-weight:800;">PTS CONTRA</div>
                        </div>
                    </div>
                `
            });

            // 4. MEJOR SOCIO
            let bestPartner = null, bestRate = -1;
            Object.keys(partnerStats).forEach(p => {
                const rate = partnerStats[p].won / partnerStats[p].played;
                if (rate > bestRate || (rate === bestRate && partnerStats[p].played > (partnerStats[bestPartner]?.played || 0))) {
                    bestRate = rate; bestPartner = p;
                }
            });

            if (bestPartner && (partnerStats[bestPartner].played >= 2 || (matchCount <= 4 && partnerStats[bestPartner].played >= 1))) {
                insights.push({
                    type: 'best_partner',
                    level: 'success',
                    icon: '🤝',
                    title: 'QUÍMICA LETAL',
                    message: `Tu conexión con <b>${bestPartner}</b> ha sido la clave hoy. Ganasteis el ${Math.round(bestRate * 100)}% de vuestros juegos.`
                });
            }

            // 5. RECOMENDACIÓN TÁCTICA
            const recommendation = this._getEventRecommendation(winRate, avgPointsFor, avgPointsAgainst, matchCount);
            if (recommendation) insights.push(recommendation);

            return insights;
        }

        /**
         * Guarda el análisis en Firestore para historial
         */
        async saveAnalysis(userId, eventDoc, insights) {
            if (!userId || !eventDoc || !insights) return;

            try {
                await window.db.collection('players').doc(userId).collection('captain_reports').add({
                    eventId: eventDoc.id,
                    eventName: eventDoc.name,
                    eventType: eventDoc.type || 'entreno',
                    eventDate: eventDoc.date,
                    insights: insights,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt: new Date().toISOString()
                });
                console.log("✅ [Captain] Analysis saved to history");
            } catch (e) {
                console.error("❌ [Captain] Failed to save analysis:", e);
            }
        }

        /**
         * Obtiene el historial de análisis del usuario
         */
        async getAnalysisHistory(userId, limit = 10) {
            if (!userId) return [];

            try {
                const snap = await window.db.collection('players').doc(userId)
                    .collection('captain_reports')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get();

                return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.error("❌ [Captain] Failed to load history:", e);
                return [];
            }
        }

        /**
         * Genera una recomendación personalizada basada en el rendimiento
         */
        _getEventRecommendation(winRate, avgFor, avgAgainst, matchCount) {
            if (winRate >= 70) {
                return {
                    type: 'recommendation',
                    level: 'success',
                    icon: '🎯',
                    title: 'PRÓXIMO NIVEL',
                    message: 'Tu nivel está subiendo. Considera jugar en pistas más competitivas o buscar rivales más fuertes.'
                };
            } else if (winRate < 40 && avgAgainst > avgFor + 2) {
                return {
                    type: 'recommendation',
                    level: 'info',
                    icon: '🛡️',
                    title: 'ENFÓCATE EN DEFENSA',
                    message: 'Estás encajando muchos puntos. Trabaja tu posicionamiento defensivo y anticipación.'
                };
            } else if (winRate < 40 && avgFor < 5) {
                return {
                    type: 'recommendation',
                    level: 'info',
                    icon: '⚔️',
                    title: 'MEJORA TU ATAQUE',
                    message: 'Te cuesta generar puntos. Practica remates y busca ser más agresivo en la red.'
                };
            } else if (matchCount >= 8) {
                return {
                    type: 'recommendation',
                    level: 'info',
                    icon: '💪',
                    title: 'RESISTENCIA PROBADA',
                    message: `${matchCount} partidos es mucho volumen. Asegúrate de recuperar bien antes del próximo entreno.`
                };
            }
            return null;
        }

        // --- HEURISTICS ---

        analyzeActivity(user, matches) {
            if (matches.length === 0) return null;

            // Sort by date desc
            const sorted = [...matches].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            const lastMatch = sorted[0];
            const daysSince = (new Date() - new Date(lastMatch.date || Date.now())) / (1000 * 60 * 60 * 24);

            if (daysSince > 14) {
                return {
                    type: 'activity',
                    level: 'warning',
                    icon: '⏰',
                    title: 'ALERTA DE ÓXIDO',
                    message: `Hace <b>${Math.floor(daysSince)} días</b> que no pisas pista. Cuidado, el nivel baja rápido.`
                };
            }
            return null;
        }

        analyzeStreak(user, matches) {
            // Calculate current streak
            let streak = 0;
            // Assuming matches are roughly ordered or we sort them
            const sorted = [...matches].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            for (let m of sorted) {
                const won = this._didUserWin(user, m);
                if (won) streak++;
                else break;
            }

            if (streak >= 3) {
                return {
                    type: 'streak',
                    level: 'success',
                    icon: '🔥',
                    title: 'RACHA "ON FIRE"',
                    message: `¡Llevas <b>${streak} victorias seguidas</b>! El algoritmo predice que eres el rival a batir ahora mismo.`
                };
            }
            return null;
        }

        analyzePartners(user, matches) {
            // Find best partner (min 3 games together)
            const partnerships = {};

            matches.forEach(m => {
                const partner = this._getPartner(user, m);
                if (partner) {
                    if (!partnerships[partner]) partnerships[partner] = { played: 0, won: 0 };
                    partnerships[partner].played++;
                    if (this._didUserWin(user, m)) partnerships[partner].won++;
                }
            });

            let bestPartner = null;
            let bestRate = 0;
            let bestRecord = "";

            Object.keys(partnerships).forEach(p => {
                const stats = partnerships[p];
                if (stats.played >= 3) {
                    const rate = stats.won / stats.played;
                    if (rate >= 0.70 && rate > bestRate) {
                        bestRate = rate;
                        bestPartner = p;
                        bestRecord = `${stats.won}-${stats.played - stats.won}`;
                    }
                }
            });

            if (bestPartner) {
                return {
                    type: 'partner',
                    level: 'info',
                    icon: '🤝',
                    title: 'QUÍMICA PERFECTA',
                    message: `Con <b>${bestPartner}</b> sois casi invencibles. <br>Récord: <span style="color:#CCFF00; font-weight:800;">${bestRecord}</span> (${Math.round(bestRate * 100)}% de efectividad).`
                };
            }
            return null;
        }

        analyzeRivals(user, matches) {
            // Find worst enemy (min 3 games against)
            const rivalries = {};

            matches.forEach(m => {
                const rivals = this._getRivals(user, m); // Returns array
                const won = this._didUserWin(user, m);
                rivals.forEach(r => {
                    if (!rivalries[r]) rivalries[r] = { played: 0, lost: 0 };
                    rivalries[r].played++;
                    if (!won) rivalries[r].lost++;
                });
            });

            let nemesis = null;
            let worstRate = 0; // high loss rate
            let nemesisRecord = "";

            Object.keys(rivalries).forEach(r => {
                const stats = rivalries[r];
                if (stats.played >= 3) {
                    const lossRate = stats.lost / stats.played;
                    if (lossRate >= 0.70 && lossRate > worstRate) {
                        worstRate = lossRate;
                        nemesis = r;
                        nemesisRecord = `${stats.played - stats.lost}-${stats.lost}`;
                    }
                }
            });

            if (nemesis) {
                return {
                    type: 'rival',
                    level: 'warning',
                    icon: '💀',
                    title: 'TU BESTIA NEGRA',
                    message: `<b>${nemesis}</b> te tiene comida la moral. <br>Balance contra él/ella: <span style="color:#ef4444; font-weight:800;">${nemesisRecord}</span>.`
                };
            }
            return null;
        }

        // --- HELPERS ---

        _didUserWin(user, match) {
            const searchName = user.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const teamA = match.team_a_ids || [];
            const teamB = match.team_b_ids || [];

            const check = (names) => {
                if (!names) return false;
                const combined = (Array.isArray(names) ? names.join('|') : String(names)).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return combined.includes(searchName);
            };

            const inA = (user.uid && teamA.includes(user.uid)) || check(match.team_a_names);
            const inB = (user.uid && teamB.includes(user.uid)) || check(match.team_b_names);

            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);

            if (inA) return sA > sB;
            if (inB) return sB > sA;
            return false;
        }

        _getPartner(user, match) {
            const teamA = match.team_a_names || [];
            const teamB = match.team_b_names || [];
            const name = user.name || "";

            const check = (list) => {
                if (Array.isArray(list)) return list.some(n => n && n.includes(name));
                return typeof list === 'string' && list.includes(name);
            };

            const findOther = (list) => {
                if (Array.isArray(list)) return list.find(n => n && !n.includes(name));
                if (typeof list === 'string') return list.replace(name, '').replace('/', '').trim();
                return null;
            };

            if (check(teamA)) return findOther(teamA);
            if (check(teamB)) return findOther(teamB);
            return null;
        }

        _getRivals(user, match) {
            const teamA = match.team_a_names || [];
            const teamB = match.team_b_names || [];
            const name = user.name || "";

            const check = (list) => {
                if (Array.isArray(list)) return list.some(n => n && n.includes(name));
                return typeof list === 'string' && list.includes(name);
            };

            if (check(teamA)) return Array.isArray(teamB) ? teamB : [teamB];
            return Array.isArray(teamA) ? teamA : [teamA];
        }

    }

    window.CaptainService = new CaptainService();
})();

/**
 * RecordsController.js
 * "Hall of Fame" Logic 🏆 - BIG DATA & SMART EDITION
 */
(function () {
    class RecordsController {
        constructor() {
            this.state = { records: null };
            this.isCalculating = false;
        }

        async init() {
            if (this.isCalculating) return;
            await this.calculateRecords();
        }

        async calculateRecords() {
            if (this.isCalculating) return;

            try {
                const db = window.FirebaseDB || window.db;
                if (!db || !db.matches) {
                    console.warn("⏳ Records: waiting for DB...");
                    setTimeout(() => this.calculateRecords(), 500);
                    return;
                }

                this.isCalculating = true;

                // 1. DATA GATHERING
                const [matchesSnap, playersSnap, entMatchesSnap] = await Promise.all([
                    db.matches.getAll(),
                    db.players.getAll(),
                    db.entrenos_matches ? db.entrenos_matches.getAll() : Promise.resolve([])
                ]);

                const playerMap = new Map(playersSnap.map(p => [String(p.id), p]));
                const getName = (id) => playerMap.get(String(id))?.name || 'Anónimo';
                const getLevel = (id) => parseFloat(playerMap.get(String(id))?.level || 0);

                let totalMatches = [...matchesSnap, ...entMatchesSnap].map(m => ({
                    ...m,
                    dateObj: this.parseDate(m.date || m.createdAt)
                })).sort((a, b) => a.dateObj - b.dateObj);

                totalMatches = totalMatches.filter(m =>
                    (m.status === 'finished' || m.finished) &&
                    (parseInt(m.score_a || 0) + parseInt(m.score_b || 0) > 0)
                );

                // --- 📊 CALCULATE METRICS ---
                const stats = {};
                const currentStreaks = {};
                const recordStreaks = [];
                const giantSlayers = [];
                const catalysts = {}; // Tracks unique partners for wins
                const ironManTracker = {}; // Tracks active weeks

                totalMatches.forEach(m => {
                    const sA = parseInt(m.score_a);
                    const sB = parseInt(m.score_b);
                    const isDraw = sA === sB;
                    const winningTeam = sA > sB ? 'a' : (sB > sA ? 'b' : 'draw');

                    const teamA = (m.team_a_ids || []).filter(id => playerMap.has(String(id)));
                    const teamB = (m.team_b_ids || []).filter(id => playerMap.has(String(id)));
                    const allIds = [...teamA, ...teamB];

                    // Level Avg for Giant Slayer
                    const avgLvlA = teamA.reduce((sum, id) => sum + getLevel(id), 0) / (teamA.length || 1);
                    const avgLvlB = teamB.reduce((sum, id) => sum + getLevel(id), 0) / (teamB.length || 1);

                    if (!isDraw) {
                        const winners = sA > sB ? teamA : teamB;
                        const losers = sA > sB ? teamB : teamA;
                        const winnerAvg = sA > sB ? avgLvlA : avgLvlB;
                        const loserAvg = sA > sB ? avgLvlB : avgLvlA;

                        winners.forEach(uid => {
                            const id = String(uid);
                            // STREAK
                            if (!currentStreaks[id]) currentStreaks[id] = { count: 0, start: m.date };
                            currentStreaks[id].count++;
                            currentStreaks[id].end = m.date;

                            // GIANT SLAYER
                            const diff = loserAvg - getLevel(id);
                            if (diff > 0) {
                                giantSlayers.push({ id, diff, match: m.id, date: m.date });
                            }

                            // SOCIAL CATALYST (The versatile partner)
                            if (!catalysts[id]) catalysts[id] = new Set();
                            const partnerId = winners.find(pid => pid !== uid);
                            if (partnerId) catalysts[id].add(String(partnerId));
                        });

                        losers.forEach(uid => {
                            const id = String(uid);
                            if (currentStreaks[id] && currentStreaks[id].count > 0) {
                                recordStreaks.push({ id, ...currentStreaks[id] });
                            }
                            currentStreaks[id] = { count: 0, start: null };
                        });
                    }

                    // Stats & Iron Man
                    allIds.forEach(uid => {
                        const id = String(uid);
                        if (!stats[id]) stats[id] = { matches: 0, wins: 0, gamesConceded: 0, gamesWon: 0, court1Wins: 0 };
                        stats[id].matches++;
                        const isTeamA = teamA.includes(uid);
                        stats[id].gamesConceded += isTeamA ? sB : sA;
                        stats[id].gamesWon += isTeamA ? sA : sB;

                        if (!isDraw && winningTeam === (isTeamA ? 'a' : 'b')) {
                            stats[id].wins++;
                            if (parseInt(m.court) === 1) stats[id].court1Wins++;
                        }

                        // Iron Man (Week tracker)
                        if (!ironManTracker[id]) ironManTracker[id] = new Set();
                        const d = new Date(m.dateObj);
                        const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
                        ironManTracker[id].add(weekKey);
                    });
                });

                // Finalize active streaks
                Object.entries(currentStreaks).forEach(([id, s]) => { if (s.count > 0) recordStreaks.push({ id, ...s }); });

                // --- 🏺 GATHER CANDIDATES ---
                const candidates = { streak: [], sniper: [], giant: [], catalyst: [], ironman: [], walls: [] };

                playersSnap.forEach(p => {
                    const id = String(p.id);
                    const s = stats[id];
                    if (!s) return;

                    // 1. Sniper (Efficiency)
                    if (s.matches >= 5) {
                        candidates.sniper.push({ id, val: (s.wins / s.matches) * 100, display: `${((s.wins / s.matches) * 100).toFixed(1)}% Win Rate` });
                    }

                    // 2. Iron Man (Weeks active)
                    const weeks = (ironManTracker[id] || []).size || 0;
                    candidates.ironman.push({ id, val: weeks, display: `${weeks} semanas activo` });

                    // 3. Social Catalyst (Partner diversity)
                    const partners = (catalysts[id] || []).size || 0;
                    candidates.catalyst.push({ id, val: partners, display: `${partners} socios distintos` });

                    // 4. Defense Wall
                    if (s.matches >= 5) {
                        candidates.walls.push({ id, val: s.gamesConceded / s.matches, display: `${(s.gamesConceded / s.matches).toFixed(2)} juegos encajados/p` });
                    }
                });

                // Giant Slayer (Max diff)
                const slayerBest = {};
                giantSlayers.forEach(g => { if (!slayerBest[g.id] || g.diff > slayerBest[g.id].diff) slayerBest[g.id] = g; });
                Object.values(slayerBest).forEach(g => candidates.giant.push({ id: g.id, val: g.diff, display: `+${g.diff.toFixed(2)} nivel diff` }));

                // Best Streak
                const bestStreakPerUser = {};
                recordStreaks.forEach(r => { if (!bestStreakPerUser[r.id] || r.count > bestStreakPerUser[r.id].count) bestStreakPerUser[r.id] = r; });
                Object.values(bestStreakPerUser).forEach(r => { if (r.count >= 2) candidates.streak.push({ id: r.id, val: r.count, display: `${r.count} victorias` }); });

                // --- HELPERS ---
                const getPodium = (list, sortFn) => {
                    const sorted = [...list].sort(sortFn);
                    return { winner: sorted[0], top3: sorted.slice(0, 3).map(c => ({ name: getName(c.id), value: c.display, raw: c.val })) };
                };

                const pStreak = getPodium(candidates.streak, (a, b) => b.val - a.val);
                const pSniper = getPodium(candidates.sniper, (a, b) => b.val - a.val);
                const pGiant = getPodium(candidates.giant, (a, b) => b.val - a.val);
                const pCatalyst = getPodium(candidates.catalyst, (a, b) => b.val - a.val);
                const pIron = getPodium(candidates.ironman, (a, b) => b.val - a.val);
                const pWall = getPodium(candidates.walls, (a, b) => a.val - b.val);

                const build = (p, title, icon, desc, color, analysis, vac) => {
                    if (!p.winner) return { name: "VACANTE", id: null, title, icon, desc, deepAnalysis: vac, value: "-", color: "#444", top3: [] };
                    return { id: p.winner.id, name: getName(p.winner.id), title, icon, desc, value: p.winner.value || p.winner.display.split(' ')[0], count: p.winner.display, color, top3: p.top3, deepAnalysis: analysis(p.winner, p.top3) };
                };

                // --- FINAL ASSEMBLY ---
                this.state.records = {
                    streak: build(pStreak, "La Muralla", "🧱", "Racha invicta en la temporada.", "#FFD700", (w) => `Imparable con una racha de <b>${w.val} victorias</b> consecutivas.`, "Nadie ha superado las 2 victorias seguidas aún."),
                    giant: build(pGiant, "Mata-Gigantes", "🔴", "Venció al rival con más nivel de diferencia.", "#ef4444", (w) => `Victoria heroica superando una desventaja de <b>+${w.val.toFixed(2)} de nivel</b>.`, "Aún no hay gestas de este calibre."),
                    catalyst: build(pCatalyst, "Socio de Oro", "🤝", "Gana con la mayor variedad de parejas.", "#3b82f6", (w) => `Es el camaleón del club: ha ganado con <b>${w.val} compañeros</b> distintos.`, "Falta diversidad de parejas."),
                    sniper: build(pSniper, "Francotirador", "🎯", "Win Rate de máxima efectividad.", "#10b981", (w) => `Su ratio de acierto es quirúrgico: <b>${w.display}</b>.`, "Mínimo 5 partidos para entrar."),
                    ironman: build(pIron, "El Infatigable", "⛓️", "Presencia constante en el club.", "#8b5cf6", (w) => `Es el pulmón de Somospadel: <b>${w.val} semanas</b> sin faltar a una cita.`, "La temporada acaba de empezar."),
                    wall: build(pWall, "El Intocable", "🛡️", "Menos juegos encajados por partido.", "#6366f1", (w) => `Una muralla defensiva: solo concede <b>${w.val.toFixed(2)} juegos</b> por partido.`, "Datos en proceso.")
                };

                console.log("🏆 Premium Records Cooked!");
                if (window.RecordsView) window.RecordsView.render();
            } catch (e) {
                console.error("Error cooking premium records", e);
            } finally {
                this.isCalculating = false;
            }
        }

        parseDate(d) { if (!d) return new Date(0); if (d.toDate) return d.toDate(); return new Date(d); }
        getRecords() { return this.state.records; }
    }
    window.RecordsController = new RecordsController();
})();

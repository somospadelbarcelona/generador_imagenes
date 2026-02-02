/**
 * ControlTowerReport.js
 * Sub-module for high-end performance reports in ControlTowerView.
 * Focuses on Padel Intelligence, realistic metrics, and Premium UX.
 */
(function () {
    class ControlTowerReport {
        static render(matches, eventDoc) {
            const finishedMatches = matches.filter(m => m.status === 'finished').sort((a, b) => (parseInt(a.round) || 0) - (parseInt(b.round) || 0));

            if (finishedMatches.length === 0) {
                return `
                <div style="padding:100px 20px; text-align:center; background: #fff; min-height:80vh; border-radius: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 25px;">
                        <i class="fas fa-brain" style="font-size:2rem; color: #cbd5e1; animation: pulse 2s infinite;"></i>
                    </div>
                    <h3 style="color:#1e293b; font-weight:950; letter-spacing: -0.5px; font-size: 1.4rem; margin-bottom: 10px;">GENERANDO INFORME</h3>
                    <p style="font-size:0.9rem; color: #64748b; max-width: 260px; line-height: 1.6;">Necesitamos datos de partidos finalizados para crear el análisis.</p>
                </div>`;
            }

            // 1. DATA SUBJECT SELECTION (CURRENT USER)
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const myName = user?.name || "";

            // 2. ADVANCED METRICS ENGINE
            const stats = {};
            let totalGamesInEvent = 0;

            // Track detailed interactions for the subject
            const partnerships = {}; // { 'PartnerName': { played: 0, won: 0 } }
            const rivalries = {};    // { 'RivalName': { played: 0, lostTo: 0 } }
            let currentStreak = 0;
            let maxStreak = 0;

            finishedMatches.forEach((m) => {
                const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names];
                const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names];
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                const diff = Math.abs(sA - sB);
                totalGamesInEvent += (sA + sB);
                const isClutchMatch = diff <= 2;

                // Helper to init player stats
                [...namesA, ...namesB].forEach(name => {
                    if (!stats[name]) {
                        stats[name] = {
                            name, wins: 0, matches: 0, games: 0, oppGames: 0,
                            clutchPoints: 0, staminaTrend: []
                        };
                    }
                });

                // Identify Subject's Role in this match
                const isSubjectA = namesA.some(n => n.toLowerCase().includes(myName.toLowerCase()));
                const isSubjectB = namesB.some(n => n.toLowerCase().includes(myName.toLowerCase()));
                const subjectNameFound = isSubjectA ? namesA.find(n => n.toLowerCase().includes(myName.toLowerCase())) :
                    (isSubjectB ? namesB.find(n => n.toLowerCase().includes(myName.toLowerCase())) : null);

                // Update standard stats
                namesA.forEach(n => {
                    stats[n].matches++; stats[n].games += sA; stats[n].oppGames += sB;
                    stats[n].staminaTrend.push(sA);
                    if (sA > sB) { stats[n].wins++; if (isClutchMatch) stats[n].clutchPoints += 25; }
                });
                namesB.forEach(n => {
                    stats[n].matches++; stats[n].games += sB; stats[n].oppGames += sA;
                    stats[n].staminaTrend.push(sB);
                    if (sB > sA) { stats[n].wins++; if (isClutchMatch) stats[n].clutchPoints += 25; }
                });

                // --- DEEP DIVE FOR SUBJECT ---
                if (subjectNameFound) {
                    const myTeam = isSubjectA ? 'A' : 'B';
                    const didWin = (myTeam === 'A' && sA > sB) || (myTeam === 'B' && sB > sA);

                    // Streak
                    if (didWin) currentStreak++; else currentStreak = 0;
                    if (currentStreak > maxStreak) maxStreak = currentStreak;

                    // Partners & Rivals
                    const myPartners = (isSubjectA ? namesA : namesB).filter(n => n !== subjectNameFound);
                    const myRivals = isSubjectA ? namesB : namesA;

                    myPartners.forEach(p => {
                        if (!partnerships[p]) partnerships[p] = { played: 0, won: 0 };
                        partnerships[p].played++;
                        if (didWin) partnerships[p].won++;
                    });

                    myRivals.forEach(r => {
                        if (!rivalries[r]) rivalries[r] = { played: 0, lostTo: 0 };
                        rivalries[r].played++;
                        if (!didWin) rivalries[r].lostTo++;
                    });
                }
            });

            // 3. FINALIZE SUBJECT DATA
            // If myName not found in stats (e.g. spectator), pick top player (Leader)
            const fallbackSubjectName = Object.keys(stats).sort((a, b) => stats[b].wins - stats[a].wins)[0];
            const finalSubjectName = Object.keys(stats).find(k => k.toLowerCase().includes(myName.toLowerCase())) || fallbackSubjectName;
            const subject = stats[finalSubjectName];

            // 4. GENERATE INSIGHTS
            // Best Partner
            let bestPartnerName = "N/A";
            let bestPartnerWinRate = -1;
            Object.keys(partnerships).forEach(p => {
                const wr = partnerships[p].played > 0 ? (partnerships[p].won / partnerships[p].played) : 0;
                if (wr > bestPartnerWinRate) { bestPartnerWinRate = wr; bestPartnerName = p; }
            });

            // Nemesis
            let nemesisName = "Ninguno";
            let mostLosses = -1;
            Object.keys(rivalries).forEach(r => {
                if (rivalries[r].lostTo > mostLosses) { mostLosses = rivalries[r].lostTo; nemesisName = r; }
            });
            if (mostLosses === 0) nemesisName = "Invicto";

            // Evolution Text
            let evolutionText = "Rendimiento estable.";
            const trend = subject.staminaTrend;
            if (trend.length >= 2) {
                const firstHalf = trend.slice(0, Math.ceil(trend.length / 2));
                const secondHalf = trend.slice(Math.ceil(trend.length / 2));
                const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

                if (avgSecond > avgFirst + 1) evolutionText = `🔥 **DIESEL:** De menos a más. Tu segunda mitad del torneo promedia ${avgSecond.toFixed(1)} juegos/partido vs ${avgFirst.toFixed(1)} al inicio.`;
                else if (avgFirst > avgSecond + 1) evolutionText = `⚠️ **FATIGA:** Inicio explosivo (${avgFirst.toFixed(1)} juegos/partido) pero bajada de intensidad al final.`;
                else evolutionText = `🤖 **ROBOT:** Regularidad absoluta. Has mantenido un nivel constante sin altibajos notables.`;
            }

            // Init Charts
            this._initCharts(subject.staminaTrend);

            // Store for Sharing
            window.ControlTowerReport.lastSubject = subject;
            window.ControlTowerReport.lastSubjectName = subject.name;

            return `
                <div class="fade-in" style="background: #f8fafc; min-height: 100vh; padding-bottom: 120px; font-family: 'Outfit';">
                    
                    <!-- HEADER -->
                    <div style="background: white; padding: 40px 20px 25px; border-bottom: 1px solid #f1f5f9;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                            <div>
                                <h1 style="font-size: 1.8rem; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -1px; line-height:1;">INFORME FINAL</h1>
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase;">RESUMEN DE COMPETICIÓN</span>
                                </div>
                            </div>
                            
                            <div style="text-align:right;">
                                <div style="font-size: 2.2rem; font-weight: 950; color: #CCFF00; -webkit-text-stroke: 1px black; line-height: 1;">${subject.wins}</div>
                                <div style="font-size: 0.6rem; font-weight: 900; color: #000;">VICTORIAS</div>
                            </div>
                        </div>

                        <!-- NAVIGATION & SHARE -->
                        <div style="display:flex; gap: 10px; margin-bottom: 20px;">
                            <button onclick="window.ControlTowerView.switchTab('results')" style="flex: 1; background: #111; border: 1px solid #111; color: white; padding: 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                <i class="fas fa-arrow-left"></i> VOLVER
                            </button>
                            <button onclick="window.ShareModal.open('report', window.ControlTowerReport.lastSubject, { subjectName: window.ControlTowerReport.lastSubjectName, eventDoc: window.ControlTowerView?.currentAmericanaDoc })" 
                                    style="flex: 2; background: linear-gradient(135deg, #CCFF00 0%, #B8E600 100%); color: black; border: none; padding: 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 950; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 10px rgba(204,255,0,0.3);">
                                <i class="fas fa-share-alt"></i> COMPARTIR INFORME
                            </button>
                        </div>

                        <!-- MAIN PLAYER CARD -->
                        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; padding: 25px; color: white; position: relative; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.15);">
                             <div style="position: absolute; right: -20px; bottom: -20px; font-size: 8rem; color: #fff; opacity: 0.03; transform: rotate(-10deg);"><i class="fas fa-id-card"></i></div>
                             
                             <div style="position: relative; z-index: 2;">
                                <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 950; letter-spacing: 2px; margin-bottom: 5px; opacity: 0.9;">ANÁLISIS DE JUGADOR</div>
                                <h2 style="font-size: 1.5rem; font-weight: 950; margin: 0 0 15px 0; letter-spacing: -0.5px; line-height: 1.2;">${subject.name.toUpperCase()}</h2>
                                
                                <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.5; margin: 0 0 20px 0; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                    ${evolutionText}
                                </p>

                                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; text-align: center;">
                                    <div>
                                        <div style="font-size:0.6rem; color:#94a3b8; font-weight: 800; margin-bottom: 4px;">EFECTIVIDAD</div>
                                        <div style="font-size:1.4rem; font-weight:950; color:#CCFF00;">${Math.round((subject.wins / (subject.matches || 1)) * 100)}%</div>
                                    </div>
                                    <div style="border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1);">
                                        <div style="font-size:0.6rem; color:#94a3b8; font-weight: 800; margin-bottom: 4px;">BALANCE</div>
                                        <div style="font-size:1.4rem; font-weight:950; color:white;">${subject.games >= subject.oppGames ? '+' : ''}${subject.games - subject.oppGames}</div>
                                    </div>
                                    <div>
                                        <div style="font-size:0.6rem; color:#94a3b8; font-weight: 800; margin-bottom: 4px;">JUEGOS/P</div>
                                        <div style="font-size:1.4rem; font-weight:950; color:white;">${(subject.games / (subject.matches || 1)).toFixed(1)}</div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    <!-- DETAILED METRICS GRID -->
                    <div style="padding: 24px 20px;">
                        
                        <h3 style="font-size: 0.85rem; font-weight: 950; color: #0f172a; margin: 0 0 15px 5px; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-chart-pie" style="color: #CCFF00; margin-right: 8px;"></i> Rendimiento Detallado
                        </h3>

                        <!-- NEW INSIGHT CARDS -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 25px;">
                            
                            <!-- BEST PARTNER -->
                            <div style="background: white; border-radius: 20px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                                <div style="width: 32px; height: 32px; background: #ecfccb; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #65a30d; margin-bottom: 10px;">
                                    <i class="fas fa-handshake"></i>
                                </div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase;">MEJOR ALIADO</div>
                                <div style="font-size: 0.9rem; font-weight: 950; color: #0f172a; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${bestPartnerName.split(' ')[0]}
                                </div>
                                <div style="font-size: 0.6rem; color: #22c55e; font-weight: 700;">${bestPartnerName !== 'N/A' ? Math.round(bestPartnerWinRate * 100) + '% Wins' : '-'}</div>
                            </div>    

                            <!-- NEMESIS -->
                            <div style="background: white; border-radius: 20px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                                <div style="width: 32px; height: 32px; background: #fee2e2; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #dc2626; margin-bottom: 10px;">
                                    <i class="fas fa-skull"></i>
                                </div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase;">TU BESTIA NEGRA</div>
                                <div style="font-size: 0.9rem; font-weight: 950; color: #0f172a; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${nemesisName.split(' ')[0]}
                                </div>
                                <div style="font-size: 0.6rem; color: #ef4444; font-weight: 700;">${mostLosses > 0 ? mostLosses + ' Derrotas' : 'Sin miedo'}</div>
                            </div>

                            <!-- STREAK -->
                            <div style="background: white; border-radius: 20px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                                <div style="width: 32px; height: 32px; background: #fff7ed; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ea580c; margin-bottom: 10px;">
                                    <i class="fas fa-fire"></i>
                                </div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase;">RACHA MÁXIMA</div>
                                <div style="font-size: 1.4rem; font-weight: 950; color: #ea580c; margin-top: 0px; line-height: 1;">
                                    ${maxStreak}
                                </div>
                                <div style="font-size: 0.6rem; color: #fdba74; font-weight: 700;">VICTORIAS SEGUIDAS</div>
                            </div>

                        </div>

                        <!-- EVOLUTION CHART -->
                        <div style="background: white; border-radius: 28px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; margin-bottom: 25px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3 style="font-size: 0.75rem; font-weight: 950; color: #0f172a; letter-spacing: 1px; margin: 0;">EVOLUCIÓN EN PARTIDO</h3>
                                <span style="font-size: 0.6rem; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; color: #64748b; font-weight: 700;">JUEGOS X RONDA</span>
                            </div>
                            <div style="height: 180px; width: 100%;">
                                <canvas id="evolutionChart"></canvas>
                            </div>
                        </div>

                        <!-- IMPACT CARDS -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div style="background: white; border-radius: 28px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 950; letter-spacing: 1.5px; margin-bottom: 12px;">IMPACTO TOTAL</div>
                                <div style="font-size: 1.8rem; font-weight: 950; color: #0f172a;">${Math.round((subject.games / (totalGamesInEvent || 1)) * 100)}%</div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">DE LOS JUEGOS DEL TORNEO</div>
                            </div>
                            
                            <div style="background: white; border-radius: 28px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 950; letter-spacing: 1.5px; margin-bottom: 12px;">CLUTCH POINTS</div>
                                <div style="font-size: 1.8rem; font-weight: 950; color: #ff9500;">${subject.clutchPoints}</div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">PTS EN PARTIDOS REÑIDOS</div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        static _initCharts(dataPoints) {
            setTimeout(() => {
                const ctx = document.getElementById('evolutionChart')?.getContext('2d');
                if (ctx && typeof Chart !== 'undefined') {
                    // Destroy previous if exists? (Not easy without instance ref, but Chart JS handles replace usually or we assume fresh DOM)

                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(204, 255, 0, 0.4)');
                    gradient.addColorStop(1, 'rgba(204, 255, 0, 0)');

                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dataPoints.map((_, i) => `R${i + 1}`),
                            datasets: [{
                                label: 'Juegos',
                                data: dataPoints,
                                borderColor: '#CCFF00', // Neon Brand
                                backgroundColor: gradient,
                                borderWidth: 3,
                                pointBackgroundColor: '#0f172a',
                                pointBorderColor: '#CCFF00',
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                fill: true,
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    titleColor: '#CCFF00',
                                    padding: 10,
                                    displayColors: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                    ticks: { font: { family: 'Outfit' }, color: '#94a3b8' }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { font: { family: 'Outfit' }, color: '#94a3b8' }
                                }
                            }
                        }
                    });
                }
            }, 300);
        }
    }
    window.ControlTowerReport = ControlTowerReport;
})();

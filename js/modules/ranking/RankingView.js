/**
 * RankingView.js
 * Premium Matte Dark SMART Ranking View for SomosPadel
 */
(function () {
    class RankingView {
        constructor() {
            this.currentView = 'entrenos'; // americanas | entrenos
            this.currentCategory = 'todas'; // todas | male | female | mixed
            this.playersData = [];
        }

        render(players) {
            this.playersData = players;
            const container = document.getElementById('content-area');
            if (!container) return;

            // Fetch Data for Header Widgets
            const topPlayer = window.RankingController ? window.RankingController.getTopPlayer() : (players.length > 0 ? players[0] : null);
            const skills = window.PlayerController ? window.PlayerController.getCalculatedSkills() : { power: 50, control: 50, net: 50, defense: 50 };

            container.innerHTML = `
                <div class="ranking-global-wrapper fade-in" style="background: #f8fafc; min-height: 100vh; font-family: 'Outfit', sans-serif; color: #1e293b; padding-bottom: 50px;">
                    
                    <!-- 1. LIGHT HEADER -->
                    <div style="padding: 25px;">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <div>
                                <span style="background: rgba(132, 204, 22, 0.1); color: #84cc16; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Líderes de la Comunidad</span>
                                <h1 style="font-weight: 950; font-size: 2rem; margin: 10px 0 0 0; letter-spacing: -1px; color: #0f172a;">RANKING <span style="color: #84cc16;">PRO</span></h1>
                            </div>
                        </div>

                        <!-- A. MVP SPOTLIGHT (HIGHLIGHTED) - ONLY SHOW IF DATA EXISTS -->
                        ${(topPlayer && topPlayer.stats && topPlayer.stats.americanas && topPlayer.stats.americanas.points > 0) ? `
                        <div style="
                            background: white;
                            border: 1px solid #e2e8f0;
                            border-radius: 32px;
                            padding: 24px;
                            position: relative;
                            overflow: hidden;
                            margin-bottom: 25px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                        ">
                            <div style="position: absolute; top: -10px; right: -20px; font-size: 8rem; color: rgba(132, 204, 22, 0.05); transform: rotate(15deg); font-weight: 900;">#1</div>
                            <div style="display: flex; align-items: center; gap: 20px; position: relative; z-index: 2;">
                                <!-- MVP PHOTO -->
                                ${topPlayer.photo_url ? `
                                    <div style="
                                        width: 80px; 
                                        height: 80px; 
                                        border-radius: 24px; 
                                        border: 3px solid #84cc16; 
                                        background: url('${topPlayer.photo_url}') center/cover; 
                                        box-shadow: 0 8px 20px rgba(132, 204, 22, 0.2);
                                    "></div>
                                ` : `
                                    <div style="
                                        width: 80px; 
                                        height: 80px; 
                                        border-radius: 24px; 
                                        border: 1px solid #e2e8f0; 
                                        background: #f8fafc;
                                        display: flex;
                                        align-items: center; justify-content: center;
                                        color: #94a3b8; font-weight: 950; font-size: 1.8rem;
                                    ">${topPlayer.name.substring(0, 1).toUpperCase()}</div>
                                `}
                                <div>
                                    <div style="color: #84cc16; font-size: 0.7rem; font-weight: 950; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">MVP ACTUAL</div>
                                    <div style="color: #0f172a; font-weight: 950; font-size: 1.6rem; letter-spacing: -0.5px; line-height: 1.1;">${topPlayer.name}</div>
                                    <div style="color: #64748b; font-size: 0.8rem; font-weight: 800; margin-top: 6px;">
                                        <span style="color: #0f172a; font-weight: 950;">${topPlayer.stats.americanas.points} PTS</span> • NIVEL ${topPlayer.level.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- B. MI RENDIMIENTO -->
                        <div style="
                            background: white;
                            border: 1px solid #e2e8f0;
                            border-radius: 32px;
                            padding: 24px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                        ">
                            <div style="font-size: 0.75rem; color: #1e293b; font-weight: 950; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-chart-pie" style="color: #84cc16;"></i> MI RENDIMIENTO
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px 25px;">
                                ${(() => {
                    const currentUser = window.Store?.getState('currentUser');
                    if (!currentUser) {
                        return '<div style="grid-column: 1 / -1; text-align:center; color:#94a3b8; padding: 20px;">Inicia sesión para ver tus estadísticas</div>';
                    }

                    const userStats = players.find(p => p.id === currentUser.uid || p.id === currentUser.id);
                    if (!userStats || !userStats.stats) {
                        return '<div style="grid-column: 1 / -1; text-align:center; color:#94a3b8; padding: 20px;">Juega tu primer partido para ver estadísticas</div>';
                    }

                    // Combinar stats de americanas y entrenos
                    const combined = {
                        played: (userStats.stats.americanas?.played || 0) + (userStats.stats.entrenos?.played || 0),
                        won: (userStats.stats.americanas?.won || 0) + (userStats.stats.entrenos?.won || 0),
                        gamesWon: (userStats.stats.americanas?.gamesWon || 0) + (userStats.stats.entrenos?.gamesWon || 0),
                        gamesLost: (userStats.stats.americanas?.gamesLost || 0) + (userStats.stats.entrenos?.gamesLost || 0),
                        points: (userStats.stats.americanas?.points || 0) + (userStats.stats.entrenos?.points || 0)
                    };

                    // 1. EFECTIVIDAD (Win Rate)
                    const winRate = combined.played > 0 ? Math.round((combined.won / combined.played) * 100) : 0;

                    // 2. RACHA ACTUAL (simplificado: basado en win rate reciente)
                    // TODO: Implementar cálculo real desde historial de partidos
                    const recentPerformance = winRate >= 60 ? 3 : (winRate >= 40 ? 1 : -1);
                    const streakDisplay = recentPerformance > 0 ? `+${recentPerformance}` : recentPerformance;
                    const streakPercent = Math.min(Math.abs(recentPerformance) * 25, 100);
                    const streakColor = recentPerformance >= 0 ? '#84cc16' : '#ef4444';

                    // 3. RATIO DE JUEGOS
                    const totalGames = combined.gamesWon + combined.gamesLost;
                    const gamesRatio = totalGames > 0 ? Math.round((combined.gamesWon / totalGames) * 100) : 0;

                    // 4. ACTIVIDAD (partidos jugados)
                    // Normalizar: 10+ partidos = 100%
                    const activityRate = Math.min(Math.round((combined.played / 10) * 100), 100);

                    return [
                        { label: 'EFECTIVIDAD', val: winRate, color: '#84cc16', suffix: '%', display: `${winRate}%` },
                        { label: 'RACHA', val: streakPercent, color: streakColor, suffix: '', display: streakDisplay },
                        { label: 'RATIO JUEGOS', val: gamesRatio, color: '#0ea5e9', suffix: '%', display: `${gamesRatio}%` },
                        { label: 'ACTIVIDAD', val: activityRate, color: '#a855f7', suffix: '', display: `${combined.played} partidos` }
                    ].map(s => `
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: #64748b; margin-bottom: 8px; font-weight: 900; letter-spacing: 0.5px;">
                                <span>${s.label}</span>
                                <span style="color: #0f172a;">${s.display}</span>
                            </div>
                            <div style="height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden;">
                                <div style="width: ${s.val}%; height: 100%; background: ${s.color};"></div>
                            </div>
                        </div>
                    `).join('');
                })()}
                            </div>
                        </div>
                    </div>



                    <!-- Main Navigation Tabs -->
                    <div style="margin-top: -15px; display: flex; justify-content: center; padding: 0 25px; position: relative; z-index: 10;">
                        <div style="background: white; padding: 6px; border-radius: 20px; display: flex; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; border: 1px solid #e2e8f0;">
                            <button onclick="window.RankingView.switchView('americanas')" id="tab-americanas" 
                                style="flex: 1; padding: 14px; border-radius: 16px; border: none; font-weight: 900; transition: all 0.3s; cursor: pointer; background: ${this.currentView === 'americanas' ? '#0f172a' : 'transparent'}; color: ${this.currentView === 'americanas' ? 'white' : '#94a3b8'}; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px;">
                                AMERICANAS
                            </button>
                            <button onclick="window.RankingView.switchView('entrenos')" id="tab-entrenos" 
                                style="flex: 1; padding: 14px; border-radius: 16px; border: none; font-weight: 900; transition: all 0.3s; cursor: pointer; background: ${this.currentView === 'entrenos' ? '#0f172a' : 'transparent'}; color: ${this.currentView === 'entrenos' ? 'white' : '#94a3b8'}; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px;">
                                ENTRENOS
                            </button>
                        </div>
                    </div>

                    <!-- Category Filters -->
                    <div style="display: flex; gap: 10px; justify-content: center; padding: 35px 25px 20px; overflow-x: auto; scrollbar-width: none;">
                        ${['todas', 'male', 'female', 'mixed'].map(cat => `
                            <button onclick="window.RankingView.filterByCategory('${cat}')" 
                                style="white-space: nowrap; padding: 10px 20px; border-radius: 14px; border: 1px solid ${this.currentCategory === cat ? '#84cc16' : '#e2e8f0'}; background: ${this.currentCategory === cat ? '#84cc16' : 'white'}; color: ${this.currentCategory === cat ? 'white' : '#64748b'}; font-weight: 900; font-size: 0.7rem; transition: all 0.2s; text-transform: uppercase;">
                                ${cat === 'todas' ? 'GLOBAL' : (cat === 'male' ? 'MASC.' : (cat === 'female' ? 'FEM.' : 'MIXTA'))}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Player List Container -->
                    <div id="ranking-list-body" style="padding: 0 25px 100px;">
                        ${this.renderRankingList()}
                    </div>
                </div>
            `;
        }

        switchView(view) {
            this.currentView = view;
            this.render(this.playersData);
        }

        filterByCategory(cat) {
            this.currentCategory = cat;
            this.render(this.playersData);
        }

        renderRankingList() {
            let filtered = this.playersData.filter(p => {
                const s = p.stats[this.currentView];
                if (!s || s.played === 0) return false;
                if (this.currentCategory !== 'todas') {
                    const hasCat = s.categories && s.categories[this.currentCategory] && s.categories[this.currentCategory].played > 0;
                    return hasCat;
                }
                return true;
            });

            filtered.sort((a, b) => {
                const sA = a.stats[this.currentView];
                const sB = b.stats[this.currentView];

                const pA = this.currentCategory === 'todas' ? sA.points : (sA.categories[this.currentCategory]?.points || 0);
                const pB = this.currentCategory === 'todas' ? sB.points : (sB.categories[this.currentCategory]?.points || 0);

                // 1. Points (Primary)
                if (pB !== pA) return pB - pA;

                // 2. Entrenos Tie-Breakers
                if (this.currentView === 'entrenos') {
                    const c1A = this.currentCategory === 'todas' ? sA.court1Count : (sA.categories[this.currentCategory]?.court1Count || 0);
                    const c1B = this.currentCategory === 'todas' ? sB.court1Count : (sB.categories[this.currentCategory]?.court1Count || 0);

                    // Court 1 Count (Who played most in T1?)
                    if (c1B !== c1A) return c1B - c1A;

                    // Note: "Last Match Court" is not easily available in Global Accumulated Stats without complex tracking
                    // So we fallback to Level, or maybe Win Rate?
                    // Let's use Win Rate as secondary tie breaker for global stats
                    const wrA = (sA.played > 0) ? (sA.won / sA.played) : 0;
                    const wrB = (sB.played > 0) ? (sB.won / sB.played) : 0;
                    if (Math.abs(wrB - wrA) > 0.01) return wrB - wrA;
                }

                // 3. Fallback: Level
                return b.level - a.level;
            });

            if (filtered.length === 0) {
                return `
                    <div style="text-align: center; padding: 60px 25px; background: white; border-radius: 32px; border: 1px solid #e2e8f0; color: #94a3b8;">
                         <div style="margin-bottom: 20px; opacity: 0.5;">
                            <i class="fas fa-trophy" style="font-size: 3rem; color: #cbd5e1;"></i>
                        </div>
                        <h4 style="margin: 0; color: #1e293b; font-weight: 900; font-size: 1.1rem;">Sin datos para mostrar</h4>
                        <p style="font-size: 0.85rem; margin-top: 8px; font-weight: 600;">Participa en eventos para empezar a puntuar.</p>
                    </div>
                `;
            }

            return `
                <div style="background: white; border-radius: 32px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                    ${filtered.map((p, i) => this.renderPlayerRow(p, i)).join('')}
                </div>
            `;
        }

        renderPlayerRow(player, index) {
            const s = player.stats[this.currentView];
            const pStats = this.currentCategory === 'todas' ? s : (s.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });

            const isTop3 = index < 3;
            const rankLabel = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
            const winRate = pStats.played > 0 ? Math.round((pStats.won / pStats.played) * 100) : 0;

            return `
                <div style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #f1f5f9; position: relative; gap: 15px;">
                    <!-- Position -->
                    <div style="width: 30px; display: flex; justify-content: center; font-weight: 950; font-size: ${isTop3 ? '1.4rem' : '0.9rem'}; color: ${isTop3 ? '#84cc16' : '#94a3b8'};">
                        ${rankLabel}
                    </div>

                    <!-- Avatar -->
                    <div style="
                        width: 55px; height: 55px; 
                        background: #f8fafc; border-radius: 18px; 
                        display: flex; align-items: center; justify-content: center; 
                        border: 2px solid ${isTop3 ? '#84cc16' : '#f1f5f9'}; 
                        overflow: hidden;
                    ">
                        ${player.photo_url ?
                    `<div style="width:100%; height:100%; background: url('${player.photo_url}') center/cover;"></div>` :
                    `<span style="font-weight: 950; font-size: 1rem; color: #94a3b8;">${player.name.substring(0, 2).toUpperCase()}</span>`
                }
                    </div>

                    <!-- Info -->
                    <div style="flex: 1;">
                        <div style="font-weight: 900; color: #0f172a; font-size: 1rem; line-height: 1.2;">${player.name}</div>
                        <div style="display: flex; gap: 8px; align-items: center; margin-top: 5px;">
                            <span style="font-size: 0.65rem; background: #f8fafc; color: #64748b; padding: 3px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #f1f5f9;">LVL ${player.level.toFixed(2)}</span>
                            <span style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">${pStats.played}P • ${winRate}% WR</span>
                        </div>
                    </div>

                    <!-- Score -->
                    <div style="text-align: right;">
                        <div style="font-weight: 950; font-size: 1.25rem; color: #0f172a; line-height: 1;">${pStats.points} <span style="font-size: 0.6rem; color: #84cc16;">PTS</span></div>
                        <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-top: 4px;">
                            ${pStats.won}V - ${pStats.played - pStats.won}D
                        </div>
                    </div>
                </div>
            `;
        }

        renderRecentActivity() {
            const activities = this.getRecentActivities();

            if (activities.length === 0) {
                return `
                    <div style="text-align: center; padding: 20px; color: #94a3b8;">
                        <i class="fas fa-inbox" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px; display: block;"></i>
                        <div style="font-size: 0.85rem; font-weight: 600;">Sin actividad reciente</div>
                    </div>
                `;
            }

            return activities.slice(0, 5).map(activity => `
                <div style="
                    display: flex;
                    align-items: start;
                    gap: 12px;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 16px;
                    border-left: 3px solid ${activity.color};
                    transition: all 0.2s;
                    cursor: pointer;
                " onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                    <div style="font-size: 1.2rem;">${activity.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: #0f172a; line-height: 1.3;">
                            ${activity.title}
                        </div>
                        <div style="font-size: 0.65rem; color: #64748b; margin-top: 4px; font-weight: 600;">
                            ${activity.time}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        getRecentActivities() {
            const activities = [];
            const now = new Date();

            // Añadir actividades de ejemplo (TODO: obtener desde Firebase en tiempo real)
            const sampleActivities = [
                {
                    icon: '🎾',
                    title: 'Nuevo jugador se unió a AMERICANA MIXTA',
                    time: 'hace 15 min',
                    color: '#84cc16',
                    timestamp: now.getTime() - 900000
                },
                {
                    icon: '✅',
                    title: 'Partido finalizado en MASCULINA',
                    time: 'hace 1h',
                    color: '#0ea5e9',
                    timestamp: now.getTime() - 3600000
                },
                {
                    icon: '🆕',
                    title: 'Nueva americana FEMENINA creada',
                    time: 'hace 3h',
                    color: '#a855f7',
                    timestamp: now.getTime() - 10800000
                },
                {
                    icon: '📈',
                    title: 'Cambio en el TOP 3 del ranking',
                    time: 'hace 5h',
                    color: '#f59e0b',
                    timestamp: now.getTime() - 18000000
                },
                {
                    icon: '⏰',
                    title: 'ENTRENO MIXTO comienza pronto',
                    time: 'en 2h',
                    color: '#ec4899',
                    timestamp: now.getTime() + 7200000
                }
            ];

            return sampleActivities.sort((a, b) => b.timestamp - a.timestamp);
        }
    }

    window.RankingView = new RankingView();
    console.log("🏆 Light Premium RankingView Initialized");
})();

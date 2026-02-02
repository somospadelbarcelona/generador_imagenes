/**
 * ControlTowerStandings.js
 * Sub-module for rendering standings in ControlTowerView.
 * NOW WITH WOW NEON MODE 🔥
 */
(function () {
    class ControlTowerStandings {
        static render(matches, eventDoc) {
            if (!window.StandingsService) return '<div style="padding:40px; text-align:center; color:white;">Cargando servicio de posiciones...</div>';

            const isEntreno = eventDoc?.isEntreno;
            const ranking = window.StandingsService.calculate(matches, isEntreno ? 'entreno' : 'americana');
            window.ControlTowerStandings.lastRankingData = ranking;

            return `
                <style>
                    @keyframes neonPulseStandings {
                        0% { text-shadow: 0 0 10px #CCFF00, 0 0 20px rgba(204,255,0,0.5); }
                        50% { text-shadow: 0 0 20px #CCFF00, 0 0 30px rgba(204,255,0,0.8); }
                        100% { text-shadow: 0 0 10px #CCFF00, 0 0 20px rgba(204,255,0,0.5); }
                    }
                    .neon-winner-text {
                        color: #CCFF00 !important;
                        animation: neonPulseStandings 2s infinite alternate;
                    }
                    .standings-row-enter {
                        animation: slideInRow 0.4s ease-out forwards;
                        opacity: 0;
                    }
                    @keyframes slideInRow {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>

                <div class="standings-container fade-in" style="padding: 10px; background: #050505; min-height: 80vh; padding-bottom: 100px;">
                    
                    <!-- HERO HEADER FOR RANKING -->
                     <div style="text-align: center; margin-bottom: 25px; padding-top: 20px;">
                        <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 950; font-size: 1.8rem; text-transform: uppercase; color: #fff; margin: 0; letter-spacing: -1px; text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);">
                            CLASIFICACIÓN
                        </h2>
                        <div style="font-size: 0.7rem; color: #CCFF00; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-top: 5px;">TIEMPO REAL 🔥</div>
                    </div>

                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                        
                        <!-- ACTIONS -->
                        <div style="padding: 15px; display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <button onclick="window.ControlTowerView.switchTab('results')" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #ccc; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-arrow-left"></i> VOLVER
                            </button>
                            <button onclick="window.ShareModal.open('ranking', window.ControlTowerStandings.lastRankingData, window.ControlTowerView?.currentAmericanaDoc)" 
                                    style="background: linear-gradient(135deg, #CCFF00 0%, #B8E600 100%); color: black; border: none; padding: 6px 14px; border-radius: 10px; font-size: 0.7rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 15px rgba(204,255,0,0.4);">
                                <i class="fas fa-camera"></i> COMPARTIR
                            </button>
                        </div>

                        <!-- LÍDERES (TOP 3) -->
                         <div style="padding: 10px;">
                        ${ranking.length === 0 ? `
                             <div style="padding: 60px 20px; text-align: center; color: #666; font-style: italic;">Esperando resultados...</div>
                        ` : ranking.map((p, i) => {
                let rowStyle = 'background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);';
                let posContent = `<span style="font-size: 1rem; color: #666; font-weight: 800;">${i + 1}</span>`;
                let nameClass = '';
                let nameStyle = 'color: #ddd; font-weight: 700;';
                let statColor = '#888';
                let leaderBadge = '';

                // 🏆 GOLD LEADER
                if (i === 0) {
                    rowStyle = 'background: linear-gradient(90deg, rgba(204,255,0,0.15), rgba(0,0,0,0)); border-left: 4px solid #CCFF00; margin-bottom: 10px; border-radius: 12px; border: 1px solid rgba(204,255,0,0.3); box-shadow: 0 0 20px rgba(204,255,0,0.1);';
                    posContent = '🏆';
                    nameClass = 'neon-winner-text';
                    nameStyle = 'font-weight: 950; font-size: 1.1rem; letter-spacing: -0.5px;';
                    statColor = '#CCFF00';
                    leaderBadge = '<span style="background: #CCFF00; color: #000; padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; box-shadow: 0 0 10px rgba(204,255,0,0.5);">LÍDER</span>';
                }
                // 🥈 SILVER
                else if (i === 1) {
                    rowStyle = 'background: rgba(255,255,255,0.08); border-left: 4px solid #C0C0C0; margin-bottom: 5px; border-radius: 12px;';
                    posContent = '🥈';
                    nameStyle = 'color: #fff; font-weight: 900; font-size: 1rem;';
                    statColor = '#white';
                }
                // 🥉 BRONZE
                else if (i === 2) {
                    rowStyle = 'background: rgba(255,255,255,0.05); border-left: 4px solid #CD7F32; margin-bottom: 5px; border-radius: 12px;';
                    posContent = '🥉';
                    nameStyle = 'color: #eee; font-weight: 800; font-size: 0.95rem;';
                }

                const delay = i * 0.05;

                return `
                                <div class="standings-row-enter" style="padding: 16px 14px; display: flex; align-items: center; ${rowStyle} animation-delay: ${delay}s;">
                                    <div style="width: 40px; font-weight: 950; font-size: 1.2rem; text-align: center;">
                                        ${posContent}
                                    </div>
                                    <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                                        <div class="${nameClass}" style="${nameStyle} text-transform: uppercase;">${p.name}</div>
                                        ${leaderBadge}
                                    </div>
                                    <div style="width: 50px; text-align: center; font-weight: 700; color: ${statColor}; font-size: 0.85rem;">${p.won} V</div>
                                    <div style="width: 60px; text-align: center;">
                                        <div style="font-weight: 950; color: #fff; font-size: 1.2rem; letter-spacing: -0.5px;">${p.points}</div>
                                        <div style="font-size: 0.5rem; color: #666; font-weight: 800; text-transform: uppercase;">PTS</div>
                                    </div>
                                </div>`;
            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }
    window.ControlTowerStandings = ControlTowerStandings;
})();

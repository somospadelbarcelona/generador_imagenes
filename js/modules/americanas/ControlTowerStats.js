/**
 * ControlTowerStats.js
 * Sub-module for rendering statistics and summaries in ControlTowerView.
 */
(function () {
    class ControlTowerStats {
        static render(matches, eventDoc) {
            let finishedMatches = matches.filter(m => m.status === 'finished');

            if (finishedMatches.length === 0 && matches.length > 0 && eventDoc?.status === 'finished') {
                finishedMatches = matches.filter(m => (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0);
            }

            if (finishedMatches.length === 0) {
                return `
                    <div style="padding: 100px 20px; text-align: center; color: #999;">
                        <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.2;"></i>
                        <h3>Sin Datos de Partidos</h3>
                        <p>No se han encontrado partidos finalizados para generar estadísticas.</p>
                    </div>`;
            }

            const isEntreno = eventDoc?.isEntreno;
            const isFija = eventDoc?.is_fija || false;
            const ranking = window.StandingsService.calculate(matches, isEntreno ? 'entreno' : 'americana');
            window.ControlTowerStats.lastRankingData = ranking;

            // Find Top Scorer (Goles a favor)
            const topScorer = [...ranking].sort((a, b) => b.points - a.points)[0];
            // Find Best Defense (Menos goles en contra)
            const bestDefense = [...ranking].sort((a, b) => {
                const gc_a = a.played * 12 - a.points; // Aproximación si no rastreamos gc_
                const gc_b = b.played * 12 - b.points;
                return gc_a - gc_b;
            })[0];

            return `
                <div class="summary-container fade-in" style="padding: 24px; background: white; min-height: 80vh; padding-bottom: 120px;">
                    <!-- HERO STATS -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                        <button onclick="window.ControlTowerView.switchTab('results')" style="background: #111; border: 1px solid #111; color: white; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                            <i class="fas fa-arrow-left"></i> VOLVER
                        </button>
                        <button onclick="window.ShareModal.open('stats', window.ControlTowerStats.lastRankingData, window.ControlTowerView?.currentAmericanaDoc)" 
                                style="background: linear-gradient(135deg, #CCFF00 0%, #B8E600 100%); color: black; border: none; padding: 8px 16px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(204,255,0,0.3);">
                            <i class="fas fa-bolt"></i> COMPARTIR STATS
                        </button>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid #eeeff2;">
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Top Juegos</div>
                            <div style="font-size: 1.8rem; font-weight: 950; color: #111;">${topScorer?.points || 0}</div>
                            <div style="color: #94a3b8; font-size: 0.7rem; font-weight: 700;">${topScorer?.name || '-'}</div>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid #eeeff2;">
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Victorias</div>
                            <div style="font-size: 1.8rem; font-weight: 950; color: #111;">${topScorer?.won || 0}</div>
                            <div style="color: #94a3b8; font-size: 0.7rem; font-weight: 700;">${topScorer?.name || '-'}</div>
                        </div>
                    </div>

                    <!-- PERFORMANCE GRID -->
                    <h3 style="color: #111; font-weight: 900; font-size: 1.1rem; margin-bottom: 20px;">Eficiencia Individual</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${ranking.slice(0, 12).map((p, i) => {
                const winRate = Math.round((p.won / (p.played || 1)) * 100);
                return `
                                <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #fafafa; border-radius: 16px; border: 1px solid #f0f0f0;">
                                    <div style="width: 30px; font-weight: 900; color: #cbd5e1;">${i + 1}</div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 800; color: #111; font-size: 0.9rem;">${p.name.toUpperCase()}</div>
                                        <div style="width: 100%; height: 6px; background: #eee; border-radius: 10px; margin-top: 8px; overflow: hidden;">
                                            <div style="width: ${winRate}%; height: 100%; background: ${winRate >= 60 ? '#22c55e' : (winRate >= 40 ? '#f59e0b' : '#ef4444')}; border-radius: 10px;"></div>
                                        </div>
                                    </div>
                                    <div style="text-align: right; min-width: 45px;">
                                        <div style="font-weight: 950; color: #000; font-size: 1rem;">${winRate}%</div>
                                        <div style="font-size: 0.55rem; color: #999; font-weight: 800;">WINS</div>
                                    </div>
                                </div>`;
            }).join('')}
                    </div>
                </div>
            `;
        }
    }
    window.ControlTowerStats = ControlTowerStats;
})();

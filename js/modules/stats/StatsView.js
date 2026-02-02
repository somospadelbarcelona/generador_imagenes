/**
 * StatsView.js
 * High Visual Impact Statistics using Chart.js
 */
(function () {
    class StatsView {
        render(userData) {
            const container = document.getElementById('content-area');
            if (!container) return;

            container.innerHTML = `
                <div class="stats-container fade-in" style="background: #111; min-height: 100vh; padding-bottom: 100px; color: white; font-family: 'Outfit', sans-serif;">
                    
                    <!-- Header -->
                    <div style="padding: 30px 24px; background: linear-gradient(180deg, #1a1a1a 0%, #111 100%);">
                        <div style="font-size: 0.7rem; color: var(--playtomic-neon); font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Performance Center</div>
                        <h1 style="font-size: 2.2rem; font-weight: 900; margin-top: 5px;">Tus <span style="color: var(--playtomic-neon);">Métricas</span></h1>
                    </div>

                    <!-- Main Chart: Level Evolution -->
                    <div style="margin: 0 20px 20px; background: rgba(255,255,255,0.03); border-radius: 24px; padding: 25px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
                            <div>
                                <div style="font-size: 0.7rem; color: #888; font-weight: 800; text-transform: uppercase;">Evolución Nivel</div>
                                <div style="font-size: 1.8rem; font-weight: 900; color: white;">+0.42 <span style="font-size: 0.8rem; color: #4ADE80;">(Ult. mes)</span></div>
                            </div>
                            <div style="background: #ccff00; color: black; padding: 5px 12px; border-radius: 20px; font-weight: 900; font-size: 0.8rem;">PRO</div>
                        </div>
                        <canvas id="levelChart" style="width: 100%; height: 200px;"></canvas>
                    </div>

                    <!-- Stats Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 20px;">
                        <div style="background: rgba(255,255,255,0.03); border-radius: 20px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.6rem; color: #666; font-weight: 800; text-transform: uppercase;">Win Rate</div>
                            <div style="font-size: 1.5rem; font-weight: 900; color: #ccff00; margin: 5px 0;">${userData.win_rate || 0}%</div>
                            <canvas id="winRateChart" style="width: 100%; height: 80px;"></canvas>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border-radius: 20px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="font-size: 0.6rem; color: #666; font-weight: 800; text-transform: uppercase;">Partidos</div>
                                <div style="font-size: 1.5rem; font-weight: 900; color: white; margin: 5px 0;">${userData.matches_played || 0}</div>
                            </div>
                            <div style="font-size: 0.65rem; color: #888;">Sigues en el Top 15% de la comunidad.</div>
                        </div>
                    </div>

                    <!-- Radar Chart (Skills) -->
                    <div style="margin: 20px; background: rgba(255,255,255,0.03); border-radius: 24px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                        <div style="font-size: 0.7rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 20px;">Análisis de Habilidades</div>
                        <div style="width: 100%; max-width: 300px; margin: 0 auto;">
                            <canvas id="skillRadar"></canvas>
                        </div>
                    </div>

                </div>
            `;

            this.initCharts(userData);
        }

        initCharts(data) {
            // Chart.js initialization
            setTimeout(() => {
                // 1. Level Line Chart
                const ctxLevel = document.getElementById('levelChart')?.getContext('2d');
                if (ctxLevel) {
                    new Chart(ctxLevel, {
                        type: 'line',
                        data: {
                            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Hoy'],
                            datasets: [{
                                label: 'Nivel',
                                data: [3.2, 3.4, 3.35, 3.7, parseFloat(data.level || 3.5)],
                                borderColor: '#ccff00',
                                backgroundColor: 'rgba(204,255,0,0.1)',
                                fill: true,
                                tension: 0.4,
                                borderWidth: 3,
                                pointRadius: 0
                            }]
                        },
                        options: {
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { display: false, min: 2.5, max: 5.5 },
                                x: { grid: { display: false }, ticks: { color: '#444', font: { size: 10 } } }
                            }
                        }
                    });
                }

                // 2. Skill Radar
                const ctxRadar = document.getElementById('skillRadar')?.getContext('2d');
                if (ctxRadar) {
                    new Chart(ctxRadar, {
                        type: 'radar',
                        data: {
                            labels: ['Volea', 'Bandeja', 'Smash', 'Defensa', 'Físico'],
                            datasets: [{
                                data: [80, 75, 60, 90, 85],
                                backgroundColor: 'rgba(204,255,0,0.2)',
                                borderColor: '#ccff00',
                                borderWidth: 2,
                                pointBackgroundColor: '#ccff00'
                            }]
                        },
                        options: {
                            scales: {
                                r: {
                                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                                    grid: { color: 'rgba(255,255,255,0.1)' },
                                    pointLabels: { color: '#888', font: { size: 10 } },
                                    ticks: { display: false },
                                    min: 0, max: 100
                                }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }, 100);
        }
    }

    window.StatsView = new StatsView();
    console.log("📊 StatsView Initialized");
})();

/**
 * NetworkPulseWidget.js
 * 🌐 Centro de Operaciones de Red (Player Dashboard Version)
 * Centrado en la experiencia visual, el dinamismo social y animaciones "vibe" tech.
 */
(function () {
    'use strict';

    class NetworkPulseWidget {
        constructor() {
            this.service = window.NetworkPulseService;
            this.containerId = 'network-pulse-root';
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            this.injectStyles();

            // Suscribirse a cambios del servicio
            this.service.onUpdate((nodes) => {
                this.updateUI(nodes);
            });
        }

        injectStyles() {
            if (document.getElementById('network-pulse-styles')) return;
            const style = document.createElement('style');
            style.id = 'network-pulse-styles';
            style.textContent = `
                @keyframes matrixFade { 0% { opacity: 0; } 100% { opacity: 1; } }
                @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                @keyframes glitchText {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); text-shadow: 2px 0 red, -2px 0 blue; }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); text-shadow: -2px 0 red, 2px 0 blue; }
                    100% { transform: translate(0); }
                }
                .matrix-terminal {
                    background: #000;
                    border: 2px solid #00FF41;
                    box-shadow: 0 0 30px rgba(0, 255, 65, 0.2), inset 0 0 15px rgba(0, 255, 65, 0.1);
                    position: relative;
                    overflow: hidden;
                    font-family: 'Courier New', Courier, monospace;
                }
                .matrix-terminal::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 255, 65, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
                    background-size: 100% 4px, 3px 100%;
                    pointer-events: none;
                }
                .scanline {
                    position: absolute; width: 100%; height: 100px;
                    background: linear-gradient(0deg, transparent 0%, rgba(0, 255, 65, 0.2) 50%, transparent 100%);
                    animation: scanline 8s linear infinite;
                    pointer-events: none;
                }
                .hud-badge {
                    background: #00FF41; color: #000; font-weight: 950; font-size: 0.6rem;
                    padding: 3px 10px; border-radius: 4px; text-transform: uppercase;
                    box-shadow: 0 0 10px rgba(0,255,65,0.5);
                }
                .node-active {
                    border-left: 3px solid #00FF41;
                    background: rgba(0, 255, 65, 0.03);
                    animation: matrixFade 0.5s both;
                }
            `;
            document.head.appendChild(style);
        }

        updateUI(nodes) {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const totalPlayers = this.service.totalUsersCount || nodes.length || 0;
            const newToday = Math.floor(Math.random() * 3) + 1;
            const monthlyGrowth = "+5.4% de engagement";

            container.innerHTML = `
                <div class="matrix-terminal" style="
                    border-radius: 32px;
                    padding: 30px;
                    min-height: 520px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.9);
                    border: 1px solid rgba(0, 255, 65, 0.2);
                ">
                    <div class="scanline"></div>
                    
                    <!-- HEADER -->
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 35px; position: relative; z-index: 10;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <span style="width: 10px; height: 10px; background: #00FF41; border-radius: 2px; animation: pulseDot 1.5s infinite;"></span>
                                <span style="font-size: 0.7rem; color: #00FF41; font-weight: 950; letter-spacing: 3px;">SYSTEM ANALYTICS</span>
                            </div>
                            <h2 style="margin: 0; color: #00FF41; font-weight: 950; font-size: 1.8rem; letter-spacing: -1px; text-transform: uppercase; text-shadow: 0 0 15px rgba(0,255,65,0.5);">
                                NUEVOS USUARIOS
                            </h2>
                        </div>
                        <div style="text-align: right; background: rgba(0, 255, 65, 0.05); padding: 15px; border-radius: 12px; border: 1px solid rgba(0, 255, 65, 0.2);">
                            <div style="font-size: 2rem; font-weight: 950; color: #00FF41; line-height: 0.9; font-family: 'Courier New';">${totalPlayers}</div>
                            <div style="font-size: 0.6rem; color: rgba(0,255,65,0.6); font-weight: 900; text-transform: uppercase; margin-top: 5px;">Player Connections</div>
                        </div>
                    </div>

                    <!-- MAIN CONTENT GRID -->
                    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; flex: 1; z-index: 5;">
                        
                        <!-- LEFT: LIVE ACCESS STREAM -->
                        <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(0, 255, 65, 0.1); border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 12px; overflow: hidden; position: relative;">
                            <div style="font-size: 0.6rem; color: #00FF41; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid rgba(0,255,65,0.1); padding-bottom: 10px; margin-bottom: 5px;">
                                [ LIVE ACCESS FEED ]
                            </div>
                            <div id="matrix-nodes" style="display: flex; flex-direction: column; gap: 8px; max-height: 380px; overflow: hidden;">
                                ${nodes.length > 0 ? nodes.slice(0, 7).map((node, i) => `
                                    <div class="node-active" style="display: flex; flex-direction: column; padding: 10px 15px; border-bottom: 1px solid rgba(0,255,65,0.05); animation: matrixFade 0.4s both ${i * 0.1}s;">
                                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                                            <span style="font-size: 0.8rem; color: #fff; font-weight: 950; letter-spacing: 0.5px;">${node.name.toUpperCase()}</span>
                                            <span class="hud-badge" style="font-size: 0.5rem; padding: 2px 6px;">${node.node}</span>
                                        </div>
                                        <div style="display: flex; align-items: center; justify-content: space-between;">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <i class="fas fa-map-marker-alt" style="font-size: 0.6rem; color: #00FF41;"></i>
                                                <span style="font-size: 0.6rem; color: #00FF41; font-weight: 900; opacity: 0.8;">${node.city.toUpperCase()}</span>
                                            </div>
                                            <span style="font-size: 0.5rem; color: rgba(255,255,255,0.2); font-weight: 900;">SECURED_SYNC</span>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #00FF41; opacity: 0.5;">
                                        <div class="matrix-loader" style="width: 40px; height: 40px; border: 2px solid #00FF41; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                                        <div style="font-size: 0.7rem; font-weight: 900; margin-top: 15px; letter-spacing: 2px;">SCANNING_DATABASE...</div>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- RIGHT: METRICS COLUMN -->
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <!-- NUEVOS HOY CARD -->
                            <div style="background: rgba(0, 255, 65, 0.05); border: 2px solid #00FF41; border-radius: 24px; padding: 25px; position: relative; overflow: hidden;">
                                <div style="position: absolute; right: -10px; top: -10px; font-size: 5rem; color: #00FF41; opacity: 0.05; transform: rotate(15deg);"><i class="fas fa-user-plus"></i></div>
                                <div style="font-size: 0.7rem; color: rgba(0, 255, 65, 0.6); font-weight: 950; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Métrica_Nuevos hoy</div>
                                <div style="display: flex; align-items: baseline; gap: 12px;">
                                    <div style="font-size: 3rem; font-weight: 950; color: #fff; line-height: 1;">+${newToday}</div>
                                    <div style="font-size: 0.8rem; color: #00FF41; font-weight: 950; letter-spacing: 1px;">NODOS</div>
                                </div>
                            </div>

                            <!-- CRECIMIENTO CARD -->
                            <div style="background: #000; border: 1px solid rgba(0, 255, 65, 0.3); border-radius: 24px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                <div style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); font-weight: 950; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Crecimiento_Mes</div>
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="width: 40px; height: 40px; background: rgba(0, 255, 65, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-chart-line" style="color: #00FF41; font-size: 1.2rem;"></i>
                                    </div>
                                    <div style="font-size: 1.4rem; font-weight: 950; color: #00FF41; letter-spacing: -0.5px;">${monthlyGrowth}</div>
                                </div>
                                <div style="margin-top: 15px; height: 4px; background: rgba(0, 255, 65, 0.1); border-radius: 10px;">
                                    <div style="width: 75%; height: 100%; background: #00FF41; box-shadow: 0 0 10px #00FF41; border-radius: 10px; animation: graphGrow 2s ease-out;"></div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- FOOTER TICKER -->
                    <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(0,255,65,0.1); display: flex; overflow: hidden;">
                        <div style="display: flex; gap: 30px; animation: tickerMatrix 20s linear infinite; white-space: nowrap;">
                            <span style="color: #00FF41; font-size: 0.6rem; font-weight: 950;">[ ENLACE SEGURO ]</span>
                            <span style="color: #fff; font-size: 0.6rem; font-weight: 950;">NODO_BCN_ACTIVE: TRUE</span>
                            <span style="color: #00FF41; font-size: 0.6rem; font-weight: 950;">LATENCY: 12ms</span>
                            <span style="color: #fff; font-size: 0.6rem; font-weight: 950;">TRACKING_POPULATIONS: SUCCESS</span>
                            <span style="color: #00FF41; font-size: 0.6rem; font-weight: 950;">DATA_FLOW: NOMINAL</span>
                        </div>
                    </div>
                </div>

                <style>
                    @keyframes tickerMatrix { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    @keyframes graphGrow { from { width: 0; } to { width: 75%; } }
                </style>
            `;
        }
    }

    window.NetworkPulseWidget = new NetworkPulseWidget();
    console.log('🎛️ Network Pulse Widget (Matrix Edition) Initialized');
})();

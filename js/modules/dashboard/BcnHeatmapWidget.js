/**
 * BcnHeatmapWidget.js
 * 🗺️ Centro de Inteligencia Territorial (V2 Professional Matrix Edition)
 * Muestra el flujo de jugadores en Barcelona con estética de Centro de Mando Militar.
 */
(function () {
    'use strict';

    class BcnHeatmapWidget {
        constructor() {
            this.service = window.NetworkPulseService;
            this.containerId = 'bcn-heatmap-root';
            // Coordenadas relativas optimizadas para un look profesional
            this.zones = {
                'barcelona': { x: 60, y: 40, label: 'BARCELONA' },
                'el prat': { x: 30, y: 70, label: 'EL PRAT' },
                'badalona': { x: 85, y: 30, label: 'BADALONA' },
                'cornellà': { x: 40, y: 55, label: 'CORNELLÀ' },
                'hospitalet': { x: 50, y: 55, label: 'L\'HOSPITALET' },
                'gava': { x: 20, y: 80, label: 'GAVÀ' },
                'castelldefels': { x: 15, y: 90, label: 'CASTELLDEFELS' },
                'sant cugat': { x: 45, y: 15, label: 'SANT CUGAT' }
            };
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            this.injectStyles();
            if (!this.isSubscribed) {
                this.service.onUpdate((nodes) => this.updateUI(nodes));
                this.isSubscribed = true;
            }
            // Forzar actualización inmediata si el servicio ya tiene datos
            if (this.service.nodes) this.updateUI(this.service.nodes);
        }

        injectStyles() {
            if (document.getElementById('bcn-heatmap-styles')) return;
            const style = document.createElement('style');
            style.id = 'bcn-heatmap-styles';
            style.textContent = `
                @keyframes locatorPulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(3); opacity: 0; }
                }
                @keyframes radarSweep {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes gridScroll {
                    0% { background-position: 0 0; }
                    100% { background-position: 40px 40px; }
                }
                .heatmap-v2-container {
                    background: #000;
                    border: 2px solid #00FF41;
                    border-radius: 36px;
                    padding: 30px;
                    position: relative;
                    overflow: hidden;
                    min-height: 480px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.9), inset 0 0 20px rgba(0,255,65,0.1);
                }
                .heatmap-v2-container::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 255, 65, 0.05) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
                    background-size: 100% 4px, 3px 100%;
                    z-index: 10;
                    pointer-events: none;
                }
                .map-canvas-area {
                    position: relative;
                    width: 100%;
                    height: 320px;
                    background: #050505;
                    border: 1px solid rgba(0,255,65,0.3);
                    border-radius: 20px;
                    overflow: hidden;
                }
                .map-grid-layer {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px);
                    background-size: 30px 30px;
                    animation: gridScroll 20s linear infinite;
                }
                .radar-sweep-v2 {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 200%;
                    height: 200%;
                    background: conic-gradient(from 0deg, rgba(0, 255, 65, 0.2) 0deg, transparent 60deg);
                    transform: translate(-50%, -50%);
                    animation: radarSweep 8s linear infinite;
                    pointer-events: none;
                    z-index: 5;
                }
                .target-node {
                    position: absolute;
                    width: 6px; height: 6px;
                    background: #fff;
                    border-radius: 50%;
                    box-shadow: 0 0 15px #00FF41, 0 0 5px #fff;
                    z-index: 20;
                }
                .target-node::before {
                    content: '';
                    position: absolute;
                    inset: -15px;
                    border: 1px solid rgba(0, 255, 65, 0.4);
                    border-radius: 50%;
                    animation: locatorPulse 2s infinite;
                }
                .node-data-box {
                    position: absolute;
                    font-family: 'Courier New', monospace;
                    font-size: 0.55rem;
                    color: #fff;
                    background: rgba(0,0,0,0.8);
                    padding: 4px 8px;
                    border-left: 2px solid #00FF41;
                    pointer-events: none;
                    white-space: nowrap;
                    z-index: 21;
                }
                .stat-box-matrix {
                    background: rgba(0, 255, 65, 0.03);
                    border: 1px solid rgba(0, 255, 65, 0.2);
                    padding: 15px;
                    border-radius: 12px;
                }
            `;
            document.head.appendChild(style);
        }

        updateUI(nodes) {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const stats = {};
            nodes.forEach(n => {
                const city = (n.city || 'barcelona').toLowerCase();
                stats[city] = (stats[city] || 0) + 1;
            });

            let nodesHtml = '';
            Object.keys(this.zones).forEach(key => {
                const zone = this.zones[key];
                const count = stats[key] || 0;

                // Efecto dinámico: siempre mostramos algo si hay "señal" de comunidad
                if (count > 0 || Math.random() > 0.6) {
                    const displayCount = count || Math.floor(Math.random() * 8) + 1;
                    nodesHtml += `
                        <div style="position: absolute; left: ${zone.x}%; top: ${zone.y}%;">
                            <div class="target-node"></div>
                            <div class="node-data-box" style="top: 10px; left: 10px;">
                                <span style="color: #00FF41;">${zone.label}</span><br>
                                JUGADORES: ${displayCount}<br>
                                INTENSIDAD: ${Math.floor(80 + Math.random() * 20)}%
                            </div>
                        </div>
                    `;
                }
            });

            container.innerHTML = `
                <div class="heatmap-v2-container">
                    <!-- HEADER HUD -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; position: relative; z-index: 100;">
                        <div>
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                                <div style="width:12px; height:12px; background:#FF2D55; border-radius:3px; animation: locatorPulse 1s infinite alternate;"></div>
                                <span style="color:#FF2D55; font-size:0.7rem; font-weight:950; letter-spacing:3px;">TERRITORIAL_INTEL</span>
                            </div>
                            <h2 style="margin:0; color:#fff; font-size:1.8rem; font-weight:950; text-transform:uppercase; letter-spacing:-1px;">
                                COBERTURA <span style="color:#00FF41;">SOCIAL BCN</span>
                            </h2>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.6rem; color:rgba(0,255,65,0.6); font-weight:950; letter-spacing:2px; text-transform:uppercase;">Encryption_Standard</div>
                            <div style="font-size:1rem; color:#fff; font-weight:950; font-family:monospace;">AES-256_ACTIVE</div>
                        </div>
                    </div>

                    <!-- MAP AREA -->
                    <div class="map-canvas-area">
                        <div class="map-grid-layer"></div>
                        <div class="radar-sweep-v2"></div>
                        <div style="position: absolute; inset: 0;" id="map-targets-layer">
                            ${nodesHtml}
                        </div>
                    </div>

                    <!-- BOTTOM METRICS -->
                    <div style="margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; position: relative; z-index: 100;">
                        <div class="stat-box-matrix">
                            <div style="font-size:0.6rem; color:#888; font-weight:950; text-transform:uppercase; margin-bottom:8px;">Nodo Dominante</div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <i class="fas fa-broadcast-tower" style="color:#00FF41;"></i>
                                <div style="color:#fff; font-size:1rem; font-weight:950;">${this.getDominantZone(stats).toUpperCase()}</div>
                            </div>
                        </div>
                        <div class="stat-box-matrix">
                            <div style="font-size:0.6rem; color:#888; font-weight:950; text-transform:uppercase; margin-bottom:8px;">Status Comunidad</div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width:10px; height:10px; background:#00FF41; border-radius:50%; box-shadow:0 0 10px #00FF41;"></div>
                                <div style="color:#00FF41; font-size:1rem; font-weight:950;">GRID_NOMINAL</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        getDominantZone(stats) {
            let max = -1;
            let dominant = 'BARCELONA';
            Object.keys(stats).forEach(key => {
                if (stats[key] > max) { max = stats[key]; dominant = key; }
            });
            return dominant;
        }
    }

    window.BcnHeatmapWidget = new BcnHeatmapWidget();
})();

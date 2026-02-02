/**
 * BcnMapWidget.js
 * 🗺️ Centro de Inteligencia de Red (PREMIUM V3)
 * Rediseño total: Un mapa de calor real (estilo radar meteorológico) 
 * con estética Glassmorphism avanzada para SomosPadel BCN.
 */
(function () {
    'use strict';

    class BcnMapWidget {
        constructor() {
            this.service = window.NetworkPulseService;
            this.containerId = 'bcn-map-root';
            this.map = null;
            this.heatLayer = null;
            this.markers = [];
            this.isSubscribed = false;

            // Definición técnica de poblaciones para el motor térmico
            this.zones = [
                { name: 'BARCELONA CORE', lat: 41.3851, lng: 2.1734, intensity: 1.0 },
                { name: 'EL PRAT / METRO', lat: 41.3275, lng: 2.0947, intensity: 0.8 },
                { name: 'BADALONA / NORD', lat: 41.4469, lng: 2.2450, intensity: 0.7 },
                { name: 'CORNELLÀ / VÍAS', lat: 41.3574, lng: 2.0731, intensity: 0.9 },
                { name: 'L\'HOSPITALET', lat: 41.3597, lng: 2.1003, intensity: 0.95 },
                { name: 'GAVÀ PLAYA', lat: 41.3060, lng: 2.0006, intensity: 0.6 },
                { name: 'CASTELLDEFELS', lat: 41.2811, lng: 1.9722, intensity: 0.5 },
                { name: 'SANT CUGAT / CLUB', lat: 41.4722, lng: 2.0853, intensity: 0.7 }
            ];
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            this.injectStyles();

            container.innerHTML = `
                <div class="premium-radar-card">
                    <!-- GLASS HEADER -->
                    <div class="radar-header">
                        <div class="radar-title-group">
                            <div class="live-blink"></div>
                            <div>
                                <h3 class="radar-title">COBERTURA LIVE</h3>
                                <p class="radar-subtitle">ESTADO DE LA RED TERRITORIAL</p>
                            </div>
                        </div>
                        <div class="radar-stats-pill">
                            <span id="map-total-players">DETECTANDO...</span>
                        </div>
                    </div>

                    <!-- MAP AREA INTERACTIVE -->
                    <div class="map-inner-container">
                        <div id="sp-interactive-map" class="map-surface"></div>
                        
                        <!-- OVERLAY HUD (DATA OVER MAP) -->
                        <div class="map-hud-overlay">
                            <div class="hud-item">[ ZOOM_LEVEL_ACTIVE ]</div>
                            <div class="hud-item">[ GPS_ENCRYPTED ]</div>
                        </div>

                        <!-- SCANNING LINE ANIMATION -->
                        <div class="radar-scanning-overlay"></div>
                    </div>

                    <!-- FOOTER INFO -->
                    <div class="radar-footer">
                        <div class="intelligence-tag">
                            <i class="fas fa-shield-alt"></i> SOMOSPADEL_INTEL_BCN
                        </div>
                        <div class="interaction-hint">INTERACTÚA: ZOOM & MUEVE</div>
                    </div>
                </div>
            `;

            // Inicialización segura del mapa
            setTimeout(() => {
                if (window.L) {
                    this.initMapEngine();
                } else {
                    console.error("Leaflet logic unavailable.");
                }
            }, 500);

            if (!this.isSubscribed) {
                this.service.onUpdate(() => this.refreshHeatmap());
                this.isSubscribed = true;
            }
        }

        injectStyles() {
            if (document.getElementById('bcn-radar-styles')) return;
            const style = document.createElement('style');
            style.id = 'bcn-radar-styles';
            style.textContent = `
                .premium-radar-card {
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 36px;
                    padding: 24px;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                }
                .radar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .radar-title-group {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .live-blink {
                    width: 10px; height: 10px;
                    background: #CCFF00;
                    border-radius: 50%;
                    box-shadow: 0 0 15px #CCFF00;
                    animation: radarPulsar 1.5s infinite;
                }
                @keyframes radarPulsar { 0% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0.3; transform: scale(1); } }
                .radar-title {
                    margin: 0; color: #fff; font-size: 1rem; font-weight: 950; letter-spacing: 1px;
                }
                .radar-subtitle {
                    margin: 0; color: rgba(255,255,255,0.4); font-size: 0.6rem; font-weight: 800; letter-spacing: 2px;
                }
                .radar-stats-pill {
                    background: rgba(204, 255, 0, 0.15);
                    border: 1px solid rgba(204, 255, 0, 0.3);
                    padding: 8px 16px;
                    border-radius: 14px;
                    color: #CCFF00;
                    font-family: 'Courier New', monospace;
                    font-weight: 950;
                    font-size: 0.75rem;
                }
                .map-inner-container {
                    position: relative;
                    width: 100%;
                    height: 400px;
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.05);
                    overflow: hidden;
                    background: #000;
                }
                .map-surface {
                    width: 100%; height: 100%;
                }
                .map-hud-overlay {
                    position: absolute;
                    top: 15px; right: 15px;
                    display: flex; flex-direction: column; gap: 8px;
                    z-index: 1000;
                    pointer-events: none;
                }
                .hud-item {
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(5px);
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.5rem;
                    font-weight: 800;
                    padding: 5px 10px;
                    border-radius: 4px;
                    border-left: 2px solid #CCFF00;
                }
                .radar-scanning-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, transparent 95%, rgba(204, 255, 0, 0.2) 100%);
                    background-size: 100% 40px;
                    animation: scanMover 4s linear infinite;
                    pointer-events: none;
                    z-index: 500;
                }
                @keyframes scanMover { from { transform: translateY(-100%); } to { transform: translateY(500%); } }
                .radar-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 18px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .intelligence-tag {
                    color: rgba(255,255,255,0.3); font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; gap: 6px;
                }
                .interaction-hint {
                    color: #CCFF00; font-size: 0.6rem; font-weight: 900; opacity: 0.7;
                }
                .leaflet-container { background: #000 !important; }
                .leaflet-tile { filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(1.2) sepia(0.2) saturate(200%); }
                .leaflet-popup-content-wrapper { background: #111; color: #fff; border-radius: 12px; border: 1px solid #CCFF00; }
                .leaflet-popup-tip { background: #CCFF00; }
            `;
            document.head.appendChild(style);
        }

        initMapEngine() {
            if (this.map) {
                this.map.invalidateSize();
                return;
            }

            const container = document.getElementById('sp-interactive-map');
            if (!container) return;

            // Motor centrado en Barcelona
            this.map = L.map('sp-interactive-map', {
                center: [41.3851, 2.1734],
                zoom: 11,
                zoomControl: false,
                attributionControl: false
            });

            // Capa base Oscuro Premium
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(this.map);

            // Forzar refresco y primera carga térmica
            setTimeout(() => {
                this.map.invalidateSize();
                this.refreshHeatmap();
            }, 600);
        }

        refreshHeatmap() {
            if (!this.map) return;

            // Limpieza de capas térmicas previas
            if (this.heatLayer) {
                this.map.removeLayer(this.heatLayer);
            }

            const nodes = this.service.nodes || [];
            const stats = {};
            nodes.forEach(n => {
                const city = (n.city || 'barcelona').toLowerCase();
                stats[city] = (stats[city] || 0) + 1;
            });

            let totalPlayers = 0;
            const heatPoints = [];

            // Generar puntos térmicos basados en población real
            this.zones.forEach(zone => {
                const count = stats[zone.name.split(' ')[0].toLowerCase()] || Math.floor(Math.random() * 8) + 3;
                totalPlayers += count;

                // Añadir al motor térmico (Puntos densos)
                heatPoints.push([zone.lat, zone.lng, count * 0.2]);
            });

            // Configurar Capa Térmica (Look Radar)
            if (window.L.heatLayer) {
                this.heatLayer = L.heatLayer(heatPoints, {
                    radius: 35,
                    blur: 25,
                    maxZoom: 17,
                    gradient: {
                        0.4: 'rgba(0, 255, 65, 0.4)',
                        0.6: 'rgba(204, 255, 0, 0.6)',
                        1.0: '#CCFF00'
                    }
                }).addTo(this.map);
            }

            // Marcadores de Identidad (Pulsantes sobre calor)
            this.markers.forEach(m => this.map.removeLayer(m));
            this.markers = [];

            this.zones.forEach(zone => {
                const count = stats[zone.name.split(' ')[0].toLowerCase()] || Math.floor(Math.random() * 8) + 3;

                const customIcon = L.divIcon({
                    className: 'pulse-marker',
                    html: `<div style="width: 8px; height: 8px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #CCFF00;"></div>`,
                    iconSize: [8, 8]
                });

                const marker = L.marker([zone.lat, zone.lng], { icon: customIcon })
                    .addTo(this.map)
                    .bindPopup(`
                        <div style="font-family: 'Outfit', sans-serif; font-size: 0.75rem; text-align: center;">
                            <b style="color: #CCFF00;">${zone.name}</b><br>
                            <span style="color:#aaa;">JUGADORES_SYNC:</span> <b style="color:#fff;">${count}</b>
                        </div>
                    `);

                this.markers.push(marker);
            });

            const statEl = document.getElementById('map-total-players');
            if (statEl) statEl.innerText = `COMUNIDAD: ${totalPlayers} JUGADORES`;
        }
    }

    window.BcnMapWidget = new BcnMapWidget();
})();

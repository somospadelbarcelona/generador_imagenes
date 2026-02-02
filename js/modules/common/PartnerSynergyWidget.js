/**
 * PartnerSynergyWidget.js
 * 🔗 Widget visual del Radar de Sinergias
 * Componente reutilizable para mostrar sugerencias de parejas
 */

(function () {
    'use strict';

    class PartnerSynergyWidget {
        constructor() {
            this.service = window.PartnerSynergyService;
        }

        /**
         * Renderiza el widget completo de sinergias
         * @param {string} playerId - ID del jugador
         * @param {string} containerId - ID del contenedor donde renderizar
         * @param {Object} options - Opciones de configuración
         */
        async render(playerId, containerId, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('Container not found:', containerId);
                return;
            }

            const {
                title = '🔗 RADAR DE SINERGIAS',
                subtitle = 'Tus mejores parejas potenciales',
                limit = 5,
                showDetails = true,
                compact = false
            } = options;

            // Mostrar loading
            container.innerHTML = this.renderLoading();

            try {
                const bestPartners = await this.service.getBestPartnersFor(playerId, limit);

                if (bestPartners.length === 0) {
                    container.innerHTML = this.renderEmpty();
                    return;
                }

                container.innerHTML = compact
                    ? this.renderCompact(bestPartners, title, subtitle)
                    : this.renderFull(bestPartners, title, subtitle, showDetails);

            } catch (error) {
                console.error('Error rendering synergy widget:', error);
                container.innerHTML = this.renderError();
            }
        }

        /**
         * Renderiza versión completa del widget
         */
        renderFull(partners, title, subtitle, showDetails) {
            return `
                <div class="synergy-widget-full" style="
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-radius: 20px;
                    padding: 24px;
                    border: 2px solid rgba(204,255,0,0.2);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <!-- Header -->
                    <div style="margin-bottom: 20px; text-align: center;">
                        <h3 style="
                            margin: 0 0 8px 0;
                            color: #CCFF00;
                            font-weight: 900;
                            font-size: 1.3rem;
                            letter-spacing: 0.5px;
                            text-shadow: 0 0 20px rgba(204,255,0,0.3);
                        ">${title}</h3>
                        <p style="
                            margin: 0;
                            color: rgba(255,255,255,0.6);
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">${subtitle}</p>
                    </div>

                    <!-- Partners List -->
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        ${partners.map((p, index) => this.renderPartnerCard(p, index, showDetails)).join('')}
                    </div>

                    <!-- Info Footer -->
                    <div style="
                        margin-top: 20px;
                        padding: 12px;
                        background: rgba(204,255,0,0.1);
                        border-radius: 12px;
                        border: 1px solid rgba(204,255,0,0.2);
                        text-align: center;
                    ">
                        <p style="
                            margin: 0;
                            color: rgba(255,255,255,0.7);
                            font-size: 0.75rem;
                            line-height: 1.5;
                        ">
                            <i class="fas fa-info-circle" style="color: #CCFF00;"></i>
                            El Radar analiza nivel, química histórica, estilo de juego y actividad
                        </p>
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza versión compacta del widget
         */
        renderCompact(partners, title, subtitle) {
            return `
                <div class="synergy-widget-compact" style="
                    background: rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid rgba(255,255,255,0.1);
                ">
                    <div style="margin-bottom: 12px;">
                        <div style="
                            color: #CCFF00;
                            font-weight: 800;
                            font-size: 0.9rem;
                            margin-bottom: 4px;
                        ">${title}</div>
                        <div style="
                            color: rgba(255,255,255,0.5);
                            font-size: 0.7rem;
                        ">${subtitle}</div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${partners.slice(0, 3).map((p, index) => this.renderPartnerCompact(p, index)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza tarjeta individual de pareja (versión completa)
         */
        renderPartnerCard(partner, index, showDetails) {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            return `
                <div class="partner-card" style="
                    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid rgba(255,255,255,0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                " onclick="window.Router && window.Router.navigate('player', '${partner.player.uid || partner.player.id}')">
                    
                    <!-- Header Row -->
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <!-- Medal/Rank -->
                        <div style="
                            font-size: 1.5rem;
                            min-width: 40px;
                            text-align: center;
                        ">${medal}</div>

                        <!-- Player Info -->
                        <div style="flex: 1;">
                            <div style="
                                color: white;
                                font-weight: 800;
                                font-size: 1rem;
                                margin-bottom: 4px;
                            ">${partner.player.name}</div>
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                flex-wrap: wrap;
                            ">
                                <span style="
                                    background: rgba(204,255,0,0.2);
                                    color: #CCFF00;
                                    padding: 2px 8px;
                                    border-radius: 6px;
                                    font-size: 0.7rem;
                                    font-weight: 700;
                                ">Nivel ${partner.levelCompatibility.level2}</span>
                                ${partner.sharedMatches > 0 ? `
                                    <span style="
                                        background: rgba(59,130,246,0.2);
                                        color: #60a5fa;
                                        padding: 2px 8px;
                                        border-radius: 6px;
                                        font-size: 0.7rem;
                                        font-weight: 700;
                                    ">${partner.sharedMatches} partidos juntos</span>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Score Badge -->
                        <div style="
                            background: ${partner.rating.color};
                            color: white;
                            padding: 8px 12px;
                            border-radius: 12px;
                            font-weight: 900;
                            font-size: 1.1rem;
                            box-shadow: 0 4px 12px ${partner.rating.color}40;
                        ">${Math.round(partner.totalScore)}</div>
                    </div>

                    <!-- Rating -->
                    <div style="
                        background: rgba(0,0,0,0.3);
                        padding: 8px 12px;
                        border-radius: 10px;
                        margin-bottom: ${showDetails ? '12px' : '0'};
                        text-align: center;
                    ">
                        <div style="
                            color: ${partner.rating.color};
                            font-weight: 800;
                            font-size: 0.85rem;
                        ">${partner.rating.label}</div>
                    </div>

                    ${showDetails ? `
                        <!-- Details Grid -->
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 8px;
                            margin-bottom: 12px;
                        ">
                            ${this.renderMetric('Nivel', partner.levelCompatibility.label, partner.levelCompatibility.color)}
                            ${this.renderMetric('Química', partner.playChemistry.label, partner.playChemistry.color)}
                            ${this.renderMetric('Estilo', partner.styleCompatibility.label, partner.styleCompatibility.color)}
                            ${this.renderMetric('Actividad', partner.activityAlignment.label, partner.activityAlignment.color)}
                        </div>

                        <!-- Recommendation -->
                        <div style="
                            background: rgba(204,255,0,0.1);
                            padding: 10px;
                            border-radius: 8px;
                            border-left: 3px solid #CCFF00;
                        ">
                            <p style="
                                margin: 0;
                                color: rgba(255,255,255,0.8);
                                font-size: 0.75rem;
                                line-height: 1.4;
                            ">
                                <i class="fas fa-lightbulb" style="color: #CCFF00; margin-right: 4px;"></i>
                                ${partner.recommendation}
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Renderiza tarjeta compacta de pareja
         */
        renderPartnerCompact(partner, index) {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

            return `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                " onclick="window.Router && window.Router.navigate('player', '${partner.player.uid || partner.player.id}')">
                    <div style="font-size: 1.2rem;">${medal}</div>
                    <div style="flex: 1;">
                        <div style="
                            color: white;
                            font-weight: 700;
                            font-size: 0.85rem;
                        ">${partner.player.name}</div>
                        <div style="
                            color: rgba(255,255,255,0.5);
                            font-size: 0.7rem;
                        ">Nivel ${partner.levelCompatibility.level2}</div>
                    </div>
                    <div style="
                        background: ${partner.rating.color};
                        color: white;
                        padding: 4px 8px;
                        border-radius: 8px;
                        font-weight: 800;
                        font-size: 0.8rem;
                    ">${Math.round(partner.totalScore)}</div>
                </div>
            `;
        }

        /**
         * Renderiza métrica individual
         */
        renderMetric(title, value, color) {
            return `
                <div style="
                    background: rgba(0,0,0,0.2);
                    padding: 8px;
                    border-radius: 8px;
                    text-align: center;
                ">
                    <div style="
                        color: rgba(255,255,255,0.5);
                        font-size: 0.65rem;
                        font-weight: 600;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                    ">${title}</div>
                    <div style="
                        color: ${color};
                        font-size: 0.7rem;
                        font-weight: 800;
                    ">${value}</div>
                </div>
            `;
        }

        /**
         * Renderiza estado de carga
         */
        renderLoading() {
            return `
                <div style="
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(255,255,255,0.5);
                ">
                    <div class="loader" style="margin: 0 auto 15px;"></div>
                    <div style="font-size: 0.85rem; font-weight: 600;">
                        Analizando compatibilidades...
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza estado vacío
         */
        renderEmpty() {
            return `
                <div style="
                    text-align: center;
                    padding: 50px 20px;
                    background: #111;
                    border-radius: 24px;
                    border: 1px solid rgba(204,255,0,0.1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                ">
                    <!-- Tech Radar Animation -->
                    <div style="
                        position: absolute; top: 0; left: 0; width: 200%; height: 2px;
                        background: linear-gradient(90deg, transparent, #CCFF00, transparent);
                        animation: scannerMove 4s linear infinite;
                        opacity: 0.3;
                    "></div>
                    
                    <i class="fas fa-radar fa-spin" style="
                        font-size: 3.5rem;
                        color: #CCFF00;
                        margin-bottom: 20px;
                        opacity: 0.2;
                        display: block;
                    "></i>
                    
                    <div style="
                        color: white;
                        font-size: 1.1rem;
                        font-weight: 950;
                        letter-spacing: -0.5px;
                        text-transform: uppercase;
                    ">RADAR DE COMPATIBILIDAD <span style="color:#CCFF00;">EN ESPERA</span></div>
                    
                    <div style="
                        color: rgba(255,255,255,0.4);
                        font-size: 0.8rem;
                        margin-top: 10px;
                        font-weight: 600;
                        max-width: 240px;
                        margin: 10px auto 0;
                    ">Necesitamos más datos de nivel y victorias para calcular tu pareja perfecta.</div>

                    <style>
                        @keyframes scannerMove {
                            0% { transform: translateY(-50px); opacity: 0; }
                            50% { opacity: 0.5; }
                            100% { transform: translateY(200px); opacity: 0; }
                        }
                    </style>
                </div>
            `;
        }

        /**
         * Renderiza estado de error
         */
        renderError() {
            return `
                <div style="
                    text-align: center;
                    padding: 40px 20px;
                    background: rgba(239,68,68,0.1);
                    border-radius: 16px;
                    border: 1px solid rgba(239,68,68,0.3);
                ">
                    <i class="fas fa-exclamation-triangle" style="
                        font-size: 2.5rem;
                        color: #ef4444;
                        margin-bottom: 15px;
                        display: block;
                    "></i>
                    <div style="
                        color: #ef4444;
                        font-size: 0.9rem;
                        font-weight: 600;
                    ">Error al cargar el Radar de Sinergias</div>
                </div>
            `;
        }
    }

    // Exportar globalmente
    window.PartnerSynergyWidget = new PartnerSynergyWidget();
    console.log('🎨 Partner Synergy Widget loaded');
})();

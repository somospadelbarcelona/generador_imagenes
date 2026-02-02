/**
 * GamificationWidget.js
 * 🏆 Interfaz "Camino del Pro"
 * Visualiza el nivel y progreso del jugador con estética de alta gama.
 */
(function () {
    'use strict';

    class GamificationWidget {
        constructor() {
            this.service = window.GamificationService;
            this.containerId = 'gamification-root';
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            this.injectStyles();

            // Suscribirse solo si no lo estamos ya
            if (!this.isSubscribed) {
                this.service.onUpdate(() => this.updateUI());
                this.isSubscribed = true;
            }

            this.updateUI();
        }

        injectStyles() {
            if (document.getElementById('gamification-styles')) return;
            const style = document.createElement('style');
            style.id = 'gamification-styles';
            style.textContent = `
                @keyframes barGlow {
                    0% { box-shadow: 0 0 5px rgba(204, 255, 0, 0.4); }
                    100% { box-shadow: 0 0 15px rgba(204, 255, 0, 0.8); }
                }
                @keyframes iconShake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(10deg); }
                    75% { transform: rotate(-10deg); }
                }
                .pro-path-card {
                    background: linear-gradient(135deg, #111 0%, #000 100%);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 28px;
                    padding: 20px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                }
                .xp-bar-bg {
                    width: 100%; height: 12px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-top: 15px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .xp-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #CCFF00, #00E36D);
                    border-radius: 10px;
                    transition: width 1s cubic-bezier(0.19, 1, 0.22, 1);
                    animation: barGlow 2s infinite alternate;
                }
                .level-badge-v2 {
                    width: 54px; height: 54px;
                    background: #222;
                    border: 2.5px solid #CCFF00;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    box-shadow: 0 8px 20px rgba(204,255,0,0.2);
                    animation: iconShake 4s infinite ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }

        updateUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const level = this.service.getCurrentLevel();
            const progress = this.service.getProgress();
            const xp = this.service.state.xp;

            container.innerHTML = `
                <div class="pro-path-card">
                    <!-- BACKGROUND TEXTURE -->
                    <div style="position: absolute; right: -10px; bottom: -10px; font-size: 6rem; color: #CCFF00; opacity: 0.05; transform: rotate(-15deg); pointer-events: none;">
                        <i class="fas fa-trophy"></i>
                    </div>

                    <div style="display: flex; align-items: center; gap: 18px; position: relative; z-index: 2;">
                        <div class="level-badge-v2" style="border-color: ${level.color}">
                            ${level.icon}
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px;">
                                <div style="font-size: 0.65rem; color: #888; font-weight: 950; letter-spacing: 2px; text-transform: uppercase;">CAMINO DEL PRO</div>
                                <div style="font-size: 0.75rem; color: #fff; font-weight: 800; opacity: 0.6;">${xp} XP</div>
                            </div>
                            <h2 style="margin: 0; color: #fff; font-size: 1.4rem; font-weight: 950; letter-spacing: -0.5px;">
                                NIVEL: <span style="color: ${level.color}">${level.name}</span>
                            </h2>
                        </div>
                    </div>

                    <div class="xp-bar-bg">
                        <div class="xp-bar-fill" style="width: ${progress}%; background: ${level.color}"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-top: 12px;">
                        <span style="font-size: 0.6rem; color: rgba(255,255,255,0.3); font-weight: 900;">PRÓXIMO RANGO: ${level.next} XP</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="width: 5px; height: 5px; background: ${level.color}; border-radius: 50%;"></span>
                            <span style="font-size: 0.6rem; color: ${level.color}; font-weight: 950; letter-spacing: 1px;">MODO COMPETICIÓN ACTIVO</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.GamificationWidget = new GamificationWidget();
})();

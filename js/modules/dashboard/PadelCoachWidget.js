/**
 * PadelCoachWidget.js
 * 🎾 Pizarra Táctica SomosPadel Pro (MASTER V8 - NEON STEALTH)
 * Evolución definitiva: Dark Mode Premium, Dianas de Impacto y Táctica de Pareja.
 */
(function () {
    'use strict';

    class PadelCoachWidget {
        constructor() {
            this.containerId = 'padel-coach-root';
            this.tips = {
                'volea': {
                    title: 'LA VOLEA DE ATAQUE',
                    category: 'OFENSIVA',
                    trick: 'Mantén el codo bajo y la pala alta. Bloquea la bola y busca el rincón o los pies.',
                    importance: 'MAXIMA',
                    points: [[50, 44], [90, 10]],
                    partner: [30, 44], // Partner position
                    icon: 'fa-gauge-high'
                },
                'bandeja': {
                    title: 'BANDEJA TÁCTICA',
                    category: 'TRANSICIÓN',
                    trick: 'No busques la potencia. Busca profundidad y que la bola no rebote mucho en el cristal del rival.',
                    importance: 'ALTA',
                    points: [[75, 30], [90, 85]],
                    partner: [40, 40],
                    icon: 'fa-wind'
                },
                'remate': {
                    title: 'EL REMATE X3 / X4',
                    category: 'FINALIZACIÓN',
                    trick: 'Arquea la espalda y golpea en el punto más alto. El muñequazo es el secreto.',
                    importance: 'CRÍTICA',
                    points: [[85, 38], [98, 25]],
                    partner: [25, 38],
                    icon: 'fa-fire'
                },
                'pared': {
                    title: 'SALIDA DE CRISTAL',
                    category: 'DEFENSIVA',
                    trick: 'Acompaña la bola, no le pegues fuerte. Usa el rebote para ganar tiempo y tirar un globo.',
                    importance: 'VITAL',
                    points: [[50, 92], [50, 10]],
                    partner: [70, 92],
                    icon: 'fa-shield-halved'
                },
                'rincón': {
                    title: 'DEFENSA DE RINCÓN',
                    category: 'EXPERTO',
                    trick: 'Paciencia infinita. Deja que la bola salga de la pared antes de golpear.',
                    importance: 'ALTA',
                    points: [[90, 94], [50, 5]],
                    partner: [30, 94],
                    icon: 'fa-ghost'
                },
                'saque': {
                    title: 'SAQUE CON KICK',
                    category: 'INICIO',
                    trick: 'Bota la bola y busca el cristal lateral. El resto del rival será muy débil.',
                    importance: 'MEDIA',
                    points: [[35, 75], [90, 30]],
                    partner: [50, 55],
                    icon: 'fa-bolt'
                },
                'centro': {
                    title: 'TEORÍA DEL MEDIO',
                    category: 'ESTRATEGIA',
                    trick: 'Tirar al medio es la táctica más efectiva. Provoca falta de entendimiento rival.',
                    importance: 'EXTREMA',
                    points: [[50, 52], [50, 80]],
                    partner: [30, 52],
                    icon: 'fa-bullseye'
                },
                'globo': {
                    title: 'EL GLOBO PERFECTO',
                    category: 'DOMINIO',
                    trick: 'El golpe más importante. Debe ser alto y profundo para que ganes la red.',
                    importance: 'MÁXIMA',
                    points: [[15, 65], [90, 5]],
                    partner: [50, 90],
                    icon: 'fa-cloud-arrow-up'
                }
            };
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            this.injectStyles();

            container.innerHTML = `
                <div class="padel-coach-v8">
                    <!-- HEADER ELITE -->
                    <div class="v8-header">
                        <div class="v8-logo-shield">
                            <img src="img/logo_somospadel.png" alt="SP">
                        </div>
                        <div class="v8-header-text">
                            <h2 class="v8-title">COMUNIDAD SOMOSPADEL BCN</h2>
                            <div class="v8-subtitle"><span class="v8-pulse"></span> SIMULADOR TÁCTICO V8.0 Active</div>
                        </div>
                    </div>

                    <div class="v8-intro">
                        Domina la pista con nuestro simulador de alta precisión. Selecciona un <b>objetivo táctico</b> para analizar trayectorias y posicionamiento de pareja.
                    </div>

                    <!-- SIMULATOR CORE -->
                    <div class="v8-simulator-box">
                        <div class="v8-scanline"></div>
                        <div class="v8-simulator-inner">
                            <div class="v8-court">
                                <div class="v8-mesh"></div>
                                <div class="v8-line v8-net"></div>
                                <div class="v8-line v8-s-top"></div>
                                <div class="v8-line v8-s-bot"></div>
                                <div class="v8-line v8-mid"></div>

                                <!-- SVG TACTICAL LAYER -->
                                <svg class="v8-svg" id="v8-svg-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path id="v8-path" d="" fill="none" stroke="#CCFF00" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.6" />
                                    <circle id="v8-ball" r="1.5" fill="#CCFF00" style="display:none; filter: drop-shadow(0 0 5px #CCFF00);" />
                                    <circle id="v8-target" r="3" fill="none" stroke="#CCFF00" stroke-width="0.5" style="display:none; animation: targetPulse 1s infinite;" />
                                </svg>

                                <!-- PARTNER GHOST -->
                                <div id="v8-partner" class="v8-partner-ghost" style="display:none;">
                                    <i class="fas fa-user-shield"></i>
                                    <span>TU COMPAÑERO</span>
                                </div>

                                <!-- INTERACTIVE NODES -->
                                <div class="v8-nodes">
                                    <button class="v8-node node-green" data-tip="volea" style="top:44%; left:50%;">VOLEA</button>
                                    <button class="v8-node node-red" data-tip="remate" style="top:38%; right:10%;">REMATE</button>
                                    <button class="v8-node node-yellow" data-tip="bandeja" style="top:30%; right:25%;">BANDEJA</button>
                                    <button class="v8-node node-cyan" data-tip="globo" style="top:65%; left:15%;">GLOBO</button>
                                    <button class="v8-node node-white" data-tip="centro" style="top:52%; left:50%;">EL MEDIO</button>
                                    <button class="v8-node node-blue" data-tip="pared" style="bottom:8%; left:50%;">CRISTAL</button>
                                    <button class="v8-node node-orange" data-tip="rincón" style="bottom:6%; right:10%;">RINCÓN</button>
                                    <button class="v8-node node-purple" data-tip="saque" style="bottom:25%; left:35%;">SAQUE</button>
                                </div>
                            </div>
                        </div>
                        <div class="v8-hint">
                            <i class="fas fa-microchip"></i> SOMOSPADEL BCN // CRYPTO_SECURED
                        </div>
                    </div>

                    <!-- ANALYSIS PANEL -->
                    <div id="v8-panel" class="v8-panel-idle">
                        <div class="v8-idle-content">
                            <i class="fas fa-radar fa-spin-slow"></i>
                            <span>ESPERANDO SELECCIÓN TÁCTICA...</span>
                        </div>
                    </div>
                </div>
            `;

            container.querySelectorAll('.v8-node').forEach(btn => {
                btn.onclick = (e) => this.showTip(e.target.dataset.tip);
            });
        }

        injectStyles() {
            if (document.getElementById('v8-tactical-styles')) return;
            const style = document.createElement('style');
            style.id = 'v8-tactical-styles';
            style.textContent = `
                .padel-coach-v8 {
                    background: #0f172a; /* Dark Navy Premium */
                    border-radius: 42px; padding: 35px;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                    font-family: 'Outfit', sans-serif; position: relative; overflow: hidden;
                }
                .v8-header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; }
                .v8-logo-shield {
                    width: 60px; height: 60px; background: #000; border-radius: 20px;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid #CCFF00; box-shadow: 0 0 20px rgba(204,255,0,0.2);
                }
                .v8-logo-shield img { height: 35px; }
                .v8-title { margin: 0; color: #fff; font-size: 1.4rem; font-weight: 1000; letter-spacing: -0.5px; }
                .v8-subtitle { margin-top:5px; color: rgba(255,255,255,0.4); font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; display:flex; align-items:center; gap:6px; }
                .v8-pulse { width:6px; height:6px; background:#CCFF00; border-radius:50%; box-shadow:0 0 10px #CCFF00; animation: v8blink 1.5s infinite; }
                @keyframes v8blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

                .v8-intro { padding: 0 5px 25px; color: rgba(255,255,255,0.6); font-size: 0.9rem; line-height: 1.6; font-weight: 500; }

                .v8-simulator-box {
                    background: #000; border-radius: 35px; padding: 25px; position: relative; margin-bottom: 25px;
                    border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
                }
                .v8-scanline {
                    position: absolute; top: 0; left: 0; width: 100%; height: 2px;
                    background: linear-gradient(90deg, transparent, #CCFF0030, transparent);
                    animation: v8scan 4s linear infinite; z-index: 10;
                }
                @keyframes v8scan { 0% { top: 0; } 100% { top: 100%; } }

                .v8-simulator-inner { width: 100%; height: 440px; border-radius: 12px; position: relative; overflow: hidden; }
                .v8-court { width: 100%; height: 100%; background: #111e42; border: 3px solid #fff; position: relative; }
                .v8-mesh { position: absolute; inset: 0; opacity: 0.05; background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 20px 20px; }
                .v8-line { position: absolute; background: #fff; z-index: 2; opacity: 0.8; }
                .v8-net { left: 0; top: 50%; width: 100%; height: 4px; background: rgba(255,255,255,0.3); }
                .v8-s-top { top: 20%; width: 100%; height: 2px; }
                .v8-s-bot { bottom: 20%; width: 100%; height: 2px; }
                .v8-mid { left: 50%; top: 0; width: 2px; height: 100%; }

                .v8-svg { position: absolute; inset: 0; z-index: 5; width: 100%; height: 100%; pointer-events: none; }
                @keyframes targetPulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

                .v8-partner-ghost {
                    position: absolute; transform: translate(-50%, -50%); z-index: 15;
                    background: rgba(14, 165, 233, 0.2); border: 1px solid #0ea5e9;
                    border-radius: 50px; padding: 5px 12px; display: flex; align-items: center; gap: 8px;
                    animation: partnerAppear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes partnerAppear { from { opacity: 0; transform: translate(-50%, -20%); } to { opacity: 1; transform: translate(-50%, -50%); } }
                .v8-partner-ghost i { color: #0ea5e9; font-size: 0.8rem; }
                .v8-partner-ghost span { color: #0ea5e9; font-size: 0.55rem; font-weight: 1000; letter-spacing: 0.5px; }

                .v8-node {
                    position: absolute; transform: translate(-50%, -50%); z-index: 20; border: none; border-radius: 100px;
                    padding: 8px 18px; font-weight: 950; font-size: 0.7rem; cursor: pointer; transition: all 0.3s;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.4);
                }
                .v8-node:hover { transform: translate(-50%, -50%) scale(1.1); filter: brightness(1.2); }
                .node-green { background: #CCFF00; color: #000; }
                .node-red { background: #ef4444; color: #fff; }
                .node-yellow { background: #facc15; color: #000; }
                .node-cyan { background: #06b6d4; color: #fff; }
                .node-white { background: #fff; color: #000; border: 2px solid #CCFF00; }
                .node-blue { background: #3b82f6; color: #fff; }
                .node-orange { background: #f97316; color: #fff; }
                .node-purple { background: #a855f7; color: #fff; }

                .v8-panel-idle { background: rgba(255,255,255,0.03); border: 2px dashed rgba(255,255,255,0.1); border-radius: 30px; padding: 30px; text-align: center; }
                .v8-idle-content { color: rgba(255,255,255,0.2); font-size: 0.8rem; font-weight: 900; display: flex; flex-direction: column; gap: 10px; }
                .fa-spin-slow { animation: fa-spin 5s linear infinite; font-size: 2rem; }

                .v8-panel-active {
                    background: #000; border: 2px solid #CCFF00; border-radius: 30px; padding: 25px;
                    animation: v8Rise 0.4s both; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                @keyframes v8Rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .v8-hint { margin-top: 15px; text-align: center; color: rgba(255,255,255,0.2); font-size: 0.65rem; font-weight: 900; letter-spacing: 1px; }
            `;
            document.head.appendChild(style);
        }

        showTip(zoneKey) {
            const tip = this.tips[zoneKey];
            if (!tip) return;

            const display = document.getElementById('v8-panel');
            if (display) {
                display.className = 'v8-panel-active';
                display.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                        <div style="display:flex; align-items:center; gap:15px;">
                            <div style="width:50px; height:50px; background:#CCFF00; border-radius:15px; display:flex; align-items:center; justify-content:center; color:#000; font-size:1.4rem;">
                                <i class="fas ${tip.icon}"></i>
                            </div>
                            <div>
                                <span style="font-size:0.55rem; color:#CCFF00; border:1px solid #CCFF00; padding:2px 6px; border-radius:4px; font-weight:950;">${tip.category}</span>
                                <h4 style="margin:5px 0 0; font-size:1.2rem; font-weight:1000; color:#fff;">${tip.title}</h4>
                            </div>
                        </div>
                        <div style="background:#CCFF00; color:#000; font-size:0.55rem; font-weight:1000; padding:4px 8px; border-radius:6px;">${tip.importance}</div>
                    </div>
                    <p style="margin:0; color:rgba(255,255,255,0.8); font-size:0.95rem; line-height:1.6; font-weight:500;">
                        ${tip.trick}
                    </p>
                    <div style="margin-top:15px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1); display:flex; gap:15px;">
                        <div style="font-size:0.65rem; color:#CCFF00; font-weight:900;"><i class="fas fa-microchip"></i> SOMOSPADEL BCN</div>
                        <div style="font-size:0.65rem; color:rgba(255,255,255,0.4); font-weight:900;">TÁCTICA_SYNC_OK</div>
                    </div>
                `;
            }

            this.drawTrajectory(tip.points, tip.partner);
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
        }

        drawTrajectory(points, partnerPos) {
            const ballPath = document.getElementById('v8-path');
            const ball = document.getElementById('v8-ball');
            const target = document.getElementById('v8-target');
            const partner = document.getElementById('v8-partner');
            if (!ballPath || !ball || !target || !partner) return;

            const [start, end] = points;
            const controlX = (start[0] + end[0]) / 2;
            const controlY = Math.min(start[1], end[1]) - 15;

            const pathData = `M ${start[0]} ${start[1]} Q ${controlX} ${controlY} ${end[0]} ${end[1]}`;
            ballPath.setAttribute('d', pathData);

            // Partner Placement
            partner.style.display = "flex";
            partner.style.left = `${partnerPos[0]}%`;
            partner.style.top = `${partnerPos[1]}%`;

            // Reset Animation
            ballPath.style.strokeDashoffset = "200";
            ballPath.style.transition = "none";
            void ballPath.offsetWidth;
            ballPath.style.transition = "stroke-dashoffset 0.8s ease-out";
            ballPath.style.strokeDasharray = "200";
            ballPath.style.strokeDashoffset = "0";

            // Ball and Target Logic
            ball.style.display = "block";
            target.style.display = "none";

            let startT = null;
            const duration = 800;
            const step = (now) => {
                if (!startT) startT = now;
                const progress = Math.min((now - startT) / duration, 1);
                const invT = 1 - progress;
                const x = invT * invT * start[0] + 2 * invT * progress * controlX + progress * progress * end[0];
                const y = invT * invT * start[1] + 2 * invT * progress * controlY + progress * progress * end[1];

                ball.setAttribute('cx', x);
                ball.setAttribute('cy', y);

                if (progress < 1) requestAnimationFrame(step);
                else {
                    target.setAttribute('cx', end[0]);
                    target.setAttribute('cy', end[1]);
                    target.style.display = "block";
                    setTimeout(() => {
                        ball.style.display = "none";
                        // Keep target and partner for a bit
                    }, 2000);
                }
            };
            requestAnimationFrame(step);
        }
    }

    window.PadelCoachWidget = new PadelCoachWidget();
})();

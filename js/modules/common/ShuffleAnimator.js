/**
 * ShuffleAnimator.js
 * handles ultra-high-impact animations for draw/shuffle events.
 * Version: 3.0 Cinema Edition (Professional Tournament Style)
 */
(function () {
    'use strict';

    class ShuffleAnimator {
        constructor() {
            this.isAnimating = false;
        }

        animate(data, onComplete) {
            if (this.isAnimating) return;
            this.isAnimating = true;

            const overlay = document.createElement('div');
            overlay.id = 'shuffle-animator-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; background: radial-gradient(circle at center, #0a192f 0%, #000 100%); z-index: 999999;
                display: flex; flex-direction: column; align-items: center;
                font-family: 'Outfit', sans-serif; color: white; 
                overflow-x: hidden; overflow-y: auto; padding: 40px 0 120px;
                opacity: 0; transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
            `;

            overlay.innerHTML = `
                <!-- SKY BEAMS AND VORTEX EFFECTS -->
                <div class="sky-beam beam-1"></div>
                <div class="sky-beam beam-2"></div>
                <div class="vortex-container"></div>
                
                <div id="shuffle-header" style="text-align: center; margin-bottom: 60px; z-index: 10; animation: tvHeaderEntry 1.5s both cubic-bezier(0.19, 1, 0.22, 1); flex-shrink: 0; position: relative;">
                    <div class="tv-live-badge">🔴 EN VIVO</div>
                    <h1 style="font-size: 3.5rem; font-weight: 1000; margin: 0; text-transform: uppercase; letter-spacing: -3px; line-height: 0.85;">
                        <span style="color: #fff;">SORTEO</span><br>
                        <span style="background: linear-gradient(90deg, #00C4FF, #CCFF00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 20px rgba(0,196,255,0.4));">RONDA ${data.round}</span>
                    </h1>
                    <div class="tv-sub-stats">
                        <span style="color: #CCFF00;">SOMOSPADEL BCN</span> • <span style="color: #fff;">COMPITE Y DISFRUTA</span>
                    </div>
                </div>

                <div id="shuffle-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; width: 98%; max-width: 1600px; z-index: 10; flex: 1; perspective: 1000px;">
                    <!-- Court slots populated via JS -->
                </div>

                <canvas id="shuffle-canvas" style="position: fixed; inset: 0; z-index: 1; opacity: 0.6; pointer-events: none;"></canvas>

                <!-- BOTTOM TV GRAPHIC (SCOREBOARD STYLE) -->
                <div class="tv-bottom-bar">
                    <div class="tv-bar-content">
                        <div class="tv-logo-mini">Σ</div>
                        <div class="tv-ticker">
                            <div class="ticker-text" id="shuffle-status-marquee">PREPARANDO PISTAS AZULES • CALCULANDO CRUCES POR NIVEL • SINCRONIZANDO RANKING GLOBAL • SOMOSPADEL BCN LIVE • </div>
                        </div>
                        <div class="tv-clock" id="shuffle-timer">00:00</div>
                    </div>
                </div>

                <button id="close-shuffle" class="tv-close-btn">
                    <i class="fas fa-times"></i>
                </button>

                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..950&display=swap');
                    
                    @keyframes tvHeaderEntry { from { opacity: 0; transform: translateY(-40px) scale(0.9); filter: blur(20px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
                    
                    .tv-live-badge {
                        background: #ff0000; color: white; padding: 4px 16px; border-radius: 4px; font-weight: 950; font-size: 0.7rem; 
                        display: inline-block; margin-bottom: 15px; letter-spacing: 2px; box-shadow: 0 0 20px rgba(255,0,0,0.4);
                        animation: tvPulse 1.5s infinite;
                    }
                    @keyframes tvPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

                    .tv-sub-stats {
                        color: rgba(255,255,255,0.5); font-size: 0.65rem; font-weight: 900; letter-spacing: 3px; margin-top: 20px;
                    }

                    .court-slot {
                        width: 380px; height: 520px; position: relative; border-radius: 12px;
                        transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
                        transform: rotateY(30deg) translateZ(-100px); opacity: 0;
                        background: #111; border: 1px solid rgba(255,255,255,0.1);
                        box-shadow: 0 50px 100px rgba(0,0,0,0.9);
                        display: flex; flex-direction: column; overflow: hidden;
                    }
                    .court-slot.visible { transform: rotateY(0) translateZ(0); opacity: 1; }
                    
                    /* THE PADEL COURT VISUAL */
                    .padel-court-floor {
                        height: 180px; width: 100%; position: relative;
                        background: linear-gradient(180deg, #0056b3 0%, #003366 100%);
                        border-bottom: 4px solid rgba(255,255,255,0.2);
                        display: flex; align-items: center; justify-content: center; overflow: hidden;
                    }
                    .court-lines {
                        position: absolute; inset: 15px; border: 2px solid rgba(255,255,255,0.3);
                    }
                    .court-net {
                        position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: rgba(255,255,255,0.5);
                    }
                    .pista-name-overlay {
                        position: absolute; color: rgba(255,255,255,0.8); font-weight: 1000; font-size: 2.5rem; letter-spacing: -2px;
                        z-index: 2; transform: skewX(-10deg); text-shadow: 0 10px 20px rgba(0,0,0,0.5);
                    }
                    .tv-court-badge {
                        position: absolute; top: 15px; right: 15px; background: #CCFF00; color: #000; padding: 4px 10px; border-radius: 4px; font-weight: 1000; font-size: 0.6rem;
                    }

                    .players-section { flex: 1; padding: 25px; display: flex; flex-direction: column; justify-content: space-between; background: #080808; }

                    .slot-name { 
                        height: 52px; position: relative; border-radius: 8px; margin: 4px 0; 
                        background: rgba(255,255,255,0.03); border-left: 4px solid #00C4FF;
                        overflow: hidden; display: flex; align-items: center; padding: 0 15px;
                    }
                    .slot-name.revealed { background: linear-gradient(90deg, rgba(0,196,255,0.1), transparent); border-left-color: #CCFF00; }
                    .slot-name.opponent { border-left-color: #FF2D55; }

                    .scrolling-names {
                        color: rgba(0, 196, 255, 0.4); font-weight: 1000; font-size: 0.75rem;
                        animation: tvNameScroll 1s infinite linear;
                    }
                    @keyframes tvNameScroll { 0% { opacity: 0.2; transform: translateY(100%); } 50% { opacity: 0.5; } 100% { opacity: 0.2; transform: translateY(-100%); } }
                    
                    .winner-name { 
                        color: #fff; font-size: 1.1rem; font-weight: 1000; letter-spacing: 0.5px;
                        animation: tvWinnerReveal 0.8s both cubic-bezier(0.19, 1, 0.22, 1);
                    }
                    @keyframes tvWinnerReveal {
                        0% { transform: skewX(20deg) translateX(-20px); opacity: 0; filter: brightness(3); }
                        100% { transform: skewX(0) translateX(0); opacity: 1; filter: brightness(1); }
                    }

                    .vs-ribbon {
                        background: #CCFF00; color: #000; font-weight: 1000; font-size: 0.6rem; 
                        padding: 2px 10px; align-self: center; transform: rotate(-2deg); margin: 5px 0;
                    }

                    /* TV HUD STYLES */
                    .tv-bottom-bar {
                        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                        width: 90%; max-width: 1000px; height: 60px; background: #111;
                        border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; z-index: 1000;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                    }
                    .tv-bar-content { display: flex; height: 100%; align-items: center; }
                    .tv-logo-mini { width: 60px; background: #CCFF00; color: #000; display: flex; align-items: center; justify-content: center; font-weight: 1000; font-size: 1.5rem; }
                    .tv-ticker { flex: 1; padding: 0 20px; overflow: hidden; }
                    .ticker-text { white-space: nowrap; font-weight: 900; font-size: 0.8rem; color: #fff; letter-spacing: 1px; animation: tvTicker 15s linear infinite; }
                    @keyframes tvTicker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    .tv-clock { width: 100px; background: #222; height: 100%; display: flex; align-items: center; justify: center; font-weight: 1000; border-left: 1px solid rgba(255,255,255,0.1); }

                    .tv-close-btn { 
                        position: fixed; top: 30px; right: 30px; width: 60px; height: 60px; background: #CCFF00; border: none; 
                        border-radius: 12px; cursor: pointer; display: none; z-index: 2000; color: #000; font-size: 1.5rem;
                        box-shadow: 0 10px 30px rgba(204,255,0,0.3); transition: all 0.3s;
                    }
                    .tv-close-btn:hover { transform: scale(1.1) rotate(90deg); }

                    /* LIGHT ANIMATIONS */
                    .sky-beam { position: fixed; width: 2px; height: 150%; background: linear-gradient(to top, transparent, rgba(0,196,255,0.3), transparent); top: -25%; z-index: 0; }
                    .beam-1 { left: 20%; transform: rotate(15deg); }
                    .beam-2 { right: 20%; transform: rotate(-15deg); }
                </style>
            `;

            document.body.appendChild(overlay);
            setTimeout(() => overlay.style.opacity = '1', 10);

            this.initCanvas();
            this.startTimer();

            const container = document.getElementById('shuffle-container');
            const maxMatchCourt = data.matches ? Math.max(0, ...data.matches.map(m => parseInt(m.court || m.pista || 0))) : 0;
            const numCourts = Math.max(data.courts || 4, maxMatchCourt);

            for (let i = 1; i <= numCourts; i++) {
                const slot = document.createElement('div');
                slot.className = 'court-slot';
                slot.innerHTML = `
                    <div class="padel-court-floor">
                        <div class="court-lines"></div>
                        <div class="court-net"></div>
                        <div class="tv-court-badge">SOC LIVE</div>
                        <div class="pista-name-overlay">PISTA ${i}</div>
                    </div>
                    <div class="players-section">
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div class="slot-name" id="slot-${i}-p1"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                            <div class="slot-name" id="slot-${i}-p2"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                        </div>
                        <div class="vs-ribbon">VERSUS</div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div class="slot-name opponent" id="slot-${i}-p3"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                            <div class="slot-name opponent" id="slot-${i}-p4"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                        </div>
                    </div>
                `;
                container.appendChild(slot);
                setTimeout(() => slot.classList.add('visible'), i * 150);
            }

            // Uniform experience or slightly faster but not instant
            const isFirstRound = parseInt(data.round) === 1;
            const shuffleDuration = isFirstRound ? 6000 : 4000; // Increased from 2000 for visibility

            setTimeout(() => this.revealResults(data, overlay, onComplete), shuffleDuration);

            const closeBtn = document.querySelector('.tv-close-btn');
            closeBtn.onclick = () => this.finishAnimation(overlay, onComplete);
            setTimeout(() => { closeBtn.style.display = 'block'; }, 2000);
        }

        revealResults(data, overlay, onComplete) {
            const matches = data.matches || [];
            if (matches.length === 0) return this.finishAnimation(overlay, onComplete);

            const marquee = document.getElementById('shuffle-status-marquee');
            if (marquee) marquee.innerText = "SORTEO COMPLETADO • RESULTADOS PUBLICADOS • TODOS A PISTAS • REGLAMENTO SOMOSPADEL ACTIVADO • ";

            const isFirstRound = parseInt(data.round) === 1;
            const matchDelay = isFirstRound ? 1200 : 800;
            const playerDelay = isFirstRound ? 500 : 250;

            const revealedCourts = new Set();

            matches.forEach((m, idx) => {
                // Robust parsing for court ID (handles strings like "PISTA 2" or numbers)
                let val = parseInt(String(m.court || m.pista || '').replace(/\D/g, ''));
                if (isNaN(val)) val = idx + 1;
                const c = val;
                revealedCourts.add(c);

                let pNames = this.extractNamesFromMatch(m);

                setTimeout(() => {
                    for (let i = 1; i <= 4; i++) {
                        setTimeout(() => {
                            const slotId = `slot-${c}-p${i}`;
                            const el = document.getElementById(slotId);
                            if (el) {
                                el.classList.add('revealed');
                                const nameToDisplay = (pNames[i - 1] || 'JUGADOR').toUpperCase();
                                el.innerHTML = `<div class="winner-name">${nameToDisplay}</div>`;
                            }
                        }, i * playerDelay);
                    }
                }, idx * matchDelay);
            });

            const totalRevealTime = (matches.length * matchDelay) + (4 * playerDelay);

            // SWEEPER: Clean up any courts that didn't get a match.
            // Increased safety buffer to 2000ms to ensure it never preempts a valid reveal.
            setTimeout(() => {
                const slots = document.querySelectorAll('.court-slot');
                slots.forEach((slot, index) => {
                    // Robust ID inference
                    const pisteOverlay = slot.querySelector('.pista-name-overlay');
                    let pisteNum = index + 1; // Default
                    if (pisteOverlay) {
                        const txt = pisteOverlay.innerText.replace(/\D/g, '');
                        if (txt) pisteNum = parseInt(txt);
                    }

                    if (!revealedCourts.has(pisteNum)) {
                        const nameSlots = slot.querySelectorAll('.slot-name:not(.revealed)');
                        nameSlots.forEach(ns => {
                            ns.classList.add('revealed');
                            ns.style.background = 'rgba(255,255,255,0.05)';
                            ns.innerHTML = '<div class="winner-name" style="color: #666; font-size: 0.8rem; letter-spacing: 1px;">DISPONIBLE</div>';
                        });
                        const ribbon = slot.querySelector('.vs-ribbon');
                        if (ribbon) ribbon.style.opacity = '0';
                    }
                });
            }, totalRevealTime + 2000);

            // TOTAL DURATION
            // increased buffer to allow reading
            setTimeout(() => {
                const btn = document.querySelector('.tv-close-btn');
                if (btn) btn.classList.add('pulse-attention'); // hypothetical class to draw attention

                setTimeout(() => {
                    // Auto-close if still open
                    if (document.getElementById('shuffle-animator-overlay')) this.finishAnimation(overlay, onComplete);
                }, 6000);
            }, totalRevealTime + 2500);
        }

        extractNamesFromMatch(m) {
            // Intentar extraer de múltiples formatos posibles para máxima compatibilidad entre rondas
            const teamA = [];
            const teamB = [];

            // 1. Array de objetos de jugador (Formato de MatchmakingService round 2+)
            if (Array.isArray(m.team_a)) teamA.push(...m.team_a.map(p => p.name || p.displayName || '---'));
            if (Array.isArray(m.team_b)) teamB.push(...m.team_b.map(p => p.name || p.displayName || '---'));

            // 2. Formato de String (Formato de MatchmakingService guardado: "Name 1 / Name 2")
            if (teamA.length === 0 && typeof m.team_a_names === 'string' && m.team_a_names.includes(' / ')) {
                teamA.push(...m.team_a_names.split(' / '));
            }
            if (teamB.length === 0 && typeof m.team_b_names === 'string' && m.team_b_names.includes(' / ')) {
                teamB.push(...m.team_b_names.split(' / '));
            }

            // 3. Array de nombres (Formato estándar)
            if (teamA.length === 0 && Array.isArray(m.team_a_names)) teamA.push(...m.team_a_names);
            if (teamB.length === 0 && Array.isArray(m.team_b_names)) teamB.push(...m.team_b_names);

            // 4. Fallback: Campos individuales player1, player2...
            if (teamA.length === 0) {
                if (m.player1_name) teamA.push(m.player1_name);
                if (m.p1_name) teamA.push(m.p1_name);
                if (m.player2_name) teamA.push(m.player2_name);
                if (m.p2_name) teamA.push(m.p2_name);
            }
            if (teamB.length === 0) {
                if (m.player3_name) teamB.push(m.player3_name);
                if (m.p3_name) teamB.push(m.p3_name);
                if (m.player4_name) teamB.push(m.player4_name);
                if (m.p4_name) teamB.push(m.p4_name);
            }

            // 5. Fallback: Nombres simples de equipo
            if (teamA.length === 0 && m.teamA) teamA.push(m.teamA);
            if (teamB.length === 0 && m.teamB) teamB.push(m.teamB);

            // Rellenar hasta 2 por equipo
            while (teamA.length < 2) teamA.push('---');
            while (teamB.length < 2) teamB.push('---');

            return [teamA[0], teamA[1], teamB[0], teamB[1]];
        }

        finishAnimation(overlay, onComplete) {
            if (!overlay || !overlay.parentNode) return;
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                this.isAnimating = false;
                if (onComplete) onComplete();
                if (this.timerInterval) clearInterval(this.timerInterval);
            }, 1000);
        }

        getRandomNamesText(players) {
            if (!players || players.length === 0) return "...";
            const names = players.map(p => (typeof p === 'string' ? p : (p.name || p.displayName || 'JUGADOR')).split(' ')[0]);
            let text = "";
            for (let i = 0; i < 20; i++) {
                text += `<div>${names[Math.floor(Math.random() * names.length)].toUpperCase()}</div>`;
            }
            return text;
        }

        startTimer() {
            let sec = 0;
            this.timerInterval = setInterval(() => {
                sec++;
                const m = Math.floor(sec / 60).toString().padStart(2, '0');
                const s = (sec % 60).toString().padStart(2, '0');
                const clock = document.getElementById('shuffle-timer');
                if (clock) clock.innerText = `${m}:${s}`;
            }, 1000);
        }

        initCanvas() {
            const canvas = document.getElementById('shuffle-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let w, h;
            const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
            window.addEventListener('resize', resize);
            resize();
            const particles = [];
            for (let i = 0; i < 100; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: -(Math.random() * 2 + 0.5), s: Math.random() * 2 + 1, o: Math.random() * 0.5 });
            const draw = () => {
                if (!document.getElementById('shuffle-canvas')) return;
                ctx.clearRect(0, 0, w, h);
                particles.forEach(p => {
                    p.y += p.vy; p.x += p.vx;
                    if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                    ctx.fillStyle = `rgba(0, 196, 255, ${p.o})`;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
                });
                requestAnimationFrame(draw);
            };
            draw();
        }
    }

    window.ShuffleAnimator = new ShuffleAnimator();
})();

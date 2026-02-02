/**
 * PlayerView.js
 * Premium SMART Profile View for SomosPadel
 * Updated: 2024 Design System with Glassmorphism and Advanced UX
 */
(function () {
    class PlayerView {
        render() {
            const container = document.getElementById('content-area');
            const user = window.Store.getState('currentUser');
            const data = window.Store.getState('playerStats') || {
                stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0 },
                recentMatches: [],
                badges: [],
                levelHistory: [],
                aiInsights: null,
                h2h: []
            };

            if (!container) return;
            if (!user) {
                container.innerHTML = `<div style="padding:100px; text-align:center; color:white;">
                    <i class="fas fa-spinner fa-spin"></i><br>Cargando sesión...
                </div>`;
                return;
            }

            container.innerHTML = `
                <div class="player-profile-wrapper fade-in" style="background: #000; min-height: 100vh; padding-bottom: 200px; font-family: 'Outfit', sans-serif; color: white;">
                    
                    <!-- Profile Header: Dynamic & Aesthetic -->
                    <div style="background: linear-gradient(180deg, #111 0%, #000 100%); padding: 60px 24px 40px; border-bottom: 1px solid #222; position: relative; overflow: hidden;">
                        <!-- Animated background elements -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%);"></div>
                        <div style="position: absolute; bottom: -50px; right: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);"></div>
                        
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 2;">
                            
                            <!-- Avatar Section: EXECUTIVE STYLE -->
                            <div style="position: relative; margin-bottom: 30px; display: flex; justify-content: center;">
                                <div style="
                                    width: 130px; 
                                    height: 130px; 
                                    border-radius: 40px; 
                                    background: linear-gradient(135deg, #CCFF00 0%, #00E36D 100%); 
                                    padding: 4px; 
                                    position: relative; 
                                    box-shadow: 0 0 30px rgba(204, 255, 0, 0.3);
                                ">
                                    <div style="
                                        width: 100%; 
                                        height: 100%; 
                                        border-radius: 36px; 
                                        background: url('${user.photo_url || user.photoURL || 'img/logo_somospadel.png'}') center/cover; 
                                        border: 4px solid #000;
                                        position: relative;
                                        overflow: hidden;
                                        background-color: #1a1a1a;
                                    ">
                                        ${!(user.photo_url || user.photoURL) ? `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-size:2.5rem; font-weight:900;">${user.name.substring(0, 1).toUpperCase()}</div>` : ''}
                                    </div>
                                    
                                    <!-- Verified Icon (Always on for Exec Admin) -->
                                    <div style="position: absolute; top: -5px; right: -5px; background: #CCFF00; color: #000; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; border: 4px solid #000; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                                        <i class="fas fa-check"></i>
                                    </div>

                                    <!-- Camera Icon -->
                                    <div onclick="window.PlayerView.showUpdatePhotoPrompt()" style="position: absolute; bottom: -5px; right: -5px; background: white; width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); cursor: pointer; border: 3px solid #000;">
                                        <i class="fas fa-camera" style="color: #000; font-size: 0.9rem;"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <h2 style="font-weight: 950; font-size: 1.8rem; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; color: #fff;">${user.name}</h2>
                            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                                <span style="background: rgba(204,255,0,0.1); color: #CCFF00; padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 950; border: 1px solid rgba(204,255,0,0.3);">NIVEL ${parseFloat(user.level || 3.5).toFixed(2)}</span>
                                <span style="background: rgba(255,255,255,0.05); color: #888; padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; border: 1px solid #333;">ID: ${(user.id || user.uid || 'U_649').toUpperCase()}</span>
                            </div>
                            
                            <div style="margin-top: 15px; background: linear-gradient(90deg, #CCFF00, #00E36D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 950; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; justify-content: center;">
                                <i class="fas fa-crown"></i> EXECUTIVE ADMIN
                            </div>

                            <!-- VIRAL SHARE BUTTON -->
                            <button onclick="window.PlayerView.shareProfileCard()" style="margin-top: 25px; background: rgba(204,255,0,0.1); border: 2px solid #CCFF00; color: #CCFF00; padding: 12px 25px; border-radius: 15px; font-weight: 950; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.3s;" onmouseover="this.style.background='#CCFF00'; this.style.color='#000';">
                                <i class="fas fa-id-card"></i> GENERAR FICHA PRO
                            </button>
                        </div>
                    </div>
                    <div style="padding: 30px 20px;">
                        
                        <!-- TACTICAL COACH: High-Tech Card -->
                        <div style="margin-bottom: 40px; background: linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(0,0,0,0) 100%); 
                                    border: 1px solid rgba(204,255,0,0.15); border-radius: 32px; padding: 25px; position: relative; overflow: hidden; 
                                    box-shadow: 0 15px 40px rgba(0,0,0,0.4);">
                            <div style="position: absolute; top: -10px; right: -10px; font-size: 6rem; opacity: 0.05; color: #CCFF00; pointer-events: none;"><i class="fas fa-brain"></i></div>
                            
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 36px; height: 36px; background: #CCFF00; color: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; box-shadow: 0 0 15px rgba(204,255,0,0.3);">
                                        <i class="fas fa-robot"></i>
                                    </div>
                                    <span style="font-weight: 950; font-size: 0.85rem; letter-spacing: 1px; color: #fff; text-transform: uppercase;">Capitán SomosPadel • Asistente Táctico</span>
                                </div>
                                <span style="font-size: 0.65rem; background: rgba(204,255,0,0.15); color: #CCFF00; padding: 5px 12px; border-radius: 20px; font-weight: 950; border: 1px solid rgba(204,255,0,0.3); letter-spacing: 0.5px;">
                                    ${data.smartInsights?.badge || 'ANALIZANDO...'}
                                </span>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <p style="font-size: 1.1rem; line-height: 1.5; font-weight: 700; color: #fff; margin: 0 0 15px; letter-spacing: -0.2px;">
                                    "${data.smartInsights?.summary || 'Sigue jugando para recibir consejos tácticos personalizados.'}"
                                </p>
                                
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 18px; margin-bottom: 15px;">
                                    <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-bullseye"></i> CONSEJO TÁCTICO PARA HOY:
                                    </div>
                                    <p style="font-size: 0.9rem; color: #eee; line-height: 1.6; margin: 0; font-weight: 500;">
                                        ${data.smartInsights?.advice || 'Mantén la intensidad desde el primer punto y busca profundidad en tus restos.'}
                                    </p>
                                </div>

                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${(data.smartInsights?.insights || []).map(ins => `
                                        <div style="background: rgba(255,255,255,0.05); padding: 8px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.08); color: #888;">
                                            <span>${ins.icon}</span> <span>${ins.text}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- ATTRIBUTE GLOSSARY (New Info Section) -->
                        <div style="margin-bottom: 40px; background: rgba(255,255,255,0.02); border-radius: 32px; padding: 25px; border: 1px solid rgba(255,255,255,0.05);">
                            <h3 style="margin: 0 0 20px; font-size: 0.9rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-microchip" style="color: #3b82f6;"></i> Ciencia de Atributos
                            </h3>
                            
                            <div style="display: grid; gap: 15px;">
                                <div style="display: flex; gap: 15px; align-items: flex-start;">
                                    <div style="width: 35px; height: 35px; background: rgba(239,68,68,0.1); color: #ef4444; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 900; font-size: 0.7rem;">ATK</div>
                                    <div>
                                        <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-bottom: 2px;">ATAQUE</div>
                                        <p style="font-size: 0.75rem; color: #888; margin: 0; line-height: 1.4;">Capacidad de cerrar puntos. Vinculado a tu <b>Win Rate</b> global.</p>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: flex-start;">
                                    <div style="width: 35px; height: 35px; background: rgba(59,130,246,0.1); color: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 900; font-size: 0.7rem;">DEF</div>
                                    <div>
                                        <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-bottom: 2px;">DEFENSA</div>
                                        <p style="font-size: 0.75rem; color: #888; margin: 0; line-height: 1.4;">Resistencia en pista. Basado en tu <b>ratio de juegos</b> en partidos ajustados.</p>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: flex-start;">
                                    <div style="width: 35px; height: 35px; background: rgba(204,255,0,0.1); color: #CCFF00; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 900; font-size: 0.7rem;">TEC</div>
                                    <div>
                                        <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-bottom: 2px;">TÉCNICA</div>
                                        <p style="font-size: 0.75rem; color: #888; margin: 0; line-height: 1.4;">Calidad de recursos. Es la representación pura de tu <b>Nivel Global</b>.</p>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: flex-start;">
                                    <div style="width: 35px; height: 35px; background: rgba(245,158,11,0.1); color: #f59e0b; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 900; font-size: 0.7rem;">FIS</div>
                                    <div>
                                        <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-bottom: 2px;">FÍSICO</div>
                                        <p style="font-size: 0.75rem; color: #888; margin: 0; line-height: 1.4;">Fondo competitivo. Sube por <b>experiencia</b> y partidos oficiales jugados.</p>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: flex-start;">
                                    <div style="width: 35px; height: 35px; background: rgba(239,68,68,0.1); color: #ef4444; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 900; font-size: 0.7rem;"><i class="fas fa-skull"></i></div>
                                    <div>
                                        <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-bottom: 2px;">NÉMESIS</div>
                                        <p style="font-size: 0.75rem; color: #888; margin: 0; line-height: 1.4;">Tu "bestia negra". El jugador contra el que tienes peor balance de victorias/derrotas histórico.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- RIVALRY & AFFINITY SECTION: NEMESIS & SOULMATE -->
                        <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 40px;">
                            
                            <!-- 💀 NEMESIS CARD -->
                            ${data.h2h?.nemesis && data.h2h.nemesis.losses > 0 ? `
                            <div style="border: 1px solid #ef4444; background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(0,0,0,0) 100%); border-radius: 28px; padding: 22px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(239,68,68,0.15);">
                                <div style="position: absolute; right: -15px; top: -15px; font-size: 6rem; color: #ef4444; opacity: 0.1;"><i class="fas fa-skull-crossbones"></i></div>
                                <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                                    <div>
                                        <div style="color: #ef4444; font-size: 0.7rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">TU NÉMESIS 💀</div>
                                        <div style="font-size: 1.5rem; font-weight: 950; color: white; letter-spacing: -0.5px;">${data.h2h.nemesis.name}</div>
                                        <div style="font-size: 0.8rem; color: #aaa; margin-top: 6px; font-weight: 600;">
                                            H2H: <b style="color:#ef4444">${data.h2h.nemesis.losses} Derrotas</b> / <b style="color:#22c55e">${data.h2h.nemesis.wins} Victorias</b>
                                        </div>
                                    </div>
                                    <button onclick="window.open('https://wa.me/${data.h2h.nemesis.phone || ''}?text=Hola ${data.h2h.nemesis.name}, mi detector de rivales dice que eres mi Némesis oficial 🔥. ¿Venganza en el próximo entreno? ⚔️', '_blank')" style="background: #ef4444; color: white; border: none; padding: 12px 18px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; text-transform: uppercase;">DESAFIAR</button>
                                </div>
                            </div>
                            ` : ''}

                            <!-- ❤️ SOULMATE CARD (Best Partner) -->
                            ${data.h2h?.soulmate && data.h2h.soulmate.matches > 0 ? `
                            <div style="border: 1px solid #ec4899; background: linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 100%); border-radius: 28px; padding: 22px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(236,72,153,0.15);">
                                <div style="position: absolute; right: -15px; top: -15px; font-size: 6rem; color: #ec4899; opacity: 0.1;"><i class="fas fa-heart"></i></div>
                                <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                                    <div>
                                        <div style="color: #ec4899; font-size: 0.7rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">ALMA GEMELA ❤️</div>
                                        <div style="font-size: 1.5rem; font-weight: 950; color: white; letter-spacing: -0.5px;">${data.h2h.soulmate.name}</div>
                                        <div style="font-size: 0.8rem; color: #aaa; margin-top: 6px; font-weight: 600;">
                                            Sinergia: <b style="color:#ec4899">${data.h2h.soulmate.wins} Victorias juntos</b>
                                        </div>
                                    </div>
                                    <button onclick="window.open('https://wa.me/${data.h2h.soulmate.phone || ''}?text=¡Hola ${data.h2h.soulmate.name}! La app de Americanas dice que eres mi Alma Gemela en la pista ❤️. ¿Cuándo repetimos victoria? 🎾🚀', '_blank')" style="background: #ec4899; color: white; border: none; padding: 12px 18px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; text-transform: uppercase;">LLAMAR</button>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        
                        <!-- 🔗 RADAR DE SINERGIAS (SMART PARTNER MATCHING) -->
                        <div id="player-synergy-radar-root" style="margin-bottom: 40px; animation: floatUp 0.95s ease-out forwards;">
                            <!-- Content loaded via JS -->
                        </div>

                        <!-- STATS GRID -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 28px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Eventos Anuales</div>
                                <div style="font-size: 2.2rem; font-weight: 950; color: #fff;">${data.stats.events || 0}</div>
                                <i class="fas fa-trophy" style="position: absolute; right: -5px; bottom: -5px; font-size: 2.5rem; opacity: 0.05; color: #fff;"></i>
                            </div>
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 28px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Win Rate</div>
                                <div style="font-size: 2.2rem; font-weight: 950; color: #CCFF00;">${data.stats.winRate}%</div>
                                <i class="fas fa-chart-pie" style="position: absolute; right: -5px; bottom: -5px; font-size: 2.5rem; opacity: 0.05; color: #CCFF00;"></i>
                            </div>
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 28px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Juegos Ganados</div>
                                <div style="font-size: 2.2rem; font-weight: 950; color: #fff;">${data.stats.gamesWon || 0}</div>
                                <i class="fas fa-fire" style="position: absolute; right: -5px; bottom: -5px; font-size: 2.5rem; opacity: 0.05; color: #fff;"></i>
                            </div>
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 28px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Hito Actual</div>
                                <div style="font-size: 1.1rem; font-weight: 950; color: #3b82f6; margin-top: 10px;">
                                    <i class="fas fa-medal"></i> ${(data.stats.events || 0) > 5 ? 'VETERANO' : 'PROMESA'}
                                </div>
                            </div>
                        </div>

                        <!-- REDESIGNED "MI PASADO" (embedded in Profile) -->
                        <div style="margin-bottom: 40px;">
                            <h3 style="margin: 0 0 20px; font-size: 1.1rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-bolt" style="color: #CCFF00;"></i> RENDIMIENTO TÉCNICO
                            </h3>
                            
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 30px; padding: 25px; text-align: center;">
                                ${data.recentMatches.length === 0 ? `
                                    <div style="margin-bottom: 20px;">
                                        <div style="font-size: 0.8rem; color: #888; margin-bottom: 15px; font-weight: 700; text-transform:uppercase; letter-spacing:1px;">ANALÍTICA DE ATRIBUTOS (Nivel ${parseFloat(user.level).toFixed(2)})</div>
                                        <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 100px; padding: 0 20px;">
                                            ${(() => {
                        const l = parseFloat(user.level || 3.5);
                        const atk = Math.min(100, l * 15 + 20);
                        const def = Math.min(100, l * 12 + 30);
                        const tec = Math.min(100, l * 14 + 10);
                        const fis = Math.min(100, l * 10 + 40);

                        const bar = (h, color, label) => `
                                                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px; flex:1;">
                                                        <div style="width: 80%; height: 80px; background: rgba(255,255,255,0.05); border-radius: 10px; position: relative; overflow: hidden;">
                                                            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${h}%; background: ${color}; transition: height 1s ease;"></div>
                                                        </div>
                                                        <span style="font-size: 0.6rem; font-weight: 800; color: #aaa;">${label}</span>
                                                    </div>
                                                `;
                        return bar(atk, '#ef4444', 'ATAQUE') + bar(def, '#3b82f6', 'DEFENSA') + bar(tec, '#CCFF00', 'TÉCNICA') + bar(fis, '#f59e0b', 'FÍSICO');
                    })()}
                                        </div>
                                    </div>
                                    <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 20px;">Tu perfil está configurado y <b>listo para competir</b>.</p>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <button onclick="window.loadView('americanas')" style="background: #CCFF00; color: black; border: none; padding: 14px; border-radius: 14px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase;">Competir</button>
                                        <button onclick="window.loadView('ranking')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 14px; border-radius: 14px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase;">Ranking</button>
                                    </div>
                                ` : `
                                    <div style="display: grid; gap: 12px;">
                                        ${data.recentMatches.map(m => `
                                            <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                                                <div style="text-align: left;">
                                                    <div style="font-weight: 900; font-size: 0.9rem; color: #fff;">${m.eventName.toUpperCase()}</div>
                                                    <div style="font-size: 0.7rem; color: #666; font-weight: 700;">${m.date}</div>
                                                </div>
                                                <div style="background: ${m.result === 'W' ? '#CCFF00' : '#ef4444'}; color: black; padding: 5px 12px; border-radius: 10px; font-weight: 950; font-size: 0.8rem;">
                                                    ${m.result} • ${m.score}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- SETTINGS Glass Edition -->
                        <div style="background: rgba(255,255,255,0.03); border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
                            <div onclick="window.PlayerView.showUpdatePasswordPrompt()" style="display: flex; align-items: center; padding: 22px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;">
                                <div style="width: 44px; height: 44px; background: rgba(59,130,246,0.1); color: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 1px solid rgba(59,130,246,0.2);"><i class="fas fa-key"></i></div>
                                <div style="flex: 1; margin-left: 18px;">
                                    <div style="font-weight: 900; font-size: 0.95rem; color: #fff;">Contraseña</div>
                                    <div style="font-size: 0.7rem; color: #666; font-weight: 800;">ACTUALIZAR CREDENCIALES</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: #444; font-size: 0.8rem;"></i>
                            </div>
                            <div onclick="window.AuthService.logout()" style="display: flex; align-items: center; padding: 22px; cursor: pointer;">
                                <div style="width: 44px; height: 44px; background: rgba(255,59,48,0.1); color: #FF3B30; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 1px solid rgba(255,59,48,0.2);"><i class="fas fa-power-off"></i></div>
                                <div style="flex: 1; margin-left: 18px;">
                                    <div style="font-weight: 900; font-size: 0.95rem; color: #FF3B30;">Cerrar Sesión</div>
                                    <div style="font-size: 0.7rem; color: #666; font-weight: 800;">SALIR DEL SISTEMA</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <input type="file" id="profile-photo-input" accept="image/*" style="display: none;" onchange="window.PlayerView.handlePhotoSelection(this)">
            `;

            // Initialize Partner Synergy Radar
            if (user && window.PartnerSynergyWidget) {
                setTimeout(() => {
                    window.PartnerSynergyWidget.render(user.uid || user.id, 'player-synergy-radar-root', {
                        title: '🔗 RADAR DE SINERGIAS',
                        subtitle: 'Tus parejas ideales inteligentes',
                        limit: 5,
                        showDetails: true,
                        compact: false
                    }).catch(e => console.error('Synergy widget failed:', e));
                }, 100);
            }
        }

        showUpdatePhotoPrompt() {
            document.getElementById('profile-photo-input').click();
        }

        async shareProfileCard() {
            const user = window.Store.getState('currentUser');
            if (!user) return;

            // Show loading Toast or indicator if needed
            const originalBtn = document.querySelector('[onclick*="shareProfileCard"]');
            if (originalBtn) originalBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';

            // Convert photo to base64 to avoid Tainted Canvas / CORS issues
            let photoBase64 = 'img/logo_somospadel.png';
            try {
                if (user.photo_url || user.photoURL) {
                    photoBase64 = await this.urlToBase64(user.photo_url || user.photoURL);
                }
            } catch (e) {
                console.warn("Could not convert image to base64, using fallback", e);
            }

            // Get data-driven attributes from Controller
            const skills = window.PlayerController.getCalculatedSkills();

            const cardData = {
                name: user.name,
                level: user.level || 3.5,
                photoURL: photoBase64,
                role: (user.role || 'JUGADOR').split('_').join(' '),
                skills: skills // ATK, DEF, TEC, FIS included here
            };

            if (window.SocialShareView) {
                window.SocialShareView.open(cardData, 'player_card');
            }

            if (originalBtn) originalBtn.innerHTML = '<i class="fas fa-id-card"></i> GENERAR FICHA PRO';
        }

        urlToBase64(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = url;
            });
        }

        async handlePhotoSelection(input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            try {
                const optimizedBase64 = await this.compressImage(file);
                const res = await window.PlayerController.updatePhoto(optimizedBase64);
                if (res.success) window.loadView('perfil'); // Reload
                else alert("Error: " + res.error);
            } catch (error) {
                console.error("Photo error:", error);
            }
        }

        compressImage(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const size = 400;
                        canvas.width = size; canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        const minDim = Math.min(img.width, img.height);
                        const startX = (img.width - minDim) / 2;
                        const startY = (img.height - minDim) / 2;
                        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        async showUpdatePasswordPrompt() {
            const pass = prompt("Introduce nueva contraseña (min 6 car):");
            if (pass && pass.length >= 6) {
                const res = await window.PlayerController.updatePassword(pass);
                if (res.success) alert("Contraseña actualizada 🔐");
                else alert("Error: " + res.error);
            }
        }
    }

    window.PlayerView = new PlayerView();
    console.log("🏆 Premium PlayerView (Final Edition) Initialized");
})();

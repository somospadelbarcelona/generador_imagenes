/**
 * ShareModal.js
 * High-impact visual generator for social media sharing (Instagram Stories).
 * Uses HTML2Canvas to create a "FIFA-style" pro match card.
 */
(function () {
    class ShareModal {
        constructor() {
            this.activeMatch = null;
        }

        /**
         * Opens the share modal with match data
         */
        open(match, playerDelta = 0) {
            console.log("📸 [ShareModal] Opening for match:", match?.id, "Delta:", playerDelta);
            this.activeMatch = match;
            this.render(match, playerDelta);
        }

        render(match, playerDelta) {
            const overlay = document.createElement('div');
            overlay.id = 'share-modal-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 100000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Outfit', sans-serif; backdrop-filter: blur(15px);
                opacity: 0; transition: opacity 0.4s ease;
            `;

            // Normalize names
            const getNames = (raw, fallback) => {
                if (typeof raw === 'string' && raw.length > 0) return raw;
                const items = Array.isArray(raw) ? raw : (raw ? [raw] : []);
                if (items.length === 0) return fallback;
                return items.map(i => (typeof i === 'object' ? (i.name || i.displayName) : String(i))).join(' & ');
            };

            const teamA = getNames(match.team_a_names || match.teamA || match.team_a, 'PAREJA A');
            const teamB = getNames(match.team_b_names || match.teamB || match.team_b, 'PAREJA B');

            // FALLBACK LEVEL CALCULATION (If delta is missing or 0)
            let finalDelta = parseFloat(playerDelta || 0);
            console.log("📸 [ShareModal] Initial Delta:", finalDelta, "Match:", match.id);

            if (Math.abs(finalDelta) < 0.0001) {
                const sA = parseInt(match.score_a || 0);
                const sB = parseInt(match.score_b || 0);
                const user = window.Store ? window.Store.getState('currentUser') : null;

                // Detailed check for user in team A
                const userInA = (match.team_a_ids || []).includes(user?.uid) ||
                    (match.team_a_names || []).some(n => {
                        const name = typeof n === 'object' ? (n.name || n.displayName || n) : String(n);
                        return name === user?.name || name === user?.displayName;
                    });

                const win = userInA ? (sA > sB) : (sB > sA);
                const myS = userInA ? sA : sB;
                const riS = userInA ? sB : sA;
                const total = myS + riS;

                console.log("📸 [ShareModal] Fallback Calc:", { userInA, win, myS, riS, total });

                if (total > 0) {
                    finalDelta = (win ? 0.012 : -0.012) + (((myS / total) - 0.5) * 0.01);
                } else {
                    // Ultimate fallback if no games played
                    finalDelta = 0.010;
                }
            }
            console.log("📸 [ShareModal] Final Delta:", finalDelta);

            const scoreA = match.score_a || 0;
            const scoreB = match.score_b || 0;
            const deltaDisplay = finalDelta > 0 ? `+${finalDelta.toFixed(3)}` : (finalDelta < 0 ? finalDelta.toFixed(3) : "0.000");
            const deltaColor = finalDelta >= 0 ? '#CCFF00' : '#FF3B30';

            overlay.innerHTML = `
                <div style="position:relative; width: 90%; max-width: 400px; display: flex; flex-direction: column; align-items: center; padding: 20px 0;">
                    
                    <!-- THE CARD (To be captured) -->
                    <div id="capture-area" style="width: 100%; aspect-ratio: 9/16; background: #000; border-radius: 24px; overflow: hidden; position: relative; box-shadow: 0 40px 80px rgba(0,0,0,0.9); border: 1px solid rgba(204,255,0,0.2);">
                        
                        <!-- BACKGROUND (Static for compatibility) -->
                        <div style="position: absolute; inset: 0; background: #000;"></div>
                        <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: #CCFF00; filter: blur(120px); opacity: 0.15; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; left: -100px; width: 300px; height: 300px; background: #00E36D; filter: blur(120px); opacity: 0.15; border-radius: 50%;"></div>

                        <!-- CONTENT LAYER -->
                        <div style="position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 50px 20px;">
                            
                            <!-- LOGO & EVOL -->
                            <div style="text-align: center; width: 100%;">
                                 <div style="color: #CCFF00; font-size: 1.2rem; font-weight: 900; letter-spacing: 4px; margin-bottom: 25px;">APP SOMOSPADEL BCN</div>
                                 <div style="background: rgba(255,255,255,0.05); border: 1.5px solid ${deltaColor}; padding: 15px 25px; border-radius: 50px; display: inline-flex; flex-direction: column; align-items: center;">
                                     <span style="color: rgba(255,255,255,0.5); font-size: 0.6rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase;">LEVEL EVOLUTION</span>
                                     <span style="color: ${deltaColor}; font-size: 2.5rem; font-weight: 950; letter-spacing: -1px;">${deltaDisplay}</span>
                                 </div>
                            </div>

                            <!-- SCORES -->
                            <div style="text-align: center; width: 100%;">
                                <div style="color: white; font-size: 1.3rem; font-weight: 900; text-transform: uppercase; margin-bottom: 15px; letter-spacing: -0.5px; opacity: 0.9;">${teamA}</div>
                                <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                                    <span style="font-size: 6rem; font-weight: 950; color: #fff; line-height: 1;">${scoreA}</span>
                                    <div style="height: 60px; width: 4px; background: #CCFF00; transform: skewX(-15deg);"></div>
                                    <span style="font-size: 6rem; font-weight: 950; color: #fff; line-height: 1;">${scoreB}</span>
                                </div>
                                <div style="color: white; font-size: 1.3rem; font-weight: 900; text-transform: uppercase; margin-top: 15px; letter-spacing: -0.5px; opacity: 0.9;">${teamB}</div>
                            </div>

                            <!-- BRANDING -->
                            <div style="text-align: center;">
                                <div style="color: #CCFF00; font-weight: 950; font-size: 0.9rem; letter-spacing: 5px; text-transform: uppercase;">PRO MATCH CARD</div>
                                <div style="color: rgba(255,255,255,0.3); font-size: 0.7rem; font-weight: 700; margin-top: 8px;">SMART ALGORITHM • ${new Date().toLocaleDateString('es-ES')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- FOOTER ACTIONS (State of the Art) -->
                    <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px;">
                        
                        <button id="whatsapp-share-btn" style="grid-column: 1 / -1; width: 100%; background: #25D366; color: #fff; border: none; padding: 22px; border-radius: 20px; font-weight: 950; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 15px 35px rgba(37,211,102,0.3); text-transform: uppercase; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='none'">
                            <i class="fab fa-whatsapp" style="font-size: 1.5rem;"></i> COMPARTIR WHATSAPP
                        </button>

                        <button id="download-card-btn" style="background: #CCFF00; color: #000; border: none; padding: 18px; border-radius: 18px; font-weight: 950; font-size: 0.8rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 10px 30px rgba(204,255,0,0.3); text-transform: uppercase;">
                            <i class="fas fa-camera" style="font-size: 1.2rem;"></i>
                            <span>GUARDAR FOTO</span>
                        </button>
                        
                        <button id="native-share-btn" style="background: #3b82f6; color: #fff; border: none; padding: 18px; border-radius: 18px; font-weight: 950; font-size: 0.8rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 10px 30px rgba(59,130,246,0.3); text-transform: uppercase;">
                            <i class="fas fa-share-alt" style="font-size: 1.2rem;"></i>
                            <span>MÁS OPCIONES</span>
                        </button>

                        <button id="close-share-btn" style="grid-column: 1 / -1; width: 100%; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 14px; font-weight: 800; font-size: 0.8rem; cursor: pointer; margin-top: 10px;">
                            CERRAR PANEL
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            setTimeout(() => overlay.style.opacity = '1', 50);

            // WhatsApp Share Logic
            const waBtn = document.getElementById('whatsapp-share-btn');
            if (waBtn) {
                waBtn.onclick = () => {
                    const text = `🏆 ¡VAMOOOS! He ganado mi partido en SomosPadel\n\n🎾 ${teamA} [${scoreA}] vs [${scoreB}] ${teamB}\n📈 Evolución: ${deltaDisplay}\n¡Sigue a tope! 🔥`;
                    const encodedText = encodeURIComponent(text);
                    const url = `https://api.whatsapp.com/send?text=${encodedText}`;
                    window.open(url, '_blank') || (window.location.href = url);
                };
            }

            // Native Share Logic (The one from screenshot)
            const nativeBtn = document.getElementById('native-share-btn');
            if (nativeBtn) {
                nativeBtn.onclick = async () => {
                    const text = `SomosPadel Result: ${teamA} ${scoreA}-${scoreB} ${teamB}`;
                    if (navigator.share) {
                        try {
                            await navigator.share({ title: 'Resultado SomosPadel', text: text });
                        } catch (e) { console.warn("Native share error", e); }
                    } else {
                        alert("Función no disponible en este navegador. Usa WhatsApp o Descargar.");
                    }
                };
            }

            // Capture Logic
            const downloadBtn = document.getElementById('download-card-btn');
            downloadBtn.onclick = async () => {
                console.log("📸 [ShareModal] Starting capture...");
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERANDO...';
                downloadBtn.disabled = true;

                try {
                    const captureArea = document.getElementById('capture-area');

                    if (typeof html2canvas === 'undefined') {
                        throw new Error("Librería de captura no cargada");
                    }

                    const canvas = await html2canvas(captureArea, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#000000',
                        logging: false
                    });

                    const dataUrl = canvas.toDataURL('image/png', 1.0);

                    // MOBILE SHARE
                    if (navigator.share && navigator.canShare) {
                        try {
                            const blob = await (await fetch(dataUrl)).blob();
                            const file = new File([blob], `SomosPadel_${match.id}.png`, { type: 'image/png' });

                            if (navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    files: [file],
                                    title: 'Mi Victoria en SomosPadel',
                                    text: '¡Mira mi evolución de hoy! 🔥'
                                });
                                downloadBtn.innerHTML = '<i class="fas fa-check"></i> ¡COMPARTIDO!';
                                return;
                            }
                        } catch (e) { console.error("Share failed", e); }
                    }

                    // FALLBACK DOWNLOAD
                    this.fallbackDownload(dataUrl, match.id, downloadBtn);

                } catch (e) {
                    console.error("Capture captureFailure:", e);
                    downloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> REINTENTAR';
                    downloadBtn.disabled = false;
                    alert("Error al generar imagen: " + e.message);
                }
            };

            const closeBtn = document.getElementById('close-share-btn');
            closeBtn.onclick = () => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 400);
            };
        }

        fallbackDownload(dataUrl, id, btn) {
            const link = document.createElement('a');
            link.download = `SomosPadel_${id}.png`;
            link.href = dataUrl;
            link.click();
            btn.innerHTML = '<i class="fas fa-check"></i> DESCARGADA';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-camera"></i> DESCARGAR OTRA VEZ';
                btn.disabled = false;
            }, 3000);
        }
    }

    window.ShareModal = new ShareModal();

    // Global bridge for easier HTML access
    window.openProMatchCard = (matchId, delta) => {
        console.log("🚀 [Bridge] openProMatchCard called:", matchId, delta);
        const match = window._matchRegistry ? window._matchRegistry[matchId] : null;
        if (match && window.ShareModal) {
            window.ShareModal.open(match, delta);
        } else {
            console.error("❌ ProMatchCard Error:", { matchId, hasMatch: !!match, hasModal: !!window.ShareModal });
            if (!window.ShareModal) alert("Módulo de compartir no listo. Por favor, recarga.");
            else if (!match) alert("Error: Datos de partido no encontrados.");
        }
    };

    // Alias for emergency button

})();

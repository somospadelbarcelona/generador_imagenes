/**
 * RecordsView.js
 * PREMIUM BIG DATA EDITION 🏆
 */
(function () {
    class RecordsView {
        render() {
            const container = document.getElementById('content-area');
            if (!container) return;
            const records = window.RecordsController ? window.RecordsController.getRecords() : null;

            if (!records && window.RecordsController) {
                container.innerHTML = `<div style="height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; background:#000;">
                    <i class="fas fa-bolt fa-spin" style="color: #FFD700; font-size: 4rem; filter: drop-shadow(0 0 20px #FFD700);"></i><br><br>
                    <span style="font-family:'Outfit'; text-transform:uppercase; letter-spacing:2px; font-weight:900;">Procesando Big Data...</span>
                </div>`;
                window.RecordsController.init();
                return;
            }

            container.innerHTML = `
                <div class="records-wrapper" style="background: #080808; min-height: 100vh; padding-bottom: 200px; font-family: 'Outfit', sans-serif; color: white; overflow-x: hidden;">
                    
                    <!-- HERO HEADER -->
                    <div style="background: radial-gradient(circle at center, #2a2a2a 0%, #000 100%); padding: 60px 24px; text-align: center; border-bottom: 1px solid #333; position: relative; overflow: hidden;">
                        <div class="hero-glow"></div>
                        <h1 class="fame-title">SALÓN DE LA FAMA</h1>
                        <p style="color: #bbb; margin-top: 10px; font-size: 0.7rem; letter-spacing: 4px; text-transform: uppercase; font-weight: 800; position:relative; z-index:2;">
                            LEYENDAS DE SOMOSPADEL
                        </p>
                        <div class="handwritten-seal">Temporada 2026</div>
                    </div>

                    <!-- RECORDS GRID -->
                    <div style="padding: 30px 15px; display: grid; gap: 35px; max-width: 700px; margin: 0 auto;">
                        ${this.renderCard(records.giant, "Level Delta Hit", 1)}
                        ${this.renderCard(records.streak, "Victorias seguidas", 2)}
                        ${this.renderCard(records.catalyst, "Compañeros distintos", 3)}
                        ${this.renderCard(records.sniper, "Efectividad %", 4)}
                        ${this.renderCard(records.ironman, "Semanas Activo", 5)}
                        ${this.renderCard(records.wall, "Juegos Encajados", 6)}
                    </div>
                </div>

                <style>
                    @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    @keyframes neonTitle { 0% { text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700; } 50% { text-shadow: 0 0 30px #FFD700, 0 0 50px #ff5500; } 100% { text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700; } }
                    @keyframes iconFloat { 0% { transform: translateY(0) rotate(0deg); opacity: 0.15; } 50% { transform: translateY(-10px) rotate(5deg); opacity: 0.25; } 100% { transform: translateY(0) rotate(0deg); opacity: 0.15; } }
                    @keyframes writing { from { width: 0; opacity: 0; } to { width: 170px; opacity: 1; } }
                    
                    .handwritten-seal { font-family: 'Caveat', cursive; font-size: 1.8rem; color: #CCFF00; margin: 15px auto 0 auto; position: relative; z-index: 5; width: 170px; white-space: nowrap; overflow: hidden; border-right: 2px solid transparent; animation: writing 2s cubic-bezier(0.4, 0, 0.2, 1) forwards; text-shadow: 0 0 10px rgba(204,255,0,0.4); transform: rotate(-3deg); }
                    .fame-title { font-family: 'Montserrat', sans-serif; font-weight: 950; font-size: 2.8rem; text-transform: uppercase; color: #fff; margin: 0; letter-spacing: -2px; animation: neonTitle 3s infinite alternate; position: relative; z-index: 2; }
                    .hero-glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 60%); pointer-events: none; }
                    
                    .record-card-wow { 
                        border-radius: 32px; 
                        padding: 30px; 
                        position: relative; 
                        overflow: hidden; 
                        border: 1px solid rgba(255,255,255,0.05); 
                        animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; 
                        opacity: 0;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    }

                    .neon-name { font-weight: 950; text-transform: uppercase; font-size: 1.8rem; letter-spacing: -1px; margin-bottom: 5px; line-height: 1.1; }
                    .deep-analysis-box { max-height: 0; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(0,0,0,0.3); border-radius: 20px; }
                    .deep-analysis-box.open { max-height: 600px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); margin-top: 20px; }
                    .action-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 50px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s; }
                    .action-btn:hover { background: white; color: black; transform: scale(1.05); }
                </style>
            `;
        }

        renderCard(data, suffix, index) {
            if (!data) return '';
            const isVacant = data.name === 'VACANTE';
            const color = data.color || '#888';
            const id = 'rec-' + Math.random().toString(36).substr(2, 9);

            let r = 255, g = 255, b = 255;
            if (color.startsWith('#')) {
                const hex = color.replace('#', '');
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }

            return `
                <div class="record-card-wow" style="background: linear-gradient(145deg, rgba(${r},${g},${b}, 0.25) 0%, rgba(15,15,15,1) 100%); border-left: 6px solid ${color}; animation-delay: ${index * 0.15}s;">
                    <!-- Floating Giant Icon -->
                    <div style="position: absolute; right: -20px; top: -20px; font-size: 10rem; opacity: 0.12; color: ${color}; pointer-events: none; animation: iconFloat 6s ease-in-out infinite;">${data.icon}</div>
                    
                    <div style="position: relative; z-index: 2;">
                        <div style="color: ${color}; font-size: 0.75rem; font-weight: 950; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; opacity: 0.8;">${data.title}</div>
                        <div class="neon-name" style="color: ${isVacant ? '#444' : '#fff'}; text-shadow: ${isVacant ? 'none' : `0 0 25px rgba(${r},${g},${b},0.6)`};">${data.name}</div>
                        
                        <div style="display: flex; align-items: center; gap: 12px; margin: 20px 0;">
                            <div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 15px; display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 1.8rem; font-weight: 900; color: ${color};">${data.value}</span>
                                <span style="font-size: 0.7rem; font-weight: 800; color: #aaa; text-transform: uppercase;">${suffix}</span>
                            </div>
                        </div>

                        <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem; line-height: 1.6; margin-bottom: 25px; font-weight: 500;">${data.desc}</p>

                        ${!isVacant ? `
                            <button onclick="document.getElementById('${id}').classList.toggle('open')" class="action-btn">
                                <i class="fas fa-chart-line"></i> VER ANÁLISIS
                            </button>
                            <div id="${id}" class="deep-analysis-box">
                                <div style="font-size: 0.9rem; color: #eee; line-height: 1.7; padding-bottom: 20px; font-style: italic; border-left: 3px solid ${color}; padding-left: 15px;">
                                    <i class="fas fa-quote-left" style="color:${color}; opacity:0.6; margin-right: 10px; font-size: 1.2rem;"></i>${data.deepAnalysis}
                                </div>
                                
                                ${data.top3 && data.top3.length > 0 ? `
                                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                                        <div style="font-size: 0.7rem; color: #888; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">RANKING DE EXCELENCIA</div>
                                        ${data.top3.map((p, idx) => {
                const max = parseFloat(data.top3[0].raw) || 1;
                const rawVal = parseFloat(p.raw || 0);
                const width = max > 0 ? Math.max(10, (rawVal / max) * 100) : 10;
                const rowColor = idx === 0 ? color : '#555';
                return `
                                                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px; font-size: 0.8rem;">
                                                    <span style="font-weight: 950; color: ${rowColor}; width: 25px;">#${idx + 1}</span>
                                                    <span style="flex: 1; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;">${p.name}</span>
                                                    <div style="width: 120px; background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                                                        <div style="width: ${width}%; background: ${rowColor}; height: 100%; box-shadow: 0 0 10px ${rowColor};"></div>
                                                    </div>
                                                    <span style="font-weight: 800; color: #fff; width: 60px; text-align: right;">${p.value.split(' ')[0]}</span>
                                                </div>
                                            `;
            }).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }
    window.RecordsView = new RecordsView();
})();

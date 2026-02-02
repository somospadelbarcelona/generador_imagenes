/**
 * SocialShareService.js
 * "Modo Creador" 📸 - Generador de activos virales para redes sociales.
 * Dependencia: html2canvas
 */
class SocialShareService {
    constructor() {
        this.templates = {
            cyberpunk: { name: 'Cyberpunk Neon', class: 'share-template-cyber' },
            clean: { name: 'Pro Clean', class: 'share-template-clean' },
            data: { name: 'Data Driven', class: 'share-template-data' }
        };
    }

    /**
     * Genera una imagen (Blob) a partir de un template y datos
     * @param {string} type - 'cyberpunk', 'clean', 'data'
     * @param {Object} data - { title, score, player1, player2, date, etc }
     */
    /**
     * Genera una imagen (Blob) a partir de un template y datos
     * @param {string} type - 'cyberpunk', 'clean', 'data'
     * @param {Object} data - { title, score, player1, player2, date, etc }
     */
    async generateImage(type, data) {
        if (typeof html2canvas === 'undefined') {
            throw new Error("html2canvas library not loaded");
        }

        // 1. Create hidden container
        const container = document.createElement('div');
        container.id = 'social-share-render-area';
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '1080px';
        container.style.height = '1920px';
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        // 2. Render HTML
        const templateClass = this.templates[type]?.class || 'share-template-cyber';
        container.innerHTML = this._getHtmlForTemplate(type, templateClass, data);

        try {
            // 3. Convert to Canvas
            const canvas = await html2canvas(container, {
                useCORS: true,
                scale: 2, // Higher quality
                backgroundColor: null,
                logging: false,
                allowTaint: false // DO NOT TAINT, otherwise toDataURL fails
            });

            document.body.removeChild(container);
            return canvas.toDataURL("image/png");
        } catch (err) {
            console.error("Error generating social image:", err);
            if (document.body.contains(container)) document.body.removeChild(container);
            throw err;
        }
    }

    _getLogoSvg() {
        // High-Quality Vertical Stacked SVG to avoid cropping
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
            <g>
                <!-- Ball Icon -->
                <circle cx="100" cy="70" r="50" fill="#ccff00" />
                <path d="M100 20 A50 50 0 0 1 100 120 M60 70 L140 70" stroke="#aacc00" stroke-width="3" fill="none" opacity="0.5"/>
                
                <!-- Text -->
                <text x="100" y="150" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="white" text-anchor="middle">SOMOSPADEL</text>
                <text x="100" y="175" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#ccff00" text-anchor="middle" letter-spacing="4">BARCELONA</text>
            </g>
        </svg>`;
        return "data:image/svg+xml;base64," + btoa(svg);
    }

    _getHtmlForTemplate(type, cssClass, data) {
        // Common Styles
        const commonStyle = `
            width: 100%; height: 100%; 
            display: flex; flex-direction: column; 
            font-family: 'Outfit', sans-serif;
            box-sizing: border-box;
            background: #000; color: white;
            padding: 40px;
        `;

        if (type === 'player_card') {
            const level = parseFloat(data.level || 3.5).toFixed(2);

            // Skill derivation from real data or fallback
            const s = data.skills || { atk: 65, def: 65, tec: 65, fis: 65 };

            return `
                <div style="${commonStyle} background: radial-gradient(circle at 50% 30%, #1a1a1a 0%, #000 100%); align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <!-- Aesthetic Background elements -->
                    <div style="position:absolute; top:10%; left:-10%; width:120%; height:80%; background: linear-gradient(135deg, rgba(204,255,0,0.08) 0%, transparent 100%); transform: rotate(-5deg); filter: blur(50px);"></div>
                    <div style="position:absolute; bottom:0; width:100%; height:150px; background:linear-gradient(to top, #CCFF0022 0%, transparent 100%);"></div>

                    <!-- CARD FRAME -->
                    <div style="width: 850px; height: 1250px; background: #0a0a0a; border: 8px solid #CCFF00; border-radius: 60px; box-shadow: 0 40px 100px rgba(0,0,0,0.8); position:relative; display:flex; flex-direction:column; align-items:center; padding: 50px; z-index: 5;">
                        
                        <!-- Header: Logo -->
                        <img src="${this._getLogoSvg()}" style="height:110px; margin-bottom: 30px;">
                        
                        <!-- Player Photo -->
                        <div style="width: 380px; height: 380px; border-radius: 50%; border: 12px solid #CCFF00; padding: 12px; background: #000; box-shadow: 0 0 50px rgba(204,255,0,0.25); margin-bottom: 30px; overflow:hidden;">
                            <img src="${data.photoURL || 'img/logo_somospadel.png'}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                        </div>

                        <!-- Name & Role -->
                        <div style="text-align:center; margin-bottom: 30px;">
                            <h1 style="font-size: 4.8rem; font-weight: 950; margin: 0; text-transform: uppercase; color:#fff; letter-spacing:-2px;">${data.name || 'JUGADOR'}</h1>
                            <div style="background: #CCFF00; color: #000; display: inline-block; padding: 8px 35px; border-radius: 18px; font-weight: 950; font-size: 1.4rem; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">
                                ${(data.role || 'PLAYER').replace('_', ' ')}
                            </div>
                        </div>

                        <!-- Main Stats -->
                        <div style="display:flex; gap: 40px; margin-bottom: 40px; align-items: center;">
                             <div style="text-align:center;">
                                <div style="font-size: 7.5rem; font-weight: 950; color: #CCFF00; line-height:1;">${level}</div>
                                <div style="font-size: 1.4rem; font-weight: 900; color: #555; text-transform: uppercase; letter-spacing: 4px;">NIVEL GLOBAL</div>
                             </div>
                        </div>

                        <!-- Skill Attributes (FIFA Style Bars) -->
                        <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 35px; padding: 0 40px; flex: 1;">
                             ${[
                    { l: 'ATK', v: s.atk, c: '#ef4444' },
                    { l: 'DEF', v: s.def, c: '#3b82f6' },
                    { l: 'TEC', v: s.tec, c: '#CCFF00' },
                    { l: 'FIS', v: s.fis, c: '#f59e0b' }
                ].map(item => `
                                <div style="display:flex; align-items:center; gap: 20px;">
                                    <div style="font-size: 2.2rem; font-weight: 950; color: #fff; width: 80px;">${item.l}</div>
                                    <div style="flex:1; height: 30px; background: rgba(255,255,255,0.08); border-radius: 15px; overflow:hidden;">
                                        <div style="width: ${item.v}%; height: 100%; background: ${item.c}; box-shadow: 0 0 15px ${item.c}44;"></div>
                                    </div>
                                    <div style="font-size: 2.2rem; font-weight: 950; color: ${item.c}; width: 70px; text-align:right;">${item.v}</div>
                                </div>
                             `).join('')}
                        </div>

                        <!-- Footer: SP QR / App Link (Moved up slightly to avoid overlap) -->
                        <div style="margin-top: 30px; text-align:center; width:100%; opacity: 0.5;">
                             <div style="font-size: 1.5rem; font-weight: 900; color: #666; letter-spacing: 8px; text-transform: uppercase;">APP SOMOSPADEL BARCELONA</div>
                        </div>
                    </div>

                    <!-- Instagram Handle -->
                    <div style="position:absolute; bottom:40px; font-size: 2.2rem; font-weight: 950; color:rgba(255,255,255,0.4); display:flex; align-items:center; gap:15px;">
                        <i class="fab fa-instagram"></i> @somospadelbarcelona_
                    </div>
                </div>
            `;
        }

        if (type === 'cyberpunk') {
            return `
                <div style="${commonStyle} background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); position:relative; overflow:hidden;">
                    <!-- Neon Glows -->
                    <div style="position:absolute; top:-200px; left:-200px; width:800px; height:800px; background:radial-gradient(circle, rgba(204,255,0,0.2) 0%, transparent 70%); border-radius:50%;"></div>
                    <div style="position:absolute; bottom:-100px; right:-100px; width:800px; height:800px; background:radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%); border-radius:50%;"></div>
                    
                    <div style="flex:1; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; z-index:2; text-align:center; padding-top: 60px;">
                        <!-- LOGO ON TOP (SVG) -->
                        <img src="${this._getLogoSvg()}" style="height:140px; margin-bottom: 30px; filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));">

                        <h2 style="font-size:2.5rem; font-weight:800; letter-spacing:4px; margin-bottom:20px; color:rgba(255,255,255,0.7); text-transform:uppercase;">RESULTADO PARTIDO</h2>
                        
                        <div style="font-size:8rem; font-weight:900; color:#ccff00; text-shadow: 0 0 40px rgba(204,255,0,0.6); margin-bottom:50px; line-height:1; font-variant-numeric: tabular-nums;">
                            ${data.score || '0-0'}
                        </div>

                        <div style="display:flex; justify-content:center; gap:60px; width:100%; margin-bottom:60px;">
                            <div style="text-align:center;">
                                <div style="font-size:2.2rem; font-weight:700; color:white; margin-bottom:5px;">${data.player1 || 'JUGADOR 1'}</div>
                                <div style="font-size:1.5rem; color:#aaa;">&</div>
                                <div style="font-size:2.2rem; font-weight:700; color:white;">${data.partner1 || 'COMPAÑERO 1'}</div>
                            </div>
                            <div style="display:flex; align-items:center; font-size:3rem; color:#555; font-style:italic; font-weight:900;">VS</div>
                            <div style="text-align:center;">
                                <div style="font-size:2.2rem; font-weight:700; color:white; margin-bottom:5px;">${data.player2 || 'RIVAL 1'}</div>
                                <div style="font-size:1.5rem; color:#aaa;">&</div>
                                <div style="font-size:2.2rem; font-weight:700; color:white;">${data.partner2 || 'RIVAL 2'}</div>
                            </div>
                        </div>

                        <div style="background:rgba(255,255,255,0.1); padding:15px 30px; border-radius:50px; border:1px solid rgba(255,255,255,0.2); display:flex; gap:15px; align-items:center;">
                            <span style="font-size:1.2rem; color:#ccc;">📅 ${data.date || new Date().toLocaleDateString()}</span>
                            <span style="height:20px; width:1px; background:rgba(255,255,255,0.3);"></span>
                            <span style="font-size:1.2rem; color:#fff; font-weight:700;">📍 ${data.location || 'SomosPadel BCN'}</span>
                        </div>
                    </div>

                    <div style="position:absolute; bottom:60px; left:0; width:100%; text-align:center;">
                        <div style="font-size:1.5rem; color: #fff; font-weight: 700; letter-spacing: 1px; opacity: 0.9;">
                             <i class="fab fa-instagram"></i> @somospadelbarcelona_
                        </div>
                    </div>
                </div>
            `;
        }

        // Add other templates as needed...
        return `<div>Template ${type} not implemented</div>`;
    }
}

window.SocialShareService = new SocialShareService();

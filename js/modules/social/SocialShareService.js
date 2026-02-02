/**
 * SocialShareService.js
 * Generates high-quality "Instagram Story" images from match data.
 */
class SocialShareService {
    constructor() {
        this.hiddenContainerId = 'social-share-hidden-container';
    }

    async shareMatchResults(match, userDelta = 0) {
        if (!match) return;
        console.log("📸 [SocialShare] Intentando abrir Pro Match Card...", { matchId: match.id, hasModal: !!window.ShareModal });

        if (window.ShareModal) {
            window.ShareModal.open(match, userDelta);
        } else {
            console.warn("⚠️ ShareModal no disponible. Usando respaldo nativo.");
            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);
            const text = `🏆 SomosPadel: [${sA}] - [${sB}]\n📈 Evolución: ${userDelta}\n¡A tope! 🔥`;
            if (navigator.share) navigator.share({ title: 'Resultado', text: text });
            else window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        }
    }

    /**
     * Generates a 1080x1920 (9:16) image of the match result.
     * @param {Object} match - The match data object.
     * @param {Object} eventDoc - The americana/event document.
     * @returns {Promise<string>} - The dataURL of the generated image.
     */
    async generateMatchImage(match, eventDoc) {
        return this._generateImage((container) => {
            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);

            const getTeamName = (namesArr, teamStr) => {
                if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
                if (Array.isArray(namesArr)) return namesArr.join(' / ');
                return String(namesArr || 'JUGADOR');
            };

            const teamA = getTeamName(match.team_a_names, match.teamA);
            const teamB = getTeamName(match.team_b_names, match.teamB);

            const isWinA = sA > sB;
            const isWinB = sB > sA;

            container.innerHTML = this.getMatchTemplateHTML(teamA, teamB, sA, sB, isWinA, isWinB, eventDoc);
        });
    }

    async generateRankingImage(ranking, eventDoc) {
        return this._generateImage((container) => {
            container.innerHTML = this.getRankingTemplateHTML(ranking, eventDoc);
        });
    }

    async generateStatsImage(ranking, eventDoc) {
        return this._generateImage((container) => {
            container.innerHTML = this.getStatsTemplateHTML(ranking, eventDoc);
        });
    }

    async generateReportImage(metrics, subjectName, eventDoc) {
        return this._generateImage((container) => {
            // Note: metrics here are now the raw subject stats object from ControlTowerReport, or we can adapt.
            // Let's assume passed data is the 'subject' object which contains wins, matches, games, oppGames
            container.innerHTML = this.getReportTemplateHTML(metrics, subjectName, eventDoc);
        });
    }

    // --- INTERNAL HELPER ---
    async _generateImage(renderFn) {
        this.ensureHiddenContainer();
        const container = document.getElementById(this.hiddenContainerId);

        // Render content
        renderFn(container);

        try {
            const element = container.querySelector('.insta-story-card');

            // Wait slightly for DOM to settle
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(element, {
                scale: 1,
                useCORS: true,
                backgroundColor: '#000000',
                logging: false,
                allowTaint: true
            });

            container.innerHTML = '';
            return canvas.toDataURL('image/png');
        } catch (err) {
            console.error("Error generating image:", err);
            throw new Error("No se pudo generar la imagen");
        }
    }

    ensureHiddenContainer() {
        if (!document.getElementById(this.hiddenContainerId)) {
            const div = document.createElement('div');
            div.id = this.hiddenContainerId;
            div.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; height: 1920px; overflow:hidden;";
            document.body.appendChild(div);
        }
    }

    // --- TEMPLATES ---

    getMatchTemplateHTML(teamA, teamB, scoreA, scoreB, isWinA, isWinB, eventDoc) {
        const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const eventName = (eventDoc?.name || "AMERICANAS").toUpperCase();

        return `
            <div class="insta-story-card" style="
                width: 1080px; 
                height: 1920px; 
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                font-family: 'Outfit', sans-serif;
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                overflow: hidden;
            ">
                ${this._getCommonBackground()}
                
                <div style="position: absolute; top: 100px; text-align: center; display: flex; flex-direction: column; align-items: center;">
                    <img src="img/official_ball_logo.png" style="width: 280px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));" crossorigin="anonymous">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #888; letter-spacing: 4px; text-transform: uppercase;">RESULTADO FINAL</div>
                </div>

                <div style="width: 100%; padding: 0 100px; box-sizing: border-box; display: flex; flex-direction: column; gap: 80px; z-index: 10; margin-top: 250px;">
                    <!-- TEAM A -->
                    <div style="
                        background: ${isWinA ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)'}; 
                        border: 3px solid ${isWinA ? '#CCFF00' : 'rgba(255,255,255,0.1)'};
                        border-radius: 40px;
                        padding: 40px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 30px;">
                            ${isWinA ? '<div style="font-size: 4rem; color: #CCFF00;">🏆</div>' : ''}
                            <div style="text-align: left;">
                                <div style="font-size: ${teamA.length > 20 ? '2.5rem' : '3.5rem'}; font-weight: 900; line-height: 1.2;">${teamA}</div>
                            </div>
                        </div>
                        <div style="font-size: 7rem; font-weight: 900; color: ${isWinA ? '#CCFF00' : 'white'};">${scoreA}</div>
                    </div>

                    <!-- TEAM B -->
                    <div style="
                        background: ${isWinB ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)'}; 
                        border: 3px solid ${isWinB ? '#CCFF00' : 'rgba(255,255,255,0.1)'};
                        border-radius: 40px;
                        padding: 40px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 30px;">
                            ${isWinB ? '<div style="font-size: 4rem; color: #CCFF00;">🏆</div>' : ''}
                            <div style="text-align: left;">
                                <div style="font-size: ${teamB.length > 20 ? '2.5rem' : '3.5rem'}; font-weight: 900; line-height: 1.2;">${teamB}</div>
                            </div>
                        </div>
                        <div style="font-size: 7rem; font-weight: 900; color: ${isWinB ? '#CCFF00' : 'white'};">${scoreB}</div>
                    </div>
                </div>

                ${this._getCommonFooter(eventName, dateStr)}
            </div>
        `;
    }

    getRankingTemplateHTML(ranking, eventDoc) {
        const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const eventName = (eventDoc?.name || "AMERICANAS").toUpperCase();
        const rows = ranking.slice(0, 8); // Top 8

        return `
            <div class="insta-story-card" style="width: 1080px; height: 1920px; background: #0a0a0a; font-family: 'Outfit'; position: relative; color: white; overflow: hidden; display:flex; flex-direction:column; align-items:center;">
                ${this._getCommonBackground()}
                
                <div style="margin-top: 100px; text-align: center; z-index:10; display:flex; flex-direction:column; align-items:center;">
                    <img src="img/official_ball_logo.png" style="width: 200px; margin-bottom: 20px;" crossorigin="anonymous">
                    <h1 style="font-size: 4rem; color: #CCFF00; margin: 0; text-transform:uppercase; letter-spacing:5px;">TOP RANKING</h1>
                </div>

                <div style="width: 900px; margin-top: 60px; z-index:10; display:flex; flex-direction:column; gap:20px;">
                    ${rows.map((p, i) => `
                        <div style="
                            display: flex; align-items: center; padding: 25px 40px;
                            background: ${i === 0 ? 'linear-gradient(90deg, rgba(204,255,0,0.2), rgba(0,0,0,0) 90%)' : 'rgba(255,255,255,0.05)'};
                            border-left: 10px solid ${i === 0 ? '#CCFF00' : (i === 1 ? '#C0C0C0' : (i === 2 ? '#CD7F32' : 'transparent'))};
                            border-radius: 20px;
                        ">
                            <div style="font-size: 2.5rem; font-weight: 900; width: 80px; color: ${i < 3 ? 'white' : '#888'};">${i + 1}</div>
                            <div style="flex: 1; font-size: 2.2rem; font-weight: 800; color: white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name.toUpperCase()}</div>
                            <div style="font-size: 2.5rem; font-weight: 900; color: #CCFF00;">${p.points} <span style="font-size:1.5rem; color:#888;">PTS</span></div>
                        </div>
                    `).join('')}
                </div>

                ${this._getCommonFooter(eventName, dateStr)}
            </div>
        `;
    }

    getStatsTemplateHTML(ranking, eventDoc) {
        const topScorer = [...ranking].sort((a, b) => b.points - a.points)[0];
        const mostWins = [...ranking].sort((a, b) => b.won - a.won)[0];
        const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const eventName = (eventDoc?.name || "AMERICANAS").toUpperCase();

        return `
            <div class="insta-story-card" style="width: 1080px; height: 1920px; background: #0a0a0a; font-family: 'Outfit'; position: relative; color: white; overflow: hidden; display:flex; flex-direction:column; align-items:center;">
                ${this._getCommonBackground()}
                
                <div style="margin-top: 150px; text-align: center; z-index:10; display:flex; flex-direction:column; align-items:center;">
                    <img src="img/official_ball_logo.png" style="width: 250px; margin-bottom: 30px;" crossorigin="anonymous">
                    <h1 style="font-size: 3.5rem; color: white; margin: 0; letter-spacing:3px;">ESTADÍSTICAS</h1>
                </div>

                <div style="width: 900px; margin-top: 100px; z-index:10; display:grid; grid-template-columns: 1fr; gap:60px;">
                    <!-- MVP CARD -->
                    <div style="background: linear-gradient(135deg, rgba(204,255,0,0.15), rgba(0,0,0,0)); border: 2px solid #CCFF00; padding: 50px; border-radius: 40px; text-align:center;">
                        <div style="font-size: 1.5rem; color: #CCFF00; letter-spacing: 5px; font-weight:900; margin-bottom:20px;">MÁXIMO ANOTADOR</div>
                        <div style="font-size: 4rem; font-weight: 900; color: white; margin-bottom: 20px;">${topScorer?.name?.toUpperCase() || '-'}</div>
                        <div style="font-size: 6rem; font-weight: 900; color: #CCFF00; line-height:1;">${topScorer?.points || 0}</div>
                        <div style="font-size: 1.5rem; color: #888;">PUNTOS TOTALES</div>
                    </div>

                     <!-- WINS CARD -->
                    <div style="background: rgba(255,255,255,0.05); padding: 50px; border-radius: 40px; text-align:center;">
                        <div style="font-size: 1.5rem; color: #888; letter-spacing: 5px; font-weight:900; margin-bottom:20px;">MAYOR VICTORIAS</div>
                        <div style="font-size: 3.5rem; font-weight: 900; color: white; margin-bottom: 20px;">${mostWins?.name?.toUpperCase() || '-'}</div>
                        <div style="font-size: 5rem; font-weight: 900; color: white; line-height:1;">${mostWins?.won || 0}</div>
                        <div style="font-size: 1.5rem; color: #888;">PARTIDOS GANADOS</div>
                    </div>
                </div>

                ${this._getCommonFooter(eventName, dateStr)}
            </div>
        `;
    }

    getReportTemplateHTML(subject, subjectName, eventDoc) {
        const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const eventName = (eventDoc?.name || "AMERICANAS").toUpperCase();

        // Ensure subject has basic stats or default to 0
        const wins = subject.wins || 0;
        const matches = subject.matches || 1;
        const games = subject.games || 0;
        const oppGames = subject.oppGames || 0;

        const winRate = Math.round((wins / matches) * 100);
        const avgGames = (games / matches).toFixed(1);
        const diff = games - oppGames;

        return `
            <div class="insta-story-card" style="width: 1080px; height: 1920px; background: #0a0a0a; font-family: 'Outfit'; position: relative; color: white; overflow: hidden; display:flex; flex-direction:column; align-items:center;">
                ${this._getCommonBackground()}

                <div style="margin-top: 150px; text-align: center; z-index:10; display:flex; flex-direction:column; align-items:center;">
                    <img src="img/official_ball_logo.png" style="width: 200px; margin-bottom: 30px;" crossorigin="anonymous">
                    <h1 style="font-size: 2.5rem; color: #CCFF00; margin: 0; letter-spacing:5px;">PADEL INTELLIGENCE</h1>
                </div>

                <div style="width: 900px; margin-top: 80px; z-index:10;">
                    <div style="font-size: 4rem; font-weight: 900; color: white; text-align:center; margin-bottom: 60px; line-height:1.2;">${subjectName.toUpperCase()}</div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                        <!-- METRIC 1 -->
                        <div style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); text-align:center;">
                            <div style="color: #888; letter-spacing: 2px; font-weight: 800; margin-bottom: 10px;">EFECTIVIDAD</div>
                            <div style="font-size: 5rem; color: #CCFF00; font-weight: 900;">${winRate}%</div>
                        </div>

                         <!-- METRIC 2 -->
                        <div style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); text-align:center;">
                            <div style="color: #888; letter-spacing: 2px; font-weight: 800; margin-bottom: 10px;">PARTIDOS</div>
                            <div style="font-size: 5rem; color: white; font-weight: 900;">${matches}</div>
                        </div>

                         <!-- METRIC 3 -->
                        <div style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); text-align:center;">
                            <div style="color: #888; letter-spacing: 2px; font-weight: 800; margin-bottom: 10px;">MEDIA JUEGOS</div>
                            <div style="font-size: 5rem; color: white; font-weight: 900;">${avgGames}</div>
                        </div>

                         <!-- METRIC 4 -->
                        <div style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); text-align:center;">
                            <div style="color: #888; letter-spacing: 2px; font-weight: 800; margin-bottom: 10px;">BALANCE</div>
                            <div style="font-size: 5rem; color: ${diff >= 0 ? '#10b981' : '#ef4444'}; font-weight: 900;">${diff > 0 ? '+' : ''}${diff}</div>
                        </div>
                    </div>
                </div>

                ${this._getCommonFooter(eventName, dateStr)}
            </div>
        `;
    }

    _getCommonBackground() {
        return `
            <div style="position: absolute; top: -200px; left: -200px; width: 800px; height: 800px; background: #CCFF00; filter: blur(250px); opacity: 0.15; border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -200px; right: -200px; width: 800px; height: 800px; background: #00E36D; filter: blur(250px); opacity: 0.15; border-radius: 50%;"></div>
            <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%); background-size: 20px 20px; opacity: 0.3;"></div>
        `;
    }

    _getCommonFooter(eventName, dateStr) {
        return `
            <div style="position: absolute; bottom: 120px; text-align: center; z-index: 10;">
                <div style="font-size: 1.8rem; font-weight: 800; color: white;">${eventName}</div>
                <div style="font-size: 1.5rem; color: #888; margin-top: 10px;">${dateStr} • App Oficial</div>
                 <div style="margin-top: 40px; font-size: 1.5rem; background: #CCFF00; color: black; padding: 15px 40px; border-radius: 50px; font-weight: 900; display: flex; align-items: center; gap: 10px;">
                    <i class="fab fa-instagram" style="font-size: 1.8rem;"></i> @somospadelbarcelona_
                </div>
            </div>
        `;
    }
}

// SINGLE SOURCE OF TRUTH FOR SHARING
window.shareVictory = function (matchId, delta) {
    console.log("🎯 [GlobalShare] Triggered for matchID:", matchId);

    if (!window._matchRegistry) {
        console.warn("⚠️ Registry missing, initializing...");
        window._matchRegistry = {};
    }

    const match = window._matchRegistry[matchId];

    if (match && window.SocialShareService) {
        window.SocialShareService.shareMatchResults(match, delta);
    } else {
        console.error("❌ Share Error: Match or Service not found", {
            matchId,
            hasMatch: !!match,
            hasService: !!window.SocialShareService
        });
        alert("Sincronizando datos... pulsa de nuevo en 1 segundo.");
    }
};

// Singleton Export
window.SocialShareService = new SocialShareService();

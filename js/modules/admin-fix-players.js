/**
 * admin-fix-players.js
 * Utility to diagnose and fix player ID issues
 */

window.AdminViews = window.AdminViews || {};

window.AdminViews.fix_players = async function () {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="glass-card-enterprise" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
            <h2 style="color: var(--primary); margin-bottom: 2rem;">🔧 Reparar IDs de Jugadores</h2>
            
            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <p style="color: #ddd; margin-bottom: 1rem;">Esta herramienta diagnostica y repara jugadores que no tienen IDs válidos en eventos.</p>
                <button onclick="window.diagnosePlayerIDs()" class="btn-primary-pro" style="margin-right: 1rem;">
                    🔍 DIAGNOSTICAR
                </button>
                <button onclick="window.fixPlayerIDs()" class="btn-secondary" style="background: #CCFF00; color: black;">
                    🔧 REPARAR TODO
                </button>
            </div>
            
            <div id="diagnosis-results" style="margin-top: 2rem;"></div>
        </div>
    `;
};

window.diagnosePlayerIDs = async function () {
    const resultsDiv = document.getElementById('diagnosis-results');
    resultsDiv.innerHTML = '<div class="loader"></div>';

    try {
        const issues = [];

        // Check Entrenos
        const entrenos = await EventService.getAll('entreno');
        for (const event of entrenos) {
            if (!event.players) continue;

            event.players.forEach((player, index) => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId) {
                    issues.push({
                        type: 'entreno',
                        eventId: event.id,
                        eventName: event.name,
                        playerIndex: index,
                        playerName: player.name || 'Sin nombre',
                        player: player
                    });
                }
            });
        }

        // Check Americanas
        const americanas = await EventService.getAll('americana');
        for (const event of americanas) {
            if (!event.players) continue;

            event.players.forEach((player, index) => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId) {
                    issues.push({
                        type: 'americana',
                        eventId: event.id,
                        eventName: event.name,
                        playerIndex: index,
                        playerName: player.name || 'Sin nombre',
                        player: player
                    });
                }
            });
        }

        if (issues.length === 0) {
            resultsDiv.innerHTML = `
                <div style="background: rgba(0,255,0,0.1); border: 1px solid #00ff00; padding: 1.5rem; border-radius: 12px; text-align: center;">
                    <h3 style="color: #00ff00; margin: 0;">✅ No se encontraron problemas</h3>
                    <p style="color: #ddd; margin-top: 0.5rem;">Todos los jugadores tienen IDs válidos.</p>
                </div>
            `;
        } else {
            const issuesHTML = issues.map(issue => `
                <div style="background: rgba(255,0,0,0.1); border: 1px solid #ff4444; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="color: #ff4444; font-weight: 900; margin-bottom: 0.5rem;">
                        ⚠️ ${issue.type.toUpperCase()}: ${issue.eventName}
                    </div>
                    <div style="color: #ddd; font-size: 0.9rem;">
                        Jugador: <strong>${issue.playerName}</strong> (posición ${issue.playerIndex})<br>
                        Datos: ${JSON.stringify(issue.player)}
                    </div>
                </div>
            `).join('');

            resultsDiv.innerHTML = `
                <div style="background: rgba(255,255,0,0.1); border: 1px solid #ffff00; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                    <h3 style="color: #ffff00; margin: 0 0 0.5rem 0;">⚠️ Se encontraron ${issues.length} problemas</h3>
                </div>
                ${issuesHTML}
                <button onclick="window.fixPlayerIDs()" class="btn-primary-pro" style="width: 100%; margin-top: 1rem;">
                    🔧 REPARAR TODOS LOS PROBLEMAS
                </button>
            `;
        }

    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="background: rgba(255,0,0,0.2); border: 1px solid #ff0000; padding: 1.5rem; border-radius: 12px;">
                <h3 style="color: #ff0000;">❌ Error</h3>
                <p style="color: #ddd;">${error.message}</p>
            </div>
        `;
    }
};

window.fixPlayerIDs = async function () {
    if (!confirm('¿Estás seguro de que quieres reparar todos los jugadores con IDs faltantes?\n\nEsto intentará buscar el jugador en la base de datos por nombre.')) {
        return;
    }

    const resultsDiv = document.getElementById('diagnosis-results');
    resultsDiv.innerHTML = '<div class="loader"></div><p style="text-align:center; color:#ddd;">Reparando...</p>';

    try {
        let fixed = 0;
        let failed = 0;

        // Get all players from DB
        const allPlayers = await FirebaseDB.players.getAll();

        // Fix Entrenos
        const entrenos = await EventService.getAll('entreno');
        for (const event of entrenos) {
            if (!event.players) continue;

            let needsUpdate = false;
            const updatedPlayers = event.players.map(player => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId && player.name) {
                    // Try to find player by name
                    const foundPlayer = allPlayers.find(p =>
                        p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
                    );

                    if (foundPlayer) {
                        needsUpdate = true;
                        fixed++;
                        return {
                            ...player,
                            id: foundPlayer.id,
                            uid: foundPlayer.id
                        };
                    } else {
                        failed++;
                        console.warn('Could not find player in DB:', player.name);
                    }
                }
                return player;
            });

            if (needsUpdate) {
                await EventService.updateEvent('entreno', event.id, { players: updatedPlayers });
            }
        }

        // Fix Americanas
        const americanas = await EventService.getAll('americana');
        for (const event of americanas) {
            if (!event.players) continue;

            let needsUpdate = false;
            const updatedPlayers = event.players.map(player => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId && player.name) {
                    const foundPlayer = allPlayers.find(p =>
                        p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
                    );

                    if (foundPlayer) {
                        needsUpdate = true;
                        fixed++;
                        return {
                            ...player,
                            id: foundPlayer.id,
                            uid: foundPlayer.id
                        };
                    } else {
                        failed++;
                        console.warn('Could not find player in DB:', player.name);
                    }
                }
                return player;
            });

            if (needsUpdate) {
                await EventService.updateEvent('americana', event.id, { players: updatedPlayers });
            }
        }

        resultsDiv.innerHTML = `
            <div style="background: rgba(0,255,0,0.1); border: 1px solid #00ff00; padding: 1.5rem; border-radius: 12px; text-align: center;">
                <h3 style="color: #00ff00; margin: 0;">✅ Reparación Completada</h3>
                <p style="color: #ddd; margin-top: 1rem;">
                    Jugadores reparados: <strong>${fixed}</strong><br>
                    ${failed > 0 ? `No se pudieron reparar: <strong>${failed}</strong> (no encontrados en BD)` : ''}
                </p>
                <button onclick="window.diagnosePlayerIDs()" class="btn-outline-pro" style="margin-top: 1rem;">
                    🔍 VERIFICAR DE NUEVO
                </button>
            </div>
        `;

    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="background: rgba(255,0,0,0.2); border: 1px solid #ff0000; padding: 1.5rem; border-radius: 12px;">
                <h3 style="color: #ff0000;">❌ Error</h3>
                <p style="color: #ddd;">${error.message}</p>
            </div>
        `;
    }
};

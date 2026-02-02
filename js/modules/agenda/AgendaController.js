/**
 * AgendaController.js
 */
(function () {
    class AgendaController {
        constructor() {
            this.db = window.FirebaseDB;
        }

        async init() {
            console.log("[AgendaController] Initializing...");
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) return Router.navigate('dashboard');

            try {
                const americanas = await this.db.americanas.getAll();

                // Filter events where user is registered
                const myEvents = americanas.filter(a =>
                    a.players && a.players.includes(user.id) ||
                    a.registeredPlayers && a.registeredPlayers.includes(user.id)
                );

                // Featured events (open and not joined)
                const upcoming = americanas.filter(a =>
                    a.status === 'open' &&
                    !(a.players && a.players.includes(user.id))
                ).slice(0, 3);

                if (window.AgendaView) {
                    window.AgendaView.render(myEvents, upcoming);

                    // --- RENDER RELIABILITY BADGE ---
                    if (window.LevelReliabilityService) {
                        const rel = window.LevelReliabilityService.getReliability(user);
                        const badgeContainer = document.getElementById('user-reliability-badge');
                        if (badgeContainer) {
                            badgeContainer.innerHTML = `
                                <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                                    <i class="fas ${rel.icon}" style="color: ${rel.color}; font-size: 0.8rem; filter: drop-shadow(0 0 5px ${rel.color});"></i>
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="color: white; font-size: 0.75rem; font-weight: 700;">ESTADO DE NIVEL</span>
                                        <span style="color: ${rel.color}; font-size: 0.7rem; font-weight: 400;">${rel.label.toUpperCase()}</span>
                                    </div>
                                    ${rel.color === '#FF5555' ?
                                    `<i class="fas fa-exclamation-triangle" style="color: #FF5555; margin-left: 5px; animation: pulse 2s infinite;"></i>` : ''}
                                </div>
                            `;
                        }

                        // --- AUTO-NOTIFY ALERT (Once per session) ---
                        // Key for session storage to avoid spam
                        const sessionKey = `reliability_alert_${user.id}`;
                        if (!sessionStorage.getItem(sessionKey)) {
                            if (rel.color === '#FF5555' || rel.color === '#FFD700') {
                                setTimeout(() => {
                                    const msg = rel.color === '#FF5555'
                                        ? "⚠️ ATENCIÓN: TU NIVEL ESTÁ OXIDADO \n\nHace más de 60 días que no registras actividad. Tu nivel efectivo se ha reducido temporalmente.\n\n👉 ¡Apúntate a un entreno para recuperarlo!"
                                        : "⚠️ ATENCIÓN: TU NIVEL ES DUDOSO \n\nHace tiempo que no juegas. Participa en un evento pronto para mantener tu nivel.";

                                    alert(msg);
                                    sessionStorage.setItem(sessionKey, 'true');
                                }, 800);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading agenda:", error);
            }
        }
    }

    window.AgendaController = new AgendaController();
    console.log("🗓️ AgendaController Initialized");
})();

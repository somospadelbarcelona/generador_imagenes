/**
 * AgendaView.js
 */
(function () {
    class AgendaView {
        render(myEvents, upcomingEvents) {
            const container = document.getElementById('content-area');
            if (!container) return;

            container.innerHTML = `
                <div class="agenda-container fade-in" style="background: #f8fafc; min-height: 100vh; padding-bottom: 100px; font-family: 'Inter', sans-serif;">
                    
                    <!-- Premium Header -->
                    <div style="background: linear-gradient(135deg, #111 0%, #222 100%); padding: 45px 24px 35px 24px; color: white; border-bottom-left-radius: 32px; border-bottom-right-radius: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; background: var(--playtomic-neon); opacity: 0.1; border-radius: 50%; filter: blur(40px);"></div>
                        <h1 style="font-family: 'Outfit'; font-weight: 900; font-size: 2.2rem; margin: 0; letter-spacing: -1px; line-height: 1;">Mi <span style="color: var(--playtomic-neon);">Agenda</span></h1>
                        <p style="color: #aaa; font-size: 0.9rem; margin-top: 10px; font-weight: 500;">Gestiona tus reservas y próximos retos.</p>
                        
                        <!-- NEW: LEVEL RELIABILITY BADGE -->
                        <div id="user-reliability-badge" style="margin-top: 20px;"></div>
                    </div>

                    <!-- My Reserved Events -->
                    <div style="padding: 30px 24px 10px 24px;">
                        <div style="font-size: 0.75rem; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                            <span style="width: 4px; height: 14px; background: var(--playtomic-neon); border-radius: 2px;"></span>
                            PRÓXIMAS CITAS
                        </div>
                        ${myEvents.length === 0 ? `
                            <div style="background: white; border-radius: 24px; padding: 50px 20px; text-align: center; border: 1px solid #edf2f7; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                                <div style="font-size: 3rem; margin-bottom: 15px;">📅</div>
                                <div style="font-weight: 800; color: #1e293b; font-size: 1.1rem;">Todo despejado</div>
                                <p style="font-size: 0.85rem; color: #64748b; margin-top: 8px; line-height: 1.5;">No tienes reservas activas por ahora.<br>¡Explora las americanas disponibles!</p>
                                <button onclick="Router.navigate('americanas')" style="background: #111; color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; font-size: 0.8rem; margin-top: 20px; cursor: pointer; transition: all 0.2s;">EXPLORAR EVENTOS</button>
                            </div>
                        ` : myEvents.map(e => this.renderEventCard(e, true)).join('')}
                    </div>

                    <!-- Recommended -->
                    <div style="padding: 20px 24px;">
                        <div style="font-size: 0.75rem; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                            <span style="width: 4px; height: 14px; background: #3b82f6; border-radius: 2px;"></span>
                            RECOMENDADOS PARA TI
                        </div>
                        ${upcomingEvents.map(e => this.renderEventCard(e, false)).join('')}
                    </div>

                </div>
            `;
        }

        renderEventCard(event, isReserved) {
            const date = new Date(event.date);
            const day = date.getDate();
            const month = date.toLocaleString('es', { month: 'short' }).toUpperCase();

            // Sede display logic
            const location = event.location || 'Sede por confirmar';

            return `
                <div style="background: white; border-radius: 24px; padding: 20px; margin-bottom: 16px; display: flex; align-items: center; gap: 18px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; transition: transform 0.2s;" onclick="${isReserved ? '' : "Router.navigate('americanas')"}" ontouchstart="this.style.transform='scale(0.98)'" ontouchend="this.style.transform='scale(1)'">
                    <div style="background: ${isReserved ? 'rgba(204, 255, 0, 0.1)' : '#f8fafc'}; color: ${isReserved ? '#4d6100' : '#475569'}; padding: 12px; border-radius: 18px; text-align: center; min-width: 55px; border: 1px solid ${isReserved ? 'rgba(204, 255, 0, 0.2)' : '#e2e8f0'};">
                        <div style="font-size: 1.3rem; font-weight: 900; line-height: 1;">${day}</div>
                        <div style="font-size: 0.65rem; font-weight: 800; margin-top: 2px;">${month}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 800; color: #0f172a; font-size: 1rem; letter-spacing: -0.3px;">${event.name}</div>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 12px;">
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="far fa-clock"></i> ${event.time}</span>
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> ${location}</span>
                        </div>
                    </div>
                    ${isReserved ? `
                        <div style="background: var(--playtomic-neon); color: #000; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(204, 255, 0, 0.3);">
                            <i class="fas fa-check" style="font-size: 0.9rem;"></i>
                        </div>
                    ` : `
                        <button style="background: #111; color: white; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">VER</button>
                    `}
                </div>
            `;
        }
    }

    window.AgendaView = new AgendaView();
    console.log("📅 AgendaView Initialized");
})();

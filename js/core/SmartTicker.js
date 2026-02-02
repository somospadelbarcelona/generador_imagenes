/**
 * SmartTicker.js - AI & BIG DATA EDITION V2
 * Sistema ultra-inteligente de ticker con animación controlada y contenido masivo.
 */

(function () {
    class SmartTicker {
        constructor() {
            this.tickerElement = null;
            this.updateInterval = null;
            this.messages = [];
            this.lastFetch = 0;
        }

        init() {
            this.tickerElement = document.getElementById('ticker-track');
            if (!this.tickerElement) return;

            // INYECTAR ESTILOS DE ANIMACIÓN PERSONALIZADOS (LENTOS)
            this.injectStyles();

            // Primera carga
            this.update();

            // Actualizar datos cada 5 minutos
            this.updateInterval = setInterval(() => this.update(), 300000);

            // Escuchar notificaciones en tiempo real para incluirlas en el ticker
            if (window.NotificationService) {
                window.NotificationService.onUpdate(() => this.update());
            }
        }

        injectStyles() {
            // Borrar estilos previos si existen
            const oldStyle = document.getElementById('ticker-style-custom');
            if (oldStyle) oldStyle.remove();

            const style = document.createElement('style');
            style.id = 'ticker-style-custom';
            style.innerHTML = `
                @keyframes ticker-scroll-pro {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); } 
                }
                
                .ticker-track {
                    display: flex;
                    width: max-content; /* Dejar que crezca lo necesario */
                    /* VELOCIDAD: Cuanto mayor el tiempo, más lento. 
                       120s es MUY suave para leer mucha info. */
                    animation: ticker-scroll-pro 120s linear infinite !important; 
                }

                .ticker-track:hover {
                    animation-play-state: paused !important; /* Pausa al pasar el ratón para leer mejor */
                }

                .ticker-item {
                   flex-shrink: 0;
                }
            `;
            document.head.appendChild(style);
        }

        async update() {
            this.messages = await this.generateMassiveContent();
            this.render();
        }

        async generateMassiveContent() {
            let insights = [];

            // --- 1. DATOS REALES (SI EXISTEN) ---
            try {
                if (window.AmericanaService) {
                    const americanas = await window.AmericanaService.getActiveAmericanas();
                    const live = americanas.filter(a => a.status === 'live');
                    if (live.length > 0) {
                        insights.push({ label: '🔴 EN JUEGO', text: `Torneo ${live[0].name} activo. ¡Sigue los resultados en directo!`, color: '#ef4444' });
                    }
                }
            } catch (e) { }

            // --- 2. BASE DE DATOS DE CONOCIMIENTO (PÁDEL WIKIPEDIA) ---

            // TÁCTICA
            const tactics = [
                "🧊 NEVERA: Si el rival está 'on fire', tira globos llovidos y bolas lentas para enfriar el partido.",
                "🛡️ DEFENSA: En el fondo de la pista, tu objetivo no es ganar el punto, es recuperar la posición en la red.",
                "🎾 GLOBO: El globo es el golpe más ofensivo del pádel si se tira bien. Busca la línea de fondo.",
                "🚫 ERROR: El 70% de los puntos en amateur se ganan por erroes no forzados. ¡Mete la bola!",
                "🔄 PARED: Si la bola rebota mucho en la pared de fondo, déjala salir y ataca de bajada.",
                "🎯 SAQUE: Saca al cristal lateral para obligar al rival a girarse y dificultar su resto.",
                "⚡ VOLEA: La primera volea tras el saque no busca ganar, busca mantener la red y profundidad.",
                "🧩 COMPAÑERO: Habla con tu pareja en cada punto. La comunicación cubre huecos vacíos.",
                "🚦 SEMÁFORO: Bola fácil (Verde) = Ataca. Bola difícil (Roja) = Globo alto y al centro.",
                "📐 GEOMETRÍA: Jugar al centro (la 'T') reduce los ángulos de ataque de tus rivales."
            ];

            // FÍSICA Y CURIOSIDADES
            const science = [
                "🌡️ CLIMA: Con calor (>25°C) la bola tiene más presión y rebota mucho más. ¡Cuidado con la fuerza!",
                "🌬️ VIENTO: Si hace mucho viento, evita los globos altos y juega 'chiquitas' a los pies.",
                "👟 CALZADO: Las suelas de espiga profundas agarran un 30% más en pistas con mucha arena.",
                "🧠 CEREBRO: Tu tiempo de reacción disminuye un 10% si estás deshidratado. Bebe agua en los cambios.",
                "⏱️ REGLAMENTO: Tienes 25 segundos máximo entre punto y punto. ¡Respira y visualiza!",
                "📏 PISTA: Una pista de pádel mide 20x10 metros. Cubres 100m² con tu pareja.",
                "🎾 PELOTA: Las pelotas pierden presión drásticamente tras el 3er partido. Cámbialas a menudo.",
                "🩺 SALUD: El calentamiento de 5 min reduce el riesgo de rotura de gemelo en un 50%."
            ];

            // MENTALIDAD PRO
            const mindset = [
                "🦁 ACTITUD: Tu lenguaje corporal grita. Mantén la cabeza alta incluso si fallas.",
                "🤝 EQUIPO: Nunca culpes a tu compañero. Si él falla, el equipo falla. Anímalo.",
                "🧘 CALMA: El punto más importante es el siguiente. Olvida el error anterior YA.",
                "🔥 PRESIÓN: La presión es un privilegio. Disfruta de los puntos decisivos.",
                "📈 PROGRESO: No te compares con otros, compárate con tu versión de ayer."
            ];

            // REGLAS RARAS
            const rules = [
                "📜 REGLA: Si la bola golpea al rival directamente sin botar, es punto para ti.",
                "📜 REGLA: Puedes golpear la bola fuera de la pista si sales por la puerta habilitada.",
                "📜 REGLA: Si tocas la red con la pala, el cuerpo o la ropa mientras el punto está vivo, pierdes.",
                "📜 REGLA: En el saque, debes golpear la pelota por debajo de la cintura.",
                "📜 REGLA: Si la pelota bota en tu campo, da en la valla (no cristal) y vuelve... es punto tuyo."
            ];

            // Añadir selección aleatoria
            const getRandom = (arr, count) => arr.sort(() => 0.5 - Math.random()).slice(0, count);

            // --- 3. NOTIFICACIONES RECIENTES ---
            try {
                if (window.NotificationService && window.NotificationService.notifications) {
                    // Cogemos las 3 últimas no leídas
                    const notifs = window.NotificationService.notifications.filter(n => !n.read).slice(0, 3);
                    notifs.forEach(n => {
                        insights.unshift({ label: '🔔 ÚLTIMA HORA', text: n.title + ": " + n.body, color: '#ef4444' });
                    });
                }
            } catch (e) { }

            getRandom(tactics, 4).forEach(t => insights.push({ label: '🎓 ACADEMIA', text: t, color: '#CCFF00' }));
            getRandom(science, 3).forEach(t => insights.push({ label: '🧬 PÁDEL SCIENCE', text: t, color: '#0ea5e9' }));
            getRandom(mindset, 2).forEach(t => insights.push({ label: '🧠 MINDSET', text: t, color: '#f59e0b' }));
            getRandom(rules, 2).forEach(t => insights.push({ label: '⚖️ REGLAMENTO', text: t, color: '#ec4899' }));

            return insights;
        }

        render() {
            if (!this.tickerElement || this.messages.length === 0) return;

            // Mezclar todo
            const shuffled = [...this.messages].sort(() => Math.random() - 0.5);

            // DUPLICAR contenido para el efecto loop infinito (sin huecos)
            // Triplicamos si es poco contenido para asegurar que cubra toda la pantalla ancha
            const finalContent = [...shuffled, ...shuffled, ...shuffled];

            const html = finalContent.map(msg => {
                const bgColor = msg.color || '#CCFF00';
                return `
                    <div class="ticker-item" style="display:flex; align-items:center; padding: 0 40px; border-right: 1px solid rgba(255,255,255,0.1); height: 100%;">
                        <span style="background: ${bgColor}; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 0.7rem; margin-right: 12px; white-space:nowrap; box-shadow: 0 0 10px ${bgColor}55;">
                            ${msg.label}
                        </span>
                        <span style="color: #ffffff; font-weight: 600; font-size: 0.85rem; white-space:nowrap; letter-spacing: 0.5px;">
                            ${msg.text}
                        </span>
                    </div>
                `;
            }).join('');

            this.tickerElement.innerHTML = html;
        }
    }

    // Instancia Global
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SmartTicker = new SmartTicker();
            window.SmartTicker.init();
        });
    } else {
        window.SmartTicker = new SmartTicker();
        window.SmartTicker.init();
    }
})();

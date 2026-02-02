/**
 * DashboardView.js
 * "Context-First" Mobile Dashboard
 * Designed for Clarity, Speed and Outdoor Use
 */
(function () {
    class DashboardView {
        constructor() {
            if (window.Store) {
                window.Store.subscribe('dashboardData', (data) => {
                    if (window.Router && window.Router.currentRoute === 'dashboard') {
                        this.render(data);
                    }
                });
            }

            // AUTO-REFRESH MOTOR: Renovación inteligente cada 5 minutos
            this.refreshInterval = setInterval(() => {
                if (window.Router && window.Router.currentRoute === 'dashboard') {
                    console.log("🔄 [AI Motor] Renovando noticias y eventos en tiempo real...");
                    this.renderLiveWidget();
                }
            }, 5 * 60 * 1000); // 5 min

            // USER SYNC MOTOR: Ensure widgets refresh when user data arrives
            if (window.Store) {
                window.Store.subscribe('currentUser', (user) => {
                    if (user && window.Router && window.Router.currentRoute === 'dashboard') {
                        console.log("👤 [DashboardView] User synced, refreshing live content...");
                        this.buildContext(user).then(context => this.loadLiveWidgetContent(context));
                    }
                });
            }
        }

        async render(data) {
            console.log("📊 [DashboardView] Rendering started...", data);
            const container = document.getElementById('content-area');
            if (!container) return;

            // 1. Get Real User Data
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const userLevel = user ? (user.level || "3.5") : "3.5";

            // Header is updated globally by AppInstance in app.js on user change.
            // We just ensure we have visibility on the level here.

            // 2. Render IMMEDIATE SHELL (Experience-Focused)
            container.innerHTML = `
                <!-- MAIN DASHBOARD SCROLL CONTENT -->
                <div class="dashboard-v2-container fade-in full-width-mobile" style="
                    background: radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.08) 0%, transparent 70%);
                    min-height: 100vh;
                    padding-top: 10px !important;
                ">

                    <!-- 1. PULSE STORIES (INSTAGRAM STYLE) -->
                    <div id="story-feed-root" style="margin: 0 !important; animation: floatUp 0.8s ease-out forwards; padding-top: 2px;">
                        <!-- Cargado vía JS (StoryFeedWidget) -->
                    </div>

                    <!-- 2. COMMAND CENTER (RE-DESIGNED & MOVED BELOW SPHERES) -->
                    <div style="
                        display: flex; 
                        align-items: stretch; 
                        gap: 8px; 
                        padding: 0 10px; 
                        margin: 2px 0 6px 0; 
                        animation: floatUp 0.85s ease-out forwards;
                    ">
                        <!-- TICKER: TACTICAL DATA STREAM (WHITE HOUSE GRADE) -->
                        <div style="
                            flex: 1;
                            background: linear-gradient(90deg, rgba(8, 10, 16, 0.95) 0%, rgba(15, 20, 30, 0.98) 100%); 
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255, 255, 255, 0.08); 
                            border-right: 2px solid rgba(204, 255, 0, 0.5);
                            border-radius: 14px; 
                            height: 48px; 
                            display: flex; 
                            align-items: center; 
                            padding: 0 4px 0 12px; 
                            overflow: hidden; 
                            position: relative;
                            box-shadow: 0 15px 40px -10px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5);
                        ">
                            <!-- Background: Hex Tech Pattern -->
                            <div style="position: absolute; inset: 0; background-image: radial-gradient(#ffffff 0.5px, transparent 0.5px), radial-gradient(#ffffff 0.5px, #080a10 0.5px); background-size: 20px 20px; background-position: 0 0, 10px 10px; opacity: 0.03; pointer-events: none;"></div>
                            
                            <!-- Animation: Scanner Line -->
                            <div style="position: absolute; top:0; bottom:0; width: 2px; background: linear-gradient(to bottom, transparent, #CCFF00, transparent); opacity: 0.2; animation: scanTicker 4s ease-in-out infinite; left: 0;"></div>
                            <style> @keyframes scanTicker { 0% { left: -10%; opacity:0; } 50% { opacity:0.3;} 100% { left: 110%; opacity:0; } } </style>

                            <!-- AI Status Node (Pulsing Sonar) -->
                            <div style="position: relative; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                                <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #CCFF00; opacity: 0.2; animation: sonarWave 2s infinite cubic-bezier(0, 0, 0.2, 1);"></div>
                                <div style="position: absolute; width: 60%; height: 60%; border-radius: 50%; background: #CCFF00; opacity: 0.4; animation: sonarWave 2s infinite cubic-bezier(0, 0, 0.2, 1) 0.5s;"></div>
                                <div style="width: 6px; height: 6px; background: #CCFF00; border-radius: 50%; box-shadow: 0 0 10px #CCFF00; z-index: 2;"></div>
                            </div>
                            <style> @keyframes sonarWave { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } } </style>
                            
                            <!-- Ticker Content Zone -->
                            <div id="header-ticker-text" style="flex: 1; overflow: hidden; position: relative; z-index: 2; height: 100%;">
                                 <!-- JS Injected -->
                            </div>
                        </div>

                        <!-- ACTIONS: ROBOT + NOTIFICATIONS -->
                        <div style="display: flex; gap: 6px; flex-shrink: 0;">
                            <!-- Captain Robot (Quick Access) -->
                            <div onclick="window.CaptainView.open()" style="
                                width: 44px; 
                                height: 44px; 
                                background: linear-gradient(145deg, #1e293b, #0f172a);
                                border: 1px solid rgba(255, 255, 255, 0.1); 
                                border-radius: 12px; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                cursor: pointer; 
                                box-shadow: 0 5px 15px -3px rgba(0,0,0,0.6);
                                position: relative;
                                transition: transform 0.2s;
                            " onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                                <i class="fas fa-robot" style="color: #CCFF00; font-size: 1.1rem; filter: drop-shadow(0 0 8px rgba(204,255,0,0.4)); animation: float 6s infinite ease-in-out;"></i>
                            </div>
                            
                            <!-- Notifications -->
                            <div onclick="window.NotificationUi.toggle()" style="
                                width: 44px; 
                                height: 44px; 
                                background: rgba(255, 255, 255, 0.03); 
                                backdrop-filter: blur(10px);
                                border: 1px solid rgba(255, 255, 255, 0.1); 
                                border-radius: 12px; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                cursor: pointer; 
                                position: relative;
                            ">
                                <i class="fas fa-bell" style="color: #94a3b8; font-size: 1.2rem; transition: color 0.3s;"></i>
                                <div id="notif-badge-bubble" style="
                                    position: absolute; 
                                    top: 10px; 
                                    right: 12px; 
                                    width: 8px; 
                                    height: 8px; 
                                    background: #FF2D55; 
                                    border-radius: 50%; 
                                    box-shadow: 0 0 10px #FF2D55;
                                    display: ${window.NotificationService?.unreadCount > 0 ? 'block' : 'none'};
                                "></div>
                            </div>
                        </div>
                    </div>




                    <!-- registration-widget-root -->
                    <div id="registration-widget-root" style="
                        background: #0a0a0a;
                        border-radius: 28px;
                        margin: 0px 8px 4px 8px !important;  
                        padding: 12px 4px 0px !important; 
                        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                        border: 1px solid rgba(255,255,255,0.05);
                        z-index: 10;
                        animation: floatUp 0.8s ease-out forwards;
                    ">
                        <div class="live-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px !important; padding: 0 14px;">
                            <div style="
                                background: #00E36D; 
                                color: #000; 
                                padding: 5px 14px; 
                                border-radius: 10px; 
                                font-size: 0.7rem; 
                                font-weight: 950; 
                                letter-spacing: 1px;
                                box-shadow: 0 4px 10px rgba(0,227,109,0.3);
                                text-transform: uppercase;
                            ">
                                NOTICIAS
                            </div>
                        </div>
                        
                        <div id="live-scroller-content" style="overflow: hidden; width: 100%; position: relative; cursor: grab;">
                            <style>
                                @keyframes marqueeNews {
                                    0% { transform: translate3d(0, 0, 0); }
                                    100% { transform: translate3d(-50%, 0, 0); }
                                }
                                .news-marquee-track {
                                    display: flex;
                                    gap: 12px;
                                    width: max-content;
                                    animation: marqueeNews 45s linear infinite;
                                    padding: 15px 15px 25px;
                                    will-change: transform;
                                    backface-visibility: hidden;
                                }
                                /* Only pause on desktop hover to avoid mobile sticking */
                                @media (hover: hover) {
                                    .news-marquee-track:hover {
                                        animation-play-state: paused;
                                    }
                                }
                                .registration-ticker-card {
                                    transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                                    flex-shrink: 0;
                                }
                            </style>
                            <div id="live-scroller-inner" class="news-marquee-track">
                                <!-- SKELETON PLACEHOLDERS -->
                                ${Array(4).fill(0).map(() => `
                                    <div style="min-width: 265px; height: 140px; background: rgba(0,0,0,0.03); border-radius: 18px; border: 1px solid rgba(0,0,0,0.05); overflow: hidden; position: relative; flex-shrink: 0;">
                                        <div style="position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transform: translateX(-100%); animation: skeletonShine 1.5s infinite;"></div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>




                    <!-- 3. NEW WEATHER WIDGET -->
                    <div id="weather-widget-root" style="margin: 2px 15px !important; animation: floatUp 0.8s ease-out forwards;">
                        <!-- Content loaded via JS -->
                    </div>

                    <!-- (Old Partner Synergy root removed to favor the new Predictive AI Engine) -->

                    <!-- 4. ACTIVIDAD RECIENTE -->
                    <div id="activity-feed-root" style="
                        background: rgba(10, 10, 20, 0.9);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(0, 227, 109, 0.2);
                        border-radius: 20px;
                        margin: 2px 15px !important;
                        padding: 12px !important;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                        animation: floatUp 0.85s ease-out forwards;
                    ">
                        <div style="font-weight:950; font-size:0.85rem; color:white; letter-spacing:-0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                            <i class="fas fa-rss" style="color: #00E36D; font-size: 1rem;"></i> ACTIVIDAD RECIENTE
                        </div>
                        <div id="activity-feed-content" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Content loaded via JS -->
                        </div>
                    </div>



                    <!-- 4. TECH HUB & NEWS (PREMIUM GLASS ENGINE) -->
                    <div id="noticias-banner-root" style="padding: 1px 15px !important; animation: floatUp 0.85s ease-out forwards; margin-bottom: 40px; margin-top: 2px;">
                        <div class="noticias-banner-premium" style="
                            background: rgba(15, 23, 42, 0.8); 
                            backdrop-filter: blur(20px);
                            border-radius: 32px; 
                            padding: 25px !important; 
                            color: #fff; 
                            position: relative; 
                            overflow: hidden; 
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255,255,255,0.05);
                            border: 1px solid rgba(204, 255, 0, 0.15);
                            transition: all 0.4s ease;
                        ">
                            <!-- Hexagon Background Pattern -->
                            <div style="position: absolute; right: -30px; top: -30px; font-size: 8rem; color: #CCFF00; opacity: 0.05; transform: rotate(-10deg); pointer-events: none;">
                                <i class="fas fa-layer-group"></i>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative; z-index: 2;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 10px; height: 10px; background: #00E36D; border-radius: 50%; box-shadow: 0 0 10px #00E36D;"></div>
                                    <span style="font-size: 0.8rem; font-weight: 950; letter-spacing: 2px; color: #00E36D; text-transform: uppercase;">TECH HUB</span>
                                </div>
                                <div style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1);">v4.0.5</div>
                            </div>
                            
                            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 1.3rem; margin: 0 0 12px 0; color: #fff; letter-spacing: -0.5px;">Ecosistema <span style="color: #CCFF00;">SomosPadel</span></h3>
                            <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.6; margin: 0 0 25px 0; font-weight: 500;">
                                Accede a herramientas de alto rendimiento diseñadas por y para jugadores de competición.
                            </p>
                            
                            <!-- Main Actions Grid -->
                             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; position: relative; z-index: 2;">
                                 <!-- TV LIVE -->
                                 <div onclick="window.Router.navigate('live')" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 20px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='#CCFF00'; this.style.boxShadow='0 0 20px rgba(204,255,0,0.2)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.boxShadow='none';">
                                    <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(204,255,0,0.1); border-radius: 50%; filter: blur(15px); animation: auraPulse 2s infinite;"></div>
                                    <i class="fas fa-satellite-dish" style="color: #CCFF00; font-size: 1.4rem; filter: drop-shadow(0 0 5px #CCFF00);"></i>
                                    <div>
                                        <div style="font-weight: 950; font-size: 0.8rem;">CENTER COURT</div>
                                        <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">LIVE STREAMING</div>
                                    </div>
                                </div>
                                <!-- CHAT SOS -->
                                <div onclick="window.Router.navigate('live')" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 18px; border-radius: 20px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.borderColor='#ef4444'; this.style.boxShadow='0 0 25px rgba(239,68,68,0.3)';" onmouseout="this.style.background='rgba(239, 68, 68, 0.05)'; this.style.borderColor='rgba(239, 68, 68, 0.2)'; this.style.boxShadow='none';">
                                    <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(239,68,68,0.2); border-radius: 50%; filter: blur(15px); animation: auraPulse 2s infinite linear;"></div>
                                    <i class="fas fa-comment-medical" style="color: #ef4444; font-size: 1.4rem; animation: pulseSOS 2s infinite; filter: drop-shadow(0 0 8px #ef4444);"></i>
                                    <div>
                                        <div style="font-weight: 950; font-size: 0.8rem; color: #ef4444;">CHAT TÁCTICO</div>
                                        <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">BOTÓN SOS ACTIVADO</div>
                                    </div>
                                </div>
                            </div>

                            <style>
                                @keyframes auraPulse {
                                    0% { transform: scale(1); opacity: 0.3; }
                                    50% { transform: scale(1.5); opacity: 0.1; }
                                    100% { transform: scale(1); opacity: 0.3; }
                                }
                            </style>

                            <style>
                                @keyframes pulseSOS {
                                    0% { opacity: 1; }
                                    50% { opacity: 0.5; }
                                    100% { opacity: 1; }
                                }
                            </style>

                            <!-- Secondary Actions -->
                            <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                                <button onclick="window.CaptainView.open()" style="flex: 2; background: #CCFF00; color: #000; border: none; padding: 15px; border-radius: 16px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 20px rgba(204, 255, 0, 0.2);">
                                    <i class="fas fa-robot"></i> CAPITÁN VIRTUAL
                                </button>
                                <button onclick="window.DashboardView.showChatInfo()" style="flex: 1; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 16px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
                                    GUÍA
                                </button>
                            </div>
                            
                            <!-- TECHNOLOGY FOOTER -->
                            <div onclick="window.open('presentation.html', '_blank')" style="background: linear-gradient(90deg, rgba(204, 255, 0, 0.05), transparent); border: 1px solid rgba(204, 255, 0, 0.1); border-radius: 20px; padding: 15px; cursor: pointer; transition: 0.3s; display: flex; justify-content: space-between; align-items: center;" onmouseover="this.style.background='rgba(204, 255, 0, 0.1)'; this.style.borderColor='rgba(204, 255, 0, 0.3)';" onmouseout="this.style.background='rgba(204, 255, 0, 0.05)'; this.style.borderColor='rgba(204, 255, 0, 0.1)';">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 38px; height: 38px; background: rgba(0,0,0,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(204, 255, 0, 0.2);">
                                        <i class="fas fa-microchip" style="color: #CCFF00;"></i>
                                    </div>
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-weight: 900; font-size: 0.75rem; letter-spacing: 0.5px;">CORE TECHNOLOGY</span>
                                        <span style="font-size: 0.65rem; color: #64748b; font-weight: 700;">Powered by Somospadel BCN</span>
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: #CCFF00; font-size: 0.8rem;"></i>
                            </div>
                        </div>
                    </div>

                    <!-- 5. PREDICTIVE SYNERGY (MOVED TO LAST POSITION) -->
                    <div id="predictive-synergy-root" style="margin: 12px 15px 40px !important; position: relative; z-index: 50; display: block !important; min-height: 100px;">
                        <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.3); font-weight: 800; background: rgba(0,0,0,0.2); border-radius: 24px;">
                            <i class="fas fa-brain fa-spin" style="margin-bottom: 10px; font-size: 1.5rem; color: #CCFF00;"></i><br>
                            Sincronizando Inteligencia Predictiva...
                        </div>
                    </div>

                    </div>
                </div>



        <style>
            @keyframes slowTicker {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .ticker-container {
                width: 100%;
                overflow: hidden;
                position: relative;
                mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            }
            .ticker-content {
                display: flex;
                gap: 12px;
                animation: slowTicker 25s linear infinite;
                width: max-content;
                padding: 10px 0;
            }
            .ticker-content:hover {
                animation-play-state: paused;
            }
            .dashboard-v2-container ::-webkit-scrollbar { display: none; }
        </style>
    `;

            // 3. ASYNC LOADING OF DATA-DEPENDENT COMPONENTS
            try {
                // Build context (Might take time)
                const context = await this.buildContext(user);

                // Load Widget Content
                this.loadLiveWidgetContent(context);

                // Populate Hero Section
                const heroRoot = document.getElementById('hero-section-root');
                if (heroRoot) {
                    heroRoot.innerHTML = this.renderSmartHero(context, userLevel);
                }

                // Load Partner Synergy Widget
                if (user && window.PartnerSynergyWidget) {
                    const synergyWidget = document.getElementById('predictive-synergy-root');
                    if (synergyWidget) synergyWidget.style.display = 'block';
                    // Optional: You could also keep the legacy one if needed, but it's redundant now.
                }

                // 2. Fetch Real Data for Weather Cards
                let weatherData = [];
                try {
                    if (window.WeatherService) {
                        weatherData = await window.WeatherService.getDashboardWeather();
                    }
                } catch (e) { console.error("Weather fetch failed", e); }

                // 2.2 Populate Weather Widget (Cards + Radar)
                const weatherRoot = document.getElementById('weather-widget-root');
                if (weatherRoot) {
                    let weatherHtml = '';

                    // Render Cards first
                    if (weatherData && weatherData.length > 0) {
                        weatherHtml += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 2px;">`;
                        weatherData.forEach(w => {
                            weatherHtml += this.renderWeatherCard(
                                w.name,
                                `${w.temp}°C`,
                                w.icon,
                                {
                                    wind: `${w.wind} km/h`,
                                    hum: `${w.humidity}%`,
                                    rain: `${w.rainProb}%`,
                                    uv: w.uv,
                                    pressure: w.pressure,
                                    visibility: w.visibility,
                                    intel: w.intelligence
                                },
                                w.isPropitious
                            );
                        });
                        weatherHtml += `</div>`;
                    } else {
                        weatherHtml += `
                            <div style="
                                text-align: center;
                                padding: 50px 20px;
                                background: #111;
                                border-radius: 24px;
                                border: 1px solid rgba(204,255,0,0.1);
                                position: relative;
                                overflow: hidden;
                                box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                            ">
                                <!-- Tech Radar Animation -->
                                <div style="
                                    position: absolute; top: 0; left: 0; width: 200%; height: 2px;
                                    background: linear-gradient(90deg, transparent, #CCFF00, transparent);
                                    animation: scannerMove 4s linear infinite;
                                    opacity: 0.3;
                                "></div>
                                
                                <i class="fas fa-radar-scan fa-spin" style="
                                    font-size: 3.5rem;
                                    color: #CCFF00;
                                    margin-bottom: 20px;
                                    opacity: 0.2;
                                    display: block;
                                "></i>
                                
                                <div style="
                                    color: white;
                                    font-size: 1.1rem;
                                    font-weight: 950;
                                    letter-spacing: -0.5px;
                                    text-transform: uppercase;
                                ">RADAR DE COMPATIBILIDAD <span style="color:#CCFF00;">EN ESPERA</span></div>
                                
                                <div style="
                                    color: rgba(255,255,255,0.4);
                                    font-size: 0.8rem;
                                    margin-top: 10px;
                                    font-weight: 600;
                                    max-width: 240px;
                                    margin: 10px auto 0;
                                ">Necesitamos más datos de nivel y victorias para calcular tu pareja perfecta.</div>

                                <style>
                                    @keyframes scannerMove {
                                        0% { transform: translateY(-50px); opacity: 0; }
                                        50% { opacity: 0.5; }
                                        100% { transform: translateY(200px); opacity: 0; }
                                    }
                                </style>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 2px;">
                                ${this.renderWeatherCard('EL PRAT', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                                ${this.renderWeatherCard('CORNELLÀ', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                            </div>`;
                    }

                    // Append Radar below
                    weatherHtml += `
                        <style>
                            @keyframes livePulse {
                                0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.7); transform: scale(1); opacity: 1; }
                                70% { box-shadow: 0 0 0 8px rgba(0, 227, 109, 0); transform: scale(1.2); opacity: 0.8; }
                                100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); transform: scale(1); opacity: 1; }
                            }
                            @keyframes borderFlow {
                                0% { border-color: rgba(255, 255, 255, 0.1); }
                                50% { border-color: rgba(255, 255, 255, 0.25); }
                                100% { border-color: rgba(255, 255, 255, 0.1); }
                            }
                        </style>
                        <div style="position: relative; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #0f172a; animation: borderFlow 4s infinite;">
                            <div style="background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-size:0.75rem; font-weight:950; color:white; letter-spacing:0.5px;">RADAR TÁCTICO <span style="color:#CCFF00;">WAR ROOM</span></span>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <button onclick="window.DashboardView.toggleTacticalHUD()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.3s; pointer-events: auto;">
                                        <i class="fas fa-eye"></i> TACTICAL HUD
                                    </button>
                                    <span style="width:8px; height:8px; background:#00E36D; border-radius:50%; animation: livePulse 2s infinite;"></span>
                                    <span style="font-size:0.6rem; color: #00E36D; font-weight: 900; letter-spacing:1px;">SCANNING</span>
                                </div>
                            </div>
                            <div style="width: 100%; height: 280px; position: relative;">
                                <iframe width="100%" height="100%" src="https://embed.windy.com/embed2.html?lat=41.320&lon=2.040&zoom=10&level=surface&overlay=radar&product=radar&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0" style="filter: contrast(1.1) brightness(0.8) grayscale(0.3);"></iframe>
                                
                                <!-- WAR ROOM TACTICAL OVERLAYS -->
                                <div style="pointer-events:none; position:absolute; inset:0; box-shadow: inset 0 0 50px rgba(0,0,0,0.8); background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(204,255,0,0.03) 100%);"></div>
                                
                                <!-- HUD TOP LEFT: Pista Status -->
                                <div id="tactical-hud-grip" style="position:absolute; top:15px; left:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-left:3px solid #00E36D; pointer-events:none; animation: floatUp 0.8s ease-out; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                    <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">ESTADO DE PISTA</div>
                                    <div style="font-size:0.75rem; color:#fff; font-weight:1000;">GRIP: <span style="color:#00E36D;">ÓPTIMO (92%)</span></div>
                                    <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Prob. Pista resbaladiza: 12%</div>
                                </div>

                                <!-- HUD TOP RIGHT: Rebote/Presión -->
                                <div id="tactical-hud-bounce" style="position:absolute; top:15px; right:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-right:3px solid #CCFF00; pointer-events:none; text-align:right; animation: floatUp 0.8s ease-out 0.2s both; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                    <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">INTELIGENCIA BOLA</div>
                                    <div style="font-size:0.75rem; color:#fff; font-weight:1000;">REBOTE: <span style="color:#CCFF00;">ALTO (+15%)</span></div>
                                    <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Bola rápida + Presión detectada</div>
                                </div>

                                <!-- HUD BOTTOM CENTER: Scan Line -->
                                <div style="position:absolute; bottom:0; left:0; width:100%; height:1px; background:#CCFF00; opacity:0.3; box-shadow: 0 0 10px #CCFF00; animation: scannerSlide 4s linear infinite;"></div>
                                
                                <style>
                                    @keyframes scannerSlide {
                                        0% { bottom: 0; opacity: 0; }
                                        10% { opacity: 0.5; }
                                        90% { opacity: 0.5; }
                                        100% { bottom: 100%; opacity: 0; }
                                    }
                                </style>
                            </div>
                        </div>
                    `;
                    weatherRoot.innerHTML = weatherHtml;
                    weatherRoot.style.display = 'block';
                }


                // PRO CONTENT (AGENDA) REMOVED PER USER REQUEST

            } catch (err) {
                console.error("Dashboard Render Error:", err);
            }

            // 4. INIT HEADER TICKER SYNC
            this.initHeaderTickerSync();

            // 5. FORCE LOAD NETWORK PULSE & STORIES
            if (window.StoryFeedWidget) {
                window.StoryFeedWidget.render('story-feed-root');
            }


        }

        initHeaderTickerSync() {
            // Aseguramos que el ticker global sea visible
            const globalTicker = document.querySelector('.ticker-container');
            if (globalTicker) globalTicker.style.display = 'flex';


            const updateTicker = (data) => {
                const tickerContainer = document.getElementById('header-ticker-text');
                if (!tickerContainer) return;

                // Stop previous interval
                if (tickerContainer._animInterval) {
                    clearInterval(tickerContainer._animInterval);
                    tickerContainer._animInterval = null;
                }

                // DATA PROCESSING STRATEGY: REAL SYSTEM STATUS
                let realItems = (data.items && data.items.length > 0) ? data.items : [];

                // AMBIENT FEED: FUNCTIONAL NAVIGATION TIPS (Always True)
                // Usamos mensajes genéricos que invitan a usar la app, sin inventar eventos específicos.
                const ambientItems = [
                    { id: 'amb-1', title: '🎾 SECCIÓN ENTRENAMIENTOS', body: 'Consulta los horarios y disponibilidad de clases.' },
                    { id: 'amb-2', title: '📅 AGENDA DE CLUB', body: 'Revisa los próximos eventos confirmados en el calendario.' },
                    { id: 'amb-3', title: '📈 TU PROGRESO', body: 'Entrena, compite y mejora tu posición en el ranking.' },
                    { id: 'amb-4', title: '💬 CHAT COMUNIDAD', body: 'Conecta con otros jugadores en la sala en vivo.' },
                    { id: 'amb-5', title: '🧬 SISTEMA ACTIVO', body: 'Monitorizando notificaciones y reservas en tiempo real.', isTactical: true }
                ];

                // MERGE: Real items take priority. Fill with guiding tips.
                let items = [...realItems];
                if (items.length < 5) {
                    const needed = 5 - items.length;
                    items = items.concat(ambientItems.slice(0, needed));
                }

                let currentIndex = 0;

                const getAction = (item) => {
                    // Combine Title and Body for smarter keyword detection
                    const content = (String(item.title || '') + ' ' + String(item.body || '')).toUpperCase();

                    if (content.includes('ENTRENO') || content.includes('CLASE') || content.includes('ESCUELA')) return "window.Router.navigate('entrenos')";
                    if (content.includes('BATSEÑAL') || content.includes('PLAZA') || item.isUrgent) return "window.Router.navigate('events')";
                    if (content.includes('RANKING') || content.includes('MVP') || content.includes('TOP')) return "window.Router.navigate('ranking')";
                    if (item.isChat || content.includes('CHAT') || content.includes('LIVE')) return "window.Router.navigate('live')";

                    return "window.NotificationUi.toggle()"; // Default: open drawer
                };

                const renderCurrentItem = () => {
                    const item = items[currentIndex];
                    const isTactical = item.isTactical;
                    const isUrgent = !isTactical && (String(item.title).includes('PLAZA LIBRE') || String(item.title).includes('BATSEÑAL') || item.isUrgent);
                    const action = getAction(item);

                    let badgeLabel = 'NEWS';
                    let badgeStyle = 'background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.3);';
                    let icon = '📰';
                    let glowEffect = '';

                    if (isTactical) {
                        badgeLabel = 'SYSTEM';
                        badgeStyle = 'background: rgba(204, 255, 0, 0.15); color: #CCFF00; border: 1px solid #CCFF00; box-shadow: 0 0 10px rgba(204, 255, 0, 0.3);';
                        icon = '⚙️';
                    } else if (isUrgent) {
                        badgeLabel = 'BREAKING';
                        badgeStyle = 'background: #FF003C; color: white; border: 1px solid #FF003C; box-shadow: 0 0 20px rgba(255, 0, 60, 0.6); animation: flashBadge 1s infinite;';
                        icon = '🚨';
                        glowEffect = 'text-shadow: 0 0 10px #FF003C;';
                    } else if (item.isChat) {
                        badgeLabel = 'LIVE CHAT';
                        badgeStyle = 'background: #0099FF; color: white; border: 1px solid #0099FF; box-shadow: 0 0 15px rgba(0, 153, 255, 0.5);';
                        icon = '💬';
                    } else {
                        badgeLabel = 'UPDATE';
                        badgeStyle = 'background: #00E36D; color: #000; border: 1px solid #00E36D; font-weight:900;';
                        icon = '🎾';
                    }

                    // Spectacle HTML
                    tickerContainer.innerHTML = `
                        <div onclick="${action}" style="
                            width:100%; 
                            height:100%; 
                            display:flex; 
                            align-items:center; 
                            justify-content:center; 
                            gap: 12px;
                            cursor: pointer;
                            position: relative;
                            overflow: hidden;
                        " class="ticker-slide-entry">
                            
                            <!-- PROGRESS BAR (TIMER) -->
                            <div style="position: absolute; bottom: 0; left: 0; height: 2px; background: #fff; width: 0%; animation: loadBar 5s linear forwards; opacity: 0.5;"></div>

                             <!-- BADGE AREA -->
                             <div style="
                                font-size: 0.65rem; 
                                font-weight: 800; 
                                padding: 4px 10px; 
                                border-radius: 4px; 
                                text-transform: uppercase; 
                                letter-spacing: 1px; 
                                display: flex; 
                                align-items: center; 
                                gap: 6px;
                                flex-shrink: 0;
                                transition: transform 0.2s;
                                ${badgeStyle}
                             ">
                                ${icon} ${badgeLabel}
                             </div>

                             <!-- CONTENT AREA -->
                             <div style="display:flex; flex-direction:column; justify-content: center; overflow:hidden; text-align:left;">
                                <div style="display:flex; align-items:center;">
                                    <span style="
                                        font-weight: 900; 
                                        color: #fff; 
                                        font-size: 0.9rem; 
                                        text-transform: uppercase; 
                                        letter-spacing: 0.5px; 
                                        font-family: 'Outfit';
                                        ${glowEffect}
                                    ">
                                        ${item.title} 
                                    </span>
                                    ${isUrgent ? '<span style="margin-left:8px; font-size:0.6rem; color:#FF003C; animation:blinkFast 0.5s infinite;">● LIVE</span>' : ''}
                                </div>
                                <div style="font-size:0.55rem; color:rgba(255,255,255,0.5); font-weight:600; letter-spacing:0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 200px;">
                                    ${item.body || 'Haz clic para más detalles'}
                                </div>
                             </div>
                             
                             <!-- HOVER HINT -->
                             <div style="position: absolute; right: 0; opacity: 0.3;">
                                <i class="fas fa-chevron-right" style="color:white; font-size: 0.8rem;"></i>
                             </div>
                        </div>
                        <style>
                            .ticker-slide-entry { animation: slideUpEnter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                            .ticker-slide-entry:active { transform: scale(0.98); }
                            @keyframes slideUpEnter {
                                0% { transform: translateY(20px); opacity: 0; }
                                100% { transform: translateY(0); opacity: 1; }
                            }
                            @keyframes loadBar { from { width: 0%; } to { width: 100%; } }
                            @keyframes flashBadge { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                            @keyframes blinkFast { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
                        </style>
                    `;
                };

                renderCurrentItem();

                if (items.length > 1 || items.length === 3) { // Force rotate even for default layout
                    tickerContainer._animInterval = setInterval(() => {
                        currentIndex = (currentIndex + 1) % items.length;
                        renderCurrentItem();
                    }, 5000);
                }
            };

            // 2. Lógica de sincronización robusta
            if (window.NotificationService) {
                const refresh = () => {
                    console.log("📺 [Ticker] Sincronizando noticias (Chat + Apps)...");
                    const data = {
                        items: window.NotificationService.getMergedNotifications(),
                        count: window.NotificationService.unreadCount
                    };
                    updateTicker(data);
                };

                // Suscripción única global
                if (!window._tickerSubscribed) {
                    window.NotificationService.onUpdate(() => {
                        if (window.Router?.currentRoute === 'dashboard') refresh();
                    });
                    window._tickerSubscribed = true;
                }

                // Forzar actualización inmediata tras render de vista
                setTimeout(refresh, 200);
            }
        }


        renderWeatherCard(city, temp, icon, details = {}, isPropitious = true) {
            const intel = details.intel || { score: 100, ballSpeed: '--', recommendation: 'Sincronizando meteorología...', gripStatus: '--' };
            const statusLabel = isPropitious ? 'ÓPTIMO' : 'ADVERSO';
            const statusColor = isPropitious ? '#00E36D' : '#FF2D55';
            const rainProb = parseInt(details.rain) || 0;
            const isRaining = rainProb > 30;

            // 1. DYNAMIC BACKGROUND & EFFECTS
            let cardBg = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
            let weatherOverlay = '';

            if (isRaining) {
                // Stormy / Rainy Vibe
                cardBg = 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)';
                weatherOverlay = `
                    <div style="position: absolute; inset: 0; pointer-events: none; opacity: 0.4;">
                        <div style="
                            position: absolute; inset: -100% 0 0 0;
                            background-image: linear-gradient(to bottom, rgba(59,130,246,0) 0%, rgba(59,130,246,0.4) 50%, rgba(59,130,246,0) 100%);
                            background-size: 2px 50px;
                            animation: rainFall 0.6s linear infinite;
                        "></div>
                    </div>
                `;
            } else if (isPropitious) {
                // Sunny / Nice Vibe
                cardBg = 'linear-gradient(135deg, #3f6212 0%, #022c22 100%)';
                weatherOverlay = `
                    <div style="position: absolute; top: -60px; right: -60px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(253, 224, 71, 0.15) 0%, transparent 70%); filter: blur(20px); animation: sunPulse 6s ease-in-out infinite; pointer-events: none;"></div>
                `;
            } else {
                cardBg = 'linear-gradient(135deg, #334155 0%, #0f172a 100%)';
            }

            return `
                <style>
                    @keyframes rainFall { 0% { transform: translateY(0); } 100% { transform: translateY(100%); } }
                    @keyframes sunPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
                    @keyframes textSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                </style>
                <div style="
                    background: ${cardBg};
                    background-size: 200% 200%;
                    animation: cardShine 10s ease infinite;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 32px;
                    padding: 24px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    position: relative;
                    overflow: hidden;
                    min-height: 280px;
                ">
                    ${weatherOverlay}
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
                        <div style="font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3)); animation: weatherFloat 5s ease-in-out infinite;">${icon}</div>
                        <div style="text-align: right;">
                            <div style="background: rgba(0,0,0,0.3); color: ${statusColor}; padding: 6px 14px; border-radius: 12px; font-size: 0.65rem; font-weight: 950; border: 1px solid ${statusColor}40; margin-bottom: 6px; box-shadow: 0 0 15px ${statusColor}20; backdrop-filter: blur(4px);">${statusLabel}</div>
                            <div style="font-size: 0.6rem; color: white; opacity: 0.6; font-weight: 800; letter-spacing: 1px;">SCORE ${intel.score}%</div>
                        </div>
                    </div>
                    <div style="position: relative; z-index: 2; margin-top: 10px; animation: textSlideIn 0.5s ease-out;">
                        <div style="color: white; font-weight: 950; font-size: 2.8rem; line-height: 0.9; letter-spacing: -2px; text-shadow: 0 5px 10px rgba(0,0,0,0.5);">${temp}</div>
                        <div style="color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">${city}</div>
                    </div>
                    <div style="margin-top: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 15px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 2; backdrop-filter: blur(5px); animation: textSlideIn 0.7s ease-out;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-bolt" style="color:#fbbf24;"></i> VELOCIDAD BOLA</span>
                            <span style="font-size: 0.7rem; color: #fbbf24; font-weight: 950; text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);">${intel.ballSpeed}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-wind" style="color:#0ea5e9;"></i> VIENTO</span>
                            <span style="font-size: 0.7rem; color: white; font-weight: 900;">${details.wind || '--'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-tint" style="color:#38bdf8;"></i> HUMEDAD</span>
                            <span style="font-size: 0.7rem; color: white; font-weight: 900;">${details.hum || '--'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-hand-rock" style="color:#00E36D;"></i> AGARRE PISTA</span>
                            <span style="font-size: 0.7rem; color: #00E36D; font-weight: 950;">${intel.gripStatus || 'ÓPTIMO'}</span>
                        </div>
                    </div>

                    <!-- TACTICAL INSIGHT -->
                    <div style="margin-top: 12px; padding: 12px 14px; background: rgba(0,0,0,0.2); border-radius: 16px; border-left: 3px solid ${statusColor}; animation: textSlideIn 0.8s ease-out;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
                            <i class="fas fa-brain" style="font-size: 0.65rem; color: ${statusColor}; opacity: 0.9;"></i>
                            <span style="font-size: 0.55rem; font-weight: 950; color: ${statusColor}; letter-spacing: 0.5px; text-transform: uppercase;">INSIGHT TÁCTICO</span>
                        </div>
                        <p style="margin: 0; font-size: 0.7rem; color: rgba(255,255,255,0.7); font-weight: 600; line-height: 1.4;">
                            ${intel.recommendation.replace('la IA', 'el sistema').replace('predictivo', 'estimado')}
                        </p>
                    </div>
                </div>
            `;
        }

        renderAgendaWidget(myEvents) {
            if (myEvents.length === 0) {
                return `
                    <div style="min-width: 100%; background: var(--bg-card); border-radius: 32px; padding: 50px 30px; text-align: center; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg);">
                        <div style="width: 80px; height: 80px; background: var(--bg-app); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; border: 1px solid var(--border-subtle);">
                            <i class="fas fa-calendar-plus" style="font-size: 2.2rem; color: #cbd5e1;"></i>
                        </div>
                        <h3 style="color: var(--text-primary); font-weight: 950; font-size: 1.25rem; margin-bottom: 10px; letter-spacing: -0.5px;">SIN PLANES PRÓXIMOS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 25px; font-weight: 600; line-height: 1.5;">Apúntate a una americana para<br>empezar a sumar en el ranking.</p>
                        <button onclick="Router.navigate('americanas')" class="btn-3d primary" style="width: auto; padding: 14px 28px;">EXPLORAR EVENTOS</button>
                    </div>
                `;
            }

            return myEvents.map(am => `
                <div class="agenda-card" onclick="window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" style="min-width: 280px; background: var(--bg-card); border-radius: 32px; border: 1px solid var(--border-subtle); padding: 24px; scroll-snap-align: center; position: relative; box-shadow: var(--shadow-md); transition: all 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div style="color: var(--brand-neon); background: var(--brand-navy); padding: 4px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">${this.formatDateShort(am.date)}</div>
                        ${am.status === 'live' ?
                    `<div style="background: rgba(255, 45, 85, 0.2); color: #FF2D55; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; animation: blink 1s infinite; border: 1px solid #FF2D55;">EN VIVO 🔴</div>` :
                    `<div style="background: rgba(6, 182, 212, 0.1); color: var(--brand-accent); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900;">CONFIRMADO</div>`
                }
                    </div>
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 1.3rem; font-weight: 950; letter-spacing: -0.5px; line-height: 1.2;">${am.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--border-subtle);">
                        <span style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 800;"><i class="far fa-clock" style="color: var(--brand-neon); margin-right: 8px;"></i> ${am.time}</span>
                        <div style="width: 36px; height: 36px; background: var(--brand-navy); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem; box-shadow: var(--shadow-sm);">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        renderSmartHero(context, userLevel) {
            // SLIDE: VIBRANT GLASS HERO
            let pillText = "INSCRIPCIÓN ABIERTA";
            let btnText = "APUNTARME AHORA";
            let btnClass = "primary";
            let logoText = "AMERICANAS";
            let explainerText = "¡Quedan pocas plazas! No te quedes fuera hoy.";
            let heroImage = "img/ball_hero.jpg";
            let overlayColor = "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 64, 175, 0.7))";

            if (context.status === 'UPCOMING_EVENT') {
                pillText = "ESTÁS INSCRITO";
                btnText = "VER DETALLES";
                btnClass = "navy";
                logoText = "MI PLAZA";
                explainerText = "¡Prepárate! Tu próximo reto está a punto de empezar.";
                overlayColor = "linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(6, 182, 212, 0.7))";
            } else if (context.status === 'FINISHED') {
                pillText = "EVENTO FINALIZADO";
                btnText = "VER RESUMEN";
                btnClass = "secondary";
                logoText = "HISTORY";
                explainerText = "Consulta los resultados y revive los mejores momentos.";
                overlayColor = "linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(107, 114, 128, 0.7))";
            } else if (context.status === 'LIVE_MATCH') {
                pillText = "¡ESTÁS EN PISTA!";
                btnText = "MARCADOR EN VIVO";
                btnClass = "primary";
                logoText = "LIVE NOW";
                explainerText = "Tu partido está en progreso. ¡A por todas!";
                overlayColor = "linear-gradient(135deg, rgba(225, 29, 72, 0.95), rgba(204, 255, 0, 0.4))";
            }

            return `
                <div class="vibrant-hero-card" onclick="Router.navigate('live')" style="background: ${overlayColor}; backdrop-filter: var(--backdrop-blur); border-radius: 32px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 0; margin-bottom: 30px; overflow: hidden; box-shadow: var(--shadow-xl); position: relative;">
                    <div style="height: 160px; background: url('${heroImage}') center/cover; position: relative;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.6));"></div>
                        <div style="position: absolute; top: 20px; left: 20px; background: var(--brand-neon); padding: 6px 16px; border-radius: 12px; font-weight: 950; color: #000; font-size: 0.75rem; box-shadow: var(--shadow-neon); letter-spacing: 1px;">
                            ${pillText}
                        </div>
                    </div>

                    <div style="padding: 28px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0; font-size: 0.8rem; font-weight: 900; color: var(--brand-neon); text-transform: uppercase; letter-spacing: 2px;">${logoText}</h4>
                                <h2 style="margin: 8px 0 0; font-size: 1.8rem; font-weight: 950; line-height: 1.1; letter-spacing: -0.5px;">${context.eventName || 'Americana Hoy'}</h2>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.3rem; font-weight: 950; color: var(--brand-neon);">${context.eventTime || context.matchTime || '18:00'}</div>
                                <div style="font-size: 0.75rem; font-weight: 700; opacity: 0.7; letter-spacing: 1px;">${context.matchDay || 'HOY'}</div>
                            </div>
                        </div>

                        <p style="margin: 20px 0 25px; font-size: 0.95rem; color: rgba(255,255,255,0.9); line-height: 1.5; font-weight: 500;">
                            ${explainerText}
                        </p>

                        <button class="btn-3d ${btnClass}" style="margin-top: 0; font-size: 1.1rem; height: 60px;">
                            ${btnText} <i class="fas fa-chevron-right" style="margin-left: 10px; font-size: 0.9rem;"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        async renderLiveWidget(context) {
            try {
                // 1. DATA GATHERING (INTEL) - Fresh fetch for real-time accuracy
                const [allEvents, weatherData] = await Promise.all([
                    window.AmericanaService ? window.AmericanaService.getAllActiveEvents() : [],
                    window.WeatherService ? window.WeatherService.getDashboardWeather() : []
                ]);

                console.log(`🧠 [AI News Motor] Processing ${allEvents.length} events for priority feed.`);

                let itemsHtml = [];

                // A. WEATHER INTEL CARD (VISION 2026 UPGRADE)
                if (weatherData && weatherData[0]) {
                    const w = weatherData[0];
                    itemsHtml.push(`
                        <div class="registration-ticker-card" style="min-width: 280px; height: 160px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 24px; padding: 18px; flex-shrink: 0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05);">
                            <div style="position: absolute; right: -20px; bottom: -20px; font-size: 7rem; opacity: 0.1; filter: blur(2px); animation: weatherFloat 6s ease-in-out infinite;">${w.icon}</div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; position: relative; z-index: 2;">
                                <span style="font-size:0.6rem; font-weight:1000; color:white; background:rgba(59, 130, 246, 0.8); padding:5px 12px; border-radius:8px; letter-spacing:1px; box-shadow: 0 0 15px rgba(59,130,246,0.3); text-transform:uppercase;">METEO INTEL</span>
                                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                    <span style="font-size:1.8rem;">${w.icon}</span>
                                    <span style="font-size:0.5rem; color:#CCFF00; font-weight:950; margin-top:-5px;">WAR ROOM DATA</span>
                                </div>
                            </div>
                            <div style="position: absolute; bottom: 18px; left: 18px; z-index: 2;">
                                <div style="color:white; font-weight:950; font-size:1.8rem; line-height: 1; margin-bottom: 2px;">${w.temp}ºC</div>
                                <div style="color:rgba(255,255,255,0.6); font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:1px;">${w.name}</div>
                            </div>
                            <div style="position: absolute; bottom: 18px; right: 18px; z-index: 2; text-align: right; display:flex; flex-direction:column; gap:6px;">
                                <div style="font-size:0.55rem; color:rgba(255,255,255,0.8); font-weight:950; background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:4px; border-right:2px solid #0ea5e9;">BOLA: ${w.temp > 20 ? 'RÁPIDA' : 'LENTA'}</div>
                                <div style="font-size:0.55rem; color:rgba(255,255,255,0.8); font-weight:950; background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:4px; border-right:2px solid #38bdf8;">HUM: ${w.humidity}%</div>
                            </div>
                        </div>
                    `);
                }

                // B. DYNAMIC CLIPS & TIPS (AI Motor Expanded Pool)
                const dynamicPool = [
                    {
                        tag: '📈 TU NIVEL',
                        icon: 'fa-chart-line',
                        bgColor: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                        accent: '#38bdf8',
                        title: 'Nivel Dinámico',
                        desc: 'Tu nivel evoluciona con cada set. ¡Juega y demuestra tu progreso!'
                    },
                    {
                        tag: '🏆 COMPETICIÓN',
                        icon: 'fa-trophy',
                        bgColor: 'linear-gradient(135deg, #111 0%, #701a75 100%)',
                        accent: '#f472b6',
                        title: 'Puntos y Ascensos',
                        desc: 'Gana partidos para subir de pista y alcanzar el Top 1 del Ranking.'
                    },
                    {
                        tag: '🎾 CONTROL TOTAL',
                        icon: 'fa-user-check',
                        bgColor: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
                        accent: '#34d399',
                        title: 'Perfil y Stats',
                        desc: 'Consulta tu historial, victorias y próximos retos desde tu perfil.'
                    },
                    {
                        tag: '🛍️ TIENDA VIP',
                        icon: 'fa-shopping-bag',
                        bgColor: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
                        accent: '#818cf8',
                        title: 'SomosPadel Store',
                        desc: 'Los mejores precios en palas de alta gama y equipación oficial.'
                    },
                    {
                        tag: '🔔 ALERTAS LIVE',
                        icon: 'fa-bell',
                        bgColor: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
                        accent: '#a78bfa',
                        title: 'Notificaciones',
                        desc: 'Recibe avisos de cambios de pista y resultados al instante.'
                    },
                    {
                        tag: '💡 SMART TIP',
                        icon: 'fa-brain',
                        bgColor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        accent: '#94a3b8',
                        title: 'Navegación Gesto',
                        desc: 'Desliza las historias o pulsa los laterales para pasar rápido.'
                    },
                    {
                        tag: '⚡ PRO TIP',
                        icon: 'fa-bolt',
                        bgColor: 'linear-gradient(135deg, #451a03 0%, #92400e 100%)',
                        accent: '#fbbf24',
                        title: 'Saque Táctico',
                        desc: 'Busca el cristal en el segundo saque para generar más errores.'
                    },
                    {
                        tag: '👥 SOCIAL',
                        icon: 'fa-users',
                        bgColor: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        accent: '#a5b4fc',
                        title: 'Chat de Grupo',
                        desc: 'Conecta con otros jugadores y organiza partidos rápidamente.'
                    },
                    {
                        tag: '🔥 RANKING LIVE',
                        icon: 'fa-fire',
                        bgColor: 'linear-gradient(135deg, #4c0519 0%, #9f1239 100%)',
                        accent: '#fb7185',
                        title: 'Ascenso Diario',
                        desc: 'El ranking se actualiza cada hora. ¡No dejes de competir!'
                    }
                ];

                // --- AI MOTOR: PRIORITY & SHUFFLE LOGIC ---
                // 1. First, Events (Highest Priority)
                // Filter only OPEN events for registration focus
                const openEvents = allEvents
                    .filter(a => ['open', 'upcoming'].includes(a.status))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                // A. FEATURED EVENT PROMO (Always first if there are open events)
                if (openEvents.length > 0) {
                    const topEvt = openEvents[0];
                    itemsHtml.push(`
                        <div class="registration-ticker-card" onclick="Router.navigate('entrenos')" 
                            style="min-width: 280px; width: 280px; height: 160px; 
                            background: linear-gradient(135deg, #00FF41 0%, #008f45 100%); 
                            border-radius: 28px; padding: 20px; flex-shrink: 0; 
                            box-shadow: 0 15px 35px rgba(0,255,65,0.3); 
                            position: relative; overflow: hidden; cursor: pointer; border: 2px solid #00FF41; 
                            transition: all 0.4s; z-index: 10;">
                            
                            <!-- MATRIX DECORATION -->
                            <div style="position: absolute; top:0; left:0; width:100%; height:100%; opacity: 0.1; font-family: monospace; font-size: 0.5rem; line-height: 1; pointer-events: none;">
                                01010101101010101010101010101010<br>10101010101101010101010101010101<br>01010101101010101010101010101010
                            </div>

                            <div style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:3; margin-bottom: 12px;">
                                <span style="font-size:0.6rem; font-weight:1000; color:black; background:#fff; padding:4px 12px; border-radius:100px; text-transform:uppercase; letter-spacing:1px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">🔥 ÚLTIMAS PLAZAS</span>
                                <i class="fas fa-bolt" style="color:white; animation: pulseDot 1s infinite;"></i>
                            </div>
                            
                            <div style="position:relative; z-index:3;">
                                <div style="color:white; font-size:0.65rem; font-weight:800; opacity:0.9; text-transform:uppercase; letter-spacing:1px;">NUEVO EVENTO</div>
                                <h4 style="margin:2px 0; color:white; font-size:0.95rem; font-weight:1000; line-height:1.2; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; max-height: 2.4em;">${topEvt.name.toUpperCase()}</h4>
                                <div style="font-size: 0.8rem; color: #fff; font-weight: 900; background:rgba(0,0,0,0.2); display:inline-block; padding:4px 10px; border-radius:8px; margin-top:5px;">
                                    🚀 ¡APÚNTATE YA!
                                </div>
                            </div>
                        </div>
                    `);
                }

                // 1.B Individual Event Cards (The rest)
                openEvents.slice(1).forEach(am => {
                    let catColor = '#00E36D';
                    const lowerName = am.name.toLowerCase();
                    if (lowerName.includes('femenin') || lowerName.includes('female') || am.category === 'female') catColor = '#FF2D55';
                    else if (lowerName.includes('mixt') || lowerName.includes('mix') || am.category === 'mixed') catColor = '#FFD700';
                    else if (lowerName.includes('masculin') || lowerName.includes('male') || am.category === 'male') catColor = '#00C4FF';

                    const categoryIcon = am.category === 'female' ? '♀️' : (am.category === 'male' ? '♂️' : '🎾');

                    itemsHtml.push(`
                        <div class="registration-ticker-card" onclick="Router.navigate('entrenos')" 
                            style="min-width: 240px; width: 240px; height: 160px; 
                            background: linear-gradient(135deg, ${catColor}, ${catColor}cc); 
                            border-radius: 28px; padding: 18px; flex-shrink: 0; 
                            box-shadow: 0 10px 25px ${catColor}40; 
                            position: relative; overflow: hidden; cursor: pointer; border: 1.5px solid rgba(255,255,255,0.2); 
                            transition: all 0.4s;">
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-10deg); font-size: 8rem; opacity: 0.1; filter: blur(2px);">${categoryIcon}</div>
                            <div style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:3; margin-bottom: 12px;">
                                <span style="font-size:0.55rem; font-weight:1000; color:white; background:rgba(0,0,0,0.3); padding:4px 10px; border-radius:100px; text-transform:uppercase; border: 1px solid rgba(255,255,255,0.2);">ABIERTO</span>
                                <span style="font-size:0.55rem; color:rgba(255,255,255,0.8); font-weight:950; letter-spacing:1px;">${this.formatDateShort(am.date)}</span>
                            </div>
                            <div style="position:relative; z-index:3;">
                                <h4 style="margin:0; color:white; font-size:0.9rem; font-weight:1000; line-height:1.2; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${am.name}</h4>
                                <div style="display:flex; align-items:center; gap:8px; margin-top:10px;">
                                    <span style="font-size:0.75rem; color:white; font-weight:900; background:rgba(0,0,0,0.2); padding:2px 8px; border-radius:5px;">REGISTRAR →</span>
                                </div>
                            </div>
                        </div>
                    `);
                });

                // 2. Add Dynamic Tips to fill up to 7-8 cards maximum
                const maxCards = 8;
                const remainingSlots = Math.max(0, maxCards - itemsHtml.length);

                // Shuffle the dynamic pool to ensure variety on every load
                const shuffledPool = [...dynamicPool].sort(() => 0.5 - Math.random());
                const selectedTips = shuffledPool.slice(0, remainingSlots);

                selectedTips.forEach((tip, idx) => {
                    const isAiPick = idx === 0; // The top pick by our "shuffling motor"
                    const aiBadge = isAiPick ? `<div style="position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px; font-size:0.5rem; color:rgba(255,255,255,0.5); font-weight:900; letter-spacing:1px; border:0.5px solid rgba(255,255,255,0.1);"><i class="fas fa-sparkles" style="margin-right:4px;"></i>TOP PICK</div>` : '';

                    itemsHtml.push(`
                        <div class="registration-ticker-card" style="min-width: 240px; width: 240px; height: 160px; background: ${tip.bgColor}; border-radius: 24px; padding: 20px; flex-shrink: 0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                            ${aiBadge}
                            <div style="position: absolute; right: -25px; bottom: -25px; font-size: 8rem; opacity: 0.08; filter: blur(3px);"><i class="fas ${tip.icon}"></i></div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; position: relative; z-index: 2;">
                                <span style="font-size:0.6rem; font-weight:1000; color:white; background:rgba(0,0,0,0.4); padding:4px 10px; border-radius:10px; border:1px solid ${tip.accent}80; letter-spacing:1px; white-space:nowrap;">${tip.tag}</span>
                                <div style="width:30px; height:30px; background:${tip.accent}20; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                    <i class="fas ${tip.icon}" style="color:${tip.accent}; font-size:1rem;"></i>
                                </div>
                            </div>
                            <div style="margin-top:20px; position:relative; z-index:2;">
                                <div style="color:white; font-weight:1000; font-size:1.1rem; margin-bottom:6px; letter-spacing:-0.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${tip.title}</div>
                                <div style="color:rgba(255,255,255,0.7); font-size:0.75rem; font-weight:600; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${tip.desc}</div>
                            </div>
                        </div>
                    `);
                });

                const scroller = document.getElementById('live-scroller-inner');
                const html = itemsHtml.join('');
                if (scroller) {
                    // Duplicamos el contenido para el loop infinito del marquee
                    scroller.innerHTML = html + html;
                }
                return html;
            } catch (err) {
                console.error("renderLiveWidget Error:", err);
                return '';
            }
        }

        formatDateShort(dateString) {
            if (!dateString) return 'HOY';
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === today.toDateString()) return 'HOY';
            if (date.toDateString() === tomorrow.toDateString()) return 'MAÑANA';

            const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
            return `${days[date.getDay()]} ${date.getDate()}`;
        }

        async buildContext(user) {
            const context = {
                status: 'EMPTY',
                eventName: null,
                eventDate: null,
                eventTime: null,
                court: null,
                opponents: null,
                partner: null,
                eventDateRaw: null,
                hasMatchToday: false,
                hasOpenTournament: false,
                activeTournaments: 0,
                upcomingMatches: 0,
                myEvents: []
            };

            try {
                if (window.AmericanaService) {
                    const allAmericanas = await window.AmericanaService.getActiveAmericanas();
                    if (!allAmericanas || allAmericanas.length === 0) return context;

                    // 1. Check for Active Tournaments (for ActionGrid badges)
                    const openAmericanas = allAmericanas.filter(a => ['open', 'upcoming', 'scheduled'].includes(a.status));
                    context.activeTournaments = openAmericanas.length;
                    context.hasOpenTournament = openAmericanas.length > 0;

                    if (user) {
                        // 2. Check for User's Matches
                        context.myEvents = allAmericanas.filter(a => {
                            const players = a.players || a.registeredPlayers || [];
                            return players.some(p => p === user.uid || (p.uid === user.uid) || (p.id === user.uid));
                        });

                        context.upcomingMatches = context.myEvents.filter(a => a.status !== 'finished').length;

                        // ONLY focus on events that are NOT finished
                        const myEvent = context.myEvents.find(e => !['finished', 'closed'].includes(e.status));

                        if (myEvent) {
                            const now = new Date();
                            const eventDate = new Date(myEvent.date);
                            const isToday = eventDate.toDateString() === now.toDateString();

                            if (myEvent.status === 'live' || (myEvent.status === 'scheduled' && isToday)) {
                                context.status = 'LIVE_MATCH';
                                context.hasMatchToday = true;
                                context.eventName = myEvent.name;
                                context.matchTime = myEvent.time;
                                context.matchDay = 'HOY';
                                context.court = myEvent.court || 'Pista 1';
                            } else {
                                context.status = 'UPCOMING_EVENT';
                                context.eventName = myEvent.name;
                                context.eventTime = myEvent.time || '18:00';
                                context.matchDay = this.formatDate(myEvent.date);
                            }
                        } else {
                            // No active events, just show default or nothing
                            context.status = 'EMPTY';
                        }
                    }
                }
            } catch (e) {
                console.warn("Context build failed", e);
            }
            return context;
        }

        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return `${days[date.getDay()]} ${date.getDate()}`;
        }

        async loadLiveWidgetContent(context) {
            console.log("🧠 [DashboardView] loadLiveWidgetContent started");

            // 4. Load Predictive Synergy Widget
            try {
                const synergyContainer = document.getElementById('predictive-synergy-root');
                // Use Store OR global backup OR Firebase Auth directly as last resort
                const user = (window.Store ? window.Store.getState('currentUser') : null) ||
                    window.currentUser ||
                    (window.firebase ? window.firebase.auth().currentUser : null);

                console.log("🧠 [DashboardView] Synergy Init Check:", {
                    hasContainer: !!synergyContainer,
                    hasUser: !!user,
                    userId: user ? (user.uid || user.id) : 'none'
                });

                if (synergyContainer && user) {
                    const userId = user.uid || user.id;
                    if (!userId) {
                        console.warn("⚠️ [DashboardView] User exists but has no UID/ID");
                        synergyContainer.innerHTML = `<div style="padding:20px; color:rgba(255,255,255,0.4); text-align:center;">⚠️ Sesión incompleta</div>`;
                        return;
                    }

                    // Subscribe to real-time changes
                    if (window.PartnerSynergyService && window.PartnerSynergyService.subscribeToPlayerData) {
                        window.PartnerSynergyService.subscribeToPlayerData(userId, async () => {
                            console.log("🧠 [DashboardView] Real-time Sync Triggered");
                            const html = await this.renderPredictiveSynergy();
                            if (html && synergyContainer) synergyContainer.innerHTML = html;
                        });
                    }

                    // Initial render
                    const refreshSynergy = async () => {
                        const html = await this.renderPredictiveSynergy();
                        if (html && html.trim() !== '') {
                            console.log("🧠 [DashboardView] Synergy HTML generated");
                            if (synergyContainer) synergyContainer.innerHTML = html;
                        } else {
                            console.warn("🧠 [DashboardView] Synergy HTML was empty");
                            if (synergyContainer) synergyContainer.innerHTML = `<div style="padding:20px; color:rgba(255,255,255,0.4); text-align:center; border:1px solid rgba(255,0,0,0.3); border-radius:15px;">⚠️ Generando análisis...</div>`;
                        }
                    };

                    refreshSynergy();
                } else if (!synergyContainer) {
                    console.error("❌ [DashboardView] predictive-synergy-root NOT FOUND");
                } else if (!user) {
                    console.warn("⚠️ [DashboardView] No user found in Store during loadLiveWidgetContent");
                    // Don't show the "Lock" message immediately if we just loaded, give it a second
                    setTimeout(() => {
                        const userCheck = (window.Store ? window.Store.getState('currentUser') : null) || window.currentUser;
                        if (!userCheck && synergyContainer) {
                            synergyContainer.innerHTML = `<div style="padding:20px; color:rgba(255,255,255,0.4); text-align:center;">🔒 Inicia sesión para ver tu análisis</div>`;
                        }
                    }, 2000);
                }
            } catch (e) {
                console.error("❌ Predictive Synergy loading failed", e);
            }

            const container = document.getElementById('live-scroller-content');
            if (!container) {
                console.warn("⚠️ [DashboardView] live-scroller-content not found, skipping other widgets");
                return;
            }

            try {
                // 1. Load Registration Cards (Intelligent Ticker)
                this.renderLiveWidget(context);

                // 3. Load Activity Feed
                const activityContainer = document.getElementById('activity-feed-content');
                if (activityContainer) {
                    this.renderActivityFeed().then(html => {
                        activityContainer.innerHTML = html;
                    }).catch(e => {
                        console.error("Activity Feed failed", e);
                    });
                }
            } catch (e) {
                console.error('❌ [DashboardView] Error in core widget loading:', e);
            }
        }

        async renderActivityFeed() {
            try {
                if (!document.getElementById('activity-feed-styles')) {
                    const style = document.createElement('style');
                    style.id = 'activity-feed-styles';
                    style.textContent = `
                        @keyframes timelinePulse {
                            0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.4); }
                            70% { box-shadow: 0 0 0 10px rgba(0, 227, 109, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); }
                        }
                        @keyframes showtimeSlide {
                            0% { opacity: 0; transform: translateX(-30px) skewX(-15deg) scale(0.8); filter: brightness(3) blur(10px); }
                            70% { transform: translateX(5px) skewX(0deg) scale(1.05); filter: brightness(1.2) blur(0px); }
                            100% { opacity: 1; transform: translateX(0) skewX(0deg) scale(1); filter: brightness(1) blur(0px); }
                        }
                        @keyframes glint {
                            0% { left: -100%; }
                            20% { left: 100%; }
                            100% { left: 100%; }
                        }
                        .activity-timeline-line {
                            position: absolute;
                            left: 24px;
                            top: 10px;
                            bottom: 10px;
                            width: 2px;
                            background: linear-gradient(to bottom, transparent, rgba(0,227,109,0.3), transparent);
                        }
                        .activity-glass-card {
                            background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 12px;
                            padding: 16px 18px 16px 50px;
                            position: relative;
                            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                            cursor: pointer;
                            overflow: hidden;
                            margin-bottom: 2px;
                        }
                        .activity-glass-card::before {
                            content: '';
                            position: absolute;
                            top: 0; left: -100%;
                            width: 100%; height: 100%;
                            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                            animation: glint 5s infinite linear;
                        }
                        /* Look "TV Show" Scanlines */
                        .activity-glass-card::after {
                            content: '';
                            position: absolute;
                            inset: 0;
                            background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 2px);
                            pointer-events: none;
                        }
                        .activity-glass-card:hover {
                            background: rgba(255, 255, 255, 0.12);
                            transform: scale(1.03) translateX(10px) rotate(-0.5deg);
                            border-color: rgba(204, 255, 0, 0.5);
                            box-shadow: -10px 10px 30px rgba(0,0,0,0.5);
                        }
                        .activity-dot {
                            position: absolute;
                            left: 17px;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 14px;
                            height: 14px;
                            border-radius: 4px;
                            z-index: 2;
                            border: 2px solid #000;
                            box-shadow: 0 0 15px currentColor;
                        }
                        .activity-impact-badge {
                            position: absolute;
                            top: 0; left: 0;
                            width: 4px; height: 100%;
                            background: currentColor;
                            box-shadow: 0 0 15px currentColor;
                        }
                    `;
                    document.head.appendChild(style);
                }

                const activities = [];
                const [registrations, urgentAlerts, rankingChanges] = await Promise.all([
                    this.getRecentRegistrations(120),
                    this.getUrgentAlerts(),
                    this.getRankingChanges()
                ]);

                registrations.forEach(reg => {
                    let catColor = '#00E36D'; // Default Green (Entrenos/Other)
                    const lowerName = reg.eventName.toLowerCase();

                    if (lowerName.includes('femenin') || lowerName.includes('chicas') || lowerName.includes('female')) {
                        catColor = '#FF2D55'; // Pink
                    } else if (lowerName.includes('mixt') || lowerName.includes('mix')) {
                        catColor = '#FFD700'; // Yellow
                    } else if (lowerName.includes('masculin') || lowerName.includes('chicos') || lowerName.includes('male')) {
                        catColor = '#00C4FF'; // Blue
                    }

                    // Lógica de colores de equipo idéntica a EventsController_V6
                    const t = reg.playerTeam ? reg.playerTeam.toUpperCase() : '';
                    let teamColor = '#38bdf8'; // Default Cyan (3º)
                    if (t.includes('4º')) teamColor = '#84cc16'; // Neon Green
                    if (t.includes('3º')) teamColor = '#38bdf8'; // Cyan
                    if (t.includes('2º')) teamColor = '#f59e0b'; // Gold/Orange
                    if (t.includes('MIXTO')) teamColor = '#ef4444'; // Red

                    activities.push({
                        type: 'registration',
                        icon: '🎾',
                        title: reg.playerName,
                        desc: `Se ha unido a <span style="color:${catColor}; font-weight:800;">${reg.eventName}</span>${reg.playerTeam ? `<br><span style="color:${teamColor}; font-size:0.65rem; font-weight:950; letter-spacing:1px; text-shadow: 0 0 8px ${teamColor}60; border-bottom: 2px solid ${teamColor}; padding-bottom: 1px;">${t}</span>` : ''}`,
                        time: this.formatRelativeTime(reg.timestamp),
                        color: catColor,
                        timestamp: reg.timestamp,
                        score: 0
                    });
                });

                urgentAlerts.forEach(alert => {
                    activities.push({
                        type: 'urgent',
                        icon: '🚨',
                        title: '¡ÚLTIMA HORA!',
                        desc: alert.title,
                        time: 'ahora',
                        color: '#ef4444',
                        timestamp: alert.timestamp,
                        priority: 'critical',
                        score: 0,
                        action: 'Entrenos'
                    });
                });

                rankingChanges.forEach(change => {
                    activities.push({
                        type: 'ranking',
                        icon: change.position === 1 ? '👑' : '📈',
                        title: change.playerName,
                        desc: `${change.position === 1 ? '¡NUEVO LÍDER!' : `Entra en el TOP ${change.position}`} del ranking`,
                        time: this.formatRelativeTime(change.timestamp),
                        color: '#f59e0b',
                        timestamp: change.timestamp,
                        score: 0
                    });
                });

                activities.sort((a, b) => b.timestamp - a.timestamp);
                const top6 = activities.slice(0, 6);

                if (top6.length === 0) {
                    return `
                        <div style="text-align: center; padding: 40px 20px;">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                <i class="fas fa-radar" style="color:rgba(255,255,255,0.2); font-size: 1.5rem; animation: pulseGlow 2s infinite;"></i>
                            </div>
                            <div style="color: rgba(255,255,255,0.3); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;">RADAR BUSCANDO ACTIVIDAD...</div>
                        </div>
                    `;
                }

                return `
                    <div style="position: relative;">
                        <div class="activity-timeline-line"></div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${top6.map((activity, index) => `
                                <div class="activity-glass-card" 
                                     style="animation: showtimeSlide 0.6s both ${index * 0.12}s; color: ${activity.color};"
                                     onclick="${activity.action ? `window.Router.navigate('${activity.action.toLowerCase()}')` : ''}">
                                    
                                    <div class="activity-impact-badge"></div>
                                    <div class="activity-dot" style="background: ${activity.color}; ${index === 0 ? 'animation: timelinePulse 1.5s infinite;' : ''}"></div>
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; position: relative; z-index: 1;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                                <span style="font-size: 0.95rem; font-weight: 1000; color: white; text-transform: uppercase; letter-spacing: -0.5px; font-style: italic;">${activity.title}</span>
                                                ${activity.priority === 'critical' ? `<span style="background: #ef4444; color: white; font-size: 0.55rem; font-weight: 1000; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; animation: pulse 1s infinite; box-shadow: 0 0 15px #ef4444;">BREAKING</span>` : ''}
                                            </div>
                                            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 700; line-height: 1.5; letter-spacing: 0.2px;">${activity.desc}</div>
                                        </div>
                                        <div style="text-align: right; min-width: 70px;">
                                            <div style="font-size: 0.6rem; color: ${activity.color}; font-weight: 1000; text-transform: uppercase; opacity: 0.8; letter-spacing: 1px;">${activity.time}</div>
                                            ${activity.action ? `
                                                <div style="margin-top: 8px; font-size: 0.55rem; font-weight: 1000; color: #000; background: ${activity.color}; padding: 3px 10px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px ${activity.color}40; transform: skewX(-10deg);">
                                                    ${activity.action.toUpperCase()}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } catch (e) {
                console.error('Activity Feed error:', e);
                return '';
            }
        }

        async getRecentRegistrations(hoursAgo = 48) {
            try {
                const cutoff = Date.now() - (hoursAgo * 60 * 60 * 1000);
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const registrations = [];

                events.forEach(event => {
                    const players = event.players || event.registeredPlayers || [];
                    if (players.length > 0) {
                        players.forEach(p => {
                            // Usar el joinedAt real si existe, si no, ignorar registros antiguos o sin fecha
                            const joinDate = p.joinedAt ? new Date(p.joinedAt).getTime() : 0;

                            if (joinDate > cutoff) {
                                registrations.push({
                                    type: 'registration',
                                    playerName: p.name || 'Jugador',
                                    playerTeam: Array.isArray(p.team_somospadel) ? p.team_somospadel[0] : (p.team_somospadel || ''),
                                    eventName: event.name,
                                    timestamp: joinDate,
                                    eventId: event.id
                                });
                            }
                        });
                    }
                });

                return registrations;
            } catch (e) {
                console.error('Error getting registrations:', e);
                return [];
            }
        }

        async getUrgentAlerts() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const alerts = [];

                events.forEach(event => {
                    if (!['open', 'upcoming', 'scheduled'].includes(event.status)) return;
                    const players = (event.players || event.registeredPlayers || []).length;
                    const maxPlayers = (event.max_courts || 0) * 4;
                    const spotsLeft = maxPlayers - players;

                    if (spotsLeft > 0 && spotsLeft <= 2 && maxPlayers > 0) {
                        alerts.push({
                            type: 'urgent',
                            title: `¡ÚLTIMA${spotsLeft === 1 ? '' : 'S'} ${spotsLeft} PLAZA${spotsLeft === 1 ? '' : 'S'}! ${event.name}`,
                            eventName: event.name,
                            spotsLeft,
                            timestamp: Date.now(),
                            priority: 'critical'
                        });
                    }
                });

                return alerts;
            } catch (e) {
                console.error('Error getting urgent alerts:', e);
                return [];
            }
        }

        async getRankingChanges() {
            try {
                if (!window.RankingController) return [];
                const players = await window.RankingController.calculateSilently();
                const changes = [];

                players.slice(0, 3).forEach((player, index) => {
                    const points = player.stats?.americanas?.points || 0;
                    if (points > 0) {
                        changes.push({
                            type: 'ranking',
                            playerName: player.name,
                            position: index + 1,
                            points: points,
                            timestamp: Date.now() - Math.random() * 7200000
                        });
                    }
                });
                return changes;
            } catch (e) {
                console.error('Error getting ranking changes:', e);
                return [];
            }
        }

        calculateActivityScore(activity) {
            let score = 0;
            const minutesAgo = (Date.now() - activity.timestamp) / 60000;
            score += Math.max(0, 100 - minutesAgo);

            const priorityScores = {
                'urgent': 100,
                'registration': 70,
                'ranking': 50,
                'match': 30,
                'event': 20
            };
            score += priorityScores[activity.type] || 0;
            if (activity.priority === 'critical') score += 50;
            return score;
        }

        formatDateTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${hours}:${minutes} ${day}/${month}`;
        }

        formatRelativeTime(timestamp) {
            if (!timestamp) return '';
            return this.formatDateTime(timestamp);
        }

        getPlayerName(playerId) {
            if (typeof playerId === 'string') return 'Alguien';
            if (playerId && playerId.name) return playerId.name.split(' ')[0];
            return 'Alguien';
        }

        async renderLiveActivity() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const urgentAm = events.find(am => {
                    const pCount = (am.players || am.registeredPlayers || []).length;
                    const maxP = (am.max_courts || 0) * 4;
                    const spots = maxP - pCount;
                    return maxP > 0 && spots > 0 && spots <= 4;
                }) || events[0];

                if (urgentAm) {
                    const players = urgentAm.players || urgentAm.registeredPlayers || [];
                    const pCount = players.length;
                    const maxP = (urgentAm.max_courts || 0) * 4;
                    const spots = Math.max(0, maxP - pCount);
                    const isFull = spots === 0;

                    const cardBg = isFull ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
                    const btnText = isFull ? 'VER LISTA DE ESPERA' : 'APUNTARME AHORA';
                    const btnBg = isFull ? '#94a3b8' : '#00E36D';
                    const statusDesc = isFull ? '¡Pista completa! Avisaremos bajas.' : `¡Solo <b>${spots} plazas</b>! Se llenará pronto.`;
                    const navigateAction = "window.Router.navigate('entrenos'); setTimeout(() => { if(window.EventsController) window.EventsController.filterByType('entreno'); }, 200);";

                    let html = `
                        <style>
                            @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                            .ticker-marquee-container { overflow: hidden; white-space: nowrap; position: relative; mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
                            .ticker-marquee-content { display: inline-block; animation: marquee-scroll 25s linear infinite; white-space: nowrap; }
                            .ticker-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); padding: 6px 14px; border-radius: 100px; font-size: 0.75rem; color: white; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.1); margin-right: 12px; }
                        </style>
                        <div class="smart-hero-card" onclick="${navigateAction}" style="background: ${cardBg}; border-radius: 16px; padding: 20px; color: white; position: relative; overflow: hidden; margin-bottom: 5px; cursor: pointer;">
                            <div style="position: absolute; top: -20px; right: -20px; font-size: 5rem; color: rgba(255,255,255,0.1); transform: rotate(-15deg);"><i class="fas fa-star"></i></div>
                            <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white; padding: 4px 12px; border-radius: 100px; font-size: 0.6rem; font-weight: 900; display: inline-block; margin-bottom: 12px; text-transform: uppercase;">RECOMENDACIÓN</div>
                            <div style="font-size: 1.4rem; font-weight: 900; margin-bottom: 5px;">${urgentAm.name}</div>
                            <p style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 15px;">${statusDesc}</p>
                            <div style="background: ${btnBg}; color: black; padding: 12px; border-radius: 12px; text-align: center; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                ${btnText} <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    `;

                    const hypeMessages = [`🔥 <b>${pCount + 3} personas</b> viéndolo`, `⚡ <b>Alta Demanda</b>: Se llenará hoy`, `🏆 <b>Nivel Garantizado</b>`];
                    if (players.length > 0) {
                        const randomPlayer = players[Math.floor(Math.random() * players.length)];
                        const pName = (randomPlayer.name || 'Jugador').split(' ')[0];
                        hypeMessages.unshift(`🚀 <b>${pName}</b> acaba de unirse`);
                    }

                    const tickerItems = [...hypeMessages, ...hypeMessages].map(msg => `<div class="ticker-tag"><div style="width: 6px; height: 6px; border-radius: 50%; background: #00E36D; box-shadow: 0 0 5px #00E36D;"></div>${msg}</div>`).join('');
                    html += `<div class="ticker-marquee-container" style="padding: 5px 0;"><div class="ticker-marquee-content">${tickerItems}</div></div>`;
                    return html;
                }
                return '';
            } catch (e) { return ''; }
        }

        async showChatInfo() {
            const modalId = 'chat-info-modal';
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 9999999; opacity: 0; transition: opacity 0.3s ease;`;
                modal.onclick = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 300); };
                document.body.appendChild(modal);
            }

            const guideItems = [
                { title: 'HISTORIAS LIVE', icon: 'fa-play-circle', color: '#fb7185', desc: 'Sigue la actualidad del club al estilo Instagram. Pulsa derecha para avanzar, izquierda para volver o mantén para pausar.' },
                { title: 'RANKING GLOBAL', icon: 'fa-trophy', color: '#CCFF00', desc: 'Suma puntos en Americanas y Entrenos. El sistema recalcula tu nivel dinámicamente según tus victorias.' },
                { title: 'METEOROLOGÍA', icon: 'fa-cloud-sun', color: '#0ea5e9', desc: 'Análisis en tiempo real de temperatura y humedad. Te indicamos la velocidad de la bola y el agarre de pista óptimo.' },
                { title: 'NOTIFICACIONES PUSH', icon: 'fa-bell', color: '#fbbf24', desc: 'Recibe avisos instantáneos cuando se abran inscripciones o cuando tu partido esté listo para empezar.' },
                { title: 'APP MULTI-MODO', icon: 'fa-layer-group', color: '#a855f7', desc: 'Gestiona Americanas, Entrenos, Clases y Pozo desde un solo lugar con lógica de ascensos automáticos.' },
                { title: 'PILOTO AUTOMÁTICO', icon: 'fa-robot', color: '#34d399', desc: 'El sistema genera cruces 4h antes del evento y notifica a los jugadores para que todo fluya sin esperas.' }
            ];

            modal.innerHTML = `
                <div style="background: #0a0a0b; border-radius: 32px; padding: 0; width: 92%; max-width: 480px; position: relative; box-shadow: 0 0 60px rgba(204,255,0,0.15); border: 1px solid rgba(255,255,255,0.1); animation: modalIn 0.5s cubic-bezier(0.19, 1, 0.22, 1); max-height: 85vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div style="padding: 30px 24px 20px; background: linear-gradient(180deg, rgba(204,255,0,0.05) 0%, transparent 100%); border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
                        <div style="width: 50px; height: 50px; background: #CCFF00; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 0 20px rgba(204,255,0,0.3);">
                            <i class="fas fa-book-open" style="color: black; font-size: 1.4rem;"></i>
                        </div>
                        <h3 style="margin: 0 0 4px 0; color: #fff; font-weight: 950; font-size: 1.5rem; letter-spacing: -0.5px;">GUÍA <span style="color:#CCFF00">SMART</span> JUGADOR</h3>
                        <p style="color: rgba(255,255,255,0.4); font-size: 0.65rem; margin: 0; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Manual de Experiencia SomosPadel</p>
                    </div>

                    <!-- Scrollable Content -->
                    <div style="flex: 1; overflow-y: auto; padding: 20px; padding-right: 15px;">
                        <div style="display: grid; gap: 15px;">
                            ${guideItems.map((item, i) => `
                                <div style="display: flex; gap: 16px; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); animation: itemFadeIn 0.4s both ${i * 0.1}s;">
                                    <div style="width: 44px; height: 44px; background: ${item.color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${item.color}40;">
                                        <i class="fas ${item.icon}" style="color: ${item.color}; font-size: 1.1rem;"></i>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="color: white; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.3px;">${item.title}</div>
                                        <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 600; line-height: 1.5;">${item.desc}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 20px; background: #0a0a0b;">
                        <button style="width: 100%; background: #CCFF00; color: #000; border: none; height: 58px; border-radius: 18px; font-weight: 950; font-size: 0.95rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 25px rgba(204,255,0,0.2);" onclick="this.closest('#chat-info-modal').click()">TENGO EL CONTROL</button>
                    </div>
                </div>
                <style> 
                    @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } } 
                    @keyframes itemFadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                    #chat-info-modal::-webkit-scrollbar { width: 5px; }
                    #chat-info-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                </style>
            `;
            setTimeout(() => modal.style.opacity = '1', 10);
        }
        async renderPredictiveSynergy() {
            try {
                console.log("🧠 [DashboardView] renderPredictiveSynergy called");
                const user = window.Store ? window.Store.getState('currentUser') : null;
                if (!user) {
                    console.warn("🧠 [DashboardView] No user for synergy");
                    return '';
                }

                const userId = user.id || user.uid;
                const userName = user.name || "Jugador";
                const userPhoto = user.photoURL || user.photo_url || 'img/default-avatar.png';

                if (!window.PartnerSynergyService || !window.FirebaseDB) {
                    console.error("🧠 [DashboardView] Synergy Services MISSING");
                    return '';
                }

                let bestPartners = [];
                let trend = { status: 'NORMAL', factor: 1, desc: 'Analizando...' };

                try {
                    bestPartners = await window.PartnerSynergyService.getBestPartnersFor(userId, 3) || [];
                    trend = await window.PartnerSynergyService.getRecentPerformanceTrend(userId) || trend;
                } catch (e) {
                    console.error("🧠 [DashboardView] Fetching synergy failed", e);
                }

                let rankingInfo = { nextRival: null, myStats: null };
                try {
                    let ranked = [];
                    if (window.RankingController && window.RankingController.calculateSilently) {
                        ranked = await window.RankingController.calculateSilently();
                    } else {
                        const allPlayers = await window.FirebaseDB.players.getAll() || [];
                        ranked = [...allPlayers].sort((a, b) => parseFloat(b.level || 0) - parseFloat(a.level || 0));
                    }

                    const myIndex = ranked.findIndex(p => (p.id || p.uid) === userId);
                    if (myIndex !== -1) {
                        rankingInfo.myStats = ranked[myIndex];
                        if (myIndex > 0) {
                            rankingInfo.nextRival = ranked[myIndex - 1];
                        }
                    }
                } catch (e) {
                    console.error("🧠 [DashboardView] Ranking calc error", e);
                }

                const myTotalPts = rankingInfo.myStats ?
                    ((rankingInfo.myStats.stats?.americanas?.points || 0) + (rankingInfo.myStats.stats?.entrenos?.points || 0)) : 0;

                const rivalTotalPts = rankingInfo.nextRival ?
                    ((rankingInfo.nextRival.stats?.americanas?.points || 0) + (rankingInfo.nextRival.stats?.entrenos?.points || 0)) : 0;

                const rankingMsg = rankingInfo.nextRival ?
                    (rivalTotalPts > myTotalPts ?
                        `Objetivo: Superar a <span style="color:#38bdf8; font-weight:900;">${rankingInfo.nextRival.name}</span>. Te faltan <span style="color:#CCFF00; font-weight:900;">${rivalTotalPts - myTotalPts} pts</span>.` :
                        (rivalTotalPts > 0 ?
                            `Estás empatado con <span style="color:#38bdf8; font-weight:900;">${rankingInfo.nextRival.name}</span>. ¡Una victoria más y le superas!` :
                            `Supera a <span style="color:#38bdf8; font-weight:900;">${rankingInfo.nextRival.name}</span> en tu próximo match para subir en el Top.`
                        )) :
                    (myTotalPts > 0 ? '¡Eres el líder actual! Mantén el nivel para conservar tu puesto.' : 'Comienza a jugar partidos para subir en el Ranking mundial.');

                // HELPER: Get Smart Name (Name + 1st Surname) and Initials (N.S.)
                const getSmartData = (fullName) => {
                    if (!fullName) return { display: "Jugador", initials: "JP" };
                    const parts = fullName.trim().split(/\s+/);
                    if (parts.length === 1) return { display: parts[0], initials: parts[0].substring(0, 2).toUpperCase() };
                    return {
                        display: `${parts[0]} ${parts[1]}`,
                        initials: (parts[0][0] + parts[1][0]).toUpperCase()
                    };
                };

                const myData = getSmartData(userName);

                const synergies = (bestPartners && bestPartners.length > 0) ? bestPartners.map(p => {
                    const sData = getSmartData(p.player?.name);
                    const hasHistory = p.playChemistry && p.playChemistry.matchesPlayed > 0;
                    return {
                        name: sData.display,
                        photo: p.player?.photoURL || p.player?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sData.display)}&background=0f172a&color=fff&size=128`,
                        chemistry: Math.round(p.totalScore || 0),
                        color: p.rating?.color || '#CCFF00',
                        desc: hasHistory ? (p.playChemistry.winRate > 60 ? 'Historial ganador' : 'Dúo recurrente') : 'Potencial táctico',
                        reason: hasHistory ? `Habéis jugado ${p.playChemistry.matchesPlayed} partidos juntos.` : `Nivel de juego muy similar (${p.levelCompatibility.level2}).`
                    };
                }) : [];

                // FALLBACK: If no smart synergy is found yet, show REAL club players
                if (synergies.length === 0) {
                    try {
                        const allPlayers = await window.FirebaseDB.players.getAll() || [];
                        const realFallbacks = allPlayers
                            .filter(p => (p.id || p.uid) !== userId && p.name && p.name.length > 3)
                            .sort((a, b) => Math.abs((a.level || 0) - (user.level || 0)) - Math.abs((b.level || 0) - (user.level || 0))) // Group by similar level
                            .slice(0, 3);

                        if (realFallbacks.length > 0) {
                            realFallbacks.forEach((p, i) => {
                                const sData = getSmartData(p.name);
                                synergies.push({
                                    name: sData.display,
                                    photo: p.photoURL || p.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sData.display)}&background=random&color=fff&size=128`,
                                    chemistry: 75 + Math.floor(Math.random() * 15),
                                    color: i === 0 ? '#00E36D' : (i === 1 ? '#CCFF00' : '#38bdf8'),
                                    desc: 'Dúo sugerido',
                                    reason: 'Compatibilidad por nivel de juego.'
                                });
                            });
                        }
                    } catch (err) {
                        console.error("🧠 Fallback players failed", err);
                    }
                }

                // If still empty after fallback (very rare), use better named dummies
                if (synergies.length === 0) {
                    synergies.push({ name: 'Pro 1', photo: 'https://i.pravatar.cc/150?u=1', chemistry: 85, color: '#00E36D', desc: 'Compatibilidad nivel' });
                    synergies.push({ name: 'Pro 2', photo: 'https://i.pravatar.cc/150?u=2', chemistry: 72, color: '#CCFF00', desc: 'Estilo similar' });
                    synergies.push({ name: 'Pro 3', photo: 'https://i.pravatar.cc/150?u=3', chemistry: 60, color: '#38bdf8', desc: 'Buena racha' });
                }

                const fatigueColor = trend.status === 'HIGH' ? '#ef4444' : (trend.status === 'OPTIMAL' ? '#00E36D' : '#CCFF00');

                return `
                    <div class="synergy-glass-container" data-widget="predictive-synergy" style="
                        background: #0f172a;
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        border-radius: 32px;
                        padding: 24px;
                        border: 1px solid rgba(204, 255, 0, 0.3);
                        box-shadow: 0 40px 80px rgba(0,0,0,0.8), inset 0 0 20px rgba(204, 255, 0, 0.05);
                        overflow: hidden;
                        position: relative;
                        margin-bottom: 20px;
                        min-height: 480px;
                    ">
                        <!-- Background Glow -->
                        <div style="position: absolute; top: -50px; left: -50px; width: 250px; height: 250px; background: rgba(0, 227, 109, 0.15); filter: blur(80px); opacity: 0.6; pointer-events: none;"></div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative; z-index: 20;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 12px; height: 12px; background: #CCFF00; border-radius: 50%; box-shadow: 0 0 15px #CCFF00; animation: pulseSOS 1.5s infinite;"></div>
                                <span style="font-size: 0.9rem; font-weight: 1000; letter-spacing: 1px; color: #fff; text-transform: uppercase;">¿TU PAREJA PERFECTA?</span>
                            </div>
                            <div style="background: rgba(0,227,109,0.15); padding: 5px 12px; border-radius: 12px; font-size: 0.6rem; font-weight: 900; color: #00E36D; border: 1px solid #00E36D40; letter-spacing: 1px;">MATCH PADEL</div>
                        </div>

                        <p style="font-size: 0.72rem; color: rgba(255,255,255,0.5); line-height: 1.4; margin: 0 0 20px 22px; font-weight: 500;">
                            Nuestro algoritmo analiza tu <span style="color:#CCFF00">nivel de juego</span>, estilo táctico y <span style="color:#00E36D">resultados recientes</span> para recomendarte los compañeros con mayor probabilidad de éxito en los <span style="color:#fff; font-weight:700;">entrenos y/o americanas</span>.
                        </p>

                        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                            <!-- PART 1: NODE RADAR MAP -->
                            <div style="background: rgba(0,0,0,0.3); border-radius: 24px; padding: 40px 10px; position: relative; height: 300px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="position: absolute; inset: 0; background: radial-gradient(circle, rgba(204,255,0,0.08) 0%, transparent 75%);"></div>
                                
                                <!-- CENTRAL NODE (YOU) -->
                                <div style="position: relative; z-index: 10; width: 80px; height: 80px; padding: 4px; background: #CCFF00; border-radius: 50%; box-shadow: 0 0 40px rgba(204,255,0,0.5); animation: pulseFloat 3s ease-in-out infinite;">
                                    <div style="width: 100%; height: 100%; border-radius: 50%; background: #0f172a; overflow: hidden; border: 2px solid #0f172a;">
                                        <img src="${userPhoto}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                    <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: #CCFF00; color: #000; font-size: 0.6rem; font-weight: 1000; padding: 3px 10px; border-radius: 100px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">TÚ</div>
                                </div>

                                <!-- SYNERGY NODES -->
                                ${synergies.map((s, i) => {
                    const angles = [210, 330, 90];
                    const angleRad = angles[i] * (Math.PI / 180);
                    const dist = 105;
                    const x = Math.cos(angleRad) * dist;
                    const y = Math.sin(angleRad) * dist;

                    return `
                                        <div style="
                                            position: absolute; 
                                            transform: translate(${x}px, ${y}px);
                                            width: 70px; height: 70px; border-radius: 50%;
                                            background: #000; border: 2.5px solid ${s.color};
                                            padding: 3px; z-index: 5;
                                            box-shadow: 0 0 25px ${s.color}60;
                                            animation: itemFadeIn 0.8s both ${i * 0.2}s;
                                        ">
                                            <!-- CONNECTOR LINE -->
                                            <div style="
                                                position: absolute; 
                                                top: 50%; left: 50%;
                                                width: ${dist}px; height: 2px;
                                                background: linear-gradient(90deg, ${s.color}60, transparent);
                                                transform-origin: 0% 50%;
                                                transform: rotate(${angles[i] + 180}deg);
                                                z-index: -1;
                                            "></div>

                                            <div style="width: 100%; height: 100%; border-radius: 50%; background: #0f172a; overflow: hidden; border: 1px solid #0f172a;">
                                                <img src="${s.photo}" style="width: 100%; height: 100%; object-fit: cover;">
                                            </div>
                                            <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 0.6rem; color: #fff; font-weight: 900; white-space: nowrap; background: rgba(0,0,0,0.8); padding: 2px 8px; border-radius: 6px; border: 1.5px solid ${s.color};">${s.name}</div>
                                            <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); font-size: 0.55rem; color: #fff; font-weight: 800; white-space: nowrap; opacity: 0.7;">${s.chemistry}% CHM</div>
                                            <!-- HOVER EXPLANATION -->
                                            <div class="synergy-reason" style="position: absolute; top: 75px; left: 50%; transform: translateX(-50%); background: #000; color: ${s.color}; font-size: 0.5rem; font-weight: 900; padding: 4px 8px; border-radius: 8px; border: 1px solid ${s.color}40; white-space: nowrap; opacity: 0.8; z-index: 100;">${s.desc.toUpperCase()}</div>
                                        </div>
                                    `;
                }).join('')}

                                <!-- SCANNER EFFECT -->
                                <div style="position: absolute; inset: 0; border: 1px solid rgba(204,255,0,0.15); border-radius: 50%; margin: 15px; animation: sonar 4s linear infinite;"></div>
                                <div style="position: absolute; inset: 0; border: 2px solid rgba(204,255,0,0.05); border-radius: 50%; margin: 80px; animation: sonar 3s linear infinite reverse;"></div>
                            </div>

                            <!-- PART 2: IA PREDICTIVE INSIGHTS -->
                            <div style="display: flex; flex-direction: column; gap: 14px;">
                                <!-- CARD 1: FORM -->
                                <div style="background: ${fatigueColor}10; border: 1px solid ${fatigueColor}30; padding: 18px; border-radius: 20px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                                        <div style="width: 44px; height: 44px; background: ${fatigueColor}20; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${fatigueColor}30;">
                                            <i class="fas fa-heartbeat" style="color: ${fatigueColor}; font-size: 1.3rem;"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.85rem; font-weight: 1000; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                                                TU ESTADO DE FORMA: <span style="background:${fatigueColor}; color:#000; font-size:0.55rem; padding:2px 8px; border-radius:4px; font-weight:900;">${trend.status}</span>
                                            </div>
                                            <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.5; font-weight: 500;">
                                                ${trend.desc} Basado en tu carga de partidos, ${trend.status === 'HIGH' ? 'reducir intensidad para evitar lesiones.' : 'puedes aumentar la carga de entrenamiento.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- CARD 2: RANKING -->
                                <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 18px; border-radius: 20px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                                        <div style="width: 44px; height: 44px; background: rgba(56, 189, 248, 0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(56, 189, 248, 0.3);">
                                            <i class="fas fa-chart-line" style="color: #38bdf8; font-size: 1.3rem;"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.85rem; font-weight: 1000; color: #fff; margin-bottom: 4px;">PROYECCIÓN DE ASCENSO</div>
                                            <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.5; font-weight: 500;">
                                                ${rankingMsg}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- CARD 3: TACTICAL ADVICE -->
                                <div style="background: rgba(204, 255, 0, 0.05); border: 1px solid rgba(204, 255, 0, 0.2); padding: 18px; border-radius: 20px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                                        <div style="width: 44px; height: 44px; background: rgba(204, 255, 0, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(204, 255, 0, 0.2);">
                                            <i class="fas fa-lightbulb" style="color: #CCFF00; font-size: 1.3rem;"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.85rem; font-weight: 1000; color: #fff; margin-bottom: 4px;">CONSEJO DEL CAPITÁN</div>
                                            <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.5; font-weight: 500;">
                                                Tu pareja ideal es <span style="color:#CCFF00; font-weight:900;">${synergies[0]?.name || 'un perfil defensivo'}</span>. Juntos tenéis un ratio de cobertura de red del <span style="color:#00E36D; font-weight:900;">85%</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <style>
                            @keyframes sonar {
                                0% { transform: scale(0.7); opacity: 0; }
                                50% { opacity: 0.4; }
                                100% { transform: scale(1.6); opacity: 0; }
                            }
                            @keyframes pulseFloat {
                                0% { transform: scale(1) translateY(0) rotate(0deg); }
                                50% { transform: scale(1.03) translateY(-8px) rotate(1deg); }
                                100% { transform: scale(1) translateY(0) rotate(0deg); }
                            }
                        </style>
                    </div>
                `;
            } catch (e) {
                console.error("renderPredictiveSynergy error:", e);
                return '';
            }
        }

        toggleTacticalHUD() {
            const grip = document.getElementById('tactical-hud-grip');
            const bounce = document.getElementById('tactical-hud-bounce');
            if (grip && bounce) {
                const isVisible = grip.style.display === 'block';
                grip.style.display = isVisible ? 'none' : 'block';
                bounce.style.display = isVisible ? 'none' : 'block';
            }
        }
    }

    window.DashboardView = new DashboardView();
    console.log("🚀 Vibrant Dashboard Loaded");
})();

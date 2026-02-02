/**
 * app.js (Global Version)
 * Entry Point de la aplicación compatible con file://
 */
(function () {
    /**
     * Calcula la hora exacta de un partido basándose en:
     * - startTime: hora de inicio del evento (ej: "10:00")
     * - roundNum: número de ronda (1-6)
     * - matchDuration: duración de cada partido en minutos (default: 20)
     * 
     * Cada ronda empieza cuando termina la anterior (20 min por defecto)
     */
    window.calculateMatchTime = (startTime, roundNum, matchDuration = 20) => {
        if (!startTime) return "00:00";
        try {
            const [hours, minutes] = startTime.split(':').map(Number);
            const date = new Date();
            // Ronda 1 = hora inicio, Ronda 2 = +20min, Ronda 3 = +40min, etc.
            const totalMinutesOffset = (roundNum - 1) * matchDuration;
            date.setHours(hours, minutes + totalMinutesOffset, 0, 0);
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            console.error("Error calculating match time:", e);
            return startTime;
        }
    };

    class App {
        constructor() {
            console.log("🚀 Somos Padel PRO - Initializing (Global Mode)...");
            this.init();
        }

        init() {
            // 1. Verificar Auth
            if (window.Store) {
                window.Store.subscribe('currentUser', (user) => {
                    if (user) {
                        console.log("✅ User Logged In:", user.email);
                        this.handleAuthorized();
                    } else {
                        console.log("🔒 User Guest/Logged Out");
                        this.handleGuest();
                    }
                });
            } else {
                console.error("❌ Critical: Window.Store not found");
            }

            // 2. Setup Navigation
            this.setupNavigation();
        }

        handleAuthorized() {
            const user = window.Store.getState('currentUser');

            // UPDATE GLOBAL HEADER
            this.updateGlobalHeader(user);

            if (user && user.uid && window.db) {
                window.db.collection('players').doc(user.uid).update({
                    lastLogin: new Date().toISOString()
                }).catch(e => console.warn("⏳ [App] Error actualizando lastLogin:", e));
            }

            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.add('hidden');

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.remove('hidden');

            // NEW: Load Side Menu from DB
            this.loadSideMenu();

            // Force initial render of the current route (Dashboard)
            if (window.Router) {
                window.Router.navigate(window.Router.currentRoute || 'dashboard');
            }

            if (window.DashboardController) {
                window.DashboardController.init();
            }
        }

        async loadSideMenu() {
            const menuContainer = document.getElementById('dynamic-menu-items');
            const dockContainer = document.querySelector('.nav-dock-container');

            if (!menuContainer && !dockContainer) return;

            // --- DEFINICIÓN DE FUNCIONES GLOBALES DE NAVEGACIÓN ---
            // Es vital definirlas en window para que los onclick del HTML inyectado las encuentren.
            window.closeDrawer = () => {
                const drawer = document.getElementById('side-drawer-container');
                const menu = document.getElementById('side-drawer-menu');
                if (drawer) drawer.classList.remove('open');
                if (menu) menu.classList.remove('open');
            };

            window.smartNavigate = (route, tab) => {
                console.log(`🧭 SmartNavigate: ${route} -> tab: ${tab}`);

                // 1. Navegar a la ruta base
                if (window.Router) window.Router.navigate(route);

                // 2. Controlar pestañas específicas (ej: Resultados en Americanas)
                if (route === 'americanas' && tab) {
                    // Esperamos un momento a que el controlador y la vista carguen
                    setTimeout(() => {
                        if (window.EventsController && typeof window.EventsController.setTab === 'function') {
                            console.log(`🔄 SmartNavigate: Forzando pestaña ${tab}`);
                            window.EventsController.setTab(tab);
                        } else {
                            console.warn("⚠️ EventsController no listo para setTab");
                        }
                    }, 200);
                }

                window.closeDrawer();
            };

            try {
                const currentUser = window.Store.getState('currentUser');
                const isAdmin = currentUser && ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain'].includes((currentUser.role || '').toLowerCase());

                // A. Render Side Menu (Hamburger) - STATIC
                if (menuContainer) {
                    // NEW MENU STRUCTURE
                    menuContainer.innerHTML = `
                        <!-- BRANDING HEADER IN MENU -->
                        <div style="padding: 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px;">
                            <img src="img/logo_somospadel.png" style="width: 60px; height: auto; margin-bottom: 10px; filter: drop-shadow(0 0 8px rgba(204,255,0,0.4));">
                            <div style="font-weight: 900; color: white; letter-spacing: 1px; font-size: 1.1rem;">SOMOS<span style="color: #CCFF00;">PADEL</span></div>
                            <div style="font-size: 0.6rem; color: #888; font-weight: 700; letter-spacing: 2px;">BARCELONA</div>
                        </div>

                        <!-- 1. MAIN NAVIGATION -->
                        <div style="padding: 0 10px; margin-bottom: 15px;">
                            <div style="color: #666; font-size: 0.65rem; font-weight: 800; padding: 5px 15px; letter-spacing: 1px; text-transform:uppercase;">Accesos Directos</div>
                            
                            <div class="drawer-item" onclick="window.smartNavigate('dashboard', null)">
                                <i class="fas fa-home" style="color: #CCFF00;"></i>
                                <span style="font-weight: 700;">INICIO</span>
                            </div>

                            <div class="drawer-item" onclick="window.smartNavigate('americanas', 'events')">
                                <i class="fas fa-trophy" style="color: #CCFF00;"></i>
                                <span style="font-weight: 700;">AMERICANAS DISPONIBLES</span>
                            </div>
                        </div>

                        <!-- 2. PLAYER ZONE -->
                        <div style="padding: 0 10px; margin-bottom: 15px;">
                            <div style="color: #666; font-size: 0.65rem; font-weight: 800; padding: 5px 15px; letter-spacing: 1px; text-transform:uppercase;">Zona Jugador</div>

                            <div class="drawer-item" onclick="window.smartNavigate('americanas', 'results')">
                                <i class="fas fa-chart-pie" style="color: #0ea5e9;"></i>
                                <span>MIS RESULTADOS</span>
                            </div>

                            <div class="drawer-item" onclick="window.smartNavigate('ranking', null)">
                                <i class="fas fa-medal" style="color: #f59e0b;"></i>
                                <span>RANKING</span>
                            </div>

                            <div class="drawer-item" onclick="window.smartNavigate('profile', null)">
                                <i class="fas fa-user-circle" style="color: #ec4899;"></i>
                                <span>MI PERFIL</span>
                            </div>
                        </div>

                        <!-- 3. SYSTEMS -->
                        ${isAdmin ? `
                        <div style="padding: 0 10px;">
                            <div class="drawer-item" onclick="window.location.href='admin.html'" style="opacity: 0.8;">
                                <i class="fas fa-user-shield" style="color: #ccc;"></i>
                                <span>PANEL ADMIN</span>
                            </div>
                        </div>
                        ` : ''}
                    `;
                }

                // B. Render Bottom Dock (Index Navigation)
                if (dockContainer) {
                    dockContainer.innerHTML = `
                        <nav class="nav-dock">
                            <button class="p-nav-item" data-view="dashboard" onclick="window.Router.navigate('dashboard')">
                                <div class="nav-icon-box"><i class="fas fa-home"></i></div>
                                <span>INICIO</span>
                            </button>
                            <button class="p-nav-item" data-view="americanas" onclick="window.Router.navigate('americanas')">
                                <div class="nav-icon-box"><i class="fas fa-trophy"></i></div>
                                <span>AMERICANAS</span>
                            </button>
                            <button class="p-nav-item" data-view="ranking" onclick="window.Router.navigate('ranking')">
                                <div class="nav-icon-box"><i class="fas fa-chart-line"></i></div>
                                <span>RANKING</span>
                            </button>
                            <button class="p-nav-item" data-view="profile" onclick="window.Router.navigate('profile')">
                                <div class="nav-icon-box"><i class="fas fa-user"></i></div>
                                <span>MI PERFIL</span>
                            </button>
                        </nav>
                    `;
                    // Re-trigger visual active state update from Router
                    if (window.Router) window.Router.updateNavUI(window.Router.currentRoute);
                }

            } catch (err) {
                console.error("Error loading navigation:", err);
            }
        }

        handleGuest() {
            this.updateGlobalHeader(null);
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.add('hidden');
        }

        updateGlobalHeader(user) {
            const headerName = document.getElementById('header-user-name');
            const headerAvatar = document.getElementById('header-user-avatar');

            if (headerName) {
                // Prioritize user.name from DB, then displayName from Auth, then placeholder
                const rawName = user ? (user.name || user.displayName || "Jugador") : "Invitado";
                headerName.innerText = rawName.split(' ')[0].toUpperCase();
            }

            if (headerAvatar) {
                if (user && user.photoURL) {
                    headerAvatar.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    const rawName = user ? (user.name || user.displayName || "J") : "I";
                    const initials = rawName.substring(0, 2).toUpperCase();
                    headerAvatar.innerHTML = initials;
                }
            }
        }

        setupNavigation() {
            // Navigation handled by Router.js
            console.log("⚓ Global Navigation System is active");
        }
    }

    // Init App when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AppInstance = new App());
    } else {
        window.AppInstance = new App();
    }
})();

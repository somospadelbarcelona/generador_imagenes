/**
 * Router.js - Enterprise Grade Routing System v2.0
 * Manages view transitions, deep linking, and navigation states.
 */
(function () {
    class Router {
        constructor() {
            this.currentRoute = 'dashboard';
            this.routes = {
                'dashboard': () => this.renderDashboard(),
                'americanas': () => this.handleControllerTab('EventsController', 'events'),
                'events': () => this.handleControllerTab('EventsController', 'events'),
                'profile': () => window.PlayerController?.init(),
                'live': () => window.ControlTowerView?.handleLiveRoute(),
                'live-entreno': () => window.EntrenoLiveView?.handleRoute(),
                'ranking': () => window.RankingController?.init(),
                'agenda': () => this.handleControllerTab('EventsController', 'agenda'),
                'results': () => this.handleControllerTab('EventsController', 'results'),
                'entrenos': () => this.handleControllerTab('EventsController', 'entrenos'),
                'records': () => {
                    console.log("🛣️ [Router] Executing records route...");
                    if (window.RecordsController) {
                        window.RecordsController.init();
                    } else {
                        console.error("❌ [Router] RecordsController not found in window!");
                        // Emergency render if controller missing
                        const content = document.getElementById('content-area');
                        if (content) content.innerHTML = '<div style="padding:100px; color:white; text-align:center;">Error: Controller no listo. Reintenta en 1s...</div>';
                        setTimeout(() => window.Router.navigate('records'), 1500);
                    }
                }
            };

            // Handle browser navigation
            window.onpopstate = (event) => {
                if (event.state && event.state.route) {
                    this.navigate(event.state.route, true);
                }
            };

            this.init();
        }

        init() {
            this.initGlobalExceptionHandler();
            console.log("🛣️ Enterprise Router System v2.0 Initialized");
        }

        handleControllerTab(controllerName, tabName) {
            const controller = window[controllerName];
            if (controller) {
                if (typeof controller.init === 'function') controller.init();
                if (typeof controller.setTab === 'function') controller.setTab(tabName);
            }
        }

        navigate(route, isBack = false) {
            if (this.currentRoute === route && !isBack) return;

            console.log(`[Router] Transitioning: ${this.currentRoute} -> ${route}`);

            // === MEMORY & RESOURCE CLEANUP ===
            this.cleanupPreviousRoute();

            this.currentRoute = route;

            // Update UI State
            this.updateNavUI(route);

            // Execute View Logic
            const viewAction = this.routes[route];
            if (viewAction) {
                try {
                    viewAction();
                } catch (error) {
                    console.error(`[Router] Error executing route ${route}:`, error);
                    this.renderError(route, error);
                }
            } else {
                this.renderPlaceholder(route);
            }

            // History Management
            if (!isBack) {
                window.history.pushState({ route }, '', `#${route}`);
            }

            // Global scroll to top on nav
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        cleanupPreviousRoute() {
            const controllersToCleanup = [
                { name: 'EventsController', routes: ['events', 'americanas', 'results', 'agenda', 'entrenos'] },
                { name: 'ControlTowerView', routes: ['live'] },
                { name: 'TVView', routes: ['tv'] }
            ];

            controllersToCleanup.forEach(ctrl => {
                if (ctrl.routes.includes(this.currentRoute)) {
                    const instance = window[ctrl.name];
                    if (instance && typeof instance.destroy === 'function') {
                        console.log(`[Router] Cleaning up ${ctrl.name}`);
                        instance.destroy();
                    }
                }
            });
        }

        updateNavUI(route) {
            // 1. Bottom Nav Dock
            document.querySelectorAll('.p-nav-item').forEach(btn => {
                const isActive = btn.dataset.view === route;
                btn.classList.toggle('active', isActive);

                if (isActive && window.navigator.vibrate) {
                    window.navigator.vibrate(10);
                }
            });

            // 2. Top Header Tabs (Smart selection)
            document.querySelectorAll('.header-tab').forEach(tab => {
                const onclickAttr = tab.getAttribute('onclick') || '';
                const match = onclickAttr.match(/'([^']+)'/);
                const view = match ? match[1] : null;
                const isActive = view === route;

                tab.classList.toggle('active', isActive);

                // Styles are now handled via CSS classes to keep JS clean
                // .header-tab.active { font-weight: 900; color: #000; border-bottom: 3px solid #FF9800; }
            });
        }

        renderDashboard() {
            if (window.DashboardView && window.Store) {
                const data = window.Store.getState('dashboardData');
                window.DashboardView.render(data || { activeCourts: 0 });
            } else {
                // Retry with exponential backoff or simple timeout
                setTimeout(() => this.renderDashboard(), 100);
            }
        }

        renderError(route, error) {
            const content = document.getElementById('content-area');
            if (!content) return;
            content.innerHTML = `
                <div class="error-view fade-in">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error en la Ruta</h2>
                    <p>No pudimos cargar <strong>${route}</strong>.</p>
                    <pre>${error.message}</pre>
                    <button onclick="Router.navigate('dashboard')" class="btn-primary-pro">VOLVER AL PANEL</button>
                </div>
            `;
        }

        renderPlaceholder(name) {
            const content = document.getElementById('content-area');
            if (!content) return;

            content.innerHTML = `
                <div class="placeholder-view fade-in">
                    <div class="icon-circle">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h2>Sección en Desarrollo</h2>
                    <p>Estamos optimizando <strong>${name}</strong>.</p>
                    <button onclick="Router.navigate('dashboard')" class="btn-primary-pro">VOLVER AL INICIO</button>
                </div>
            `;
        }

        initGlobalExceptionHandler() {
            window.addEventListener('error', (event) => {
                console.error("[CIBER-AUDIT] Captured potential runtime threat or bug:", event.error);
                // In production, we would log this to a secure server.
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.warn("[CIBER-AUDIT] Unhandled Promise Rejection:", event.reason);
            });
        }
    }

    window.Router = new Router();
})();

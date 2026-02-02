/**
 * admin.js
 * Core Admin Logic: Authentication, Navigation, and Bootstrapping.
 * Stripped of specific view logic (delegated to modules).
 */

console.log("🚀 Admin JS Loading...");

// --- GLOBAL HELPERS ---
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
        const [h, m] = startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        // Ronda 1 = hora inicio, Ronda 2 = +20min, Ronda 3 = +40min, etc.
        const totalMinutesOffset = (roundNum - 1) * matchDuration;
        date.setMinutes(date.getMinutes() + totalMinutesOffset);
        return date.getHours().toString().padStart(2, '0') + ":" +
            date.getMinutes().toString().padStart(2, '0');
    } catch (e) { return startTime; }
};

// --- AUTHENTICATION ---
window.AdminAuth = {
    token: localStorage.getItem('adminToken'),
    user: (() => {
        try {
            const s = localStorage.getItem('adminUser') || localStorage.getItem('currentUser');
            return JSON.parse(s || 'null');
        } catch (e) { return null; }
    })(),

    hasAdminRole(role) {
        if (!role) return false;
        const r = role.toString().toLowerCase().trim();
        return ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes'].includes(r);
    },

    async init() {
        console.log("🛠️ AdminAuth Init");
        const modal = document.getElementById('admin-auth-modal');
        const isAdmin = this.user && this.hasAdminRole(this.user.role);

        if (isAdmin) {
            console.log("💎 Active Session:", this.user.name);
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
            }
            this.updateProfileUI();

            // Wait for everything to be settled
            setTimeout(() => {
                if (window.loadAdminView) window.loadAdminView('users');
            }, 500);
        } else {
            console.log("🔒 No active session. Waiting for PIN...");
            if (localStorage.getItem('admin_remember_pin')) {
                await this.login(localStorage.getItem('admin_remember_pin'), true);
            }
        }
    },

    async login(pin, isAuto = false) {
        const ACCESS_CODES = {
            '212121': { role: 'super_admin', name: 'Super Admin' },
            '501501': { role: 'admin', name: 'Admin' },
            '262524': { role: 'captain', name: 'Capitán' }
        };

        try {
            if (!isAuto) await new Promise(r => setTimeout(r, 600));

            if (ACCESS_CODES[pin]) {
                const user = { ...ACCESS_CODES[pin], status: 'active', lastLogin: new Date().toISOString() };
                this.setUser(user);
            } else {
                throw new Error("CÓDIGO INCORRECTO");
            }
        } catch (e) {
            alert(e.message);
        }
    },

    setUser(user) {
        this.user = user;
        localStorage.setItem('adminUser', JSON.stringify(user));
        document.getElementById('admin-auth-modal').style.display = 'none';
        this.updateProfileUI();
        window.loadAdminView('users');
    },

    logout() {
        localStorage.removeItem('adminUser');
        location.reload();
    },

    updateProfileUI() {
        if (!this.user) return;
        const nameEl = document.getElementById('admin-name');
        const avEl = document.getElementById('admin-avatar');
        if (nameEl) nameEl.textContent = this.user.name;
        if (avEl) avEl.textContent = this.user.name.charAt(0);

        // Add Force Refresh button to top bar if not exists
        const topActions = document.querySelector('.top-actions');
        if (topActions && !document.getElementById('force-refresh-btn')) {
            const btn = document.createElement('button');
            btn.id = 'force-refresh-btn';
            btn.className = 'btn-micro';
            btn.style.cssText = 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #888; padding: 5px 10px; border-radius: 6px; font-size: 0.65rem;';
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> FORCE REFRESH';
            btn.onclick = () => {
                if (confirm("¿Forzar recarga completa? Se limpiará la caché.")) {
                    window.location.reload(true);
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(regs => {
                            for (let reg of regs) reg.unregister();
                            window.location.href = window.location.href + '?v=' + Date.now();
                        });
                    }
                }
            };
            topActions.prepend(btn);
        }
    }
};

// --- NAVIGATION ROUTER ---
window.loadAdminView = async function (viewName) {
    console.log("Navigate to:", viewName);

    // Sidebar Active State
    document.querySelectorAll('.nav-item-pro').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item-pro[data-view="${viewName}"]`)?.classList.add('active');

    // Close Mobile Menu
    document.getElementById('admin-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');

    const content = document.getElementById('content-area');
    if (content) content.innerHTML = '<div class="loader"></div>';

    // ROUTING TABLE
    try {
        if (viewName === 'users' && window.AdminViews.users) {
            await window.AdminViews.users();
        }
        else if (viewName === 'americanas_mgmt' && window.AdminViews.americanas_mgmt) {
            await window.AdminViews.americanas_mgmt();
        }
        else if (viewName === 'autopilot') {
            if (window.AutopilotView) window.AutopilotView.render();
            else console.error("AutopilotView not loaded");
        }
        else if (viewName === 'network_pulse') {
            if (window.NetworkPulseView) window.NetworkPulseView.render();
            else console.error("NetworkPulseView not loaded");
        }
        else if (viewName === 'entrenos_mgmt' && window.AdminViews && window.AdminViews.entrenos_mgmt) {
            await window.AdminViews.entrenos_mgmt();
        }
        else if (viewName === 'entrenos_create' && window.AdminViews && window.AdminViews.entrenos_create) {
            await window.AdminViews.entrenos_create();
        }
        else if (viewName === 'matches') {
            if (window.loadResultsView) await window.loadResultsView('americana');
            else throw new Error("Results Module not loaded");
        }
        else if (viewName === 'entrenos_results') {
            if (window.loadResultsView) await window.loadResultsView('entreno');
            else throw new Error("Results Module not loaded");
        }
        else {
            // Fallback for Simulator or others not yet refactored logic
            if (window.AdminViews && window.AdminViews[viewName]) {
                await window.AdminViews[viewName]();
            } else {
                content.innerHTML = `<div style="padding:2rem; text-align:center;">🚧 Módulo ${viewName} en construcción o no encontrado.</div>`;
            }
        }
    } catch (e) {
        console.error("View Load Error:", e);
        if (content) content.innerHTML = `<div class="error-box">Error UI: ${e.message}</div>`;
    }
};


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    window.AdminAuth.init();
});

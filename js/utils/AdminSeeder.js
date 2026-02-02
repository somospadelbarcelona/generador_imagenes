/**
 * AdminSeeder.js
 * Tool to promote the current user to Admin in this prototype environment.
 */
import { store } from '../core/StateManager.js';

export const AdminSeeder = {
    promoteMe() {
        const user = store.getState('currentUser');
        if (!user) {
            console.error("❌ No estás logueado. Inicia sesión primero.");
            alert("❌ Primero debes registrarte o iniciar sesión.");
            return;
        }

        // Simular Admin Claim
        user.role = 'admin';
        store.setState('currentUser', user);

        // Guardar persistencia local simulada para que sobreviva al F5 (en prototipo)
        localStorage.setItem('simulated_admin_role', 'true');

        console.log("🚀 User promoted to ADMIN!");
        alert("✅ ¡Felicidades! Ahora eres SUPER ADMIN.\nEl panel de control es tuyo.");

        // Redirigir al dashboard si no estamos allí
        if (window.Router) window.Router.navigate('dashboard');
    }
};

// Auto-restore role on load if simulated
const restore = () => {
    if (localStorage.getItem('simulated_admin_role') === 'true') {
        const user = store.getState('currentUser');
        if (user) {
            user.role = 'admin';
            console.log("👑 Admin Role Restored from LocalStorage");
        }
    }
};

// Check when user logs in
store.subscribe('currentUser', (user) => {
    if (user && localStorage.getItem('simulated_admin_role') === 'true') {
        user.role = 'admin';
    }
});

window.AdminSeeder = AdminSeeder;

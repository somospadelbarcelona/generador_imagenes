/**
 * AuthController.js (Global Version)
 */
(function () {
    class AuthController {
        constructor() {
            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }

            // Global Helper for UI switching
            window.toggleAuthMode = (mode) => {
                const loginForm = document.getElementById('login-form');
                const registerForm = document.getElementById('register-form');

                if (!loginForm || !registerForm) return;

                if (mode === 'register') {
                    loginForm.classList.add('hidden');
                    registerForm.classList.remove('hidden');
                } else {
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                }
            };
        }

        init() {
            console.log("🔒 AuthController Global Binding Forms...");

            // Bind Login Form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                // Brute force replacement to kill old listeners
                const newLoginForm = loginForm.cloneNode(true);
                loginForm.parentNode.replaceChild(newLoginForm, loginForm);

                newLoginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const phone = newLoginForm.phone.value.trim();
                    const password = newLoginForm.password.value.trim();

                    if (!phone || !password) {
                        alert("❌ Introduce usuario y contraseña");
                        return;
                    }

                    const btn = newLoginForm.querySelector('button[type="submit"]');
                    const originalText = btn ? btn.textContent : "Entrar";
                    if (btn) btn.textContent = "Verificando...";

                    let email = phone;
                    if (!email.includes('@')) email = phone + '@somospadel.com';

                    try {
                        const result = await window.AuthService.login(email, password);
                        if (!result.success) {
                            alert("❌ Error de acceso: " + result.error);
                            if (btn) btn.textContent = originalText;
                        } else {
                            console.log("✅ Login Success!");

                            // Hide Modal & Show App
                            const authModal = document.getElementById('auth-modal');
                            const appShell = document.getElementById('app-shell');
                            if (authModal) authModal.style.display = 'none'; // Force hide due to !important in CSS
                            if (appShell) appShell.classList.remove('hidden');

                            // Navigate to Dashboard
                            if (window.Router) {
                                window.Router.navigate('dashboard');
                            } else {
                                window.location.reload();
                            }
                        }
                    } catch (err) {
                        alert("❌ Error Inesperado: " + err.message);
                        if (btn) btn.textContent = originalText;
                    }
                });
            }

            // Bind Register Form
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                const newRegisterForm = registerForm.cloneNode(true);
                registerForm.parentNode.replaceChild(newRegisterForm, registerForm);

                newRegisterForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const name = newRegisterForm.name.value.trim();
                    const phone = newRegisterForm.phone.value.trim();
                    const password = newRegisterForm.password.value.trim();
                    const gender = newRegisterForm.gender.value;
                    const play_preference = newRegisterForm.play_preference.value;
                    const level = parseFloat(newRegisterForm.self_rate_level.value) || 3.5;

                    let email = phone;
                    if (!email.includes('@')) email = phone + '@somospadel.com';

                    const btn = newRegisterForm.querySelector('button[type="submit"]');
                    const originalText = btn ? btn.textContent : "Unirme ahora";
                    if (btn) btn.textContent = "Creando cuenta...";

                    try {
                        const result = await window.AuthService.register(email, password, {
                            name,
                            gender,
                            play_preference,
                            level,
                            role: 'player'
                        });

                        if (!result.success) {
                            alert("❌ Error de registro: " + result.error);
                            if (btn) btn.textContent = originalText;
                        } else if (result.pendingValidation) {
                            alert("✅ SOLICITUD ENVIADA.\n\nTu cuenta ha sido creada y está pendiente de validación por un administrador (Alejandro).\n\nTe avisaremos cuando esté activa.");
                            // Reset form and go to login
                            newRegisterForm.reset();
                            if (window.toggleAuthMode) window.toggleAuthMode('login');
                            if (btn) btn.textContent = originalText;
                        } else {
                            alert("✅ ¡Cuenta Creada! Iniciando sesión...");
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    } catch (err) {
                        alert("❌ Error Inesperado: " + err.message);
                        if (btn) btn.textContent = originalText;
                    }
                });
            }
        }

        async handleLogout() {
            try {
                const res = await window.AuthService.logout();
                if (res.success) {
                    window.location.reload();
                } else {
                    alert("Error al cerrar sesión: " + res.error);
                }
            } catch (err) {
                console.error("Logout error", err);
                window.location.reload(); // Fallback reload
            }
        }
    }

    window.AuthController = new AuthController();
    console.log("🎮 AuthController Global Loaded");
})();

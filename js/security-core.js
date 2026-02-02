/**
 * 🛡️ SECURITY CORE - BLINDAJE ANTI-HACK & ANTI-COPY
 * =================================================
 * Este módulo contiene medidas de seguridad activas para proteger la aplicación.
 * 
 * CARACTERÍSTICAS:
 * 1. Bloqueo de Click Derecho (Context Menu)
 * 2. Bloqueo de Atajos de Teclado de Desarrollo (F12, Ctrl+Shift+I, etc.)
 * 3. Trampa de Debugger (Congela la app si se abren las DevTools)
 * 4. Bloqueo de Selección de Texto e Imágenes
 * 5. Limpieza de Consola
 */

(function () {
    'use strict';

    const CONFIG = {
        enableDebuggerTrap: false, // DESACTIVADO PARA DEBUGGING
        enableConsoleClear: false, // DESACTIVADO PARA DEBUGGING
        blockRightClick: true,
        blockShortcuts: false, // PERMITIR F12
        blockSelection: true
    };

    // ==========================================
    // 1. BLOQUEO DE INTERACCIÓN PERIFÉRICA
    // ==========================================

    if (CONFIG.blockRightClick) {
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            return false;
        }, false);
    }

    if (CONFIG.blockSelection) {
        // Bloquear selección vía CSS
        const style = document.createElement('style');
        style.innerHTML = `
            body {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            input, textarea {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
            }
        `;
        document.head.appendChild(style);

        // Bloquear arrastre de imágenes
        document.addEventListener('dragstart', function (e) {
            e.preventDefault();
            return false;
        });
    }

    if (CONFIG.blockShortcuts) {
        document.addEventListener('keydown', function (e) {
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                return false;
            }

            // Ctrl+Shift+I (Inspector), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element), Ctrl+U (Source)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
                e.preventDefault();
                return false;
            }

            // Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'U' || e.keyCode === 85)) {
                e.preventDefault();
                return false;
            }

            // Ctrl+S (Save Page)
            if (e.ctrlKey && (e.key === 'S' || e.keyCode === 83)) {
                e.preventDefault();
                return false;
            }
        });
    }

    // ==========================================
    // 2. TRAMPAS ANTI-DEBUG Y DEVTOOLS
    // ==========================================

    function debuggerTrap() {
        if (!CONFIG.enableDebuggerTrap) return;

        // Esta función crea un punto de interrupción anónimo que se activa
        // constantemente si las DevTools están abiertas, haciendo muy difícil navegar.
        (function block() {
            try {
                (function () {
                    return false;
                }
                    .constructor('debugger')
                    ());
            } catch (e) { }
            setTimeout(block, 50);
        })();
    }

    // ==========================================
    // 3. OFUSCACIÓN DE CONSOLA
    // ==========================================

    function clearConsole() {
        if (!CONFIG.enableConsoleClear) return;

        // Limpia la consola periódicamente
        setInterval(() => {
            console.clear();
            console.log('%c STOP! ', 'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 4px #000;');
            console.log('%c Esta es una zona restringida. Cualquier intento de ingeniería inversa será monitoreado.', 'font-size: 16px; color: white; background: #333; padding: 5px; border-radius: 5px;');
        }, 2000);
    }

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    // Iniciar trampas
    // NOTA: Para desarrollo local, comentar debuggerTrap() para no volverse loco.
    debuggerTrap();

    // Detectar cambios en tamaño de ventana sospechosos (DevTools docking)
    let checkStatus = () => {
        let threshold = 160;
        let widthThreshold = window.outerWidth - window.innerWidth > threshold;
        let heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            // Acción defensiva si se detecta DevTools
            // DESACTIVADO PORQUE DA FALSOS POSITIVOS EN ALGUNOS NAVEGADORES
            // document.body.innerHTML = '<div style="background:black;color:red;height:100vh;display:flex;justify-content:center;align-items:center;font-family:monospace;font-size:2rem;text-align:center;"><h1>ACCESO DENEGADO<br>SISTEMA DE SEGURIDAD ACTIVADO</h1></div>';
            // debuggerTrap(); // Activar trampa hardcore
            console.warn("DevTools detection triggered, but blocking is disabled to prevent false positives.");
        }
    };

    // Solo activar en producción real para no bloquear al admin (o sea, tú)
    setInterval(checkStatus, 1000);

    // Activar limpieza
    clearConsole();

    console.log("🛡️ Security Core Loaded & Active");

})();

/**
 * SECURITY ARMOR v3.0 - PRO PROTECTION
 * Módulo de defensa activa para prevenir inspección y copia no autorizada.
 */

(function () {
    const CONFIG = {
        enableDevToolsDetection: false,
        disableRightClick: false,
        disableCopyPaste: false,
        disableKeys: false,
        debuggerTrap: false
    };

    // 1. DISABLE RIGHT CLICK
    if (CONFIG.disableRightClick) {
        document.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        });
    }

    // 2. DISABLE KEYBOARD SHORTCUTS (F12, Ctrl+Shift+I, etc.)
    if (CONFIG.disableKeys) {
        document.addEventListener('keydown', e => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + I/J/C (DevTools)
            if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
                e.preventDefault();
                return false;
            }

            // Ctrl + U (View Source)
            if (e.ctrlKey && e.key.toUpperCase() === 'U') {
                e.preventDefault();
                return false;
            }

            // Ctrl + S (Save Page)
            if (e.ctrlKey && e.key.toUpperCase() === 'S') {
                e.preventDefault();
                alert('⚠️ Acción no permitida por seguridad.');
                return false;
            }
        });
    }

    // 3. DISABLE SELECTION & COPY
    if (CONFIG.disableCopyPaste) {
        // CSS Injection to prevent selection
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

        document.addEventListener('copy', e => {
            e.preventDefault();
            return false;
        });
    }

    // 4. ADVANCED DEVTOOLS DETECTION & DEBUGGER TRAP
    // Esta técnica usa diferencias de tiempo y el debugger statement para congelar a los curiosos.
    if (CONFIG.debuggerTrap) {

        // Anti-Debugging Loop
        setInterval(() => {
            const start = performance.now();
            debugger; // Si DevTools está abierto, esto pausa la ejecución aquí.
            const end = performance.now();

            // Si tardamos mucho entre start y end, es que estaba pausado (DevTools abierto)
            if (end - start > 100) {
                // DESACTIVADO PORQUE DA FALSOS POSITIVOS
                // document.body.innerHTML = '<div style="background:black; color:red; height:100vh; display:flex; align-items:center; justify-content:center; font-family:monospace; font-size:2rem; text-align:center;"><h1>⚠️ ACCESO DENEGADO<br><span style="font-size:1rem; color:white;">Sistema de Seguridad Activado. Cierre las herramientas de desarrollo.</span></h1></div>';
                // window.location.reload(); // Bucle de recarga molesto
                console.warn("Debugger trap triggered, but blocking is disabled.");
            }
        }, 1000);
    }

    console.log("%c STOP! ", "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0px black;");
    console.log("%c Este es un sistema protegido. Cualquier intento de ingeniería inversa será monitorizado.", "color: white; background: red; font-size: 16px; padding: 10px;");

})();

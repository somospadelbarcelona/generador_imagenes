/**
 * 🛡️ SECURITY SERVICE v4.0 - CYBER PROTECTION CORE
 * ===============================================
 * High-level security module unifying all protection layers.
 * 
 * Features:
 * - Anti-Inspection (DevTools Detection)
 * - Anti-Copy/Selection
 * - Keyboard & Mouse Lockdown
 * - Advanced Debugger Traps
 * - Console Obfuscation
 */

(function () {
    'use strict';

    const CONFIG = {
        enabled: true,
        debug: false, // Set to true to allow DevTools in local dev
        blockRightClick: true,
        blockSelection: true,
        blockShortcuts: true,
        enableDebuggerTrap: true,
        enableConsoleClear: true,
        devToolsThreshold: 160
    };

    class SecurityService {
        constructor() {
            if (!CONFIG.enabled) return;
            this.init();
        }

        init() {
            console.log("%c ⚙️ Security Core Initializing... ", "color: #00ff00; background: #000; font-weight: bold;");

            this.setupPeripherals();
            this.setupShortcuts();
            this.setupDebuggerTrap();
            this.setupConsoleProtection();
            this.setupDevToolsDetection();

            console.log("%c 🛡️ SYSTEM PROTECTED ", "color: white; background: #ff0000; padding: 5px; font-weight: bold; border-radius: 3px;");
        }

        setupPeripherals() {
            if (CONFIG.blockRightClick) {
                document.addEventListener('contextmenu', e => e.preventDefault(), false);
            }

            if (CONFIG.blockSelection) {
                const style = document.createElement('style');
                style.innerHTML = `
                    body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
                    input, textarea { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }
                    img { -webkit-user-drag: none; }
                `;
                document.head.appendChild(style);

                document.addEventListener('dragstart', e => e.preventDefault(), false);
            }
        }

        setupShortcuts() {
            if (!CONFIG.blockShortcuts || CONFIG.debug) return;

            document.addEventListener('keydown', e => {
                const isCmdOrCtrl = e.metaKey || e.ctrlKey;
                const key = e.key.toUpperCase();

                // F12
                if (e.keyCode === 123 || e.key === 'F12') {
                    this.triggerDefense('F12');
                    e.preventDefault();
                    return false;
                }

                // Ctrl+Shift+I/J/C
                if (isCmdOrCtrl && e.shiftKey && ['I', 'J', 'C'].includes(key)) {
                    this.triggerDefense('DevTools Shortcut');
                    e.preventDefault();
                    return false;
                }

                // Ctrl+U (View Source), Ctrl+S (Save), Ctrl+P (Print)
                if (isCmdOrCtrl && ['U', 'S', 'P'].includes(key)) {
                    this.triggerDefense(`Restricted Key: ${key}`);
                    e.preventDefault();
                    return false;
                }
            }, false);
        }

        setupDebuggerTrap() {
            if (!CONFIG.enableDebuggerTrap || CONFIG.debug) return;

            const trap = function () {
                try {
                    (function () { return false; }.constructor('debugger')());
                } catch (e) { }
                setTimeout(trap, 50);
            };

            // Subtle start to avoid instant detection
            setTimeout(trap, 2000);
        }

        setupConsoleProtection() {
            if (!CONFIG.enableConsoleClear || CONFIG.debug) return;

            setInterval(() => {
                console.clear();
                console.log("%c STOP! ", "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0px black;");
                console.log("%c This is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature, it is a scam.", "font-size: 16px; color: white; background: #333; padding: 10px; border-radius: 5px;");
            }, 3000);
        }

        setupDevToolsDetection() {
            if (CONFIG.debug) return;

            setInterval(() => {
                const widthDiff = window.outerWidth - window.innerWidth > CONFIG.devToolsThreshold;
                const heightDiff = window.outerHeight - window.innerHeight > CONFIG.devToolsThreshold;

                if (widthDiff || heightDiff) {
                    this.triggerDefense('DevTools Window Detected');
                }
            }, 2000);
        }

        triggerDefense(reason) {
            if (CONFIG.debug) {
                console.warn(`[Security] Defense triggered: ${reason}`);
                return;
            }

            // High-level defensive action (can be customized)
            // For now, we logging but we could redirect or blank the screen
            // window.location.href = 'about:blank';
        }

        /**
         * AUDIT FIX: Sanitize potential HTML strings to prevent XSS
         */
        sanitize(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    }

    // Singleton Instance
    window.SecurityService = new SecurityService();
})();

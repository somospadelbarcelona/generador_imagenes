/**
 * GamificationEffects.js
 * "Juice" for the user experience.
 * Adds confetti, fire effects, and celebration animations.
 */

export const GamificationEffects = {
    playLevelUp() {
        console.log("🔥 LEVEL UP EFFECT!");
        // TODO: Implement Canvas confetti or CSS animation
    },

    attachCardEffects() {
        // Añadir efecto de "resplandor" a las tarjetas de partido
        const style = document.createElement('style');
        style.textContent = `
            @keyframes border-pulse {
                0% { box-shadow: 0 0 0 0 rgba(199, 244, 42, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(199, 244, 42, 0); }
                100% { box-shadow: 0 0 0 0 rgba(199, 244, 42, 0); }
            }
            .pulse-border {
                animation: border-pulse 2s infinite;
            }
            .fire-text {
                background: linear-gradient(0deg, #f00 20%, #ff0 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 900;
            }
        `;
        document.head.appendChild(style);
    }
};

// Auto-run styles
GamificationEffects.attachCardEffects();

/**
 * DashboardController.js (Organizer Version)
 * Connects the View (Tower) with the Logic (Brain).
 */
(function () {
    class DashboardController {
        constructor() {
            this.init();
        }

        init() {
            console.log("🎮 DashboardController (Organizer) Starting...");

            // Connect global actions for the View (onClick handlers)
            window.TowerActions = {
                toggleTimer: () => window.AmericanaLogic.toggleTimer(),
                // Updated for Numeric Inputs
                updateScore: (courtId, team, change) => window.AmericanaLogic.recordResult(courtId, team, change),
                finalize: (courtId) => window.AmericanaLogic.finalizeMatch(courtId),
                reopen: (courtId) => window.AmericanaLogic.reopenMatch(courtId),
                toggleStatus: (courtId) => window.AmericanaLogic.toggleMatchStatus(courtId), // New Interaction
                nextRound: () => window.AmericanaLogic.generateNextRound(),
                horn: () => window.AmericanaLogic.playHorn(),
                // Start with requested courts if creating new
                goToRound: (n) => window.AmericanaLogic.goToRound(n), // New Nav
                start: (n) => window.AmericanaLogic.startTournament({ courts: n }),
                // Emergency Reset
                reset: () => {
                    if (confirm("¿Seguro que quieres RESETEAR TOTALMENTE? Se borrará todo el progreso.")) {
                        window.AmericanaLogic.resetTournament();
                    }
                }
            };

            // Start a default session if none active
            setTimeout(() => {
                if (window.AmericanaLogic && !window.AmericanaLogic.state.active) {
                    window.AmericanaLogic.startTournament({ courts: 5 });
                }
            }, 1000);
        }
    }

    window.DashboardController = new DashboardController();
})();

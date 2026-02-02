/**
 * StatsController.js
 */
(function () {
    class StatsController {
        init() {
            console.log("[StatsController] Initializing...");
            const user = window.Store ? window.Store.getState('currentUser') : null;

            if (window.StatsView) {
                window.StatsView.render(user || { level: 3.5, win_rate: 0, matches_played: 0 });
            }
        }
    }

    window.StatsController = new StatsController();
    console.log("📈 StatsController Initialized");
})();

/**
 * AutomationService.js
 * Servicio de fondo para tareas automáticas como:
 * - Arrancar proceso de emparejamiento 4h antes de eventos
 * - Actualizar estados, etc.
 */

const AutomationService = {
    checkInterval: null,

    init() {
        console.log("🤖 AutomationService Starting...");
        // Run check immediately
        this.runChecks();

        // Then every 5 minutes
        this.checkInterval = setInterval(() => this.runChecks(), 5 * 60 * 1000);
    },

    async runChecks() {
        if (!window.EventService || !window.MatchMakingService) {
            console.warn("⚠️ AutomationService halted (Dependencies missing)");
            return;
        }

        console.log("🤖 AutomationService: Checking for upcoming events...");

        try {
            await this.checkUpcomingEntrenos();
        } catch (e) {
            console.error("❌ AutomationService Error:", e);
        }
    },

    async checkUpcomingEntrenos() {
        // Fetch ALL entrenos (or filter by date if optimized)
        // For now, fetch all and filter client-side for "TODAY"
        const entrenos = await window.EventService.getAll('entreno');

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

        // Filter: Today, Status Open, Has Start Time
        const candidates = entrenos.filter(e => {
            if (e.status !== 'open') return false; // Only touch 'open' events
            if (!e.date || !e.time) return false;

            // Normalize Date format (Handle "2024-01-25" or "25/01/2024")
            let dateStr = e.date;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            return dateStr === todayStr;
        });

        if (candidates.length === 0) {
            console.log("🤖 No open entrenos for today to automate.");
            return;
        }

        console.log(`🤖 Found ${candidates.length} open entrenos for today. Checking triggering time...`);

        for (const evt of candidates) {
            try {
                // Parse Time
                const [h, m] = evt.time.split(':').map(Number);
                const evtDate = new Date(); // Today
                evtDate.setHours(h, m, 0, 0);

                // Diff in Hours
                const diffMs = evtDate - now;
                const diffHours = diffMs / (1000 * 60 * 60);

                console.log(`   > Checking ${evt.name}: Starts in ${diffHours.toFixed(2)}h`);

                // TRIGGER CONDITION: <= 4 Hours before start
                if (diffHours <= 4 && diffHours > -2) { // Allow up to 2h late trigger just in case
                    console.log(`🚀 AUTO-START TRIGGERED for: ${evt.name} (${evt.id})`);
                    await this.triggerAutoStart(evt);
                }

            } catch (err) {
                console.error(`   > Error processing ${evt.name}:`, err);
            }
        }
    },

    async triggerAutoStart(evt) {
        // 1. Change Status to 'pairing' (EMPAREJAMIENTO)
        console.log(`   [Action 1/2] Setting status to 'pairing'...`);

        // Direct DB update or Service
        // Using direct DB to be safe and fast? Or Service?
        // Let's use service if available, but manual update works too.
        await window.db.collection('entrenos').doc(evt.id).update({
            status: 'pairing',
            auto_started_at: new Date().toISOString()
        });

        // 2. Generate Round 1
        console.log(`   [Action 2/2] Generating Round 1...`);
        try {
            await window.MatchMakingService.generateRound(evt.id, 'entreno', 1);
            console.log(`✅ AUTO-START COMPLETE: ${evt.name}`);

            // Optional: Notify UI if visible
            if (typeof window.showNotification === 'function') {
                window.showNotification(`🤖 Piloto Automático: Generada Ronda 1 para ${evt.name}`, 'info');
            }
        } catch (genErr) {
            console.error(`   ❌ Failed to generate round for ${evt.id}:`, genErr);
            // Revert status? Or leave as pairing?
            // Leave as pairing so admin sees it changed but empty.
        }
    }
};

// Export and Auto-Start
window.AutomationService = AutomationService;

// Hook into AdminAuth or main Window load
// We'll rely on index.html loading this script.

/**
 * TestDataSeeder.js
 * Utilidad para generar datos de prueba.
 */
import { americanaService } from '../modules/americanas/AmericanaService.js';

export const TestDataSeeder = {
    async generate() {
        console.log("🌱 Seeding Database...");
        const today = new Date().toISOString().split('T')[0];

        try {
            // 1. Americana PRO (Event)
            await americanaService.createAmericana({
                name: "🏆 Americana PRO Viernes",
                date: today,
                time: "19:00",
                max_courts: 8,
                level: "PRO (4.5+)",
                status: "active" // Simular que ya está ocurriendo
            });

            // 2. Clase Particular (Event)
            await americanaService.createAmericana({
                name: "🎾 Clase Particular - Alex",
                date: today,
                time: "18:00",
                max_courts: 1,
                level: "N/A",
                status: "active"
            });

            console.log("✅ Seed Complete! Refresh Dashboard.");
            alert("✅ Datos de prueba generados. El Dashboard debería actualizarse.");
            window.location.reload();
        } catch (e) {
            console.error("Seed failed:", e);
            alert("❌ Error generando datos: " + e.message);
        }
    }
};

window.TestDataSeeder = TestDataSeeder;

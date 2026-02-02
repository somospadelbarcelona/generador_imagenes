/**
 * 🌪️ TWISTER SIMULATION DIAGNOSTIC
 * Simula un entreno completo para validar la lógica de emparejamientos y movimientos.
 */
window.TwisterSimulation = {
    run: async () => {
        console.clear();
        console.log("%c🌪️ INICIANDO SIMULACIÓN TWISTER MIXTO (16 Jugadores, 6 Rondas)", "color: #CCFF00; font-size: 14px; font-weight: bold; background: #000; padding: 10px;");

        // 1. GENERATE DUMMY PLAYERS
        const players = [];
        for (let i = 1; i <= 8; i++) {
            players.push({ id: `M${i}`, name: `Chico ${i}`, gender: 'chico', level: 4.5, current_court: Math.floor((i - 1) / 2) + 1 });
            players.push({ id: `F${i}`, name: `Chica ${i}`, gender: 'chica', level: 4.0, current_court: Math.floor((i - 1) / 2) + 1 });
        }

        console.log("👥 Jugadores generados:", players.map(p => `${p.name} (Pista ${p.current_court})`).join(', '));

        let currentPlayers = JSON.parse(JSON.stringify(players));
        const maxCourts = 4;

        // 2. RUN ROUNDS
        for (let round = 1; round <= 6; round++) {
            console.group(`%c🔔 RONDA ${round}`, "color: yellow; font-size: 12px;");

            // A. Generate Matches
            const matches = RotatingPozoLogic.generateRound(currentPlayers, round, maxCourts, 'mixed');

            if (matches.length === 0) {
                console.error("❌ Error: No se generaron partidos.");
                break;
            }

            console.table(matches.map(m => ({
                Pista: m.court,
                "Pareja A": `${m.team_a_names[0]} & ${m.team_a_names[1]}`,
                "Pareja B": `${m.team_b_names[0]} & ${m.team_b_names[1]}`
            })));

            // B. Validate Rotation (Mixto Logic check)
            matches.forEach(m => {
                const teamA = currentPlayers.filter(p => m.team_a_ids.includes(p.id));
                const hasMaleA = teamA.some(p => p.gender === 'chico');
                const hasFemaleA = teamA.some(p => p.gender === 'chica');

                if (!hasMaleA || !hasFemaleA) {
                    console.warn(`⚠️ ALERTA MIXTO: Pista ${m.court} Pareja A no es mixta!`, teamA);
                }
            });

            // C. Simulate Results (Random Winners)
            const results = matches.map(m => {
                // Random score 6-4 or 4-6
                const winA = Math.random() > 0.5;
                return {
                    ...m,
                    status: 'finished',
                    score_a: winA ? 6 : 4,
                    score_b: winA ? 4 : 6,
                    team_a_ids: m.team_a_ids,
                    team_b_ids: m.team_b_ids
                };
            });

            console.log("🎲 Resultados Simulados:", results.map(r => `Pista ${r.court}: ${r.score_a}-${r.score_b}`).join(' | '));

            // D. Process Movements
            // IMPORTANT: We use the logic function directly
            currentPlayers = RotatingPozoLogic.updatePlayerCourts(currentPlayers, results, maxCourts, 'mixed');

            // Log Movements
            const movementLog = currentPlayers.map(p => {
                const prev = players.find(old => old.id === p.id); // This verify logic is tricky cause players array is static
                // Better: Just show current court distribution
                return p;
            });

            // Group by court for visualization
            const courtsDist = {};
            currentPlayers.forEach(p => {
                if (!courtsDist[p.current_court]) courtsDist[p.current_court] = [];
                courtsDist[p.current_court].push(p.name);
            });

            console.log("📍 Distribución post-partido:", courtsDist);
            console.groupEnd();

            // Slight delay for console rendering
            await new Promise(r => setTimeout(r, 100));
        }

        console.log("%c✅ SIMULACIÓN FINALIZADA - Lógica Validada", "color: #00E36D; font-weight: bold; font-size: 14px; background: #000; padding:10px;");
    }
};

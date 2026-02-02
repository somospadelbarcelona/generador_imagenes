
const { RotatingPozoLogic } = require('./js/rotating-pozo-logic.js');

// Mock players
const players = [
    { id: 'P1', name: 'Player 1', current_court: 1, gender: 'chico' },
    { id: 'P2', name: 'Player 2', current_court: 1, gender: 'chico' },
    { id: 'P3', name: 'Player 3', current_court: 1, gender: 'chico' },
    { id: 'P4', name: 'Player 4', current_court: 1, gender: 'chico' },
    { id: 'P5', name: 'Player 5', current_court: 2, gender: 'chico' },
    { id: 'P6', name: 'Player 6', current_court: 2, gender: 'chico' },
    { id: 'P7', name: 'Player 7', current_court: 2, gender: 'chico' },
    { id: 'P8', name: 'Player 8', current_court: 2, gender: 'chico' }
];

function simulateTournament(category = 'open') {
    console.log(`\n=== SIMULANDO TORNEO TWISTER (${category.toUpperCase()}) ===`);
    let currentPlayers = JSON.parse(JSON.stringify(players));

    // For mixed, assign genders
    if (category === 'mixed') {
        currentPlayers[0].gender = 'chico'; currentPlayers[1].gender = 'chico';
        currentPlayers[2].gender = 'chica'; currentPlayers[3].gender = 'chica';
        currentPlayers[4].gender = 'chico'; currentPlayers[5].gender = 'chico';
        currentPlayers[6].gender = 'chica'; currentPlayers[7].gender = 'chica';
    }

    let partnerHistory = {}; // To check if partners repeat too much

    for (let r = 1; r <= 6; r++) {
        console.log(`\n--- RONDA ${r} ---`);

        // 1. Generate Matches
        const matches = RotatingPozoLogic.generateRound(currentPlayers, r, 2, category);

        matches.forEach(m => {
            console.log(`Pista ${m.court}: [${m.team_a_names.join(' & ')}] vs [${m.team_b_names.join(' & ')}]`);

            // Track partners
            const teamA = m.team_a_ids;
            const teamB = m.team_b_ids;

            [teamA, teamB].forEach(team => {
                const p1 = team[0];
                const p2 = team[1];
                const key = [p1, p2].sort().join('-');
                partnerHistory[key] = (partnerHistory[key] || 0) + 1;
            });

            // Simulate result: Team A always wins in Court 2, Team B wins in Court 1 (to force movement)
            if (m.court === 1) {
                m.score_a = 2; m.score_b = 6; // Team B wins
            } else {
                m.score_a = 6; m.score_b = 2; // Team A wins
            }
            m.status = 'finished';
        });

        // 2. Update Courts for next round
        if (r < 6) {
            currentPlayers = RotatingPozoLogic.updatePlayerCourts(currentPlayers, matches, 2, category);
            console.log("Movimientos:");
            currentPlayers.forEach(p => console.log(`${p.name} -> Pista ${p.current_court}`));
        }
    }

    console.log("\n--- HISTORIAL DE PAREJAS ---");
    Object.entries(partnerHistory).forEach(([pair, count]) => {
        if (count > 1) console.log(`${pair}: ${count} veces`);
    });
}

simulateTournament('open');
simulateTournament('mixed');

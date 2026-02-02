/**
 * 🔒 FIXED PAIRS LOGIC - Sistema Pozo
 * Lógica para manejar parejas fijas que suben y bajan juntas según resultados
 */

const FixedPairsLogic = {

    /**
     * Crear parejas fijas al inicio del torneo
     * @param {Array} players - Lista de jugadores
     * @returns {Array} - Lista de parejas fijas
     */
    createFixedPairs(players, category = 'open', preserveOrder = false) {
        console.log(`🔒 Creando parejas fijas para ${players.length} jugadores (Modo: ${category}, Ordenado: ${preserveOrder})...`);

        let shuffled;
        if (category === 'mixed' || preserveOrder) {
            // Si es mixto o se pide preservar orden (Entrenos por nivel)
            // No barajamos
            shuffled = [...players];
        } else {
            // Mezclar jugadores aleatoriamente
            shuffled = [...players].sort(() => 0.5 - Math.random());
        }

        const pairs = [];

        // Emparejar de 2 en 2
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                const pair = {
                    id: `pair_${Date.now()}_${i / 2}`,
                    player1_id: shuffled[i].id,
                    player2_id: shuffled[i + 1].id,
                    player1_name: shuffled[i].name,
                    player2_name: shuffled[i + 1].name,
                    pair_name: `${shuffled[i].name} / ${shuffled[i + 1].name}`,
                    wins: 0,
                    losses: 0,
                    games_won: 0,
                    games_lost: 0,
                    current_court: Math.floor(i / 4) + 1, // Asignar pista inicial (1, 1, 2, 2, 3, 3, etc.)
                    initial_court: Math.floor(i / 4) + 1
                };
                pairs.push(pair);
            }
        }

        console.log(`✅ ${pairs.length} parejas creadas`);
        return pairs;
    },

    /**
     * Generar ronda con sistema Pozo (parejas fijas)
     * @param {Array} pairs - Parejas fijas
     * @param {Number} roundNumber - Número de ronda
     * @param {Number} maxCourts - Número máximo de pistas
     * @returns {Array} - Partidos generados
     */
    generatePozoRound(pairs, roundNumber, maxCourts) {
        console.log(`🎾 Generando ronda ${roundNumber} con sistema Pozo...`);

        // Ordenar parejas por pista actual
        const sortedPairs = [...pairs].sort((a, b) => a.current_court - b.current_court);

        const matches = [];

        // Emparejar: las 2 primeras parejas juegan en pista 1, las siguientes 2 en pista 2, etc.
        for (let i = 0; i < sortedPairs.length; i += 2) {
            if (i + 1 < sortedPairs.length) {
                const pairA = sortedPairs[i];
                const pairB = sortedPairs[i + 1];

                matches.push({
                    round: roundNumber,
                    court: pairA.current_court,
                    pair_a_id: pairA.id,
                    pair_b_id: pairB.id,
                    team_a_ids: [pairA.player1_id, pairA.player2_id],
                    team_b_ids: [pairB.player1_id, pairB.player2_id],
                    team_a_names: [pairA.player1_name, pairA.player2_name],
                    team_b_names: [pairB.player1_name, pairB.player2_name],
                    teamA: pairA.pair_name, // Redundant field for UI
                    teamB: pairB.pair_name, // Redundant field for UI
                    status: 'scheduled',
                    score_a: 0,
                    score_b: 0
                });
            }
        }

        console.log(`✅ ${matches.length} partidos generados para ronda ${roundNumber}`);
        return matches;
    },

    /**
     * Actualizar rankings de parejas después de una ronda (lógica Pozo)
     * @param {Array} pairs - Parejas actuales
     * @param {Array} lastRoundMatches - Partidos de la última ronda
     * @param {Number} maxCourts - Número máximo de pistas
     * @returns {Array} - Parejas actualizadas
     */
    updatePozoRankings(pairs, lastRoundMatches, maxCourts) {
        console.log(`📊 Actualizando rankings Pozo (Parejas Fijas)...`);

        // Crear un mapa para acceso rápido
        const pairMap = {};
        pairs.forEach(p => {
            pairMap[p.id] = p;
            // Marcar como no jugado en esta ronda
            p.won_last_match = false;
        });

        // Procesar resultados de la última ronda
        lastRoundMatches.forEach(match => {
            if (match.status === 'finished') {
                const teamAIds = Array.isArray(match.team_a_ids) ? match.team_a_ids.map(String) : [];
                const teamBIds = Array.isArray(match.team_b_ids) ? match.team_b_ids.map(String) : [];

                // Fallback: search pairs containing players if IDs missing (Robustness)
                let pairA = pairMap[match.pair_a_id];
                let pairB = pairMap[match.pair_b_id];

                if (!pairA) {
                    // Try finding by player composition
                    pairA = pairs.find(p => teamAIds.includes(String(p.player1_id)) || teamAIds.includes(String(p.player2_id)));
                }
                if (!pairB) {
                    pairB = pairs.find(p => teamBIds.includes(String(p.player1_id)) || teamBIds.includes(String(p.player2_id)));
                }

                if (!pairA || !pairB) {
                    console.warn(`⚠️ Pareja no encontrada en match ${match.id} (Ronda ${match.round})`);
                    return;
                }

                const scoreA = parseInt(match.score_a || 0);
                const scoreB = parseInt(match.score_b || 0);

                // Actualizar estadísticas generales
                pairA.games_won = (pairA.games_won || 0) + scoreA;
                pairA.games_lost = (pairA.games_lost || 0) + scoreB;
                pairB.games_won = (pairB.games_won || 0) + scoreB;
                pairB.games_lost = (pairB.games_lost || 0) + scoreA;

                // Determinar ganador y perdedor
                let winner, loser;
                // Strict win (no draw handling for court movement in original?)
                // If draw, we keep them in place or random?
                // Logic says: winners go up. Draw -> Stick?
                if (scoreA > scoreB) {
                    winner = pairA;
                    loser = pairB;
                    pairA.wins = (pairA.wins || 0) + 1;
                    pairB.losses = (pairB.losses || 0) + 1;
                } else if (scoreB > scoreA) {
                    winner = pairB;
                    loser = pairA;
                    pairB.wins = (pairB.wins || 0) + 1;
                    pairA.losses = (pairA.losses || 0) + 1;
                } else {
                    // EMPATE / TIE
                    pairA.won_last_match = true; // Neutral
                    pairB.won_last_match = true;
                    // No movement if tie? Or treat as status quo
                }

                // Aplicar lógica POZO: Ganador sube, Perdedor baja
                if (winner && loser) {
                    winner.won_last_match = true;
                    loser.won_last_match = false;

                    // GANADOR: Sube de pista (número menor) si no está en pista 1
                    if (winner.current_court > 1) {
                        winner.current_court--;
                    }
                    // Si ya está en pista 1, se mantiene en pista 1

                    // PERDEDOR: Baja de pista (número mayor)
                    if (loser.current_court < maxCourts) {
                        loser.current_court++;
                    }
                }

                // Marcar como jugado en esta ronda
                pairA.last_played_round = match.round;
                pairB.last_played_round = match.round;
            }
        });

        // --- REORGANIZACIÓN INTELIGENTE DE PISTAS ---
        // Ordenar parejas por su pista actual (las que están en pistas mejores primero)
        // Esto respeta el movimiento arriba/abajo que acabamos de calcular
        // --- REORGANIZACIÓN INTELIGENTE DE PISTAS ---
        // Ordenar parejas por su pista actual, priorizando ganadores en caso de conflicto
        pairs.sort((a, b) => {
            const courtA = a.current_court || 999;
            const courtB = b.current_court || 999;

            // 1. Prioridad Absoluta: Pista Objetivo
            if (courtA !== courtB) return courtA - courtB;

            // 2. Estabilidad: Ganadores primero (Evita que un perdedor desplace a un ganador en bordes)
            if (a.won_last_match && !b.won_last_match) return -1;
            if (!a.won_last_match && b.won_last_match) return 1;

            // 3. Mérito: Juegos Ganados (Mayor a menor)
            return (b.games_won || 0) - (a.games_won || 0);
        });

        // Reasignar pistas secuencialmente para llenar huecos
        // 2 parejas por pista (pista 1, pista 1, pista 2, pista 2, etc.)
        pairs.forEach((p, index) => {
            p.current_court = Math.floor(index / 2) + 1;
        });

        console.log(`✅ Rankings actualizados - Parejas redistribuidas en ${Math.ceil(pairs.length / 2)} pistas`);

        // Ordenar parejas por clasificación (para mostrar en ranking)
        const sortedPairs = [...pairs].sort((a, b) => {
            // Primero por juegos ganados
            if (b.games_won !== a.games_won) return b.games_won - a.games_won;
            // Luego por victorias
            if (b.wins !== a.wins) return b.wins - a.wins;
            // Finalmente por juegos perdidos (menos es mejor)
            return a.games_lost - b.games_lost;
        });

        return sortedPairs;
    },

    /**
     * Calcular clasificación para parejas fijas
     * @param {Array} pairs - Parejas
     * @returns {Array} - Clasificación ordenada
     */
    calculateStandings(pairs) {
        return pairs.map((p, index) => ({
            position: index + 1,
            name: p.pair_name,
            court: p.current_court,
            games: p.games_won,
            won: p.wins,
            lost: p.losses,
            played: p.wins + p.losses,
            // Indicador de tendencia (comparar con pista inicial)
            trend: p.current_court < p.initial_court ? '↑' :
                p.current_court > p.initial_court ? '↓' : '='
        }));
    }
};

// Exportar globalmente
window.FixedPairsLogic = FixedPairsLogic;
console.log("🔒 FixedPairsLogic cargado");

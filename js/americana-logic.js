const AmericanaLogic = {

    /**
     * CONFIGURATION - The "Hyperparameters" of our AI model.
     */
    CONFIG: {
        WEIGHTS: {
            REPEAT_PARTNER: 10000,
            REPEAT_OPPONENT: 800,
            LEVEL_IMBALANCE: 1200,
            COURT_REPETITION: 400, // Important for 10-court events
            REST_REPETITION: 5000  // Critical to rotate descansos
        },
        MAX_ITERATIONS_PER_BUCKET: 3,
        IDEAL_PLAYERS_PER_COURT: 4
    },

    /**
     * MAIN PIPELINE: Generate the optimal round.
     */
    generateRound(players, previousMatches, courtCount) {
        console.time("AI_Computation");
        console.log(`🤖 AI: Analyzing cohort of ${players.length} players for ${courtCount} courts...`);

        // 1. Calculate History & Rankings
        const rankings = this.calculateRankings(players, previousMatches);

        // 2. Handle rests (Descansos)
        const maxPlayingPlayers = courtCount * 4;
        const availablePlayers = rankings.slice(0, Math.min(rankings.length, maxPlayingPlayers));
        const restingPlayers = rankings.slice(maxPlayingPlayers);

        if (restingPlayers.length > 0) {
            console.log(`⚠️ AI: ${restingPlayers.length} players will rest this round.`);
        }

        const matches = [];
        const pool = [...availablePlayers];

        // 3. Process by "Skill Buckets" to ensure level parity
        // We group by 4s (1-4, 5-8, etc.) to minimize level diff automatically
        for (let i = 0; i < pool.length; i += 4) {
            const bucket = pool.slice(i, i + 4);
            if (bucket.length < 4) break;

            const courtNum = Math.floor(i / 4) + 1;
            const optimMatch = this.optimizeBucket(bucket, previousMatches, courtNum);
            matches.push(optimMatch);
        }

        console.timeEnd("AI_Computation");
        return {
            matches,
            resting_players: restingPlayers
        };
    },

    /**
     * SOLVER: Pick the best pairing within a 4-player group.
     */
    optimizeBucket(group, history, courtNumber) {
        const scenarios = [
            { teamA: [group[0], group[1]], teamB: [group[2], group[3]] },
            { teamA: [group[0], group[2]], teamB: [group[1], group[3]] },
            { teamA: [group[0], group[3]], teamB: [group[1], group[2]] }
        ];

        let bestScenario = null;
        let minCost = Infinity;

        scenarios.forEach(scen => {
            const cost = this.calculateCost(scen, history, courtNumber);
            const finalCost = cost + Math.random() * 10; // Tie breaker

            if (finalCost < minCost) {
                minCost = finalCost;
                bestScenario = scen;
            }
        });

        const levelA = this.calculateTeamLevel(bestScenario.teamA);
        const levelB = this.calculateTeamLevel(bestScenario.teamB);
        const winProbA = this.predictWinProbability(levelA - levelB);

        return {
            team_a_ids: bestScenario.teamA.map(p => p.id),
            team_b_ids: bestScenario.teamB.map(p => p.id),
            team_a_names: bestScenario.teamA.map(p => p.name).join(' / '),
            team_b_names: bestScenario.teamB.map(p => p.name).join(' / '),
            court: courtNumber,
            status: 'scheduled',
            score_a: 0,
            score_b: 0,
            ai_metrics: {
                match_quality: Math.max(0, Math.min(100, (100 - (minCost / 100)))).toFixed(0),
                win_prob_a: (winProbA * 100).toFixed(0)
            }
        };
    },

    calculateCost(scenario, history, courtNumber) {
        let cost = 0;
        const allInScen = [...scenario.teamA, ...scenario.teamB];

        // 1. Partner Repetition
        if (this.havePlayedAsPartners(scenario.teamA[0], scenario.teamA[1], history)) cost += this.CONFIG.WEIGHTS.REPEAT_PARTNER;
        if (this.havePlayedAsPartners(scenario.teamB[0], scenario.teamB[1], history)) cost += this.CONFIG.WEIGHTS.REPEAT_PARTNER;

        // 2. Level Imbalance
        const levelA = this.calculateTeamLevel(scenario.teamA);
        const levelB = this.calculateTeamLevel(scenario.teamB);
        cost += Math.abs(levelA - levelB) * this.CONFIG.WEIGHTS.LEVEL_IMBALANCE;

        // 3. Court Repetition (Players hate playing on the same court every time)
        allInScen.forEach(p => {
            const lastMatch = [...history].reverse().find(m => m.team_a_ids?.includes(p.id) || m.team_b_ids?.includes(p.id));
            if (lastMatch && lastMatch.court === courtNumber) {
                cost += this.CONFIG.WEIGHTS.COURT_REPETITION;
            }
        });

        return cost;
    },

    havePlayedAsPartners(p1, p2, matches) {
        return matches.some(m => {
            const teamA = m.team_a_ids || [];
            const teamB = m.team_b_ids || [];
            return (teamA.includes(p1.id) && teamA.includes(p2.id)) || (teamB.includes(p1.id) && teamB.includes(p2.id));
        });
    },

    calculateTeamLevel(team) {
        const getVal = (p) => {
            if (p.level === 'PRO') return 5.5;
            if (p.level === 'INTERMEDIATE') return 3.5;
            return parseFloat(p.level) || 3.0;
        };
        return (getVal(team[0]) + getVal(team[1])) / 2;
    },

    predictWinProbability(levelDiff) {
        return 1 / (1 + Math.exp(-1.5 * levelDiff));
    },

    calculateRankings(players, matches) {
        // Points calculation + rest tracking
        return players.map(p => {
            const playerMatches = matches.filter(m => m.team_a_ids?.includes(p.id) || m.team_b_ids?.includes(p.id));

            const score = playerMatches.reduce((acc, m) => {
                if (m.status !== 'finished') return acc;
                const isA = m.team_a_ids.includes(p.id);
                return acc + (isA ? (m.score_a || 0) : (m.score_b || 0));
            }, 0);

            // We sort primarily by score, then by "rounds played" (ascending) to give priority to those who rested
            return { ...p, score, matches_played: playerMatches.length };
        }).sort((a, b) => {
            // Priority 1: Fewer matches played (people who rested)
            if (a.matches_played !== b.matches_played) return a.matches_played - b.matches_played;
            // Priority 2: Higher score
            return b.score - a.score;
        });
    }
};

window.AmericanaLogic = AmericanaLogic;

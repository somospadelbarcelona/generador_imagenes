/**
 * StandingsService.js
 * Centralizes the calculation logic for tournament and training standings (Pozo/Americanas).
 */
(function () {
    class StandingsService {
        constructor() {
            console.log("🏆 StandingsService Initialized");
        }

        /**
         * Calculates standings from a list of matches.
         * Optimized for Pozo, Americanas, and Entrenos.
         */
        calculate(matches, type = 'americana') {
            const stats = {};

            matches.forEach(m => {
                const hasScore = (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0;
                if (m.status !== 'finished' && !hasScore) return;

                const scoreA = parseInt(m.score_a || 0);
                const scoreB = parseInt(m.score_b || 0);
                const court = parseInt(m.court || 99);
                const roundNum = parseInt(m.round || 0);

                // Process Team A
                this._processTeam(stats, m.team_a_ids, m.team_a_names, scoreA, scoreB, court, roundNum);
                // Process Team B
                this._processTeam(stats, m.team_b_ids, m.team_b_names, scoreB, scoreA, court, roundNum);
            });

            return Object.values(stats).sort((a, b) => {
                if (type === 'entreno') {
                    // REGLAS DE DESEMPATE ENTRENO (POZO)
                    // 1. Victorias (Wins)
                    if (b.won !== a.won) return b.won - a.won;
                    // 2. Veces en Pista 1 (Court 1 Count)
                    if (b.court1Count !== a.court1Count) return b.court1Count - a.court1Count;
                    // 3. Posición Final (Last Match Court) - Menor es mejor
                    if (a.lastMatchCourt !== b.lastMatchCourt) return a.lastMatchCourt - b.lastMatchCourt;
                    // 4. Puntos Totales (Games Won)
                    return b.points - a.points;
                } else {
                    // AMERICANA STANDARD
                    // 1. Puntos Totales (Games Won)
                    if (b.points !== a.points) return b.points - a.points;
                    // 2. Victorias
                    if (b.won !== a.won) return b.won - a.won;
                    // 3. Diferencia
                    return b.diff - a.diff;
                }
            });
        }

        _processTeam(stats, ids, namesRaw, scoreSelf, scoreOther, court, roundNum) {
            if (!ids || !Array.isArray(ids)) {
                // Handle case where ids is missing but names might exist
                if (namesRaw) {
                    const names = Array.isArray(namesRaw) ? namesRaw : [namesRaw];
                    names.forEach(name => {
                        if (!name) return;
                        this._ensurePlayer(stats, name, name);
                        this._updatePlayerStats(stats[name], scoreSelf, scoreOther, court, roundNum);
                    });
                }
                return;
            }

            let namesArray = [];
            if (Array.isArray(namesRaw)) {
                namesArray = namesRaw;
            } else if (typeof namesRaw === 'string') {
                namesArray = namesRaw.split(' / ').map(s => s.trim());
            }

            ids.forEach((uid, idx) => {
                const pName = namesArray[idx] || `Jugador \${idx + 1}`;
                this._ensurePlayer(stats, uid, pName);
                this._updatePlayerStats(stats[uid], scoreSelf, scoreOther, court, roundNum);
            });
        }

        _ensurePlayer(stats, uid, name) {
            if (!stats[uid]) {
                stats[uid] = {
                    uid: uid,
                    name: name,
                    played: 0,
                    won: 0,
                    lost: 0,
                    draw: 0,
                    points: 0, // Games Won
                    gamesLost: 0,
                    leaguePoints: 0, // 3 for win, 1 for draw
                    diff: 0,
                    court1Count: 0,
                    bestCourt: 99,
                    lastMatchCourt: 99,
                    lastMatchRound: 0
                };
            }
        }

        _updatePlayerStats(p, scoreSelf, scoreOther, court, roundNum) {
            p.played++;
            p.points += scoreSelf;
            p.gamesLost += scoreOther;
            p.diff = p.points - p.gamesLost;

            if (scoreSelf > scoreOther) {
                p.won++;
                p.leaguePoints += 3;
            } else if (scoreSelf === scoreOther && scoreSelf > 0) {
                p.draw++;
                p.leaguePoints += 1;
            } else {
                p.lost++;
            }

            if (parseInt(court) === 1) p.court1Count++;
            if (parseInt(court) < p.bestCourt) p.bestCourt = parseInt(court);

            if (roundNum >= p.lastMatchRound) {
                p.lastMatchRound = roundNum;
                p.lastMatchCourt = parseInt(court);
            }
        }
    }

    window.StandingsService = new StandingsService();
})();

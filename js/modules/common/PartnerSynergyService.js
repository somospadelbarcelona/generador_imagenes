/**
 * PartnerSynergyService.js
 * 🔗 RADAR DE SINERGIAS - Smart Partner Matching
 * Analiza compatibilidad, química y estadísticas para sugerir las mejores parejas
 */

(function () {
    'use strict';

    class PartnerSynergyService {
        constructor() {
            this.db = window.db;
            this.cache = new Map();
            this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
            this.subscriptions = new Map(); // Store active listeners
        }

        /**
         * Suscribe a cambios en tiempo real para un jugador
         * (Perfil, partidos recientes, etc.) para refrescar la sinergia.
         */
        subscribeToPlayerData(playerId, callback) {
            if (this.subscriptions.has(playerId)) {
                this.unsubscribeFromPlayerData(playerId);
            }

            console.log(`🔗 [SynergyService] Subscribing to real-time updates for: ${playerId}`);

            const unsubPlayer = this.db.collection('players').doc(playerId)
                .onSnapshot(doc => {
                    console.log(`👤 [SynergyService] Player data updated: ${playerId}`);
                    this.clearCache();
                    callback();
                }, err => console.error("Error in player snapshot:", err));

            // Escuchar también últimos partidos (simplificado)
            const unsubMatches = this.db.collection('matches')
                .where('team_a_ids', 'array-contains', playerId)
                .limit(5)
                .onSnapshot(snap => {
                    console.log(`🎾 [SynergyService] Matches updated (Team A): ${playerId}`);
                    this.clearCache();
                    callback();
                }, err => console.error("Error in matches A snapshot:", err));

            const unsubMatchesB = this.db.collection('matches')
                .where('team_b_ids', 'array-contains', playerId)
                .limit(5)
                .onSnapshot(snap => {
                    console.log(`🎾 [SynergyService] Matches updated (Team B): ${playerId}`);
                    this.clearCache();
                    callback();
                }, err => console.error("Error in matches B snapshot:", err));

            this.subscriptions.set(playerId, [unsubPlayer, unsubMatches, unsubMatchesB]);
        }

        unsubscribeFromPlayerData(playerId) {
            const subs = this.subscriptions.get(playerId);
            if (subs) {
                subs.forEach(unsub => unsub());
                this.subscriptions.delete(playerId);
                console.log(`📴 [SynergyService] Unsubscribed from: ${playerId}`);
            }
        }

        async calculateSynergy(playerId1, playerId2, preFetchedMatches = null) {
            try {
                const cacheKey = `${playerId1}_${playerId2}`;
                const cached = this.cache.get(cacheKey);

                if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
                    return cached.data;
                }

                const [player1, player2] = await Promise.all([
                    this.getPlayerData(playerId1),
                    this.getPlayerData(playerId2)
                ]);

                if (!player1 || !player2) return null;

                const sharedMatches = preFetchedMatches ?
                    this.extractSharedMatches(playerId1, playerId2, preFetchedMatches) :
                    await this.getSharedMatches(playerId1, playerId2);

                // Calcular diferentes aspectos de sinergia
                const levelCompatibility = this.calculateLevelCompatibility(player1, player2);
                const playChemistry = this.calculatePlayChemistry(sharedMatches);
                const styleCompatibility = this.calculateStyleCompatibility(player1, player2);
                const activityAlignment = this.calculateActivityAlignment(player1, player2);

                // Score total ponderado
                const totalScore = (
                    levelCompatibility.score * 0.25 +
                    playChemistry.score * 0.35 +
                    styleCompatibility.score * 0.25 +
                    activityAlignment.score * 0.15
                );

                const result = {
                    playerId1,
                    playerId2,
                    player1Name: player1.name,
                    player2Name: player2.name,
                    totalScore: Math.round(totalScore * 100) / 100,
                    rating: this.getRating(totalScore),
                    levelCompatibility,
                    playChemistry,
                    styleCompatibility,
                    activityAlignment,
                    sharedMatches: sharedMatches.length,
                    recommendation: this.getRecommendation(totalScore, sharedMatches.length)
                };

                // Guardar en caché
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });

                return result;
            } catch (error) {
                console.error('Error calculating synergy:', error);
                return null;
            }
        }

        /**
         * Obtiene las mejores parejas para un jugador
         * @param {string} playerId - ID del jugador
         * @param {number} limit - Número máximo de sugerencias
         * @returns {Promise<Array>} Array de sugerencias ordenadas por score
         */
        async getBestPartnersFor(playerId, limit = 5) {
            try {
                const [allPlayers, myMatches] = await Promise.all([
                    this.getAllActivePlayers(),
                    window.FirebaseDB.matches.getByPlayer(playerId)
                ]);

                const currentPlayer = allPlayers.find(p => p.id === playerId);
                if (!currentPlayer) return [];

                const synergies = [];
                // Para no saturar, nos centramos en los 20 jugadores más cercanos en nivel
                const neighbors = allPlayers
                    .filter(p => p.id !== playerId)
                    .sort((a, b) => Math.abs((a.level || 3.5) - (currentPlayer.level || 3.5)) - Math.abs((b.level || 3.5) - (currentPlayer.level || 3.5)))
                    .slice(0, 20);

                for (const player of neighbors) {
                    const pid = player.id;
                    const synergy = await this.calculateSynergy(playerId, pid, myMatches);
                    if (synergy && synergy.totalScore > 0) {
                        synergies.push({
                            ...synergy,
                            player: player
                        });
                    }
                }

                synergies.sort((a, b) => b.totalScore - a.totalScore);
                return synergies.slice(0, limit);
            } catch (error) {
                console.error('Error getting best partners:', error);
                return [];
            }
        }

        /**
         * Calcula compatibilidad de nivel
         */
        calculateLevelCompatibility(player1, player2) {
            const level1 = parseFloat(player1.level || player1.self_rate_level || 3.5);
            const level2 = parseFloat(player2.level || player2.self_rate_level || 3.5);
            const difference = Math.abs(level1 - level2);

            let score = 100;
            let label = 'PERFECTO';
            let color = '#22c55e';

            if (difference <= 0.3) {
                score = 100;
                label = 'PERFECTO';
                color = '#22c55e';
            } else if (difference <= 0.6) {
                score = 85;
                label = 'EXCELENTE';
                color = '#84cc16';
            } else if (difference <= 1.0) {
                score = 70;
                label = 'BUENO';
                color = '#eab308';
            } else if (difference <= 1.5) {
                score = 50;
                label = 'ACEPTABLE';
                color = '#f97316';
            } else {
                score = 30;
                label = 'DESBALANCEADO';
                color = '#ef4444';
            }

            return {
                score,
                label,
                color,
                level1,
                level2,
                difference: Math.round(difference * 10) / 10
            };
        }

        /**
         * Calcula química de juego basada en partidos compartidos
         */
        calculatePlayChemistry(sharedMatches) {
            if (sharedMatches.length === 0) {
                return {
                    score: 50, // Score neutro si no hay historial
                    label: 'SIN HISTORIAL',
                    color: '#94a3b8',
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    matchesPlayed: 0
                };
            }

            const wins = sharedMatches.filter(m => m.won).length;
            const losses = sharedMatches.length - wins;
            const winRate = (wins / sharedMatches.length) * 100;

            let score = 50 + (winRate * 0.5); // Base 50 + hasta 50 por win rate
            let label = 'REGULAR';
            let color = '#eab308';

            if (winRate >= 70) {
                label = 'QUÍMICA EXPLOSIVA';
                color = '#22c55e';
            } else if (winRate >= 55) {
                label = 'BUENA QUÍMICA';
                color = '#84cc16';
            } else if (winRate >= 45) {
                label = 'QUÍMICA EQUILIBRADA';
                color = '#eab308';
            } else if (winRate >= 30) {
                label = 'QUÍMICA BAJA';
                color = '#f97316';
            } else {
                label = 'SIN QUÍMICA';
                color = '#ef4444';
            }

            return {
                score,
                label,
                color,
                wins,
                losses,
                winRate: Math.round(winRate),
                matchesPlayed: sharedMatches.length
            };
        }

        /**
         * Calcula compatibilidad de estilo de juego
         */
        calculateStyleCompatibility(player1, player2) {
            const pref1 = player1.play_preference || 'indifferent';
            const pref2 = player2.play_preference || 'indifferent';

            let score = 100;
            let label = 'COMPLEMENTARIOS';
            let color = '#22c55e';

            // Caso ideal: uno drive, otro revés
            if ((pref1 === 'drive' && pref2 === 'reves') || (pref1 === 'reves' && pref2 === 'drive')) {
                score = 100;
                label = 'COMPLEMENTARIOS PERFECTOS';
                color = '#22c55e';
            }
            // Ambos indiferentes
            else if (pref1 === 'indifferent' && pref2 === 'indifferent') {
                score = 90;
                label = 'FLEXIBLES';
                color = '#84cc16';
            }
            // Uno indiferente
            else if (pref1 === 'indifferent' || pref2 === 'indifferent') {
                score = 85;
                label = 'ADAPTABLES';
                color = '#84cc16';
            }
            // Mismo lado (conflicto)
            else if (pref1 === pref2) {
                score = 60;
                label = 'MISMO LADO';
                color = '#f97316';
            }

            return {
                score,
                label,
                color,
                preference1: pref1,
                preference2: pref2
            };
        }

        /**
         * Calcula alineación de actividad (frecuencia de juego similar)
         */
        calculateActivityAlignment(player1, player2) {
            const matches1 = player1.stats?.total_matches || 0;
            const matches2 = player2.stats?.total_matches || 0;

            const avgMatches = (matches1 + matches2) / 2;
            const difference = Math.abs(matches1 - matches2);
            const diffPercentage = avgMatches > 0 ? (difference / avgMatches) * 100 : 0;

            let score = 100;
            let label = 'MUY ACTIVOS';
            let color = '#22c55e';

            if (diffPercentage <= 20) {
                score = 100;
                label = 'ACTIVIDAD SIMILAR';
                color = '#22c55e';
            } else if (diffPercentage <= 40) {
                score = 80;
                label = 'ACTIVIDAD COMPATIBLE';
                color = '#84cc16';
            } else if (diffPercentage <= 60) {
                score = 60;
                label = 'ACTIVIDAD DIFERENTE';
                color = '#eab308';
            } else {
                score = 40;
                label = 'ACTIVIDAD MUY DIFERENTE';
                color = '#f97316';
            }

            return {
                score,
                label,
                color,
                matches1,
                matches2
            };
        }

        /**
         * Obtiene rating textual basado en score total
         */
        getRating(score) {
            if (score >= 90) return { label: '⭐⭐⭐⭐⭐ PAREJA IDEAL', color: '#22c55e' };
            if (score >= 80) return { label: '⭐⭐⭐⭐ EXCELENTE PAREJA', color: '#84cc16' };
            if (score >= 70) return { label: '⭐⭐⭐ BUENA PAREJA', color: '#eab308' };
            if (score >= 60) return { label: '⭐⭐ PAREJA ACEPTABLE', color: '#f97316' };
            return { label: '⭐ PAREJA POCO COMPATIBLE', color: '#ef4444' };
        }

        /**
         * Genera recomendación personalizada
         */
        getRecommendation(score, sharedMatches) {
            if (score >= 90 && sharedMatches >= 5) {
                return '¡Tu mejor pareja! Habéis demostrado una química excepcional juntos.';
            } else if (score >= 90) {
                return '¡Pareja ideal por nivel y estilo! Deberíais jugar juntos pronto.';
            } else if (score >= 80 && sharedMatches >= 3) {
                return 'Excelente dupla con buen historial. ¡Seguid así!';
            } else if (score >= 80) {
                return 'Gran compatibilidad. Probad a jugar juntos.';
            } else if (score >= 70) {
                return 'Buena pareja potencial. Podría funcionar muy bien.';
            } else if (score >= 60) {
                return 'Pareja aceptable, aunque hay mejores opciones disponibles.';
            } else {
                return 'Compatibilidad baja. Considera otras opciones.';
            }
        }

        extractSharedMatches(playerId1, playerId2, matches) {
            const shared = [];
            matches.forEach(match => {
                const tA = match.team_a_ids || [];
                const tB = match.team_b_ids || [];
                const inA = tA.includes(playerId1) && tA.includes(playerId2);
                const inB = tB.includes(playerId1) && tB.includes(playerId2);
                if (inA || inB) {
                    const sA = parseInt(match.score_a || 0);
                    const sB = parseInt(match.score_b || 0);
                    shared.push({
                        matchId: match.id,
                        won: inA ? (sA > sB) : (sB > sA)
                    });
                }
            });
            return shared;
        }

        async getSharedMatches(playerId1, playerId2) {
            try {
                const matchesA = await window.FirebaseDB.matches.getByPlayer(playerId1);
                return this.extractSharedMatches(playerId1, playerId2, matchesA);
            } catch (error) {
                console.error('Error getting shared matches:', error);
                return [];
            }
        }

        /**
         * Obtiene datos de un jugador
         */
        async getPlayerData(playerId) {
            try {
                return await window.FirebaseDB.players.getById(playerId);
            } catch (error) {
                console.error('Error getting player data:', error);
                return null;
            }
        }

        /**
         * Obtiene todos los jugadores activos
         */
        async getAllActivePlayers() {
            try {
                const players = await window.FirebaseDB.players.getAll();
                // Filter players with some data
                return players.filter(player =>
                    (player.matches_played || 0) > 0 || player.level || player.self_rate_level
                );
            } catch (error) {
                console.error('Error getting active players:', error);
                return [];
            }
        }

        async getRecentPerformanceTrend(playerId) {
            try {
                const matches = await window.FirebaseDB.matches.getByPlayer(playerId);
                if (!matches || matches.length < 3) return { status: 'NORMAL', factor: 1, desc: 'Sincronizando racha...' };

                const recent = matches.filter(m => m.status === 'finished').slice(0, 5);
                if (recent.length === 0) return { status: 'NORMAL', factor: 1, desc: 'Datos en proceso...' };

                const wins = recent.filter(m => {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    const inA = (m.team_a_ids || []).includes(playerId);
                    return inA ? (sA > sB) : (sB > sA);
                }).length;

                const winRate = wins / recent.length;
                if (winRate <= 0.2) return { status: 'HIGH', factor: 0.7, desc: 'Fatiga detectada por racha negativa.' };
                if (winRate >= 0.8) return { status: 'OPTIMAL', factor: 1.2, desc: 'Rendimiento pico (Peak Performance).' };
                return { status: 'NORMAL', factor: 1, desc: 'Niveles de energía estables.' };
            } catch (e) {
                return { status: 'NORMAL', factor: 1, desc: 'Análisis de fatiga suspendido.' };
            }
        }

        /**
         * Limpia la caché
         */
        clearCache() {
            this.cache.clear();
        }
    }

    // Exportar globalmente
    window.PartnerSynergyService = new PartnerSynergyService();
    console.log('🔗 Partner Synergy Service loaded');
})();

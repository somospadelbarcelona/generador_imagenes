/**
 * QuickStats.js
 * Componente que muestra las 3 métricas clave del jugador:
 * - Nivel actual
 * - Posición en torneo activo
 * - Racha de victorias/derrotas
 */
(function () {
    class QuickStats {
        /**
         * Renderiza las estadísticas rápidas
         * @param {Object} player - Datos del jugador
         * @param {Object} tournament - Torneo activo (opcional)
         * @returns {string} HTML de las stats
         */
        static render(player, tournament = null) {
            if (!player) return '';

            // Si no hay torneo activo, mostrar stats generales
            if (!tournament) {
                return this.renderGeneralStats(player);
            }

            // Si hay torneo activo, mostrar stats contextuales
            return this.renderTournamentStats(player, tournament);
        }

        /**
         * Stats cuando hay torneo activo
         */
        static renderTournamentStats(player, tournament) {
            const level = player.level || player.self_rate_level || '3.5';
            const position = tournament.playerRank || '-';
            const totalPlayers = tournament.totalPlayers || '-';
            const streak = this.calculateStreak(player);

            return `
                <div style="padding: 0 20px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                        
                        <!-- NIVEL -->
                        <div style="
                            background: white;
                            padding: 16px 12px;
                            border-radius: 16px;
                            text-align: center;
                            border: 1px solid #E0E0E0;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        ">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                NIVEL
                            </div>
                            <div style="font-size: 2rem; font-weight: 900; color: #000; line-height: 1; margin-bottom: 4px;">
                                ${level}
                            </div>
                            <div style="font-size: 0.65rem; color: #666; font-weight: 600;">
                                ${this.getLevelLabel(level)}
                            </div>
                        </div>

                        <!-- POSICIÓN -->
                        <div style="
                            background: linear-gradient(135deg, #CCFF00 0%, #B8E600 100%);
                            padding: 16px 12px;
                            border-radius: 16px;
                            text-align: center;
                            box-shadow: 0 4px 12px rgba(204,255,0,0.25);
                            border: 1px solid rgba(0,0,0,0.05);
                        ">
                            <div style="font-size: 0.6rem; color: rgba(0,0,0,0.6); font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                POSICIÓN
                            </div>
                            <div style="font-size: 1.6rem; font-weight: 900; color: #000; line-height: 1; margin-bottom: 4px;">
                                #${position}
                            </div>
                            <div style="font-size: 0.65rem; color: rgba(0,0,0,0.7); font-weight: 700;">
                                de ${totalPlayers}
                            </div>
                        </div>

                        <!-- RACHA -->
                        <div style="
                            background: white;
                            padding: 16px 12px;
                            border-radius: 16px;
                            text-align: center;
                            border: 1px solid #E0E0E0;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        ">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                RACHA
                            </div>
                            <div style="font-size: 1.6rem; font-weight: 900; color: ${streak.color}; line-height: 1; margin-bottom: 4px;">
                                ${streak.icon} ${streak.count}
                            </div>
                            <div style="font-size: 0.65rem; color: #666; font-weight: 600;">
                                ${streak.label}
                            </div>
                        </div>

                    </div>
                </div>
            `;
        }

        /**
         * Stats generales (sin torneo activo)
         */
        static renderGeneralStats(player) {
            const level = player.level || player.self_rate_level || '3.5';
            const matchesPlayed = player.matches_played || 0;
            const wins = player.wins || 0;
            const winRate = player.win_rate || (matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0);

            return `
                <div style="padding: 0 20px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                        
                        <!-- NIVEL -->
                        <div style="
                            background: white;
                            padding: 16px 12px;
                            border-radius: 16px;
                            text-align: center;
                            border: 1px solid #E0E0E0;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        ">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                NIVEL
                            </div>
                            <div style="font-size: 2rem; font-weight: 900; color: #000; line-height: 1; margin-bottom: 4px;">
                                ${level}
                            </div>
                            <div style="font-size: 0.65rem; color: #666; font-weight: 600;">
                                ${this.getLevelLabel(level)}
                            </div>
                        </div>

                        <!-- PARTIDOS -->
                        <div style="
                            background: white;
                            padding: 16px 12px;
                            border-radius: 16px;
                            text-align: center;
                            border: 1px solid #E0E0E0;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        ">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                PARTIDOS
                            </div>
                            <div style="font-size: 2rem; font-weight: 900; color: #000; line-height: 1; margin-bottom: 4px;">
                                ${matchesPlayed}
                            </div>
                            <div style="font-size: 0.65rem; color: #34C759; font-weight: 700;">
                                ${wins} victorias
                            </div>
                        </div>

                        <!-- EFECTIVIDAD -->
                        <div style="
                            background: white;
                            padding: 16px 12px;
                            border-radius: 16px;
                            text-align: center;
                            border: 1px solid #E0E0E0;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        ">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                EFECTIVIDAD
                            </div>
                            <div style="font-size: 2rem; font-weight: 900; color: #007AFF; line-height: 1; margin-bottom: 4px;">
                                ${winRate}%
                            </div>
                            <div style="font-size: 0.65rem; color: #666; font-weight: 600;">
                                ${this.getEffectivenessLabel(winRate)}
                            </div>
                        </div>

                    </div>
                </div>
            `;
        }

        /**
         * Calcula la racha actual del jugador
         */
        static calculateStreak(player) {
            const recentMatches = player.recentMatches || [];

            if (recentMatches.length === 0) {
                return {
                    count: 0,
                    icon: '➖',
                    label: 'Sin datos',
                    color: '#888'
                };
            }

            // Contar victorias/derrotas consecutivas
            let streak = 0;
            let isWinStreak = recentMatches[0].won;

            for (let i = 0; i < recentMatches.length; i++) {
                if (recentMatches[i].won === isWinStreak) {
                    streak++;
                } else {
                    break;
                }
            }

            if (isWinStreak) {
                return {
                    count: streak,
                    icon: streak >= 3 ? '🔥' : '✅',
                    label: streak === 1 ? 'Victoria' : 'Victorias',
                    color: '#34C759'
                };
            } else {
                return {
                    count: streak,
                    icon: '❌',
                    label: streak === 1 ? 'Derrota' : 'Derrotas',
                    color: '#FF3B30'
                };
            }
        }

        /**
         * Etiqueta descriptiva del nivel
         */
        static getLevelLabel(level) {
            const lvl = parseFloat(level);
            if (lvl < 2) return 'Iniciación';
            if (lvl < 3) return 'Básico';
            if (lvl < 4) return 'Intermedio';
            if (lvl < 5) return 'Avanzado';
            if (lvl < 6) return 'Experto';
            return 'Profesional';
        }

        /**
         * Etiqueta de efectividad
         */
        static getEffectivenessLabel(winRate) {
            if (winRate >= 75) return 'Excelente';
            if (winRate >= 60) return 'Muy bueno';
            if (winRate >= 50) return 'Bueno';
            if (winRate >= 40) return 'Regular';
            return 'Mejorable';
        }
    }

    window.QuickStats = QuickStats;
    console.log('📊 QuickStats Component Loaded');
})();

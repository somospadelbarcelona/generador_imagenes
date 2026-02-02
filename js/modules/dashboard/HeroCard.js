/**
 * HeroCard.js
 * Componente principal que muestra la información más importante para el jugador
 * Se adapta según el contexto: próximo partido, inscripción, victoria, etc.
 */
(function () {
    class HeroCard {
        /**
         * Renderiza la Hero Card según el contexto del jugador
         * @param {Object} context - Contexto del jugador
         * @returns {string} HTML de la Hero Card
         */
        static render(context) {
            if (!context) return '';

            // Prioridad de renderizado
            if (context.hasMatchToday) {
                return this.renderUpcomingMatch(context);
            } else if (context.hasRecentVictory) {
                return this.renderVictoryCelebration(context);
            } else if (context.hasOpenTournament) {
                return this.renderTournamentInscription(context);
            } else if (context.hasMatchThisWeek) {
                return this.renderWeekPreview(context);
            } else {
                return this.renderEmptyState(context);
            }
        }

        /**
         * Partido próximo (HOY)
         */
        static renderUpcomingMatch(ctx) {
            const timeUntil = this.getTimeUntil(ctx.matchTime);
            const urgencyClass = timeUntil < 60 ? 'urgent' : timeUntil < 180 ? 'soon' : 'today';
            const borderColor = urgencyClass === 'urgent' ? '#FF3B30' : urgencyClass === 'soon' ? '#FF9500' : '#CCFF00';

            return `
                <div class="hero-card fade-in" style="
                    background: white;
                    border-left: 5px solid ${borderColor};
                    border-radius: 20px;
                    padding: 24px;
                    margin: 20px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                    animation: slideInDown 0.4s ease-out;
                ">
                    ${urgencyClass === 'urgent' ? `
                        <div style="background: #FF3B30; color: white; display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 900; margin-bottom: 12px; letter-spacing: 0.5px; animation: pulse 2s infinite;">
                            🚨 ¡TU PARTIDO EMPIEZA EN ${timeUntil} MINUTOS!
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 0.75rem; font-weight: 800; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
                                🎾 TU PRÓXIMO PARTIDO
                            </div>
                            <div style="font-size: 1.8rem; font-weight: 900; color: #000; line-height: 1.1; margin-bottom: 4px;">
                                ${ctx.matchDay} • ${ctx.matchTime}
                            </div>
                            <div style="font-size: 0.9rem; color: #666; font-weight: 600;">
                                ${ctx.tournamentName}
                            </div>
                        </div>
                        <div style="background: #F8F9FA; padding: 12px; border-radius: 12px; text-align: center; min-width: 60px;">
                            <div style="font-size: 0.65rem; color: #888; font-weight: 800; margin-bottom: 4px;">PISTA</div>
                            <div style="font-size: 1.5rem; font-weight: 900; color: #000;">${ctx.court || '2'}</div>
                        </div>
                    </div>

                    <div style="background: #F8F9FA; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 36px; height: 36px; background: #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                👤
                            </div>
                            <div>
                                <div style="font-size: 0.65rem; color: #888; font-weight: 700; text-transform: uppercase;">Compañero</div>
                                <div style="font-size: 0.95rem; font-weight: 800; color: #000;">${ctx.partner || 'Por asignar'}</div>
                            </div>
                        </div>
                        <div style="height: 1px; background: #E0E0E0; margin: 12px 0;"></div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; background: #FF3B30; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ⚔️
                            </div>
                            <div>
                                <div style="font-size: 0.65rem; color: #888; font-weight: 700; text-transform: uppercase;">Rivales</div>
                                <div style="font-size: 0.95rem; font-weight: 800; color: #000;">${ctx.opponents || 'Por asignar'}</div>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <button onclick="Router.navigate('live')" style="
                            background: white;
                            border: 2px solid #E0E0E0;
                            color: #333;
                            padding: 14px;
                            border-radius: 12px;
                            font-weight: 800;
                            font-size: 0.85rem;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.borderColor='#CCFF00'" onmouseout="this.style.borderColor='#E0E0E0'">
                            VER DETALLES
                        </button>
                        <button ${ctx.confirmed ? 'disabled' : ''} onclick="HeroCardActions.confirmAttendance('${ctx.matchId}')" style="
                            background: ${ctx.confirmed ? '#34C759' : '#CCFF00'};
                            border: none;
                            color: black;
                            padding: 14px;
                            border-radius: 12px;
                            font-weight: 900;
                            font-size: 0.85rem;
                            cursor: ${ctx.confirmed ? 'default' : 'pointer'};
                            transition: all 0.2s;
                            box-shadow: 0 4px 12px rgba(204,255,0,0.3);
                        ">
                            ${ctx.confirmed ? '✓ CONFIRMADO' : 'CONFIRMAR'}
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Celebración de victoria
         */
        static renderVictoryCelebration(ctx) {
            return `
                <div class="hero-card fade-in" style="
                    background: linear-gradient(135deg, #FFFFFF 0%, #F0FFF4 100%);
                    border-left: 5px solid #34C759;
                    border-radius: 20px;
                    padding: 24px;
                    margin: 20px;
                    box-shadow: 0 8px 24px rgba(52,199,89,0.15);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.1;">🏆</div>
                    
                    <div style="text-align: center; position: relative; z-index: 1;">
                        <div style="font-size: 3rem; margin-bottom: 8px; animation: bounce 1s;">🎉</div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: #34C759; margin-bottom: 8px; letter-spacing: -0.5px;">
                            ¡VICTORIA!
                        </div>
                        <div style="font-size: 3rem; font-weight: 900; color: #000; margin-bottom: 4px; line-height: 1;">
                            ${ctx.scoreA} - ${ctx.scoreB}
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-bottom: 16px;">
                            vs ${ctx.opponents}
                        </div>
                        
                        <div style="display: inline-block; background: rgba(52,199,89,0.1); border: 1px solid #34C759; color: #34C759; padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; margin-bottom: 20px;">
                            +${ctx.pointsEarned || 3} puntos • Subiste al #${ctx.newRank}
                        </div>

                        <button onclick="Router.navigate('live')" style="
                            background: #34C759;
                            border: none;
                            color: white;
                            padding: 14px 24px;
                            border-radius: 12px;
                            font-weight: 800;
                            font-size: 0.9rem;
                            cursor: pointer;
                            width: 100%;
                            box-shadow: 0 4px 12px rgba(52,199,89,0.3);
                        ">
                            VER ESTADÍSTICAS DEL PARTIDO
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Inscripción a torneo abierto
         */
        static renderTournamentInscription(ctx) {
            const spotsLeft = ctx.maxPlayers - ctx.currentPlayers;
            const urgentInscription = spotsLeft <= 3;

            return `
                <div class="hero-card fade-in" style="
                    background: white;
                    border-left: 5px solid ${urgentInscription ? '#FF3B30' : '#007AFF'};
                    border-radius: 20px;
                    padding: 24px;
                    margin: 20px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 3.5rem; margin-bottom: 12px;">🏆</div>
                        <div style="font-size: 0.75rem; font-weight: 800; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
                            PRÓXIMA AMERICANA
                        </div>
                        <div style="font-size: 1.4rem; font-weight: 900; color: #000; margin-bottom: 4px;">
                            ${ctx.tournamentDate} • ${ctx.tournamentTime}
                        </div>
                        <div style="font-size: 0.9rem; color: #666; font-weight: 600; margin-bottom: 16px;">
                            ${ctx.tournamentName}
                        </div>

                        ${urgentInscription ? `
                            <div style="background: #FF3B30; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; margin-bottom: 16px; animation: pulse 2s infinite;">
                                🔥 ¡SOLO QUEDAN ${spotsLeft} PLAZAS!
                            </div>
                        ` : `
                            <div style="background: #F8F9FA; color: #666; display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; margin-bottom: 16px;">
                                ${ctx.currentPlayers}/${ctx.maxPlayers} jugadores inscritos
                            </div>
                        `}

                        <button onclick="HeroCardActions.enrollTournament('${ctx.tournamentId}')" style="
                            background: #CCFF00;
                            border: none;
                            color: black;
                            padding: 16px 24px;
                            border-radius: 12px;
                            font-weight: 900;
                            font-size: 1rem;
                            cursor: pointer;
                            width: 100%;
                            box-shadow: 0 4px 12px rgba(204,255,0,0.3);
                            text-transform: uppercase;
                        ">
                            INSCRIBIRME AHORA
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Vista previa de la semana
         */
        static renderWeekPreview(ctx) {
            return `
                <div class="hero-card fade-in" style="
                    background: white;
                    border-left: 5px solid #007AFF;
                    border-radius: 20px;
                    padding: 24px;
                    margin: 20px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                ">
                    <div style="font-size: 0.75rem; font-weight: 800; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                        📅 ESTA SEMANA
                    </div>
                    <div style="font-size: 1.4rem; font-weight: 900; color: #000; margin-bottom: 16px;">
                        Tienes ${ctx.matchesThisWeek} ${ctx.matchesThisWeek === 1 ? 'partido' : 'partidos'}
                    </div>
                    
                    <div style="background: #F8F9FA; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: #333; margin-bottom: 8px;">
                            Próximo: ${ctx.nextMatchDay} a las ${ctx.nextMatchTime}
                        </div>
                        <div style="font-size: 0.75rem; color: #666;">
                            ${ctx.tournamentName}
                        </div>
                    </div>

                    <button onclick="Router.navigate('agenda')" style="
                        background: white;
                        border: 2px solid #007AFF;
                        color: #007AFF;
                        padding: 14px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.85rem;
                        cursor: pointer;
                        width: 100%;
                    ">
                        VER AGENDA COMPLETA
                    </button>
                </div>
            `;
        }

        /**
         * Estado vacío (sin eventos)
         */
        static renderEmptyState(ctx) {
            return `
                <div class="hero-card fade-in" style="
                    background: white;
                    border: 2px dashed #E0E0E0;
                    border-radius: 20px;
                    padding: 40px 24px;
                    margin: 20px;
                    text-align: center;
                ">
                    <div style="font-size: 3.5rem; margin-bottom: 16px; opacity: 0.5;">🎾</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #333; margin-bottom: 8px;">
                        Sin eventos próximos
                    </div>
                    <div style="font-size: 0.85rem; color: #666; margin-bottom: 20px; line-height: 1.5;">
                        Mantente atento a las próximas Americanas.<br>¡Te avisaremos cuando abran inscripciones!
                    </div>
                    <button onclick="Router.navigate('americanas')" style="
                        background: #F8F9FA;
                        border: 1px solid #E0E0E0;
                        color: #333;
                        padding: 12px 24px;
                        border-radius: 12px;
                        font-weight: 700;
                        font-size: 0.85rem;
                        cursor: pointer;
                    ">
                        Explorar Torneos
                    </button>
                </div>
            `;
        }

        /**
         * Calcula tiempo hasta el partido en minutos
         */
        static getTimeUntil(matchTime) {
            if (!matchTime) return 0;
            try {
                const now = new Date();
                const [hours, minutes] = matchTime.split(':').map(Number);
                const matchDate = new Date();
                matchDate.setHours(hours, minutes, 0, 0);

                const diffMs = matchDate - now;
                const diffMins = Math.floor(diffMs / 60000);

                return Math.max(0, diffMins);
            } catch (e) {
                console.warn('Error calculating time until:', e);
                return 0;
            }
        }
    }

    // Acciones de la Hero Card
    window.HeroCardActions = {
        confirmAttendance: async (matchId) => {
            try {
                // Implementar confirmación
                console.log('Confirming attendance for match:', matchId);
                // Actualizar UI
                alert('¡Asistencia confirmada! Nos vemos en pista 🎾');
                // Recargar dashboard
                if (window.DashboardController) {
                    window.DashboardController.load();
                }
            } catch (e) {
                console.error('Error confirming:', e);
                alert('Error al confirmar. Inténtalo de nuevo.');
            }
        },

        enrollTournament: async (tournamentId) => {
            try {
                console.log('Enrolling in tournament:', tournamentId);
                // Navegar a vista de inscripción
                Router.navigate('americanas');
            } catch (e) {
                console.error('Error enrolling:', e);
            }
        }
    };

    window.HeroCard = HeroCard;
    console.log('🎯 HeroCard Component Loaded');
})();

/**
 * ActionGrid.js
 * Grid de acciones rápidas con badges informativos
 * Solo muestra 4 acciones principales con contexto
 */
(function () {
    class ActionGrid {
        /**
         * Renderiza el grid de acciones
         * @param {Object} context - Contexto del jugador
         * @returns {string} HTML del grid
         */
        static render(context = {}) {
            const actions = this.getActions(context);

            return `
                <div style="padding: 0 20px; margin-bottom: 100px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${actions.map(action => this.renderAction(action)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Define las acciones disponibles con su contexto
         */
        static getActions(context) {
            return [
                {
                    id: 'agenda',
                    icon: '📅',
                    title: 'Mi Agenda',
                    badge: context.upcomingMatches || 0,
                    badgeText: context.upcomingMatches === 1 ? 'próximo' : 'próximos',
                    route: 'agenda',
                    color: '#007AFF'
                },
                {
                    id: 'tournaments',
                    icon: '🏆',
                    title: 'Americanas',
                    badge: context.activeTournaments || 0,
                    badgeText: context.activeTournaments === 1 ? 'activo' : 'activos',
                    route: 'americanas',
                    color: '#CCFF00',
                    highlight: context.activeTournaments > 0
                },
                {
                    id: 'ranking',
                    icon: '🥇',
                    title: 'Ranking',
                    badge: null,
                    badgeText: 'Global SP',
                    route: 'ranking',
                    color: '#FFD700'
                },
                {
                    id: 'profile',
                    icon: '👤',
                    title: 'Mi Perfil',
                    badge: null,
                    badgeText: 'Mis Datos',
                    route: 'profile',
                    color: '#FF9500'
                }
            ];
        }

        /**
         * Renderiza una acción individual
         */
        static renderAction(action) {
            const hasNotification = action.badge !== null && action.badge !== 0;
            const isHighlight = action.highlight;

            return `
                <div 
                    onclick="Router.navigate('${action.route}')" 
                    style="
                        background: white;
                        padding: 20px 16px;
                        border-radius: 16px;
                        border: ${isHighlight ? '2px solid ' + action.color : '1px solid #E0E0E0'};
                        box-shadow: ${isHighlight ? '0 4px 16px rgba(204,255,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)'};
                        cursor: pointer;
                        transition: all 0.2s;
                        position: relative;
                        overflow: hidden;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='${isHighlight ? '0 4px 16px rgba(204,255,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)'}'"
                >
                    ${hasNotification && typeof action.badge === 'number' && action.badge > 0 ? `
                        <div style="
                            position: absolute;
                            top: 12px;
                            right: 12px;
                            background: #FF3B30;
                            color: white;
                            width: 22px;
                            height: 22px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.7rem;
                            font-weight: 900;
                            box-shadow: 0 2px 8px rgba(255,59,48,0.4);
                            animation: pulse 2s infinite;
                        ">
                            ${action.badge}
                        </div>
                    ` : ''}

                    <div style="
                        background: ${isHighlight ? action.color : '#F8F9FA'};
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        margin-bottom: 12px;
                        ${isHighlight ? 'box-shadow: 0 4px 12px rgba(204,255,0,0.3);' : ''}
                    ">
                        ${action.icon}
                    </div>

                    <div style="
                        font-size: 0.95rem;
                        font-weight: 800;
                        color: #000;
                        margin-bottom: 4px;
                    ">
                        ${action.title}
                    </div>

                    <div style="
                        font-size: 0.7rem;
                        color: ${hasNotification && typeof action.badge === 'string' ? action.color : '#666'};
                        font-weight: ${hasNotification ? '700' : '600'};
                    ">
                        ${action.badge && typeof action.badge === 'number' && action.badge > 0
                    ? `${action.badge} ${action.badgeText}`
                    : action.badgeText
                }
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza versión compacta (para estados específicos)
         */
        static renderCompact(context = {}) {
            const actions = this.getActions(context).slice(0, 2); // Solo 2 acciones

            return `
                <div style="padding: 0 20px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${actions.map(action => this.renderAction(action)).join('')}
                    </div>
                </div>
            `;
        }
    }

    window.ActionGrid = ActionGrid;
    console.log('🎯 ActionGrid Component Loaded');
})();

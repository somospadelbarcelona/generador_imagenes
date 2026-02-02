/**
 * PlayerAutocomplete.js
 * A reusable component for searching and selecting players with a rich UI.
 * Replaces standard <select> elements.
 */

window.PlayerAutocomplete = {

    /**
     * Renders the autocomplete component into a container.
     * @param {string} containerId - The ID of the DOM element to inject into.
     * @param {Array} allPlayers - List of all player objects.
     * @param {Set|Array} excludedIds - IDs of players to exclude (already enrolled).
     * @param {Function} onSelect - Callback function(playerId) when a player is chosen.
     */
    render: function (containerId, allPlayers, excludedIds, onSelect, placeholder = "🔍 Buscar jugador por nombre o teléfono...") {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`PlayerAutocomplete: Container #${containerId} not found.`);
            return;
        }

        const excluded = new Set(excludedIds);
        const availablePlayers = allPlayers.filter(p => !excluded.has(p.id));

        // Inject HTML Structure
        container.innerHTML = `
            <div class="player-autocomplete-wrapper" style="position: relative; width: 100%;">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="${containerId}-input" class="pro-input" 
                           placeholder="${placeholder}" autocomplete="off"
                           style="width: 100%; border: 1px solid var(--primary); transition: all 0.2s;">
                    <button id="${containerId}-clear" class="btn-secondary" style="display:none;">✕</button>
                    <!-- Loading Spinner (Hidden) -->
                    <div id="${containerId}-spinner" style="display:none; position:absolute; right: 20px; top: 12px; color: var(--primary);">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
                
                <div id="${containerId}-results" class="autocomplete-results" 
                     style="display: none; position: absolute; z-index: 1000; top: 100%; left: 0; right: 0; 
                            background: #1a1a1a; border: 1px solid var(--primary); border-radius: 0 0 8px 8px; 
                            max-height: 300px; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                </div>
            </div>
        `;

        const input = document.getElementById(`${containerId}-input`);
        const results = document.getElementById(`${containerId}-results`);
        const clearBtn = document.getElementById(`${containerId}-clear`);

        // Event Listeners
        input.addEventListener('input', (e) => this.handleSearch(e.target.value, availablePlayers, results, onSelect));

        input.addEventListener('focus', () => {
            // Show all or filtered
            this.handleSearch(input.value, availablePlayers, results, onSelect);
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                results.style.display = 'none';
            }
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            input.focus();
            this.handleSearch('', availablePlayers, results, onSelect);
        });
    },

    handleSearch: function (query, players, resultsContainer, onSelect) {
        const q = query.toLowerCase().trim();
        let matches = [];

        if (q === '') {
            // If empty, show recent or top X? Or just hide?
            // User requested "selector mas amplio" -> maybe show list immediately?
            // Let's show top 20 alphabetically or just first 20 to avoid lag
            matches = players.slice(0, 50);
        } else {
            // Smart Filter
            matches = players.filter(p => {
                const name = (p.name || '').toLowerCase();
                const phone = (p.phone || '').toLowerCase();
                const team = (Array.isArray(p.team || p.team_somospadel) ? (p.team || p.team_somospadel).join(' ') : (p.team || p.team_somospadel || '')).toLowerCase();

                return name.includes(q) || phone.includes(q) || team.includes(q);
            });
            // Sort by match quality? (Name starts with > contains)
            matches.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                if (nameA.startsWith(q) && !nameB.startsWith(q)) return -1;
                if (!nameA.startsWith(q) && nameB.startsWith(q)) return 1;
                return 0;
            });
        }

        // Render Results
        if (matches.length === 0) {
            resultsContainer.innerHTML = `<div style="padding: 15px; color: #888; text-align: center;">No se encontraron jugadores. <br><small>Prueba con el nombre, teléfono o equipo.</small></div>`;
        } else {
            resultsContainer.innerHTML = matches.map(p => {
                const team = p.team || p.team_somospadel || '';
                const teamBadge = team ? `<span style="font-size: 0.6rem; background: #333; color: var(--primary); padding: 2px 5px; border-radius: 4px; margin-left: 5px;">${Array.isArray(team) ? team[0] : team}</span>` : '';
                const level = p.level || p.self_rate_level || '3.5';

                return `
                <div class="autocomplete-item" data-uid="${p.id}" 
                     style="padding: 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; background: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">
                            ${(p.name || '?').charAt(0)}
                        </div>
                        <div>
                            <div style="color: white; font-weight: 600; font-size: 0.9rem;">${p.name} ${teamBadge}</div>
                            <div style="color: #666; font-size: 0.75rem;">${p.phone || 'Sin tel'} • Nivel ${level}</div>
                        </div>
                    </div>
                    <button class="btn-micro" style="pointer-events: none; background: var(--primary); color: black;">+</button>
                </div>
                `;
            }).join('');

            // Add Click Handlers
            resultsContainer.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.1)');
                item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                item.addEventListener('click', () => {
                    const uid = item.getAttribute('data-uid');
                    console.log(`Autocomplete Selected: ${uid}`);
                    onSelect(uid);
                    resultsContainer.style.display = 'none'; // Close
                    // Optional: clear input or keep selection? Usually for adding to a list, we clear.
                    const input = document.getElementById(`${containerId}-input`);
                    if (input) {
                        input.value = '';
                        input.focus(); // Prepare for next add
                    }
                });
            });
        }

        resultsContainer.style.display = 'block';
    }
};

console.log("🚀 PlayerAutocomplete Component Loaded");

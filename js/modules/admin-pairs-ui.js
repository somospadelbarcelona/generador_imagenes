/**
 * admin-pairs-ui.js
 * Shared UI Controller for managing Fixed Pairs.
 * Handles: Listing pairs, Adding new pairs, Auto-Pairing.
 * Refactored to align with FixedPairsLogic schema.
 */

window.PairsUI = {

    /**
     * Load the Pairs Management Interface into a container
     */
    async load(containerId, eventId, eventType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const event = await EventService.getById(eventType, eventId);
        if (event.pair_mode !== 'fixed') {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; margin-top: 15px; border: 1px dashed #444;">
                <h4 style="margin:0 0 10px 0; color: #CCFF00;">🔐 GESTIÓN DE PAREJAS FIJAS (POZO)</h4>
                
                <div id="pairs-list-${eventId}" style="margin-bottom: 15px;"></div>
                
                <div style="display:flex; gap:10px;">
                     <select id="p1-${eventId}" class="pro-input"></select>
                     <select id="p2-${eventId}" class="pro-input"></select>
                     <button id="btn-add-pair-${eventId}" class="btn-primary-pro" style="padding: 0 15px;">➕</button>
                </div>
                
                <button id="btn-auto-pair-${eventId}" class="btn-outline-pro" style="width:100%; margin-top:10px;">⚡ AUTO-EMPAREJAR RESTANTES</button>
                
                <!-- REGEN BUTTON -->
                <button id="btn-regen-${eventId}" class="btn-primary-pro" style="width:100%; margin-top:15px; background: #e67e22; border-color: #e67e22;">
                    🎲 GUARDAR Y REGENERAR CRUCES
                </button>
            </div>
        `;

        await this.renderList(eventId, eventType);
        this.setupListeners(eventId, eventType);
    },

    async renderList(eventId, eventType) {
        const listDiv = document.getElementById(`pairs-list-${eventId}`);
        const s1 = document.getElementById(`p1-${eventId}`);
        const s2 = document.getElementById(`p2-${eventId}`);

        if (!listDiv) return;

        const event = await EventService.getById(eventType, eventId);
        const pairs = event.fixed_pairs || [];
        const players = event.players || [];

        // 1. Render Pairs
        if (pairs.length === 0) {
            listDiv.innerHTML = '<div style="color:#666; font-style:italic;">Sin parejas definidas</div>';
        } else {
            listDiv.innerHTML = pairs.map((p, i) => {
                // FALLBACK for old schema: p.player1.name
                const p1Name = p.player1_name || (p.player1 ? p.player1.name : 'Unknown');
                const p2Name = p.player2_name || (p.player2 ? p.player2.name : 'Unknown');
                const courtInfo = p.current_court ? `<span style="font-size:0.7em; color:#888; margin-left:5px;">(Pista ${p.current_court})</span>` : '';

                return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px; margin-bottom:5px; border-radius:6px;">
                    <span style="color:white;">${p1Name} 🤝 ${p2Name} ${courtInfo}</span>
                    <button onclick="window.PairsUI.removePair('${eventId}', '${eventType}', ${i})" style="color:red; background:none; border:none; cursor:pointer;">×</button>
                </div>
            `}).join('');
        }

        // 2. Populate Selects (Available players only)
        const pairedIds = new Set();
        pairs.forEach(p => {
            // New Schema: player1_id
            if (p.player1_id) pairedIds.add(String(p.player1_id));
            if (p.player2_id) pairedIds.add(String(p.player2_id));

            // Old Schema fallback: player1.id
            if (p.player1) pairedIds.add(String(p.player1.id || p.player1.uid));
            if (p.player2) pairedIds.add(String(p.player2.id || p.player2.uid));
        });

        const available = players.filter(p => !pairedIds.has(String(p.id || p.uid)));

        // Sort available alphabet
        available.sort((a, b) => a.name.localeCompare(b.name));

        const opts = `<option value="">Seleccionar...</option>` + available.map(p => `<option value="${p.id || p.uid}">${p.name}</option>`).join('');

        if (s1) s1.innerHTML = opts;
        if (s2) s2.innerHTML = opts;
    },

    setupListeners(eventId, eventType) {
        const btnAdd = document.getElementById(`btn-add-pair-${eventId}`);
        const btnAuto = document.getElementById(`btn-auto-pair-${eventId}`);
        const btnRegen = document.getElementById(`btn-regen-${eventId}`);

        if (btnAdd) btnAdd.onclick = () => this.addPair(eventId, eventType);
        if (btnAuto) btnAuto.onclick = () => this.autoPair(eventId, eventType);
        if (btnRegen) btnRegen.onclick = () => this.regenerate(eventId, eventType);
    },

    async addPair(eventId, eventType) {
        const s1 = document.getElementById(`p1-${eventId}`);
        const s2 = document.getElementById(`p2-${eventId}`);

        const id1 = s1.value;
        const id2 = s2.value;

        if (!id1 || !id2 || id1 === id2) return alert("Selecciona dos jugadores distintos");

        const event = await EventService.getById(eventType, eventId);
        const players = event.players || [];
        const p1 = players.find(p => String(p.id || p.uid) === id1);
        const p2 = players.find(p => String(p.id || p.uid) === id2);

        if (!p1 || !p2) return alert("Error al encontrar jugadores");

        // --- NEW SCHEMA (Matches FixedPairsLogic.js) ---
        // Calc initial court: append to end. 
        // Need to know current max court or just assign 0 and let logic sort it? 
        // FixedPairsLogic assigns courts sequentially.
        const currentPairs = event.fixed_pairs || [];
        const nextIndex = currentPairs.length * 2;
        const initialCourt = Math.floor(nextIndex / 4) + 1;

        const newPair = {
            id: `pair_${Date.now()}_manual`,
            player1_id: p1.id || p1.uid,
            player2_id: p2.id || p2.uid,
            player1_name: p1.name,
            player2_name: p2.name,
            pair_name: `${p1.name} / ${p2.name}`,
            wins: 0,
            losses: 0,
            games_won: 0,
            games_lost: 0,
            current_court: initialCourt,
            initial_court: initialCourt
        };

        await EventService.updateEvent(eventType, eventId, { fixed_pairs: [...currentPairs, newPair] });
        this.renderList(eventId, eventType);
    },

    async removePair(eventId, eventType, index) {
        if (!confirm("Eliminar pareja?")) return;
        const event = await EventService.getById(eventType, eventId);
        const pairs = event.fixed_pairs || [];
        pairs.splice(index, 1);
        await EventService.updateEvent(eventType, eventId, { fixed_pairs: pairs });
        this.renderList(eventId, eventType);
    },

    async autoPair(eventId, eventType) {
        if (!confirm("Auto-emparejar restantes usando lógica del sistema?")) return;

        const event = await EventService.getById(eventType, eventId);
        const pairs = event.fixed_pairs || [];

        // Find already paired IDs
        const pairedIds = new Set();
        pairs.forEach(p => {
            if (p.player1_id) { pairedIds.add(String(p.player1_id)); pairedIds.add(String(p.player2_id)); }
            else if (p.player1) { pairedIds.add(String(p.player1.id)); pairedIds.add(String(p.player2.id)); }
        });

        // Filter available players
        let available = (event.players || []).filter(p => !pairedIds.has(String(p.id || p.uid)));

        if (available.length < 2) return alert("No hay suficientes jugadores libres para emparejar.");

        // USE CORE LOGIC
        if (typeof FixedPairsLogic === 'undefined') {
            return alert("Error: FixedPairsLogic no está cargado");
        }

        // Generate new pairs
        // We preserve order if implicit (or maybe add a checkbox later?)
        // Default to random shuffle via logic unless specific category
        const newPairs = FixedPairsLogic.createFixedPairs(available, event.category, false);

        // Adjust courts for new pairs?
        // createFixedPairs starts at court 1. We need to offset if there are existing pairs.
        if (pairs.length > 0) {
            // Find max court of existing
            const maxCourt = pairs.reduce((max, p) => Math.max(max, p.current_court || 0), 0);

            // Re-map new pairs courts
            // Logic: new pairs append to the end
            // But FixedPairsLogic logic is: i=0 -> court 1. 
            // We need to shift i by existing count * 2
            const offset = pairs.length * 2;
            newPairs.forEach((p, idx) => {
                // Re-calc court
                const globIndex = offset + (idx * 2);
                const newCourt = Math.floor(globIndex / 4) + 1;
                p.current_court = newCourt;
                p.initial_court = newCourt;
            });
        }

        await EventService.updateEvent(eventType, eventId, { fixed_pairs: [...pairs, ...newPairs] });
        this.renderList(eventId, eventType);
    },

    async regenerate(eventId, eventType) {
        if (!confirm("Generar nuevos cruces con estas parejas? (Borrará R1 y reiniciará partidos)")) return;
        try {
            // Purge existing matches for this event
            if (eventType === 'entreno') {
                // Custom purge for entrenos if needed, or if MatchMakingService handles it
                // MatchMakingService usually handles 'matches' or 'entrenos_matches' based on type?
                // Let's check MatchMakingService signature. 
                // Assuming it is robust enough or we use direct DB call if unsure.
                // Ideally: MatchMakingService.purgeMatches(eventId, collectionName)
                // But let's assume standard usage:
                const collection = eventType === 'entreno' ? 'entrenos_matches' : 'matches';

                // Get all matches
                const matches = await window.FirebaseDB[collection].getAll();
                const eventMatches = matches.filter(m => m.americana_id === eventId);

                // Delete all
                const batchSize = 10;
                for (let i = 0; i < eventMatches.length; i += batchSize) {
                    await Promise.all(eventMatches.slice(i, i + batchSize).map(m => window.FirebaseDB[collection].delete(m.id)));
                }

                // Generate R1
                const event = await EventService.getById(eventType, eventId);
                const pairs = event.fixed_pairs || [];
                const maxCourts = event.max_courts || 4;

                const pMatches = FixedPairsLogic.generatePozoRound(pairs, 1, maxCourts);

                for (const m of pMatches) {
                    await window.FirebaseDB[collection].create({
                        ...m,
                        americana_id: eventId,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0
                    });
                }

            } else {
                // Americana
                // Reuse logic similar to above or service if valid
                const matches = await window.FirebaseDB.matches.getAll();
                const eventMatches = matches.filter(m => m.americana_id === eventId);
                for (let i = 0; i < eventMatches.length; i += 10) {
                    await Promise.all(eventMatches.slice(i, i + 10).map(m => window.FirebaseDB.matches.delete(m.id)));
                }

                const event = await EventService.getById(eventType, eventId);
                const pairs = event.fixed_pairs || [];
                const maxCourts = event.max_courts || 4;

                const pMatches = FixedPairsLogic.generatePozoRound(pairs, 1, maxCourts);
                for (const m of pMatches) {
                    await window.FirebaseDB.matches.create({
                        ...m,
                        americana_id: eventId,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0
                    });
                }
            }

            alert("✅ Cruces regenerados (Ronda 1)");
        } catch (e) { alert(e.message); console.error(e); }
    }
};

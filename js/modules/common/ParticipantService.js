/**
 * ParticipantService.js
 * Centralized logic for managing players in events (Americanas & Entrenos).
 * Handles: Adding, Removing, Waitlist Promotion, and Validation.
 */

window.ParticipantService = {

    /**
     * Add a player to an event
     * @param {string} eventId 
     * @param {string} eventType - 'americana' or 'entreno'
     * @param {object} player - User object from DB
     * @returns {Promise<object>} Updated player list result
     */
    async addPlayer(eventId, eventType, player) {
        if (!eventId || !player) throw new Error("Invalid parameters");

        const collection = eventType === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        const event = await collection.getById(eventId);
        if (!event) throw new Error("Event not found");

        // 1. Check Capacity
        const maxPlayers = (event.max_courts || 4) * 4;
        const currentPlayers = event.players || [];

        // 2. Check Duplicates
        const isDuplicate = currentPlayers.some(p => (p.id === player.id) || (p.uid === player.id));
        if (isDuplicate) throw new Error("Player already enrolled");

        // 3. Prepare Player Object
        const newPlayer = {
            id: player.id,
            uid: player.id, // Legacy compatibility
            name: player.name || player.displayName || 'JUGADOR',
            level: player.level || player.playtomic_level || player.self_rate_level || 3.5,
            gender: player.gender || '?',
            photoURL: player.photoURL || null,
            joinedAt: new Date().toISOString()
        };

        // 4. Add to Main List or Waitlist
        if (currentPlayers.length >= maxPlayers) {
            console.log(`⚠️ Event full, adding to waitlist: ${player.name}`);
            const waitlist = event.waitlist || [];
            if (waitlist.some(w => w.id === player.id)) throw new Error("Player already in waitlist");

            waitlist.push(newPlayer);
            await collection.update(eventId, { waitlist });
            return { status: 'waitlist', position: waitlist.length };
        }

        // Add to Participants
        currentPlayers.push(newPlayer);
        await collection.update(eventId, { players: currentPlayers, registeredPlayers: currentPlayers });

        // 5. Intelligent Substitution (If event is live/has VACANTE slots)
        if (event.status === 'live' || event.status === 'en_juego' || event.status === 'in_game') {
            console.log("♻️ Event is LIVE. Checking for VACANTE slots to fill...");
            if (window.MatchmakingService && window.MatchmakingService.substitutePlayerInMatchesRobust) {
                // Try to fill various VACANTE aliases
                const aliases = ['VACANT', '🔴 VACANTE', 'VACANTE'];
                let filledTotal = 0;
                for (const alias of aliases) {
                    const count = await window.MatchmakingService.substitutePlayerInMatchesRobust(
                        eventId,
                        'vacante_id', // Target ID for Vacante
                        alias,
                        newPlayer.id,
                        newPlayer.name,
                        eventType
                    );
                    filledTotal += count;
                }
                if (filledTotal > 0) {
                    console.log(`✅ Filled ${filledTotal} VACANTE slots with ${newPlayer.name}`);
                }
            }
        }

        return { status: 'enrolled', count: currentPlayers.length };
    },

    /**
     * Remove a player from an event
     * Automatically promotes from waitlist if available.
     */
    async removePlayer(eventId, eventType, playerId) {
        const collection = eventType === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        const event = await collection.getById(eventId);

        let players = event.players || [];

        // ROBUST FIND: Handle multiple ID fields and string comparison
        const playerIndex = players.findIndex(p => {
            const pId = String(p?.id || p?.uid || '');
            return pId === String(playerId);
        });

        if (playerIndex === -1) {
            console.error('Player not found. PlayerId:', playerId, 'Players:', players);
            throw new Error(`Player not found in event. ID: ${playerId}`);
        }

        // Remove from main list
        const removed = players.splice(playerIndex, 1)[0];
        console.log(`✅ Removed player: ${removed?.name || 'Unknown'} (ID: ${playerId})`);

        // Cleanup Fixed Pairs if they were in one
        let fixedPairs = event.fixed_pairs || [];
        if (fixedPairs.length > 0) {
            fixedPairs = fixedPairs.filter(pair => {
                // ROBUST: Handle missing player objects
                const p1Id = String(pair?.player1?.id || pair?.player1?.uid || '');
                const p2Id = String(pair?.player2?.id || pair?.player2?.uid || '');
                const pIdStr = String(playerId);
                return p1Id !== pIdStr && p2Id !== pIdStr;
            });
        }

        // Promote from Waitlist
        let promoted = null;
        let waitlist = event.waitlist || [];
        if (waitlist.length > 0) {
            // Check if we actually need a refill (players count < max)
            const maxPlayers = (event.max_courts || 4) * 4;
            if (players.length < maxPlayers) {
                promoted = waitlist.shift(); // Take first
                players.push(promoted);
                console.log(`♻️ Promoted ${promoted.name} from waitlist`);
            }
        }

        await collection.update(eventId, {
            players,
            registeredPlayers: players,
            fixed_pairs: fixedPairs,
            waitlist
        });

        // 3. Real-time Match Substitution (If event is live/in_game)
        if (event.status === 'live' || event.status === 'en_juego' || event.status === 'in_game') {
            console.log("🔄 Event is LIVE. Triggering real-time match substitution...");
            const oldUid = removed.id || removed.uid;
            const oldName = removed.name;
            const newUid = promoted ? (promoted.id || promoted.uid) : 'vacante_id';
            const newName = promoted ? promoted.name : 'VACANTE';

            if (window.MatchmakingService && window.MatchmakingService.substitutePlayerInMatchesRobust) {
                await window.MatchmakingService.substitutePlayerInMatchesRobust(
                    eventId,
                    oldUid,
                    oldName,
                    newUid,
                    newName,
                    eventType
                );
            }
        }

        return { removed, promoted };
    },

    /**
     * Manually promote next player from waitlist
     */
    async promoteNext(eventId, eventType) {
        const collection = eventType === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        const event = await collection.getById(eventId);

        let waitlist = event.waitlist || [];
        if (waitlist.length === 0) return null;

        const promoted = waitlist.shift();
        const players = event.players || [];
        players.push(promoted);

        await collection.update(eventId, {
            players,
            waitlist,
            registeredPlayers: players
        });

        return promoted;
    },

    /**
     * Get Waitlist
     */
    async getWaitlist(eventId, eventType) {
        const collection = eventType === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        const event = await collection.getById(eventId);
        return event.waitlist || [];
    }
};
console.log("🚀 ParticipantService Loaded");

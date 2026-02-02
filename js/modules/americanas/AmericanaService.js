/**
 * AmericanaService.js (Global Version)
 */
(function () {
    class AmericanaService {
        constructor() {
            // Initial assignment
            this.db = this._getCollectionService('americana');

            // Re-check periodically if not initialised
            if (!this.db) {
                let attempts = 0;
                const interval = setInterval(() => {
                    this.db = this._getCollectionService('americana');
                    if (this.db || attempts++ > 10) clearInterval(interval);
                }, 200);
            }
        }

        validateGender(category, userGender) {
            const cat = category || 'open';
            const g = (userGender || '').toLowerCase();
            const isChico = g === 'm' || g === 'chico';
            const isChica = g === 'f' || g === 'chica';

            if (cat === 'male' && !isChico) {
                throw new Error("⛔ Categoría MASCULINA: Solo permitida para chicos.");
            }
            if (cat === 'female' && !isChica) {
                throw new Error("⛔ Categoría FEMENINA: Solo permitida para chicas.");
            }
            if (cat === 'mixed' && !isChico && !isChica) {
                throw new Error("⛔ Categoría MIXTA: Debes definir tu género en el perfil.");
            }
            return true;
        }

        /**
         * Helper to get the correct collection service (Admin vs Public)
         */
        _getCollectionService(type) {
            if (typeof window.createService === 'function') {
                return (type === 'entreno') ? window.createService('entrenos') : window.createService('americanas');
            } else if (window.FirebaseDB) {
                return (type === 'entreno') ? window.FirebaseDB.entrenos : window.FirebaseDB.americanas;
            }
            return null;
        }

        async getActiveAmericanas() {
            try {
                if (!this.db) return [];
                const all = await this.db.getAll();
                return all
                    .filter(a => a.status !== 'finished')
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            } catch (error) {
                console.error("Error fetching active americanas:", error);
                return [];
            }
        }

        /**
         * Unified method to fetch both Americanas and Entrenos for Dashboard
         */
        async getAllActiveEvents() {
            try {
                const results = await Promise.all([
                    this._getCollectionService('americana')?.getAll() || [],
                    this._getCollectionService('entreno')?.getAll() || []
                ]);

                const [ams, ents] = results;

                const all = [
                    ...ams.map(e => ({ ...e, type: 'americana' })),
                    ...ents.map(e => ({ ...e, type: 'entreno' }))
                ];

                // Filtramos por estado, no por fecha, para asegurar que eventos en curso sigan monitorizados
                return all
                    .filter(e => e.status !== 'finished')
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            } catch (error) {
                console.error("Error fetching all active events:", error);
                return [];
            }
        }

        async addPlayer(americanaId, user, type = 'americana') {
            try {
                // Determine which collection service to use
                const service = this._getCollectionService(type);
                if (!service) throw new Error("Servicio de base de datos no disponible");

                const event = await service.getById(americanaId);
                if (!event) throw new Error("Evento no encontrado (" + type + ")");

                // Check BOTH arrays for legacy/current compatibility
                const players = event.players || [];
                const regPlayers = event.registeredPlayers || [];

                // Unified check for existing UID
                const exists = (players.find(p => p.uid === user.uid || p.id === user.uid)) ||
                    (regPlayers.find(p => p.uid === user.uid || p.id === user.uid));

                if (exists) {
                    throw new Error("Ya estás inscrito en este evento.");
                }

                // GENDER VALIDATION
                this.validateGender(event.category, user.gender);

                const userGender = user.gender || 'M';

                const normalizedGender = (userGender === 'M' || userGender === 'chico') ? 'chico' :
                    (userGender === 'F' || userGender === 'chica') ? 'chica' : '?';

                const newPlayerData = {
                    id: user.uid,
                    uid: user.uid,
                    name: user.name || user.displayName || user.email || 'Jugador',
                    level: user.level || user.self_rate_level || '3.5',
                    team_somospadel: user.team_somospadel || user.team || [],
                    gender: normalizedGender,
                    joinedAt: new Date().toISOString()
                };

                players.push(newPlayerData);

                // USE THE CORRECT SERVICE (Americanas or Entrenos)
                await service.update(americanaId, {
                    players: players,
                    registeredPlayers: players // Sync both
                });

                // --- AUTO-FILL VACANCIES IN MATCHES (Global Fix) ---
                // If the event has active matches with VACANT spots, fill them immediately.
                if (window.MatchMakingService) {
                    const matchColl = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                    const hasMatches = await window.db.collection(matchColl).where('americana_id', '==', americanaId).limit(1).get();

                    if (!hasMatches.empty) {
                        console.log(`🔍 [Service] New player ${user.name} joined active event. Checking for vacancies...`);
                        // Try standard variants of VACANT
                        await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', '🔴 VACANTE', user.uid, user.name);
                        await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', 'VACANTE', user.uid, user.name);
                        await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', 'VACANT', user.uid, user.name);
                    }
                }

                // --- NOTIFICATIONS ---
                if (window.NotificationService) {
                    const evtName = event.name || type.toUpperCase();
                    const evtLink = { url: 'live', eventId: americanaId };

                    // 1. Notify the user who joined
                    window.NotificationService.sendNotificationToUser(
                        user.uid,
                        "Inscripción Confirmada",
                        `Te has apuntado a ${evtName}. ¡A darlo todo!`,
                        evtLink
                    );

                    // 2. Notify other players (Peer-to-Peer)
                    // We iterate EXISTING players (before push) to notify them.
                    // Wait, 'players' array already has the new player pushed in line 124.
                    // So we filter out the current user.
                    const others = players.filter(p => (p.uid || p.id) !== user.uid);

                    // Limit broadcast to avoid timeout/spam issues
                    if (others.length < 50) {
                        others.forEach(p => {
                            const pid = p.uid || p.id;
                            window.NotificationService.sendNotificationToUser(
                                pid,
                                "Nuevo Jugador",
                                `${user.name} se ha unido a ${evtName}`,
                                evtLink
                            ).catch(e => console.warn("Failed to notify peer", pid));
                        });
                    }
                }

                // this.notifyAdminOfRegistration(event, user);

                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        notifyAdminOfRegistration(evt, user) {
            // "cuando el jugador se apunta a la americana necesito que automaticamente me llege un mensaje de confirmación al admin"
            const adminPhone = "34649219350"; // Based on admin.js master user
            const msg = `🎾 *NUEVA INSCRIPCIÓN* %0A%0A👤 Jugador: ${user.name} %0A🏆 Evento: ${evt.name} %0A📅 Fecha: ${evt.date} ${evt.time}`;

            // "y al jugaror que le llege tambien una notificacion de que se ha apuntado por whats app"
            // To automate this from client side without user clicking is hard, but we can open one for the ADMIN to see.
            // Ideally, the user sees a "Success" screen with a button "RECIBIR CONFIRMACIÓN" to chat with self or bot.

            // For now, we attempt to open the Admin notification in background or new tab if allowed, 
            // OR allow the user to send it.
            // Since the user asked for "automatic", and we are client-side:
            console.log("🔔 Notifying Admin via WA Link generation...");

            // We can't auto-send. We can only prep result.
            // Let's rely on the Admin Panel 'CHAT' buttons for manual follow up if needed, 
            // BUT here we can try `window.open` if context allows, though it might be blocked.

            const waLink = `https://wa.me/${adminPhone}?text=${msg}`;

            // Hack: Trigger a tiny popup or just console log if we can't force it.
            // A clearer UX is alerting the user "Inscripción Correcta. Avisando al admin..."
            // const win = window.open(waLink, '_blank');
        }

        async removePlayer(americanaId, userId, type = 'americana') {
            try {
                const service = this._getCollectionService(type);
                if (!service) throw new Error("Servicio de base de datos no disponible");

                const event = await service.getById(americanaId);
                if (!event) throw new Error("Evento no encontrado");

                const currentPlayers = event.players || event.registeredPlayers || [];
                const newPlayers = currentPlayers.filter(p => {
                    const id = (typeof p === 'string') ? p : (p.uid || p.id);
                    return id !== userId;
                });

                const updates = {
                    registeredPlayers: newPlayers,
                    players: newPlayers
                };

                const maxPlayers = (event.max_courts || 4) * 4;
                if (event.status === 'live' && newPlayers.length < maxPlayers) {
                    updates.status = 'open';
                    await this.purgeMatches(americanaId, type);
                }

                await service.update(americanaId, updates);

                // --- SMART WAITLIST LOGIC ---
                if (newPlayers.length < maxPlayers) {
                    await this.triggerNextInWaitlist(americanaId, type);
                }

                if (window.NotificationService) {
                    const evtName = event.name || type.toUpperCase();
                    window.NotificationService.sendNotificationToUser(userId, "Baja Confirmada", `Te has dado de baja de ${evtName}.`, { url: 'americanas' });
                }

                return { success: true };
            } catch (err) {
                console.error(`Error in removePlayer (${type}):`, err);
                return { success: false, error: err.message };
            }
        }

        async triggerNextInWaitlist(eventId, type) {
            try {
                const service = this._getCollectionService(type);
                const event = await service.getById(eventId);
                const waitlist = event.waitlist || [];
                if (waitlist.length === 0 || event.waitlist_pending_user) return;

                const nextUser = waitlist[0];
                await service.update(eventId, {
                    waitlist_pending_user: nextUser,
                    waitlist_notified_at: new Date().toISOString(),
                    waitlist: waitlist.slice(1)
                });

                if (window.NotificationService) {
                    window.NotificationService.sendNotificationToUser(nextUser.uid, "¡PLAZA LIBRE! 🎾", `Tienes 10 MINUTOS para confirmar tu plaza en ${event.name}.`, { url: 'live', eventId, action: 'confirm_waitlist' });
                }
            } catch (err) { console.error("Waitlist Trigger Error:", err); }
        }

        async addToWaitlist(eventId, user, type = 'americana') {
            try {
                const service = this._getCollectionService(type);
                const event = await service.getById(eventId);
                const waitlist = event.waitlist || [];
                if (waitlist.find(p => p.uid === user.uid)) throw new Error("Ya estás en lista de espera.");

                // GENDER VALIDATION
                this.validateGender(event.category, user.gender);

                waitlist.push({
                    uid: user.uid,
                    name: user.name,
                    gender: user.gender || 'M',
                    joinedAt: new Date().toISOString()
                });
                await service.update(eventId, { waitlist });
                return { success: true };
            } catch (err) { return { success: false, error: err.message }; }
        }

        async confirmWaitlist(eventId, userId, type = 'americana') {
            try {
                const service = this._getCollectionService(type);
                const event = await service.getById(eventId);
                if (!event.waitlist_pending_user || event.waitlist_pending_user.uid !== userId) throw new Error("Expirado.");
                await this.addPlayer(eventId, event.waitlist_pending_user, type);
                await service.update(eventId, { waitlist_pending_user: null, waitlist_notified_at: null });
                return { success: true };
            } catch (err) { return { success: false, error: err.message }; }
        }

        async processWaitlistTimeouts() {
            const all = await this.getAllActiveEvents();
            const now = new Date();
            for (const evt of all) {
                if (evt.waitlist_pending_user && evt.waitlist_notified_at) {
                    if ((now - new Date(evt.waitlist_notified_at)) / 60000 >= 10) {
                        const service = this._getCollectionService(evt.type);
                        await service.update(evt.id, { waitlist_pending_user: null, waitlist_notified_at: null });
                        await this.triggerNextInWaitlist(evt.id, evt.type);
                    }
                }
            }
        }

        /**
         * Purge matches for an event when it reverts to OPEN status.
         */
        async purgeMatches(eventId, type = 'americana') {
            try {
                const collectionName = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                const snapshot = await window.db.collection(collectionName)
                    .where('americana_id', '==', eventId)
                    .get();

                if (snapshot.empty) return;

                const batch = window.db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                console.log(`[AmericanaService] Purged ${snapshot.size} matches from ${collectionName}`);
            } catch (err) {
                console.error("Error purging matches:", err);
            }
        }

        /**
         * Delete a specific round (used for regenerating logic)
         */
        async deleteRound(eventId, round, type = 'americana') {
            try {
                const collectionName = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                const snapshot = await window.db.collection(collectionName)
                    .where('americana_id', '==', eventId)
                    .where('round', '==', parseInt(round))
                    .get();

                if (snapshot.empty) return 0;

                const batch = window.db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                console.log(`[AmericanaService] Deleted Round ${round} (${snapshot.size} matches)`);
                return snapshot.size;
            } catch (err) {
                console.error("Error deleting round:", err);
                throw err;
            }
        }

        async createAmericana(data) {
            if (!data.name || !data.date) throw new Error("Invalid Americana Data");
            return await this.db.create({
                ...data,
                status: 'draft',
                registeredPlayers: []
            });
        }

        /**
         * Automatically generates matches for the first round of an event
         */
        async generateFirstRoundMatches(eventId, type = 'americana') {
            try {
                if (!window.MatchMakingService) throw new Error("MatchMakingService not loaded");
                console.log(`🎲 [AmericanaService] Delegating R1 generation to MatchMakingService for ${type} ${eventId}`);
                return await window.MatchMakingService.generateRound(eventId, type, 1);
            } catch (err) {
                console.error("Error in generateFirstRoundMatches:", err);
            }
        }

        /**
         * Automatically generates matches for the NEXT round (R > 1)
         * Supports both ENTRENOS and AMERICANAS
         */
        async generateNextRound(eventId, currentRound, type = 'entreno') {
            try {
                if (!window.MatchMakingService) throw new Error("MatchMakingService not loaded");

                // CHECK AND CLEANUP NEXT ROUND (Fix for Ghost Results)
                const nextRound = currentRound + 1;

                // Aggressively delete any partial/ghost matches for this round before regenerating
                console.log(`🧹 [AmericanaService] Pruning R${nextRound} before generation to prevent ghost scores...`);
                await this.deleteRound(eventId, nextRound, type);

                console.log(`🤖 [AmericanaService] Delegating Next Round generation to MatchMakingService for ${type} ${eventId}`);
                return await window.MatchMakingService.generateRound(eventId, type, nextRound);
            } catch (err) {
                console.error("❌ Error generating next round:", err);
                throw err; // RETHROW to let Controller handle it
            }
        }
    }

    // Initialize immediately if possible, otherwise retry
    if (window.db && (window.createService || window.FirebaseDB)) {
        window.AmericanaService = new AmericanaService();
        console.log("🏆 AmericanaService Global Loaded & Ready");
    } else {
        // Retry with longer timeout for file:// protocol
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds total
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.db && (window.createService || window.FirebaseDB)) {
                window.AmericanaService = new AmericanaService();
                console.log("🏆 AmericanaService Global Loaded & Ready (attempt " + attempts + ")");
                clearInterval(checkInterval);
            } else if (attempts >= maxAttempts) {
                console.error("❌ AmericanaService failed to initialize after", maxAttempts, "attempts");
                console.error("Make sure Firebase is properly configured and loaded");
                clearInterval(checkInterval);
            }
        }, 200);
    }
})();

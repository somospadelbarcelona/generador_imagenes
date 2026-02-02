/**
 * CommunityController.js
 * Gestiona el muro de "Partidas Abiertas" (WhatsApp Style Feed)
 */
(function () {
    class CommunityController {
        constructor() {
            this.matches = [];
            this.isJoining = false; // Flag to prevent 429 spam
            this.init();
        }

        init() {
            console.log("👥 CommunityController Initialized");
            // Se cargará cuando la ruta 'community' se active
        }

        async loadView() {
            console.log("👥 Loading Community Feed...");
            window.CommunityView.renderLoading();

            try {
                // Initial fetch handled by snapshot but we wait a bit or just render empty first
                this.listenForUpdates();
            } catch (error) {
                console.error("Error loading matches:", error);
                window.CommunityView.renderError(error.message);
            }
        }

        listenForUpdates() {
            // Escucha en tiempo real
            window.db.collection('open_matches')
                .where('date', '>=', new Date().toISOString().split('T')[0]) // Solo futuras u hoy
                .orderBy('date', 'asc')
                .onSnapshot(snapshot => {
                    this.matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Ordenar localmente por hora si la fecha es igual
                    this.matches.sort((a, b) => {
                        const dateA = new Date(a.date + 'T' + a.time.split('-')[0].trim());
                        const dateB = new Date(b.date + 'T' + b.time.split('-')[0].trim());
                        return dateA - dateB;
                    });
                    if (window.CommunityView) window.CommunityView.render(this.matches);
                });
        }

        async fetchMatches() {
            // Initial fetch if needed (Snapshot handles updates)
        }

        // --- ACTIONS ---

        async createMatch(data) {
            try {
                const user = window.Store.getState('currentUser');
                if (!user) throw new Error("Debes iniciar sesión");

                const slots = [];
                // Slot 1: El organizador (si juega)
                // Usamos validación explícita
                const plays = data.organizerPlays !== false;

                if (plays) {
                    slots.push({ status: 'occupied', userId: user.uid, userName: user.name, avatar: user.photo_url || null });
                } else {
                    slots.push({ status: 'open', userId: null, userName: null });
                }

                // Resto de slots vacíos hasta 4
                while (slots.length < 4) {
                    slots.push({ status: 'open', userId: null, userName: null });
                }

                await window.db.collection('open_matches').add({
                    organizerId: user.uid,
                    organizerName: user.name,
                    location: data.location,
                    date: data.date,
                    time: data.time,
                    level: data.level,
                    courtType: data.courtType || 'Indoor',
                    price: data.price || '0',
                    externalLink: data.externalLink || '',
                    description: data.description || '',
                    slots: slots,
                    createdAt: new Date().toISOString()
                });

                return { success: true };
            } catch (e) {
                console.error("Error creating match:", e);
                return { success: false, error: e.message };
            }
        }

        async joinSlot(matchId, slotIndex) {
            if (this.isJoining) return; // ✅ Anti-spam
            this.isJoining = true;

            try {
                const user = window.Store.getState('currentUser');
                if (!user) {
                    alert("Inicia sesión para apuntarte");
                    this.isJoining = false;
                    return;
                }

                const matchRef = window.db.collection('open_matches').doc(matchId);

                await window.db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(matchRef);
                    if (!doc.exists) throw new Error("Partida no encontrada");

                    const match = doc.data();
                    const slots = match.slots || [];

                    // Verificar conflicto
                    if (slots[slotIndex].status !== 'open') throw new Error("Plaza ocupada");
                    if (slots.some(s => s.userId === user.uid)) throw new Error("Ya estás apuntado");

                    // Ocupar plaza
                    slots[slotIndex] = {
                        status: 'occupied',
                        userId: user.uid,
                        userName: user.name,
                        avatar: user.photo_url || null
                    };

                    transaction.update(matchRef, { slots: slots });
                });
            } catch (e) {
                // Silent fail/warn
                console.warn("Join failed:", e);
                // Feedback visual de actualización si falla
                if (window.CommunityView) window.CommunityView.render(this.matches);
            } finally {
                setTimeout(() => { this.isJoining = false; }, 800);
            }
        }

        async leaveSlot(matchId) {
            if (this.isJoining) return;
            this.isJoining = true;

            try {
                const user = window.Store.getState('currentUser');
                if (!user) return;

                const matchRef = window.db.collection('open_matches').doc(matchId);

                await window.db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(matchRef);
                    if (!doc.exists) throw new Error("Partida no encontrada");

                    const match = doc.data();
                    const slots = match.slots || [];
                    const slotIndex = slots.findIndex(s => s.userId === user.uid);

                    if (slotIndex === -1) return;

                    // Liberar plaza
                    slots[slotIndex] = { status: 'open', userId: null, userName: null };

                    transaction.update(matchRef, { slots: slots });
                });
            } catch (e) {
                console.error("Error leaving match:", e);
            } finally {
                setTimeout(() => { this.isJoining = false; }, 800);
            }
        }

        async deleteMatch(matchId) {
            if (!confirm("¿Seguro que quieres borrar este anuncio?")) return;
            try {
                await window.db.collection('open_matches').doc(matchId).delete();
            } catch (e) {
                alert("Error borrando: " + e.message);
            }
        }

        async updateMatch(matchId, data) {
            try {
                const user = window.Store.getState('currentUser');
                if (!user) throw new Error("Debes iniciar sesión");

                // Security/Validation check: Ensure user is organizer?
                // For now assuming the edit button is only shown to organizer in View.

                await window.db.collection('open_matches').doc(matchId).update({
                    location: data.location,
                    date: data.date,
                    time: data.time,
                    price: data.price,
                });
                return { success: true };
            } catch (e) {
                console.error("Error updating match:", e);
                return { success: false, error: e.message };
            }
        }
    }

    window.CommunityController = new CommunityController();
})();

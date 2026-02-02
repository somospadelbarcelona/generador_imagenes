/**
 * ChatService.js
 * Secure Communication Protocol for Event Operations.
 * Handles real-time messaging, SOS signals, admin broadcasts, and user presence.
 * VERSION: Pro Expert v6.0
 */
(function () {
    class ChatService {
        constructor() {
            this.activeUnsubscribe = null;
            this.presenceInterval = null;
        }

        /**
         * Subscribe to an event's chat channel
         */
        subscribe(eventId, callback) {
            if (this.activeUnsubscribe) this.activeUnsubscribe();

            // Listen to messages ordered by time
            this.activeUnsubscribe = window.db.collection('chats')
                .doc(eventId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .limit(100)
                .onSnapshot(snapshot => {
                    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(messages);
                }, error => {
                    console.error("📡 [Chat Comms Lost]", error);
                });

            // Auto-presence reporting
            this.startPresenceHeartbeat(eventId);
        }

        /**
         * Real-time User Presence (Heartbeat)
         */
        async startPresenceHeartbeat(eventId) {
            const user = window.Store.getState('currentUser');
            if (!user) return;

            const uid = user.id || user.uid;
            const presenceRef = window.db.collection('chats').doc(eventId).collection('presence').doc(uid);

            const reportStatus = async () => {
                try {
                    await presenceRef.set({
                        name: user.name,
                        photo: user.photo_url || null,
                        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'online'
                    });
                } catch (e) {
                    console.warn("[ChatService] Presence heartbeat failed", e);
                }
            };

            // First report
            await reportStatus();

            // Interval every 2 minutes
            if (this.presenceInterval) clearInterval(this.presenceInterval);
            this.presenceInterval = setInterval(reportStatus, 120000);
        }

        /**
         * Subscribe to who's online right now
         */
        subscribePresence(eventId, callback) {
            // Consider "Online" anyone who reported in the last 5 minutes
            return window.db.collection('chats').doc(eventId).collection('presence')
                .onSnapshot(snapshot => {
                    const now = Date.now();
                    const fiveMinutes = 5 * 60 * 1000;

                    const onlineUsers = snapshot.docs
                        .map(doc => ({ uid: doc.id, ...doc.data() }))
                        .filter(u => {
                            if (!u.lastSeen) return false;
                            const lastSeenMillis = u.lastSeen.toMillis ? u.lastSeen.toMillis() : u.lastSeen;
                            return (now - lastSeenMillis) < fiveMinutes;
                        });

                    callback(onlineUsers);
                });
        }

        /**
         * Send a tactical message (Pro version supports image/audio attachments)
         */
        async sendMessage(eventId, text, media = null) {
            const user = window.Store.getState('currentUser');
            if (!user) return { success: false, error: 'Unauthorized' };

            try {
                const isAdmin = (user.role === 'admin' || user.role === 'admin_player');
                let messageType = isAdmin ? 'admin' : 'standard';

                // Broadcast Detection (Admin Only via !! prefix)
                if (isAdmin && text && text.startsWith('!!')) {
                    messageType = 'broadcast';
                    text = text.substring(2).trim();
                }

                if (media) {
                    messageType = media.type === 'audio' ? 'audio' : 'media';
                }

                await window.db.collection('chats').doc(eventId).collection('messages').add({
                    text: String(text || ''),
                    attachment: media ? media.data : null, // Base64
                    attachmentType: media ? media.type : null,
                    senderId: user.id || user.uid,
                    senderName: user.name || user.displayName || 'Jugador',
                    senderTeam: user.team || user.team_name || user.membership || user.category || 'PLAYER',
                    senderAvatar: user.photo_url || null,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    type: messageType,
                    isAdmin: isAdmin
                });
                return { success: true };
            } catch (e) {
                console.error("❌ Send Failed:", e);
                return { success: false, error: e.message };
            }
        }

        async closeRoom(eventId) {
            const user = window.Store.getState('currentUser');
            if (user) {
                const uid = user.id || user.uid;
                try {
                    await window.db.collection('chats').doc(eventId).collection('presence').doc(uid).delete();
                } catch (e) { }
            }
            this.unsubscribe();
        }

        /**
         * Delete a message (Admin only)
         */
        async deleteMessage(eventId, messageId) {
            try {
                await window.db.collection('chats').doc(eventId).collection('messages').doc(messageId).delete();
                return { success: true };
            } catch (e) {
                console.error("❌ Delete Failed:", e);
                return { success: false, error: e.message };
            }
        }

        /**
         * Toggle SOS Status (Need Partner)
         */
        async toggleSOS(eventId, isActive) {
            const user = window.Store.getState('currentUser');
            if (!user) return;

            const chatRef = window.db.collection('chats').doc(eventId);

            try {
                if (isActive) {
                    await chatRef.set({
                        sos_signals: firebase.firestore.FieldValue.arrayUnion({
                            uid: user.id || user.uid,
                            name: user.name,
                            timestamp: Date.now()
                        })
                    }, { merge: true });
                } else {
                    const doc = await chatRef.get();
                    if (doc.exists) {
                        let signals = doc.data().sos_signals || [];
                        signals = signals.filter(s => s.uid !== (user.id || user.uid));
                        await chatRef.update({ sos_signals: signals });
                    }
                }
            } catch (e) {
                console.error("SOS Signal Error:", e);
            }
        }

        /**
         * Listen to SOS signals
         */
        subscribeSOS(eventId, callback) {
            return window.db.collection('chats').doc(eventId)
                .onSnapshot(doc => {
                    callback(doc.exists ? (doc.data().sos_signals || []) : []);
                });
        }

        unsubscribe() {
            if (this.activeUnsubscribe) {
                this.activeUnsubscribe();
                this.activeUnsubscribe = null;
            }
            if (this.presenceInterval) {
                clearInterval(this.presenceInterval);
                this.presenceInterval = null;
            }
        }
    }

    window.ChatService = new ChatService();
    console.log("📡 Ops Room Comms Linked (vPro)");
})();

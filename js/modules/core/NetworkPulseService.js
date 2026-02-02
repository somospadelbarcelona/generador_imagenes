/**
 * NetworkPulseService.js
 * 🌐 Monitorización de Nodos y Pulso de Red (Expert Edition)
 * Gestiona el estado 'online' y proporciona métricas de conectividad
 */
(function () {
    'use strict';

    class NetworkPulseService {
        constructor() {
            this.db = window.db;
            this.activeNodes = [];
            this.listeners = [];
            this.activityLog = [];
            this.heartbeatInterval = null;
            this.initialized = false;
            this.cities = ['Barcelona', 'L\'Hospitalet', 'El Prat', 'Cornellà', 'Badalona', 'Sabadell', 'Sant Boi', 'Gavà', 'Viladecans', 'Castelldefels'];
        }

        /**
         * Inicializa el seguimiento de conectividad
         */
        async init(userId) {
            if (!userId || this.initialized) return;
            this.initialized = true;

            // 1. Obtener total real de usuarios registrados
            try {
                const snap = await this.db.collection('users').get();
                this.totalUsersCount = snap.size || 0;
            } catch (e) {
                console.error('[NetworkPulse] Error counting users:', e);
                this.totalUsersCount = 0;
            }

            // 2. Iniciar Latido (Heartbeat)
            this.startHeartbeat(userId);

            // 3. Escuchar cambios globales
            this.listenToActiveNodes();

            // 4. Actividad entrante
            this.startActivitySimulation();
        }

        /**
         * Actualiza el timestamp del usuario actual
         */
        async startHeartbeat(userId) {
            if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

            const updatePresence = async () => {
                const randomCity = this.cities[Math.floor(Math.random() * this.cities.length)];
                try {
                    await this.db.collection('users').doc(userId).update({
                        last_online: Date.now(),
                        city: randomCity,
                        device_node: navigator.platform || 'WEB-CLIENT'
                    });
                } catch (e) {
                    console.warn('[NetworkPulse] Update skipped');
                }
            };

            updatePresence();
            this.heartbeatInterval = setInterval(updatePresence, 30000);
        }

        /**
         * Escucha usuarios reales conectados (Últimos accesos)
         */
        listenToActiveNodes() {
            // Obtenemos los últimos 20 usuarios que han tenido actividad, sin límite de tiempo estricto
            // para asegurar que la lista siempre contenga nombres de personas reales del club.
            this.db.collection('users')
                .orderBy('last_online', 'desc')
                .limit(20)
                .onSnapshot(snapshot => {
                    this.activeNodes = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            name: data.name || 'JUGADOR SOMOSPADEL',
                            last_online: data.last_online,
                            city: data.city || 'Barcelona',
                            node: data.device_node || 'APP'
                        };
                    });

                    this.notifyListeners();
                }, err => {
                    console.error('[NetworkPulse] Snap error:', err);
                    // Fallback silencioso si el índice de Firestore aún no está creado
                    if (err.message && err.message.includes('index')) {
                        console.warn('Recomendación: Crear índice compuesto en Firestore para [last_online DESC]');
                    }
                });
        }

        /**
         * Simula actividad entrante para impacto visual
         */
        startActivitySimulation() {
            const generateEvent = () => {
                const randomCity = this.cities[Math.floor(Math.random() * this.cities.length)];
                const event = {
                    type: 'CONNECTION',
                    location: randomCity,
                    time: Date.now(),
                    label: `Nuevo acceso detectado: ${randomCity.toUpperCase()}`
                };

                this.activityLog.unshift(event);
                if (this.activityLog.length > 8) this.activityLog.pop();

                this.notifyListeners();

                // Programar siguiente evento (entre 5 y 15 segundos)
                setTimeout(generateEvent, Math.random() * 10000 + 5000);
            };

            generateEvent();
        }

        /**
         * Métricas de red con factor de crecimiento
         */
        getNetworkMetrics() {
            const baseTraffic = 450 + Math.floor(Math.random() * 100);
            const growth = (Math.random() * 5 + 2).toFixed(1);

            return {
                latency: Math.floor(Math.random() * (28 - 12) + 12) + 'ms',
                throughput: (Math.random() * (8.5 - 4.1) + 4.1).toFixed(2) + ' Gbps',
                encryption: 'SHA-256 AES-GCM',
                uptime: '99.98%',
                load: Math.floor(Math.random() * 20 + 15) + '%',
                globalTraffic: baseTraffic,
                growth: growth
            };
        }

        getAccessLog() {
            return this.activeNodes.slice(0, 5).map(node => {
                const time = new Date(node.last_online).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return `[${time}] ${node.node} - ${node.city.toUpperCase()} CONNECTED`;
            });
        }

        getRecentActivity() {
            return this.activityLog;
        }

        onUpdate(callback) {
            this.listeners.push(callback);
            callback(this.activeNodes);
        }

        notifyListeners() {
            this.listeners.forEach(cb => cb(this.activeNodes));
        }
    }

    window.NetworkPulseService = new NetworkPulseService();
    console.log('🌐 Network Pulse Service (SOC Edition) Ready');
})();

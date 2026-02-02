/**
 * LevelReliabilityService.js
 * 
 * Gestiona la lógica del "Semáforo de Fiabilidad" basada en la actividad reciente.
 */
window.LevelReliabilityService = {
    // Definición de umbrales (días)
    THRESHOLDS: {
        GREEN: 30,  // Menos de 30 días -> Fiable
        YELLOW: 60  // Menos de 60 días -> Dudoso (entre 30 y 60)
        // Más de 60 días -> Rojo
    },

    /**
     * Calcula la fiabilidad de un jugador basándose en su última fecha de partido.
     * @param {Object} player Objeto del jugador con campo last_match_date
     * @returns {Object} { color, label, icon, daysInactive }
     */
    getReliability(player) {
        const lastDate = player.last_match_date;

        if (!lastDate) {
            return {
                color: '#888', // Gris
                label: 'Sin datos',
                icon: 'fa-circle',
                daysInactive: Infinity
            };
        }

        // Convertir string or timestamp a Date
        const lastMatch = (lastDate.toDate) ? lastDate.toDate() : new Date(lastDate);
        const now = new Date();
        const diffTime = Math.abs(now - lastMatch);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= this.THRESHOLDS.GREEN) {
            return {
                color: '#00ff64', // Verde (var(--primary) o similar)
                label: 'Nivel Fiable',
                icon: 'fa-circle',
                daysInactive: diffDays
            };
        } else if (diffDays <= this.THRESHOLDS.YELLOW) {
            return {
                color: '#FFD700', // Amarillo / Dorado
                label: 'Nivel Dudoso',
                icon: 'fa-circle',
                daysInactive: diffDays
            };
        } else {
            return {
                color: '#FF5555', // Rojo
                label: 'Nivel Oxidado',
                icon: 'fa-circle',
                daysInactive: diffDays
            };
        }
    },

    /**
     * Actualiza la fecha del último partido para una lista de jugadores.
     * @param {Array} playerIds IDs de los jugadores
     * @param {Date} date Fecha del partido (opcional, por defecto ahora)
     */
    async updateLastMatchDate(playerIds, date = new Date()) {
        if (!playerIds || playerIds.length === 0) return;

        console.log(`🚦 [Reliability] Actualizando fecha para ${playerIds.length} jugadores...`);

        const batch = window.db.batch();
        const isoDate = date.toISOString();

        playerIds.forEach(id => {
            if (!id) return;
            const ref = window.db.collection('players').doc(id);
            batch.update(ref, {
                last_match_date: isoDate,
                last_active: window.firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log("✅ [Reliability] Fechas actualizadas correctamente.");
    },

    /**
     * SCRIPT DE RESCATE: Recupera datos del entreno del 11/01
     */
    async runRescue1101() {
        console.log("🚑 [Rescate] Iniciando búsqueda de eventos para el 11/01/2026...");
        try {
            // Buscamos eventos en varios formatos de fecha posibles
            let docs = [];

            // 1. Formato YYYY-MM-DD (Estándar HTML date input)
            const snap1 = await window.db.collection('entrenos').where('date', '==', '2026-01-11').get();
            snap1.forEach(d => docs.push(d));

            // 2. Formato DD/MM/YYYY (Formato Display ES)
            const snap2 = await window.db.collection('entrenos').where('date', '==', '11/01/2026').get();
            snap2.forEach(d => { if (!docs.some(x => x.id === d.id)) docs.push(d); });

            // 3. Fallback: Rango String para ISO timestamps completos
            const snap3 = await window.db.collection('entrenos')
                .where('date', '>=', '2026-01-11T00:00:00')
                .where('date', '<=', '2026-01-11T23:59:59')
                .get();
            snap3.forEach(d => { if (!docs.some(x => x.id === d.id)) docs.push(d); });

            if (docs.length === 0) {
                throw new Error("No se encontraron entrenos con fechas '2026-01-11' ni '11/01/2026'.");
            }

            console.log(`🚑 Encontrados ${docs.length} eventos candidatos.`);

            const results = [];
            for (const doc of docs) {
                const data = doc.data();
                console.log(`🔎 Analizando evento: ${data.name} (${doc.id})`);
                const res = await this._processRescue(doc.id, new Date('2026-01-11T12:00:00'));
                if (res) results.push(res);
            }

            if (results.length > 0) {
                alert(`✅ Rescate finalizado.\nEventos procesados: ${results.length}\nTotal jugadores actualizados: ${results.reduce((acc, r) => acc + r.count, 0)}`);
            } else {
                alert("⚠️ Se encontraron eventos pero no partidos/jugadores válidos para rescatar.");
            }
            return results;

        } catch (e) {
            console.error("❌ Error en rescate:", e);
            alert("Error crítico en rescate: " + e.message);
        }
    },

    async _processRescue(eventId, date) {
        console.log(`🔍 Procesando partidos del evento ${eventId}...`);

        try {
            // 0. Pre-cargar mapa de jugadores (Nombre -> ID) y Array para búsqueda fuzzy
            const playersSnap = await window.db.collection('players').get();
            const playerMap = {};
            const playersArray = []; // Para búsqueda fuzzy

            // Helper para normalizar (quitar tildes, minúsculas)
            const normalize = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

            playersSnap.docs.forEach(d => {
                const p = d.data();
                const id = d.id;
                if (p.name) {
                    playerMap[p.name.trim().toLowerCase()] = id;
                    playersArray.push({ name: p.name, id: id, nName: normalize(p.name) });
                }
            });
            console.log(`📚 Mapa de jugadores cargado: ${playersArray.length} usuarios.`);

            // 1. Buscar TODOS los partidos de ese evento
            const matchSnapshot = await window.db.collection('entrenos_matches')
                .where('americana_id', '==', eventId)
                .get();

            const playerIds = new Set();
            let matchesFound = 0;

            matchSnapshot.docs.forEach(doc => {
                const m = doc.data();
                matchesFound++;

                // A. Collect Explicit IDs (si existen)
                const rawIds = [];
                if (m.team_a_ids) rawIds.push(...m.team_a_ids);
                if (m.team_b_ids) rawIds.push(...m.team_b_ids);
                ['player1', 'player2', 'player3', 'player4'].forEach(k => {
                    if (m[k] && typeof m[k] === 'object' && m[k].id) rawIds.push(m[k].id);
                    else if (m[k] && typeof m[k] === 'string' && m[k].length > 15 && !m[k].includes(' ')) rawIds.push(m[k]);
                });

                rawIds.forEach(id => { if (id) playerIds.add(id); });

                // B. Recover from Names (Estrategia Avanzada de Coincidencia)
                const names = [];
                if (m.team_a_names) names.push(...(Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names]));
                if (m.team_b_names) names.push(...(Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names]));

                names.forEach(n => {
                    if (!n) return;
                    const cleanName = n.toString().trim().toLowerCase();
                    const normName = normalize(n.toString());

                    // 1. Intento Exacto (Rápido)
                    if (playerMap[cleanName]) {
                        playerIds.add(playerMap[cleanName]);
                        return;
                    }

                    // 2. Intento Fuzzy (Lento pero necesario para rescate)
                    const foundPlayer = playersArray.find(p => {
                        // Coincidencia parcial: "David Coca" en "David Coca Piné" -> TRUE
                        return p.nName === normName || p.nName.includes(normName) || normName.includes(p.nName);
                    });

                    if (foundPlayer) {
                        console.log(`🧩 Match encontrado: "${n}" -> "${foundPlayer.name}" (${foundPlayer.id})`);
                        playerIds.add(foundPlayer.id);
                    } else {
                        // console.warn(`⚠️ No se encontró jugador para: "${n}"`);
                    }
                });
            });

            console.log(`📊 Partidos analizados: ${matchesFound}. Jugadores únicos encontrados: ${playerIds.size}`);

            const idsArray = Array.from(playerIds).filter(id => !!id);

            if (idsArray.length === 0) {
                console.warn("⚠️ No se encontraron IDs válidos tras el análisis.");
                return null;
            }

            await this.updateLastMatchDate(idsArray, date);
            return { success: true, count: idsArray.length };

        } catch (e) {
            console.error("Error en _processRescue:", e);
            throw e;
        }
    }
};

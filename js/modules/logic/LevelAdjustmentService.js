/**
 * LevelAdjustmentService.js
 * Sistema Inteligente de Ajuste de Nivel (ELO-Style)
 * Calcula y escala el nivel del jugador basándose en resultados reales.
 */

(function () {
    const LevelAdjustmentService = {

        // Configuración de sensibilidad (AUMENTADA v2)
        CONFIG: {
            BASE_GAIN: 0.010,    // (Antes 0.005) Ganancia estándar
            MAX_ADJUST: 0.025,   // (Antes 0.010) Máximo por partido
            MIN_ADJUST: 0.005,   // Mínimo
            LEVEL_K_FACTOR: 0.01 // (Antes 0.005) Más sensible a ganar a gente mejor
        },

        /**
         * Ajusta el nivel de todos los participantes de un partido al finalizarlo
         */
        async processMatchResults(match) {
            console.log(`⚖️ LevelAdjustmentService: Procesando partido ${match.id}`);

            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);

            // 0. Robust ID Extraction
            let teamA_ids = match.team_a_ids || [];
            let teamB_ids = match.team_b_ids || [];

            if (teamA_ids.length === 0 && match.player1) {
                // Fallback Legacy
                teamA_ids = [match.player1.id || match.player1, match.player2.id || match.player2].filter(x => x);
                teamB_ids = [match.player3.id || match.player3, match.player4.id || match.player4].filter(x => x);
            }

            if (teamA_ids.length === 0 && teamB_ids.length === 0) {
                console.warn("⚠️ No se encontraron IDs de jugadores para ajustar nivel.");
                return;
            }

            if (sA === sB) return; // Empates

            // 1. Obtener niveles actuales
            const allIds = [...teamA_ids, ...teamB_ids];
            const playersData = await this._getPlayersData(allIds);

            const getLvl = (id) => playersData[id]?.level || playersData[id]?.self_rate_level || 3.5;

            const avgLevelA = this._calculateAvg(teamA_ids.map(id => getLvl(id)));
            const avgLevelB = this._calculateAvg(teamB_ids.map(id => getLvl(id)));

            // 2. Calcular ajustes
            const diffGames = Math.abs(sA - sB);
            const wonA = sA > sB;

            const adjustA = this._calculateDelta(wonA, avgLevelA, avgLevelB, diffGames);
            const adjustB = this._calculateDelta(!wonA, avgLevelB, avgLevelA, diffGames);

            console.log(`📈 Deltas: A(${adjustA > 0 ? '+' : ''}${adjustA.toFixed(3)}) | B(${adjustB > 0 ? '+' : ''}${adjustB.toFixed(3)})`);

            // 3. Aplicar DB
            const batch = window.db.batch();
            const now = new Date().toISOString();

            // Store names for toast
            let namesA = [], namesB = [];

            for (const id of teamA_ids) {
                if (playersData[id]) namesA.push(playersData[id].name);
                await this._applyAdjustment(id, playersData[id], adjustA, now, batch, match.id);
            }
            for (const id of teamB_ids) {
                if (playersData[id]) namesB.push(playersData[id].name);
                await this._applyAdjustment(id, playersData[id], adjustB, now, batch, match.id);
            }

            await batch.commit();
            console.log("✅ Niveles actualizados.");

            // 4. Feedback Visual
            if (window.NotificationService) {
                const winnerNames = wonA ? namesA : namesB;
                const deltaWin = wonA ? adjustA : adjustB;
                window.NotificationService.showToast(`🏆 Niveles actualizados: Ganadores +${deltaWin.toFixed(3)}`, 'success');
            } else {
                // Fallback alert (console only to avoid annoying popups)
                // console.log(`Alert: Niveles actualizados`);
            }
        },

        _calculateDelta(isWinner, myAvg, oppAvg, diffGames) {
            const levelDiff = oppAvg - myAvg; // Positivo si el rival es mejor
            let delta = this.CONFIG.BASE_GAIN;

            // 1. Bonus por dificultad (Diferencial de ELO)
            delta += (levelDiff * this.CONFIG.LEVEL_K_FACTOR);

            // 2. Bonus por marcador (Cada juego de diferencia suma 0.0005 al ajuste)
            // Esto cumple con: "si ganas/pierdes por más juegos, que suba (la magnitud) algo más"
            delta += (Math.abs(diffGames || 0) * 0.0005);

            // 3. Asegurar límites (Rango solicitado: 0.05 - 0.10)
            delta = Math.max(this.CONFIG.MIN_ADJUST, Math.min(this.CONFIG.MAX_ADJUST, delta));

            // Si gana suma, si pierde resta (manteniendo sistema competitivo)
            return isWinner ? delta : -delta;
        },

        async _applyAdjustment(uid, currentData, delta, date, batch, matchId) {
            if (!uid || !currentData) return;

            const oldLevel = parseFloat(currentData.level || 3.5);
            const newLevel = parseFloat((oldLevel + delta).toFixed(2));

            const playerRef = window.db.collection('players').doc(uid);
            batch.update(playerRef, {
                level: newLevel,
                lastLevelUpdate: date
            });

            // Registrar en historial
            const historyRef = window.db.collection('level_history').doc();
            batch.set(historyRef, {
                userId: uid,
                oldLevel: oldLevel,
                level: newLevel,
                delta: parseFloat(delta.toFixed(3)),
                date: date,
                matchId: matchId,
                reason: 'match_result'
            });
        },

        async _getPlayersData(ids) {
            const data = {};
            const promises = ids.map(id => window.db.collection('players').doc(id).get());
            const snaps = await Promise.all(promises);
            snaps.forEach(snap => {
                if (snap.exists) data[snap.id] = snap.data();
            });
            return data;
        },

        _calculateAvg(levels) {
            if (levels.length === 0) return 3.5;
            return levels.reduce((a, b) => a + b, 0) / levels.length;
        },

        /**
         * Simulación retrospectiva para Alejandro
         */
        async simulateHistoryForUser(uid, startLevel, matchCount) {
            console.log("🧪 Simulando historial para:", uid);
            const batch = window.db.batch();
            let currentLvl = startLevel;
            const now = new Date();

            for (let i = 1; i <= matchCount; i++) {
                const date = new Date(now.getTime() - (matchCount - i) * 86400000).toISOString();
                const delta = (Math.random() * 0.05) + 0.05; // Simular tendencia al alza (ganancia constante en seed)
                const oldLvl = currentLvl;
                currentLvl = parseFloat((currentLvl + delta).toFixed(2));

                const historyRef = window.db.collection('level_history').doc();
                batch.set(historyRef, {
                    userId: uid,
                    oldLevel: oldLvl,
                    level: currentLvl,
                    delta: delta,
                    date: date,
                    reason: 'seed_init'
                });
            }

            // Actualizar nivel final
            batch.update(window.db.collection('players').doc(uid), { level: currentLvl });
            await batch.commit();
            console.log("✅ Historial simulado.");
        },

        /**
         * RECALCULAR TODOS LOS NIVELES (Mantenimiento)
         * Procesa todos los partidos finalizados desde el principio de los tiempos.
         */
        async recalculateAllLevels() {
            if (!confirm("⚠️ ¿RECALCULAR TODOS LOS NIVELES?\n\nEsto reseteará los niveles de todos los jugadores basándose en su historial de partidos y re-generará el historial de niveles.\n\n¿Continuar?")) return;

            console.log("🚀 Iniciando Recálculo Global de Niveles...");

            try {
                // 1. Obtener todos los jugadores
                const playersSnap = await window.db.collection('players').get();
                const players = {};
                playersSnap.forEach(doc => {
                    const data = doc.data();
                    players[doc.id] = {
                        ...data,
                        id: doc.id,
                        level: parseFloat(data.self_rate_level || 3.50)
                    };
                });

                // 2. Obtener TODOS los partidos finalizados
                const [matchesSnap, entrenoMatchesSnap] = await Promise.all([
                    window.db.collection('matches').where('status', '==', 'finished').get(),
                    window.db.collection('entrenos_matches').where('status', '==', 'finished').get()
                ]);

                const allMatches = [
                    ...matchesSnap.docs.map(d => ({ ...d.data(), id: d.id, _type: 'match' })),
                    ...entrenoMatchesSnap.docs.map(d => ({ ...d.data(), id: d.id, _type: 'entreno' }))
                ];

                const parseDate = (d) => {
                    if (!d) return 0;
                    if (d.toDate) return d.toDate().getTime();
                    return new Date(d).getTime();
                };

                // Orden cronológico estricto
                allMatches.sort((a, b) => parseDate(a.date || a.createdAt) - parseDate(b.date || b.createdAt));

                console.log(`📊 Procesando ${allMatches.length} partidos para ${playersSnap.size} jugadores...`);

                // 3. Limpiar historial previo (BATCH de 500)
                const histSnap = await window.db.collection('level_history').get();
                console.log(`🧹 Borrando ${histSnap.size} registros de historial...`);

                let deleteBatch = window.db.batch();
                let delCount = 0;
                for (const doc of histSnap.docs) {
                    deleteBatch.delete(doc.ref);
                    delCount++;
                    if (delCount >= 450) {
                        await deleteBatch.commit();
                        deleteBatch = window.db.batch();
                        delCount = 0;
                    }
                }
                if (delCount > 0) await deleteBatch.commit();

                // 4. Procesar y guardar Historial + Niveles
                let opBatch = window.db.batch();
                let opCount = 0;

                for (const match of allMatches) {
                    const sA = parseInt(match.score_a || 0);
                    const sB = parseInt(match.score_b || 0);
                    const teamA_ids = match.team_a_ids || [];
                    const teamB_ids = match.team_b_ids || [];

                    if (sA === sB) continue;

                    const avgLevelA = teamA_ids.reduce((sum, id) => sum + (players[id]?.level || 3.5), 0) / (teamA_ids.length || 1);
                    const avgLevelB = teamB_ids.reduce((sum, id) => sum + (players[id]?.level || 3.5), 0) / (teamB_ids.length || 1);

                    const wonA = sA > sB;
                    const diffGames = Math.abs(sA - sB);

                    // Calculamos el ajuste real usando el diferencial de juegos
                    const adjustA = this._calculateDelta(wonA, avgLevelA, avgLevelB, diffGames);
                    const adjustB = this._calculateDelta(!wonA, avgLevelB, avgLevelA, diffGames);

                    const dateStr = new Date(parseDate(match.date || match.createdAt)).toISOString();

                    const applyToPlayer = (id, delta) => {
                        if (!players[id]) return;
                        const oldLvl = players[id].level;
                        players[id].level = parseFloat((oldLvl + delta).toFixed(2));
                        players[id].lastUpdate = dateStr;

                        const hRef = window.db.collection('level_history').doc();
                        opBatch.set(hRef, {
                            userId: id,
                            oldLevel: oldLvl,
                            level: players[id].level,
                            delta: parseFloat(delta.toFixed(3)),
                            date: dateStr,
                            matchId: match.id,
                            reason: 'recalculation'
                        });
                        opCount++;
                    };

                    for (const id of teamA_ids) applyToPlayer(id, adjustA);
                    for (const id of teamB_ids) applyToPlayer(id, adjustB);

                    if (opCount >= 400) {
                        await opBatch.commit();
                        opBatch = window.db.batch();
                        opCount = 0;
                    }
                }

                // Finalmente guardar niveles finales en 'players'
                console.log("💾 Guardando niveles finales actualizados...");
                for (const id in players) {
                    const pRef = window.db.collection('players').doc(id);
                    opBatch.update(pRef, {
                        level: players[id].level,
                        lastLevelUpdate: players[id].lastUpdate || new Date().toISOString()
                    });
                    opCount++;
                    if (opCount >= 450) {
                        await opBatch.commit();
                        opBatch = window.db.batch();
                        opCount = 0;
                    }
                }
                if (opCount > 0) await opBatch.commit();

                alert("✅ Recálculo global completado con éxito.");
                location.reload();
            } catch (e) {
                console.error("Error crítico en recálculo:", e);
                alert("❌ Error: " + e.message);
            }
        }
    };

    window.LevelAdjustmentService = LevelAdjustmentService;
    console.log("⚖️ LevelAdjustmentService Cargado.");
})();

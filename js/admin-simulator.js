/**
 * 🎲 ADMIN SIMULATOR
 * Herramientas para simular Americanas con jugadores reales
 */

const AdminSimulator = {

    /**
     * Helper para seleccionar jugadores según categoría (Género)
     */
    async getPlayersByCategory(category, count) {
        const allPlayers = await FirebaseDB.players.getAll();

        // Asignar género si no existe para la simulación
        allPlayers.forEach(p => {
            if (!p.gender) p.gender = (Math.random() > 0.5 ? 'chico' : 'chica');
        });

        let selected = [];

        if (category === 'male') {
            const males = allPlayers.filter(p => p.gender === 'chico');
            if (males.length < count) throw new Error(`Faltan jugadores masculinos (${males.length}/${count})`);
            selected = males.sort(() => 0.5 - Math.random()).slice(0, count);
        }
        else if (category === 'female') {
            const females = allPlayers.filter(p => p.gender === 'chica');
            if (females.length < count) throw new Error(`Faltan jugadores femeninos (${females.length}/${count})`);
            selected = females.sort(() => 0.5 - Math.random()).slice(0, count);
        }
        else if (category === 'mixed') {
            const males = allPlayers.filter(p => p.gender === 'chico').sort(() => 0.5 - Math.random());
            const females = allPlayers.filter(p => p.gender === 'chica').sort(() => 0.5 - Math.random());

            const half = count / 2;
            if (males.length < half || females.length < half) {
                throw new Error(`Faltan jugadores para MIXTO (Necesitas ${half} de cada, tienes M:${males.length} F:${females.length})`);
            }

            // Mezclar para que en "Fijas" se emparejen M+F de forma natural si los pasamos alternos
            for (let i = 0; i < half; i++) {
                selected.push(males[i]);
                selected.push(females[i]);
            }
        }
        else {
            // OPEN
            const validPlayers = allPlayers.filter(p => p.gender === 'chico' || p.gender === 'chica');
            if (validPlayers.length < count) throw new Error(`Faltan jugadores para OPEN (${validPlayers.length}/${count})`);
            selected = validPlayers.sort(() => 0.5 - Math.random()).slice(0, count);
        }

        return selected;
    },

    /**
     * Ejecutar simulación vacía (sin resultados) - Preparar Americana
     */
    async runEmptyCycle(config = {}) {
        const status = document.getElementById('sim-status-empty');
        const courtSelect = document.getElementById('sim-courts-empty');
        const pairModeSelect = document.getElementById('sim-pair-mode-empty');
        const categorySelect = document.getElementById('sim-category-empty');
        const locationSelect = document.getElementById('sim-location-empty');

        const numCourts = parseInt(courtSelect?.value || 3);
        const pairMode = pairModeSelect?.value || 'rotating';
        const category = categorySelect?.value || 'open';
        const location = locationSelect?.value || 'Barcelona Pádel el Prat';
        const numPlayers = numCourts * 4;

        if (status) {
            status.style.display = 'block';
            let catName = category === 'open' ? 'LIBRE' : (category === 'male' ? 'MASCULINA' : (category === 'female' ? 'FEMENINA' : 'MIXTA'));
            status.innerHTML = `📝 <b>PREPARANDO AMERICANA (${catName} - ${pairMode === 'fixed' ? 'FIJA' : 'TWISTER'})</b><br>`;
            status.innerHTML += `> Sede: ${location}<br>`;
            status.innerHTML += `> Seleccionando ${numCourts} pistas / ${numPlayers} jugadores cualificados...<br>`;
        }

        try {
            // 1. Fetch Players by Category
            const selectedPlayers = await this.getPlayersByCategory(category, numPlayers);

            // 2. Create Americana
            const catName = category === 'open' ? 'LIBRE' : (category === 'male' ? 'MASCULINA' : (category === 'female' ? 'FEMENINA' : 'MIXTA'));
            const modeName = pairMode === 'fixed' ? 'FIJA' : 'TWISTER';

            const americanaData = {
                name: `AMERICANA ${catName} (${modeName}) - ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                date: new Date().toISOString().split('T')[0],
                time: String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
                status: 'in_progress',
                location: location,
                players: selectedPlayers.map((p, i) => ({
                    id: p.id,
                    uid: p.id,
                    name: p.name,
                    level: p.level || '3.5',
                    gender: p.gender,
                    current_court: Math.floor(i / 4) + 1
                })),
                registeredPlayers: selectedPlayers.map((p, i) => ({
                    id: p.id,
                    uid: p.id,
                    name: p.name,
                    level: p.level || '3.5',
                    gender: p.gender,
                    current_court: Math.floor(i / 4) + 1
                })),
                max_courts: numCourts,
                category: category,
                image_url: location === 'Barcelona Pádel el Prat'
                    ? (category === 'male' ? 'img/americana masculina.jpg' : (category === 'female' ? 'img/americana femeninas.jpg' : 'img/americana mixta.jpg'))
                    : (category === 'male' ? 'img/ball-masculina.png' : (category === 'female' ? 'img/ball-femenina.png' : 'img/ball-mixta.png')),
                pair_mode: pairMode,
                price_members: config.price_members || 12,
                price_external: config.price_external || 14,
                is_simulation: true
            };

            const newAmericana = await FirebaseDB.americanas.create(americanaData);
            const americanaId = newAmericana.id;

            if (status) status.innerHTML += `> Evento creado (${americanaId})<br>`;

            // 3. Generate Rounds
            const roundsToGenerate = 1;

            if (pairMode === 'fixed') {
                if (status) status.innerHTML += `> Creando parejas fijas...<br>`;
                const pairs = FixedPairsLogic.createFixedPairs(selectedPlayers, category);
                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: pairs });

                if (status) status.innerHTML += `> Generando Ronda 1 sistema Pozo...<br>`;
                for (let round = 1; round <= roundsToGenerate; round++) {
                    const matches = FixedPairsLogic.generatePozoRound(pairs, round, numCourts);
                    for (const m of matches) {
                        await FirebaseDB.matches.create({
                            ...m,
                            americana_id: americanaId,
                            status: 'scheduled',
                            score_a: 0,
                            score_b: 0
                        });
                    }
                    if (status) status.innerHTML += `> Ronda ${round} ✅ (El resto se generarán tras meter resultados)<br>`;
                }

            } else {
                let currentPlayers = americanaData.players;
                if (status) status.innerHTML += `> Generando Ronda 1 sistema Twister...<br>`;
                for (let round = 1; round <= roundsToGenerate; round++) {
                    let roundMatches = RotatingPozoLogic.generateRound(currentPlayers, round, numCourts, category);

                    for (const m of roundMatches) {
                        const matchData = { ...m, americana_id: americanaId, status: 'scheduled', score_a: 0, score_b: 0 };
                        await FirebaseDB.matches.create(matchData);
                    }
                    if (status) status.innerHTML += `> Ronda ${round} ✅ (El resto se generarán tras meter resultados)<br>`;
                }
            }

            if (status) status.innerHTML += '<br>🏁 <b>PREPARACIÓN COMPLETADA</b><br>';
            setTimeout(() => loadAdminView('matches'), 1500);

        } catch (e) {
            console.error(e);
            if (status) status.innerHTML += `<br>❌ Error: ${e.message}`;
        }
    },

    /**
     * Ejecutar simulación vacía para ENTRENOS
     */
    async runTrainingCycle(config = {}) {
        const status = document.getElementById('sim-training-status');
        const courtSelect = document.getElementById('sim-training-courts');
        const pairModeSelect = document.getElementById('sim-training-pair-mode');
        const categorySelect = document.getElementById('sim-training-category');
        const locationSelect = document.getElementById('sim-training-location');

        const numCourts = parseInt(courtSelect?.value || 3);
        const pairMode = pairModeSelect?.value || 'rotating';
        const category = categorySelect?.value || 'open';
        const location = locationSelect?.value || 'Barcelona Pádel el Prat';
        const numPlayers = numCourts * 4;

        if (status) {
            status.style.display = 'block';
            let catName = category === 'open' ? 'LIBRE' : (category === 'male' ? 'MASCULINA' : (category === 'female' ? 'FEMENINA' : 'MIXTA'));
            status.innerHTML = `📝 <b>PREPARANDO ENTRENO (${catName} - ${pairMode === 'fixed' ? 'FIJA' : 'TWISTER'})</b><br>`;
            status.innerHTML += `> Sede: ${location}<br>`;
            status.innerHTML += `> Seleccionando ${numCourts} pistas / ${numPlayers} jugadores cualificados...<br>`;
        }

        try {
            // 1. Fetch Players by Category
            const selectedPlayers = await this.getPlayersByCategory(category, numPlayers);

            // 2. Create Entreno
            const catName = category === 'open' ? 'LIBRE' : (category === 'male' ? 'MASCULINA' : (category === 'female' ? 'FEMENINA' : 'MIXTA'));

            // Determinar imagen por defecto (Same logic as admin.js sync)
            let imageUrl = 'img/ball-mixta.png';
            if (location === 'Barcelona Pádel el Prat') {
                if (category === 'male') imageUrl = 'img/entreno masculino prat.jpg';
                else if (category === 'female') imageUrl = 'img/entreno femenino prat.jpg';
                else if (category === 'mixed') imageUrl = 'img/entreno mixto prat.jpg';
                else imageUrl = 'img/entreno todo prat.jpg';
            } else if (location === 'Delfos Cornellá') {
                if (category === 'male') imageUrl = 'img/entreno masculino delfos.jpg';
                else if (category === 'female') imageUrl = 'img/entreno femenino delfos.jpg';
                else if (category === 'mixed') imageUrl = 'img/entreno mixto delfos.jpg';
                else imageUrl = 'img/entreno todo delfos.jpg';
            }

            const entrenoData = {
                name: `ENTRENO ${catName} (${pairMode === 'fixed' ? 'FIJA' : 'TWISTER'}) - ${new Date().toLocaleDateString()}`,
                date: new Date().toISOString().split('T')[0],
                time: String(new Date().getHours()).padStart(2, '0') + ':00',
                status: 'open',
                location: location,
                players: selectedPlayers.map((p, i) => ({
                    id: p.id,
                    uid: p.id,
                    name: p.name,
                    level: p.level || '3.5',
                    gender: p.gender,
                    current_court: Math.floor(i / 4) + 1
                })),
                max_courts: numCourts,
                category: category,
                image_url: imageUrl,
                pair_mode: pairMode,
                price_members: config.price_members || 20,
                price_external: config.price_external || 25,
                is_simulation: true
            };

            const newEntreno = await FirebaseDB.entrenos.create(entrenoData);
            const entrenoId = newEntreno.id;

            if (status) status.innerHTML += `> Evento creado (${entrenoId})<br>`;

            // 3. Generate Rounds (Solo R1 para Pozo/Twister)
            const roundsToGenerate = 1;

            if (pairMode === 'fixed') {
                if (status) status.innerHTML += `> Creando parejas fijas...<br>`;
                const pairs = FixedPairsLogic.createFixedPairs(selectedPlayers, category);
                await FirebaseDB.entrenos.update(entrenoId, { fixed_pairs: pairs });

                if (status) status.innerHTML += `> Generando Ronda 1 sistema Pozo...<br>`;
                for (let round = 1; round <= roundsToGenerate; round++) {
                    const matches = FixedPairsLogic.generatePozoRound(pairs, round, numCourts);
                    for (const m of matches) {
                        await FirebaseDB.entrenos_matches.create({
                            ...m,
                            americana_id: entrenoId,
                            status: 'scheduled',
                            score_a: 0,
                            score_b: 0
                        });
                    }
                    if (status) status.innerHTML += `> Ronda ${round} ✅<br>`;
                }

            } else {
                let currentPlayers = selectedPlayers.map((p, i) => ({
                    id: p.id,
                    uid: p.id,
                    name: p.name,
                    level: p.level || '3.5',
                    gender: p.gender,
                    current_court: Math.floor(i / 4) + 1
                }));

                if (status) status.innerHTML += `> Generando Ronda 1 sistema Twister...<br>`;
                for (let round = 1; round <= roundsToGenerate; round++) {
                    let roundMatches = RotatingPozoLogic.generateRound(currentPlayers, round, numCourts, category);

                    for (const m of roundMatches) {
                        const matchData = { ...m, americana_id: entrenoId, status: 'scheduled', score_a: 0, score_b: 0 };
                        await FirebaseDB.entrenos_matches.create(matchData);
                    }
                    if (status) status.innerHTML += `> Ronda ${round} ✅<br>`;
                }
            }

            if (status) status.innerHTML += '<br>🏁 <b>SIMULACIÓN COMPLETADA</b><br>';
            setTimeout(() => loadAdminView('entrenos_results'), 1500);

        } catch (e) {
            console.error(e);
            if (status) status.innerHTML += `<br>❌ Error: ${e.message}`;
        }
    },

    /**
     * Limpiar todos los datos generados por el simulador
     */
    async cleanupSimulatedData() {
        console.log("🧹 Iniciando limpieza de datos simulados...");
        let totalEvents = 0;
        let totalMatches = 0;

        try {
            // 1. Limpiar Americanas
            const americanas = await FirebaseDB.americanas.getAll();
            const simAmericanas = americanas.filter(a => a.is_simulation === true);

            for (const a of simAmericanas) {
                const matches = await FirebaseDB.matches.getByAmericana(a.id);
                for (const m of matches) {
                    await FirebaseDB.matches.delete(m.id);
                    totalMatches++;
                }
                await FirebaseDB.americanas.delete(a.id);
                totalEvents++;
                console.log(`- Borrada Americana: ${a.name}`);
            }

            // 2. Limpiar Entrenos
            const entrenos = await FirebaseDB.entrenos.getAll();
            const simEntrenos = entrenos.filter(e => e.is_simulation === true);

            for (const e of simEntrenos) {
                const matches = await FirebaseDB.entrenos_matches.getByAmericana(e.id);
                for (const m of matches) {
                    await FirebaseDB.entrenos_matches.delete(m.id);
                    totalMatches++;
                }
                await FirebaseDB.entrenos.delete(e.id);
                totalEvents++;
                console.log(`- Borrado Entreno: ${e.name}`);
            }

            console.log(`✅ Limpieza completada. Borrados ${totalEvents} eventos y ${totalMatches} partidos.`);
            alert(`✅ ¡Limpieza completada!\nSe han borrado ${totalEvents} eventos simulados y ${totalMatches} partidos.`);

            // Recargar vista si estamos en admin
            if (window.loadAdminView) window.loadAdminView('dashboard');

        } catch (error) {
            console.error("❌ Error en la limpieza:", error);
            alert("❌ Error al limpiar datos: " + error.message);
        }
    }
};

window.AdminSimulator = AdminSimulator;
console.log("🎲 AdminSimulator PRO (Categorías) cargado");

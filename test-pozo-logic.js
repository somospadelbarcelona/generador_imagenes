/**
 * 🧪 SCRIPT DE VALIDACIÓN: LÓGICA POZO UNIVERSAL
 * Este script simula diferentes escenarios de Americanas para validar 
 * que los ascensos y descensos funcionen correctamente.
 */

const fs = require('fs');
const path = require('path');

// Mocks para el entorno
global.window = {};
global.console.log = (...args) => console.log('LOG:', ...args);
global.console.warn = (...args) => console.warn('WARN:', ...args);

// Cargar la lógica (quitando el 'window.' para que Node no pete)
const fpContent = fs.readFileSync(path.join(__dirname, 'js/fixed-pairs-logic.js'), 'utf8').replace(/window\.FixedPairsLogic =/g, 'const FixedPairsLogic =');
const rpContent = fs.readFileSync(path.join(__dirname, 'js/rotating-pozo-logic.js'), 'utf8').replace(/window\.RotatingPozoLogic =/g, 'const RotatingPozoLogic =');

eval(fpContent + '; global.FixedPairsLogic = FixedPairsLogic;');
eval(rpContent + '; global.RotatingPozoLogic = RotatingPozoLogic;');

function runTests() {
    console.log('\n🚀 INICIANDO PRUEBAS DE LÓGICA POZO...');

    // --- TEST 1: PAREJAS FIJAS (MASCULINA) ---
    console.log('\n--- TEST 1: PAREJAS FIJAS (MASCULINA) ---');
    const fixedPairs = [
        { id: 'p1', name: 'Pareja 1', current_court: 1 },
        { id: 'p2', name: 'Pareja 2', current_court: 1 },
        { id: 'p3', name: 'Pareja 3', current_court: 2 },
        { id: 'p4', name: 'Pareja 4', current_court: 2 }
    ];
    const matchesFixed = [
        { round: 1, court: 1, team_a_id: 'p1', team_b_id: 'p2', score_a: 6, score_b: 0, status: 'finished' },
        { round: 1, court: 2, team_a_id: 'p3', team_b_id: 'p4', score_a: 6, score_b: 0, status: 'finished' }
    ];
    // Se supone que P1 (gana en P1) se queda en P1.
    // P2 (pierde en P1) baja a P2.
    // P3 (gana en P2) sube a P1.
    // P4 (pierde en P2) se queda en P2.

    const updatedFixed = FixedPairsLogic.updatePozoRankings([...fixedPairs], matchesFixed, 2);
    console.log('Resultaddo Fijo:', updatedFixed.map(p => `${p.name}: P${p.current_court}`).join(', '));

    // Verificación
    const p2_court = updatedFixed.find(p => p.id === 'p2').current_court;
    const p3_court = updatedFixed.find(p => p.id === 'p3').current_court;
    if (p2_court === 2 && p3_court === 1) console.log('✅ TEST 1 PASADO: P2 bajó y P3 subió.');
    else console.error('❌ TEST 1 FALLIDO');

    // --- TEST 2: TWISTER (INDIVIDUAL) MASCULINA ---
    console.log('\n--- TEST 2: TWISTER (INDIVIDUAL) MASCULINA ---');
    const playersIndiv = [
        { id: 'u1', name: 'J1', gender: 'chico', current_court: 1 },
        { id: 'u2', name: 'J2', gender: 'chico', current_court: 1 },
        { id: 'u3', name: 'J3', gender: 'chico', current_court: 1 },
        { id: 'u4', name: 'J4', gender: 'chico', current_court: 1 },
        { id: 'u5', name: 'J5', gender: 'chico', current_court: 2 },
        { id: 'u6', name: 'J6', gender: 'chico', current_court: 2 },
        { id: 'u7', name: 'J7', gender: 'chico', current_court: 2 },
        { id: 'u8', name: 'J8', gender: 'chico', current_court: 2 }
    ];
    const matchesIndiv = [
        { round: 1, court: 1, team_a_ids: ['u1', 'u2'], team_b_ids: ['u3', 'u4'], score_a: 6, score_b: 0, status: 'finished' },
        { round: 1, court: 2, team_a_ids: ['u5', 'u6'], team_b_ids: ['u7', 'u8'], score_a: 6, score_b: 0, status: 'finished' }
    ];
    // U1, U2 (ganan en P1) -> P1
    // U3, U4 (pierden en P1) -> P2
    // U5, U6 (ganan en P2) -> P1
    // U7, U8 (pierden en P2) -> P2

    const updatedIndiv = RotatingPozoLogic.updatePlayerCourts([...playersIndiv], matchesIndiv, 2, 'male');
    console.log('Resultado Twister:', updatedIndiv.map(p => `${p.name}: P${p.current_court}`).join(', '));

    const winnersP2_inP1 = updatedIndiv.filter(p => (p.id === 'u5' || p.id === 'u6') && p.current_court === 1).length === 2;
    const losersP1_inP2 = updatedIndiv.filter(p => (p.id === 'u3' || p.id === 'u4') && p.current_court === 2).length === 2;
    if (winnersP2_inP1 && losersP1_inP2) console.log('✅ TEST 2 PASADO: Subida y bajada individual correcta.');
    else console.error('❌ TEST 2 FALLIDO');

    // --- TEST 3: TWISTER (INDIVIDUAL) MIXTA CON BALANCEO ---
    console.log('\n--- TEST 3: TWISTER (INDIVIDUAL) MIXTA CON BALANCEO ---');
    const playersMixed = [
        { id: 'm1', name: 'H1', gender: 'chico', current_court: 1 },
        { id: 'm2', name: 'H2', gender: 'chico', current_court: 1 },
        { id: 'f1', name: 'M1', gender: 'chica', current_court: 1 },
        { id: 'f2', name: 'M2', gender: 'chica', current_court: 1 },
        { id: 'm3', name: 'H3', gender: 'chico', current_court: 2 },
        { id: 'm4', name: 'H4', gender: 'chico', current_court: 2 },
        { id: 'f3', name: 'M3', gender: 'chica', current_court: 2 },
        { id: 'f4', name: 'M4', gender: 'chica', current_court: 2 }
    ];
    const matchesMixed = [
        { round: 1, court: 1, team_a_ids: ['m1', 'f1'], team_b_ids: ['m2', 'f2'], score_a: 6, score_b: 0, status: 'finished' },
        { round: 1, court: 2, team_a_ids: ['m3', 'f3'], team_b_ids: ['m4', 'f4'], score_a: 6, score_b: 0, status: 'finished' }
    ];
    // H1 (gana P1) -> P1
    // M1 (gana P1) -> P1
    // H2 (pierde P1) -> P2
    // M2 (pierde P1) -> P2
    // H3 (gana P2) -> P1
    // M3 (gana P2) -> P1
    // H4 (pierde P2) -> P2
    // M4 (pierde P2) -> P2
    // RESULTADO P1: H1, H3, M1, M3 (2H + 2M) ✅

    const updatedMixed = RotatingPozoLogic.updatePlayerCourts([...playersMixed], matchesMixed, 2, 'mixed');
    console.log('Resultado Mix:', updatedMixed.map(p => `${p.name}: P${p.current_court}`).join(', '));

    for (let c = 1; c <= 2; c++) {
        const pInCourt = updatedMixed.filter(p => p.current_court === c);
        const males = pInCourt.filter(p => p.gender === 'chico').length;
        const females = pInCourt.filter(p => p.gender === 'chica').length;
        console.log(`Pista ${c}: ${males}H + ${females}M`);
        if (males !== 2 || females !== 2) {
            console.error(`❌ TEST 3 FALLIDO: Desbalanceo en Pista ${c}`);
            return;
        }
    }
    console.log('✅ TEST 3 PASADO: Balanceo de género mantenido perfectamente.');
}

runTests();

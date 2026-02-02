# 🎾 SISTEMA DE PAREJAS FIJAS - AMERICANA POZO

## 📋 Problema Actual

El sistema actual (`americana-logic.js`) está diseñado para el **formato Mexicano/Americana tradicional**:
- Las parejas cambian en cada ronda
- El algoritmo evita repetir parejas
- Los jugadores rotan entre diferentes compañeros

**Lo que el usuario quiere:**
- **Parejas fijas** desde el inicio
- Las parejas suben y bajan juntas según resultados (sistema "Pozo")
- Los mismos 2 jugadores permanecen juntos durante todo el torneo

## 🎯 Solución Propuesta

### Opción 1: Modificar el Simulador Actual
Cambiar `runEmptyCycle()` para:
1. Crear parejas fijas al inicio (emparejar jugadores de 2 en 2)
2. Guardar las parejas en la base de datos
3. Generar rondas manteniendo las parejas fijas
4. Implementar lógica "Pozo": ganadores suben, perdedores bajan

### Opción 2: Crear Nuevo Modo "Parejas Fijas"
Añadir un nuevo simulador específico:
- `runFixedPairsCycle()` - Genera americana con parejas fijas
- Las parejas se asignan aleatoriamente al inicio
- Sistema de pistas: Pista 1 (mejores), Pista N (peores)
- Después de cada ronda:
  - Ganadores de pista N → suben a pista N-1
  - Perdedores de pista 1 → bajan a pista 2
  - etc.

## 🔧 Implementación Recomendada

```javascript
// Crear parejas fijas al inicio
function createFixedPairs(players) {
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const pairs = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            pairs.push({
                id: `pair_${i/2}`,
                player1: shuffled[i],
                player2: shuffled[i + 1],
                name: `${shuffled[i].name} / ${shuffled[i + 1].name}`,
                wins: 0,
                games: 0,
                court: Math.floor(i / 4) + 1 // Asignar pista inicial
            });
        }
    }
    
    return pairs;
}

// Generar ronda con parejas fijas (sistema Pozo)
function generatePozoRound(pairs, roundNumber) {
    // Ordenar parejas por pista actual
    const sortedPairs = [...pairs].sort((a, b) => a.court - b.court);
    
    const matches = [];
    
    // Emparejar: pista 1 vs pista 1, pista 2 vs pista 2, etc.
    for (let i = 0; i < sortedPairs.length; i += 2) {
        if (i + 1 < sortedPairs.length) {
            matches.push({
                round: roundNumber,
                court: sortedPairs[i].court,
                pair_a: sortedPairs[i],
                pair_b: sortedPairs[i + 1],
                team_a_ids: [sortedPairs[i].player1.id, sortedPairs[i].player2.id],
                team_b_ids: [sortedPairs[i + 1].player1.id, sortedPairs[i + 1].player2.id],
                team_a_names: sortedPairs[i].name,
                team_b_names: sortedPairs[i + 1].name,
                status: 'scheduled',
                score_a: 0,
                score_b: 0
            });
        }
    }
    
    return matches;
}

// Actualizar pistas después de resultados (Pozo logic)
function updatePozoRankings(pairs, lastRoundMatches) {
    lastRoundMatches.forEach(match => {
        if (match.status === 'finished') {
            const pairA = pairs.find(p => p.id === match.pair_a.id);
            const pairB = pairs.find(p => p.id === match.pair_b.id);
            
            if (match.score_a > match.score_b) {
                // Pareja A gana - sube de pista
                if (pairA.court > 1) pairA.court--;
                // Pareja B pierde - baja de pista
                if (pairB.court < maxCourts) pairB.court++;
            } else if (match.score_b > match.score_a) {
                // Pareja B gana
                if (pairB.court > 1) pairB.court--;
                // Pareja A pierde
                if (pairA.court < maxCourts) pairA.court++;
            }
            
            // Actualizar estadísticas
            pairA.games += match.score_a;
            pairB.games += match.score_b;
            if (match.score_a > match.score_b) pairA.wins++;
            else if (match.score_b > match.score_a) pairB.wins++;
        }
    });
    
    return pairs;
}
```

## ✅ Próximos Pasos

1. **Confirmar con el usuario** qué opción prefiere
2. Implementar el sistema de parejas fijas
3. Modificar la clasificación para mostrar parejas en lugar de equipos variables
4. Añadir indicadores visuales de "subida/bajada" de pista

## 📝 Notas Importantes

- El sistema actual de clasificación muestra equipos variables porque las parejas cambian
- Para parejas fijas, necesitamos:
  - Almacenar las parejas en la base de datos
  - Mostrar la clasificación por parejas (no por equipos de cada partido)
  - Indicar en qué pista está cada pareja
  - Mostrar tendencia (↑ subiendo, ↓ bajando, = manteniendo)

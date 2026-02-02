/**
 * SmartAlertsService.js
 * "La Batseñal" 🦇 - Sistema de búsqueda inteligente de sustitutos.
 * Evita el spam masivo filtrando candidatos por nivel, género y hábitos.
 */
class SmartAlertsService {
    constructor() {
        this.candidates = [];
    }

    /**
     * Encuentra candidatos ideales para un evento específico.
     * @param {Object} event - El objeto del evento (Americana/Entreno).
     * @returns {Promise<Array>} - Lista de usuarios candidatos.
     */
    async findSubstitutes(event) {
        console.log(`🦇 [Batseñal] Buscando sustitutos para: ${event.name} (${event.level || 'N/A'})`);

        // 1. Obtener todos los usuarios (Simulado por ahora, idealmente llamada a DB)
        // En producción: await window.db.collection('users').get();
        const allUsers = await this._getAllUsersMock();

        // 2. Definir Criterios
        const targetLevel = parseFloat(event.level) || 3.5;
        const levelRange = 1.25; // [TUNING] restored to 1.25
        // Ahora pasamos también event.name para que detecte "ENTRENO MASCULINO"
        const targetGender = this._normalizeGenderCategory(event.category, event.name);

        // Debug: Store count for UI
        this.lastFetchCount = allUsers.length;
        if (allUsers.length > 0) {
            console.log("🦇 [DEBUG] First User Sample:", allUsers[0]);
        } else {
            console.warn("🦇 [DEBUG] No users found in DB/Store!");
        }

        // 3. Filtrar
        const candidates = allUsers.filter(user => {
            const debugPrefix = `🦇 [Filter User: ${user.name}]`;

            // A. Filtro de ID
            const isRegistered = (event.players || []).some(p => p.id === user.uid || p.uid === user.uid);
            if (isRegistered) return false;

            // B. Filtro de Nivel (Flexible)
            let userLevel = parseFloat(user.level);
            if (!userLevel || isNaN(userLevel)) userLevel = 3.0; // Default

            const diff = Math.abs(userLevel - targetLevel);
            // Relax: allow up to range
            if (diff > levelRange) return false;

            // C. Filtro de Categoría / Género (REGLAS ESTRICTAS USUARIO)
            // 1. Entrenos/Americanas MASCULINOS: Solo chicos.
            // 2. Entrenos/Americanas FEMENINOS: Solo chicas.
            // 3. Entrenos/Americanas MIXTOS: Chicos o Chicas QUE ESTÉN EN EQUIPOS MIXTOS.

            const userTeams = Array.isArray(user.teams) ? user.teams : (user.teams ? [user.teams] : []);

            // Normalize User Gender (DB uses mixed terms)
            const g = (user.gender || '').toLowerCase();
            const isMale = g === 'male' || g === 'm' || g === 'hombre' || g === 'chico';
            const isFemale = g === 'female' || g === 'f' || g === 'mujer' || g === 'chica';

            if (targetGender === 'male') {
                // SOLO CHICOS
                if (!isMale) return false;

            } else if (targetGender === 'female') {
                // SOLO CHICAS
                if (!isFemale) return false;

            } else if (targetGender === 'mixed') {
                // MIXTO: Chicos o Chicas PERO que tengan equipo MIXTO
                // "Solo chicos o chicas que esten en los equipos mixtos"

                const hasMixedTeam = userTeams.some(t => {
                    const tName = String(t).toLowerCase();
                    return tName.includes('mixto') || tName.includes('mixed');
                });

                if (!hasMixedTeam) {
                    // Si no está en un equipo mixto, no puede jugar mixto (regla estricta)
                    return false;
                }
                // Si tiene equipo mixto, pasa (sea chico o chica)
            }

            return true;
        });

        console.log(`🦇 [Batseñal] Encontrados ${candidates.length} candidatos aptos.`);
        return candidates; // Retornamos lista limpia
    }

    /**
     * Envía la alerta a los candidatos seleccionados.
     */
    async sendBatSignal(candidates, event) {
        if (!candidates || candidates.length === 0) return { success: false, count: 0 };

        console.log(`🦇 [Batseñal] Enviando señal a ${candidates.length} usuarios...`);

        // Usamos el NotificationService existente
        if (window.NotificationService) {
            const promises = candidates.map(user => {
                return window.NotificationService.sendNotificationToUser(
                    user.uid,
                    "🦇 ¡PLAZA LIBRE!",
                    `Hay un hueco en ${event.name} que encaja con tu nivel. ¡Aprovecha!`,
                    { url: 'live', eventId: event.id }
                );
            });

            await Promise.all(promises);
            return { success: true, count: candidates.length };
        } else {
            console.warn("⚠️ NotificationService no disponible.");
            return { success: false, error: "No NotificationService" };
        }
    }

    // --- HELPERS ---

    // --- HELPERS ---

    _normalizeGenderCategory(cat, eventName = '') {
        // Combinar string para búsqueda robusta
        const fullText = (String(cat) + " " + String(eventName)).toLowerCase();

        // Prioridad 1: Detección explícita de Masculino
        if (fullText.includes('masculino') || fullText.includes('chicos') || fullText.includes('hombres') || fullText.includes('male')) {
            return 'male';
        }

        // Prioridad 2: Detección explícita de Femenino
        if (fullText.includes('femenino') || fullText.includes('chicas') || fullText.includes('mujeres') || fullText.includes('female')) {
            return 'female';
        }

        // Prioridad 3: Detección explícita de Mixto
        if (fullText.includes('mixto') || fullText.includes('mixed')) {
            return 'mixed';
        }

        // Fallback: Si no dice nada, asumimos mixto (o podrías cambiar a 'male' si es lo común)
        return 'mixed';
    }

    _normalizeGenderUser(g) {
        if (!g) return 'male'; // Default risky, better 'male' than undefined
        const gen = String(g).toLowerCase();
        if (gen === 'm' || gen === 'hombre' || gen === 'chico' || gen === 'masculino' || gen === 'male') return 'male';
        return 'female';
    }

    async _getAllUsersMock() {
        // [REAL IMPLEMENTATION] Fetching from Firestore
        try {
            // Check if we have users in Store first (Performance)
            if (window.Store) {
                const storedUsers = window.Store.getState('users');
                if (storedUsers && Object.keys(storedUsers).length > 0) {
                    console.log("🦇 [Batseñal] Using cached users from Store");
                    return Object.values(storedUsers);
                }
            }

            // Fallback to Firestore
            console.log("🦇 [Batseñal] Fetching users from Firestore (players collection)...");
            const snapshot = await window.db.collection('players').get();
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    name: data.displayName || data.name || 'Jugador',
                    level: parseFloat(data.level) || 0,
                    gender: data.gender || 'mixed',
                    teams: data.team_somospadel || [], // Catch array or null
                    fcm_token: data.fcm_token
                };
            });
        } catch (e) {
            console.error("Error fetching users for Batseñal:", e);
            return [];
        }
    }
    /**
     * Opens the Batseñal UI (Modal) for a specific event.
     * @param {Object} event 
     */
    async openUI(event) {
        // Remove existing if any
        const existing = document.getElementById('batsignal-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'batsignal-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(5px); animation: fadeIn 0.3s;
        `;

        modal.innerHTML = `
            <div style="
                background: #1a1c23; width: 90%; max-width: 500px; 
                border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 30px; position: relative;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            ">
                <div style="text-align:center; margin-bottom:20px;">
                     <i class="fas fa-bullhorn" style="font-size: 3rem; color: #FFD700; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));"></i>
                     <h2 style="color:white; margin:0; font-size:1.5rem; font-weight:900;">LA BATSEÑAL</h2>
                     <p style="color:#aaa; font-size:0.9rem;">Buscando sustitutos para <b>${event.name}</b>...</p>
                </div>
                <div id="batsignal-results" style="min-height: 100px; display:flex; justify-content:center; align-items:center;">
                    <div class="loader"></div>
                </div>
                <button onclick="document.getElementById('batsignal-modal').remove()" 
                    style="position:absolute; top:15px; right:15px; background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Trigger Search
        try {
            const candidates = await this.findSubstitutes(event);
            const resultsContainer = document.getElementById('batsignal-results');

            if (candidates.length === 0) {
                resultsContainer.innerHTML = `
                    <div style="text-align:center; color:#FF5555;">
                        <i class="fas fa-times-circle" style="font-size:2rem; margin-bottom:10px;"></i>
                        <p>No se encontraron candidatos.</p>
                        <p style="font-size:0.75rem; color:#888;">
                            Analizados: <b>${this.lastFetchCount || 0}</b> usuarios.<br>
                            Filtro Nivel: +/- 10.0 (Desactivado)<br>
                            Si sale 0 analizados, es fallo de conexión a DB.
                        </p>
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <div style="width:100%;">
                        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; margin-bottom:20px;">
                            <p style="margin:0; color:#CCFF00; font-weight:800; font-size:0.9rem; text-align:center;">
                                🎯 ¡${candidates.length} CANDIDATOS ENCONTRADOS!
                            </p>
                            <p style="margin:5px 0 0 0; color:#aaa; font-size:0.75rem; text-align:center;">
                                Nivel ${parseFloat(event.level || 3.5) - 0.5} - ${parseFloat(event.level || 3.5) + 0.5} | ${event.category || 'Mixto'}
                            </p>
                        </div>

                        <div style="max-height:150px; overflow-y:auto; margin-bottom:20px; font-size:0.8rem; color:#ddd; padding:0 10px;">
                            ${candidates.slice(0, 50).map(u => {
                    const rel = window.LevelReliabilityService ? window.LevelReliabilityService.getReliability(u) : null;
                    return `
                                <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        ${rel ? `<i class="fas ${rel.icon}" style="color: ${rel.color} !important; font-size: 0.7rem;" title="${rel.label}"></i>` : ''}
                                        <span>${u.name}</span>
                                    </div>
                                    <span style="font-weight:bold; color:var(--primary);">${u.level}</span>
                                </div>
                            `;
                }).join('')}
                        </div>

                        <button id="btn-send-signal" class="btn-primary-pro" style="width:100%; justify-content:center; background:#FFD700; color:black; border:none;">
                            <i class="fas fa-paper-plane"></i> ENVIAR ALERTAS AHORA
                        </button>
                    </div>
                `;

                const service = this;
                document.getElementById('btn-send-signal').onclick = async function () {
                    const btn = this;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVIANDO...';
                    btn.disabled = true;

                    await service.sendBatSignal(candidates, event);

                    btn.innerHTML = '<i class="fas fa-check"></i> ¡ENVIADO!';
                    setTimeout(() => {
                        document.getElementById('batsignal-modal').remove();
                        alert(`✅ Alerta enviada a ${candidates.length} jugadores.`);
                    }, 1000);
                };
            }
        } catch (e) {
            console.error(e);
            document.getElementById('batsignal-results').innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
        }
    }
}

// Global Export
window.SmartAlertsService = new SmartAlertsService();

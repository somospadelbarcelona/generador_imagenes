/**
 * AutopilotView.js
 * "Americanas Autopilot" - Intelligent Event Generator
 * Benchmarked from Xporty functionality.
 */
class AutopilotView {
    constructor() {
        this.container = document.getElementById('content-area');
    }

    render() {
        this.container.innerHTML = `
            <div class="glass-card-enterprise fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h2 style="color:var(--brand-neon); margin:0;">Americanas Auto 🤖</h2>
                    </div>
                    <div style="background:rgba(204,255,0,0.1); color:var(--brand-neon); padding:5px 10px; border-radius:10px; font-weight:800; font-size:0.75rem; border:1px solid rgba(204,255,0,0.2);">
                        BETA v1.0
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                    <!-- CONFIGURATION PANEL -->
                    <div style="background:rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:1px solid rgba(255,255,255,0.05);">
                        <h3 style="color:#fff; font-size:1rem; margin-bottom:15px; text-transform:uppercase;">1. Configurar Torneo</h3>
                        
                        <!-- Bloque 1: Datos Básicos -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div class="form-group">
                                <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">📅 DÍA DE LA AMERICANA</label>
                                <input type="date" id="auto-date" class="pro-input" style="width:100%; box-sizing:border-box;">
                            </div>
                            <div class="form-group">
                                <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">💶 PRECIO (€)</label>
                                <input type="number" id="auto-price" class="pro-input" placeholder="0.00" step="0.5" style="width:100%; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div class="form-group">
                                <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">🕒 HORA INICIO</label>
                                <input type="time" id="auto-start-time" class="pro-input" style="width:100%; box-sizing:border-box;">
                            </div>
                            <div class="form-group">
                                <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">🏁 HORA FIN</label>
                                <input type="time" id="auto-end-time" class="pro-input" style="width:100%; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div class="form-group">
                                <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">📍 SEDE</label>
                                <select id="auto-location" class="pro-input" style="width:100%; box-sizing:border-box;">
                                    <option value="prat">Barcelona Pádel el Prat</option>
                                    <option value="delfos">Delfos Cornellá</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">🎾 CATEGORÍA</label>
                                <select id="auto-category" class="pro-input" style="width:100%; box-sizing:border-box;">
                                    <option value="mixta">Mixta</option>
                                    <option value="masculina">Masculina</option>
                                    <option value="femenina">Femenina</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">🔄 FORMATO DE PAREJAS</label>
                            <select id="auto-format" class="pro-input" style="width:100%; box-sizing:border-box;">
                                <option value="fixed">🔒 Pareja Fija (Fijo toda la americana)</option>
                                <option value="twister">🌪️ Twister (Cambio de pareja cada set)</option>
                            </select>
                        </div>

                        <div style="height:1px; background:rgba(255,255,255,0.1); margin: 20px 0;"></div>

                        <!-- Bloque 2: Logística -->
                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">👥 Nº JUGADORES</label>
                            <input type="number" id="auto-players" class="pro-input" value="16" min="4" max="64" style="width:100%; box-sizing:border-box;">
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">Nº PISTAS DISPONIBLES</label>
                            <input type="number" id="auto-courts" class="pro-input" value="4" min="1" max="16" style="width:100%; box-sizing:border-box;">
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">MODO DE JUEGO</label>
                            <select id="auto-mode" class="pro-input" style="width:100%; box-sizing:border-box;">
                                <option value="pozo">Pozo (Sube/Baja Pista)</option>
                                <option value="round_robin">Todos contra Todos (Grupos)</option>
                                <option value="fanatic">Fanatic (Aleatorio)</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom:20px;">
                            <label style="color:#fff; font-size:0.75rem; font-weight:800; display:block; margin-bottom:5px;">TIEMPO POR PARTIDO</label>
                            <select id="auto-time" class="pro-input" style="width:100%; box-sizing:border-box;">
                                <option value="12">12 Minutos (Express)</option>
                                <option value="15" selected>15 Minutos (Estándar)</option>
                                <option value="20">20 Minutos (Largo)</option>
                            </select>
                        </div>

                        <button class="btn-primary-pro" onclick="window.AutopilotView.generateMatches()" style="width:100%; text-align:center;">
                            <i class="fas fa-magic"></i> GENERAR CRUCES
                        </button>
                    </div>

                    <!-- PREVIEW PANEL -->
                    <div style="background:rgba(0,0,0,0.2); padding:20px; border-radius:15px; border:1px dashed rgba(255,255,255,0.1); position:relative; min-height:500px;">
                        <div id="autopilot-preview">
                            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; color:#555;">
                                <i class="fas fa-robot" style="font-size:3rem; margin-bottom:10px; opacity:0.3;"></i>
                                <p style="font-size:0.8rem; font-weight:700;">Configura y pulsa Generar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateMatches() {
        const playersCount = parseInt(document.getElementById('auto-players').value);
        const courtsCount = parseInt(document.getElementById('auto-courts').value);
        const mode = document.getElementById('auto-mode').value;
        const timeVal = document.getElementById('auto-time').value;

        // Inputs
        const date = document.getElementById('auto-date').value || 'Fecha Pendiente';
        const startTime = document.getElementById('auto-start-time').value || '00:00';
        const endTime = document.getElementById('auto-end-time').value || '23:59';
        const price = document.getElementById('auto-price').value || '0';

        const selectLoc = document.getElementById('auto-location');
        const location = selectLoc ? selectLoc.options[selectLoc.selectedIndex].text : 'Sede';
        const category = document.getElementById('auto-category').value;
        const format = document.getElementById('auto-format').value;

        // Simulation Logic (To be replaced with real algorithm in Phase 2)
        let html = `
            <div style="animation: slideInUp 0.3s ease-out; height: 100%; display: flex; flex-direction: column;">
                <h3 style="color:#fff; margin-top:0;">Vista Previa: ${category.toUpperCase()} / ${format.toUpperCase()}</h3>
                
                <!-- Summary Chips -->
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:15px;">
                    <div style="background:#22c55e; color:#000; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:800;">${playersCount} JUGADORES</div>
                     <div style="background:rgba(255,255,255,0.1); color:#fff; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:900;"><i class="fas fa-clock"></i> ${startTime} - ${endTime}</div>
                    <div style="background:rgba(255,255,255,0.1); color:#ddd; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:800;"><i class="fas fa-map-marker-alt"></i> ${location}</div>
                    <div style="background:rgba(255,255,255,0.1); color:#ffd700; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:800;">${price}€</div>
                </div>
                
                <div style="flex:1; overflow-y:auto; padding-right:5px; margin-bottom: 15px;">
        `;

        // Dummy Round Generation for UI Demo
        for (let i = 1; i <= 3; i++) {
            html += `
                <div style="background:rgba(255,255,255,0.05); padding:10px; margin-bottom:10px; border-radius:8px;">
                    <div style="font-size:0.75rem; font-weight:800; color:var(--brand-neon); margin-bottom:5px;">RONDA ${i} (${((i - 1) * parseInt(timeVal))}:00 - ${(i * parseInt(timeVal))}:00)</div>
                    <table style="width:100%; border-collapse:collapse; font-size:0.7rem; color:#ddd;">
                        ${Array.from({ length: courtsCount }).map((_, idx) => `
                            <tr>
                                <td style="padding:4px; color:#aaa;">Pista ${idx + 1}</td>
                                <td style="padding:4px;">Pareja A vs Pareja B</td>
                                <td style="padding:4px; text-align:right; color:#fff;">_ - _</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
        }

        html += `
                </div>
                <button id="btn-confirm-autopilot" class="btn-primary-pro" onclick="window.AutopilotView.createEvent()" 
                    style="width:100%; padding: 15px; background: #CCFF00; color: black; font-weight: 900; letter-spacing: 1px; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 0 20px rgba(204,255,0,0.4); text-transform: uppercase;">
                    <i class="fas fa-check"></i> CONFIRMAR Y CREAR EVENTO
                </button>
            </div>
        `;

        document.getElementById('autopilot-preview').innerHTML = html;
    }

    async createEvent() {
        if (!confirm("¿Seguro que quieres crear este evento en la Base de Datos?")) return;

        const btn = document.getElementById('btn-confirm-autopilot');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CREANDO...';
        btn.disabled = true;

        try {
            // 1. Gather Data
            const playersCount = parseInt(document.getElementById('auto-players').value);
            const courtsCount = parseInt(document.getElementById('auto-courts').value);
            const mode = document.getElementById('auto-mode').value;
            const timeVal = document.getElementById('auto-time').value;
            const date = document.getElementById('auto-date').value;
            const startTime = document.getElementById('auto-start-time').value;
            const endTime = document.getElementById('auto-end-time').value;
            const price = parseFloat(document.getElementById('auto-price').value || 0);

            const selectLoc = document.getElementById('auto-location');
            const location = selectLoc ? selectLoc.options[selectLoc.selectedIndex].text : 'Sede';
            const category = document.getElementById('auto-category').value;
            const format = document.getElementById('auto-format').value;

            if (!date) throw new Error("Debes seleccionar una FECHA.");

            // 2. Construct Object
            const eventName = `Americana ${category.charAt(0).toUpperCase() + category.slice(1)} (${format === 'fixed' ? 'Fija' : 'Twister'})`;

            const eventData = {
                name: eventName,
                date: date,
                time: startTime,
                time_end: endTime,
                location: location,
                category: category,
                price_members: price, // Simplifying for MVP
                price_external: price + 2,
                max_courts: courtsCount,
                max_players: playersCount,
                format: format, // 'fixed' or 'twister'
                play_mode: mode, // 'pozo', 'round_robin'
                time_per_match: parseInt(timeVal),
                status: 'open', // Open for registration
                created_via: 'autopilot',
                description: `Americana organizada con Autopilot. Formato ${mode}.`,
                waitlist: [],
                registeredPlayers: [],
                players: []
            };

            // 3. Call Service
            if (!window.AmericanaService) throw new Error("AmericanaService no disponible. Recarga la página.");

            const result = await window.AmericanaService.createAmericana(eventData);

            if (result && result.id) {
                // Success
                btn.innerHTML = '<i class="fas fa-check-circle"></i> ¡CREADO!';
                btn.style.background = '#22c55e'; // Success Green

                setTimeout(() => {
                    alert(`✅ Evento "${eventName}" creado correctamente.\nAhora te llevamos al gestor.`);
                    if (window.loadAdminView) window.loadAdminView('americanas_mgmt');
                }, 1000);
            } else {
                throw new Error("Error desconocido al crear evento.");
            }

        } catch (error) {
            console.error(error);
            alert("❌ Error: " + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// Attach to window
window.AutopilotView = new AutopilotView();

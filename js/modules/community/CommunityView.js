/**
 * CommunityView.js
 * Renderiza el Feed de Partidas Abiertas (Estilo Playtomic Premium)
 */
(function () {
    class CommunityView {
        constructor() {
            this.clubsBaixLlobregat = [
                "Barcelona Padel El Prat",
                "Aurial Padel Cornellà",
                "Padelarium (Gavà)",
                "Club Tennis Andrés Gimeno (Castelldefels)",
                "Padel 7 Sant Joan Despí",
                "Més Padel (Sant Vicenç dels Horts)",
                "Slam Padel (Collbató)",
                "CT Molins de Rei",
                "Can Busqué",
                "Indoor Padel 7 (Sant Andreu de la Barca)",
                "Padel Sant Boi",
                "Tennis Despí"
            ];
        }

        render(matches) {
            const container = document.getElementById('content-area');
            const user = window.Store.getState('currentUser');
            if (!container) return;

            // --- PREMIUM LIGHT THEME CSS ---
            const style = `
                <style>
                    .iso-light-theme {
                        background: #F2F4F8; /* Light Premium Grey */
                        min-height: 100vh;
                        font-family: 'Outfit', sans-serif;
                        color: #1e293b;
                        padding-bottom: 100px;
                    }
                    .pt-card {
                        background: white;
                        border-radius: 20px;
                        padding: 0;
                        margin-bottom: 16px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                        border: 1px solid rgba(0,0,0,0.03);
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        overflow: hidden;
                    }
                    .pt-card:active {
                        transform: scale(0.99);
                    }
                    .pt-header {
                        padding: 16px 20px;
                        border-bottom: 1px solid #f0f0f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .pt-time {
                        font-size: 1.2rem;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .pt-loc {
                        font-size: 0.85rem;
                        color: #64748b;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .pt-body {
                        padding: 16px 20px;
                    }
                    .pt-tags {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 16px;
                    }
                    .pt-tag {
                        background: #f1f5f9;
                        padding: 4px 10px;
                        border-radius: 8px;
                        font-size: 0.7rem;
                        font-weight: 700;
                        color: #475569;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    .pt-slots-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                        margin-bottom: 16px;
                    }
                    .pt-slot {
                        aspect-ratio: 1;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        transition: all 0.2s;
                    }
                    .pt-slot.empty {
                        border: 2px dashed #cbd5e1;
                        background: #f8fafc;
                        cursor: pointer;
                    }
                    .pt-slot.empty:hover {
                        border-color: #CCFF00;
                        background: rgba(204, 255, 0, 0.1);
                    }
                    .pt-slot.occupied {
                        border: 2px solid #22c55e;
                        background: #dcfce7;
                        overflow: hidden;
                    }
                    .pt-slot.occupied img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .pt-slot-initial {
                        font-weight: 800;
                        font-size: 0.9rem;
                        color: #166534;
                    }
                    .pt-action-bar {
                        padding: 0 20px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .pt-organizer {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.75rem;
                        color: #64748b;
                    }
                    .pt-btn-join {
                        background: #111;
                        color: #CCFF00;
                        border: none;
                        padding: 10px 24px;
                        border-radius: 30px;
                        font-weight: 800;
                        font-size: 0.8rem;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        cursor: pointer;
                    }
                    .pt-btn-join:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .pt-btn-edit {
                        background: #f1f5f9;
                        color: #334155;
                        border: 1px solid #cbd5e1;
                        padding: 8px 16px;
                        border-radius: 30px;
                        font-weight: 700;
                        font-size: 0.75rem;
                        cursor: pointer;
                        margin-right: 5px;
                    }
                     .pt-btn-invite {
                        background: transparent;
                        color: #3b82f6;
                        border: 1px solid #3b82f6;
                        padding: 8px 16px;
                        border-radius: 30px;
                        font-weight: 700;
                        font-size: 0.75rem;
                        cursor: pointer;
                        margin-right: 5px;
                    }
                    .pt-btn-leave {
                        background: #fecaca;
                        color: #b91c1c;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 30px;
                        font-weight: 700;
                        font-size: 0.75rem;
                        cursor: pointer;
                    }
                    
                    /* Create Modal - Selectors */
                    .selector-group {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .selector-item {
                        flex: 1;
                        background: rgba(255,255,255,0.05); /* Pro Input style matches existing */
                        border: 1px solid rgba(255,255,255,0.1);
                        padding: 15px; /* Bigger touch area */
                        border-radius: 12px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .selector-item.selected {
                        background: rgba(204,255,0,0.1);
                        border-color: #CCFF00;
                        color: #CCFF00;
                    }
                    .selector-item i {
                        font-size: 1.5rem;
                        margin-bottom: 8px;
                        display: block;
                    }
                    .selector-item span {
                        font-size: 0.7rem;
                        font-weight: 800;
                        text-transform: uppercase;
                    }
                    datalist {
                        background-color: #1e1e1e;
                        color: white;
                    }
                </style>
            `;

            // RENDER STRUCTURE
            let html = `
                ${style}
                <div class="iso-light-theme fade-in">
                    
                    <!-- Top Bar -->
                    <div style="background: white; padding: 15px 20px; position: sticky; top: 0; z-index: 20; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-weight: 950; font-size: 1.3rem; letter-spacing: -0.5px;">Partidas abiertas</h2>
                            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 500;">Comunidad Somospadel BCN</p>
                        </div>
                        <div style="width: 35px; height: 35px; background: #f1f5f9; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #1e293b;">
                            <i class="fas fa-sliders-h"></i>
                        </div>
                    </div>

                    <div id="matches-list" style="padding: 20px;">
                        ${matches.length === 0 ? `
                            <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                                <div style="background: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                                    <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1;"></i>
                                </div>
                                <h3 style="color: #1e293b; margin: 0 0 5px; font-weight: 800;">No hay partidos activos</h3>
                                <p style="font-size: 0.9rem;">Sé el primero en crear uno y jugar.</p>
                            </div>
                        ` : ''}
                        
                        ${matches.map(match => this.renderMatchCard(match, user)).join('')}
                        
                        <div style="text-align: center; margin-top: 30px; opacity: 0.4;">
                            <img src="img/logo_somospadel.png" style="width: 80px; filter: grayscale(1);">
                        </div>
                    </div>

                    <!-- FAB: Create Match -->
                    <button onclick="window.CommunityView.openCreateModal()" 
                        style="position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); width: auto; height: 50px; border-radius: 25px; background: #111; color: #CCFF00; border: none; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px; padding: 0 25px; font-size: 0.9rem; font-weight: 800; z-index: 100; cursor: pointer;">
                        <i class="fas fa-plus"></i> CREAR PARTIDA
                    </button>
                </div>

                <!-- MODAL CREATE -->
                <div id="create-match-modal" class="modal hidden" style="z-index: 9999;">
                    <div class="modal-content" style="background: #1e1e1e; border: 1px solid #333; max-width: 90%; border-radius: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="color: white; margin: 0; font-weight: 900; letter-spacing: -0.5px;">NUEVA PARTIDA</h3>
                            <button onclick="document.getElementById('create-match-modal').classList.add('hidden')" style="background:none; border:none; color:white; font-size: 1.2rem;"><i class="fas fa-times"></i></button>
                        </div>
                        <form id="create-match-form" onsubmit="window.CommunityView.handleFormSubmit(event)">
                            
                            <!-- Location with Datalist -->
                            <datalist id="clubs-baix-llobregat">
                                ${this.clubsBaixLlobregat.map(c => `<option value="${c}">`).join('')}
                            </datalist>

                            <div class="form-group" style="margin-bottom: 20px;">
                                <label style="display: block; color:white; margin-bottom: 8px; font-weight: 700;">CLUB / UBICACIÓN</label>
                                <div style="position: relative;">
                                    <i class="fas fa-map-marker-alt" style="position: absolute; left: 15px; top: 14px; color: #888;"></i>
                                    <input type="text" name="location" class="pro-input" list="clubs-baix-llobregat" value="Barcelona Padel El Prat" placeholder="Selecciona o escribe club..." style="padding-left: 45px !important;" required>
                                </div>
                            </div>

                            <!-- Selector: Indoor/Outdoor -->
                            <div class="selector-group">
                                <div class="selector-item selected" onclick="window.CommunityView.selectOption(this, 'courtTypeInput', 'Indoor')">
                                    <i class="fas fa-warehouse"></i>
                                    <span>INDOOR</span>
                                </div>
                                <div class="selector-item" onclick="window.CommunityView.selectOption(this, 'courtTypeInput', 'Outdoor')">
                                    <i class="fas fa-sun"></i>
                                    <span>OUTDOOR</span>
                                </div>
                                <input type="hidden" name="courtType" id="courtTypeInput" value="Indoor">
                            </div>

                            <!-- Date & Time -->
                            <div style="margin-bottom: 10px; font-size: 0.7rem; color: #CCFF00; font-weight:700;"><i class="fas fa-info-circle"></i> Horario recomendado: Sáb/Dom 16h-20h (2h)</div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                                <div class="form-group">
                                    <label class="micro-label">FECHA</label>
                                    <input type="date" name="date" class="pro-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="micro-label">HORA</label>
                                    <input type="time" name="time" class="pro-input" value="18:00" required>
                                </div>
                            </div>

                             <!-- Price -->
                             <div class="form-group" style="margin-bottom: 15px;">
                                <label class="micro-label">PRECIO POR PERSONA (€)</label>
                                <input type="number" step="0.5" name="price" class="pro-input" placeholder="Ej: 10" value="10">
                            </div>

                            <!-- Level Range -->
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label class="micro-label">NIVEL APROXIMADO</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="number" step="0.1" name="level_min" class="pro-input" placeholder="Min" value="3.0">
                                    <span style="align-self: center; color: #666;">-</span>
                                    <input type="number" step="0.1" name="level_max" class="pro-input" placeholder="Max" value="4.0">
                                </div>
                            </div>

                            <button type="submit" class="btn-primary-pro" id="btn-publish" style="width: 100%; margin-top: 10px; padding: 15px;">
                                PUBLICAR PARTIDO
                            </button>
                        </form>
                    </div>
                </div>

                <!-- MODAL EDIT -->
                <div id="edit-match-modal" class="modal hidden" style="z-index: 10000;">
                    <div class="modal-content" style="background: #1e1e1e; border: 1px solid #333; max-width: 90%; border-radius: 24px;">
                        <input type="hidden" id="edit-match-id">
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="color: white; margin: 0; font-weight: 900; letter-spacing: -0.5px;">EDITAR PARTIDA</h3>
                            <button onclick="document.getElementById('edit-match-modal').classList.add('hidden')" style="background:none; border:none; color:white; font-size: 1.2rem;"><i class="fas fa-times"></i></button>
                        </div>
                         <form id="edit-match-form" onsubmit="window.CommunityView.handleEditSubmit(event)">
                             <div class="form-group" style="margin-bottom: 20px;">
                                <label style="display: block; color:white; margin-bottom: 8px; font-weight: 700;">CLUB / UBICACIÓN</label>
                                <input type="text" id="edit-location" name="location" class="pro-input" list="clubs-baix-llobregat" required>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                                <div class="form-group">
                                    <label class="micro-label">FECHA</label>
                                    <input type="date" id="edit-date" name="date" class="pro-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="micro-label">HORA</label>
                                    <input type="time" id="edit-time" name="time" class="pro-input" required>
                                </div>
                            </div>

                             <div class="form-group" style="margin-bottom: 15px;">
                                <label class="micro-label">PRECIO (€)</label>
                                <input type="number" step="0.5" id="edit-price" name="price" class="pro-input" value="10">
                            </div>

                            <button type="submit" class="btn-primary-pro" id="btn-save-edit" style="width: 100%; margin-top: 10px; padding: 15px;">
                                GUARDAR CAMBIOS
                            </button>
                         </form>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        selectOption(el, inputId, value) {
            // Visual toggle
            const parent = el.parentNode;
            parent.querySelectorAll('.selector-item').forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');
            // Form value
            document.getElementById(inputId).value = value;
        }

        renderMatchCard(match, currentUser) {
            const isMe = match.organizerId === (currentUser ? currentUser.uid : '');
            const slots = match.slots || [];
            const amIJoined = slots.some(s => s.userId === (currentUser ? currentUser.uid : ''));
            const openSlots = slots.filter(s => s.status === 'open').length;

            window.inviteToMatch = (id) => {
                const link = `https://appsomospadel.com/join/${id}`;
                if (navigator.share) {
                    navigator.share({ title: 'Únete a mi partido', text: `Juega conmigo en ${match.location}`, url: link });
                } else {
                    prompt("Copia este enlace para invitar:", link);
                }
            };

            return `
                <div class="pt-card">
                    <!-- HEADER -->
                    <div class="pt-header">
                        <div>
                            <div class="pt-time">${match.time}</div>
                            <div class="pt-loc"><i class="fas fa-map-marker-alt" style="color:#ef4444;"></i> ${match.location}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 800; font-size: 1.1rem; color: #1e293b;">${match.price > 0 ? match.price + '€' : 'FREE'}</div>
                            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">POR PERSONA</div>
                        </div>
                    </div>

                    <!-- BODY -->
                    <div class="pt-body">
                        <div class="pt-tags">
                            <div class="pt-tag"><i class="fas fa-signal"></i> ${match.level}</div>
                            <div class="pt-tag"><i class="fas fa-${match.courtType === 'Indoor' ? 'warehouse' : 'sun'}"></i> ${match.courtType}</div>
                            ${match.isOfficial ? `<div class="pt-tag" style="background: gold; color: black;"><i class="fas fa-check-circle"></i> OFICIAL</div>` : ''}
                        </div>

                        <!-- SLOTS GRID WITH AVATARS -->
                        <div class="pt-slots-grid">
                            ${slots.map((slot, index) => {
                if (slot.status === 'occupied') {
                    return `
                                        <div class="pt-slot occupied" title="${slot.userName}">
                                            ${slot.avatar
                            ? `<img src="${slot.avatar}">`
                            : `<span class="pt-slot-initial">${slot.userName[0]}</span>`
                        }
                                        </div>
                                    `;
                } else {
                    return `
                                        <div class="pt-slot empty" onclick="window.CommunityView.handleJoinClick(this, '${match.id}', ${index})">
                                            <i class="fas fa-plus" style="color: #cbd5e1;"></i>
                                        </div>
                                    `;
                }
            }).join('')}
                        </div>
                    </div>

                    <!-- FOOTER ACTIONS -->
                    <div class="pt-action-bar">
                        <div class="pt-organizer">
                            <div style="width: 24px; height: 24px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #475569;">
                                ${match.organizerName ? match.organizerName[0] : '?'}
                            </div>
                            <span>${match.organizerName ? match.organizerName.split(' ')[0] : 'Anonimo'}</span>
                        </div>

                        <div>
                            <button class="pt-btn-invite" onclick="window.inviteToMatch('${match.id}')"><i class="fas fa-share-alt"></i></button>
                            ${isMe ? `<button class="pt-btn-edit" onclick='window.CommunityView.openEditModal(${JSON.stringify(match).replace(/'/g, "&#39;")})'>EDITAR</button>` : ''}
                            ${amIJoined
                    ? `<button class="pt-btn-leave" onclick="window.CommunityController.leaveSlot('${match.id}')">SALIR</button>`
                    : (openSlots > 0
                        ? `<button class="pt-btn-join" onclick="window.CommunityController.joinSlot('${match.id}', ${slots.findIndex(s => s.status === 'open')})">APUNTARME</button>`
                        : `<span style="font-weight:800; color:#ef4444; font-size: 0.8rem;">COMPLETO</span>`
                    )
                }
                        </div>
                    </div>
                </div>
            `;
        }

        renderLoading() {
            const container = document.getElementById('content-area');
            if (container) container.innerHTML = `<div style="text-align: center; padding-top: 100px; color: #CCFF00;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>Cargando...</div>`;
        }

        renderError(msg) {
            const container = document.getElementById('content-area');
            if (container) container.innerHTML = `<div style="text-align: center; padding-top: 100px; color: #ef4444;"><i class="fas fa-exclamation-triangle"></i><br>${msg}</div>`;
        }

        openCreateModal() {
            document.getElementById('create-match-modal').classList.remove('hidden');
        }

        openEditModal(match) {
            document.getElementById('edit-match-id').value = match.id;
            document.getElementById('edit-location').value = match.location;
            document.getElementById('edit-date').value = match.date;
            document.getElementById('edit-time').value = match.time;
            document.getElementById('edit-price').value = match.price || 10;
            document.getElementById('edit-match-modal').classList.remove('hidden');
        }

        handleFormSubmit(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-publish');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CREANDO...';
            btn.disabled = true;

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Construct Combined Level string
            data.level = `${data.level_min}-${data.level_max}`;
            data.organizerPlays = true; // Default true for user created matches

            window.CommunityController.createMatch(data).then(res => {
                btn.innerHTML = 'PUBLICAR PARTIDO';
                btn.disabled = false;

                if (res.success) {
                    document.getElementById('create-match-modal').classList.add('hidden');
                    e.target.reset();
                } else {
                    alert('Error: ' + res.error);
                }
            });
        }

        handleEditSubmit(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-save-edit');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';
            btn.disabled = true;

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const id = document.getElementById('edit-match-id').value;

            window.CommunityController.updateMatch(id, data).then(res => {
                btn.innerHTML = 'GUARDAR CAMBIOS';
                btn.disabled = false;
                if (res.success) {
                    document.getElementById('edit-match-modal').classList.add('hidden');
                } else {
                    alert('Error: ' + res.error);
                }
            });
        }

        // Debounce helper for the + slot button
        handleJoinClick(el, matchId, slotIndex) {
            if (el.classList.contains('loading')) return;
            el.classList.add('loading');
            el.innerHTML = '<i class="fas fa-spinner fa-spin" style="color: #64748b;"></i>';
            window.CommunityController.joinSlot(matchId, slotIndex);
        }
    }

    window.CommunityView = new CommunityView();
})();

/**
 * admin-community.js
 * Gestión de Partidas Abiertas (Comunidad) desde el Panel Admin
 */

window.AdminCommunity = {
    matches: [],

    async init() {
        console.log("Admin Community Init");
        this.renderShell();
        this.listenForMatches();
    },

    renderShell() {
        document.getElementById('content-area').innerHTML = `
            <div class="glass-card-enterprise slide-in-top">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h3 class="gradient-text" style="font-size: 1.5rem; letter-spacing: 1px;">
                            <i class="fas fa-handshake"></i> PARTIDAS COMUNIDAD
                        </h3>
                        <p style="color: #888; font-size: 0.8rem; margin-top: 5px;">Muro de partidos externos</p>
                    </div>
                    <button class="btn-primary-pro" onclick="window.AdminCommunity.openCreateModal()">
                        <i class="fas fa-plus-circle"></i> NUEVA PARTIDA
                    </button>
                </div>

                <div class="table-container">
                    <table class="pro-table">
                        <thead>
                            <tr>
                                <th>FECHA</th>
                                <th>UBICACIÓN</th>
                                <th>NIVEL</th>
                                <th>ORGANIZADOR</th>
                                <th>ESTADO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody id="community-matches-body">
                            <tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Create Match Admin Modal -->
            <div id="admin-create-match-modal" class="modal-overlay hidden">
                <div class="modal-content" style="max-width: 600px; border: 1px solid #333;">
                    <div class="modal-header">
                        <h2>CREAR PARTIDA (ADMIN)</h2>
                        <button class="close-modal-btn" onclick="document.getElementById('admin-create-match-modal').classList.add('hidden')">&times;</button>
                    </div>
                    <form id="admin-create-match-form" onsubmit="window.AdminCommunity.handleCreateSubmit(event)" class="pro-form">
                        
                        <div style="background: rgba(255,165,0,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px dashed rgba(255,165,0,0.3);">
                            <label style="color: #FFA500; font-size: 0.75rem;"><i class="fas fa-crown"></i> PARTIDA DESTACADA (OFICIAL)</label>
                            <p style="font-size: 0.7rem; color: #888; margin-top: 5px;">Esta partida aparecerá creada por "SomosPadel Oficial"</p>
                        </div>
                        
                        <div class="form-group">
                            <label>UBICACIÓN</label>
                            <input type="text" name="location" class="pro-input" placeholder="Ej: Padel El Prat" required>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>FECHA</label>
                                <input type="date" name="date" class="pro-input" required>
                            </div>
                            <div class="form-group">
                                <label>HORA</label>
                                <input type="time" name="time" class="pro-input" required>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>NIVEL</label>
                                <input type="text" name="level" class="pro-input" placeholder="Ej: 3.5 - 4.0" required>
                            </div>
                            <div class="form-group">
                                <label>PRECIO (€)</label>
                                <input type="number" name="price" class="pro-input" placeholder="0">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>ENLACE (PLAYTOMIC / WEB)</label>
                            <input type="url" name="externalLink" class="pro-input" placeholder="https://...">
                        </div>

                        <div class="form-group">
                            <label>DESCRIPCIÓN / NOTAS</label>
                            <input type="text" name="description" class="pro-input" placeholder="Ej: Faltan 2 chicas...">
                        </div>

                        <div class="form-group">
                             <label>TIPO DE PISTA</label>
                             <select name="courtType" class="pro-input">
                                 <option value="Indoor">Indoor</option>
                                 <option value="Outdoor">Outdoor</option>
                             </select>
                        </div>
                        
                        <div class="form-group" style="flex-direction: row; align-items: center; gap: 10px; margin-top: 10px;">
                            <input type="checkbox" name="reserveAdminSlot" id="resAdminSlot" style="width: 20px;">
                            <label for="resAdminSlot" style="margin:0;">Reservar 1 plaza como Admin</label>
                        </div>

                        <button type="submit" class="btn-primary-pro" style="width: 100%; margin-top: 1.5rem;">PUBLICAR AHORA</button>
                    </form>
                </div>
            </div>
        `;
    },

    listenForMatches() {
        db.collection('open_matches')
            .orderBy('date', 'desc') // Admin ve todo, incluso pasado reciente
            .limit(50)
            .onSnapshot(snapshot => {
                this.matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.renderTable();
            });
    },

    renderTable() {
        const tbody = document.getElementById('community-matches-body');
        if (!tbody) return;

        if (this.matches.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #666;">No hay partidas activas</td></tr>`;
            return;
        }

        tbody.innerHTML = this.matches.map(m => {
            const occupied = (m.slots || []).filter(s => s.status === 'occupied').length;
            const statusColor = occupied === 4 ? '#ef4444' : '#22c55e';
            const statusText = occupied === 4 ? 'COMPLETA' : `${4 - occupied} LIBRES`;

            return `
                <tr>
                    <td><span style="font-weight: 700; color: #fff;">${m.date}</span><br><span style="font-size:0.75rem; color:#888;">${m.time}</span></td>
                    <td>${m.location}</td>
                    <td><span class="badge-level">${m.level}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:24px; height:24px; border-radius:50%; background:#333; display:flex; align-items:center; justify-content:center; font-size:0.6rem;">${m.organizerName ? m.organizerName[0] : '?'}</div>
                            ${m.organizerName}
                        </div>
                    </td>
                    <td><span style="color: ${statusColor}; font-weight:800; font-size:0.75rem;">${statusText}</span></td>
                    <td>
                        <button class="btn-micro" style="background: rgba(239,68,68,0.2); color: #ef4444;" onclick="window.AdminCommunity.deleteMatch('${m.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openCreateModal() {
        document.getElementById('admin-create-match-modal').classList.remove('hidden');
    },

    async handleCreateSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const slots = [];
            // Si admin reserva plaza
            if (formData.get('reserveAdminSlot') === 'on') {
                const adminName = document.getElementById('admin-name').innerText || 'Admin';
                slots.push({ status: 'occupied', userId: 'admin', userName: adminName + ' (Staff)', avatar: null });
            } else {
                slots.push({ status: 'open', userId: null, userName: null });
            }
            while (slots.length < 4) slots.push({ status: 'open', userId: null, userName: null });

            await db.collection('open_matches').add({
                organizerId: 'admin_official',
                organizerName: 'SomosPadel OFICIAL ⭐',
                location: data.location,
                date: data.date,
                time: data.time,
                level: data.level,
                price: data.price || '0',
                courtType: data.courtType,
                externalLink: data.externalLink || '',
                description: data.description || '',
                slots: slots,
                createdAt: new Date().toISOString(),
                isOfficial: true // Flag para destacar en UI
            });

            document.getElementById('admin-create-match-modal').classList.add('hidden');
            e.target.reset();
            alert("Partida oficial creada correctamente 🎾");
        } catch (error) {
            console.error("Error creating match:", error);
            alert("Error: " + error.message);
        }
    },

    async deleteMatch(id) {
        if (confirm("¿Seguro que quieres borrar esta partida del muro?")) {
            await db.collection('open_matches').doc(id).delete();
        }
    }
};

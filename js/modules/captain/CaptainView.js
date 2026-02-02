/**
 * CaptainView.js
 * The premium UI interface for Capitán SomosPadel.
 * Version: Pro 2026 - Ultra Optimized & Aesthetic
 */
(function () {
    class CaptainView {
        constructor() {
            this.modalId = 'captain-modal-root';
            this.isScanning = false;
            this.injectStyles();
        }

        injectStyles() {
            if (document.getElementById('captain-styles')) return;
            const style = document.createElement('style');
            style.id = 'captain-styles';
            style.innerHTML = `
                @keyframes captain-pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(204, 255, 0, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(204, 255, 0, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(204, 255, 0, 0); }
                }
                @keyframes scan-line {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(400%); }
                }
                .captain-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(3, 7, 18, 0.85); z-index: 99999;
                    backdrop-filter: blur(16px);
                    display: flex; align-items: center; justify-content: center;
                    opacity: 0; pointer-events: none; transition: all 0.4s ease;
                }
                .captain-overlay.open { opacity: 1; pointer-events: all; }
                
                .captain-card {
                    width: 92%; max-width: 440px;
                    background: #0f172a;
                    border-radius: 28px;
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    overflow: hidden; display: flex; flex-direction: column; 
                    max-height: 85vh; transform: translateY(20px); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .captain-overlay.open .captain-card { transform: translateY(0); }

                .captain-header { 
                    padding: 24px; 
                    background: linear-gradient(180deg, rgba(204,255,0,0.08) 0%, rgba(15,23,42,0) 100%); 
                    display: flex; flex-direction: column; align-items: center; gap: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                
                .captain-avatar-container {
                    position: relative; width: 64px; height: 64px;
                }
                .captain-avatar { 
                    width: 100%; height: 100%; background: #CCFF00; border-radius: 20px; 
                    display: flex; align-items: center; justify-content: center; font-size: 2rem; 
                    color: #000; animation: captain-pulse 2s infinite; position: relative; z-index: 2;
                }
                .avatar-status {
                    position: absolute; bottom: -4px; right: -4px; width: 14px; height: 14px;
                    background: #10b981; border: 2px solid #0f172a; border-radius: 50%; z-index: 3;
                }

                .captain-body { padding: 20px; overflow-y: auto; flex: 1; scrollbar-width: none; }
                .captain-body::-webkit-scrollbar { display: none; }

                .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
                .stat-box { 
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); 
                    border-radius: 18px; padding: 16px; transition: transform 0.2s;
                }
                .stat-box:active { transform: scale(0.95); }
                .stat-value { font-size: 1.5rem; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 4px; }
                .stat-label { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

                .insight-card { 
                    margin-bottom: 12px; background: rgba(255,255,255,0.04); 
                    border-left: 3px solid #CCFF00; border-radius: 12px; padding: 16px; 
                    display: flex; gap: 16px; align-items: flex-start;
                    animation: slide-in 0.4s ease-out backwards;
                }
                @keyframes slide-in { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

                .captain-footer { padding: 20px; background: rgba(15,23,42,0.8); backdrop-filter: blur(10px); }
                .btn-primary { 
                    width: 100%; padding: 16px; background: #CCFF00; color: #000; border: none; 
                    border-radius: 16px; font-weight: 900; font-size: 1rem; cursor: pointer; 
                    text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;
                    box-shadow: 0 4px 20px rgba(204,255,0,0.2);
                }
                .btn-primary:hover { background: #ddff33; transform: translateY(-2px); box-shadow: 0 6px 25px rgba(204,255,0,0.3); }

                .history-item {
                    background: rgba(255,255,255,0.02); border-radius: 14px; padding: 12px 16px; 
                    margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
                    border: 1px solid transparent; transition: all 0.2s;
                }
                .history-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(204,255,0,0.3); }
                
                /* Scanner effect */
                .scanner-overlay {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(204, 255, 0, 0.05); pointer-events: none;
                    overflow: hidden; z-index: 10; border-radius: inherit;
                }
                .scanner-line {
                    width: 100%; height: 2px; background: #CCFF00;
                    box-shadow: 0 0 15px 2px #CCFF00;
                    animation: scan-line 2s linear infinite;
                }
            `;
            document.head.appendChild(style);
        }

        async open(eventDoc = null) {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) {
                Swal.fire({ icon: 'error', title: 'Oops...', text: 'Debes iniciar sesión para ver al Capitán.', background: '#1e293b', color: '#fff', confirmButtonColor: '#CCFF00' });
                return;
            }
            this.createModalDOM();
            this.toggle(true);

            if (eventDoc) {
                await this.analyzeEvent(user, eventDoc);
            } else {
                await this.renderDashboard(user);
            }
        }

        async analyzeEvent(user, eventDoc) {
            const body = document.getElementById('captain-body-content');
            body.innerHTML = this.renderLoader('Analizando tu victoria...');

            try {
                const coll = eventDoc.isEntreno ? 'entrenos_matches' : 'matches';
                const field = 'americana_id';
                const mSnap = await window.db.collection(coll).where(field, '==', eventDoc.id).get();
                const matches = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                const insights = window.CaptainService.analyze(user, matches, eventDoc);
                await window.CaptainService.saveAnalysis(user.uid, eventDoc, insights);
                this.renderReport(insights, eventDoc);
            } catch (e) {
                body.innerHTML = `<div class="insight-card" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.05);"><div><p style="color: #ef4444; font-weight: 900;">ERROR DE ANÁLISIS</p><p style="font-size: 0.8rem; color: #94a3b8;">${e.message}</p></div></div>`;
            }
        }

        async renderDashboard(user) {
            const body = document.getElementById('captain-body-content');
            body.innerHTML = this.renderLoader('Consultando archivos históricos...');

            const reports = await window.CaptainService.getAnalysisHistory(user.uid, 20);

            if (reports.length === 0) {
                this.renderEmptyState(user);
                return;
            }

            const stats = this.calculateGlobalStats(reports);

            body.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-box">
                        <div class="stat-value" style="color: #CCFF00;">${stats.winRate}%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${stats.totalMatches}</div>
                        <div class="stat-label">Partidos</div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.02); border-radius: 20px; padding: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Evolución Reciente</h4>
                    </div>
                    <div style="display: flex; align-items: flex-end; gap: 6px; height: 60px;">
                        ${stats.evolution.map(v => `<div style="flex: 1; height: ${Math.max(10, v)}%; background: ${v >= 50 ? '#CCFF00' : '#475569'}; border-radius: 4px; opacity: 0.8; transition: height 0.3s;"></div>`).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Misiones Completadas</h4>
                        <span onclick="window.CaptainView.generateHistoryFromPastEvents()" style="color: #CCFF00; font-size: 0.65rem; font-weight: 900; cursor: pointer; opacity: 0.7;">ACTUALIZAR ⟳</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${reports.map(r => `
                            <div class="history-item" onclick="window.CaptainView.viewReport('${r.id}')">
                                <div>
                                    <div style="font-weight: 950; color: #fff; font-size: 0.85rem;">${r.eventName}</div>
                                    <div style="font-size: 0.65rem; color: #64748b;">${r.eventDate}</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 0.7rem; font-weight: 900; color: #CCFF00;">VER</span>
                                    <i class="fas fa-chevron-right" style="font-size: 0.6rem; color: rgba(255,255,255,0.2);"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderEmptyState(user) {
            const body = document.getElementById('captain-body-content');
            body.innerHTML = `
                <div style="text-align:center; padding: 40px 20px;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: #1e293b; margin-bottom: 20px;"></i>
                    <h3 style="color: #fff; font-weight: 950; margin-bottom: 8px;">EXPEDIENTE VACÍO</h3>
                    <p style="color: #64748b; font-size: 0.85rem; line-height: 1.6; margin-bottom: 30px;">No he encontrado informes en mis archivos. ¿Quieres que escanee la base de datos en busca de tus partidos?</p>
                    <button onclick="window.CaptainView.generateHistoryFromPastEvents()" class="btn-primary">
                        RESCATAR PARTIDOS 🚀
                    </button>
                </div>
            `;
        }

        async generateHistoryFromPastEvents() {
            const user = window.Store.getState('currentUser');
            const body = document.getElementById('captain-body-content');

            // UI de escaneo
            body.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; position: relative;">
                    <div class="scanner-overlay"><div class="scanner-line"></div></div>
                    <i class="fas fa-satellite-dish" style="font-size: 3rem; color: #CCFF00; margin-bottom: 24px;"></i>
                    <h3 style="color: #fff; font-weight: 950; letter-spacing: 1px;">INICIANDO RESCATE</h3>
                    <div id="scan-progress-box" style="margin-top: 20px;">
                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                            <div id="scan-bar" style="width: 0%; height: 100%; background: #CCFF00; transition: width 0.3s;"></div>
                        </div>
                        <p id="scan-status" style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 800;">Conectando con el satélite...</p>
                    </div>
                </div>
            `;

            try {
                // 1. Limpieza rápida
                const statusEl = document.getElementById('scan-status');
                const barEl = document.getElementById('scan-bar');

                statusEl.innerText = "Limpiando archivos corruptos...";
                const oldReports = await window.db.collection('players').doc(user.uid).collection('captain_reports').get();
                if (!oldReports.empty) {
                    const batch = window.db.batch();
                    oldReports.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }

                barEl.style.width = "20%";
                statusEl.innerText = "Localizando eventos 2026...";

                const [eSnap, aSnap] = await Promise.all([
                    window.db.collection('entrenos').orderBy('date', 'desc').limit(50).get(),
                    window.db.collection('americanas').orderBy('date', 'desc').limit(50).get()
                ]);

                const events = [...eSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'entreno' })), ...aSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'americana' }))];
                events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

                barEl.style.width = "40%";
                statusEl.innerText = `Analizando ${events.length} convocatorias...`;

                const searchTerms = [user.uid];
                if (user.name) {
                    const cleanName = user.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    searchTerms.push(cleanName);
                    cleanName.split(' ').forEach(token => { if (token.length > 2) searchTerms.push(token); });
                }

                let foundCount = 0;
                for (let i = 0; i < events.length; i++) {
                    const evt = events[i];
                    const progress = 40 + Math.floor((i / events.length) * 55);
                    barEl.style.width = `${progress}%`;
                    statusEl.innerText = `Escaneando: ${evt.name}...`;

                    const coll = evt.type === 'entreno' ? 'entrenos_matches' : 'matches';
                    const mSnap = await window.db.collection(coll).where('americana_id', '==', evt.id).get();
                    const matches = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    const played = matches.some(m => {
                        const playersList = m.players || [];
                        const teamA_IDs = m.team_a_ids || [];
                        const teamB_IDs = m.team_b_ids || [];

                        if (playersList.includes(user.uid) || teamA_IDs.includes(user.uid) || teamB_IDs.includes(user.uid)) return true;

                        const strBody = JSON.stringify(m).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        return searchTerms.some(t => strBody.includes(t));
                    });

                    if (played) {
                        const finished = matches.filter(m => m.status === 'finished' || m.isFinished || m.score);
                        if (finished.length > 0) {
                            const insights = window.CaptainService.analyze(user, finished, evt);
                            await window.CaptainService.saveAnalysis(user.uid, evt, insights);
                            foundCount++;
                        }
                    }
                }

                barEl.style.width = "100%";
                statusEl.innerText = "¡Misión completada!";

                setTimeout(() => this.renderDashboard(user), 800);

            } catch (e) {
                console.error("Captain Error:", e);
                body.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#ef4444; font-weight:900;">FALLO DEL SISTEMA</p><p style="color:#94a3b8; font-size:0.75rem;">${e.message}</p></div>`;
            }
        }

        calculateGlobalStats(reports) {
            const data = { winRate: 0, totalMatches: 0, totalWins: 0, evolution: [] };
            const uniqueEvents = new Map();

            reports.forEach(r => {
                if (!uniqueEvents.has(r.eventId)) {
                    uniqueEvents.set(r.eventId, r);
                }
            });

            const sortedReports = Array.from(uniqueEvents.values()).sort((a, b) => a.eventDate.localeCompare(b.eventDate));

            sortedReports.forEach(r => {
                const summary = r.insights?.find(ins => ins.type === 'event_summary');
                if (!summary) return;

                const matches = summary.message.match(/(\d+)\/(\d+) victorias/);
                if (matches) {
                    const w = parseInt(matches[1]), t = parseInt(matches[2]);
                    data.totalWins += w;
                    data.totalMatches += t;
                    data.evolution.push(Math.round((w / t) * 100));
                }
            });

            if (data.totalMatches > 0) {
                data.winRate = Math.round((data.totalWins / data.totalMatches) * 100);
            }
            // Llenar evolución si es corta
            while (data.evolution.length < 5) data.evolution.unshift(0);
            data.evolution = data.evolution.slice(-8); // Solo los últimos 8

            return data;
        }

        renderReport(insights, eventDoc) {
            const body = document.getElementById('captain-body-content');
            body.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 0 4px;">
                    <button onclick="window.CaptainView.open()" style="background: rgba(255,255,255,0.05); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;"><i class="fas fa-chevron-left" style="font-size: 0.8rem;"></i></button>
                    <div>
                        <h3 style="color: #fff; font-weight: 950; font-size: 0.9rem; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">${eventDoc.name}</h3>
                        <div style="font-size: 0.65rem; color: #64748b; font-weight: 800;">REPORTE DE CAMPO • ${eventDoc.date || ''}</div>
                    </div>
                </div>
                ${insights.map(ins => `
                    <div class="insight-card" style="border-color: ${this.getColorForLevel(ins.level)}">
                        <div style="font-size: 1.4rem;">${ins.icon}</div>
                        <div>
                            <div style="font-weight: 950; color: #fff; font-size: 0.8rem; margin-bottom: 4px; text-transform: uppercase;">${ins.title}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.5;">${ins.message}</div>
                        </div>
                    </div>
                `).join('')}
            `;
        }

        async viewReport(id) {
            const user = window.Store.getState('currentUser');
            const reports = await window.CaptainService.getAnalysisHistory(user.uid);
            const r = reports.find(x => x.id === id);
            if (r) this.renderReport(r.insights, { name: r.eventName, date: r.eventDate });
        }

        getColorForLevel(level) {
            switch (level) {
                case 'success': return '#10b981';
                case 'warning': return '#f59e0b';
                case 'error': return '#ef4444';
                default: return '#CCFF00';
            }
        }

        renderLoader(text) {
            return `
                <div style="text-align:center; padding: 60px 40px; color: #64748b;">
                    <div style="position: relative; width: 50px; height: 50px; margin: 0 auto 24px;">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 3rem; color: #CCFF00;"></i>
                    </div>
                    <p style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${text}</p>
                </div>
            `;
        }

        createModalDOM() {
            let el = document.getElementById(this.modalId);
            if (!el) {
                el = document.createElement('div');
                el.id = this.modalId; el.className = 'captain-overlay';
                el.innerHTML = `
                    <div class="captain-card">
                        <div class="captain-header">
                            <div class="captain-avatar-container">
                                <div class="captain-avatar"><i class="fas fa-robot"></i></div>
                                <div class="avatar-status"></div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.1rem; font-weight: 950; color: #fff; letter-spacing: 1px;">CAPITÁN SOMOSPADEL</div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; text-transform: uppercase;">Sistema Táctico Activo</div>
                            </div>
                        </div>
                        <div id="captain-body-content" class="captain-body"></div>
                        <div class="captain-footer">
                            <button onclick="window.CaptainView.toggle(false)" class="btn-primary">ENTENDIDO 🫡</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(el);
                el.addEventListener('click', (e) => { if (e.target === el) this.toggle(false); });
            }
        }

        toggle(show) {
            const el = document.getElementById(this.modalId);
            if (!el) return;
            if (show) {
                el.classList.add('open');
                document.body.style.overflow = 'hidden';
            } else {
                el.classList.remove('open');
                document.body.style.overflow = '';
            }
        }
    }
    window.CaptainView = new CaptainView();
})();


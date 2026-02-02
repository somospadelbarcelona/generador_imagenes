/**
 * EntrenoLiveView.js
 * Extracted from EventsController to promote modularity.
 */
(function () {
    class EntrenoLiveView {
        constructor() {
            this.eventId = null;
            this.unsubscribe = null;
            this.matches = [];
            this.viewState = {
                tab: 'matches', // matches, standings, stats
                selectedRound: null,
                editingMatchId: null
            };
            // Singleton pattern
            window.EntrenoLiveView = this;
        }

        handleRoute() {
            let eventId = window.currentLiveEntrenoId;
            if (!eventId) eventId = sessionStorage.getItem('currentLiveEntrenoId');

            console.log("🎯 [EntrenoLiveView] Handling Route. ID:", eventId);

            if (!eventId) {
                console.error("❌ No Entreno ID found. Redirecting...");
                window.Router.navigate('entrenos');
                return;
            }

            this.load(eventId);
        }

        async load(eventId) {
            this.eventId = eventId;
            this.renderLoading();

            try {
                // 1. Get Event Details
                const doc = await window.db.collection('entrenos').doc(eventId).get();
                if (!doc.exists) {
                    alert("Entreno no encontrado");
                    window.Router.navigate('entrenos');
                    return;
                }
                this.eventData = doc.data();

                // 2. Start Listening to Matches
                if (this.unsubscribe) this.unsubscribe();

                this.unsubscribe = window.db.collection('entrenos_matches')
                    .where('americana_id', '==', eventId)
                    .onSnapshot(snapshot => {
                        this.matches = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        console.log("🔥 Loaded Matches:", this.matches.length);

                        const maxRound = Math.max(...this.matches.map(m => parseInt(m.round) || 1), 1);
                        if (!this.viewState.selectedRound || maxRound > this.viewState.selectedRound) {
                            this.viewState.selectedRound = maxRound;
                        }

                        this.render();
                    }, err => {
                        console.error("Error loading entreno matches:", err);
                        this.renderError(err.message);
                    });

            } catch (e) {
                console.error("Critical Error loading entreno:", e);
                this.renderError(e.message);
            }
        }

        // --- ACTIONS ---

        _isUserAuthorized() {
            const user = window.Store?.getState('currentUser') || window.AdminAuth?.user;
            if (!user) return false;

            const role = (user.role || '').toString().toLowerCase().trim();
            const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes'].includes(role);
            if (isAdmin || window.AdminAuth?.user) return true;

            const players = this.eventData?.players || this.eventData?.registeredPlayers || [];
            return players.some(p => (p.id === user.uid || p.uid === user.uid || p.id === user.id || p.uid === user.id));
        }

        setTab(tab) {
            this.viewState.tab = tab;
            this.render();
        }

        setRound(round) {
            this.viewState.selectedRound = round;
            this.render();
        }

        openEditScore(matchId) {
            this.viewState.editingMatchId = matchId;
            this.render();
        }

        async adjustScore(matchId, field, delta) {
            const m = this.matches.find(match => match.id === matchId);
            if (!m) return;

            const maxRound = Math.max(...this.matches.map(m => parseInt(m.round) || 1));
            const matchRound = parseInt(m.round) || 1;

            if (matchRound < maxRound) {
                if (confirm(`⚠️ ATENCIÓN: Estás editando la Ronda ${matchRound}, pero ya existen rondas posteriores.\n\n¿Deseas BORRAR las rondas posteriores y regenerar desde aquí?`)) {
                    await window.MatchMakingService.purgeSubsequentRounds(this.eventId, matchRound, 'entreno');
                    return;
                } else {
                    return;
                }
            }

            const current = parseInt(m[field] || 0);
            const newValue = Math.max(0, current + delta);
            await this.updateScore(matchId, field, newValue);
        }

        async updateScore(matchId, field, value) {
            try {
                const update = {};
                update[field] = parseInt(value) || 0;
                await window.db.collection('entrenos_matches').doc(matchId).update(update);
            } catch (e) { console.error(e); }
        }

        async finishMatch(matchId, currentScoreA, currentScoreB) {
            if (!confirm("¿Confirmar resultado " + currentScoreA + " - " + currentScoreB + "?")) return;
            try {
                await window.db.collection('entrenos_matches').doc(matchId).update({ status: 'finished' });

                const m = this.matches.find(m => m.id === matchId);
                if (m) {
                    const currentRound = parseInt(m.round) || 1;
                    const roundMatches = this.matches.filter(rm => (parseInt(rm.round) || 1) === currentRound);
                    const unfinishedOthers = roundMatches.filter(rm => rm.id !== matchId && rm.status !== 'finished');

                    if (unfinishedOthers.length === 0) {
                        this.viewState.editingMatchId = null;
                        setTimeout(() => this.generateNextRound(), 1200);
                    } else {
                        this.viewState.editingMatchId = null;
                        this.render();
                    }
                }
            } catch (e) { alert("Error: " + e.message); }
        }

        async unlockMatch(matchId) {
            const m = this.matches.find(match => match.id === matchId);
            if (!m) return;

            const maxRound = Math.max(...this.matches.map(m => parseInt(m.round) || 1));
            const matchRound = parseInt(m.round) || 1;

            if (matchRound < maxRound) {
                if (!confirm(`⚠️ ATENCIÓN: Esto BORRARÁ las rondas posteriores.\n\n¿Deseas continuar?`)) return;
                this.viewState.selectedRound = matchRound;
                await window.MatchMakingService.purgeSubsequentRounds(this.eventId, matchRound, 'entreno');
                await new Promise(r => setTimeout(r, 1000));
            } else {
                if (!confirm("¿Editar resultado?")) return;
            }

            try {
                await window.db.collection('entrenos_matches').doc(matchId).update({ status: 'scheduled' });
                this.viewState.editingMatchId = matchId;
                this.render();
            } catch (e) { alert(e.message); }
        }

        async generateNextRound() {
            const finishedMatches = this.matches.filter(m => m.status === 'finished');
            const maxFinishedRound = finishedMatches.length > 0 ? Math.max(...finishedMatches.map(m => parseInt(m.round) || 1)) : 0;
            const nextRoundNum = maxFinishedRound + 1;

            if (nextRoundNum > 6) {
                alert("Torneo finalizado.");
                return;
            }

            try {
                if (window.AmericanaService) {
                    await window.AmericanaService.generateNextRound(this.eventId, maxFinishedRound, 'entreno');
                    this.viewState.selectedRound = nextRoundNum;
                    setTimeout(() => this.render(), 600);
                }
            } catch (e) { alert(e.message); }
        }

        // --- RENDER ---
        renderLoading() {
            const container = document.getElementById('content-area');
            if (container) {
                container.innerHTML = `<div style="height:80vh; display:flex; align-items:center; justify-content:center; color:white;"><div class="loader"></div></div>`;
            }
        }

        renderError(msg) {
            const container = document.getElementById('content-area');
            if (container) {
                container.innerHTML = `<div style="padding:40px; text-align:center; color:white;">Error: ${msg}</div>`;
            }
        }

        render() {
            const container = document.getElementById('content-area');
            if (!container) return;

            const maxRound = Math.max(...this.matches.map(m => m.round || 1), 1);
            if (!this.viewState.selectedRound) this.viewState.selectedRound = maxRound;

            const headerHtml = `
                <div style="background:white; padding-top:20px; padding-bottom:10px; position:sticky; top:0; z-index:100; border-bottom:1px solid #f1f5f9;">
                     <div style="display:flex; justify-content:space-between; align-items:center; padding:0 20px; margin-bottom:15px;">
                        <button onclick="window.Router.navigate('entrenos')" style="background:none; border:none; color:#1e293b; font-size:1.2rem; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
                        <h1 style="color:#000; margin:0; font-size:1.1rem; font-weight:950; text-transform:uppercase;">${this.eventData.name || 'Entreno'}</h1>
                        <div style="width:30px;"></div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:8px; padding:0 15px; margin-bottom:15px;">
                        ${this._renderTabBtn('matches', 'PARTIDOS')}
                        ${this._renderTabBtn('standings', 'POSICIONES')}
                        ${this._renderTabBtn('stats', 'ESTADÍSTICAS')}
                        ${this._renderTabBtn('report', 'INFORME')}
                    </div>
                    ${this.viewState.tab === 'matches' ? this._renderRoundSelector(maxRound) : ''}
                </div>
            `;

            let contentHtml = '';
            if (this.viewState.tab === 'matches') contentHtml = this._renderMatchesContent(maxRound);
            else if (this.viewState.tab === 'standings') contentHtml = this._renderStandingsContent();
            else if (this.viewState.tab === 'stats') contentHtml = this._renderStatsContent();
            else contentHtml = this._renderReportContent();

            container.innerHTML = `<div style="background:#f8f9fa; min-height:100vh; padding-bottom:100px;">${headerHtml}${contentHtml}</div>`;
        }

        _renderTabBtn(id, label) {
            const isActive = this.viewState.tab === id;
            return `<button onclick="window.EntrenoLiveView.setTab('${id}')" style="padding:12px; border-radius:12px; border:none; font-weight:900; font-size:0.75rem; transition:all 0.3s; ${isActive ? 'background:#CCFF00; color:black;' : 'background:#e2e8f0; color:#64748b;'}">${label}</button>`;
        }

        _renderRoundSelector(maxRound) {
            let roundsFn = [1, 2, 3, 4, 5, 6];
            return `<div style="display:flex; gap:12px; overflow-x:auto; padding:0 20px 15px 20px;">
                ${roundsFn.map(r => {
                const exists = this.matches.some(m => (parseInt(m.round) || 1) === r);
                const isActive = this.viewState.selectedRound === r;
                return `<button onclick="window.EntrenoLiveView.setRound(${r})" style="min-width:55px; height:55px; border-radius:18px; border:none; font-weight:900; ${isActive ? 'background:white; border:3px solid #CCFF00;' : (exists ? 'background:#f8fafc;' : 'background:#f1f5f9; opacity:0.6;')}">P${r}</button>`;
            }).join('')}
            </div>`;
        }

        _renderMatchesContent(maxRound) {
            const round = this.viewState.selectedRound;
            const roundMatches = this.matches.filter(m => (parseInt(m.round) || 1) === round).sort((a, b) => (parseInt(a.court) || 999) - (parseInt(b.court) || 999));
            if (roundMatches.length === 0) return `<div style="padding:100px 20px; text-align:center; color:#94a3b8;">Sin partidos.</div>`;
            return `<div style="padding:10px 20px; display:grid; gap:15px;">${roundMatches.map(m => this.renderMatchCard(m)).join('')}</div>`;
        }

        _renderStandingsContent() {
            // USES STANDINGS SERVICE
            const data = window.StandingsService.calculate(this.matches, 'entreno');
            return `<div style="padding:0 20px;"><div style="background:white; border-radius:28px; overflow:hidden;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead style="background:#f8fafc; font-size:0.7rem;"><tr><th style="padding:15px;">JUGADOR</th><th style="padding:15px;">PJ</th><th style="padding:15px;">DIF</th><th style="padding:15px;">PTS</th></tr></thead>
                    <tbody>${data.map((p, i) => `<tr style="${i === 0 ? 'background:#CCFF00;' : ''}"><td style="padding:15px; font-weight:800;">${p.name.toUpperCase()}</td><td style="text-align:center;">${p.played}</td><td style="text-align:center;">${p.diff}</td><td style="text-align:center; font-weight:950;">${p.points}</td></tr>`).join('')}</tbody>
                </table>
            </div></div>`;
        }

        _renderStatsContent() { return '<div style="padding:20px; text-align:center;">Módulo de Estadísticas Centralizado Próximamente</div>'; }
        _renderReportContent() { return '<div style="padding:20px; text-align:center;">Informe de Rendimiento Próximamente</div>'; }

        renderMatchCard(m) {
            const isEditing = this.viewState.editingMatchId === m.id;
            const s1 = parseInt(m.score_a || 0);
            const s2 = parseInt(m.score_b || 0);
            const isFinished = m.status === 'finished';
            const tA = m.team_a_names || 'Equipo A';
            const tB = m.team_b_names || 'Equipo B';

            if (!isEditing) {
                return `<div onclick="window.EntrenoLiveView.openEditScore('${m.id}')" style="background:white; border-radius:28px; padding:25px; box-shadow:0 15px 40px rgba(0,0,0,0.03); display:flex; flex-direction:column; gap:15px;">
                    <div style="display:flex; justify-content:space-between; font-weight:900; font-size:0.7rem;"><span>PISTA ${m.court}</span><span>${isFinished ? '✅' : '🔴'}</span></div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:800; flex:1;">${tA.toString().toUpperCase()}</span>
                        <span style="font-size:2rem; font-weight:950;">${s1}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:800; flex:1;">${tB.toString().toUpperCase()}</span>
                        <span style="font-size:2rem; font-weight:950;">${s2}</span>
                    </div>
                </div>`;
            } else {
                // Simplified edit UI
                return `<div style="background:#000; color:#fff; border-radius:28px; padding:25px;">
                    <h3 style="color:#CCFF00;">PISTA ${m.court}</h3>
                    <!-- Logic to adjust scores -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin:15px 0;">
                        <span>${tA}</span>
                        <div style="display:flex; gap:15px; align-items:center;">
                            <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_a', -1)" style="width:35px; height:35px; background:#333; color:#fff; border:none; border-radius:50%; font-size:1.5rem;">-</button>
                            <span style="font-size:2.5rem; font-weight:900; min-width:30px; text-align:center;">${s1}</span>
                            <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_a', 1)" style="width:35px; height:35px; background:#CCFF00; color:#000; border:none; border-radius:50%; font-size:1.5rem;">+</button>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin:15px 0;">
                        <span>${tB}</span>
                        <div style="display:flex; gap:15px; align-items:center;">
                            <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_b', -1)" style="width:35px; height:35px; background:#333; color:#fff; border:none; border-radius:50%; font-size:1.5rem;">-</button>
                            <span style="font-size:2.5rem; font-weight:900; min-width:30px; text-align:center;">${s2}</span>
                            <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_b', 1)" style="width:35px; height:35px; background:#CCFF00; color:#000; border:none; border-radius:50%; font-size:1.5rem;">+</button>
                        </div>
                    </div>
                    <button onclick="window.EntrenoLiveView.finishMatch('${m.id}', ${s1}, ${s2})" style="width:100%; background:#CCFF00; color:#000; padding:15px; border-radius:15px; font-weight:900; border:none;">FINALIZAR</button>
                    <button onclick="window.EntrenoLiveView.viewState.editingMatchId = null; window.EntrenoLiveView.render();" style="width:100%; background:transparent; color:#888; border:none; margin-top:10px;">Cerrar</button>
                </div>`;
            }
        }
    }

    window.EntrenoLiveView = new EntrenoLiveView();
})();

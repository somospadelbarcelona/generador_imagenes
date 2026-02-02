/**
 * ChatView.js
 * "Ops Room" UI - The Tactical Communication Interface.
 * Professional Messaging Experience (v7.0 Ultra)
 */
(function () {
    class ChatView {
        constructor() {
            this.eventId = null;
            this.isVisible = false;
            this.sosUnsubscribe = null;
            this.presenceUnsubscribe = null;
            this.onlineUsers = [];
            this.allPlayers = [];
            this.allEntrenos = [];
            this.pendingAttachment = null;
            this.isRecording = false;
            this.mediaRecorder = null;
            this.audioChunks = [];
        }

        async init(eventId, eventName, category = 'open', participantIds = []) {
            // Permission Check: Member-based & Gender-based Access Control
            const user = window.Store.getState('currentUser');
            const isAdmin = user && (user.role === 'admin' || user.role === 'admin_player');

            if (!isAdmin) {
                const uid = user?.id || user?.uid;
                const isJoined = participantIds.includes(uid);
                const isCommunity = user?.membership === 'somospadel_bcn' || user?.role === 'player_somospadel';

                // 1. Access Check: Must be Joined OR part of the Community
                if (!isJoined && !isCommunity) {
                    this.showAccessDenied("Este chat es exclusivo para jugadores inscritos o miembros activos de la comunidad SOMOSPADEL.");
                    return;
                }

                // 2. Gender Category Enforcement (Global rule)
                let userGender = (user?.gender || 'male').toLowerCase();
                // Normalize gender labels
                if (userGender === 'chico') userGender = 'male';
                if (userGender === 'chica') userGender = 'female';

                const eventCat = category.toLowerCase();

                let allowed = false;
                if (eventCat === 'male' && userGender === 'male') allowed = true;
                else if (eventCat === 'female' && userGender === 'female') allowed = true;
                else if (eventCat === 'mixed' || eventCat === 'open') allowed = true;

                if (!allowed) {
                    const catName = eventCat === 'male' ? 'MASCULINA' : 'FEMENINA';
                    this.showAccessDenied(`Tu perfil no coincide con la categoría ${catName} de este entreno.`);
                    return;
                }
            }

            this.eventId = eventId;
            this.eventName = eventName;
            this.participantIds = participantIds || [];

            await this.loadTagData();
            this.render();
            this.startListeners();
            this.show();
        }

        async loadTagData() {
            try {
                // Aumentamos límite temporalmente para asegurar que cargamos a todos los posibles participantes
                // TODO: Optimizar cargando solo los Ids necesarios o con paginación
                const pSnap = await window.db.collection('players').limit(800).get();
                this.allPlayers = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                console.log("ChatView: Loaded players count:", this.allPlayers.length);
                // DIAGNOSTICO: Ver si el campo EQUIPOS llega en el primer jugador
                if (this.allPlayers.length > 0) {
                    const sample = this.allPlayers[0];
                    console.log("ChatView: Sample Player Data:", sample);
                    console.log("ChatView: Has EQUIPOS?", sample.EQUIPOS || sample.equipos);
                }

                const eSnap = await window.db.collection('entrenos').orderBy('date', 'desc').limit(20).get();
                this.allEntrenos = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (e) { console.error("Tag load fail", e); }
        }

        render() {
            const existing = document.getElementById('ops-room-drawer');
            if (existing) existing.remove();

            const html = `
                <div id="ops-room-drawer" class="ops-drawer">
                    <!-- HEADER: PRESENCE & EXIT -->
                    <div class="ops-header">
                        <div style="display:flex; align-items:center; gap:12px; flex:1;" onclick="window.ChatView.toggle()">
                            <div style="color: white; font-size: 1.1rem; cursor: pointer; padding: 5px;">
                                <i class="fas fa-arrow-left"></i>
                            </div>
                            <div class="ops-presence-badge">
                                <div class="ops-led"></div>
                                <span id="online-count">1</span> ONLINE
                            </div>
                            <div style="overflow:hidden;">
                                <h3 style="margin:0; font-size:0.85rem; font-weight:900; color:white; letter-spacing:0.5px; white-space:nowrap; text-overflow:ellipsis;">${this.eventName?.toUpperCase() || 'CHAT EVENTO'}</h3>
                                <div id="presence-list-names" style="font-size:0.55rem; color:#64748b; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Conectando...</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <div id="sos-toggle-btn" class="sos-btn" onclick="window.ChatView.handleSOS()">
                                <i class="fas fa-life-ring"></i> SOS
                            </div>
                            <div class="ops-close-btn" onclick="window.ChatView.destroy()" style="color: #ef4444; font-size: 1.3rem; padding: 5px; cursor: pointer;">
                                <i class="fas fa-times-circle"></i>
                            </div>
                        </div>
                    </div>

                    <!-- SOS ACTIVE ALERT -->
                    <div id="sos-active-bar" class="sos-bar hidden">
                        <i class="fas fa-bolt"></i> <span id="sos-count">0</span> JUGADORES BUSCAN PAREJA <i class="fas fa-bolt"></i>
                    </div>

                    <!-- MESSAGES AREA -->
                    <div id="ops-messages-area" class="ops-messages">
                        <div class="chat-loading-shimmer">
                            <i class="fas fa-satellite-dish fa-spin"></i>
                            <span>Sincronizando canal táctico...</span>
                        </div>
                    </div>

                    <!-- EMOJI PICKER (Hidden) -->
                    <div id="ops-emoji-picker" class="emoji-picker hidden">
                        ${['🎾', '🔥', '🏆', '👏', '💪', '🙌', '😅', '😮', '😤', '🤝'].map(e => `
                            <span onclick="window.ChatView.addEmoji('${e}')">${e}</span>
                        `).join('')}
                    </div>

                    <!-- MEDIA PREVIEW -->
                    <div id="ops-media-preview" class="media-preview-bar hidden">
                        <div id="preview-content"></div>
                        <div onclick="window.ChatView.clearPreview()" class="clear-preview"><i class="fas fa-times"></i></div>
                    </div>

                    <!-- INPUT AREA -->
                    <div class="ops-input-wrapper">
                        <div class="ops-actions-left">
                            <label for="ops-file-input" class="ops-action-icon">
                                <i class="fas fa-camera"></i>
                                <input type="file" id="ops-file-input" accept="image/*" style="display:none" onchange="window.ChatView.handleFile(this)">
                            </label>
                            <div class="ops-action-icon" onclick="window.ChatView.toggleEmojis()">
                                <i class="fas fa-smile"></i>
                            </div>
                        </div>
                        <div class="ops-input-container">
                            <input type="text" id="ops-input" placeholder="Escribe..." autocomplete="off">
                        </div>
                        <div id="ops-audio-btn" class="ops-audio-btn" onclick="window.ChatView.handleAudioRecord()">
                            <i class="fas fa-microphone"></i>
                        </div>
                        <button onclick="window.ChatView.sendMessage()" id="ops-send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <style>
                    .ops-drawer {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: #05070a; z-index: 30000; border-top: 1px solid #1e293b;
                        display: flex; flex-direction: column; transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                        transform: translateY(calc(100% - 70px)); box-shadow: 0 -20px 60px rgba(0,0,0,0.8);
                    }
                    .ops-drawer.expanded { transform: translateY(0); }
                    .ops-header {
                        padding: 0 15px; height: 70px; background: #0f172a; border-bottom: 1px solid #1e293b;
                        display: flex; justify-content: space-between; align-items: center;
                    }
                    .ops-presence-badge {
                        background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 8px; color: #10b981;
                        font-size: 0.55rem; font-weight: 950; display: flex; align-items: center; gap: 5px;
                    }
                    .ops-led { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: blink-led 2s infinite; }
                    @keyframes blink-led { 0%, 100% {opacity:1;} 50% {opacity:0.4;} }

                    .sos-btn {
                        background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; 
                        padding: 5px 10px; border-radius: 10px; font-size: 0.65rem; font-weight: 900;
                    }
                    .sos-btn.active { background: #ef4444; color: white; box-shadow: 0 0 15px rgba(239,68,68,0.4); }

                    .ops-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #05070a; }
                    
                    .msg-wrap { display: flex; flex-direction: column; max-width: 85%; }
                    .msg-wrap.self { align-self: flex-end; align-items: flex-end; }
                    .msg-wrap.other { align-self: flex-start; align-items: flex-start; }

                    .msg-bubble { padding: 12px 16px; border-radius: 20px; font-size: 0.9rem; line-height: 1.4; position: relative; }
                    .msg-self { background: #3b82f6; color: white; border-bottom-right-radius: 4px; }
                    .msg-other { background: #1e293b; color: #e2e8f0; border-bottom-left-radius: 4px; border: 1px solid #334155; }
                    .msg-admin { background: rgba(204,255,0,0.05); border: 1px solid #CCFF00; color: #CCFF00; width: 100%; text-align: center; border-radius: 10px; font-size: 0.7rem; font-weight: 800; }

                    .ops-input-wrapper { padding: 15px 10px 35px; background: #0f172a; display: flex; align-items: center; gap: 8px; border-top: 1px solid #1e293b; box-sizing: border-box; }
                    .ops-input-container { flex: 1; min-width: 0; }
                    #ops-input { width: 100%; background: #1e293b; border: 1px solid #334155; padding: 12px 15px; border-radius: 25px; color: white; outline: none; font-size: 0.9rem; box-sizing: border-box; }
                    
                    .ops-action-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 1.1rem; cursor: pointer; }
                    .ops-audio-btn { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 1.1rem; cursor: pointer; transition: 0.3s; }
                    .ops-audio-btn.recording { background: #ef4444; color: white; animation: pulse-red 1s infinite; }
                    @keyframes pulse-red { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

                    #ops-send-btn { width: 45px; height: 45px; min-width: 45px; background: #CCFF00; border: none; border-radius: 50%; color: black; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

                    .emoji-picker { background: #1e293b; padding: 10px; display: flex; flex-wrap: wrap; gap: 15px; border-top: 1px solid #334155; justify-content: center; font-size: 1.5rem; }
                    .emoji-picker span { cursor: pointer; transition: transform 0.2s; }
                    .emoji-picker span:hover { transform: scale(1.3); }

                    .media-preview-bar { background: #1e293b; padding: 10px; display: flex; align-items: center; gap: 15px; border-top: 1px solid #334155; }
                    .clear-preview { color: #ef4444; font-size: 1.2rem; cursor: pointer; margin-left: auto; }
                    .hidden { display: none !important; }
                    .sos-bar { background: #ef4444; color: white; padding: 6px; text-align: center; font-size: 0.6rem; font-weight: 900; }
                </style>
            `;

            document.body.insertAdjacentHTML('beforeend', html);
            this.setupInput();
        }

        setupInput() {
            const input = document.getElementById('ops-input');
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        }

        toggleEmojis() { document.getElementById('ops-emoji-picker').classList.toggle('hidden'); }
        addEmoji(e) { document.getElementById('ops-input').value += e; this.toggleEmojis(); }

        handleFile(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.pendingAttachment = { data: e.target.result, type: 'image' };
                document.getElementById('preview-content').innerHTML = `<img src="${e.target.result}" style="height:50px; border-radius:8px; border:1px solid #CCFF00;">`;
                document.getElementById('ops-media-preview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }

        async handleAudioRecord() {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        }

        async startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
                this.mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.pendingAttachment = { data: e.target.result, type: 'audio' };
                        document.getElementById('preview-content').innerHTML = `<div style="color:#CCFF00; font-weight:900; font-size:0.8rem;"><i class="fas fa-play"></i> AUDIO LISTO</div>`;
                        document.getElementById('ops-media-preview').classList.remove('hidden');
                    };
                    reader.readAsDataURL(audioBlob);
                };
                this.mediaRecorder.start();
                this.isRecording = true;
                document.getElementById('ops-audio-btn').classList.add('recording');
            } catch (err) { alert("Micrófono no disponible"); }
        }

        stopRecording() {
            if (this.mediaRecorder) this.mediaRecorder.stop();
            this.isRecording = false;
            document.getElementById('ops-audio-btn').classList.remove('recording');
        }

        clearPreview() {
            this.pendingAttachment = null;
            document.getElementById('ops-media-preview').classList.add('hidden');
        }

        show() {
            setTimeout(() => {
                document.getElementById('ops-room-drawer').classList.add('expanded');
                document.body.style.overflow = 'hidden';
            }, 50);
            this.isVisible = true;
        }

        toggle() {
            const drawer = document.getElementById('ops-room-drawer');
            const isExpanded = drawer.classList.toggle('expanded');
            document.body.style.overflow = isExpanded ? 'hidden' : '';
        }

        async destroy() {
            const confirmed = await this.showCustomConfirm("¿DESCONECTAR DEL CANAL TÁCTICO?", "Cerrarás la sesión de comunicaciones en tiempo real para este evento.");
            if (confirmed) {
                if (this.eventId) await window.ChatService.closeRoom(this.eventId);
                const el = document.getElementById('ops-room-drawer');
                if (el) {
                    el.classList.remove('expanded');
                    setTimeout(() => {
                        el.remove();
                        document.body.style.overflow = '';
                        this.isVisible = false;
                    }, 400);
                } else {
                    document.body.style.overflow = '';
                    this.isVisible = false;
                }
            }
        }

        showAccessDenied(reason) {
            const existing = document.getElementById('ops-access-denied');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'ops-access-denied';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle at center, #1e0505 0%, #050000 100%);
                z-index: 40000; display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(10px); color: white; font-family: 'Inter', sans-serif;
            `;

            let timeLeft = 10;

            overlay.innerHTML = `
                <div style="text-align: center; max-width: 320px; padding: 30px; border-radius: 30px; background: rgba(255,255,255,0.03); border: 1px solid rgba(239,68,68,0.2); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: access-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                    <div style="width: 80px; height: 80px; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #ef4444; animation: pulse-error 2s infinite;">
                        <i class="fas fa-shield-alt" style="font-size: 2.5rem; color: #ef4444;"></i>
                    </div>
                    
                    <h2 style="font-weight: 900; letter-spacing: -1px; margin-bottom: 10px; color: #ef4444;">ACCESO DENEGADO</h2>
                    <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.5; margin-bottom: 25px;">${reason}</p>
                    
                    <div id="access-timer" style="font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 20px; letter-spacing: 1px; text-transform: uppercase;">
                        Redirección automática en <span style="color:white; font-size:1rem;" id="countdown-num">10</span>s
                    </div>

                    <button onclick="window.ChatView.abortAndReturn()" style="width: 100%; background: #ef4444; color: white; border: none; padding: 15px; border-radius: 15px; font-weight: 900; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 20px rgba(239,68,68,0.2);">
                        <i class="fas fa-arrow-left"></i> VOLVER ATRÁS
                    </button>
                    
                    <style>
                        @keyframes access-pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        @keyframes pulse-error { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 15px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
                    </style>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            const timerIdx = setInterval(() => {
                timeLeft--;
                const numEl = document.getElementById('countdown-num');
                if (numEl) numEl.innerText = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(timerIdx);
                    this.abortAndReturn();
                }
            }, 1000);

            // Store interval to clear if manual button pressed
            this.accessTimer = timerIdx;
        }

        abortAndReturn() {
            if (this.accessTimer) clearInterval(this.accessTimer);
            const overlay = document.getElementById('ops-access-denied');
            if (overlay) overlay.remove();

            document.body.style.overflow = '';

            // Retroceder al inicio (dashboard)
            if (window.Router) {
                window.Router.navigate('dashboard');
            } else {
                window.location.reload();
            }
        }

        showCustomConfirm(title, message) {
            return new Promise((resolve) => {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); z-index: 41000;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(5px); animation: fadeIn 0.3s;
                `;

                overlay.innerHTML = `
                    <div style="background: #0f172a; width: 90%; max-width: 320px; border-radius: 25px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                        <div style="padding: 25px; text-align: center;">
                            <div style="width: 50px; height: 50px; background: rgba(204,255,0,0.1); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: #CCFF00; font-size: 1.5rem;">
                                <i class="fas fa-sign-out-alt"></i>
                            </div>
                            <h3 style="margin: 0 0 10px; color: white; font-weight: 900; font-size: 1.1rem; letter-spacing: -0.5px;">${title}</h3>
                            <p style="margin: 0; color: #64748b; font-size: 0.85rem; line-height: 1.4;">${message}</p>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #1e293b;">
                            <button id="confirm-cancel" style="padding: 15px; background: transparent; border: none; color: #94a3b8; font-weight: 700; cursor: pointer; border-right: 1px solid #1e293b;">CANCELAR</button>
                            <button id="confirm-ok" style="padding: 15px; background: #CCFF00; border: none; color: black; font-weight: 900; cursor: pointer;">CONFIRMAR</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(overlay);

                overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
                overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
            });
        }

        startListeners() {
            window.ChatService.subscribe(this.eventId, (msgs) => this.renderMessages(msgs));
            window.ChatService.subscribeSOS(this.eventId, (sigs) => this.updateSOSView(sigs));
            window.ChatService.subscribePresence(this.eventId, (users) => this.updatePresenceView(users));
        }

        updatePresenceView(users) {
            const count = document.getElementById('online-count');
            const list = document.getElementById('presence-list-names');
            if (count) count.innerText = users.length;
            if (list) list.innerText = users.length > 0 ? users.map(u => u.name.split(' ')[0]).join(', ') : 'Ready';
        }

        updateSOSView(signals) {
            const bar = document.getElementById('sos-active-bar');
            const btn = document.getElementById('sos-toggle-btn');
            const count = document.getElementById('sos-count');
            const user = window.Store.getState('currentUser');
            if (signals.length > 0) { bar.classList.remove('hidden'); count.innerText = signals.length; } else { bar.classList.add('hidden'); }
            const active = signals.some(s => s.uid === (user?.id || user?.uid));
            if (btn) btn.className = active ? 'sos-btn active' : 'sos-btn';
        }

        getUserColor(uid) {
            if (!this.userColors) this.userColors = {};
            if (this.userColors[uid]) return this.userColors[uid];

            const colors = [
                '#e0f2fe', '#ffe4e6', '#ede9fe', '#d1fae5', '#fef3c7',
                '#fce7f3', '#e0e7ff', '#cffafe', '#ecfccb'
            ];
            const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const color = colors[hash % colors.length];
            this.userColors[uid] = color;
            return color;
        }

        getTeamBadgesHtml(teamsRaw) {
            if (!teamsRaw) return '';

            // Normalizar a array
            let teams = [];
            if (Array.isArray(teamsRaw)) teams = teamsRaw;
            else if (typeof teamsRaw === 'string') teams = [teamsRaw];

            if (teams.length === 0) return '';

            return teams.map(t => {
                let teamColor = '#38bdf8'; // Default
                let textColor = '#000';

                const tUpper = t.toUpperCase();

                // MASCULINO
                if (tUpper.includes('3º MASCULINO A')) {
                    teamColor = '#3b82f6'; // Azul Fuerte
                    textColor = '#fff';
                }
                else if (tUpper.includes('3º MASCULINO B')) {
                    teamColor = '#60a5fa'; // Azul Celeste
                }
                else if (tUpper.includes('4º MASCULINO')) {
                    teamColor = '#22c55e'; // Verde
                    textColor = '#fff';
                }

                // FEMENINO
                else if (tUpper.includes('4º FEMENINO')) {
                    teamColor = '#ec4899'; // Rosa
                    textColor = '#fff';
                }
                else if (tUpper.includes('2º FEMENINO')) {
                    teamColor = '#f97316'; // Naranja
                    textColor = '#fff';
                }

                // MIXTO
                else if (tUpper.includes('3º MIXTO')) {
                    teamColor = '#ef4444'; // Rojo
                    textColor = '#fff';
                }
                else if (tUpper.includes('4º MIXTO')) { // A y B
                    teamColor = '#eab308'; // Amarillo
                }

                // Fallback para membership simple 
                else if (tUpper === 'SOMOSPADEL_BCN' || tUpper === 'SOMOSPADEL') {
                    teamColor = '#CCFF00'; // Neon Brand
                    textColor = '#000';
                    t = 'SOMOSPADEL';
                }

                return `<span style="background: ${teamColor}; color: ${textColor}; font-size: 0.55rem; font-weight: 950; padding: 2px 6px; border-radius: 4px; margin-left: 4px; display: inline-block; letter-spacing: 0.5px; vertical-align: middle;">${t.toUpperCase()}</span>`;
            }).join('');
        }

        async showPlayerDetails(playerId) {
            let player = this.allPlayers.find(p => p.id === playerId || p.uid === playerId);

            // Si no está en caché, intentamos obtenerlo al vuelo (raro con limite 800, pero posible)
            if (!player) {
                try {
                    const doc = await window.db.collection('players').doc(playerId).get();
                    if (doc.exists) {
                        player = { id: doc.id, ...doc.data() };
                        this.allPlayers.push(player); // Cachearlo
                    }
                } catch (e) { console.error("Error fetching player details", e); }
            }

            if (!player) return; // Fallback silencioso o toast error

            // --- DATA PREP ---
            const name = player.name || 'JUGADOR';
            const photoUrl = player.photo_url || null;
            const level = player.level || 3.0;
            const gender = player.gender === 'male' ? 'MASCULINO' : (player.gender === 'female' ? 'FEMENINO' : 'MIXTO');
            const hand = player.hand ? (player.hand === 'right' ? 'Diestro' : 'Zurdo') : 'N/A';
            const position = player.position ? (player.position === 'drive' ? 'Drive' : (player.position === 'reves' ? 'Revés' : 'Indiferente')) : 'N/A';
            const joinedAt = player.joinedAt ? new Date(player.joinedAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'N/A';

            // --- EQUIPOS CALC ---
            let teamsList = [];

            // 0. BD Priority
            const dbEquipos = player.EQUIPOS || player.equipos || player.Equipos;
            if (dbEquipos) {
                if (Array.isArray(dbEquipos)) teamsList.push(...dbEquipos);
                else {
                    const val = String(dbEquipos);
                    if (val.includes(',')) val.split(',').forEach(t => teamsList.push(t.trim()));
                    else teamsList.push(val);
                }
            }

            // 1. Legacy
            if (Array.isArray(player.team_somospadel)) player.team_somospadel.forEach(t => teamsList.push(t));
            else if (player.team) teamsList.push(player.team);

            // 2. Community
            if (player.membership === 'somospadel_bcn' || player.role === 'player_somospadel') {
                if (!teamsList.some(t => String(t).toUpperCase().includes('SOMOSPADEL'))) teamsList.push('SOMOSPADEL');
            }

            teamsList = [...new Set(teamsList)].filter(t => t && String(t).trim() !== '').map(t => String(t).replace(/['"]+/g, '').trim());
            if (teamsList.length === 0) teamsList = ['JUGADOR'];
            const badgesHtml = this.getTeamBadgesHtml(teamsList);

            // --- STATS CALC ---
            const s = player.stats || {};
            const stats = {
                played: (s.americanas?.played || 0) + (s.entrenos?.played || 0),
                won: (s.americanas?.won || 0) + (s.entrenos?.won || 0),
                points: (s.americanas?.points || 0) + (s.entrenos?.points || 0)
            };
            const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

            const div = document.createElement('div');
            div.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:30005; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px); animation: fadeIn 0.2s;';
            div.innerHTML = `
                <style>
                    @keyframes slideUp { from {transform:translateY(20px); opacity:0;} to {transform:translateY(0); opacity:1;} }
                </style>
                <div style="background: #0f172a; width: 90%; max-width: 380px; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
                    
                    <!-- HEADER HEADER -->
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px 20px; text-align: center; border-bottom: 1px solid #1e293b; position: relative;">
                        <div onclick="this.closest('#modal-overlay').remove()" style="position: absolute; top: 15px; right: 15px; color: #94a3b8; cursor: pointer; padding: 5px;"><i class="fas fa-times"></i></div>
                        
                        <!-- AVATAR -->
                        <div style="width: 90px; height: 90px; margin: 0 auto 15px; border-radius: 24px; border: 2px solid ${winRate >= 50 ? '#84cc16' : '#94a3b8'}; padding: 3px; position: relative;">
                             ${photoUrl ?
                    `<div style="width:100%; height:100%; background:url('${photoUrl}') center/cover; border-radius: 20px;"></div>` :
                    `<div style="width:100%; height:100%; background:#1e293b; color:#94a3b8; display:flex; align-items:center; justify-content:center; border-radius: 20px; font-size:2rem; font-weight:900;">${name.charAt(0).toUpperCase()}</div>`
                }
                             <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); background: #CCFF00; color: black; font-size: 0.7rem; font-weight: 950; padding: 2px 10px; border-radius: 10px; border: 2px solid #0f172a; white-space: nowrap;">LVL ${level}</div>
                        </div>

                        <h2 style="margin: 0; color: white; font-size: 1.3rem; font-weight: 900; letter-spacing: -0.5px;">${name.toUpperCase()}</h2>
                        <div style="color: #64748b; font-size: 0.8rem; font-weight: 600; margin-top: 5px; text-transform: uppercase;">${gender} • ${joinedAt !== 'N/A' ? 'DESDE ' + joinedAt : 'JUGADOR'}</div>
                        
                        <div style="margin-top: 15px; display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">
                            ${badgesHtml}
                        </div>
                    </div>

                    <!-- STATS GRID -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #1e293b; border-bottom: 1px solid #1e293b;">
                        <div style="background: #0f172a; padding: 15px 10px; text-align: center;">
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px;">PARTIDOS</div>
                            <div style="color: white; font-size: 1.2rem; font-weight: 950;">${stats.played}</div>
                        </div>
                        <div style="background: #0f172a; padding: 15px 10px; text-align: center;">
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px;">VICTORIAS</div>
                            <div style="color: #84cc16; font-size: 1.2rem; font-weight: 950;">${stats.won}</div>
                        </div>
                        <div style="background: #0f172a; padding: 15px 10px; text-align: center;">
                             <div style="color: #64748b; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px;">WIN RATE</div>
                             <div style="color: ${winRate >= 50 ? '#84cc16' : (winRate >= 40 ? '#f59e0b' : '#ef4444')}; font-size: 1.2rem; font-weight: 950;">${winRate}%</div>
                        </div>
                    </div>

                    <!-- EXTRA INFO -->
                    <div style="padding: 20px; background: #0f172a;">
                         <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 10px; margin-bottom: 10px;">
                            <span style="color: #64748b; font-size: 0.8rem; font-weight: 700;">Posición</span>
                            <span style="color: white; font-weight: 600; font-size: 0.9rem;">${position}</span>
                         </div>
                         <div style="display: flex; justify-content: space-between; padding-bottom: 5px;">
                            <span style="color: #64748b; font-size: 0.8rem; font-weight: 700;">Mano Dominante</span>
                            <span style="color: white; font-weight: 600; font-size: 0.9rem;">${hand}</span>
                         </div>
                    </div>
                    
                    <button onclick="this.closest('#modal-overlay').remove()" style="width: 100%; border: none; background: #1e293b; color: white; padding: 15px; font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; letter-spacing: 1px; text-transform: uppercase;">CERRAR FICHA</button>
                </div>
            `;
            div.id = 'modal-overlay';
            div.onclick = (e) => { if (e.target.id === 'modal-overlay') div.remove(); };
            document.body.appendChild(div);
        }

        renderMessages(messages) {
            const container = document.getElementById('ops-messages-area');
            const myId = window.Store.getState('currentUser')?.uid;
            const currentUser = window.Store.getState('currentUser');
            const isSuperAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'admin_player');

            if (messages.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:50px; opacity:0.2;"><i class="fas fa-ghost fa-3x"></i></div>';
                return;
            }

            container.innerHTML = messages.map(msg => {
                try {
                    const isMe = msg.senderId === myId;
                    const isAdminMsg = msg.type === 'admin';

                    let bgColor = '#ffffff';
                    let textColor = '#000000';
                    let borderColor = 'transparent';

                    // PRIORITY: Admin style (even if it's me)
                    if (isAdminMsg) {
                        bgColor = '#ffffff';
                        textColor = '#065f46'; // Admin Dark Green
                        borderColor = '#065f46';
                    } else if (isMe) {
                        bgColor = '#ffffff';
                        textColor = '#000000';
                    } else {
                        bgColor = this.getUserColor(msg.senderId);
                        textColor = '#000000';
                    }

                    // --- LOGICA DE EQUIPOS MEJORADA ---
                    const player = this.allPlayers.find(p => p.id === msg.senderId || p.uid === msg.senderId);
                    let teamsList = [];

                    if (player) {
                        // 0. COLUMNA 'EQUIPOS' DE LA BD (Prioridad solicitada)
                        const dbEquipos = player.EQUIPOS || player.equipos || player.Equipos;

                        if (dbEquipos) {
                            if (Array.isArray(dbEquipos)) {
                                teamsList.push(...dbEquipos);
                            } else if (typeof dbEquipos === 'string') {
                                if (dbEquipos.includes(',')) {
                                    dbEquipos.split(',').map(t => t.trim()).forEach(t => teamsList.push(t));
                                } else {
                                    teamsList.push(dbEquipos);
                                }
                            }
                        }

                        // 1. Equipos de Competición Legacy
                        if (Array.isArray(player.team_somospadel) && player.team_somospadel.length > 0) {
                            player.team_somospadel.forEach(t => {
                                if (!teamsList.includes(t)) teamsList.push(t);
                            });
                        }
                        else if (teamsList.length === 0) {
                            if (player.team) teamsList.push(player.team);
                            else if (player.team_name) teamsList.push(player.team_name);
                        }

                        // 2. Membresía de Comunidad
                        if (player.membership === 'somospadel_bcn' || player.role === 'player_somospadel') {
                            const hasSomosPadel = teamsList.some((t) => typeof t === 'string' && (t.toUpperCase() === 'SOMOSPADEL' || t.toUpperCase() === 'SOMOSPADEL_BCN'));
                            if (!hasSomosPadel) {
                                teamsList.push('SOMOSPADEL');
                            }
                        }

                        teamsList = [...new Set(teamsList)].filter(t => t && String(t).trim() !== '');

                    } else {
                        let rawTeam = msg.senderTeam;
                        if (rawTeam) {
                            if (rawTeam.includes('SOMOSPADEL_BCN')) teamsList.push('SOMOSPADEL');
                            else teamsList.push(rawTeam);
                        }
                    }

                    let bubbleHtml = `<div class="msg-bubble" style="background: ${bgColor}; color: ${textColor}; border: 1.5px solid ${borderColor}; ${isMe ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">`;

                    const teamBadges = this.getTeamBadgesHtml(teamsList);
                    const deleteAction = isSuperAdmin ? `<i class="fas fa-trash-alt" style="margin-left:auto; color:#ef4444; opacity:0.6; cursor:pointer;" onclick="event.stopPropagation(); window.ChatView.deleteMessage('${msg.id}')"></i>` : '';

                    bubbleHtml += `
                        <div style="font-size: 0.72rem; font-weight: 950; margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 4px;">
                            <span onclick="event.stopPropagation(); window.ChatView.showPlayerDetails('${msg.senderId}')" style="cursor: pointer; border-bottom: 1px dotted rgba(0,0,0,0.3); padding-bottom:1px;" title="Ver perfil completo">
                                ${(msg.senderName || 'JUGADOR').toUpperCase()}
                            </span>
                            ${teamBadges}
                            ${deleteAction}
                        </div>
                    `;

                    if (msg.attachment) {
                        if (msg.attachmentType === 'audio') {
                            bubbleHtml += `<audio controls src="${msg.attachment}" style="max-width:200px; height:30px; margin:5px 0; filter: contrast(1.1) brightness(0.9);"></audio>`;
                        } else {
                            bubbleHtml += `<img src="${msg.attachment}" style="max-width:100%; border-radius:8px; margin:5px 0;">`;
                        }
                    }

                    // BROADCAST STYLE ENHANCEMENT
                    if (msg.type === 'broadcast') {
                        bubbleHtml = `
                            <div class="msg-bubble broadcast-alert" style="background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); color: white; border: 2px solid #fee2e2; border-radius: 15px; width: 100%; box-shadow: 0 0 20px rgba(239,68,68,0.4); animation: broadcast-pulse 2s infinite; box-sizing: border-box;">
                                <div style="font-size: 0.6rem; font-weight: 950; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; opacity: 0.9; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-broadcast-tower"></i> COMUNICADO OFICIAL ORGANIZACIÓN
                                </div>
                                <div style="font-weight: 800; font-size: 1rem; line-height: 1.4;">${this.formatMentions(msg.text)}</div>
                                <style>
                                    @keyframes broadcast-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
                                </style>
                            </div>
                        `;
                    } else {
                        bubbleHtml += `<div style="font-weight: 600; font-size: 0.95rem; line-height: 1.4;">${this.formatMentions(msg.text)}</div></div>`;
                    }

                    return `
                        <div class="msg-wrap ${isMe ? 'self' : 'other'}" style="width: ${msg.type === 'broadcast' ? '100%' : 'auto'}; max-width: ${msg.type === 'broadcast' ? '100%' : '85%'}">
                            ${bubbleHtml}
                        </div>`;
                } catch (e) {
                    console.error("Error rendering message:", msg, e);
                    return '';
                }
            }).join('');
            container.scrollTop = container.scrollHeight;
        }

        formatMentions(text) {
            if (!text || typeof text !== 'string' || !text.includes('@')) return text || '';
            let formatted = text;
            try {
                // Solo iteramos sobre los jugadores que tengan nombre definido para evitar crashes
                this.allPlayers.forEach(p => {
                    const name = p.name || p.displayName;
                    if (!name) return;

                    const firstName = name.split(' ')[0];
                    if (!firstName) return;

                    const tag = `@${firstName}`;
                    // Búsqueda insensible a mayúsculas para las menciones
                    if (formatted.toUpperCase().includes(tag.toUpperCase())) {
                        const regex = new RegExp(tag, 'gi');
                        formatted = formatted.replace(regex, `<b style="color:#CCFF00">${tag.toUpperCase()}</b>`);
                    }
                });
            } catch (e) {
                console.warn("Error processing mentions:", e);
            }
            return formatted;
        }

        async sendMessage() {
            const input = document.getElementById('ops-input');
            const text = input.value.trim();
            const media = this.pendingAttachment;
            if (!text && !media) return;
            input.value = '';
            this.clearPreview();
            await window.ChatService.sendMessage(this.eventId, text, media);

            // NOTIFICATIONS TRIGGER (Peer-to-Peer)
            try {
                if (window.NotificationService && this.participantIds && this.participantIds.length > 0) {
                    const currentUser = window.Store.getState('currentUser');
                    const myId = currentUser?.uid || currentUser?.id;
                    const senderName = currentUser?.name || 'Compañero';

                    // Filter: Not self, and max limit to avoid spamming 800 people if logic fails
                    const targets = this.participantIds.filter(id => id !== myId);

                    // Limit to reasonable number to prevent browser hang on huge lists (though usually < 40)
                    if (targets.length < 50) {
                        const notifBody = text || (media ? '📷 Foto enviada' : 'Nuevo mensaje');
                        const truncatedBody = notifBody.length > 30 ? notifBody.substring(0, 30) + '...' : notifBody;

                        // Send to others
                        targets.forEach(targetId => {
                            window.NotificationService.sendNotificationToUser(
                                targetId,
                                `Nuevo mensaje en ${this.eventName}`,
                                `${senderName}: ${truncatedBody}`,
                                { url: 'live', eventId: this.eventId }
                            ).catch(e => console.warn("Failed to notify peer", targetId));
                        });
                    }
                }
            } catch (e) { console.error("Notification trigger error", e); }
        }

        async deleteMessage(messageId) {
            if (confirm("¿Eliminar este mensaje permanentemente?")) {
                const res = await window.ChatService.deleteMessage(this.eventId, messageId);
                if (!res.success) alert("Error al eliminar: " + res.error);
            }
        }

        async handleSOS() {
            const active = document.getElementById('sos-toggle-btn')?.classList.contains('active');
            await window.ChatService.toggleSOS(this.eventId, !active);
        }
    }
    window.ChatView = new ChatView();
})();

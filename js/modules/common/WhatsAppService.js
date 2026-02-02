/**
 * WhatsAppService.js - VERSION 7.0
 * 🛡️ ULTRA-ROBUST EMOJI ENCODING USING ASCII-ONLY SOURCE CODE.
 * Customized layout and empty slot handling.
 */

window.WhatsAppService = {

    /**
     * Emojis as explicit Char Codes (Surrogate pairs)
     */
    E: {
        SPARKLE: String.fromCharCode(10024),                      // ✨ (U+2728)
        TENNIS: String.fromCharCode(55356, 57278),                // 🎾 (U+1F3BE)
        MALE: String.fromCharCode(55357, 57017),                  // 🚹 (U+1F6B9)
        FEMALE: String.fromCharCode(55357, 57018),                // 🚺 (U+1F6BA)
        MIXED: String.fromCharCode(55357, 57019),                 // 🚻 (U+1F6BB)
        CALENDAR: String.fromCharCode(55357, 56517),               // 📅 (U+1F4C5)
        TIMER: String.fromCharCode(9201, 65039),                  // ⏱️ (U+23F1)
        DRUM: String.fromCharCode(55358, 56641),                  // 🥁 (U+1F941)
        WATER: String.fromCharCode(55357, 56486),                 // 💦 (U+1F4A6)
        GIFT: String.fromCharCode(55356, 57217),                  // 🎁 (U+1F381)
        PIN: String.fromCharCode(55357, 56525),                   // 📍 (U+1F4CC)
        MONEY: String.fromCharCode(55357, 56496),                  // 💰 (U+1F4B0)
        RED: String.fromCharCode(55357, 56628),                    // 🔴 (U+1F534)
        STAR: String.fromCharCode(11088, 65039),                   // ⭐ (U+2B50)
        BOLT: String.fromCharCode(9889),                          // ⚡ (U+26A1)
        LINK: String.fromCharCode(55357, 56599),                  // 🔗 (U+1F517)
        DOWN: String.fromCharCode(55357, 56391),                  // 👇 (U+1F447)
        BALANCE: String.fromCharCode(9878, 65039),                 // ⚖️ (U+2696)
        EURO: String.fromCharCode(8364),                           // € (U+20AC)
        TROPHY: String.fromCharCode(55356, 57286)                  // 🏆 (U+1F3C6)
    },

    /**
     * Generates a formatted message for an event (Legacy Layout from Image)
     */
    generateMessage(event, richPlayers = null) {
        if (!event) return '';
        const E = this.E;

        const type = (event.category || 'open').toLowerCase();
        const isMale = type === 'male' || type === 'masculina';
        const isFemale = type === 'female' || type === 'femenina';
        const isMixed = type === 'mixed' || type === 'mixto' || type === 'mixta';
        const isAmericana = (event.name || '').toUpperCase().includes('AMERICANA') || event.type === 'americana';

        // Header
        let headerTitle = 'ENTRENO';
        let headerEmoji = E.TENNIS;
        if (isMale) { headerEmoji = E.TENNIS + E.MALE; headerTitle = 'ENTRENO MASCULINO'; }
        else if (isFemale) { headerEmoji = E.TENNIS + E.FEMALE; headerTitle = 'ENTRENO FEMENINO'; }
        else if (isMixed) { headerEmoji = E.TENNIS + E.MIXED; headerTitle = 'ENTRENO MIXTO'; }

        if (isAmericana) headerTitle = headerTitle.replace('ENTRENO', 'AMERICANA');

        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const endTimeStr = event.time_end ? " a " + event.time_end : '';
        const location = event.location || 'Barcelona Padel el Prat';

        const players = event.players || [];
        const maxPlayers = (parseInt(event.max_courts) || 4) * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);

        const pMember = event.price_members || 20;
        const pExt = event.price_external || 25;

        // Build Message
        let msg = E.SPARKLE + " " + headerEmoji + " *APP SOMOSPADEL BCN* " + headerEmoji + " " + E.SPARKLE + "\n";
        msg += "--------------------------\n";
        msg += E.CALENDAR + " *Fecha:* " + dateStr + "\n";
        msg += E.TIMER + " *Hora:* " + timeStr + endTimeStr + "\n";
        msg += E.TROPHY + " *Formato:* " + headerTitle + "\n";
        msg += E.DRUM + " *Tipo:* " + (event.pair_mode === 'rotating' ? 'Individual / Twister' : 'Pareja Fija') + "\n";
        msg += E.WATER + " agua para cada jugador\n";

        if (isAmericana) {
            msg += E.GIFT + " bravas + 2 refrescos para los ganadores\n";
        }

        msg += E.PIN + " *Lugar:* " + location + "\n";
        msg += E.TENNIS + " Pelotas nuevas\n";
        msg += E.MONEY + " " + pMember + E.EURO + " jugadores - " + pExt + E.EURO + " externos\n";
        msg += "--------------------------\n\n";

        if (spotsLeft === 0) msg += E.RED + " *COMPLETO*\n\n";
        else msg += E.STAR + " *" + spotsLeft + " PLAZAS LIBRES*\n\n";

        if ((isMixed || isFemale) && richPlayers) {
            const m = richPlayers.filter(p => ['male', 'chico', 'hombre', 'masculino'].includes((p.gender || '').toLowerCase())).length;
            const f = richPlayers.filter(p => ['female', 'chica', 'mujer', 'femenino'].includes((p.gender || '').toLowerCase())).length;

            if (isMixed && (m + f > 0)) {
                msg += E.BALANCE + " *Balance:* " + E.MALE + " " + m + " - " + E.FEMALE + " " + f + "\n\n";
            } else if (isFemale && f > 0) {
                msg += E.BALANCE + " *Jugadoras:* " + E.FEMALE + " " + f + "\n\n";
            }
        }

        msg += "*Jugadores*\n\n";

        const displayList = richPlayers || players;
        displayList.forEach((p, index) => {
            let pName = p.name ? p.name.trim() : 'Jugador';
            let gIcon = '👤 ';
            const g = (p.gender || '').toLowerCase();
            if (['male', 'chico', 'hombre', 'masculino'].includes(g)) gIcon = E.MALE + " ";
            else if (['female', 'chica', 'mujer', 'femenino'].includes(g)) gIcon = E.FEMALE + " ";

            const lvl = p.level || p.playtomic_level || '';
            const lvlStr = lvl ? " (" + E.BOLT + "*N" + lvl + "*)" : "";

            // --- EQUIPO LOGIC ---
            let teamStr = " _[EXTERNO]_";
            const teams = p.teams || p.team_somospadel || p.EQUIPOS || p.equipos || p.Equipos;
            if (teams) {
                const tArray = Array.isArray(teams) ? teams : String(teams).split(',').map(t => t.trim());
                const tName = tArray.find(t => t && t.length > 0);
                if (tName) teamStr = " _[" + tName.toUpperCase() + "]_";
            }

            msg += (index + 1) + ". " + gIcon + pName + lvlStr + teamStr + "\n";
        });

        // Vacancies
        for (let i = players.length; i < maxPlayers; i++) {
            msg += (i + 1) + ". " + E.TENNIS + " \n";
        }

        // Base URL logic
        const baseUrl = "https://somospadelbarcelona.github.io/Americanas-somospadel";
        const sectionHash = isAmericana ? "#americanas" : "#entrenos";
        const finalUrl = `${baseUrl}/${sectionHash}`;

        msg += "\n" + E.DOWN + " *INSCRIBETE AQUI:* \n";
        msg += E.LINK + " " + finalUrl + "\n";

        return msg;
    },

    /**
     * Opens WhatsApp with the pre-filled message
     */
    async shareStartFromAdmin(event) {
        try {
            console.log("📤 WhatsApp Share Start (V7.0)");
            let richPlayers = null;

            // Optimization: Fetch players only if needed and try to be fast
            if (event.players && event.players.length > 0) {
                try {
                    // Try to get cached players from Admin context if available to save time
                    let allUsers = window._allPlayersCache;
                    if (!allUsers) {
                        console.log("⏱️ Fetching players for share...");
                        allUsers = await window.FirebaseDB.players.getAll();
                        window._allPlayersCache = allUsers; // Cache it
                    }

                    richPlayers = event.players.map(p => {
                        const pid = (typeof p === 'string') ? p : (p.id || p.uid);
                        const user = allUsers.find(u => (u.id === pid) || (u.uid === pid));
                        return {
                            ...p,
                            name: (user ? user.name : (p.name || 'Jugador')),
                            level: user ? (user.level || user.self_rate_level || p.level) : p.level,
                            gender: user ? user.gender : (p.gender || null),
                            teams: user ? (user.team_somospadel || user.EQUIPOS || user.equipos || user.Equipos) : (p.teams || p.team_somospadel || p.EQUIPOS || null)
                        };
                    });
                } catch (err) { console.warn("Player enrichment failed, using basic data", err); }
            }

            const text = this.generateMessage(event, richPlayers);
            const encodedText = encodeURIComponent(text);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS;

            if (isMobile && navigator.share) {
                try {
                    await navigator.share({
                        title: 'Evento Somospadel',
                        text: text
                    });
                    return;
                } catch (e) { console.warn("Native share failed", e); }
            }

            const url = "https://api.whatsapp.com/send?text=" + encodedText;

            if (isIOS) {
                window.location.href = url;
            } else {
                window.open(url, '_blank');
            }
        } catch (e) {
            console.error("WhatsApp Error:", e);
            alert("Error al compartir en WhatsApp");
        }
    },

    _formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString + 'T12:00:00');
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            let f = new Intl.DateTimeFormat('es-ES', options).format(date);
            return f.charAt(0).toUpperCase() + f.slice(1);
        } catch (e) { return dateString; }
    }
};

console.log("💬 WhatsAppService V7.0 Loaded");

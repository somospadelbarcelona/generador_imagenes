/**
 * AmericanaLogic.js
 * The "Brain" of the operation. 
 * Handles local state for the active Americana: Timer, Matches, Scores.
 */
(function () {
    class AmericanaLogic {
        constructor() {
            this.initialState = {
                active: false,
                currentRoundIndex: 0, // 0-based index for array access
                totalRounds: 6,
                roundTimeSeconds: 20 * 60, // 20 minutes default
                timerRunning: false,
                timeLeft: 20 * 60,
                rounds: [], // Array of Round Objects { number, matches, startTime, status }
                lockNextRound: true
            };
            this.state = { ...this.initialState };
            this.timerInterval = null;
        }

        resetTournament() {
            console.warn("⚠️ RESET TOTAL EXECUTED");
            this.pauseTimer();
            this.state = { ...this.initialState };
            this.broadcast();
            setTimeout(() => window.location.reload(), 500);
        }

        /**
         * INITIALIZE A NEW TOURNAMENT SESSION
         * Generates ALL rounds at once.
         */
        startTournament(config) {
            console.log("🏆 Starting Tournament Logic (Full Schedule)", config);
            this.state.active = true;
            this.state.totalRounds = 6; // Fixed per user request
            this.state.currentRoundIndex = 0;
            this.state.roundTimeSeconds = 20 * 60; // 20 min

            const courts = config.courts || 6; // Default to 6 courts
            const startTimeBase = new Date();
            startTimeBase.setMinutes(0, 0, 0); // Start at next full hour roughly, or now.
            // Let's just say starts "Now" for demo.

            this.state.rounds = [];
            for (let i = 0; i < this.state.totalRounds; i++) {
                // Calculate time slot: Start + i * 20 min
                const roundTime = new Date(startTimeBase.getTime() + i * 20 * 60000);
                const timeString = `${roundTime.getHours()}:${roundTime.getMinutes().toString().padStart(2, '0')}`;

                this.state.rounds.push({
                    number: i + 1,
                    matches: this.generateMatchesForRound(courts, i + 1),
                    timeSlot: timeString, // e.g. "10:00"
                    status: i === 0 ? 'READY' : 'SCHEDULED' // First one ready
                });
            }

            this.state.timeLeft = this.state.roundTimeSeconds;
            // this.startTimer(); // Maybe don't auto-start timer, let user do it.
            this.broadcast();
        }

        /**
         * MATCH MANAGEMENT
         */
        recordResult(courtId, team, change) {
            const currentRound = this.state.rounds[this.state.currentRoundIndex];
            if (!currentRound) return;

            const match = currentRound.matches.find(m => m.court === courtId);
            if (!match) return;

            if (typeof match.scoreA !== 'number') match.scoreA = 0;
            if (typeof match.scoreB !== 'number') match.scoreB = 0;

            if (team === 'A') match.scoreA = Math.max(0, match.scoreA + change);
            if (team === 'B') match.scoreB = Math.max(0, match.scoreB + change);

            this.broadcast();
        }

        finalizeMatch(courtId) {
            const currentRound = this.state.rounds[this.state.currentRoundIndex];
            if (!currentRound) return;

            const match = currentRound.matches.find(m => m.court === courtId);
            if (match) {
                match.isFinished = true;
                // this.checkRoundComplete();
                this.broadcast();
            }
        }

        toggleMatchStatus(courtId) {
            const currentRound = this.state.rounds[this.state.currentRoundIndex];
            if (!currentRound) return;
            const match = currentRound.matches.find(m => m.court === courtId);
            if (match) {
                match.isFinished = !match.isFinished;
                this.broadcast();
            }
        }

        reopenMatch(courtId) {
            const currentRound = this.state.rounds[this.state.currentRoundIndex];
            if (!currentRound) return;

            const match = currentRound.matches.find(m => m.court === courtId);
            if (match) {
                match.isFinished = false;
                this.broadcast();
            }
        }

        // Navigation Actions
        goToRound(roundNumber) { // 1-based
            if (roundNumber < 1 || roundNumber > this.state.rounds.length) return;
            this.state.currentRoundIndex = roundNumber - 1;
            this.broadcast();
        }

        nextRound() {
            if (this.state.currentRoundIndex < this.state.rounds.length - 1) {
                this.state.currentRoundIndex++;
                this.state.timeLeft = this.state.roundTimeSeconds; // Reset timer for new round
                // this.startTimer();
                this.broadcast();
            }
        }

        generateMatchesForRound(courtCount, roundNum) {
            const matches = [];
            for (let i = 1; i <= courtCount; i++) {
                const teamA_level = (Math.random() * 2 + 3).toFixed(2); // Mock for demo
                const teamB_level = (Math.random() * 2 + 3).toFixed(2);

                matches.push({
                    court: i,
                    teamA: `Pareja ${i}A (R${roundNum})`,
                    teamB: `Pareja ${i}B (R${roundNum})`,
                    teamA_level: parseFloat(teamA_level),
                    teamB_level: parseFloat(teamB_level),
                    scoreA: 0,
                    scoreB: 0,
                    isFinished: false,
                    category: '4ª FEMENINA',
                    quality: this.predictMatchQuality(teamA_level, teamB_level)
                });
            }
            return matches;
        }

        /**
         * AI PREDICTOR: Calculate match balance
         * Returns { score: 0-100, label: string }
         */
        predictMatchQuality(levA, levB) {
            const diff = Math.abs(levA - levB);
            const score = Math.max(0, 100 - (diff * 40)); // 1.0 diff = 60/100

            let label = "Equilibrado";
            if (score > 90) label = "Punto a Punto (Élite)";
            else if (score < 40) label = "Desigual (Revisar)";

            return { score: Math.round(score), label };
        }

        /**
         * TIMER LOGIC
         */
        startTimer() {
            if (this.timerRunning) return;
            this.timerRunning = true;
            this.timerInterval = setInterval(() => {
                if (this.state.timeLeft > 0) {
                    this.state.timeLeft--;
                    this.broadcast();
                } else {
                    this.pauseTimer();
                    this.playHorn();
                }
            }, 1000);
        }

        pauseTimer() {
            this.timerRunning = false;
            clearInterval(this.timerInterval);
            this.broadcast();
        }

        toggleTimer() {
            if (this.timerRunning) this.pauseTimer();
            else this.startTimer();
        }

        playHorn() {
            alert("📣 FIN DEL TIEMPO 📣");
        }

        getFormattedTime() {
            const m = Math.floor(this.state.timeLeft / 60);
            const s = this.state.timeLeft % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        }

        /**
         * STATE BROADCAST TO STORE
         */
        broadcast() {
            if (!window.Store) return;

            // Prepare safe UI object
            const currentRoundObj = this.state.rounds[this.state.currentRoundIndex];

            const uiData = {
                currentRound: {
                    number: this.state.currentRoundIndex + 1,
                    totalRounds: this.state.totalRounds,
                    status: this.state.timerRunning ? 'PLAYING' : 'PAUSED',
                    timeLeft: this.getFormattedTime(),
                    // Fallback to empty if not started
                    matches: currentRoundObj ? currentRoundObj.matches : [],
                    timeSlot: currentRoundObj ? currentRoundObj.timeSlot : '--:--'
                },
                roundsSchedule: this.state.rounds.map(r => ({ number: r.number, timeSlot: r.timeSlot }))
            };

            window.Store.setState('dashboardData', uiData);
        }
    }

    window.AmericanaLogic = new AmericanaLogic();
    console.log("🧠 AmericanaLogic (Multi-Round Schedule) Loaded");

})();

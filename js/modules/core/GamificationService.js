/**
 * GamificationService.js
 * 🎮 El Motor de Progreso "Camino del Pro"
 * Gestiona XP, Niveles e Insignias de la comunidad.
 */
(function () {
    'use strict';

    class GamificationService {
        constructor() {
            this.levels = [
                { id: 'novato', name: 'NOVATO', min: 0, next: 500, color: '#94a3b8', icon: '🐣' },
                { id: 'guerrero', name: 'GUERRERO', min: 501, next: 1500, color: '#facc15', icon: '⚔️' },
                { id: 'maestro', name: 'MAESTRO', min: 1501, next: 3000, color: '#0ea5e9', icon: '🧙‍♂️' },
                { id: 'leyenda', name: 'LEYENDA', min: 3001, next: 99999, color: '#CCFF00', icon: '👑' }
            ];

            this.state = this.loadState();
            this.listeners = [];
        }

        loadState() {
            const saved = localStorage.getItem('sp_gamification_state');
            if (saved) return JSON.parse(saved);

            return {
                xp: 120, // Comenzamos con algo de XP para el efecto visual
                totalMatches: 0,
                streak: 1,
                lastUpdate: Date.now()
            };
        }

        saveState() {
            localStorage.setItem('sp_gamification_state', JSON.stringify(this.state));
            this.notify();
        }

        addXP(amount, reason = "ACCION_SISTEMA") {
            const oldLevel = this.getCurrentLevel().id;
            this.state.xp += amount;
            this.state.lastUpdate = Date.now();
            this.saveState();

            const newLevel = this.getCurrentLevel().id;
            if (oldLevel !== newLevel) {
                this.triggerLevelUpEffect(newLevel);
            }

            console.log(`🎮 [XP_GAINED] +${amount} XP por ${reason}. Total: ${this.state.xp}`);
        }

        getCurrentLevel() {
            return this.levels.find(l => this.state.xp <= l.next) || this.levels[this.levels.length - 1];
        }

        getProgress() {
            const level = this.getCurrentLevel();
            const prevNext = this.levels[this.levels.indexOf(level) - 1]?.next || 0;
            const currentRange = level.next - prevNext;
            const relativeXP = this.state.xp - prevNext;
            return Math.min(100, Math.max(0, (relativeXP / currentRange) * 100));
        }

        onUpdate(callback) {
            this.listeners.push(callback);
        }

        notify() {
            const data = {
                state: this.state,
                level: this.getCurrentLevel(),
                progress: this.getProgress()
            };
            this.listeners.forEach(cb => cb(data));
        }

        triggerLevelUpEffect(levelId) {
            // Placeholder para una futura animación WOW
            console.log(`✨ ¡LEVEL UP! Ahora eres ${levelId.toUpperCase()}`);
        }
    }

    window.GamificationService = new GamificationService();
})();

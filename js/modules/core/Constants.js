/**
 * Constants.js
 * Single source of truth for application constants, enums, and configuration.
 */

window.AppConstants = {
    STATUS: {
        OPEN: 'open',
        LIVE: 'live',
        FINISHED: 'finished',
        ADJUSTING: 'adjusting', // Intermediate state for modifying pairs without triggering auto-logic
        PAIRING: 'pairing'
    },

    ROLES: {
        SUPER_ADMIN: 'super_admin',
        ADMIN: 'admin',
        CAPTAIN: 'captain',
        PLAYER: 'player',
        ADMIN_PLAYER: 'admin_player'
    },

    EVENT_TYPES: {
        AMERICANA: 'americana',
        ENTRENO: 'entreno'
    },

    PAIR_MODES: {
        FIXED: 'fixed',
        ROTATING: 'rotating'
    },

    CATEGORIES: {
        MALE: 'male',
        FEMALE: 'female',
        MIXED: 'mixed',
        OPEN: 'open'
    },

    // Default Configuration
    DEFAULTS: {
        MAX_COURTS: 4,
        DURATION: '1h 30m',
        PRICE_MEMBERS: 12,
        PRICE_EXTERNAL: 14,
        TIME: '10:00'
    },

    // Image mappings for auto-sync logic
    IMAGES: {
        PRAT: {
            male: 'img/entreno masculino prat.jpg',
            female: 'img/entreno femenino prat.jpg',
            mixed: 'img/entreno mixto prat.jpg',
            open: 'img/entreno todo prat.jpg'
        },
        DELFOS: {
            male: 'img/entreno masculino delfos.jpg',
            female: 'img/entreno femenino delfos.jpg',
            mixed: 'img/entreno mixto delfos.jpg',
            open: 'img/entreno todo delfos.jpg'
        },
        AMERICANA: {
            male: 'img/americana%20masculina.jpg',
            female: 'img/americana%20femeninas.jpg',
            mixed: 'img/americana%20mixta.jpg',
            open: 'img/americana%20mixta.jpg'
        },
        BALLS: {
            male: 'img/ball-masculina.png',
            female: 'img/ball-femenina.png',
            mixed: 'img/ball-mixta.png'
        }
    },

    // Niveles predefinidos por equipo
    TEAM_LEVELS: {
        '3º Masculino A': 3.75,
        '3º Masculino B': 3.5,
        '4º Masculino': 3,
        '4º Mixto A': 3, // Assuming all 4 mixed are level 3 based on '4ºMIXTO'
        '4º Mixto B': 3,
        '3º Mixto': 3.5,
        '2º Femenino': 3.5,
        '4º Femenino': 3
    }
};

console.log("🚀 AppConstants Loaded");

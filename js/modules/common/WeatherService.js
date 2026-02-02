/**
 * WeatherService.js
 * Service to fetch real-time weather data from Open-Meteo API
 * Zero-auth, free for non-commercial use.
 */

const WeatherService = {
    LOCATIONS: {
        'EL_PRAT': { lat: 41.3278, lon: 2.0947, name: 'EL PRAT' },
        'CORNELLA': { lat: 41.3574, lon: 2.0707, name: 'CORNELLÀ' }
    },

    /**
     * Fetch weather for all defined locations
     */
    async getDashboardWeather() {
        try {
            const promises = Object.values(this.LOCATIONS).map(loc =>
                this.fetchLocationWeather(loc)
            );
            return await Promise.all(promises);
        } catch (e) {
            console.error('[WeatherService] Error fetching dashboard weather:', e);
            return [];
        }
    },

    /**
     * Fetch for a specific location with enhanced "Padel Big Data"
     */
    async fetchLocationWeather(location) {
        try {
            // Added pressure, uv_index and more detailed hourly data
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=precipitation_probability,uv_index,visibility&timezone=Europe%2FMadrid&forecast_days=1`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            if (!data || !data.current) {
                throw new Error('Incomplete data received from weather API');
            }

            const current = data.current;
            const hour = new Date().getHours();

            // Intelligence extraction with fallback values
            const uvIndex = (data.hourly && data.hourly.uv_index) ? (data.hourly.uv_index[hour] || 0) : 0;
            const visibility = (data.hourly && data.hourly.visibility) ? (data.hourly.visibility[hour] || 10000) : 10000;
            const rainProb = (data.hourly && data.hourly.precipitation_probability) ? (data.hourly.precipitation_probability[hour] || 0) : 0;
            const pressure = current.surface_pressure || 1013; // Standard hPa if missing

            // Padel Science Calculations
            const intelligence = this.calculatePadelIntelligence({
                temp: current.temperature_2m || 20,
                humidity: current.relative_humidity_2m || 50,
                pressure: pressure,
                wind: current.wind_speed_10m || 0,
                rain: rainProb,
                uv: uvIndex,
                rain: rainProb,
                uv: uvIndex,
                isDay: current.is_day !== undefined ? current.is_day : 1,
                weatherCode: current.weather_code // Passed for logic
            });

            return {
                name: location.name,
                temp: current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : '--',
                condition: this.getWeatherCondition(current.weather_code),
                icon: this.getWeatherIcon(current.weather_code, current.is_day),
                wind: current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m) : '--',
                humidity: current.relative_humidity_2m || '--',
                rainProb: rainProb,
                uv: uvIndex,
                pressure: pressure,
                visibility: Math.round(visibility / 1000), // km
                intelligence: intelligence,
                isPropitious: intelligence.score > 60
            };
        } catch (e) {
            console.error(`[WeatherService] Failed to fetch for ${location.name}`, e);
            return {
                name: location.name,
                temp: '--',
                intelligence: { score: 0, ballSpeed: 'Variable', recommendation: 'Sin datos' },
                isPropitious: false
            };
        }
    },

    calculatePadelIntelligence(data) {
        let score = 100;

        // 1. DEDUCTIONS FOR PLAYABILITY
        if (data.rain > 5) score -= (data.rain * 1.5);
        if (data.wind > 15) score -= (data.wind - 15) * 2;
        if (data.temp < 8) score -= 15;
        if (data.temp > 35) score -= 10;
        if (data.humidity > 85) score -= 15;

        score = Math.max(0, Math.min(100, Math.round(score)));

        // 2. BALL SPEED PREDICTION
        let speed = 'MEDIA';
        const speedValue = (data.temp * 1) - (data.humidity / 6) + (1013 - data.pressure);
        if (speedValue > 25) speed = 'RÁPIDA';
        if (speedValue < 12) speed = 'LENTA';

        // 3. CONTEXTUAL RECOMMENDATIONS (SMART AI LOGIC)
        let rec = 'Condiciones de juego estándar.';
        const isRainingNow = data.weatherCode >= 51; // Códigos de lluvia

        // Prioridad 1: Lluvia Activa (Lo que se ve)
        if (isRainingNow) {
            if (data.rain > 70) rec = '⚠️ Lluvia intensa: Pista impracticable. Busca indoor.';
            else rec = '🌧️ Pista mojada: La bola pesará mucho y resbalará.';
        }
        // Prioridad 2: Viento (Molesta mucho)
        else if (data.wind > 28) {
            rec = '💨 Vendaval: Juega por abajo y evita los globos.';
        }
        // Prioridad 3: Calor Extremo
        else if (data.temp > 30) {
            rec = '🔥 Calor sofocante: La bola vuela mucho. ¡Hidrátate!';
        }
        // Prioridad 4: Riesgo de Lluvia (Futuro) pero NO llueve ahora
        else if (data.rain > 30 && !isRainingNow) {
            rec = 'cloud-sun-rain Riesgo de lluvia: El cielo amenaza, pero se puede jugar.';
        }
        // Prioridad 5: Frío
        else if (data.temp < 10) {
            rec = '❄️ Frío: La bola apenas rebota. Usa más fuerza y flexiona.';
        }
        // Prioridad 6: Humedad (Cristales)
        else if (data.humidity > 85) {
            rec = '💧 Humedad alta: Cuidado con los cristales, la bola cae al tocar.';
        }
        // Prioridad 7: Condiciones Ideales
        else {
            if (data.isDay) rec = '☀️ Día perfecto: Condiciones ideales para sacarla x3.';
            else rec = '🌙 Noche despejada: Visibilidad perfecta y temperatura agradable.';
        }

        return {
            score: score,
            ballSpeed: speed,
            recommendation: rec,
            uvLevel: data.uv > 5 ? 'ALTO' : 'BAJO',
            gripStatus: data.humidity > 85 ? 'HÚMEDO' : 'SECO'
        };
    },

    /**
     * Map WMO codes to text
     */
    getWeatherCondition(code) {
        const codes = {
            0: 'Cielo Despejado',
            1: 'Mayormente Despejado',
            2: 'Parcialmente Nublado',
            3: 'Nublado',
            45: 'Niebla', 48: 'Niebla con Escarcha',
            51: 'Llovizna Ligera', 53: 'Llovizna Moderada', 55: 'Llovizna Densa',
            61: 'Lluvia Débil', 63: 'Lluvia Moderada', 65: 'Lluvia Fuerte',
            80: 'Chubascos Aislados', 81: 'Chubascos', 82: 'Chubascos Violentos',
            95: 'Tormenta Eléctrica', 96: 'Tormenta con Granizo', 99: 'Tormenta Severa'
        };
        return codes[code] || 'Condiciones Variables';
    },

    /**
     * Map WMO codes to Emojis
     */
    getWeatherIcon(code, isDay) {
        if (code === 0) return isDay ? '☀️' : '🌙';
        if (code >= 1 && code <= 3) return isDay ? '🌤️' : '☁️';
        if (code >= 45 && code <= 48) return '🌫️';
        if (code >= 51 && code <= 67) return '🌧️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code >= 95) return '⛈️';
        return '🌤️';
    }
};

window.WeatherService = WeatherService;

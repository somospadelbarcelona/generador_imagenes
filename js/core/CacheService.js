/**
 * CacheService.js
 * Optimized storage for persistent app data (Players, Stats, Config)
 * Reduces Firebase reads and accelerates load times to near-instant.
 */
(function () {
    class CacheService {
        constructor() {
            this.prefix = 'somospadel_cache_';
            this.TTL = 1000 * 60 * 60 * 24; // 24 hours default TTL
        }

        /**
         * Save data with a timestamp
         * @param {string} key 
         * @param {any} data 
         * @param {number} customTTL ms
         */
        set(key, data, customTTL = null) {
            try {
                const entry = {
                    data: data,
                    timestamp: Date.now(),
                    expires: Date.now() + (customTTL || this.TTL)
                };
                localStorage.setItem(this.prefix + key, JSON.stringify(entry));
            } catch (e) {
                console.warn("[CacheService] Error saving to localStorage:", e);
                // If storage is full, clear old cache
                if (e.name === 'QuotaExceededError') {
                    this.clearExpired();
                }
            }
        }

        /**
         * Get data if not expired
         * @param {string} key 
         * @returns {any|null}
         */
        get(key) {
            const entryStr = localStorage.getItem(this.prefix + key);
            if (!entryStr) return null;

            try {
                const entry = JSON.parse(entryStr);
                if (Date.now() > entry.expires) {
                    localStorage.removeItem(this.prefix + key);
                    return null;
                }
                return entry.data;
            } catch (e) {
                return null;
            }
        }

        /**
         * Remove specific key
         */
        remove(key) {
            localStorage.removeItem(this.prefix + key);
        }

        /**
         * Clear all app-related cache
         */
        clearAll() {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            console.log("🧹 [CacheService] Global cache cleared.");
        }

        /**
         * Clear only expired entries
         */
        clearExpired() {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    try {
                        const entry = JSON.parse(localStorage.getItem(key));
                        if (Date.now() > entry.expires) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) { }
                }
            });
        }

        /**
         * Helper for specific modules (Players)
         */
        async getOrFetch(key, fetchFn, ttl) {
            const cached = this.get(key);
            if (cached) return cached;

            const fresh = await fetchFn();
            if (fresh) this.set(key, fresh, ttl);
            return fresh;
        }
    }

    window.CacheService = new CacheService();
    console.log("⚡ [CacheService] Smart caching layer active.");
})();

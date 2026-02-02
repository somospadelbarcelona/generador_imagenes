/**
 * DatabaseService.js (Global Version)
 * Wrapper para Firestore global.
 */
(function () {
    const db = window.firebase ? firebase.firestore() : null;

    class DatabaseService {
        constructor(collectionName) {
            this.collectionName = collectionName;
            this.collection = db ? db.collection(collectionName) : null;
        }

        async getAll() {
            if (!this.collection) return [];

            // Smart Cache for specific collections (like players)
            const cacheKey = `all_${this.collectionName}`;
            if (window.CacheService) {
                const cached = window.CacheService.get(cacheKey);
                if (cached) {
                    console.log(`🚀 [Cache] Serving ${this.collectionName} from LocalStorage`);
                    return cached;
                }
            }

            const snapshot = await this.collection.get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (window.CacheService && data.length > 0) {
                window.CacheService.set(cacheKey, data, 1000 * 60 * 15); // Cache for 15 mins
            }
            return data;
        }

        async getById(id) {
            if (!this.collection) return null;

            const cacheKey = `doc_${this.collectionName}_${id}`;
            if (window.CacheService) {
                const cached = window.CacheService.get(cacheKey);
                if (cached) return cached;
            }

            const doc = await this.collection.doc(id).get();
            if (!doc.exists) return null;
            const data = { id: doc.id, ...doc.data() };

            if (window.CacheService) {
                window.CacheService.set(cacheKey, data, 1000 * 60 * 60); // Cache individual docs for 1h
            }
            return data;
        }

        async create(data) {
            if (!this.collection) return { id: 'offline-' + Date.now(), ...data };
            const docRef = await this.collection.add({
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Clear cache for this collection
            if (window.CacheService) window.CacheService.remove(`all_${this.collectionName}`);
            return { id: docRef.id, ...data };
        }

        async update(id, data) {
            if (!this.collection) return { id, ...data };
            await this.collection.doc(id).update(data);
            // Clear cache
            if (window.CacheService) {
                window.CacheService.remove(`all_${this.collectionName}`);
                window.CacheService.remove(`doc_${this.collectionName}_${id}`);
            }
            return { id, ...data };
        }

        async delete(id) {
            if (!this.collection) return;
            await this.collection.doc(id).delete();
            // Clear cache
            if (window.CacheService) {
                window.CacheService.remove(`all_${this.collectionName}`);
                window.CacheService.remove(`doc_${this.collectionName}_${id}`);
            }
        }
    }

    // Factory method exposed globally
    window.createService = (collectionName) => new DatabaseService(collectionName);
    console.log("💾 DatabaseService Global Loaded");
})();

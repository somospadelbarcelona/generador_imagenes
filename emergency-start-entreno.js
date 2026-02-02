/**
 * MANUAL START ENTRENO - Emergency Console Command
 * Ejecuta esto en la consola del navegador para forzar el inicio del entreno
 */

// PASO 1: Obtener el ID del entreno desde la tarjeta visible
const entrenoId = 'PEGA_AQUI_EL_ID_DEL_ENTRENO'; // Reemplaza con el ID real

// PASO 2: Actualizar el estado a 'live' en Firebase
async function forceStartEntreno(id) {
    if (!window.db) {
        console.error("❌ Firebase no está inicializado");
        return;
    }

    try {
        await window.db.collection('entrenos').doc(id).update({
            status: 'live'
        });
        console.log("✅ Entreno iniciado manualmente. ID:", id);
        console.log("🔄 Recarga la página para ver los cambios");

        // Auto-reload
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        console.error("❌ Error al iniciar entreno:", error);
    }
}

// PASO 3: Ejecutar
// forceStartEntreno(entrenoId);

console.log("📋 INSTRUCCIONES:");
console.log("1. Reemplaza 'PEGA_AQUI_EL_ID_DEL_ENTRENO' con el ID real del entreno");
console.log("2. Descomenta la última línea (quita el //)");
console.log("3. Presiona Enter");

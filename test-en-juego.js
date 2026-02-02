/**
 * TEST SCRIPT - EN JUEGO Button Functionality
 * Ejecuta esto en la consola del navegador DESPUÉS de recargar la página
 */

console.log("🧪 ===== TEST DE FUNCIONALIDAD EN JUEGO =====");

// 1. Verificar que ControlTowerView está cargado
console.log("\n1️⃣ VERIFICANDO CONTROLTOWERVIEW:");
console.log("   window.ControlTowerView existe:", typeof window.ControlTowerView !== 'undefined');
console.log("   window.ControlTowerViewClass existe:", typeof window.ControlTowerViewClass !== 'undefined');

if (window.ControlTowerView) {
    console.log("   ✅ ControlTowerView cargado correctamente");
    console.log("   Métodos disponibles:", Object.getOwnPropertyNames(Object.getPrototypeOf(window.ControlTowerView)));
} else {
    console.error("   ❌ ControlTowerView NO está cargado");
    if (window.ControlTowerViewClass) {
        console.log("   ⚠️ Intentando instanciar manualmente...");
        try {
            window.ControlTowerView = new window.ControlTowerViewClass();
            console.log("   ✅ Instanciado correctamente");
        } catch (e) {
            console.error("   ❌ Error al instanciar:", e);
        }
    }
}

// 2. Verificar que Router está cargado
console.log("\n2️⃣ VERIFICANDO ROUTER:");
console.log("   window.Router existe:", typeof window.Router !== 'undefined');
if (window.Router) {
    console.log("   ✅ Router cargado correctamente");
    console.log("   Rutas disponibles:", Object.keys(window.Router.routes || {}));
} else {
    console.error("   ❌ Router NO está cargado");
}

// 3. Verificar que EventsController está cargado
console.log("\n3️⃣ VERIFICANDO EVENTSCONTROLLER:");
console.log("   window.EventsController existe:", typeof window.EventsController !== 'undefined');
if (window.EventsController) {
    console.log("   ✅ EventsController cargado correctamente");
    console.log("   Método openLiveEvent existe:", typeof window.EventsController.openLiveEvent === 'function');
} else {
    console.error("   ❌ EventsController NO está cargado");
}

// 4. Verificar función global openLiveEvent
console.log("\n4️⃣ VERIFICANDO FUNCIÓN GLOBAL:");
console.log("   window.openLiveEvent existe:", typeof window.openLiveEvent !== 'undefined');

// 5. Test de simulación de clic
console.log("\n5️⃣ SIMULACIÓN DE CLIC EN BOTÓN EN JUEGO:");
console.log("   Para probar manualmente, ejecuta:");
console.log("   window.openLiveEvent('ID_DEL_ENTRENO', 'entreno')");
console.log("   (Reemplaza ID_DEL_ENTRENO con el ID real)");

// 6. Verificar entrenos cargados
console.log("\n6️⃣ VERIFICANDO ENTRENOS CARGADOS:");
if (window.EventsController && window.EventsController.state) {
    const entrenos = window.EventsController.state.entrenos;
    console.log("   Entrenos en estado:", entrenos);

    if (entrenos && entrenos.length > 0) {
        console.log("   Total entrenos:", entrenos.length);

        // Buscar entrenos que deberían mostrar botón EN JUEGO
        const now = new Date();
        entrenos.forEach((e, i) => {
            const hasStarted = window.EventsController.hasEventStarted(e.date, e.time);
            const isLive = e.status === 'live' || (e.status === 'open' && hasStarted);

            console.log(`\n   Entreno ${i + 1}: ${e.name}`);
            console.log(`      ID: ${e.id}`);
            console.log(`      Fecha: ${e.date} ${e.time}`);
            console.log(`      Status: ${e.status}`);
            console.log(`      Ha empezado: ${hasStarted}`);
            console.log(`      isLive: ${isLive}`);
            console.log(`      Debería mostrar EN JUEGO: ${isLive ? '✅ SÍ' : '❌ NO'}`);

            if (isLive) {
                console.log(`      🎯 COMANDO PARA PROBAR: window.openLiveEvent('${e.id}', 'entreno')`);
            }
        });
    } else {
        console.log("   ⚠️ No hay entrenos cargados");
    }
} else {
    console.error("   ❌ No se puede acceder al estado de EventsController");
}

console.log("\n🧪 ===== FIN DEL TEST =====");
console.log("📋 Si ves errores ❌, copia toda esta salida y envíala");

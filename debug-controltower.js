/**
 * DEBUG SCRIPT - Control Tower Access
 * Ejecuta esto en la consola del navegador para diagnosticar el problema
 */

console.log("🔍 ===== DIAGNÓSTICO DE ACCESO A EN JUEGO =====");

// 1. Verificar que ControlTowerView existe
console.log("1️⃣ ¿Existe window.ControlTowerView?", typeof window.ControlTowerView !== 'undefined');
console.log("   Valor:", window.ControlTowerView);

// 2. Verificar que ControlTowerViewClass existe
console.log("2️⃣ ¿Existe window.ControlTowerViewClass?", typeof window.ControlTowerViewClass !== 'undefined');
console.log("   Valor:", window.ControlTowerViewClass);

// 3. Verificar que Router existe
console.log("3️⃣ ¿Existe window.Router?", typeof window.Router !== 'undefined');
console.log("   Valor:", window.Router);

// 4. Verificar que EventsController existe
console.log("4️⃣ ¿Existe window.EventsController?", typeof window.EventsController !== 'undefined');
console.log("   Valor:", window.EventsController);

// 5. Verificar función openLiveEvent
console.log("5️⃣ ¿Existe window.openLiveEvent?", typeof window.openLiveEvent !== 'undefined');
console.log("   Valor:", window.openLiveEvent);

// 6. Verificar que Firebase está inicializado
console.log("6️⃣ ¿Existe window.db?", typeof window.db !== 'undefined');
console.log("   Valor:", window.db);

// 7. Intentar instanciar ControlTowerView manualmente si falta
if (!window.ControlTowerView && window.ControlTowerViewClass) {
    console.log("⚠️ Intentando instanciar ControlTowerView manualmente...");
    try {
        window.ControlTowerView = new window.ControlTowerViewClass();
        console.log("✅ ControlTowerView instanciado correctamente");
    } catch (e) {
        console.error("❌ Error al instanciar:", e);
    }
}

// 8. Verificar errores en la consola
console.log("8️⃣ Revisa si hay errores de sintaxis arriba en la consola");

console.log("🔍 ===== FIN DEL DIAGNÓSTICO =====");
console.log("📋 COPIA TODA ESTA SALIDA Y ENVÍALA AL DESARROLLADOR");

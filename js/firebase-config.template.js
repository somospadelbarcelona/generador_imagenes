// ============================================
// FIREBASE CONFIGURATION TEMPLATE
// ============================================
// 
// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un nuevo proyecto (o selecciona uno existente)
// 3. Ve a "Project Settings" (⚙️) > "General"
// 4. En "Your apps", selecciona "Web" (</> icono)
// 5. Registra tu app y copia la configuración
// 6. COPIA ESTE ARCHIVO a "firebase-config.js"
// 7. Reemplaza los valores de abajo con los de tu proyecto
//
// IMPORTANTE: 
// - NO subas firebase-config.js a GitHub (está en .gitignore)
// - Mantén este template para referencia
// ============================================

const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// NO MODIFICAR ESTA LÍNEA
window.FIREBASE_CONFIG = firebaseConfig;

# 🔐 GUÍA DE DESPLIEGUE - REGLAS DE SEGURIDAD FIREBASE

## 📋 Resumen de las Reglas

Las reglas de seguridad configuradas permiten:

### ✅ **Super Admin** (`role: 'super_admin'`)
- ✅ Lectura total
- ✅ Escritura total
- ✅ Borrado total
- ✅ Gestión de menú y configuración

### ✅ **Admin Player** (`role: 'admin_player'`)
- ✅ Lectura total
- ✅ Escritura total (excepto menú)
- ✅ Borrado total (excepto menú)
- ✅ Gestión de jugadores, eventos, partidos

### 👤 **Jugadores Normales** (`role: 'player'`)
- ✅ Lectura de todos los datos
- ✅ Actualización de su propio perfil (campos limitados)
- ❌ No pueden cambiar su rol, estado o partidos jugados
- ❌ No pueden borrar datos

---

## 🚀 OPCIÓN 1: Desplegar desde Firebase Console (MÁS RÁPIDO)

### Paso 1: Acceder a Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto **"App Somospadel BCN"**
3. En el menú lateral, ve a **"Firestore Database"**
4. Haz clic en la pestaña **"Reglas"** (Rules)

### Paso 2: Copiar las Reglas
1. Abre el archivo `firestore.rules` que acabamos de crear
2. **Copia TODO el contenido** del archivo
3. **Pega** el contenido en el editor de reglas de Firebase Console

### Paso 3: Publicar
1. Haz clic en **"Publicar"** (Publish)
2. Espera la confirmación ✅
3. **¡LISTO!** Las reglas están activas

---

## 🛠️ OPCIÓN 2: Desplegar con Firebase CLI (PROFESIONAL)

### Prerequisitos
Necesitas tener instalado Firebase CLI. Si no lo tienes:

```powershell
npm install -g firebase-tools
```

### Paso 1: Iniciar sesión en Firebase
```powershell
firebase login
```

### Paso 2: Inicializar el proyecto (solo la primera vez)
```powershell
cd C:\Users\acoscolin\Desktop\ALEX\AMERICANAS
firebase init firestore
```

**Selecciona:**
- ✅ Use an existing project
- ✅ Selecciona tu proyecto
- ✅ Firestore rules file: `firestore.rules` (ya existe)
- ✅ Firestore indexes file: `firestore.indexes.json` (crear si no existe)

### Paso 3: Desplegar las reglas
```powershell
firebase deploy --only firestore:rules
```

### Paso 4: Verificar
```powershell
firebase firestore:rules:get
```

---

## 🧪 VERIFICAR QUE FUNCIONAN

### Test 1: Verificar que puedes borrar jugadores
1. Ve a la sección **"Base de Datos"** en tu app
2. Intenta borrar un jugador de prueba
3. Debería borrarse correctamente ✅

### Test 2: Verificar que un jugador normal NO puede borrar
1. Inicia sesión como jugador normal (no admin)
2. Intenta borrar algo desde la consola del navegador:
```javascript
db.collection('players').doc('ALGUNA_ID').delete()
```
3. Debería dar error de permisos ❌

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "Missing or insufficient permissions"
**Causa:** Las reglas antiguas siguen activas
**Solución:** Vuelve a publicar las reglas desde Firebase Console

### ❌ Error: "Function get() requires a valid document path"
**Causa:** El usuario no existe en la colección `players`
**Solución:** Asegúrate de que tu usuario tiene un documento en `players` con el mismo `uid` que tu autenticación

### ❌ Los borrados siguen sin funcionar
**Posibles causas:**
1. Las reglas no se publicaron correctamente
2. Tu usuario no tiene rol de admin en la base de datos
3. Hay un problema de caché en Firebase

**Solución:**
```javascript
// Verifica tu rol actual ejecutando esto en la consola:
const currentUser = await FirebaseDB.players.getById(auth.currentUser.uid);
console.log("Mi rol:", currentUser.role);
// Debería mostrar: "super_admin" o "admin_player"
```

---

## 📝 NOTAS IMPORTANTES

### Seguridad de Roles
- Los roles se verifican en **tiempo real** desde Firestore
- Si cambias el rol de un usuario, los cambios son **inmediatos**
- Los usuarios NO pueden cambiar su propio rol (protegido en las reglas)

### Autenticación Requerida
- **TODAS** las operaciones requieren autenticación
- Los usuarios no autenticados no pueden leer ni escribir nada
- Esto protege tu base de datos de accesos no autorizados

### Campos Protegidos
Los jugadores normales NO pueden modificar:
- `role` (su rol)
- `status` (su estado)
- `matches_played` (partidos jugados)

Solo los admins pueden cambiar estos campos.

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Despliega las reglas** usando la Opción 1 (Firebase Console)
2. ✅ **Prueba borrar un jugador** desde tu app
3. ✅ **Verifica que funciona** correctamente
4. ✅ **Avísame si hay algún problema**

---

**¿Necesitas ayuda con el despliegue? ¡Dime y te guío paso a paso!** 🚀

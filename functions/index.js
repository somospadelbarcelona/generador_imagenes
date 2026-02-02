/**
 * Firebase Cloud Functions - SomosPadel PRO Secure Logic
 * Purpose: Secure Level Recalculation & Matchmaking in the Cloud.
 * To Deploy: Run 'firebase deploy --only functions'
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * Recalculate Player Level Securely
 * Triggered via HTTP or onCreate/onUpdate Match
 */
exports.secureRecalcLevel = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Solo usuarios registrados.');

    const { matchId, collection } = data;
    const matchRef = db.collection(collection || 'matches').doc(matchId);

    return await db.runTransaction(async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists || matchDoc.data().status !== 'finished') return { success: false, msg: 'Partido no listo' };

        const match = matchDoc.data();
        const scoreA = parseInt(match.score_a);
        const scoreB = parseInt(match.score_b);
        const teamA = match.team_a_ids || [];
        const teamB = match.team_b_ids || [];

        // Fetch Player Stats
        const players = await Promise.all([...teamA, ...teamB].map(id => db.collection('players').doc(id).get()));
        const levelMap = {};
        players.forEach(p => levelMap[p.id] = p.data().level || 3.5);

        // Core ELO logic (Server-side)
        const getAvg = (ids) => ids.map(id => levelMap[id] || 3.5).reduce((a, b) => a + b, 0) / (ids.length || 1);
        const avgA = getAvg(teamA);
        const avgB = getAvg(teamB);

        const calcDelta = (score, rivalScore, myAvg, rivalAvg) => {
            const win = score > rivalScore;
            const total = score + rivalScore;
            let pDelta = (win ? 0.012 : -0.012) + (((score / total) - 0.5) * 0.01);
            let dDelta = win ? (rivalAvg > myAvg ? (rivalAvg - myAvg) * 0.02 : 0.004)
                : (rivalAvg < myAvg ? (rivalAvg - myAvg) * 0.02 : -0.004);
            return pDelta + dDelta;
        };

        const deltaA = calcDelta(scoreA, scoreB, avgA, avgB);
        const deltaB = calcDelta(scoreB, scoreA, avgB, avgA);

        // Batch Updates for Players
        teamA.forEach(id => {
            const oldLevel = levelMap[id];
            const newLevel = Math.max(0, Math.min(7.5, Math.round((oldLevel + deltaA) * 100) / 100));
            transaction.update(db.collection('players').doc(id), { level: newLevel, last_update: admin.firestore.FieldValue.serverTimestamp() });
        });

        teamB.forEach(id => {
            const oldLevel = levelMap[id];
            const newLevel = Math.max(0, Math.min(7.5, Math.round((oldLevel + deltaB) * 100) / 100));
            transaction.update(db.collection('players').doc(id), { level: newLevel, last_update: admin.firestore.FieldValue.serverTimestamp() });
        });

        return { success: true, deltaA, deltaB };
    });
});

/**
 * Send Real Push Notification via FCM
 * Triggered when a new document is added to a player's notification subcollection
 */
exports.sendPushNotification = functions.firestore
    .document('players/{userId}/notifications/{notificationId}')
    .onCreate(async (snapshot, context) => {
        const { userId } = context.params;
        const notification = snapshot.data();

        // 1. Get User's FCM Token
        const userDoc = await db.collection('players').doc(userId).get();
        const userData = userDoc.data();
        const fcmToken = userData ? userData.fcm_token : null;

        if (!fcmToken) {
            console.log(`✉️ No FCM token found for user ${userId}, skipping push.`);
            return null;
        }

        // 2. Build the Message payload
        const message = {
            notification: {
                title: notification.title || 'Somospadel BCN',
                body: notification.body || 'Tienes una nueva notificación'
            },
            data: {
                ...notification.data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK', // For mobile compatibility if needed
                url: notification.data ? notification.data.url : 'dashboard'
            },
            token: fcmToken
        };

        // 3. Send via FCM
        try {
            const response = await admin.messaging().send(message);
            console.log(`🚀 Push sent successfully to ${userId}:`, response);
            return response;
        } catch (error) {
            console.error(`❌ Error sending push to ${userId}:`, error);

            // Optional: If token is invalid/expired, remove it
            if (error.code === 'messaging/registration-token-not-registered') {
                console.log(`🗑️ Removing expired token for ${userId}`);
                await db.collection('players').doc(userId).update({ fcm_token: admin.firestore.FieldValue.delete() });
            }
            return null;
        }
    });

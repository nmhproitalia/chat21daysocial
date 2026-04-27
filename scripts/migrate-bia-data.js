const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* ############################################################ */
/* #  SCRIPT MIGRAZIONE DATI BIA  # */
/* ############################################################ */

async function migrateBiaData() {
try {
const usersSnapshot = await db.collection('users').get();
console.log(`Trovati ${usersSnapshot.size} utenti`);

let migratedCount = 0;
let skippedCount = 0;

for (const userDoc of usersSnapshot.docs) {
const userId = userDoc.id;
const userData = userDoc.data();

const biaFields = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge', 'bmi', 'bmr', 'waterNeeds', 'proteinNeeds'];
const hasBiaData = biaFields.some(field => userData[field] !== undefined && userData[field] !== null);

if (!hasBiaData) {
console.log(`Utente ${userId}: Nessun dato BIA, saltato`);
skippedCount++;
continue;
}

const userRef = db.collection('users').doc(userId);
const biaData = {
weight: userData.weight,
bodyFat: userData.bodyFat,
hydration: userData.hydration,
visceralFat: userData.visceralFat,
leanMass: userData.leanMass,
boneMass: userData.boneMass,
metabolicAge: userData.metabolicAge,
bmi: userData.bmi,
bmr: userData.bmr,
waterNeeds: userData.waterNeeds,
proteinNeeds: userData.proteinNeeds,
data: userData.biaLastUpdate || userData.lastBiaUpdate || admin.firestore.FieldValue.serverTimestamp()
};

const userDoc = await userRef.get();
const currentData = userDoc.data();

if (!currentData.initial_bia) {
await userRef.update({
initial_bia: biaData
});
console.log(`Utente ${userId}: Creato initial_bia`);
}

await userRef.update({
latest_bia: biaData
});
console.log(`Utente ${userId}: Aggiornato latest_bia`);

const historyRef = userRef.collection('bia_history').doc();
await historyRef.set(biaData);
console.log(`Utente ${userId}: Aggiunto documento a bia_history`);

migratedCount++;
}

console.log(`\nMigrazione completata:`);
console.log(`Utenti migrati: ${migratedCount}`);
console.log(`Utenti saltati (no dati BIA): ${skippedCount}`);

process.exit(0);
} catch (error) {
console.error('Errore durante migrazione:', error);
process.exit(1);
}
}

migrateBiaData();

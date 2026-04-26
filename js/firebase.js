/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE MODULI FIREBASE (STABLE)      # */
/* #                                                          # */
/* ############################################################ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";



/* ############################################################ */
/* #                                                          # */
/* #           2. CONFIGURAZIONE PROGETTO FIREBASE           # */
/* #                                                          # */
/* ############################################################ */
const firebaseConfig = {
apiKey: "AIzaSyABOupiXNdbVHaXC8yK5xTwGePO8y496s4",
authDomain: "giornifit-app.firebaseapp.com",
projectId: "giornifit-app",
storageBucket: "giornifit-app.firebasestorage.app",
messagingSenderId: "382198007084",
appId: "1:382198007084:web:49a420f9dbe461db89d889",
measurementId: "G-8FT6SMHYR0"
};



/* ############################################################ */
/* #                                                          # */
/* #           3. INIZIALIZZAZIONE E ESPORTAZIONE SERVIZI    # */
/* #                                                          # */
/* ############################################################ */
// --- INIZIALIZZAZIONE APP ---
const app = initializeApp(firebaseConfig);


// --- CONFIGURAZIONE FIRESTORE CON OFFLINE PERSISTENCE ---
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

export const db = initializeFirestore(app, {
  cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache
  experimentalForceLongPolling: true, // Fallback per problemi QUIC
  cache: 'IndexedDb' // Offline persistence moderna
});


// --- ESPORTAZIONE ISTANZE ---
export const auth = getAuth(app);
export const storage = getStorage(app);


console.log('Firebase.js 10.11 - Configurazione Semplificata Attiva');

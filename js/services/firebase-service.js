/* ############################################################ */
/* #                                                          # */
/* #           1. SERVIZIO FIREBASE CENTRALIZZATO            # */
/* #                                                          # */
/* ############################################################ */
import { 
doc, getDoc, getDocs, collection, query, where, 
updateDoc, setDoc, addDoc, deleteDoc, serverTimestamp,
onSnapshot, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { 
ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { 
updatePassword, reauthenticateWithCredential, EmailAuthProvider,
sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { auth, db, storage } from "../firebase.js";



/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE FIREBASE SERVICE        # */
/* #                                                          # */
/* ############################################################ */
export class FirebaseService {
// --- FUNZIONE COSTRUTTORE ---
constructor() {
this.maxRetries = 3;
this.retryDelay = 1000;
this.cache = new Map();
this.cacheTimeout = 5 * 60 * 1000;
}


// --- FUNZIONE ESECUZIONE CON RETRY ---
async executeWithRetry(operation, retries = this.maxRetries) {
try {
return await operation();
} catch (error) {
console.warn(`Operazione fallita, retry ${retries}/${this.maxRetries}:`, error);
if (retries > 0 && this.shouldRetry(error)) {
await this.delay(this.retryDelay);
return this.executeWithRetry(operation, retries - 1);
}
throw error;
}
}


// --- FUNZIONE RECUPERO PROFILO UTENTE ---
async getUserProfile(uid) {
return this.executeWithRetry(async () => {
if (!db) throw new Error("Firestore instance (db) is null");
const userDoc = await getDoc(doc(db, "users", uid));
return userDoc.exists() ? userDoc.data() : null;
});
}


// --- FUNZIONE AGGIORNAMENTO PROFILO UTENTE ---
async updateUserProfile(uid, data) {
return this.executeWithRetry(async () => {
if (!db) throw new Error("Firestore instance (db) is null");
await updateDoc(doc(db, "users", uid), {
...data,
updatedAt: serverTimestamp()
});
});
}


// --- FUNZIONE DELAY ---
delay(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}


// --- FUNZIONE VERIFICA ERRORE RETRY ---
shouldRetry(error) {
const retryableErrors = [
'unavailable',
'deadline-exceeded',
'network-request-failed'
];
return retryableErrors.some(code => error.code?.includes(code));
}
}


export const firebaseService = new FirebaseService();

/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E CONFIGURAZIONE     # */
/* #                                                          # */
/* ############################################################ */
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { auth, db } from "../../js/firebase.js";
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


/* ############################################################ */
/* #                                                          # */
/* #           2. FUNZIONI GESTIONE AUTENTICAZIONE           # */
/* ############################################################ */
// --- FUNZIONE REGISTRAZIONE ---
export async function handleRegister(email, pass, extraData) {
try {
console.log("handleRegister chiamato con:", { email, extraData });
const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
const user = userCredential.user;
console.log("Utente creato:", user.uid);

// --- RECUPERO DATI COACH ATTUALI ---
let coachData = {
coachFirstName: '',
coachLastName: '',
coachEmail: '',
coachPhone: ''
};

try {
// Cerchiamo l'admin per copiare i suoi dati pubblici
const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
const adminSnap = await getDocs(adminQuery);
if (!adminSnap.empty) {
const adminDoc = adminSnap.docs[0].data();
coachData = {
coachFirstName: adminDoc.coachFirstName || '',
coachLastName: adminDoc.coachLastName || '',
coachEmail: adminDoc.coachEmail || '',
coachPhone: adminDoc.coachPhone || ''
};
}
} catch (err) {
console.error("Errore recupero dati coach durante registrazione:", err);
}

await updateProfile(user, {
displayName: `${extraData.firstName} ${extraData.lastName}`
});

await setDoc(doc(db, "users", user.uid), {
uid: user.uid,
email: email,
firstName: extraData.firstName,
lastName: extraData.lastName,
phone: extraData.phone || '',
role: 'user',
createdAt: serverTimestamp(),
updatedAt: serverTimestamp(),
rankingPoints: 0,
mainGoal: 'fat_loss',
bio: '',
...coachData
});

return user;
} catch (error) {
console.error("Errore registrazione:", error);
console.error("Codice errore:", error.code);
console.error("Messaggio errore:", error.message);
throw error;
}
}


// --- FUNZIONE LOGIN ---
export async function handleLogin(email, pass) {
try {
const userCredential = await signInWithEmailAndPassword(auth, email, pass);
return userCredential.user;
} catch (error) {
console.error("Errore login:", error);
throw error;
}
}


// --- FUNZIONE RESET PASSWORD ---
export async function handlePasswordReset(email) {
try {
await sendPasswordResetEmail(auth, email);
return true;
} catch (error) {
console.error("Errore reset password:", error);
throw error;
}
}


// --- FUNZIONE RESET PASSWORD ---
export async function resetPassword(email) {
const auth = getAuth();
try {
await sendPasswordResetEmail(auth, email);
return { success: true };
} catch (error) {
console.error("Errore reset password:", error);
throw error;
}
}

// --- FUNZIONE INIZIALIZZAZIONE AUTENTICAZIONE ---
export function initAuth(onUserLogged) {
onAuthStateChanged(auth, (user) => {
if (typeof onUserLogged === 'function') onUserLogged(user);
});
}


// --- ESPOSIZIONE GLOBALE PER HTML ---
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handlePasswordReset = handlePasswordReset;

/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E CONFIGURAZIONE     # */
/* #                                                          # */
/* ############################################################ */
import { db, auth, storage } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { showServiceMessage, validatePhoneNumber } from "./ui-helper.js";
import { getPhotoURL, getRoleStyles, renderUserHTML, getRankClass } from "../components/general/user-manager.js";

const ADMIN_EMAIL = "cristian.mulino@gmail.com";


/* ############################################################ */
/* #                                                          # */
/* #           2. INIZIALIZZAZIONE DASHBOARD COACH           # */
/* #                                                          # */
/* ############################################################ */
export async function initDashboard() {
console.log("Irina: Dashboard Manager inizializzato");
await loadGlobalSettings();
await fetchUsers();
await countRoles();
setupCoachSettingsForm();
// initAdminSection rimosso - sostituito da pannello inline in Challengers
}

document.addEventListener('DOMContentLoaded', () => {
onAuthStateChanged(auth, async (user) => {
if (user) {
try {
const userDoc = await getDoc(doc(db, "users", user.uid));
if (userDoc.exists()) {
const userData = userDoc.data();
const role = (userData.role || '').toLowerCase();
if (role === 'admin' || role === 'coach') {
initDashboard();
} else {
window.location.replace('index.html');
}
}
} catch (error) {
console.error("Errore dashboard:", error);
}
}
});
});


/* ############################################################ */
/* #                                                          # */
/* #           3. GESTIONE IMPOSTAZIONI COACH & CHALLENGE    # */
/* #                                                          # */
/* ############################################################ */
async function loadGlobalSettings() {
if (!auth.currentUser) return;
try {
const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
if (userDoc.exists()) {
const d = userDoc.data();
document.getElementById('setCoachFirstName').value = d.coachFirstName || '';
document.getElementById('setCoachLastName').value = d.coachLastName || '';
document.getElementById('setCoachEmail').value = d.coachEmail || '';
document.getElementById('setCoachPhone').value = d.coachPhone || '';
document.getElementById('setChallengeDate').value = d.challengeStartDate || '';
document.getElementById('setChallengeTime').value = d.challengeStartTime || '';
}
} catch (e) { console.error(e); }
}

async function countRoles() {
try {
const usersSnapshot = await getDocs(collection(db, "users"));
let totalChallengers = 0;
let totalAssistants = 0;

usersSnapshot.forEach(doc => {
const role = (doc.data().role || '').toLowerCase();
if (role === 'challenger' || role === 'challenge' || role === 'user') {
totalChallengers++;
} else if (role === 'assistant' || role === 'assistente') {
totalAssistants++;
}
});

const challengersEl = document.getElementById('totalChallengersCount');
const assistantsEl = document.getElementById('totalAssistantsCount');

if (challengersEl) challengersEl.textContent = totalChallengers;
if (assistantsEl) assistantsEl.textContent = totalAssistants;

console.log(`Conteggio ruoli: Challengers=${totalChallengers}, Assistants=${totalAssistants}`);
} catch (error) {
console.error('Errore conteggio ruoli:', error);
}
}

function setupCoachSettingsForm() {
const form = document.getElementById('coachSettingsForm');
if (!form) return;
form.onsubmit = async (e) => {
e.preventDefault();
const btn = form.querySelector('button');
try {
const coachPhone = document.getElementById('setCoachPhone').value.trim();
if (coachPhone && !validatePhoneNumber(coachPhone)) {
showServiceMessage("Formato telefono coach non valido.", "error", btn);
return;
}

btn.disabled = true;
const coachUid = auth.currentUser.uid;
const data = {
coachFirstName: document.getElementById('setCoachFirstName').value.trim(),
coachLastName: document.getElementById('setCoachLastName').value.trim(),
coachEmail: document.getElementById('setCoachEmail').value.trim(),
coachPhone: coachPhone,
challengeStartDate: document.getElementById('setChallengeDate').value,
challengeStartTime: document.getElementById('setChallengeTime').value,
updatedAt: serverTimestamp()
};

// 1. Aggiorna il profilo del Coach stesso
await updateDoc(doc(db, "users", coachUid), data);

// 2. Aggiorna le impostazioni PUBBLICHE per il timer (challenge_settings/global)
await setDoc(doc(db, "challenge_settings", "global"), {
    challengeStartDate: data.challengeStartDate,
    challengeStartTime: data.challengeStartTime,
    updatedAt: serverTimestamp()
});

// 3. Propaga i dati a TUTTI gli utenti con ruolo 'user'
const usersQuery = query(collection(db, "users"), where("role", "==", "user"));
const usersSnap = await getDocs(usersQuery);

const updatePromises = usersSnap.docs.map(userDoc => 
updateDoc(doc(db, "users", userDoc.id), {
coachFirstName: data.coachFirstName,
coachLastName: data.coachLastName,
coachEmail: data.coachEmail,
coachPhone: data.coachPhone,
challengeStartDate: data.challengeStartDate,
challengeStartTime: data.challengeStartTime
})
);

await Promise.all(updatePromises);

showServiceMessage(`Impostazioni globali aggiornate e sincronizzate!`, "success", btn);
} catch (e) {
showServiceMessage("Errore sincronizzazione: " + e.message, "error", btn);
} finally {
btn.disabled = false;
}
};
}


/* ############################################################ */
/* #                                                          # */
/* #           4. GESTIONE CHALLENGERS                       # */
/* #                                                          # */
/* ############################################################ */
// --- FUNZIONE FORMATTAZIONE OBIETTIVO ---
function formatGoal(goalKey) {
    const goals = {
        'fat_loss': 'Diminuzione massa grassa',
        'muscle_gain': 'Aumento massa magra',
        'toning': 'Tonificazione',
        'maintenance': 'Mantenimento'
    };
    return goals[goalKey] || goalKey;
}

async function fetchUsers() {
const grid = document.getElementById('userGrid');
if (!grid) return;
try {
const querySnapshot = await getDocs(collection(db, "users"));
grid.innerHTML = '';
let total = 0;
querySnapshot.forEach((d) => {
const user = d.data();
// Mostriamo solo gli utenti 'user' nella lista gestione (escludendo admin/coach se necessario)
// o gestendo diversamente. Per ora seguiamo la logica esistente.
if (user.role === 'user') {
total++;
const isCoach = (user.role === 'coach' || user.email === ADMIN_EMAIL);
const roleLabel = isCoach ? 'Coach' : 'Challenger';
const roleClass = isCoach ? 'role-coach' : 'role-challenger';

const phone = user.phone || 'N/D';
const email = user.email || 'N/D';
const goal = user.mainGoal ? formatGoal(user.mainGoal) : 'N/D';
const water = user.waterNeeds ? user.waterNeeds + ' L' : 'N/D';
const protein = user.proteinNeeds ? user.proteinNeeds + ' g' : 'N/D';
const avatarUrl = getPhotoURL(user, null);
const roleStyles = getRoleStyles(user.role);

const userData = {
firstName: user.firstName || 'Utente',
lastName: user.lastName || '',
photoURL: avatarUrl,
role: isCoach ? 'Coach' : 'Challenge'
};

const userCard = document.createElement('div');
userCard.className = 'card user-card';

userCard.innerHTML = `
<div class="post-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
${renderUserHTML(userData, null)}
</div>
<div class="user-info-grid" style="display: grid; gap: 0.4rem; background: rgba(255,255,255,0.6); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
<div style="display: flex; align-items: center; gap: 10px;">
<span style="font-size: 1rem;">🎯</span>
<span style="font-size: 0.9rem; color: #666;">Obiettivo:</span>
<span style="font-weight: 600; color: var(--text-dark);">${goal}</span>
</div>
<div style="display: flex; align-items: center; gap: 10px;">
<span style="font-size: 1rem;">�</span>
<span style="font-size: 0.9rem; color: #666;">Acqua:</span>
<span style="font-weight: 600; color: var(--text-dark);">${water}</span>
</div>
<div style="display: flex; align-items: center; gap: 10px;">
<span style="font-size: 1rem;">🥩</span>
<span style="font-size: 0.9rem; color: #666;">Proteina:</span>
<span style="font-weight: 600; color: var(--text-dark);">${protein}</span>
</div>
<div style="display: flex; align-items: center; gap: 10px;">
<span style="font-size: 1rem;">�</span>
<span style="font-size: 0.9rem; color: #666;">Email:</span>
<span style="font-weight: 600; color: var(--text-dark);">${email}</span>
</div>
<div style="display: flex; align-items: center; gap: 10px;">
<span style="font-size: 1rem;">📱</span>
<span style="font-size: 0.9rem; color: #666;">Telefono:</span>
<span style="font-weight: 600; color: var(--text-dark);">${phone}</span>
</div>
</div>
<div class="user-actions-btn-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
<button onclick="viewUserProfile('${d.id}')" class="btn-discord btn-discord--info" style="width: 100%; font-size: 0.85rem; padding: 12px; font-weight: 700; border-radius: 8px;">VEDI PROFILO</button>
<button onclick="deleteUserProfile('${d.id}', '${user.firstName}')" class="btn-discord" style="width: 100%; font-size: 0.85rem; padding: 12px; font-weight: 700; border-radius: 8px; background: #dc3545; color: white;">ELIMINA</button>
</div>
<div id="delete-msg-${d.id}" style="margin-top: 10px;"></div>
`;
grid.appendChild(userCard);
}
});
        
const countLabel = document.getElementById('userCount');
if (countLabel) countLabel.textContent = `Totale Challengers: ${total}`;
} catch (e) {
console.error("Errore caricamento utenti:", e);
}
}

window.viewUserProfile = (uid) => window.location.href = `profile.html?uid=${uid}`;

// --- FUNZIONE ELIMINAZIONE PROFILO ---
window.deleteUserProfile = async (uid, name) => {
if (!confirm(`ATTENZIONE: Stai per eliminare definitivamente l'atleta ${name}. Questa azione non è reversibile. Procedere?`)) return;

const msgArea = document.getElementById(`delete-msg-${uid}`);
try {
msgArea.innerHTML = '<p style="color: var(--danger-color); font-size: 0.7rem; margin-top: 5px;">Eliminazione in corso...</p>';

// Elimina documento Firestore (foto disabilitate, usa placeholder)
await deleteDoc(doc(db, "users", uid));

showServiceMessage(`Atleta ${name} eliminato correttamente.`, "success");
fetchUsers(); // Refresh lista
} catch (error) {
console.error(error);
msgArea.innerHTML = `<p style="color: var(--danger-color); font-size: 0.7rem; margin-top: 5px;">Errore: ${error.message}</p>`;
}
};


/* ############################################################ */
/* #                                                          # */
/* #           5. SEZIONE ADMIN GESTIONE RUOLI                # */
/* #                                                          # */
/* ############################################################ */
// Vecchio sistema rimosso - sostituito da pannello inline in Challengers
// Funzioni initAdminSection, fetchAdminUsers e changeUserRole rimosse;

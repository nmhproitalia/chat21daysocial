/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E CONFIGURAZIONE     # */
/* #                                                          # */
/* ############################################################ */
import { db, auth, storage } from '../../js/firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getPhotoURL, getRankClass, formatDisplayName } from "../../components/general/user-manager.js";
import { getRoleMetadata } from "../../components/general/auth-core.js";

// Variabile globale per ruolo utente corrente
let currentUserRole = null;

// Carica ruolo utente corrente
const loadCurrentUserRole = async () => {
if (auth.currentUser) {
const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
if (userDoc.exists()) {
const userData = userDoc.data();
const role = (userData.role || '').toLowerCase();
currentUserRole = role === 'admin' || role === 'coach' ? 'Coach' : role === 'assistant' || role === 'assistente' ? 'Assistente' : 'Challenger';
}
}
};



/* ############################################################ */
/* #                                                          # */
/* #           2. GESTIONE CARICAMENTO CHALLENGERS           # */
/* #                                                          # */
/* ############################################################ */
// --- FUNZIONE RECUPERO E RENDERING CHALLENGERS ---
export async function initChallengers() {
console.log("Irina: Challengers Manager inizializzato");
await loadCurrentUserRole();
fetchChallengers();

// Listener per cambio stato auth
auth.onAuthStateChanged(async (user) => {
if (user) {
await loadCurrentUserRole();
fetchChallengers();
} else {
currentUserRole = null;
fetchChallengers();
}
});
}

// Funzione wrapper per assicurare che currentUserRole sia caricato
async function fetchChallengers() {
// Se currentUserRole è ancora null, attendi
if (currentUserRole === null && auth.currentUser) {
await loadCurrentUserRole();
}
const grid = document.getElementById('userGrid');
  const countLabel = document.getElementById('userCount');
  const coachCountLabel = document.getElementById('coachCount');
  const assistantCountLabel = document.getElementById('assistantCount');
  const loader = document.getElementById('loading');
  if (!grid) return;
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({ id: doc.id, ...userData });
    });

    users.sort((a, b) => {
const roleA = (a.role || '').toLowerCase();
const roleB = (b.role || '').toLowerCase();

const getRolePriority = (role) => {
if (role === 'admin' || role === 'coach') return 1;
if (role === 'assistant' || role === 'assistente') return 2;
return 3;
};

const priorityA = getRolePriority(roleA);
const priorityB = getRolePriority(roleB);

if (priorityA !== priorityB) {
return priorityA - priorityB;
}

// Stesso ruolo, ordina alfabeticamente per nome
const nameA = (a.firstName || '').toLowerCase();
const nameB = (b.firstName || '').toLowerCase();
return nameA.localeCompare(nameB);
});

    grid.innerHTML = "";
    if (loader) loader.style.display = "none";
    let totalAthletes = 0;
    let totalCoaches = 0;
    let totalAssistants = 0;

    for (const u of users) {
const roleLower = (u.role || '').toLowerCase();
const isCoach = roleLower === 'admin' || roleLower === 'coach';
const isAssistant = roleLower === 'assistant' || roleLower === 'assistente';
if (isCoach) totalCoaches++;
else if (isAssistant) totalAssistants++;
else totalAthletes++;
const cardHTML = await renderChallengerCard(u.id, u, isCoach);
grid.innerHTML += cardHTML;
}

if (countLabel) countLabel.textContent = `Totale Challengers: ${totalAthletes}`;
if (coachCountLabel) coachCountLabel.textContent = `Totale Coach: ${totalCoaches}`;
if (assistantCountLabel) assistantCountLabel.textContent = `Totale Assistente: ${totalAssistants}`;
} catch (err) {
console.error("Errore caricamento challengers:", err);
if (loader) loader.textContent = "Errore durante il caricamento.";
}
}


// --- FUNZIONE RENDERING SINGOLA CARD ---
async function renderChallengerCard(uid, u, isCoach) {
// Forza il riconoscimento del ruolo
const originalRole = u.role || 'challenger';
const roleValue = originalRole.toLowerCase();
const roleMeta = getRoleMetadata(roleValue);

let photoURL = u.photoURL || '';

if (photoURL && photoURL.startsWith('gs://')) {
try {
const { getDownloadURL, ref: storageRef } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');
photoURL = await getDownloadURL(storageRef(storage, photoURL));
} catch (e) {
photoURL = '';
}
}

// Normalizzazione nomi in Camel Case
const formattedName = (u.firstName + ' ' + u.lastName).toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

// Crea il blocco identità atomico
const avatarHTML = photoURL 
? `<img src="${photoURL}" class="user-avatar ${roleMeta.className}" style="width: 80px; height: 80px;">` 
: `<div class="user-avatar placeholder ${roleMeta.className}" style="width: 80px; height: 80px;"><i class="fas fa-user"></i></div>`;

// Iniezione pulita (Facebook-style compatto)
return `
<div id="card-${uid}" class="card challenger-card" style="position:relative; display:flex; flex-direction:column; align-items:center; text-align:center; padding: 20px;">
${avatarHTML}
<h3 class="challenger-name" style="margin: 10px 0 2px 0; font-size: 1.1rem; font-weight: 700; text-transform: none !important;">${formattedName}</h3>
<div class="${roleMeta.className} challenger-role" style="font-size: 0.85rem; font-weight: 600; text-transform: none !important;">
<i class="fas ${roleMeta.icon}"></i> ${roleMeta.label}
</div>
</div>
`;
}

// --- FUNZIONE FORMATTAZIONE OBIETTIVO ---
function formatGoal(goalKey) {
const goals = {
'fat_loss': 'Riduzione massa grassa',
'muscle_gain': 'Aumento massa magra',
'toning': 'Tonificazione',
'maintenance': 'Mantenimento'
};
return goals[goalKey] || goalKey;
}

// Toggle pannello ruolo
function toggleRolePanel(uid) {
// Controlla permessi
if (currentUserRole !== 'Coach') {
showToast('Solo Coach può gestire i ruoli');
return;
}

const panel = document.getElementById(`role-panel-${uid}`);
if (panel) {
panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}
}

// Esponi funzioni globalmente
window.toggleRolePanel = toggleRolePanel;

// Aggiorna ruolo utente
window.updateUserRole = async (uid, newRole = null) => {
console.log('[DEBUG UPDATE] Aggiorna ruolo chiamato, UID:', uid, 'Nuovo ruolo:', newRole);
console.log('[DEBUG UPDATE] Ruolo utente:', currentUserRole);

// Controlla permessi
if (currentUserRole !== 'Coach') {
console.log('[DEBUG UPDATE] Permesso negato, ruolo:', currentUserRole);
showToast('Solo Coach può gestire i ruoli', uid);
return;
}

// Se newRole non fornito, usa fallback select
if (!newRole) {
const select = document.getElementById(`role-select-${uid}`);
if (select) {
newRole = select.value;
} else {
showToast('Errore: ruolo non specificato', uid);
return;
}
}

console.log('[DEBUG UPDATE] Ruolo da aggiornare:', newRole);

const panel = document.getElementById(`role-panel-${uid}`);

if (!newRole) {
console.log('[DEBUG UPDATE] Nessun ruolo selezionato, ritorno');
return;
}

try {
console.log('[DEBUG UPDATE] Firestore importato');

// Normalizzazione ruolo per Firestore
let firestoreRole = newRole.toLowerCase();
if (firestoreRole === 'coach') {
firestoreRole = 'admin';
} else if (firestoreRole === 'assistente') {
firestoreRole = 'assistant';
} else if (firestoreRole === 'challenger') {
firestoreRole = 'user';
}
console.log('[DEBUG UPDATE] Ruolo normalizzato per Firestore:', firestoreRole);

await updateDoc(doc(db, "users", uid), {
role: firestoreRole
});
console.log('[DEBUG UPDATE] updateDoc completato con successo');

// Chiudi pannello
if (panel) panel.style.display = 'none';
console.log('[DEBUG UPDATE] Pannello chiuso');

// Mostra toast successo
showToast('Ruolo aggiornato con successo!', uid);
console.log('[DEBUG UPDATE] Toast mostrato');

// Ricarica lista
fetchChallengers();
console.log('[DEBUG UPDATE] Challengers ricaricati');
} catch (error) {
console.error('Errore aggiornamento ruolo:', error);
showToast('Errore durante aggiornamento ruolo', uid);
}
};

// Mostra toast
function showToast(message, cardId = null) {
const toast = document.createElement('div');
toast.textContent = message;

if (cardId) {
// Posiziona sopra il nome, non copre avatar
const card = document.getElementById(`card-${cardId}`);
if (card) {
toast.style.cssText = 'position:relative; background:#266431; color:white; padding:8px 12px; border-radius:6px; font-size:0.85rem; font-weight:600; margin-bottom:10px; text-align:center;';
// Inserisci dopo gear icon, prima del contenuto
const gearIcon = card.querySelector('a[href*="toggleRolePanel"]');
if (gearIcon) {
gearIcon.insertAdjacentElement('afterend', toast);
} else {
card.insertBefore(toast, card.firstChild);
}
} else {
// Fallback se card non trovata
toast.style.cssText = 'position:fixed; top:80px; right:20px; background:#266431; color:white; padding:12px 24px; border-radius:8px; font-weight:600; z-index:10000; animation:slideIn 0.3s ease;';
document.body.appendChild(toast);
}
} else {
// Posiziona fixed sopra scheda (fallback)
toast.style.cssText = 'position:fixed; top:80px; right:20px; background:#266431; color:white; padding:12px 24px; border-radius:8px; font-weight:600; z-index:10000; animation:slideIn 0.3s ease;';
document.body.appendChild(toast);
}

setTimeout(() => {
toast.style.animation = 'slideOut 5s ease';
setTimeout(() => toast.remove(), 30000);
}, 50000);
}

// Aggiungi animazioni CSS
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
from { transform: translateX(100%); opacity: 0; }
to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
from { transform: translateX(0); opacity: 1; }
to { transform: translateX(100%); opacity: 0; }
}
`;
document.head.appendChild(style);


/* ############################################################ */
/* #                                                          # */
/* #           3. INIZIALIZZAZIONE AUTOMATICA                  # */
/* #                                                          # */
/* ############################################################ */
document.addEventListener('DOMContentLoaded', () => {
auth.onAuthStateChanged((user) => {
if (user) {
fetchChallengers();
}
});
});

window.fetchChallengers = fetchChallengers;

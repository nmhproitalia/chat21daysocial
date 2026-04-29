/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E CONFIGURAZIONE     # */
/* #                                                          # */
/* ############################################################ */
import { db, auth, storage } from '../../js/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot, arrayUnion } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { ref, deleteObject, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { showServiceMessage, validatePhoneNumber } from "../../components/general/ui-helper.js";
import { getPhotoURL, getRoleStyles, renderUserHTML, getRankClass } from "../../components/general/user-manager.js";
import { getRoleMetadata } from "../../components/general/auth-core.js";
import { updateBadgeStatus } from "../../components/profile/profile-manager.js";

const ADMIN_EMAIL = "cristian.mulino@gmail.com";
let dashboardInitialized = false;

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

// Vecchia logica setupAccordionListeners rimosso - ora usa sistema profile toggleAccordion

/* ############################################################ */
/* #                                                          # */
/* #           2. INIZIALIZZAZIONE DASHBOARD COACH           # */
/* #                                                          # */
/* ############################################################ */
export async function initDashboard() {
if (dashboardInitialized) {
console.log("Irina: Dashboard già inizializzato, skip");
return;
}
console.log("Irina: Dashboard Manager inizializzato");
dashboardInitialized = true;
await loadCurrentUserRole();
await loadCoachesAndAssistants();
await loadGlobalSettings();
await fetchUsers();
await countRoles();
setupChallengeSettingsForm();
renderAccordionLists();
// Vecchio sistema accordion listeners rimosso - ora usa toggleAccordion (sistema profile)
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
/* #           3. GESTIONE COACH & ASSISTENTI (AUTOMATICO)   # */
/* #                                                          # */
/* ############################################################ */
async function loadCoachesAndAssistants() {
try {
const usersSnapshot = await getDocs(collection(db, "users"));
const coaches = [];
const assistants = [];
const challengers = [];

usersSnapshot.forEach(doc => {
const user = doc.data();
const role = (user.role || '').toLowerCase();

if (role === 'admin' || role === 'coach') {
coaches.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || '',
photoURL: user.photoURL || '',
role: user.role || 'coach'
});
} else if (role === 'assistant' || role === 'assistente') {
assistants.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || '',
photoURL: user.photoURL || '',
role: user.role || 'assistant'
});
} else if (role === 'user' || role === 'challenger' || role === 'challenge') {
challengers.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || '',
photoURL: user.photoURL || '',
role: user.role || 'user'
});
}
});

// Funzione helper per renderizzare card con avatar, nome e ruolo
async function renderUserCard(user, roleKey) {
const roleValue = (user.role || roleKey).toLowerCase();
const roleMeta = getRoleMetadata(roleValue);

let photoURL = user.photoURL || '';

if (photoURL && photoURL.startsWith('gs://')) {
try {
photoURL = await getDownloadURL(ref(storage, photoURL));
} catch (e) {
photoURL = '';
}
}

const formattedName = user.firstName + ' ' + user.lastName;

const avatarHTML = photoURL
? `<img src="${photoURL}" class="user-avatar ${roleMeta.className}" style="width: 80px; height: 80px;">`
: `<div class="user-avatar placeholder ${roleMeta.className}" style="width: 80px; height: 80px;"><i class="fas fa-user"></i></div>`;

return `
<div class="card challenger-card" style="position:relative; display:flex; flex-direction:column; align-items:center; text-align:center; padding: 20px;">
${avatarHTML}
<h3 class="challenger-name" style="margin: 10px 0 2px 0; font-size: 1.1rem; font-weight: 700; text-transform: none !important;">${formattedName}</h3>
<div class="${roleMeta.className} challenger-role" style="font-size: 0.85rem; font-weight: 600; text-transform: none !important;">
<i class="fas ${roleMeta.icon}"></i> ${roleMeta.label}
</div>
</div>
`;
}

// Renderizza coach
const coachesList = document.getElementById('coachesList');
const coachesAccordion = document.getElementById('coachesAccordion');
const coachesIcon = document.getElementById('coachesAccordionIcon');
if (coachesList) {
coachesList.innerHTML = ''; // Pulisci lista prima di aggiungere
if (coaches.length === 0) {
coachesList.innerHTML = '<p class="empty-state-message">Nessun coach attivo</p>';
} else {
coaches.forEach(coach => {
const coachCard = document.createElement('div');
coachCard.style.cssText = 'background: rgba(255,255,255,0.8); padding: 12px; border-radius: 8px; border-left: 3px solid #b1933a; min-width: 200px; flex: 1;';
coachCard.innerHTML = `
<div style="font-weight: 700; color: var(--text-dark); margin-bottom: 4px;">${coach.firstName} ${coach.lastName}</div>
<div style="font-size: 0.85rem; color: #666;">📧 ${coach.email}</div>
<div style="font-size: 0.85rem; color: #666;">📱 ${coach.phone || 'N/D'}</div>
`;
coachesList.appendChild(coachCard);
});
}
}

// Cambia layout contenitore a orizzontale
if (coachesList) {
coachesList.style.display = 'flex';
coachesList.style.flexDirection = 'row';
}

// Renderizza assistenti
const assistantsList = document.getElementById('assistantsList');
const assistantsAccordion = document.getElementById('assistantsAccordion');
const assistantsIcon = document.getElementById('assistantsAccordionIcon');
if (assistantsList) {
assistantsList.innerHTML = ''; // Pulisci lista prima di aggiungere
if (assistants.length === 0) {
assistantsList.innerHTML = '<p class="empty-state-message">Nessun assistente attivo</p>';
} else {
assistants.forEach(assistant => {
const assistantCard = document.createElement('div');
assistantCard.style.cssText = 'background: rgba(255,255,255,0.8); padding: 12px; border-radius: 8px; border-left: 3px solid #6B3E26; min-width: 200px; flex: 1;';
assistantCard.innerHTML = `
<div style="font-weight: 700; color: var(--text-dark); margin-bottom: 4px;">${assistant.firstName} ${assistant.lastName}</div>
<div style="font-size: 0.85rem; color: #666;">📧 ${assistant.email}</div>
<div style="font-size: 0.85rem; color: #666;">📱 ${assistant.phone || 'N/D'}</div>
`;
assistantsList.appendChild(assistantCard);
});
}
}

// Cambia layout contenitore a orizzontale
if (assistantsList) {
assistantsList.style.display = 'flex';
assistantsList.style.flexDirection = 'row';
}

// Renderizza challengers
const challengersList = document.getElementById('challengersList');
const challengersAccordion = document.getElementById('challengersAccordion');
const challengersIcon = document.getElementById('challengersAccordionIcon');
if (challengersList) {
challengersList.innerHTML = ''; // Pulisci lista prima di aggiungere
if (challengers.length === 0) {
challengersList.innerHTML = '<p class="empty-state-message">Nessun challenger attivo</p>';
} else {
challengers.forEach(challenger => {
const challengerCard = document.createElement('div');
challengerCard.style.cssText = 'background: rgba(255,255,255,0.8); padding: 12px; border-radius: 8px; border-left: 3px solid #7a7a7a; min-width: 200px; flex: 1;';
challengerCard.innerHTML = `
<div style="font-weight: 700; color: var(--text-dark); margin-bottom: 4px;">${challenger.firstName} ${challenger.lastName}</div>
<div style="font-size: 0.85rem; color: #666;">📧 ${challenger.email}</div>
<div style="font-size: 0.85rem; color: #666;">📱 ${challenger.phone || 'N/D'}</div>
`;
challengersList.appendChild(challengerCard);
});
}
}

// Cambia layout contenitore a orizzontale
if (challengersList) {
challengersList.style.display = 'flex';
challengersList.style.flexDirection = 'row';
}

console.log(`Caricati ${coaches.length} coach, ${assistants.length} assistenti e ${challengers.length} challengers`);
} catch (error) {
console.error('Errore caricamento coach/assistenti/challengers:', error);
}
}

/* ############################################################ */
/* #                                                          # */
/* #           4. GESTIONE IMPOSTAZIONI CHALLENGE             # */
/* #                                                          # */
/* ############################################################ */
async function loadGlobalSettings() {
if (!auth.currentUser) return;
try {
const challengeDoc = await getDoc(doc(db, "challenge_settings", "global"));
if (challengeDoc.exists()) {
const d = challengeDoc.data();
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

function setupChallengeSettingsForm() {
const form = document.getElementById('challengeSettingsForm');
if (!form) return;
form.onsubmit = async (e) => {
e.preventDefault();
const btn = form.querySelector('button');
try {
btn.disabled = true;
const data = {
challengeStartDate: document.getElementById('setChallengeDate').value,
challengeStartTime: document.getElementById('setChallengeTime').value,
updatedAt: serverTimestamp()
};

// Aggiorna le impostazioni PUBBLICHE per il timer (challenge_settings/global)
await setDoc(doc(db, "challenge_settings", "global"), data);

showServiceMessage(`Impostazioni Challenge aggiornate!`, "success", btn);
} catch (e) {
showServiceMessage("Errore salvataggio: " + e.message, "error", btn);
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
        'fat_loss': 'Riduzione massa grassa',
        'muscle_gain': 'Aumento massa magra',
        'toning': 'Definizione',
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
const cardPromises = [];

// Converti snapshot in array e ordina per ruolo
const users = [];
querySnapshot.forEach((d) => users.push({ id: d.id, data: d.data() }));

// Ordina: Coach → Assistenti → Challengers
users.sort((a, b) => {
const roleA = (a.data.role || '').toLowerCase();
const roleB = (b.data.role || '').toLowerCase();

const getRolePriority = (role) => {
if (role === 'admin' || role === 'coach') return 1;
if (role === 'assistant' || role === 'assistente') return 2;
if (role === 'user' || role === 'challenger' || role === 'challenge') return 3;
return 4;
};

const priorityA = getRolePriority(roleA);
const priorityB = getRolePriority(roleB);

if (priorityA !== priorityB) return priorityA - priorityB;
// Se stesso ruolo, ordina alfabetico per nome
const nameA = (a.data.firstName || '').toLowerCase();
const nameB = (b.data.firstName || '').toLowerCase();
return nameA.localeCompare(nameB);
});

for (const userObj of users) {
const d = userObj;
const user = userObj.data;
// Mostra tutti gli utenti inclusi coach e admin per poter cambiare i ruoli
total++;
const isCoach = (user.role === 'coach' || user.role === 'admin' || user.email === ADMIN_EMAIL);
const roleLabel = isCoach ? 'Coach' : 'Challenger';
const roleClass = isCoach ? 'role-coach' : 'role-challenger';

const goal = user.mainGoal ? formatGoal(user.mainGoal) : 'N/D';
const water = user.latest_bia?.waterNeeds ? user.latest_bia.waterNeeds + ' L' : 'N/D';
const protein = user.latest_bia?.proteinNeeds ? user.latest_bia.proteinNeeds + ' g' : 'N/D';

// Fallback BMR: se non in latest_bia, calcola da user.bmr o N/D
let bmr = 'N/D';
if (user.latest_bia?.bmr) {
bmr = user.latest_bia.bmr + ' kcal';
} else if (user.bmr) {
bmr = user.bmr + ' kcal';
}

// Calcola scenario Progresso Ricomposizione Corporea
let scenario = 'N/D';
let scenarioColor = '#6c757d';
if (user.initial_bia && user.latest_bia && user.initial_bia.weight && user.latest_bia.weight) {
const initialBodyFat = parseFloat(user.initial_bia.bodyFat || user.initial_bia.bodyfat || 0);
const latestBodyFat = parseFloat(user.latest_bia.bodyFat || user.latest_bia.bodyfat || 0);
const initialLeanKg = parseFloat(user.initial_bia.leanMass || user.initial_bia.leanmass || 0);
const latestLeanKg = parseFloat(user.latest_bia.leanMass || user.latest_bia.leanmass || 0);
const initialFatKg = (user.initial_bia.weight * initialBodyFat) / 100;
const latestFatKg = (user.latest_bia.weight * latestBodyFat) / 100;
const fatDeltaKg = latestFatKg - initialFatKg;
const leanDeltaKg = latestLeanKg - initialLeanKg;
const weightDelta = user.latest_bia.weight - user.initial_bia.weight;

console.log(`[DEBUG] ${d.id} Scenario: fatDelta=${fatDeltaKg.toFixed(2)}, leanDelta=${leanDeltaKg.toFixed(2)}, weightDelta=${weightDelta.toFixed(2)}`);

if (fatDeltaKg < 0 && leanDeltaKg > 0) {
scenario = 'Ricomposizione Perfetta';
scenarioColor = '#28a745';
} else if (weightDelta <= -0.5 && fatDeltaKg <= -0.5) {
scenario = 'Dimagrimento Eccellente';
scenarioColor = '#17a2b8';
} else if (weightDelta >= 0.5 && leanDeltaKg >= 0.5) {
scenario = 'Lean Bulk';
scenarioColor = '#ffc107';
} else {
scenario = 'Maintenance';
}
} else {
console.log(`[DEBUG] ${d.id} Scenario: dati mancanti - initial_bia=${!!user.initial_bia}, latest_bia=${!!user.latest_bia}`);
}

// Pattern identico a challengers-manager.js
const originalRole = user.role || 'challenger';
const roleValue = originalRole.toLowerCase();
const roleMeta = getRoleMetadata(roleValue);

let photoURL = user.photoURL || '';

// Converti gs:// a URL pubblico (async come in challengers-manager.js)
if (photoURL && photoURL.startsWith('gs://')) {
try {
photoURL = await getDownloadURL(ref(storage, photoURL));
} catch (e) {
photoURL = '';
}
}

const formattedName = user.firstName + ' ' + user.lastName;

cardPromises.push(() => {
const userCard = document.createElement('div');
userCard.className = 'card user-card';

const avatarHTML = photoURL
? `<div class="user-avatar ${roleMeta.className}"><img src="${photoURL}" class="profile-img-full"></div>`
: `<div class="user-avatar placeholder ${roleMeta.className}"><i class="fas fa-user"></i></div>`;

const gearIcon = `<a href="javascript:toggleUserMenu('${d.id}')" style="position:absolute; top:10px; right:10px; text-decoration:none; cursor:pointer; color:#666; font-size:1.2rem; z-index:1000; padding:5px; display:inline-block;"><i class="fas fa-cog"></i></a>`;

const userMenu = `
<div id="user-menu-${d.id}" style="display:none; position:absolute; bottom:0; left:0; width:100%; background:white; border-top:1px solid #e0e0e0; border-radius:0 0 8px 8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:1001;">
<a href="javascript:openBIAModal('${d.id}')" style="display:block; padding:12px 15px; text-decoration:none; color:#333; font-size:0.9rem; cursor:pointer; border-bottom:1px solid #f0f0f0;"><i class="fas fa-calculator"></i> Inserisci BIA</a>
<div style="border-bottom:1px solid #f0f0f0; padding:8px 15px;">
<div style="font-size:0.75rem; font-weight:600; color:#666; margin-bottom:5px;">Cambia Ruolo:</div>
<div style="display:flex; gap:5px; flex-wrap:wrap;">
<a href="javascript:void(0)" onclick="window.updateUserRole('${d.id}', 'Coach')" style="flex:1; padding:6px 8px; border-radius:4px; border:1px solid #ddd; font-size:0.75rem; cursor:pointer; background:${originalRole.toLowerCase() === 'coach' || originalRole.toLowerCase() === 'admin' ? '#266431' : '#fff'}; color:${originalRole.toLowerCase() === 'coach' || originalRole.toLowerCase() === 'admin' ? '#fff' : '#333'}; font-weight:600; text-decoration:none; display:block; text-align:center;"><i class="fas fa-crown"></i></a>
<a href="javascript:void(0)" onclick="window.updateUserRole('${d.id}', 'Assistente')" style="flex:1; padding:6px 8px; border-radius:4px; border:1px solid #ddd; font-size:0.75rem; cursor:pointer; background:${originalRole.toLowerCase() === 'assistant' || originalRole.toLowerCase() === 'assistente' ? '#266431' : '#fff'}; color:${originalRole.toLowerCase() === 'assistant' || originalRole.toLowerCase() === 'assistente' ? '#fff' : '#333'}; font-weight:600; text-decoration:none; display:block; text-align:center;"><i class="fas fa-user-shield"></i></a>
<a href="javascript:void(0)" onclick="window.updateUserRole('${d.id}', 'Challenger')" style="flex:1; padding:6px 8px; border-radius:4px; border:1px solid #ddd; font-size:0.75rem; cursor:pointer; background:${originalRole.toLowerCase() === 'challenger' || originalRole.toLowerCase() === 'challenge' || originalRole.toLowerCase() === 'user' ? '#266431' : '#fff'}; color:${originalRole.toLowerCase() === 'challenger' || originalRole.toLowerCase() === 'challenge' || originalRole.toLowerCase() === 'user' ? '#fff' : '#333'}; font-weight:600; text-decoration:none; display:block; text-align:center;"><i class="fas fa-medal"></i></a>
</div>
</div>
<a href="javascript:viewUserProfile('${d.id}')" style="display:block; padding:12px 15px; text-decoration:none; color:#333; font-size:0.9rem; cursor:pointer; border-bottom:1px solid #f0f0f0;"><i class="fas fa-user"></i> Vedi Profilo</a>
<a href="javascript:deleteUserProfile('${d.id}', '${user.firstName}')" style="display:block; padding:12px 15px; text-decoration:none; color:#d32f2f; font-size:0.9rem; cursor:pointer;"><i class="fas fa-trash"></i> Elimina</a>
</div>
`;

userCard.innerHTML = `
<div class="contenuto">
${gearIcon}
${userMenu}
<div class="profile-header-main">
${avatarHTML}
<div id="badgeStatus-${d.id}" class="badge-status">?</div>
<h2 id="userNameDisplay-${d.id}" class="user-name-display">${formattedName}</h2>
<p id="userRoleDisplay-${d.id}" class="user-role-display"><i class="fas ${roleMeta.icon} role-display-icon" style="color: ${roleMeta.color};"></i> ${roleMeta.label}</p>
</div>
<div class="user-info-grid user-info-grid-dashboard">
<div class="user-info-item">
<span class="user-info-icon goal-icon"><i class="fas fa-bullseye"></i></span>
<span class="user-info-value">${goal}</span>
</div>
<div class="user-info-item">
<span class="user-info-icon water-icon"><i class="fas fa-tint"></i></span>
<span class="user-info-value">${water}</span>
</div>
<div class="user-info-item">
<span class="user-info-icon protein-icon"><i class="fas fa-drumstick-bite"></i></span>
<span class="user-info-value">${protein}</span>
</div>
<div class="user-info-item">
<span class="user-info-icon bmr-icon"><i class="fas fa-fire"></i></span>
<span class="user-info-value">${bmr}</span>
</div>
</div>
<div class="recomposition-scenario-dashboard" style="text-align: center; margin-top: 15px; padding: 10px; background: rgba(255, 255, 255, 0.8); border-radius: 8px;">
<span class="scenario-value" style="font-size: 1.125rem; font-weight: 700; color: ${scenarioColor};">${scenario}</span>
</div>
<div id="delete-msg-${d.id}" class="delete-message-area"></div>
</div>
`;

// Carica dati BIA e aggiorna badge
getDoc(doc(db, "users", d.id)).then(userDoc => {
if (userDoc.exists()) {
const userData = userDoc.data();
userData.id = d.id;
updateBadgeStatus(userData, d.id);
}
}).catch(e => console.error('Errore caricamento dati BIA per badge:', e));

return userCard;
});
}

const cards = await Promise.all(cardPromises.map(fn => fn()));
cards.forEach(card => grid.appendChild(card));

const countLabel = document.getElementById('userCount');
if (countLabel) countLabel.textContent = `Totale Utenti: ${total}`;
} catch (e) {
console.error("Errore caricamento utenti:", e);
}
}

window.viewUserProfile = (uid) => window.location.href = `profile.html?uid=${uid}`;

// --- FUNZIONE TOGGLE MENU UTENTE ---
window.toggleUserMenu = (uid) => {
const menu = document.getElementById(`user-menu-${uid}`);
if (menu) {
const isVisible = menu.style.display !== 'none';
menu.style.display = isVisible ? 'none' : 'block';
}
// Chiudi tutti gli altri menu
document.querySelectorAll('[id^="user-menu-"]').forEach(m => {
if (m.id !== `user-menu-${uid}`) {
m.style.display = 'none';
}
});
};

// --- FUNZIONE APRI MODAL BIA ---
window.openBIAModal = (uid) => {
const modal = document.getElementById('biaModal');
if (modal) {
modal.style.display = 'flex';
modal.dataset.uid = uid;
}
// Chiudi menu
document.querySelectorAll('[id^="user-menu-"]').forEach(m => m.style.display = 'none');
};

// --- FUNZIONE CHIUDI MODAL BIA ---
window.closeBIAModal = () => {
const modal = document.getElementById('biaModal');
if (modal) {
modal.style.display = 'none';
modal.dataset.uid = '';
}
document.getElementById('biaModalForm').reset();
document.getElementById('biaModalMsg').innerHTML = '';
};

// --- SALVA DATI BIA ---
document.addEventListener('DOMContentLoaded', () => {
const biaForm = document.getElementById('biaModalForm');
if (biaForm) {
biaForm.addEventListener('submit', async (e) => {
e.preventDefault();
const modal = document.getElementById('biaModal');
const uid = modal.dataset.uid;
const msgArea = document.getElementById('biaModalMsg');

if (!uid) {
msgArea.innerHTML = '<p class="delete-message-error">Errore: ID utente mancante</p>';
return;
}

const biaData = {
height: parseFloat(document.getElementById('modalHeight').value),
age: parseInt(document.getElementById('modalAge').value),
gender: document.getElementById('modalGender').value,
weight: parseFloat(document.getElementById('modalWeight').value),
bodyFat: parseFloat(document.getElementById('modalBodyFat').value),
hydration: parseFloat(document.getElementById('modalHydration').value),
visceralFat: parseInt(document.getElementById('modalVisceralFat').value),
leanMass: parseFloat(document.getElementById('modalLeanMass').value),
boneMass: parseFloat(document.getElementById('modalBoneMass').value),
metabolicAge: parseInt(document.getElementById('modalMetabolicAge').value),
timestamp: new Date().toISOString()
};

try {
msgArea.innerHTML = '<p class="delete-message-error">Salvataggio in corso...</p>';
await updateDoc(doc(db, "users", uid), {
latest_bia: biaData,
bia_history: arrayUnion(biaData)
});
msgArea.innerHTML = '<p class="delete-message-success" style="color:green;">Dati BIA salvati con successo!</p>';
setTimeout(() => closeBIAModal(), 1500);
} catch (error) {
console.error('Errore salvataggio BIA:', error);
msgArea.innerHTML = '<p class="delete-message-error">Errore nel salvataggio: ' + error.message + '</p>';
}
});
}
});

// --- FUNZIONE ELIMINAZIONE PROFILO ---
window.deleteUserProfile = async (uid, name) => {
if (!confirm(`ATTENZIONE: Stai per eliminare definitivamente l'atleta ${name}. Questa azione non è reversibile. Procedere?`)) return;

const msgArea = document.getElementById(`delete-msg-${uid}`);
try {
msgArea.innerHTML = '<p class="delete-message-error">Eliminazione in corso...</p>';

// Elimina documento Firestore (foto disabilitate, usa placeholder)
await deleteDoc(doc(db, "users", uid));

showServiceMessage(`Atleta ${name} eliminato correttamente.`, "success");
fetchUsers(); // Refresh lista
} catch (error) {
console.error(error);
msgArea.innerHTML = `<p class="delete-message-error">Errore: ${error.message}</p>`;
}
};

// --- FUNZIONE AGGIORNAMENTO RUOLO ---
window.updateUserRole = async (uid, newRole) => {
// Verifica ruolo direttamente da Firebase
const currentUser = auth.currentUser;
if (!currentUser) {
showServiceMessage('Utente non autenticato', "error");
return;
}

try {
const userDoc = await getDoc(doc(db, "users", currentUser.uid));
if (!userDoc.exists()) {
showServiceMessage('Errore: profilo utente non trovato', "error");
return;
}

const userData = userDoc.data();
const role = (userData.role || '').toLowerCase();
const currentUserRole = role === 'admin' || role === 'coach' ? 'Coach' : role === 'assistant' || role === 'assistente' ? 'Assistente' : 'Challenger';

// Controlla permessi
if (currentUserRole !== 'Coach') {
showServiceMessage('Solo Coach può gestire i ruoli', "error");
return;
}
} catch (error) {
console.error('[DEBUG UPDATE] Errore verifica permessi:', error);
showServiceMessage('Errore verifica permessi: ' + error.message, "error");
return;
}

if (!newRole) {
showServiceMessage('Errore: ruolo non specificato', "error");
return;
}

try {
// Normalizzazione ruolo per Firestore
let firestoreRole = newRole.toLowerCase();
if (firestoreRole === 'coach') {
firestoreRole = 'admin';
} else if (firestoreRole === 'assistente') {
firestoreRole = 'assistant';
} else if (firestoreRole === 'challenger') {
firestoreRole = 'user';
}

await updateDoc(doc(db, "users", uid), {
role: firestoreRole
});

showServiceMessage('Ruolo aggiornato con successo!', "success");
fetchUsers(); // Refresh lista
} catch (error) {
console.error('[DEBUG UPDATE] Errore aggiornamento ruolo:', error);
showServiceMessage('Errore nell\'aggiornamento del ruolo: ' + error.message, "error");
}
};


/* ############################################################ */
/* #                                                          # */
/* #           5. SEZIONE ADMIN GESTIONE RUOLI                # */
/* #                                                          # */
/* ############################################################ */
// Vecchio sistema rimosso - sostituito da pannello inline in Challengers


/* ############################################################ */
/* #                                                          # */
/* #           6. FUNZIONI ACCORDION (SISTEMA PROFILE)        # */
/* #                                                          # */
/* ############################################################ */

/* toggleAccordion rimosso - ora importato da profile-accordion.js per evitare duplicati */


/* ############################################################ */
/* #                                                          # */
/* #           FUNZIONI RENDER ACCORDION LISTS                 # */
/* #                                                          # */
/* ############################################################ */

async function renderAccordionLists() {
try {
const usersSnapshot = await getDocs(collection(db, "users"));
const coaches = [];
const assistants = [];
const challengers = [];

usersSnapshot.forEach(doc => {
const user = doc.data();
const role = (user.role || '').toLowerCase();

if (role === 'admin' || role === 'coach') {
coaches.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || '',
photoURL: user.photoURL || '',
role: user.role || 'coach'
});
} else if (role === 'assistant' || role === 'assistente') {
assistants.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || '',
photoURL: user.photoURL || '',
role: user.role || 'assistant'
});
} else {
challengers.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || '',
photoURL: user.photoURL || '',
role: user.role || 'user'
});
}
});

// Renderizza coach
const coachesListProfile = document.getElementById('coachesListProfile');
if (coachesListProfile) {
coachesListProfile.innerHTML = '';
if (coaches.length === 0) {
coachesListProfile.innerHTML = '<p class="empty-state-message">Nessun coach attivo</p>';
} else {
coaches.forEach(coach => {
const coachCard = document.createElement('div');
coachCard.className = 'coach-card';
coachCard.innerHTML = `
<div class="card-info-name">${coach.firstName} ${coach.lastName}</div>
<div class="card-info-email">📧 ${coach.email}</div>
<div class="card-info-phone">📱 ${coach.phone || 'N/D'}</div>
`;
coachesListProfile.appendChild(coachCard);
});
}
}

// Renderizza assistenti
const assistantsListProfile = document.getElementById('assistantsListProfile');
if (assistantsListProfile) {
assistantsListProfile.innerHTML = '';
if (assistants.length === 0) {
assistantsListProfile.innerHTML = '<p class="empty-state-message">Nessun assistente attivo</p>';
} else {
assistants.forEach(assistant => {
const assistantCard = document.createElement('div');
assistantCard.className = 'assistant-card';
assistantCard.innerHTML = `
<div class="card-info-name">${assistant.firstName} ${assistant.lastName}</div>
<div class="card-info-email">📧 ${assistant.email}</div>
<div class="card-info-phone">📱 ${assistant.phone || 'N/D'}</div>
`;
assistantsListProfile.appendChild(assistantCard);
});
}
}

// Renderizza challengers
const challengersListProfile = document.getElementById('challengersListProfile');
if (challengersListProfile) {
challengersListProfile.innerHTML = '';
if (challengers.length === 0) {
challengersListProfile.innerHTML = '<p class="empty-state-message">Nessun challenger attivo</p>';
} else {
challengers.forEach(challenger => {
const challengerCard = document.createElement('div');
challengerCard.className = 'challenger-card';
challengerCard.innerHTML = `
<div class="card-info-name">${challenger.firstName} ${challenger.lastName}</div>
<div class="card-info-email">📧 ${challenger.email}</div>
<div class="card-info-phone">📱 ${challenger.phone || 'N/D'}</div>
`;
challengersListProfile.appendChild(challengerCard);
});
}
}

console.log(`Caricati ${coaches.length} coach, ${assistants.length} assistenti e ${challengers.length} challengers negli accordion`);
} catch (error) {
console.error('Errore caricamento dati accordion:', error);
}
}

// Funzioni initAdminSection, fetchAdminUsers e changeUserRole rimosse;

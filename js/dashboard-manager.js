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
let dashboardInitialized = false;

// Funzione per setup accordion listeners
function setupAccordionListeners() {
const coachesBtn = document.getElementById('coachesAccordionBtn');
const assistantsBtn = document.getElementById('assistantsAccordionBtn');
const challengersBtn = document.getElementById('challengersAccordionBtn');

if (coachesBtn) {
coachesBtn.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
const accordion = document.getElementById('coachesAccordion');
const icon = document.getElementById('coachesAccordionIcon');
if (accordion) {
const isHidden = accordion.style.display === 'none';
accordion.style.display = isHidden ? 'block' : 'none';
if (icon) icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}
});
}

if (assistantsBtn) {
assistantsBtn.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
const accordion = document.getElementById('assistantsAccordion');
const icon = document.getElementById('assistantsAccordionIcon');
if (accordion) {
const isHidden = accordion.style.display === 'none';
accordion.style.display = isHidden ? 'block' : 'none';
if (icon) icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}
});
}

if (challengersBtn) {
challengersBtn.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
const accordion = document.getElementById('challengersAccordion');
const icon = document.getElementById('challengersAccordionIcon');
if (accordion) {
const isHidden = accordion.style.display === 'none';
accordion.style.display = isHidden ? 'block' : 'none';
if (icon) icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}
});
}
}

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
await loadCoachesAndAssistants();
await loadGlobalSettings();
await fetchUsers();
await countRoles();
setupChallengeSettingsForm();
setupAccordionListeners();
console.log("Irina: Accordion listeners impostati");
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
phone: user.phone || ''
});
} else if (role === 'assistant' || role === 'assistente') {
assistants.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || ''
});
} else if (role === 'user' || role === 'challenger' || role === 'challenge') {
challengers.push({
uid: doc.id,
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || ''
});
}
});

// Renderizza coach
const coachesList = document.getElementById('coachesList');
const coachesAccordion = document.getElementById('coachesAccordion');
const coachesIcon = document.getElementById('coachesAccordionIcon');
if (coachesList) {
coachesList.innerHTML = ''; // Pulisci lista prima di aggiungere
if (coaches.length === 0) {
coachesList.innerHTML = '<p style="color: #999; font-style: italic;">Nessun coach attivo</p>';
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
coachesList.style.flexWrap = 'wrap';
coachesList.style.gap = '10px';
coachesList.style.justifyContent = 'center';
}

// Renderizza assistenti
const assistantsList = document.getElementById('assistantsList');
const assistantsAccordion = document.getElementById('assistantsAccordion');
const assistantsIcon = document.getElementById('assistantsAccordionIcon');
if (assistantsList) {
assistantsList.innerHTML = ''; // Pulisci lista prima di aggiungere
if (assistants.length === 0) {
assistantsList.innerHTML = '<p style="color: #999; font-style: italic;">Nessun assistente attivo</p>';
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
assistantsList.style.flexWrap = 'wrap';
assistantsList.style.gap = '10px';
assistantsList.style.justifyContent = 'center';
}

// Renderizza challengers
const challengersList = document.getElementById('challengersList');
const challengersAccordion = document.getElementById('challengersAccordion');
const challengersIcon = document.getElementById('challengersAccordionIcon');
if (challengersList) {
challengersList.innerHTML = ''; // Pulisci lista prima di aggiungere
if (challengers.length === 0) {
challengersList.innerHTML = '<p style="color: #999; font-style: italic;">Nessun challenger attivo</p>';
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
challengersList.style.flexWrap = 'wrap';
challengersList.style.gap = '10px';
challengersList.style.justifyContent = 'center';
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

/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E UTILITY            # */
/* #                                                          # */
/* ############################################################ */
import { auth, db, storage } from "../../js/firebase.js";
import { doc, updateDoc, serverTimestamp, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { showServiceMessage, updatePasswordUI, initGlobalEyes, validatePhoneNumber } from "../../components/general/ui-helper.js";
import { validateTanitaValue, applyTanitaConstraints } from "../tanita/tanita-form-validator.js";
import { getRoleMetadata } from "../../components/general/auth-core.js";
import { loadUserData as loadUserDataFromManager, formatDisplayName, getPhotoURL, getRoleStyles, initUserListener, updateUI, getRankClass } from "../../components/general/user-manager.js";
import { getPlanByObjective, generatePlanHTML } from "./plan-generator.js?v=1.0";

export async function loadPianiAutomatici(userData) {
const planDisplay = document.getElementById('planDataDisplay');
const planContainer = document.getElementById('planResultsContainer');
if (!planDisplay || !planContainer) {
return;
}

if (!userData.mainGoal) {
planDisplay.style.display = 'block';
planDisplay.innerHTML = '<p class="text-center-gray">Seleziona un obiettivo principale per generare il piano personalizzato.</p>';
planContainer.style.display = 'none';
return;
}

const plan = getPlanByObjective(userData.mainGoal);
if (!plan) {
planDisplay.style.display = 'block';
planDisplay.innerHTML = '<p class="text-center-gray">Nessun piano disponibile per questo obiettivo.</p>';
planContainer.style.display = 'none';
return;
}

planDisplay.style.display = 'none';
planContainer.style.display = 'block';
planContainer.innerHTML = generatePlanHTML(plan);
}

/* ############################################################ */
/* #                                                          # */
/* #           2. CONFIGURAZIONE CAMPI E COSTANTI            # */
/* #                                                          # */
/* ############################################################ */
const FIELDS = [
'firstName', 'lastName', 'userEmail', 'userPhone', 
'birthDate', 'height', 'gender', 'weight', 'bodyFat', 
'hydration', 'visceralFat', 'leanMass', 'boneMass', 
'metabolicAge', 'mainGoal', 'targetWeight', 'bio'
];


/* ############################################################ */
/* #                                                          # */
/* #           3. FUNZIONI CALCOLO TANITA E DISPLAY UI       # */
/* #                                                          # */
/* ############################################################ */
export function updateProfileHeader(data) {
const profileImg = document.getElementById('profileImg');
const userNameDisplay = document.getElementById('userNameDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const profileHeaderMain = document.querySelector('.profile-header-main');

if (!profileHeaderMain) return;

const loadProfilePhoto = async () => {
try {
const initials = (formatDisplayName(data, auth.currentUser) || 'U').charAt(0).toUpperCase();
let photoURL = data?.photoURL || '';
let useFallback = false;

if (!photoURL) {
useFallback = true;
} else if (photoURL.startsWith('https://') || photoURL.startsWith('http://')) {
photoURL = photoURL;
} else if (photoURL.startsWith('gs://')) {
try {
const { ref: storageRef, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');
photoURL = await getDownloadURL(storageRef(window.storage, photoURL));
} catch (e) {
useFallback = true;
}
} else {
try {
const { ref: storageRef, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');
const storagePath = photoURL.startsWith('/') ? photoURL.substring(1) : photoURL;
photoURL = await getDownloadURL(storageRef(window.storage, storagePath));
} catch (e) {
useFallback = true;
}
}

const roleData = getRoleMetadata(data?.role || 'Challenger');
const fullName = `${data?.firstName || ''} ${data?.lastName || ''}`.trim() || formatDisplayName(data, auth.currentUser);

if (data?.role === 'admin' || data?.role === 'Coach' || data?.role === 'coach') {
roleData.color = '#b1933a';
}

if (profileImg) {
if (useFallback) {
profileImg.innerHTML = '<i class="fas fa-user"></i>';
profileImg.className = `user-avatar placeholder profile-avatar-big ${roleData.className}`;
} else {
profileImg.innerHTML = `<img src="${photoURL}" class="profile-img-full">`;
profileImg.className = `user-avatar profile-avatar-big ${roleData.className}`;
}
}

if (userNameDisplay) {
userNameDisplay.textContent = fullName;
userNameDisplay.className = 'user-name-display';
}

if (userRoleDisplay) {
userRoleDisplay.className = 'user-role-display';
userRoleDisplay.innerHTML = `<i class="fas ${roleData.icon} role-display-icon" style="color: ${roleData.color};"></i> ${roleData.label}`;
}

if (profileHeaderMain) {
profileHeaderMain.className = 'profile-header-main';
}
} catch (error) {
console.error('Errore caricamento foto profilo:', error);
const initials = (formatDisplayName(data, auth.currentUser) || 'U').charAt(0).toUpperCase();
const roleData = getRoleMetadata(data?.role || 'Challenger');
const fullName = `${data?.firstName || ''} ${data?.lastName || ''}`.trim() || formatDisplayName(data, auth.currentUser);
const photoURL = `https://ui-avatars.com/api/?name=${initials}&background=266431&color=fff`;

// Forza colore Oro per admin
if (data?.role === 'admin' || data?.role === 'Coach' || data?.role === 'coach') {
roleData.color = '#b1933a';
}

if (profileImg) {
profileImg.src = photoURL;
profileImg.className = `user-avatar profile-avatar-big ${roleData.className}`;
}

if (userNameDisplay) {
userNameDisplay.textContent = fullName;
userNameDisplay.className = 'user-name-display';
}

if (userRoleDisplay) {
userRoleDisplay.className = 'user-role-display';
userRoleDisplay.innerHTML = `<i class="fas ${roleData.icon} role-display-icon" style="color: ${roleData.color};"></i> ${roleData.label}`;
}
}
};

loadProfilePhoto();

updateUI(data, auth.currentUser);
}

function updateCoachDisplay(data) {
const fn = document.getElementById('coachFirstName');
const ln = document.getElementById('coachLastName');
const em = document.getElementById('coachEmail');
const ph = document.getElementById('coachPhone');
if (fn) fn.value = data.coachFirstName || '';
if (ln) ln.value = data.coachLastName || '';
if (em) em.value = data.coachEmail || '';
if (ph) ph.value = data.coachPhone || '';
}

export function calculateAge(birthDate) {
if (!birthDate) return 0;
const today = new Date();
const birthDateObj = new Date(birthDate);
let age = today.getFullYear() - birthDateObj.getFullYear();
const monthDiff = today.getMonth() - birthDateObj.getMonth();
if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) age--;
return age;
}

export function calculateBMI(weight, height) {
if (!weight || !height) return 0;
const heightInMeters = height / 100;
return (weight / (heightInMeters * heightInMeters)).toFixed(1);
}

export function calculateNeeds(weight, height, age, gender, leanMass = null, goal = 'maintenance') {
// Specifiche Tanita ufficiali per acqua (differenziate per genere)
let water = 0;
if (gender === 'male') {
water = (weight * 0.035).toFixed(1); // 35ml/kg per uomini
} else {
water = (weight * 0.030).toFixed(1); // 30ml/kg per donne
}

// Specifiche Tanita per proteine (differenziate per genere)
let protein = 0;
if (leanMass) {
switch(goal) {
case 'fat_loss':
protein = gender === 'male' ? Math.round(leanMass * 2.0) : Math.round(leanMass * 1.8);
break;
case 'muscle_gain':
protein = gender === 'male' ? Math.round(leanMass * 2.2) : Math.round(leanMass * 2.0);
break;
default:
protein = gender === 'male' ? Math.round(leanMass * 1.8) : Math.round(leanMass * 1.6);
}
} else {
protein = gender === 'male' ? Math.round(weight * 1.6) : Math.round(weight * 1.2);
}

// Formula Mifflin-St Jeor (standard Tanita per BMR)
let bmr = 0;
if (gender === 'male') {
bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
} else {
bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161);
}

return { water, protein, bmr };
}

function updateBIAParams(data) {
const waterEl = document.getElementById('waterNeedsDisplay');
const proteinEl = document.getElementById('proteinNeedsDisplay');
const bmrEl = document.getElementById('bmrDisplay');

const weight = parseFloat(data.weight);
const height = parseFloat(data.height);
const birthDate = data.birthDate;
const gender = data.gender;

if (weight && height && birthDate && gender) {
const age = calculateAge(birthDate);
const needs = calculateNeeds(weight, height, age, gender);
if (waterEl) waterEl.textContent = `${needs.water} L/giorno`;
if (proteinEl) proteinEl.textContent = `${needs.protein} g/giorno`;
if (bmrEl) bmrEl.textContent = `${needs.bmr} kcal`;
}
}

export function updateCalculations() {
const weightEl = document.getElementById('weight');
const heightEl = document.getElementById('height');
const birthDateEl = document.getElementById('birthDate');
const genderEl = document.getElementById('gender');
const bmiEl = document.getElementById('bmi');
const ageEl = document.getElementById('age');

const waterEl = document.getElementById('waterNeedsDisplay');
const proteinEl = document.getElementById('proteinNeedsDisplay');
const bmrEl = document.getElementById('bmrDisplay');

if (weightEl && heightEl && bmiEl) {
const weight = parseFloat(weightEl.value);
const height = parseFloat(heightEl.value);
if (weight && height) {
bmiEl.value = calculateBMI(weight, height);
if (birthDateEl && genderEl) {
const birthDate = birthDateEl.value;
const gender = genderEl.value;
if (birthDate && gender) {
const age = calculateAge(birthDate);
const needs = calculateNeeds(weight, height, age, gender);
if (waterEl) waterEl.textContent = `${needs.water} L/giorno`;
if (proteinEl) proteinEl.textContent = `${needs.protein} g/giorno`;
if (bmrEl) bmrEl.textContent = `${needs.bmr} kcal`;
}
}
}


/* ############################################################ */
/* #                                                          # */
/* #           FUNZIONI GESTIONE HEADER PROFILO              # */
/* #                                                          # */
/* ############################################################ */


export async function saveAnagrafici(uid) {
const btn = document.getElementById('saveAnagraficiBtn');
try {
const data = {};
const heightEl = document.getElementById('height');
if (heightEl && heightEl.value) {
const v = validateTanitaValue('height', heightEl.value);
if (!v.isValid) { showServiceMessage(v.message, "error", btn); return; }
}

const phoneEl = document.getElementById('userPhone');
if (phoneEl && phoneEl.value) {
const phoneValue = phoneEl.value.trim();
if (phoneValue && !validatePhoneNumber(phoneValue)) {
showServiceMessage("Formato telefono non valido.", "error", btn);
return;
}
}

['firstName', 'lastName', 'userPhone', 'birthDate', 'userEmail'].forEach(f => {
const el = document.getElementById(f);
if (el) data[f] = el.value;
});

const userRef = doc(db, "users", uid);
await updateDoc(userRef, data);
showServiceMessage("Anagrafica salvata con successo!", "success", btn);
} catch (error) {
console.error(error);
showServiceMessage("Errore durante il salvataggio: " + error.message, "error", btn);
}
}

export async function saveInitialBia(uid) {
const btn = document.getElementById('saveInitialBiaBtn');
try {
const fields = ['initialHeight', 'initialAge', 'initialGender', 'initialWeight', 'initialBodyFat', 'initialHydration', 'initialVisceralFat', 'initialLeanMass', 'initialBoneMass', 'initialMetabolicAge'];
const biaData = {};
fields.forEach(f => {
const el = document.getElementById(f);
if (el && el.value !== '') {
const fieldName = f.replace('initial', '').toLowerCase();
if (fieldName === 'gender' || fieldName === 'bodyfat' || fieldName === 'hydration') {
biaData[fieldName] = el.value;
} else {
const parsedValue = parseFloat(el.value);
if (!isNaN(parsedValue)) {
biaData[fieldName] = parsedValue;
}
}
}
});

if (Object.keys(biaData).length === 0) {
showServiceMessage("Inserisci almeno un dato BIA", "error", btn);
return;
}

console.log('Dati BIA da salvare:', biaData);
const userRef = doc(db, "users", uid);
await updateDoc(userRef, {
initial_bia: biaData
});
showServiceMessage("Misurazione BIA iniziale salvata con successo!", "success", btn);
} catch (error) {
console.error(error);
showServiceMessage("Errore durante il salvataggio: " + error.message, "error", btn);
}
}

export async function loadInitialBiaData(uid) {
try {
console.log('Caricamento dati BIA iniziali per UID:', uid);
const userRef = doc(db, "users", uid);
const userSnap = await getDoc(userRef);
if (userSnap.exists()) {
const userData = userSnap.data();
console.log('Dati utente:', userData);
const initialBia = userData.initial_bia;
console.log('Dati initial_bia:', initialBia);
if (initialBia) {
const fieldMapping = {
height: 'initialHeight',
age: 'initialAge',
gender: 'initialGender',
weight: 'initialWeight',
bodyfat: 'initialBodyFat',
hydration: 'initialHydration',
visceralfat: 'initialVisceralFat',
leanmass: 'initialLeanMass',
bonemass: 'initialBoneMass',
metabolicage: 'initialMetabolicAge'
};

Object.keys(fieldMapping).forEach(key => {
const elementId = fieldMapping[key];
const el = document.getElementById(elementId);
console.log(`Campo ${key} -> ${elementId}, valore: ${initialBia[key]}, elemento trovato: ${!!el}`);
if (el && initialBia[key] !== undefined) {
el.value = initialBia[key];
console.log(`Impostato ${elementId} = ${initialBia[key]}`);
}
});
} else {
console.log('Nessun dato initial_bia trovato');
}
} else {
console.log('Utente non trovato');
}
} catch (error) {
console.error('Errore caricamento dati BIA iniziali:', error);
}
}

export async function saveObiettivi(uid) {
const btn = document.querySelector('#obiettiviForm button[type="submit"]');
try {
const mainGoal = document.getElementById('mainGoal').value;
const targetWeight = document.getElementById('target_weight').value;

if (!mainGoal) {
showServiceMessage("Seleziona un obiettivo principale", "error", btn);
return;
}

const data = {
mainGoal: mainGoal,
targetWeight: targetWeight ? parseFloat(targetWeight) : null
};

const userRef = doc(db, "users", uid);
await updateDoc(userRef, data);
showServiceMessage("Obiettivi salvati con successo!", "success", btn);

// Aggiorna piano automatico dopo salvataggio
const userSnap = await getDoc(userRef);
if (userSnap.exists()) {
const userData = userSnap.data();
loadPianiAutomatici(userData);
}
} catch (error) {
console.error(error);
showServiceMessage("Errore durante il salvataggio: " + error.message, "error", btn);
}
}

export async function loadObiettiviData(uid) {
try {
const userRef = doc(db, "users", uid);
const userSnap = await getDoc(userRef);
if (userSnap.exists()) {
const userData = userSnap.data();
const mainGoalEl = document.getElementById('mainGoal');
const targetWeightEl = document.getElementById('target_weight');
if (mainGoalEl && userData.mainGoal) mainGoalEl.value = userData.mainGoal;
if (targetWeightEl && userData.targetWeight) targetWeightEl.value = userData.targetWeight;
}
} catch (error) {
console.error('Errore caricamento dati obiettivi:', error);
}
}

/* ############################################################ */
/* #                                                          # */
/* #           5. GESTIONE SICUREZZA E PASSWORD              # */
/* #                                                          # */
/* ############################################################ */
export async function handleChangePassword() {
const btn = document.getElementById('changePasswordBtn');
const currentPass = document.getElementById('currentPassword').value;
const newPass = document.getElementById('newPassword').value;
const user = auth.currentUser;
if (!currentPass || !newPass) { showServiceMessage("Compila i campi password.", "error", btn); return; }
if (!updatePasswordUI(newPass)) { showServiceMessage("Password non valida.", "error", btn); return; }
try {
btn.disabled = true;
btn.innerHTML = 'Sincronizzazione...';
const cred = EmailAuthProvider.credential(user.email, currentPass);
await reauthenticateWithCredential(user, cred);
await updatePassword(user, newPass);
showServiceMessage("Successo!", "success", btn);
document.getElementById('currentPassword').value = '';
document.getElementById('newPassword').value = '';
updatePasswordUI('');
} catch (e) { showServiceMessage(e.message, "error", btn); } 
finally { btn.disabled = false; btn.innerHTML = 'Sincronizza Nuova Password'; }
}


/* ############################################################ */
/* #                                                          # */
/* #           6. CARICAMENTO E SETUP AZIONI                  # */
/* #                                                          # */
/* ############################################################ */
export async function loadUserData(uid) {
try {
const data = await loadUserDataFromManager(db, uid);
if (data && Object.keys(data).length > 0) {
FIELDS.forEach(f => {
const el = document.getElementById(f);
if (el && data[f]) el.value = data[f];
});
updateProfileHeader(data);
updateCoachDisplay(data);
updateCalculations();
updateBIAParams(data);
await loadBIAData(uid); // Carica dati BIA dal database
}
} catch (e) { console.error(e); }
}

export async function loadBIAData(uid) {
try {
const userRef = doc(db, "users", uid);
const userDoc = await getDoc(userRef);
const userData = userDoc.data();
const latestBia = userData?.latest_bia;

if (latestBia) {
// Aggiorna UI con dati BIA
updateBIADisplay(latestBia);
}
} catch (error) {
console.error("Errore caricamento dati BIA:", error);
}
}

export function updateBIADisplay(biaData) {
// Aggiorna barra ricomposizione corporea
const rankingIndicator = document.getElementById('rankingIndicator');
const rankingText = document.getElementById('rankingText');

if (rankingIndicator && biaData.bodyFat) {
const bodyFat = parseFloat(biaData.bodyFat);
const gender = biaData.gender || document.getElementById('gender')?.value;

let position = 0;
let text = '--';

if (gender === 'male') {
if (bodyFat >= 8 && bodyFat <= 19) {
position = 75;
text = 'Eccellente';
} else if (bodyFat >= 20 && bodyFat <= 24) {
position = 50;
text = 'Buono';
} else if (bodyFat >= 25 && bodyFat <= 29) {
position = 25;
text = 'Sufficiente';
} else {
position = 5;
text = 'Scarso';
}
} else {
if (bodyFat >= 14 && bodyFat <= 20) {
position = 75;
text = 'Eccellente';
} else if (bodyFat >= 21 && bodyFat <= 28) {
position = 50;
text = 'Buono';
} else if (bodyFat >= 29 && bodyFat <= 32) {
position = 25;
text = 'Sufficiente';
} else {
position = 5;
text = 'Scarso';
}
}

rankingIndicator.style.left = `${position}%`;
if (rankingText) rankingText.textContent = text;
}

// Aggiorna fabbisogni calcolati
const waterNeedsDisplay = document.getElementById('waterNeedsDisplay');
const proteinNeedsDisplay = document.getElementById('proteinNeedsDisplay');
const bmrDisplay = document.getElementById('bmrDisplay');
const needsDataDisplay = document.getElementById('needsDataDisplay');
const needsResultsContainer = document.getElementById('needsResultsContainer');

if (waterNeedsDisplay && biaData.waterNeeds) {
waterNeedsDisplay.textContent = `${biaData.waterNeeds} L/giorno`;
}
if (proteinNeedsDisplay && biaData.proteinNeeds) {
proteinNeedsDisplay.textContent = `${biaData.proteinNeeds} g/giorno`;
}
if (bmrDisplay && biaData.bmr) {
bmrDisplay.textContent = `${biaData.bmr} kcal`;
}

// Mostra risultati nascondendo messaggio "nessun dato"
if (needsDataDisplay && needsResultsContainer) {
needsDataDisplay.classList.add('hidden');
needsResultsContainer.classList.remove('results-container-hidden');
}
}

export function setupProfiloActions(uid) {
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');
const isCoachView = targetUid && auth.currentUser && targetUid !== auth.currentUser.uid;

// Gestione submit form anagrafici
const anagraficiForm = document.getElementById('anagraficiForm');
if (anagraficiForm) {
anagraficiForm.addEventListener('submit', (e) => {
e.preventDefault();
saveAnagrafici(uid);
});
}

// Gestione submit form password
const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
passwordForm.addEventListener('submit', (e) => {
e.preventDefault();
handleChangePassword();
});
}

// Gestione submit form BIA iniziale
const initialBiaForm = document.getElementById('initialBiaForm');
if (initialBiaForm) {
initialBiaForm.addEventListener('submit', (e) => {
e.preventDefault();
const uidToUse = targetUid || (auth.currentUser && auth.currentUser.uid);
if (uidToUse) {
saveInitialBia(uidToUse);
} else {
console.error('Nessun UID disponibile per salvare i dati BIA iniziali');
}
});
}

// Gestione submit form obiettivi
const obiettiviForm = document.getElementById('obiettiviForm');
if (obiettiviForm) {
obiettiviForm.addEventListener('submit', (e) => {
e.preventDefault();
const uidToUse = targetUid || (auth.currentUser && auth.currentUser.uid);
if (uidToUse) {
saveObiettivi(uidToUse);
} else {
console.error('Nessun UID disponibile per salvare gli obiettivi');
}
});
}

// Nascondi sezione sicurezza se è vista dal coach
if (isCoachView) {
const securitySection = document.querySelector('.security-section');
if (securitySection) securitySection.style.display = 'none';

// RIMOSSO TEMPORANEAMENTE: Disabilita i campi anagrafici e obiettivi (sola lettura per il coach)
// const fieldsToLock = ['firstName', 'lastName', 'userEmail', 'userPhone', 'birthDate', 'gender', 'height', 'mainGoal', 'target_weight', 'bio'];
// fieldsToLock.forEach(f => {
// const el = document.getElementById(f);
// if (el) {
// el.readOnly = true;
// el.disabled = true; // Forza il blocco totale per tutti i tipi di input
// el.style.backgroundColor = '#f9f9f9'; // Feedback visivo di blocco
// el.style.cursor = 'not-allowed';
// }
// });
}

const newPassInput = document.getElementById('newPassword');
if (newPassInput) newPassInput.oninput = (e) => updatePasswordUI(e.target.value);

// Avatar cliccabile per caricare foto
const profileImg = document.getElementById('profileImg');
const photoInput = document.getElementById('photoInput');
if (profileImg && photoInput) {
profileImg.onclick = () => photoInput.click();
}

// Upload foto con getDownloadURL
if (photoInput) {
photoInput.onchange = async (e) => {
const file = e.target.files[0];
if (file) {
try {
const { uploadBytes, getDownloadURL, ref: storageRef } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');
const userId = auth.currentUser.uid;
const timestamp = Date.now();
const fileName = `profile_${timestamp}_${file.name}`;
const storagePath = `users/${userId}/${fileName}`;
const storageRefPath = storageRef(storage, storagePath);

showServiceMessage("Caricamento foto in corso...", "info", photoInput.parentElement);

await uploadBytes(storageRefPath, file);
const downloadURL = await getDownloadURL(storageRefPath);

console.log("URL pubblico ottenuto:", downloadURL);

await updateDoc(doc(db, "users", userId), {
photoURL: downloadURL
});

console.log("Foto salvata correttamente in Firestore:", downloadURL);

const avatarImg = document.querySelector('.user-avatar');
if (avatarImg) {
avatarImg.src = downloadURL;
const currentClass = avatarImg.className;
avatarImg.className = currentClass;
}

showServiceMessage("Foto caricata con successo!", "success", photoInput.parentElement);
} catch (error) {
console.error('Errore upload foto:', error);
showServiceMessage("Errore caricamento foto: " + error.message, "error", photoInput.parentElement);
}
}
};
}
FIELDS.forEach(f => {
const el = document.getElementById(f);
if (el) el.oninput = updateCalculations;
});
applyTanitaConstraints();
initGlobalEyes();
}


/* ############################################################ */
/* #                                                          # */
/* #           6. CARICAMENTO COACH & ASSISTENTI             # */
/* #                                                          # */
/* ############################################################ */
async function loadCoachesAndAssistantsForProfile() {
try {
const usersSnapshot = await getDocs(collection(db, "users"));
const coaches = [];
const assistants = [];

usersSnapshot.forEach(doc => {
const user = doc.data();
const role = (user.role || '').toLowerCase();

if (role === 'admin' || role === 'coach') {
coaches.push({
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || ''
});
} else if (role === 'assistant' || role === 'assistente') {
assistants.push({
firstName: user.firstName || '',
lastName: user.lastName || '',
email: user.email || '',
phone: user.phone || ''
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

console.log(`Caricati ${coaches.length} coach e ${assistants.length} assistenti nel profilo`);
} catch (error) {
console.error('Errore caricamento coach/assistenti nel profilo:', error);
}
}

export function displayNeedsResults(water, protein, bmr) {
const waterNeedsDisplay = document.getElementById('waterNeedsDisplay');
const proteinNeedsDisplay = document.getElementById('proteinNeedsDisplay');
const bmrDisplay = document.getElementById('bmrDisplay');

if (waterNeedsDisplay && water) {
waterNeedsDisplay.textContent = `${water} L/giorno`;
}
if (proteinNeedsDisplay && protein) {
proteinNeedsDisplay.textContent = `${protein} g/giorno`;
}
if (bmrDisplay && bmr) {
bmrDisplay.textContent = `${bmr} kcal`;
}
}

export function calculatePhysiqueRating(bodyFat, leanMass, gender, height) {
console.log('[DEBUG calculatePhysiqueRating] Input:', { bodyFat, leanMass, gender, height });
const bf = parseFloat(bodyFat);
const lm = parseFloat(leanMass);
const heightM = parseFloat(height) / 100;

// 1. Calcolo SMI (Skeletal Muscle Index)
const smi = heightM > 0 ? lm / (heightM * heightM) : 0;
console.log('[DEBUG calculatePhysiqueRating] SMI calculated:', smi);

// 2. Logica dei Livelli di Grasso (Soglie Tanita ufficiali)
let fatLevel = 'medium';
if (gender === 'male') {
if (bf < 13) fatLevel = 'low';
else if (bf >= 25) fatLevel = 'high';
} else {
if (bf < 23) fatLevel = 'low';
else if (bf >= 34) fatLevel = 'high';
}
console.log('[DEBUG calculatePhysiqueRating] fatLevel:', fatLevel);

// 3. Logica dei Livelli Muscolari (Soglie Tanita ufficiali SMI)
let muscleLevel = 'medium';
if (gender === 'male') {
if (smi < 8.2) muscleLevel = 'low';
else if (smi >= 10.0) muscleLevel = 'high';
} else {
if (smi < 6.3) muscleLevel = 'low';
else if (smi >= 8.0) muscleLevel = 'high';
}
console.log('[DEBUG calculatePhysiqueRating] muscleLevel:', muscleLevel);

// 4. Matrice Physique Rating Tanita ufficiale
const ratingMatrix = {
'high-low': { id: 1, name: 'Obeso Falso Magro (Hidden Obese)', description: `Questa categoria indica un'alta percentuale di grasso corporeo a fronte di una massa muscolare ridotta.<br>Anche se l'aspetto esteriore può sembrare normale, i livelli di grasso sono eccessivi.<br>Questa condizione può evolvere in obesità con conseguenti rischi per la salute.` },
'high-medium': { id: 2, name: 'Obeso (Obese)', description: `Indica un'alta percentuale di grasso corporeo e un livello di massa muscolare standard.<br>Chi rientra in questa categoria deve prestare attenzione, poiché l'obesità può causare gravi problemi di salute.` },
'high-high': { id: 3, name: 'Robusto (Solidly-built)', description: `Significa che si ha un'alta percentuale di grasso, ma anche un livello elevato di massa muscolare.<br>Nonostante l'aspetto imponente, sotto lo strato di adipe è presente una muscolatura sviluppata.` },
'medium-low': { id: 4, name: 'Poco Allenato (Under exercised)', description: `Indica una percentuale di grasso media associata a una massa muscolare scarsa.<br>Per migliorare questa condizione, è consigliabile iniziare un programma di allenamento regolare.` },
'medium-medium': { id: 5, name: 'Standard', description: `Un fisico standard presenta livelli medi sia di grasso corporeo che di massa muscolare.<br>Chi ha questa costituzione può ottenere ottimi progressi con l'allenamento.` },
'medium-high': { id: 6, name: 'Standard Muscoloso (Standard Muscular)', description: `Indica una percentuale di grasso media e un alto livello di massa muscolare.<br>È una condizione fisica salutare di cui andare fieri, tipica di molti atleti.` },
'low-low': { id: 7, name: 'Magro (Thin)', description: `Significa che si hanno livelli bassi sia di grasso che di muscoli. Mentre un'eccessiva magrezza può essere rischiosa, essere leggermente sottopeso è accettabile.` },
'low-medium': { id: 8, name: 'Magro e Muscoloso (Thin and Muscular)', description: `Questa categoria indica una bassa percentuale di grasso corporeo unita a un livello standard di massa muscolare.` },
'low-high': { id: 9, name: 'Molto Muscoloso (Very Muscular)', description: `Le persone molto muscolose presentano una bassa percentuale di grasso corporeo e un livello di massa muscolare molto elevato.` }
};

const key = `${fatLevel}-${muscleLevel}`;
const result = ratingMatrix[key] || ratingMatrix['medium-medium'];
console.log('[DEBUG calculatePhysiqueRating] result:', result, 'key:', key);
return result;
}

export function updateDots(data, gender, userData) {
console.log('[DEBUG updateDots] Input:', { data, gender, userData });
if (!data) return;

const metrics = [
{ id: 'bmi', value: data.bmi, thresholds: [18.5, 25, 30], higherIsWorse: true },
{ id: 'bodyFat', value: data.bodyFat, thresholds: [14, 24, 30], higherIsWorse: true },
{ id: 'hydration', value: data.hydration, thresholds: [45, 55, 65], higherIsWorse: false },
{ id: 'visceralFat', value: data.visceralFat, thresholds: [5, 10, 15], higherIsWorse: true },
{ id: 'leanMass', value: data.leanMass, thresholds: [40, 60, 80], higherIsWorse: false },
{ id: 'boneMass', value: data.boneMass, thresholds: [2.5, 3.5, 4.5], higherIsWorse: false },
{ id: 'metabolicAge', value: data.metabolicAge, thresholds: [30, 40, 50], higherIsWorse: true }
];

metrics.forEach(metric => {
const dotEl = document.getElementById(`${metric.id}Dot`);
console.log(`[DEBUG updateDots] Metric ${metric.id}: value=${metric.value}, dot found=${!!dotEl}`);
if (!dotEl || !metric.value) return;

const value = parseFloat(metric.value);
console.log(`[DEBUG updateDots] Metric ${metric.id}: parsed=${value}`);

let color;
if (metric.higherIsWorse) {
if (value <= metric.thresholds[0]) {
color = '#266431';
} else if (value <= metric.thresholds[1]) {
color = '#42a046';
} else if (value <= metric.thresholds[2]) {
color = '#f39c12';
} else {
color = '#e74c3c';
}
} else {
if (value >= metric.thresholds[2]) {
color = '#266431';
} else if (value >= metric.thresholds[1]) {
color = '#42a046';
} else if (value >= metric.thresholds[0]) {
color = '#f39c12';
} else {
color = '#e74c3c';
}
}

dotEl.style.background = color;
console.log(`[DEBUG updateDots] Metric ${metric.id}: color=${color}`);
});
}

export function updateRecompositionProgress(initialBia, latestBia) {
if (!initialBia || !latestBia) return;

// Gestisce entrambi i formati (minuscolo e camelCase) per dati esistenti
const initialBodyFat = parseFloat(initialBia.bodyFat?.toString().replace(',', '.') || initialBia.bodyfat?.toString().replace(',', '.') || 0);
const latestBodyFat = parseFloat(latestBia.bodyFat?.toString().replace(',', '.') || latestBia.bodyfat?.toString().replace(',', '.') || 0);
const initialLeanKg = parseFloat(initialBia.leanMass || initialBia.leanmass || 0);
const latestLeanKg = parseFloat(latestBia.leanMass || latestBia.leanmass || 0);

// Calcola massa grassa usando percentuale bodyFat (formula Tanita)
const initialFatKg = (initialBia.weight * initialBodyFat) / 100;
const latestFatKg = (latestBia.weight * latestBodyFat) / 100;

// Delta per ricomposizione
const fatDeltaKg = latestFatKg - initialFatKg;
const leanDeltaKg = latestLeanKg - initialLeanKg;
const weightDelta = latestBia.weight - initialBia.weight;

// Scenari ricomposizione per challenge 21 giorni (logica Tanita)
let scenario = '';
let color = '#6c757d';
if (fatDeltaKg < 0 && leanDeltaKg > 0) {
scenario = 'Ricomposizione Perfetta';
color = '#28a745';
} else if (weightDelta <= -0.5 && fatDeltaKg <= -0.5) {
scenario = 'Dimagrimento Eccellente';
color = '#17a2b8';
} else if (weightDelta >= 0.5 && leanDeltaKg >= 0.5) {
scenario = 'Lean Bulk';
color = '#ffc107';
} else {
scenario = 'Maintenance';
}

// Aggiorna UI con valori iniziali, nuovi e delta
const weightInitialEl = document.getElementById('weightInitial');
const weightLatestEl = document.getElementById('weightLatest');
const weightDeltaEl = document.getElementById('weightDelta');
const fatInitialEl = document.getElementById('fatInitial');
const fatLatestEl = document.getElementById('fatLatest');
const fatDeltaEl = document.getElementById('fatDelta');
const leanInitialEl = document.getElementById('leanInitial');
const leanLatestEl = document.getElementById('leanLatest');
const leanDeltaEl = document.getElementById('leanDelta');
const scenarioEl = document.getElementById('recompositionScenario');

if (weightInitialEl) weightInitialEl.textContent = `${initialBia.weight.toFixed(1)} kg`;
if (weightLatestEl) weightLatestEl.textContent = `${latestBia.weight.toFixed(1)} kg`;
if (weightDeltaEl) weightDeltaEl.textContent = `${weightDelta >= 0 ? '+' : ''}${weightDelta.toFixed(1)} kg`;
if (fatInitialEl) fatInitialEl.textContent = `${initialFatKg.toFixed(1)} kg`;
if (fatLatestEl) fatLatestEl.textContent = `${latestFatKg.toFixed(1)} kg`;
if (fatDeltaEl) fatDeltaEl.textContent = `${fatDeltaKg >= 0 ? '+' : ''}${fatDeltaKg.toFixed(1)} kg`;
if (leanInitialEl) leanInitialEl.textContent = `${initialLeanKg.toFixed(1)} kg`;
if (leanLatestEl) leanLatestEl.textContent = `${latestLeanKg.toFixed(1)} kg`;
if (leanDeltaEl) leanDeltaEl.textContent = `${leanDeltaKg >= 0 ? '+' : ''}${leanDeltaKg.toFixed(1)} kg`;

if (scenarioEl) {
scenarioEl.textContent = scenario;
scenarioEl.style.color = color;
}
}

export function updatePhysiqueRatingBar(rating) {
if (!rating) return;

const indicator = document.getElementById('physiqueRatingIndicator');
const textEl = document.getElementById('physiqueRatingText');

if (indicator && textEl) {
const position = ((rating.id - 1) / 8) * 100;
const centeredPosition = Math.max(0, Math.min(100, position - 3));
indicator.style.left = `${centeredPosition}%`;
indicator.style.background = '#fff';
indicator.style.border = '2px solid #000';
textEl.textContent = rating.name;
}
}

export function setupBIAInputListeners() {
const inputs = ['initialHeight', 'initialAge', 'initialWeight', 'initialGender', 'initialBodyFat', 'initialMetabolicAge', 'initialHydration', 'initialVisceralFat', 'initialLeanMass', 'initialBoneMass'];
inputs.forEach(id => {
const el = document.getElementById(id);
if (el) {
el.addEventListener('input', () => {
updateBIACalculations();
});
}
});
}

export function updateBIACalculations() {
try {
const height = parseFloat(document.getElementById('initialHeight')?.value) || 0;
const weight = parseFloat(document.getElementById('initialWeight')?.value) || 0;
const age = parseFloat(document.getElementById('initialAge')?.value) || 0;
const gender = document.getElementById('initialGender')?.value || 'male';
const bodyFat = parseFloat(document.getElementById('initialBodyFat')?.value) || 0;
const leanMass = parseFloat(document.getElementById('initialLeanMass')?.value) || 0;

if (height && weight) {
const bmi = weight / ((height / 100) ** 2);
const bmiEl = document.getElementById('initialBMI');
if (bmiEl) bmiEl.value = bmi.toFixed(1);
}

if (height && weight && bodyFat && leanMass && gender) {
const rating = calculatePhysiqueRating(bodyFat, leanMass, gender, height);
const physiqueRatingEl = document.getElementById('physiqueRating');
const physiqueRatingDescEl = document.getElementById('physiqueRatingDescription');
const physiqueRatingDotEl = document.getElementById('physiqueRatingDot');

let color;
if (rating.id <= 3) {
color = '#f44336';
} else if (rating.id <= 6) {
color = '#ff9800';
} else if (rating.id <= 8) {
color = '#42a046';
} else {
color = '#266431';
}

if (physiqueRatingEl && rating) {
physiqueRatingEl.textContent = `${rating.id} - ${rating.name}`;
physiqueRatingEl.style.color = color;
}
if (physiqueRatingDescEl && rating) {
physiqueRatingDescEl.innerHTML = rating.description;
}
if (physiqueRatingDotEl && rating) {
physiqueRatingDotEl.style.background = color;
}
}
} catch (e) {
console.error('Errore aggiornamento calcoli BIA:', e);
}
}

export async function loadNeedsResultsUnified(userId) {
try {
const userDoc = await getDoc(doc(db, "users", userId));
if (userDoc.exists()) {
const userData = userDoc.data();
const latestBia = userData.latest_bia;

if (latestBia) {
const needsDataDisplay = document.getElementById('needsDataDisplay');
const needsResultsContainer = document.getElementById('needsResultsContainer');

if (needsDataDisplay) needsDataDisplay.style.display = 'none';
if (needsResultsContainer) needsResultsContainer.classList.remove('results-container-hidden');

displayNeedsResults(latestBia.waterNeeds, latestBia.proteinNeeds, latestBia.bmr);
}
}
} catch (error) {
console.error('Errore caricamento fabbisogni:', error);
}
}

export async function loadBIAResults(userId) {
console.log('loadBIAResults chiamata per userId:', userId);
try {
const userDoc = await getDoc(doc(db, "users", userId));
if (userDoc.exists()) {
const userData = userDoc.data();
const latestBia = userData.latest_bia;
console.log('latestBia:', latestBia);

if (latestBia) {
const bmiResult = document.getElementById('bmiResult');
const bodyFatResult = document.getElementById('bodyFatResult');
const hydrationResult = document.getElementById('hydrationResult');
const visceralFatResult = document.getElementById('visceralFatResult');
const leanMassResult = document.getElementById('leanMassResult');
const boneMassResult = document.getElementById('boneMassResult');
const metabolicAgeResult = document.getElementById('metabolicAgeResult');
const physiqueRating = document.getElementById('physiqueRating');
const physiqueRatingDescription = document.getElementById('physiqueRatingDescription');
const physiqueRatingDot = document.getElementById('physiqueRatingDot');

console.log('Elementi trovati:', { bmiResult, bodyFatResult, hydrationResult, visceralFatResult, leanMassResult, boneMassResult, metabolicAgeResult, physiqueRating, physiqueRatingDescription, physiqueRatingDot });

if (bmiResult && latestBia.bmi) {
bmiResult.textContent = latestBia.bmi;
console.log('BMI impostato a:', latestBia.bmi);
}
if (bodyFatResult && latestBia.bodyFat) {
bodyFatResult.textContent = `${latestBia.bodyFat} %`;
console.log('BodyFat impostato a:', latestBia.bodyFat);
}
if (hydrationResult && latestBia.hydration) {
hydrationResult.textContent = `${latestBia.hydration} %`;
console.log('Hydration impostata a:', latestBia.hydration);
}
if (visceralFatResult && latestBia.visceralFat) {
visceralFatResult.textContent = latestBia.visceralFat;
console.log('VisceralFat impostato a:', latestBia.visceralFat);
}
if (leanMassResult && latestBia.leanMass) {
leanMassResult.textContent = `${latestBia.leanMass} kg`;
console.log('LeanMass impostato a:', latestBia.leanMass);
}
if (boneMassResult && latestBia.boneMass) {
boneMassResult.textContent = `${latestBia.boneMass} kg`;
console.log('BoneMass impostato a:', latestBia.boneMass);
}
if (metabolicAgeResult && latestBia.metabolicAge) {
metabolicAgeResult.textContent = latestBia.metabolicAge;
console.log('MetabolicAge impostato a:', latestBia.metabolicAge);
}

if (latestBia.bodyFat && latestBia.leanMass && userData.gender) {
const height = userData.height || (userData.initial_bia?.height) || (userData.latest_bia?.height);
console.log('[DEBUG PROFILE] Calcolo Physique Rating con:', {
bodyFat: latestBia.bodyFat,
leanMass: latestBia.leanMass,
gender: userData.gender,
height: height
});
const rating = calculatePhysiqueRating(latestBia.bodyFat, latestBia.leanMass, userData.gender, height);
console.log('[DEBUG PROFILE] Physique Rating calcolato:', rating);

if (physiqueRating && rating.name) {
physiqueRating.textContent = `${rating.id} - ${rating.name}`;
console.log('Physique Rating name impostato a:', rating.name);
}
if (physiqueRatingDescription && rating.description) {
physiqueRatingDescription.innerHTML = rating.description;
console.log('Physique Rating description impostata a:', rating.description);
}
if (physiqueRatingDot && rating.id) {
let color;
if (rating.id <= 3) {
color = '#f44336';
} else if (rating.id <= 6) {
color = '#ff9800';
} else if (rating.id <= 8) {
color = '#42a046';
} else {
color = '#266431';
}
physiqueRatingDot.style.background = color;
console.log('Physique Rating dot color impostato a:', color);
}

updatePhysiqueRatingBar(rating);

if (latestBia && userData.gender) {
updateDots(latestBia, userData.gender, userData);
}

if (userData.initial_bia && latestBia) {
updateRecompositionProgress(userData.initial_bia, latestBia);
}

loadPianiAutomatici(latestBia, userData);
}
} else {
console.log('latestBia non trovato');
}
}
} catch (error) {
console.error('Errore caricamento dati BIA:', error);
}
}

export async function loadBIADisplay() {
const user = auth.currentUser;
if (!user) return;
try {
const userDoc = await getDoc(doc(db, "users", user.uid));
if (userDoc.exists()) {
const userData = userDoc.data();
const latestBia = userData.latest_bia;
if (latestBia) {
document.getElementById('biaDataDisplay').style.display = 'none';
document.getElementById('biaResultsContainer').style.display = 'block';
displayBIADResults(latestBia, userData);
}
loadPianiAutomatici(latestBia, userData);
updateBadgeStatus(userData);
}
} catch (error) {
console.error('Errore caricamento dati BIA:', error);
}
}

export function updateBadgeStatus(userData, userId = null) {
const badgeEl = document.getElementById(userId ? `badgeStatus-${userId}` : 'badgeStatus');
if (!badgeEl) return;

if (!userData || !userData.latest_bia || !userData.initial_bia) {
badgeEl.innerHTML = '<i class="fas fa-rocket"></i>';
badgeEl.className = 'badge-status level-0';
return;
}

const latest = userData.latest_bia;
const initial = userData.initial_bia;
const goal = userData.mainGoal;

// Calcola delta ricomposizione corporea
const initialBodyFat = parseFloat(initial.bodyFat?.toString().replace(',', '.') || initial.bodyfat?.toString().replace(',', '.') || 0);
const latestBodyFat = parseFloat(latest.bodyFat?.toString().replace(',', '.') || latest.bodyfat?.toString().replace(',', '.') || 0);
const initialLeanKg = parseFloat(initial.leanMass || initial.leanmass || 0);
const latestLeanKg = parseFloat(latest.leanMass || latest.leanmass || 0);

const initialFatKg = (initial.weight * initialBodyFat) / 100;
const latestFatKg = (latest.weight * latestBodyFat) / 100;

const fatDeltaKg = latestFatKg - initialFatKg;
const leanDeltaKg = latestLeanKg - initialLeanKg;
const weightDelta = latest.weight - initial.weight;

// Determina livello badge in base all'obiettivo e allo scenario di ricomposizione
let level = 0;
let icon = 'fa-rocket';

if (goal === 'weight_loss') {
// Per weight_loss valuta solo dimagrimento
if (weightDelta <= -0.5 && fatDeltaKg <= -0.5) {
level = 3;
icon = 'fa-trophy';
} else if (weightDelta <= -0.5 || fatDeltaKg <= -0.5) {
level = 2;
icon = 'fa-flag-checkered';
} else if (weightDelta <= 0 || fatDeltaKg <= 0) {
level = 1;
icon = 'fa-chart-line';
} else {
level = 0;
icon = 'fa-rocket';
}
} else if (goal === 'muscle_gain') {
// Per muscle_gain valuta solo aumento massa
if (weightDelta >= 0.5 && leanDeltaKg >= 0.5) {
level = 3;
icon = 'fa-trophy';
} else if (weightDelta >= 0.5 || leanDeltaKg >= 0.5) {
level = 2;
icon = 'fa-flag-checkered';
} else if (weightDelta >= 0 || leanDeltaKg >= 0) {
level = 1;
icon = 'fa-chart-line';
} else {
level = 0;
icon = 'fa-rocket';
}
} else if (goal === 'toning') {
// Per toning valuta ricomposizione
if (fatDeltaKg < 0 && leanDeltaKg > 0) {
level = 3;
icon = 'fa-trophy';
} else if (fatDeltaKg < 0 || leanDeltaKg > 0) {
level = 2;
icon = 'fa-flag-checkered';
} else if (fatDeltaKg <= 0 || leanDeltaKg >= 0) {
level = 1;
icon = 'fa-chart-line';
} else {
level = 0;
icon = 'fa-rocket';
}
} else {
// Per maintenance valuta stabilità
const fatVariation = Math.abs(fatDeltaKg);
const weightVariation = Math.abs(weightDelta);
if (fatVariation < 0.5 && weightVariation < 0.5) {
level = 3;
icon = 'fa-trophy';
} else if (fatVariation < 1 && weightVariation < 1) {
level = 2;
icon = 'fa-flag-checkered';
} else if (fatVariation < 2 && weightVariation < 2) {
level = 1;
icon = 'fa-chart-line';
} else {
level = 0;
icon = 'fa-rocket';
}
}

badgeEl.innerHTML = `<i class="fas ${icon}"></i>`;
badgeEl.className = 'badge-status level-' + level;

const avgStars = userData.averageRating || 0;
if (avgStars > 4.5) {
badgeEl.classList.add('gold');
}
}

export function loadFabbisogni(latestBia, userData) {
if (!latestBia) return;
const needsDisplay = document.getElementById('needsDataDisplay');
const needsContainer = document.getElementById('needsResultsContainer');
if (!needsDisplay || !needsContainer) return;
const water = latestBia.waterNeeds || userData.waterNeeds;
const protein = latestBia.proteinNeeds || userData.proteinNeeds;
let bmr = latestBia.bmr || userData.bmr;
if (!bmr && latestBia.weight && userData.height && userData.age) {
bmr = calculateBMR(latestBia.weight, userData.height, userData.age, userData.gender);
}
if (water || protein || bmr) {
needsDisplay.style.display = 'none';
needsContainer.style.display = 'block';
const waterEl = document.getElementById('waterNeedsDisplay');
const proteinEl = document.getElementById('proteinNeedsDisplay');
const bmrEl = document.getElementById('bmrDisplay');
if (waterEl && water) waterEl.textContent = `${water} L/giorno`;
if (proteinEl && protein) proteinEl.textContent = `${protein} g/giorno`;
if (bmrEl && bmr) bmrEl.textContent = `${Math.round(bmr)} kcal`;
}
}

export function calculateBMR(weight, height, age, gender) {
if (gender === 'male') {
return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
} else {
return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
}
}

export function displayBIADResults(biaData, userData) {
const bmi = calculateBMI(biaData.weight, userData.height);
const bmiEl = document.getElementById('bmiResult');
if (bmiEl && bmi && typeof bmi === 'number' && !isNaN(bmi)) bmiEl.textContent = bmi.toFixed(1);

const fields = [
{ field: 'bodyFat', result: 'bodyFatResult', unit: ' %' },
{ field: 'hydration', result: 'hydrationResult', unit: ' %' },
{ field: 'visceralFat', result: 'visceralFatResult', unit: '' },
{ field: 'leanMass', result: 'leanMassResult', unit: ' kg' },
{ field: 'boneMass', result: 'boneMassResult', unit: ' kg' },
{ field: 'metabolicAge', result: 'metabolicAgeResult', unit: '' }
];

fields.forEach(f => {
const el = document.getElementById(f.result);
if (el && biaData[f.field]) el.textContent = biaData[f.field] + f.unit;
});

const physiqueRating = calculatePhysiqueRating(biaData.bodyFat, biaData.leanMass, userData.gender);
const physiqueEl = document.getElementById('physiqueRating');
if (physiqueEl) physiqueEl.textContent = `${physiqueRating.id} - ${physiqueRating.name}`;

updateDots(biaData, userData.gender, userData);
updateRankingBar(userData);
}

export function getTanitaStatus(field, value, gender, userData) {
const rules = {
weight: { min: 30, max: 200, unit: 'kg', tips: { low: 'Aumenta introito calorico', normal: 'Peso ottimale', high: 'Riduci calorie' } },
bodyFat: {
male: { low: { min: 8, max: 19, color: '#42a046', tip: 'Composizione ottimale' }, medium: { min: 20, max: 24, color: '#ffc107', tip: 'Monitorare' }, high: { min: 25, max: 29, color: '#ff9800', tip: 'Aumenta attività cardio' }, critical: { min: 30, max: 100, color: '#f44336', tip: 'Rischio cardiometabolico' } },
female: { low: { min: 21, max: 32, color: '#42a046', tip: 'Composizione ottimale' }, medium: { min: 33, max: 38, color: '#ffc107', tip: 'Monitorare' }, high: { min: 39, max: 44, color: '#ff9800', tip: 'Aumenta attività cardio' }, critical: { min: 45, max: 100, color: '#f44336', tip: 'Rischio cardiometabolico' } }
},
hydration: { male: { min: 50, max: 65, color: '#42a046', tip: 'Idratazione ottimale' }, female: { min: 45, max: 60, color: '#42a046', tip: 'Idratazione ottimale' } },
visceralFat: { low: { min: 1, max: 9, color: '#42a046', tip: 'Ottimale' }, medium: { min: 10, max: 12, color: '#ff9800', tip: 'Eccessivo - Consiglia Phyto Complete' }, high: { min: 13, max: 59, color: '#f44336', tip: 'Alto rischio' } },
leanMass: { min: 20, max: 100, unit: 'kg', tips: { low: 'Aumenta allenamento forza', normal: 'Massa magra ottimale', high: 'Eccellente' } },
boneMass: { min: 1, max: 5, unit: 'kg', tips: { low: 'Integra calcio', normal: 'Salute ossea buona', high: 'Ottimale' } },
metabolicAge: { min: 18, max: 100, unit: '', tips: { low: 'Metabolismo efficiente', normal: 'Metabolismo nella norma', high: 'Aumenta attività fisica' } }
};
const rule = rules[field];
if (!rule) return { color: '#ccc', tip: 'N/A' };
if (field === 'bodyFat') {
const genderRule = rule[gender] || rule.female;
const val = parseFloat(value);
if (val >= genderRule.low.min && val <= genderRule.low.max) return { color: genderRule.low.color, tip: genderRule.low.tip };
if (val >= genderRule.medium.min && val <= genderRule.medium.max) return { color: genderRule.medium.color, tip: genderRule.medium.tip };
if (val >= genderRule.high.min && val <= genderRule.high.max) return { color: genderRule.high.color, tip: genderRule.high.tip };
return { color: genderRule.critical.color, tip: genderRule.critical.tip };
}
if (field === 'hydration') {
const genderRule = rule[gender] || rule.female;
const val = parseFloat(value);
if (val >= genderRule.min && val <= genderRule.max) return { color: genderRule.color, tip: genderRule.tip };
return { color: '#ff9800', tip: 'Sotto target - Aloe e Infuso' };
}
if (field === 'visceralFat') {
const val = parseFloat(value);
if (val >= rule.low.min && val <= rule.low.max) return { color: rule.low.color, tip: rule.low.tip };
if (val >= rule.medium.min && val <= rule.medium.max) return { color: rule.medium.color, tip: rule.medium.tip };
return { color: rule.high.color, tip: rule.high.tip };
}
if (field === 'metabolicAge') {
const val = parseFloat(value);
const chronologicalAge = userData?.age || calculateAge(userData?.birthDate);
if (val > chronologicalAge) return { color: '#f44336', tip: 'Revisione piano Herbalife' };
let status = 'normal';
if (value < rule.min * 0.8) status = 'low';
const colors = { low: '#42a046', normal: '#42a046', high: '#f44336' };
return { color: colors[status], tip: rule.tips[status] };
}
if (field === 'bmi') {
const val = parseFloat(value);
if (val < 18.5) return { color: '#ffc107', tip: 'Sottopeso' };
if (val >= 18.5 && val <= 24.9) return { color: '#42a046', tip: 'Normopeso' };
if (val >= 25.0 && val <= 29.9) return { color: '#ffc107', tip: 'Sovrappeso' };
return { color: '#f44336', tip: 'Obesità' };
}
let status = 'normal';
if (value < rule.min * 0.8) status = 'low';
else if (value > rule.max * 0.9) status = 'high';
const colors = { low: '#f44336', normal: '#42a046', high: '#ff9800' };
return { color: colors[status], tip: rule.tips[status] };
}

export function updateRankingBar(userData) {
const latest = userData?.latest_bia;
if (!latest || !latest.bodyFat) {
const rankingText = document.getElementById('rankingText');
if (rankingText) rankingText.textContent = '--';
return;
}

const bodyFat = parseFloat(latest.bodyFat);
const gender = userData?.gender;

let level = 'Scarso';
let position = 5;

if (gender === 'male') {
if (bodyFat >= 8 && bodyFat <= 19) {
level = 'Eccellente';
position = 75;
} else if (bodyFat >= 20 && bodyFat <= 24) {
level = 'Buono';
position = 50;
} else if (bodyFat >= 25 && bodyFat <= 29) {
level = 'Sufficiente';
position = 25;
}
} else {
if (bodyFat >= 14 && bodyFat <= 20) {
level = 'Eccellente';
position = 75;
} else if (bodyFat >= 21 && bodyFat <= 28) {
level = 'Buono';
position = 50;
} else if (bodyFat >= 29 && bodyFat <= 32) {
level = 'Sufficiente';
position = 25;
}
}

const indicator = document.getElementById('rankingIndicator');
const rankingText = document.getElementById('rankingText');
if (indicator) indicator.style.left = position + '%';
if (rankingText) rankingText.textContent = level;
}


/* ############################################################ */
/* #                                                          # */
/* #           7. INIZIALIZZAZIONE AUTOMATICA                  # */
/* ############################################################ */
document.addEventListener('DOMContentLoaded', () => {
auth.onAuthStateChanged((user) => {
if (user) {
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid') || user.uid;
if (document.getElementById('firstName')) {
// Usa listener centralizzato per dati utente
initUserListener(db, targetUid, (userData) => {
loadUserData(targetUid);
updateUI(userData, auth.currentUser);
});
// Carica coach e assistenti
loadCoachesAndAssistantsForProfile();
// Carica dati BIA iniziali
loadInitialBiaData(targetUid);
// Carica dati obiettivi
loadObiettiviData(targetUid);
}
}
});
});

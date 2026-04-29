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
function updateProfileHeader(data) {
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
}

if (birthDateEl && ageEl) {
const birthDate = birthDateEl.value;
if (birthDate) ageEl.value = calculateAge(birthDate);
}
}


/* ############################################################ */
/* #                                                          # */
/* #           4. FUNZIONI OPERATIVE SALVATAGGIO              # */
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

console.log('[DEBUG calculatePhysiqueRating] Parsed:', { bf, lm, heightM });

const smi = heightM > 0 ? lm / (heightM * heightM) : 0;
console.log('[DEBUG calculatePhysiqueRating] SMI:', smi);

let fatLevel = 'medium';
if (gender === 'male') {
if (bf < 13) fatLevel = 'low';
else if (bf >= 25) fatLevel = 'high';
} else {
if (bf < 23) fatLevel = 'low';
else if (bf >= 34) fatLevel = 'high';
}
console.log('[DEBUG calculatePhysiqueRating] fatLevel:', fatLevel);

const ratingMatrix = {
'low-low': { id: 1, name: 'Normal', description: 'Composizione corporea bilanciata' },
'low-medium': { id: 4, name: 'Standard', description: 'Composizione corporea nella norma' },
'low-high': { id: 7, name: 'Sottopeso', description: 'Aumento massa grassa raccomandato' },
'medium-low': { id: 2, name: 'Standard', description: 'Composizione corporea nella norma' },
'medium-medium': { id: 5, name: 'Normal', description: 'Composizione corporea bilanciata' },
'medium-high': { id: 8, name: 'Sovrappeso', description: 'Riduzione massa grassa raccomandata' },
'high-low': { id: 3, name: 'Muscolare', description: 'Alta percentuale muscolare' },
'high-medium': { id: 6, name: 'Fortemente Muscolare', description: 'Eccellente composizione muscolare' },
'high-high': { id: 9, name: 'Obeso', description: 'Intervento raccomandato' }
};

const key = `${fatLevel}-${smi < 7 ? 'low' : smi >= 7 && smi < 10 ? 'medium' : 'high'}`;
console.log('[DEBUG calculatePhysiqueRating] key:', key);
const result = ratingMatrix[key] || { id: 5, name: 'Normal', description: 'Composizione corporea bilanciata' };
console.log('[DEBUG calculatePhysiqueRating] result:', result);
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
const dot = document.getElementById(`${metric.id}Dot`);
console.log(`[DEBUG updateDots] Metric ${metric.id}: value=${metric.value}, dot found=${!!dot}`);
if (dot && metric.value !== undefined) {
const value = parseFloat(metric.value);
console.log(`[DEBUG updateDots] Metric ${metric.id}: parsed=${value}`);
dot.className = 'tanita-dot';
if (value !== null && !isNaN(value)) {
if (metric.higherIsWorse) {
if (value < metric.thresholds[0]) dot.classList.add('bia-dot-good');
else if (value < metric.thresholds[1]) dot.classList.add('bia-dot-warning');
else dot.classList.add('bia-dot-bad');
} else {
if (value < metric.thresholds[0]) dot.classList.add('bia-dot-bad');
else if (value < metric.thresholds[1]) dot.classList.add('bia-dot-warning');
else dot.classList.add('bia-dot-good');
}
console.log(`[DEBUG updateDots] Metric ${metric.id}: classes=${dot.className}`);
}
}
});
}

export function updateRecompositionProgress(initialBia, latestBia) {
if (!initialBia || !latestBia) return;

const initialBodyFat = parseFloat(initialBia.bodyFat?.toString().replace(',', '.') || initialBia.bodyfat?.toString().replace(',', '.') || 0);
const latestBodyFat = parseFloat(latestBia.bodyFat?.toString().replace(',', '.') || latestBia.bodyfat?.toString().replace(',', '.') || 0);
const initialLeanKg = parseFloat(initialBia.leanMass || initialBia.leanmass || 0);
const latestLeanKg = parseFloat(latestBia.leanMass || latestBia.leanmass || 0);

const initialFatKg = (initialBia.weight * initialBodyFat) / 100;
const latestFatKg = (latestBia.weight * latestBodyFat) / 100;

const deltaWeight = latestBia.weight - initialBia.weight;
const deltaLean = latestLeanKg - initialLeanKg;
const deltaFat = latestFatKg - initialFatKg;

const updateEl = (id, value, unit = '') => {
const el = document.getElementById(id);
if (el) el.textContent = `${value}${unit}`;
};

updateEl('weightInitial', initialBia.weight.toFixed(1), ' kg');
updateEl('weightLatest', latestBia.weight.toFixed(1), ' kg');
updateEl('leanInitial', initialLeanKg.toFixed(1), ' kg');
updateEl('leanLatest', latestLeanKg.toFixed(1), ' kg');
updateEl('fatInitial', initialFatKg.toFixed(1), ' kg');
updateEl('fatLatest', latestFatKg.toFixed(1), ' kg');
updateEl('weightDelta', (deltaWeight >= 0 ? '+' : '') + deltaWeight.toFixed(1), ' kg');
updateEl('leanDelta', (deltaLean >= 0 ? '+' : '') + deltaLean.toFixed(1), ' kg');
updateEl('fatDelta', (deltaFat >= 0 ? '+' : '') + deltaFat.toFixed(1), ' kg');

const scenarioEl = document.getElementById('recompositionScenario');
if (scenarioEl) {
let scenario = 'Maintenance';
let color = '#6c757d';
if (deltaLean > 0 && deltaFat < 0) {
scenario = 'Ricomposizione Perfetta';
color = '#28a745';
} else if (deltaFat < 0 && Math.abs(deltaFat) > Math.abs(deltaLean)) {
scenario = 'Dimagrimento Eccellente';
color = '#17a2b8';
} else if (deltaLean > 0 && deltaLean > Math.abs(deltaFat)) {
scenario = 'Lean Bulk';
color = '#ffc107';
}
scenarioEl.textContent = scenario;
scenarioEl.style.color = color;
}
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

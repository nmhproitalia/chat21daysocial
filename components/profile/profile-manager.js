/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E UTILITY            # */
/* #                                                          # */
/* ############################################################ */
import { auth, db, storage } from "../../js/firebase.js";
import { doc, updateDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { showServiceMessage, updatePasswordUI, initGlobalEyes, validatePhoneNumber } from "../../js/ui-helper.js";
import { validateTanitaValue, applyTanitaConstraints } from "../../js/bia/bia-form-validator.js";
import { getRoleMetadata } from "../../js/auth-core.js";
import { loadUserData as loadUserDataFromManager, formatDisplayName, getPhotoURL, getRoleStyles, initUserListener, updateUI, getRankClass } from "../general/user-manager.js";


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
profileImg.innerHTML = `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
profileImg.className = `user-avatar profile-avatar-big ${roleData.className}`;
}
}

if (userNameDisplay) {
userNameDisplay.textContent = fullName;
userNameDisplay.style.fontSize = '2rem';
userNameDisplay.style.fontWeight = '700';
userNameDisplay.style.margin = '0 !important';
userNameDisplay.style.color = '#1a1a1a';
userNameDisplay.style.textTransform = 'none';
}

if (userRoleDisplay) {
userRoleDisplay.className = roleData.className;
userRoleDisplay.style.fontSize = '1.1rem';
userRoleDisplay.style.fontWeight = '600';
userRoleDisplay.style.color = roleData.color;
userRoleDisplay.style.margin = '0';
userRoleDisplay.style.marginTop = '4px !important';
userRoleDisplay.innerHTML = `<i class="fas ${roleData.icon}" style="color: ${roleData.color};"></i> ${roleData.label}`;
}

if (profileHeaderMain) {
profileHeaderMain.style.display = 'flex';
profileHeaderMain.style.flexDirection = 'column';
profileHeaderMain.style.alignItems = 'center';
profileHeaderMain.style.padding = '10px ! important';
profileHeaderMain.style.gap = '0 !important';
profileHeaderMain.style.textAlign = 'center';
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
userNameDisplay.style.fontSize = '2rem';
userNameDisplay.style.fontWeight = '700';
userNameDisplay.style.margin = '0 !important';
userNameDisplay.style.color = '#1a1a1a';
userNameDisplay.style.textTransform = 'none';
}

if (userRoleDisplay) {
userRoleDisplay.className = roleData.className;
userRoleDisplay.style.fontSize = '1.1rem';
userRoleDisplay.style.fontWeight = '600';
userRoleDisplay.style.color = roleData.color;
userRoleDisplay.style.margin = '0';
userRoleDisplay.style.marginTop = '4px !important';
userRoleDisplay.innerHTML = `<i class="fas ${roleData.icon}" style="color: ${roleData.color};"></i> ${roleData.label}`;
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

export function calculateNeeds(weight, height, age, gender) {
const water = (weight * 0.035).toFixed(1);
const protein = Math.round(weight * 1.5);
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
if (!validatePhoneNumber(phoneEl.value)) {
showServiceMessage("Formato telefono non valido.", "error", btn);
return;
}
}

['firstName', 'lastName', 'userPhone', 'birthDate', 'height', 'gender', 'bio', 'userEmail'].forEach(f => {
const el = document.getElementById(f);
if (el) data[f] = el.value;
});
await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
showServiceMessage("Profilo aggiornato!", "success", btn);
loadUserData(uid);
} catch (e) { showServiceMessage(e.message, "error", btn); }
}

export async function saveBia(uid) {
const btn = document.getElementById('saveBiaBtn');
try {
const data = {};
const biaFields = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge'];
for (const f of biaFields) {
const el = document.getElementById(f);
if (el && el.value) {
const v = validateTanitaValue(f, el.value);
if (!v.isValid) { showServiceMessage(v.message, "error", btn); return; }
data[f] = el.value;
}
}

// Calcola e aggiungi bmr, bmi, fabbisogni al salvataggio
const weight = parseFloat(document.getElementById('weight').value);
const height = parseFloat(document.getElementById('height').value);
const birthDate = document.getElementById('birthDate').value;
const gender = document.getElementById('gender').value;

if (weight && height && birthDate && gender) {
const age = calculateAge(birthDate);
const needs = calculateNeeds(weight, height, age, gender);
data.bmi = calculateBMI(weight, height);
data.bmr = needs.bmr;
data.waterNeeds = needs.water;
data.proteinNeeds = needs.protein;
}

await updateDoc(doc(db, "users", uid), { ...data, lastBiaUpdate: serverTimestamp() });
showServiceMessage("Dati BIA salvati!", "success", btn);
loadUserData(uid);
} catch (e) { showServiceMessage(e.message, "error", btn); }
}

export async function saveObiettivi(uid) {
const btn = document.getElementById('saveObiettiviBtn');
try {
const data = {};
['mainGoal', 'targetWeight'].forEach(f => {
const el = document.getElementById(f);
if (el) data[f] = el.value;
});
await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
showServiceMessage("Obiettivi salvati!", "success", btn);
} catch (e) { showServiceMessage(e.message, "error", btn); }
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
}
} catch (e) { console.error(e); }
}

export function setupProfiloActions(uid) {
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');
const isCoachView = targetUid && targetUid !== auth.currentUser.uid;

const actions = {
'saveAnagraficiBtn': () => saveAnagrafici(uid),
'saveBiaBtn': () => saveBia(uid),
'saveObiettiviBtn': () => saveObiettivi(uid),
'changePasswordBtn': () => handleChangePassword()
};

Object.keys(actions).forEach(id => {
const el = document.getElementById(id);
if (el) {
// Se il coach sta guardando un profilo utente, può salvare SOLO i dati BIA
if (isCoachView && id !== 'saveBiaBtn') {
el.style.display = 'none'; // Nascondi gli altri pulsanti di salvataggio
} else {
el.onclick = actions[id];
}
}
});

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
}
}
});
});

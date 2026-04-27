import { auth, db } from "../../js/firebase.js";
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { showServiceMessage } from "../../js/ui-helper.js";
import { calculateBMI, calculateAge, calculateNeeds } from "../profile/profile-manager.js";

export class BIAInputController {
constructor() {
this.currentUser = null;
this.targetUid = null;
this.userProfile = null;
this.isCoach = false;
this.init();
}


// --- FUNZIONE INIZIALIZZAZIONE ---
async init() {
try {
await this.loadUserData();
await this.migrateBiaDataIfNecessary();
this.setupEventListeners();
this.loadReadOnlyData();
this.updateBIAParamsUI();
console.log('BIA Input Controller inizializzato');
} catch (error) {
console.error('Errore inizializzazione BIA:', error);
}
}


// --- FUNZIONE CARICAMENTO DATI UTENTE ---
async loadUserData() {
if (!auth.currentUser) {
await new Promise(resolve => {
const unsubscribe = auth.onAuthStateChanged(user => {
unsubscribe();
resolve(user);
});
});
}
this.currentUser = auth.currentUser;
if (!this.currentUser) return;
const urlParams = new URLSearchParams(window.location.search);
this.targetUid = urlParams.get('uid') || this.currentUser.uid;
const role = localStorage.getItem('userRole') || '';
this.isCoach = role.toLowerCase() === 'admin' || role.toLowerCase() === 'coach';
const userDoc = await getDoc(doc(db, "users", this.targetUid));
if (userDoc.exists()) {
this.userProfile = userDoc.data();
this.fillFormWithExistingData();
}
}


// --- FUNZIONE MIGRAZIONE AUTOMATICA DATI BIA ---
async migrateBiaDataIfNecessary() {
if (!this.userProfile) return;

const biaFields = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge', 'bmi', 'bmr', 'waterNeeds', 'proteinNeeds'];
const hasBiaData = biaFields.some(field => this.userProfile[field] !== undefined && this.userProfile[field] !== null);

if (!hasBiaData) {
console.log('Nessun dato BIA da migrare');
return;
}

const userRef = doc(db, "users", this.targetUid);
const biaData = {
weight: this.userProfile.weight,
bodyFat: this.userProfile.bodyFat,
hydration: this.userProfile.hydration,
visceralFat: this.userProfile.visceralFat,
leanMass: this.userProfile.leanMass,
boneMass: this.userProfile.boneMass,
metabolicAge: this.userProfile.metabolicAge,
bmi: this.userProfile.bmi,
bmr: this.userProfile.bmr,
waterNeeds: this.userProfile.waterNeeds,
proteinNeeds: this.userProfile.proteinNeeds,
data: this.userProfile.biaLastUpdate || this.userProfile.lastBiaUpdate || serverTimestamp()
};

try {
if (!this.userProfile.initial_bia) {
await updateDoc(userRef, {
initial_bia: biaData
});
console.log('Creato initial_bia');
}

await updateDoc(userRef, {
latest_bia: biaData
});
console.log('Aggiornato latest_bia');

const historyRef = doc(collection(db, "users", this.targetUid, "bia_history"));
await setDoc(historyRef, biaData);
console.log('Aggiunto documento a bia_history');
} catch (error) {
console.error('Errore migrazione BIA:', error);
}
}


// --- FUNZIONE POPOLAMENTO FORM CON DATI ESISTENTI ---
fillFormWithExistingData() {
const fields = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge'];
fields.forEach(f => {
const el = document.getElementById(f);
if (el && this.userProfile[f]) el.value = this.userProfile[f];
});
const bmiEl = document.getElementById('bmi');
if (bmiEl && this.userProfile.bmi) bmiEl.value = this.userProfile.bmi;
}


// --- FUNZIONE CARICAMENTO DATI READ-ONLY ---
loadReadOnlyData() {
if (!this.userProfile) return;
const fields = {
'firstName': this.userProfile.firstName || '',
'lastName': this.userProfile.lastName || '',
'userEmail': this.userProfile.userEmail || ''
};
Object.entries(fields).forEach(([id, val]) => {
const el = document.getElementById(id);
if (el) el.value = val;
});
}


// --- FUNZIONE SETUP EVENT LISTENERS ---
setupEventListeners() {
const form = document.getElementById('biaForm');
if (form) {
form.addEventListener('submit', (e) => {
e.preventDefault();
this.handleFormSubmit();
});
}
const inputs = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge'];
inputs.forEach(id => {
const el = document.getElementById(id);
if (el) el.addEventListener('input', () => this.updateCalculations());
});
}


// --- FUNZIONE AGGIORNAMENTO CALCOLI REAL-TIME ---
updateCalculations() {
try {
const data = this.getFormData();
if (data.weight && this.userProfile?.height) {
const bmi = calculateBMI(data.weight, this.userProfile.height);
const bmiEl = document.getElementById('bmi');
if (bmiEl) bmiEl.value = bmi;
this.updateBIAParamsUI(data.weight);
}
} catch (e) { console.error(e); }
}


// --- FUNZIONE AGGIORNAMENTO UI PARAMETRI CALCOLATI ---
updateBIAParamsUI(weightOverride = null) {
const weight = weightOverride || (this.userProfile ? parseFloat(this.userProfile.weight) : null);
const waterEl = document.getElementById('waterNeedsDisplay');
const proteinEl = document.getElementById('proteinNeedsDisplay');
const bmrEl = document.getElementById('bmrDisplay');

if (weight) {
const needs = calculateNeeds(weight);
if (waterEl) waterEl.textContent = `${needs.water} L/giorno`;
if (proteinEl) proteinEl.textContent = `${needs.protein} g/giorno`;
}
if (this.userProfile?.bmr && bmrEl) bmrEl.textContent = `${this.userProfile.bmr} kcal`;
}


// --- FUNZIONE GESTIONE SUBMIT ---
async handleFormSubmit() {
const btn = document.querySelector('#biaForm button[type="submit"]');
try {
const data = this.getFormData();
const bmi = calculateBMI(data.weight, this.userProfile.height);
const needs = calculateNeeds(data.weight);

const biaData = {
...data,
bmi: bmi,
bmr: needs.bmr,
waterNeeds: needs.water,
proteinNeeds: needs.protein,
data: serverTimestamp()
};

const userRef = doc(db, "users", this.targetUid);
await updateDoc(userRef, {
...data,
bmi: bmi,
waterNeeds: needs.water,
proteinNeeds: needs.protein,
latest_bia: biaData,
biaLastUpdate: serverTimestamp()
});

const historyRef = doc(collection(db, "users", this.targetUid, "bia_history"));
await setDoc(historyRef, biaData);

showServiceMessage("Dati BIA salvati e sincronizzati con il profilo!", "success", btn);
} catch (error) {
console.error(error);
showServiceMessage("Errore durante il salvataggio: " + error.message, "error", btn);
}
}


// --- FUNZIONE OTTIENI DATI FORM ---
getFormData() {
const fields = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge'];
const data = {};
fields.forEach(f => {
const el = document.getElementById(f);
data[f] = el ? parseFloat(el.value) : null;
});
return data;
}
}

import { auth, db } from "../../js/firebase.js";
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { showServiceMessage } from "../general/ui-helper.js";
import { calculateBMI, calculateAge, calculateNeeds, displayNeedsResults } from "../profile/profile-manager.js";

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
data: this.userProfile.biaLastUpdate || this.userProfile.lastBiaUpdate || serverTimestamp()
};

// Aggiungi solo se non undefined
if (this.userProfile.bmr !== undefined && this.userProfile.bmr !== null) {
biaData.bmr = this.userProfile.bmr;
}
if (this.userProfile.waterNeeds !== undefined && this.userProfile.waterNeeds !== null) {
biaData.waterNeeds = this.userProfile.waterNeeds;
}
if (this.userProfile.proteinNeeds !== undefined && this.userProfile.proteinNeeds !== null) {
biaData.proteinNeeds = this.userProfile.proteinNeeds;
}

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
// Carica height e age da initial_bia o latest_bia se non sono nel profilo principale
const height = this.userProfile.height || this.userProfile.initial_bia?.height || this.userProfile.latest_bia?.height;
const age = this.userProfile.age || this.userProfile.initial_bia?.age || this.userProfile.latest_bia?.age;

const fields = ['height', 'age', 'gender', 'weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge'];
fields.forEach(f => {
const el = document.getElementById(f);
let value = this.userProfile[f];
if (f === 'height') value = height;
if (f === 'age') value = age;
if (el && value) {
el.value = value;
}
});

// Aggiorna fabbisogni calcolati dopo aver caricato i dati
this.updateBIAParamsUI();

const bmiEl = document.getElementById('bmi');
if (bmiEl && this.userProfile.bmi) bmiEl.value = this.userProfile.bmi;

if (this.userProfile.latest_bia) {
this.updateBIAResults(this.userProfile.latest_bia);

// NON sovrascrivere i fabbisogni dai dati salvati, usa i valori calcolati in tempo reale
// const waterEl = document.getElementById('waterNeedsDisplay');
// const proteinEl = document.getElementById('proteinNeedsDisplay');
// const bmrEl = document.getElementById('bmrDisplay');
// if (waterEl && this.userProfile.latest_bia.waterNeeds) waterEl.textContent = `${this.userProfile.latest_bia.waterNeeds} L/giorno`;
// if (proteinEl && this.userProfile.latest_bia.proteinNeeds) proteinEl.textContent = `${this.userProfile.latest_bia.proteinNeeds} g/giorno`;
// if (bmrEl && this.userProfile.latest_bia.bmr) bmrEl.textContent = `${this.userProfile.latest_bia.bmr} kcal`;

const rating = this.calculatePhysiqueRating(
this.userProfile.latest_bia.bodyFat,
this.userProfile.latest_bia.leanMass,
this.userProfile.gender,
document.getElementById('height')?.value || this.userProfile.height
);
this.displayPhysiqueRating(rating);
}
if (this.userProfile.initial_bia) {
this.updateRecompositionProgress(this.userProfile.initial_bia, this.userProfile.latest_bia || this.userProfile.initial_bia);
}
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
const inputs = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge', 'height', 'age', 'gender'];
inputs.forEach(id => {
const el = document.getElementById(id);
if (el) el.addEventListener('input', () => this.updateCalculations());
});
}


// --- FUNZIONE AGGIORNAMENTO CALCOLI REAL-TIME ---
updateCalculations() {
try {
const data = this.getFormData();
const heightInput = document.getElementById('height');
const height = heightInput ? parseFloat(heightInput.value) : this.userProfile.height;
if (data.weight && height) {
const bmi = calculateBMI(data.weight, height);
const bmiEl = document.getElementById('bmi');
if (bmiEl) bmiEl.value = bmi;
this.updateBIAParamsUI(data.weight);
}
} catch (e) { console.error(e); }
}


// --- FUNZIONE AGGIORNAMENTO UI PARAMETRI BIA ---
updateBIAParamsUI(weightOverride = null) {
const weight = weightOverride || (this.userProfile ? parseFloat(this.userProfile.weight) : null);
// Leggi height, age, gender e leanMass dal DOM invece che dal profilo
const heightInput = document.getElementById('height');
const ageInput = document.getElementById('age');
const genderInput = document.querySelector('input[name="gender"]:checked');
const leanMassInput = document.getElementById('leanMass');
const height = heightInput ? parseFloat(heightInput.value) : (this.userProfile ? parseFloat(this.userProfile.height) : null);
const age = ageInput ? parseFloat(ageInput.value) : (this.userProfile ? parseFloat(this.userProfile.age) : null);
const gender = genderInput ? genderInput.value : (this.userProfile ? this.userProfile.gender : null);
const leanMass = leanMassInput ? parseFloat(leanMassInput.value) : (this.userProfile ? this.userProfile.leanMass : null);

if (weight && height && age && gender) {
const needs = calculateNeeds(weight, parseFloat(height), parseFloat(age), gender, leanMass);
displayNeedsResults(needs.water, needs.protein, needs.bmr);
}
}


// --- FUNZIONE NORMALIZZAZIONE DATI BIA ---
normalizeBiaData(data) {
const normalized = {};
const propertyMap = {
'bodyfat': 'bodyFat',
'leanmass': 'leanMass',
'visceralfat': 'visceralFat',
'bonemass': 'boneMass',
'metabolicage': 'metabolicAge'
};

Object.keys(data).forEach(key => {
const normalizedKey = propertyMap[key] || key;
let value = data[key];

// Converti stringhe con virgola in numeri
if (typeof value === 'string' && value.includes(',')) {
value = parseFloat(value.replace(',', '.'));
}

// Assicura che i campi numerici siano numeri
if (['weight', 'height', 'age', 'bodyFat', 'leanMass', 'visceralFat', 'boneMass', 'metabolicAge', 'bmr', 'bmi', 'hydration'].includes(normalizedKey)) {
value = parseFloat(value) || 0;
}

normalized[normalizedKey] = value;
});

return normalized;
}

// --- FUNZIONE GESTIONE SUBMIT ---
async handleFormSubmit() {
const btn = document.querySelector('#biaForm button[type="submit"]');
try {
const data = this.getFormData();
const heightInput = document.getElementById('height');
const ageInput = document.getElementById('age');
const height = heightInput ? parseFloat(heightInput.value) : this.userProfile.height;
const age = ageInput ? parseFloat(ageInput.value) : this.userProfile.age;
const bmi = calculateBMI(data.weight, height);
const needs = calculateNeeds(
data.weight,
height,
age,
data.gender,
data.leanMass,
'maintenance'
);

const rating = this.calculatePhysiqueRating(data.bodyFat, data.leanMass, this.userProfile.gender, document.getElementById('height')?.value || this.userProfile.height);

const biaData = {
...data,
bmi: bmi,
bmr: needs.bmr,
waterNeeds: needs.water,
proteinNeeds: needs.protein,
physiqueRating: rating,
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

this.updateBIAResults(biaData);
this.updateBIAParamsUI(data.weight);

this.displayPhysiqueRating(rating);

if (this.userProfile.initial_bia) {
this.updateRecompositionProgress(this.userProfile.initial_bia, biaData);
}

showServiceMessage("Dati BIA salvati e sincronizzati con il profilo!", "success", btn);
} catch (error) {
console.error(error);
showServiceMessage("Errore durante il salvataggio: " + error.message, "error", btn);
}
}


// --- FUNZIONE OTTIENI DATI FORM ---
getFormData() {
const fields = ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge', 'gender'];
const data = {};
fields.forEach(f => {
const el = document.getElementById(f);
if (f === 'gender') {
data[f] = el ? el.value : null;
} else {
data[f] = el ? parseFloat(el.value) : null;
}
});
return data;
}

// --- FUNZIONE CALCOLO PHYSIQUE RATING ---
calculatePhysiqueRating(bodyFat, leanMass, gender, height) {
console.log('[DEBUG] calculatePhysiqueRating called with:', { bodyFat, leanMass, gender, height });
const bf = parseFloat(bodyFat);
const lm = parseFloat(leanMass);
const heightM = parseFloat(height) / 100;

// 1. Calcolo SMI (Skeletal Muscle Index)
const smi = heightM > 0 ? lm / (heightM * heightM) : 0;
console.log('[DEBUG] SMI calculated:', smi);

// 2. Logica dei Livelli di Grasso (Soglie Tanita ufficiali)
let fatLevel = 'medium';
if (gender === 'male') {
if (bf < 13) fatLevel = 'low';
else if (bf >= 25) fatLevel = 'high';
} else {
if (bf < 23) fatLevel = 'low';
else if (bf >= 34) fatLevel = 'high';
}
console.log('[DEBUG] fatLevel:', fatLevel);

// 3. Logica dei Livelli Muscolari (Soglie Tanita ufficiali SMI)
let muscleLevel = 'medium';
if (gender === 'male') {
if (smi < 8.2) muscleLevel = 'low';
else if (smi >= 10.0) muscleLevel = 'high';
} else {
if (smi < 6.3) muscleLevel = 'low';
else if (smi >= 8.0) muscleLevel = 'high';
}
console.log('[DEBUG] muscleLevel:', muscleLevel);

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
console.log('[DEBUG] calculatePhysiqueRating result:', result, 'key:', key);
return result;
}

// --- FUNZIONE VISUALIZZAZIONE PHYSIQUE RATING CON INNERHTML ---
displayPhysiqueRating(rating) {
console.log('[DEBUG] displayPhysiqueRating called with:', rating);
const ratingEl = document.getElementById('physiqueRating');
const descEl = document.getElementById('physiqueRatingDescription');
const dotEl = document.getElementById('physiqueRatingDot');
if (ratingEl && rating) ratingEl.textContent = `${rating.id} - ${rating.name}`;
if (descEl && rating) descEl.innerHTML = rating.description;

if (dotEl && rating) {
let color;
if (rating.id <= 3) {
color = '#e74c3c';
} else if (rating.id <= 6) {
color = '#f39c12';
} else if (rating.id <= 8) {
color = '#42a046';
} else {
color = '#266431';
}
dotEl.style.background = color;
console.log('[DEBUG] dot color set:', color);
}

// Aggiorna barra Physique Rating assoluto
this.updatePhysiqueRatingBar(rating);
console.log('[DEBUG] displayPhysiqueRating completed');
}

// --- FUNZIONE AGGIORNAMENTO BARRA PHYSIQUE RATING ASSOLUTO ---
updatePhysiqueRatingBar(rating) {
console.log('[DEBUG] updatePhysiqueRatingBar called with:', rating);
if (!rating) return;

const indicator = document.getElementById('physiqueRatingIndicator');
const textEl = document.getElementById('physiqueRatingText');

if (indicator && textEl) {
const position = ((rating.id - 1) / 8) * 100;
indicator.style.left = `${Math.min(100, Math.max(0, position))}%`;
textEl.textContent = rating.name;
console.log('[DEBUG] updatePhysiqueRatingBar position:', position, 'text:', rating.name);
} else {
console.log('[DEBUG] updatePhysiqueRatingBar elements not found');
}
}

// --- FUNZIONE AGGIORNAMENTO PROGRESSO RICOMPOSIZIONE CORPOREA ---
updateRecompositionProgress(initialBia, latestBia) {
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

// Scenari ricomposizione per challenge 21 giorni
let scenario = '';
if (fatDeltaKg < 0 && leanDeltaKg > 0) {
scenario = 'Ricomposizione Perfetta';
} else if (weightDelta <= -0.5 && fatDeltaKg <= -0.5) {
scenario = 'Dimagrimento Eccellente';
} else if (weightDelta >= 0.5 && leanDeltaKg >= 0.5) {
scenario = 'Lean Bulk';
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
if (scenarioEl) scenarioEl.textContent = scenario;
}

// --- FUNZIONE AGGIORNAMENTO PALLINI BIA ---
updateDots(biaData) {
if (!biaData) return;

const metrics = [
{ id: 'bmi', value: biaData.bmi, thresholds: [18.5, 25, 30], higherIsWorse: true },
{ id: 'bodyFat', value: biaData.bodyFat, thresholds: [14, 24, 30], higherIsWorse: true },
{ id: 'hydration', value: biaData.hydration, thresholds: [45, 55, 65], higherIsWorse: false },
{ id: 'visceralFat', value: biaData.visceralFat, thresholds: [5, 10, 15], higherIsWorse: true },
{ id: 'leanMass', value: biaData.leanMass, thresholds: [40, 60, 80], higherIsWorse: false },
{ id: 'boneMass', value: biaData.boneMass, thresholds: [2.5, 3.5, 4.5], higherIsWorse: false },
{ id: 'metabolicAge', value: biaData.metabolicAge, thresholds: [30, 40, 50], higherIsWorse: true }
];

metrics.forEach(metric => {
const dotEl = document.getElementById(`${metric.id}Dot`);
if (!dotEl || !metric.value) return;

let color;
if (metric.higherIsWorse) {
if (metric.value <= metric.thresholds[0]) {
color = '#266431';
} else if (metric.value <= metric.thresholds[1]) {
color = '#42a046';
} else if (metric.value <= metric.thresholds[2]) {
color = '#f39c12';
} else {
color = '#e74c3c';
}
} else {
if (metric.value >= metric.thresholds[2]) {
color = '#266431';
} else if (metric.value >= metric.thresholds[1]) {
color = '#42a046';
} else if (metric.value >= metric.thresholds[0]) {
color = '#f39c12';
} else {
color = '#e74c3c';
}
}

dotEl.style.background = color;
});
}

// --- FUNZIONE AGGIORNAMENTO RISULTATI BIA ---
updateBIAResults(biaData) {
if (!biaData) return;

const bmiEl = document.getElementById('bmiResult');
const bodyFatEl = document.getElementById('bodyFatResult');
const hydrationEl = document.getElementById('hydrationResult');
const visceralFatEl = document.getElementById('visceralFatResult');
const leanMassEl = document.getElementById('leanMassResult');
const boneMassEl = document.getElementById('boneMassResult');
const metabolicAgeEl = document.getElementById('metabolicAgeResult');

if (bmiEl && biaData.bmi) bmiEl.textContent = parseFloat(biaData.bmi).toFixed(1);
if (bodyFatEl && biaData.bodyFat) bodyFatEl.textContent = `${biaData.bodyFat} %`;
if (hydrationEl && biaData.hydration) hydrationEl.textContent = `${biaData.hydration} %`;
if (visceralFatEl && biaData.visceralFat) visceralFatEl.textContent = biaData.visceralFat;
if (leanMassEl && biaData.leanMass) leanMassEl.textContent = `${biaData.leanMass} kg`;
if (boneMassEl && biaData.boneMass) boneMassEl.textContent = `${biaData.boneMass} kg`;
if (metabolicAgeEl && biaData.metabolicAge) metabolicAgeEl.textContent = biaData.metabolicAge;

this.updateDots(biaData);
}

// --- FUNZIONE AGGIORNAMENTO PALLINI PHYSIQUE RATING ---
updatePhysiqueRatingDots(rating) {
const dotsContainer = document.getElementById('physiqueRatingDots');
if (!dotsContainer || !rating) return;

let html = '';
for (let i = 1; i <= 9; i++) {
const isActive = i === rating.id;
const color = isActive ? '#266431' : '#e0e0e0';
html += `<div class="physique-rating-dot" style="background: ${color};" title="${rating.name}"></div>`;
}

dotsContainer.innerHTML = html;
}
}

/* ############################################################ */
/* #                                                          # */
/* #           1. LOGICA CALCOLI BIA E PARAMETRI             # */
/* ############################################################ */
/**
 * Calcolatore Parametri BIA
 * Gestisce tutte le formule scientifiche per la composizione corporea
 * 
 * @author 21GIORNIFIT System
 * @version 1.0
 */

import { doc, updateDoc, serverTimestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { db } from '../../js/firebase.js';

/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE BIA CALCULATIONS        # */
/* ############################################################ */
export class BIACalculator {
// --- FUNZIONE CALCOLO BMI ---
calculateBMI(weight, height) {
const heightM = height / 100;
return (weight / (heightM * heightM)).toFixed(1);
}


// --- FUNZIONE CALCOLO BMR ---
calculateBMR(weight, height, age, gender) {
if (gender === 'male') {
return (10 * weight) + (6.25 * height) - (5 * age) + 5;
}
return (10 * weight) + (6.25 * height) - (5 * age) - 161;
}

// --- FUNZIONE CALCOLO FABBISOGNI ---
calculateNeeds(weight, height, age, gender, leanMass, activityLevel) {
const bmr = this.calculateBMR(weight, height, age, gender);
const waterNeeds = (weight * 0.033).toFixed(1);
const proteinNeeds = (weight * 1.8).toFixed(0);
return {
bmr: Math.round(bmr),
water: parseFloat(waterNeeds),
protein: parseInt(proteinNeeds)
};
}
}

// --- FUNZIONE CONDIVESA SALVATAGGIO DATI BIA ---
export async function saveBIAData(uid, biaData) {
const calculator = new BIACalculator();
const { weight, height, age, gender, leanMass } = biaData;
const bmi = calculator.calculateBMI(weight, height);
const needs = calculator.calculateNeeds(weight, height, age, gender, leanMass, 'maintenance');

const fullBiaData = {
...biaData,
bmi: bmi,
bmr: needs.bmr,
waterNeeds: needs.water,
proteinNeeds: needs.protein,
timestamp: new Date().toISOString()
};

const userRef = doc(db, "users", uid);
await updateDoc(userRef, {
latest_bia: fullBiaData,
biaLastUpdate: serverTimestamp()
});

return fullBiaData;
}

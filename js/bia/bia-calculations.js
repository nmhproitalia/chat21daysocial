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
}

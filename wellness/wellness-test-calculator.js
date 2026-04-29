/* ############################################################ */
/* #                                                          # */
/* #           1. CALCOLATORE RISULTATI TEST BENESSERE       # */
/* #                                                          # */
/* ############################################################ */
/**
 * Calcolatore Risultati Test
 * Gestisce la logica di calcolo del punteggio per il test del benessere
 * 
 * @author 21GIORNIFIT System
 * @version 1.0
 */


/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE CALCULATOR              # */
/* ############################################################ */
export class WellnessTestCalculator {
// --- FUNZIONE CALCOLO RISULTATI ---
calculateResults(answers) {
let score = 0;
Object.values(answers).forEach(answer => {
if (answer === 'yes' || answer === true) score++;
});
return {
totalScore: score,
percentage: Math.round((score / 12) * 100)
};
}
}

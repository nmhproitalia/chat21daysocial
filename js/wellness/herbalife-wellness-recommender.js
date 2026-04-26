/* ############################################################ */
/* #                                                          # */
/* #           1. RACCOMANDATORE PRODOTTI HERBALIFE          # */
/* ############################################################ */
/**
 * Recommender Prodotti Herbalife
 * Genera raccomandazioni basate sui risultati del test del benessere
 * 
 * @author 21GIORNIFIT System
 * @version 1.0
 */


/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE RECOMMENDER             # */
/* ############################################################ */
export class HerbalifeWellnessRecommender {
// --- FUNZIONE GENERAZIONE RACCOMANDAZIONI ---
generateRecommendations(results) {
const recommendations = [];
if (results.totalScore < 8) {
recommendations.push({
name: "Aloe + Infuso",
category: "Base",
description: "Supporto idratazione ed energia"
});
}
return recommendations;
}
}

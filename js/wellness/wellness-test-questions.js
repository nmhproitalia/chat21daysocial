/* ############################################################ */
/* #                                                          # */
/* #           1. TEST BENESSERE - DOMANDE UFFICIALI       # */
/* #                                                          # */
/* ############################################################ */
/**
 * Test Benessere - 12 Domande Ufficiali Herbalife
 * Logica punteggio e trigger prodotti per miglioramento composizione corporea
 * 
 * @author 21GIORNIFIT System
 * @version 2.0
 */

/* ############################################################ */
/* #                                                          # */
/* #           2. DOMANDE UFFICIALI TEST BENESSERE          # */
/* #                                                          # */
/* ############################################################ */
export const WELLNESS_QUESTIONS = [
{
id: 1,
question: "Bevi almeno 2 litri di acqua al giorno?",
category: "idratazione",
trigger_product: ["aloe", "infuso"],
weight: 1
},
{
id: 2,
question: "Fai colazione equilibrata ogni mattina?",
category: "nutrizione",
trigger_product: ["shake", "pdm"],
weight: 2
},
{
id: 3,
question: "Consumi 5 porzioni di frutta e verdura al giorno?",
category: "nutrizione",
trigger_product: ["integratori"],
weight: 1
},
{
id: 4,
question: "Dormi 7-8 ore per notte?",
category: "sonno",
trigger_product: ["relax"],
weight: 2
},
{
id: 5,
question: "Fai attività fisica regolare (3+ volte a settimana)?",
category: "attività",
trigger_product: ["energia"],
weight: 2
},
{
id: 6,
question: "Mangi spuntini sani tra i pasti?",
category: "nutrizione",
trigger_product: ["barrette", "snack"],
weight: 1
},
{
id: 7,
question: "Limiti cibi processati e zuccheri?",
category: "nutrizione",
trigger_product: ["detox"],
weight: 2
},
{
id: 8,
question: "Hai un buon livello di energia durante il giorno?",
category: "energia",
trigger_product: ["b-complex", "vitamine"],
weight: 2
},
{
id: 9,
question: "Gestisci lo stress in modo efficace?",
category: "stress",
trigger_product: ["relax", "magnesio"],
weight: 1
},
{
id: 10,
question: "Hai una buona digestione?",
category: "digestione",
trigger_product: ["probiotici", "enzimi"],
weight: 1
},
{
id: 11,
question: "Mantieni un peso sano?",
category: "peso",
trigger_product: ["termogenici", "controllo"],
weight: 2
},
{
id: 12,
question: "Ti senti soddisfatto del tuo stato di benessere generale?",
category: "benessere",
trigger_product: ["multivitaminico"],
weight: 1
}
];

/* ############################################################ */
/* #                                                          # */
/* #           3. CONFIGURAZIONE SISTEMA PUNTEGGIO          # */
/* #                                                          # */
/* ############################################################ */
export const SCORING_CONFIG = {
// --- PUNTEGGIO BASE ---
baseScore: 0,
maxScore: 12,
yesScore: 1,
noScore: 0,

// --- SOGLIE CRITICHE ---
thresholds: {
excellent: 10,
good: 8,
moderate: 6,
poor: 4
},

// --- CATEGORIE PUNTEGGIO ---
categories: {
excellent: { min: 10, max: 12, label: "Eccellente", color: "#28a745" },
good: { min: 8, max: 9, label: "Buono", color: "#17a2b8" },
moderate: { min: 6, max: 7, label: "Medio", color: "#ffc107" },
poor: { min: 0, max: 5, label: "Da migliorare", color: "#dc3545" }
}
};

/* ############################################################ */
/* #                                                          # */
/* #           4. TRIGGER PRODOTTI HERBALIFE                 # */
/* #                                                          # */
/* ############################################################ */
export const PRODUCT_TRIGGERS = {
// --- COLLAZIONE ---
aloe: {
name: "Aloe Vera",
description: "Supporto digestivo e idratazione",
category: "digestione",
priority: 1
},
infuso: {
name: "Infuso Erbalife",
description: "Rilassamento e benessere",
category: "relax",
priority: 1
},
shake: {
name: "Formula 1 Shake",
description: "Nutrizione completa",
category: "nutrizione",
priority: 2
},
pdm: {
name: "Protein Drink Mix",
description: "Proteine di alta qualità",
category: "nutrizione",
priority: 2
},
integratori: {
name: "Integratori Base",
description: "Supporto nutrizionale",
category: "nutrizione",
priority: 1
},
relax: {
name: "Relax Night",
description: "Riposo notturno",
category: "sonno",
priority: 1
},
energia: {
name: "Lift Off",
description: "Energia immediata",
category: "energia",
priority: 1
},
barrette: {
name: "Protein Bar",
description: "Spuntino proteico",
category: "nutrizione",
priority: 1
},
snack: {
name: "Snack Sani",
description: "Alternative sane",
category: "nutrizione",
priority: 1
},
detox: {
name: "Herbal Tea",
description: "Detox naturale",
category: "nutrizione",
priority: 1
},
"b-complex": {
name: "B-Complex",
description: "Energia e metabolismo",
category: "energia",
priority: 1
},
vitamine: {
name: "Multivitaminico",
description: "Supporto immunitario",
category: "benessere",
priority: 1
},
magnesio: {
name: "Magnesio",
description: "Rilassamento muscolare",
category: "relax",
priority: 1
},
probiotici: {
name: "Probiotics",
description: "Equilibrio intestinale",
category: "digestione",
priority: 1
},
enzimi: {
name: "Enzymes",
description: "Digestione",
category: "digestione",
priority: 1
},
termogenici: {
name: "Thermojetics",
description: "Metabolismo",
category: "peso",
priority: 2
},
controllo: {
name: "Controllo Appetito",
description: "Gestione peso",
category: "peso",
priority: 2
},
multivitaminico: {
name: "Formula 2",
description: "Multivitaminico completo",
category: "benessere",
priority: 1
}
};

/* ############################################################ */
/* #                                                          # */
/* #           5. FUNZIONI UTILITÀ DOMANDE                   # */
/* #                                                          # */
/* ############################################################ */
// --- FUNZIONE OTTIENI DOMANDA PER ID ---
export function getQuestionById(id) {
return WELLNESS_QUESTIONS.find(q => q.id === id);
}

// --- FUNZIONE OTTIENI DOMANDE PER CATEGORIA ---
export function getQuestionsByCategory(category) {
return WELLNESS_QUESTIONS.filter(q => q.category === category);
}

// --- FUNZIONE OTTIENI TUTTE LE CATEGORIE ---
export function getAllCategories() {
return [...new Set(WELLNESS_QUESTIONS.map(q => q.category))];
}

// --- FUNZIONE CALCOLO PESO TOTALE DOMANDE ---
export function calculateTotalWeight() {
return WELLNESS_QUESTIONS.reduce((total, question) => total + question.weight, 0);
}

// --- FUNZIONE OTTIENI PRODOTTI RACCOMANDATI ---
export function getRecommendedProducts(answers) {
const recommendedProducts = new Set();
const productScores = {};

WELLNESS_QUESTIONS.forEach(question => {
const answer = answers[question.id];
if (answer === 'no' || answer === false) {
question.trigger_product.forEach(productId => {
const product = PRODUCT_TRIGGERS[productId];
if (product) {
recommendedProducts.add(productId);
productScores[productId] = (productScores[productId] || 0) + question.weight;
}
});
}
});

// --- ORDINA PRODOTTI PER PRIORITÀ E PUNTEGGIO ---
const sortedProducts = Array.from(recommendedProducts)
.map(productId => ({
id: productId,
...PRODUCT_TRIGGERS[productId],
score: productScores[productId] || 0
}))
.sort((a, b) => {
if (a.priority !== b.priority) {
return b.priority - a.priority;
}
return b.score - a.score;
});

return sortedProducts;
}

// --- FUNZIONE VALIDAZIONE RISPOSTE ---
export function validateAnswers(answers) {
const errors = [];
const warnings = [];

// --- VERIFICA RISPOSTE OBBLIGATORIE ---
WELLNESS_QUESTIONS.forEach(question => {
if (!(question.id in answers) || answers[question.id] === undefined) {
errors.push(`Domanda ${question.id} mancante: ${question.question}`);
}
});

// --- VERIFICA FORMATO RISPOSTE ---
Object.keys(answers).forEach(questionId => {
const answer = answers[questionId];
const question = getQuestionById(parseInt(questionId));
if (question && answer !== 'yes' && answer !== 'no' && answer !== true && answer !== false) {
warnings.push(`Risposta non valida per domanda ${questionId}: ${answer}`);
}
});

return {
isValid: errors.length === 0,
errors: errors,
warnings: warnings
};
}

console.log('Wellness Test Questions caricato correttamente');

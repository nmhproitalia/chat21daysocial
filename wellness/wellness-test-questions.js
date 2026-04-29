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
question: "Consumi in prevalenza carni bianche, pollo, carni magre, pesce e proteine vegetali (fagioli, lenticchie, soia) invece che bistecche, arrosti e altre carni rosse?",
category: "nutrizione",
trigger_product: ["shake", "pdm"],
tip: "Bilanciamento Proteico: Le carni bianche e il pesce contengono meno grassi saturi. Se consumi spesso carni rosse, bilancia l'apporto proteico inserendo più spesso pollo, tacchino o proteine vegetali come soia e tofu per non appesantire l'organismo.",
weight: 1
},
{
id: 2,
question: "Mangi una buona varietà di frutta e verdura colorate e almeno cinque porzioni al giorno?",
category: "nutrizione",
trigger_product: ["integratori"],
tip: "Varietà Cromatica: Per garantire al corpo vitamine e minerali, non basta mangiare verdura, serve varietà. Se non raggiungi le 5 porzioni, prova a 'mangiare l'arcobaleno', scegliendo frutta e verdura di colori diversi ogni giorno.",
weight: 1
},
{
id: 3,
question: "Mangi pesce grasso (come salmone, sgombro, sardine, trota) almeno 3 volte la settimana?",
category: "nutrizione",
trigger_product: ["omega3"],
tip: "Supporto Omega-3: Gli oli del pesce grasso (salmone, sgombro) proteggono il cuore. Se non li consumi 3 volte a settimana, bilancia la dieta con noci e semi o valuta un'integrazione specifica per mantenere il peso e la salute cardiaca.",
weight: 1
},
{
id: 4,
question: "Pensi di consumare abbastanza fibre nella tua dieta quotidiana?",
category: "nutrizione",
trigger_product: ["fibra"],
tip: "Regolarità e Fibre: Un apparato digerente regolare elimina le tossine e bilancia il colesterolo. Se hai problemi di regolarità, aumenta l'apporto a 25g di fibra giornalieri combinando cereali integrali, frutta e almeno 8 bicchieri d'acqua.",
weight: 1
},
{
id: 5,
question: "Fai almeno 30 minuti di attività fisica per 3-5 giorni la settimana?",
category: "attività fisica",
trigger_product: ["shake"],
tip: "Attivazione Metabolica: Il cuore ha bisogno di stimoli costanti. Se non fai movimento, inizia con 30 minuti per 3-5 volte a settimana: non solo aiuterai il sistema cardiovascolare, ma ridurrai sensibilmente lo stress quotidiano.",
weight: 1
},
{
id: 6,
question: "Riesci a mantenere il tuo peso equilibrato?",
category: "peso",
trigger_product: ["termogenici", "controllo"],
tip: "Stabilità del Metabolismo: I rapidi cali o aumenti di peso danneggiano il metabolismo. Se non riesci a mantenerlo costante, punta su una dieta a base di proteine magre e cereali integrali per preservare la massa muscolare.",
weight: 1
},
{
id: 7,
question: "Di solito hai tempo per prepararti pasti equilibrati?",
category: "nutrizione",
trigger_product: ["shake"],
tip: "Soluzioni Pasti Veloci: Se mangi sempre di corsa, non cedere al junk food. Esistono alternative sane e rapide come insalate pronte, verdure surgelate o petti di pollo veloci da cuocere che permettono di nutrire il corpo anche in pochi minuti.",
weight: 1
},
{
id: 8,
question: "Riesci ad evitare bibite gasate e spuntini poco sani (patatine, dolci) nel corso della giornata e dopo cena?",
category: "nutrizione",
trigger_product: ["snack", "detox"],
tip: "Gestione Stress e Snack: Spesso mangiamo snack grassi o zuccherati per noia o stress. Prova a sostituire le patatine o i dolci con uno spuntino sano e placa la voglia di 'conforto' con un infuso caldo alle erbe.",
weight: 1
},
{
id: 9,
question: "Hai l'energia e la concentrazione necessarie per svolgere le tue attività quotidiane senza avvertire stanchezza?",
category: "energia",
trigger_product: ["b-complex", "vitamine"],
tip: "Energia Costante: Se avverti cali durante il giorno, la causa potrebbe essere una nutrizione incompleta. Assicurati di fornire all'organismo i nutrienti necessari per favorire la produzione di energia senza dover ricorrere a troppi caffè o zuccheri.",
weight: 1
},
{
id: 10,
question: "Bevi almeno 8 bicchieri d'acqua al giorno?",
category: "idratazione",
trigger_product: ["aloe", "infuso"],
tip: "Idratazione Profonda: Non aspettare di avere sete: la sete è già un segnale di disidratazione. Bevi 8 bicchieri d'acqua (circa 2 litri) distribuiti nella giornata per mantenere sani i tessuti e supportare le funzioni vitali.",
weight: 1
},
{
id: 11,
question: "Assumi la razione giornaliera raccomandata di calcio?",
category: "nutrizione",
trigger_product: ["calcio"],
tip: "Integrazione di Calcio: 800mg di calcio al giorno sono vitali per ossa e denti. Se non consumi abbastanza latticini magri, bilancia con alimenti rinforzati e vitamina D, fondamentale per l'assorbimento corretto del calcio.",
weight: 1
},
{
id: 12,
question: "Ritieni che il tuo stile di vita e la tua alimentazione siano adeguati per il benessere dell'apparato cardiocircolatorio?",
category: "benessere",
trigger_product: ["multivitaminico"],
tip: "Supporto Cardiovascolare: Il benessere del cuore dipende da ciò che puoi cambiare: fumo, peso e dieta. Con l'età la produzione di Ossido Nitrico diminuisce; è essenziale adottare abitudini che ne supportino i livelli ottimali.",
weight: 1
},
{
id: 13,
question: "Fai spuntini sani nel corso della giornata?",
category: "nutrizione",
trigger_product: ["barrette", "snack"],
tip: "Spuntini Intelligenti: Lo spuntino non deve essere un 'extra' vuoto, ma un supporto energetico. Scegli spuntini ricchi di proteine e fibre ma poveri di zuccheri per evitare picchi glicemici e arrivare al pasto successivo con la giusta fame.",
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
maxScore: 15,
yesScore: 1,
noScore: 0,

// --- SOGLIE CRITICHE ---
thresholds: {
excellent: 12,
good: 10,
moderate: 7,
poor: 4
},

// --- CATEGORIE PUNTEGGIO ---
categories: {
excellent: { min: 12, max: 15, label: "Eccellente", color: "#28a745" },
good: { min: 10, max: 11, label: "Buono", color: "#17a2b8" },
moderate: { min: 7, max: 9, label: "Medio", color: "#ffc107" },
poor: { min: 0, max: 6, label: "Da migliorare", color: "#dc3545" }
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

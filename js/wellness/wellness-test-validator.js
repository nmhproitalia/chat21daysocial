/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE E CONFIGURAZIONE              # */
/* #                                                          # */
/* ############################################################ */
/**
 * Validatore Test del Benessere
 * Gestisce validazione risposte e coerenza dati
 * 
 * @author 21GIORNIFIT System
 * @version 1.0
 */

/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE VALIDATORE              # */
/* #                                                          # */
/* ############################################################ */
export class WellnessTestValidator {
constructor() {
this.validationRules = this.getValidationRules();
this.coherenceChecks = this.getCoherenceChecks();
}

// --- FUNZIONE OTTIENI REGOLE VALIDAZIONE ---
getValidationRules() {
return {
scaleAnswers: {
min: 1,
max: 5,
required: true,
type: 'integer'
},
requiredQuestions: [
'energy_level',
'sleep_quality', 
'stress_level',
'digestive_health',
'physical_activity',
'water_intake',
'eating_habits',
'mental_focus',
'weight_management',
'immune_system',
'skin_hair_health',
'overall_wellness'
]
};
}

// --- FUNZIONE OTTIENI CONTROLLI COERENZA ---
getCoherenceChecks() {
return {
// --- CONTROLLO COERENZA LIVELLO ENERGIA VS SONNO ---
energySleepCoherence: {
description: 'Livello energia deve essere coerente con qualità sonno',
check: (answers) => {
const energy = answers.energy_level;
const sleep = answers.sleep_quality;
return Math.abs(energy - sleep) <= 2;
}
},
// --- CONTROLLO COERENZA STRESS VS ATTIVITÀ FISICA ---
stressActivityCoherence: {
description: 'Alto stress dovrebbe correlare con bassa attività fisica',
check: (answers) => {
const stress = answers.stress_level;
const activity = answers.physical_activity;
if (stress >= 4) {
return activity <= 3;
}
return true;
}
},
// --- CONTROLLO COERENZA IDRATAZIONE VS ATTIVITÀ FISICA ---
hydrationActivityCoherence: {
description: 'Alta attività fisica dovrebbe correlare con buona idratazione',
check: (answers) => {
const activity = answers.physical_activity;
const hydration = answers.water_intake;
if (activity >= 4) {
return hydration >= 3;
}
return true;
}
},
// --- CONTROLLO COERENZA DIGESTIONE VS ABITUDINI ALIMENTARI ---
digestionEatingCoherence: {
description: 'Buone abitudini alimentari dovrebbero correlare con buona digestione',
check: (answers) => {
const digestion = answers.digestive_health;
const eating = answers.eating_habits;
return Math.abs(digestion - eating) <= 1;
}
},
// --- CONTROLLO COERENZA GESTIONE PESO VS ABITUDINI ---
weightEatingCoherence: {
description: 'Buona gestione peso dovrebbe correlare con buone abitudini alimentari',
check: (answers) => {
const weight = answers.weight_management;
const eating = answers.eating_habits;
return Math.abs(weight - eating) <= 1;
}
}
};
}

/* ############################################################ */
/* #                                                          # */
/* #           3. FUNZIONI VALIDAZIONE RISPOSTE              # */
/* #                                                          # */
/* ############################################################ */
// --- FUNZIONE VALIDAZIONE SINGOLA RISPOSTA ---
validateAnswer(questionId, answer) {
const rules = this.validationRules.scaleAnswers;
const validation = {
isValid: true,
errors: [],
warnings: []
};

// --- VALIDAZIONE TIPO ---
if (typeof answer !== 'number' || !Number.isInteger(answer)) {
validation.isValid = false;
validation.errors.push('La risposta deve essere un numero intero');
return validation;
}

// --- VALIDAZIONE RANGE ---
if (answer < rules.min || answer > rules.max) {
validation.isValid = false;
validation.errors.push(`La risposta deve essere tra ${rules.min} e ${rules.max}`);
}

// --- VALIDAZIONE OBBLIGATORIETÀ ---
if (rules.required && (answer === null || answer === undefined || answer === '')) {
validation.isValid = false;
validation.errors.push('Questa domanda è obbligatoria');
}

return validation;
}

// --- FUNZIONE VALIDAZIONE COMPLESSIVA RISPOSTE ---
validateAllAnswers(answers) {
const validation = {
isValid: true,
errors: [],
warnings: [],
missingQuestions: [],
invalidAnswers: {}
};

// --- VERIFICA DOMANDE OBBLIGATORIE ---
this.validationRules.requiredQuestions.forEach(questionId => {
if (!(questionId in answers) || answers[questionId] === null || answers[questionId] === undefined) {
validation.isValid = false;
validation.missingQuestions.push(questionId);
}
});

// --- VALIDAZIONE OGNI RISPOSTA ---
Object.keys(answers).forEach(questionId => {
const answerValidation = this.validateAnswer(questionId, answers[questionId]);
if (!answerValidation.isValid) {
validation.isValid = false;
validation.invalidAnswers[questionId] = answerValidation.errors;
validation.errors.push(...answerValidation.errors);
}
validation.warnings.push(...answerValidation.warnings);
});

return validation;
}

/* ############################################################ */
/* #                                                          # */
/* #           4. FUNZIONI VERIFICA COERENZA                 # */
/* #                                                          # */
/* ############################################################ */
// --- FUNZIONE VERIFICA COERENZA COMPLESSIVA ---
checkCoherence(answers) {
const coherenceResults = {
isCoherent: true,
failedChecks: [],
warnings: []
};

// --- ESEGUI TUTTI I CONTROLLI DI COERENZA ---
Object.keys(this.coherenceChecks).forEach(checkId => {
const check = this.coherenceChecks[checkId];
const isCoherent = check.check(answers);

if (!isCoherent) {
coherenceResults.isCoherent = false;
coherenceResults.failedChecks.push({
id: checkId,
description: check.description
});
}
});

return coherenceResults;
}

// --- FUNZIONE OTTIENI REPORT VALIDAZIONE COMPLETO ---
getValidationReport(answers) {
const answerValidation = this.validateAllAnswers(answers);
const coherenceValidation = this.checkCoherence(answers);

return {
isValid: answerValidation.isValid && coherenceValidation.isCoherent,
answerValidation: answerValidation,
coherenceValidation: coherenceValidation,
recommendations: this.generateRecommendations(answers, answerValidation, coherenceValidation)
};
}

/* ############################################################ */
/* #                                                          # */
/* #           5. FUNZIONI GENERAZIONE RACCOMANDAZIONI      # */
/* #                                                          # */
/* ############################################################ */
// --- FUNZIONE GENERAZIONE RACCOMANDAZIONI PERSONALIZZATE ---
generateRecommendations(answers, answerValidation, coherenceValidation) {
const recommendations = [];

// --- RACCOMANDAZIONI BASATE SU RISPOSTE ---
Object.keys(answers).forEach(questionId => {
const answer = answers[questionId];
const questionName = this.getQuestionName(questionId);

if (answer >= 4) {
recommendations.push(`Attenzione a ${questionName}: livello elevato richiede intervento`);
} else if (answer <= 2) {
recommendations.push(`${questionName}: buon livello, mantenere le abitudini attuali`);
}
});

// --- RACCOMANDAZIONI BASATE SU COERENZA ---
coherenceValidation.failedChecks.forEach(failedCheck => {
recommendations.push(`Incoerenza rilevata: ${failedCheck.description}`);
});

// --- RACCOMANDAZIONI GENERALI ---
if (answerValidation.missingQuestions.length > 0) {
recommendations.push('Completare tutte le domande obbligatorie per una valutazione accurata');
}

return recommendations;
}

// --- FUNZIONE OTTIENI NOME DOMANDA ---
getQuestionName(questionId) {
const names = {
energy_level: 'livello energetico',
sleep_quality: 'qualità del sonno',
stress_level: 'livello di stress',
digestive_health: 'salute digestiva',
physical_activity: 'attività fisica',
water_intake: 'idratazione',
eating_habits: 'abitudini alimentari',
mental_focus: 'concentrazione mentale',
weight_management: 'gestione peso',
immune_system: 'sistema immunitario',
skin_hair_health: 'salute di pelle e capelli',
overall_wellness: 'benessere generale'
};
return names[questionId] || questionId;
}

/* ############################################################ */
/* #                                                          # */
/* #           6. FUNZIONI UTILITÀ                           # */
/* #                                                          # */
/* ############################################################ */
// --- FUNZIONE CALCOLO PUNTEGGIO TOTALE ---
calculateTotalScore(answers) {
let totalScore = 0;
let answeredQuestions = 0;

Object.keys(answers).forEach(questionId => {
const answer = answers[questionId];
if (typeof answer === 'number' && answer >= 1 && answer <= 5) {
totalScore += answer;
answeredQuestions++;
}
});

return {
totalScore: totalScore,
averageScore: answeredQuestions > 0 ? totalScore / answeredQuestions : 0,
answeredQuestions: answeredQuestions,
maxPossibleScore: answeredQuestions * 5
};
}

// --- FUNZIONE CLASSIFICAZIONE RISULTATO ---
classifyResult(score) {
if (score >= 4.5) {
return { category: 'Eccellente', color: '#28a745', description: 'Stato di benessere ottimale' };
} else if (score >= 3.5) {
return { category: 'Buono', color: '#17a2b8', description: 'Buoone condizioni generali' };
} else if (score >= 2.5) {
return { category: 'Medio', color: '#ffc107', description: 'Area di miglioramento' };
} else if (score >= 1.5) {
return { category: 'Insufficiente', color: '#fd7e14', description: 'Richiede attenzione' };
} else {
return { category: 'Critico', color: '#dc3545', description: 'Intervento immediato necessario' };
}
}
}

export default WellnessTestValidator;

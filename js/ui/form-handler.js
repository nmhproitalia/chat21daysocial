/* ############################################################ */
/* #                                                          # */
/* #           1. GESTORE FORM UI GENERICO                   # */
/* ############################################################ */
/**
 * Gestore Form UI Generico
 * Gestisce validazione, feedback e interazioni form
 * 
 * @author 21GIORNIFIT System
 * @version 1.0
 */


/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE FORM HANDLER            # */
/* ############################################################ */
export class FormHandler {
constructor() {
this.activeForms = new Map();
this.validationRules = new Map();
this.init();
}


// --- FUNZIONE INIZIALIZZAZIONE ---
init() {
this.setupGlobalEventListeners();
this.initializeForms();
}


// --- FUNZIONE SETUP EVENT LISTENERS GLOBALI ---
setupGlobalEventListeners() {
document.addEventListener('submit', (e) => {
if (e.target.tagName === 'FORM') {
this.handleSubmit(e);
}
});
}


// --- FUNZIONE INIZIALIZZAZIONE FORM ---
initializeForms() {
const forms = document.querySelectorAll('form');
forms.forEach(form => {
this.activeForms.set(form.id || form.className, form);
});
}


// --- FUNZIONE GESTIONE SUBMIT ---
async handleSubmit(e) {
const form = e.target;
const formData = new FormData(form);
const data = Object.fromEntries(formData.entries());

// --- VALIDAZIONE ---
const validation = this.validateForm(form.id, data);
if (!validation.isValid) {
e.preventDefault();
this.showErrors(form, validation.errors);
}
}


// --- FUNZIONE VALIDAZIONE FORM ---
validateForm(formId, data) {
return { isValid: true, errors: [] };
}


// --- FUNZIONE VISUALIZZAZIONE ERRORI ---
showErrors(form, errors) {
console.error('Errori form:', errors);
}
}

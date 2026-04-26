/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE MODULI WELLNESS              # */
/* #                                                          # */
/* ############################################################ */
import { WellnessTestValidator } from './wellness-test-validator.js';
import { WellnessTestCalculator } from './wellness-test-calculator.js';
import { HerbalifeWellnessRecommender } from './herbalife-wellness-recommender.js';
import { firebaseService } from '../services/firebase-service.js';
import { auth, db } from '../firebase.js';
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE CONTROLLER             # */
/* #                                                          # */
/* ############################################################ */
export class WellnessTestController {
// --- FUNZIONE COSTRUTTORE ---
constructor() {
this.validator = new WellnessTestValidator();
this.calculator = new WellnessTestCalculator();
this.recommender = new HerbalifeWellnessRecommender();
this.firebaseService = firebaseService;
this.currentQuestionIndex = 0;
this.answers = {};
this.isTestActive = false;
this.elements = {};
this.init();
}


// --- FUNZIONE INIZIALIZZAZIONE ---
init() {
this.initializeElements();
this.setupEventListeners();
this.loadSavedTest();
}


// --- FUNZIONE INIZIALIZZAZIONE ELEMENTI DOM ---
initializeElements() {
this.elements = {
questionContainer: document.getElementById('questionContainer'),
answersContainer: document.getElementById('answersContainer'),
nextButton: document.getElementById('nextQuestionBtn'),
previousButton: document.getElementById('previousQuestionBtn'),
resultsContainer: document.getElementById('testResults'),
progressBar: document.getElementById('testProgress'),
questionCounter: document.getElementById('questionCounter')
};
}


// --- FUNZIONE IMPOSTAZIONE EVENT LISTENERS ---
setupEventListeners() {
if (this.elements.nextButton) {
this.elements.nextButton.addEventListener('click', () => this.handleNextQuestion());
}
if (this.elements.previousButton) {
this.elements.previousButton.addEventListener('click', () => this.handlePreviousQuestion());
}
}


// --- FUNZIONE AVVIO TEST ---
startTest() {
this.isTestActive = true;
this.currentQuestionIndex = 0;
this.answers = {};
this.displayQuestion();
this.updateProgress();
}


// --- FUNZIONE VISUALIZZAZIONE DOMANDA ---
displayQuestion() {
const questions = this.getQuestions();
const question = questions[this.currentQuestionIndex];
if (this.elements.questionContainer) {
this.elements.questionContainer.innerHTML = `<div class="question-card"><h3>${question.question}</h3></div>`;
}
this.displayAnswers(question);
}


// --- FUNZIONE VISUALIZZAZIONE OPZIONI RISPOSTA ---
displayAnswers(question) {
if (!this.elements.answersContainer) return;
this.elements.answersContainer.innerHTML = `
<button class="btn-discord" onclick="window.controller.saveAnswer(${question.id}, 'yes')">Sì</button>
<button class="btn-discord" onclick="window.controller.saveAnswer(${question.id}, 'no')">No</button>
`;
}


// --- FUNZIONE SALVATAGGIO RISPOSTA ---
saveAnswer(questionId, answer) {
this.answers[questionId] = answer;
this.handleNextQuestion();
}


// --- FUNZIONE GESTIONE PROSSIMA DOMANDA ---
handleNextQuestion() {
if (this.currentQuestionIndex < 11) {
this.currentQuestionIndex++;
this.displayQuestion();
this.updateProgress();
} else {
this.completeTest();
}
}


// --- FUNZIONE GESTIONE DOMANDA PRECEDENTE ---
handlePreviousQuestion() {
if (this.currentQuestionIndex > 0) {
this.currentQuestionIndex--;
this.displayQuestion();
this.updateProgress();
}
}


// --- FUNZIONE COMPLETAMENTO TEST ---
async completeTest() {
this.isTestActive = false;
const results = this.calculator.calculateResults(this.answers);
await this.saveResults(results);
this.displayResults(results);
}


// --- FUNZIONE SALVATAGGIO RISULTATI ---
async saveResults(results) {
const user = auth.currentUser;
if (user) {
await updateDoc(doc(db, "users", user.uid), {
wellnessTest: results,
lastTestDate: serverTimestamp()
});
}
}


// --- FUNZIONE VISUALIZZAZIONE RISULTATI ---
displayResults(results) {
if (this.elements.resultsContainer) {
this.elements.resultsContainer.style.display = 'block';
this.elements.resultsContainer.innerHTML = `<h2>Punteggio: ${results.totalScore}/12</h2>`;
}
}


// --- FUNZIONE AGGIORNAMENTO PROGRESSO ---
updateProgress() {
if (this.elements.progressBar) {
const progress = ((this.currentQuestionIndex + 1) / 12) * 100;
this.elements.progressBar.style.width = `${progress}%`;
}
}


// --- FUNZIONE CARICAMENTO TEST SALVATO ---
loadSavedTest() {
this.startTest();
}


// --- FUNZIONE OTTIENI DOMANDE ---
getQuestions() {
return [
{id:1, question: "Bevi 2L acqua?"}, {id:2, question: "Fai colazione?"},
{id:3, question: "Mangi frutta?"}, {id:4, question: "Dormi bene?"},
{id:5, question: "Fai sport?"}, {id:6, question: "Spuntini sani?"},
{id:7, question: "Limiti zuccheri?"}, {id:8, question: "Hai energia?"},
{id:9, question: "Gestisci stress?"}, {id:10, question: "Buona digestione?"},
{id:11, question: "Peso ideale?"}, {id:12, question: "Soddisfatto benessere?"}
];
}
}


/* ############################################################ */
/* #                                                          # */
/* #           3. INIZIALIZZAZIONE AUTOMATICA                  # */
/* #                                                          # */
/* ############################################################ */
document.addEventListener('DOMContentLoaded', () => {
window.controller = new WellnessTestController();
});

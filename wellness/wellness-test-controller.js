/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE MODULI WELLNESS              # */
/* #                                                          # */
/* ############################################################ */
import { auth, db } from '../../js/firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { WELLNESS_QUESTIONS } from './wellness-test-questions.js';


/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE CONTROLLER             # */
/* #                                                          # */
/* ############################################################ */
export class WellnessTestController {
constructor() {
this.currentQuestionIndex = 0;
this.answers = {};
this.questions = WELLNESS_QUESTIONS;
this.init();
}

init() {
this.setupEventListeners();
this.loadSavedTest();
}

setupEventListeners() {
const yesBtn = document.getElementById('wellnessYesBtn');
const noBtn = document.getElementById('wellnessNoBtn');
const retakeBtn = document.getElementById('retakeWellnessBtn');

if (yesBtn) yesBtn.addEventListener('click', () => this.handleAnswer('yes'));
if (noBtn) noBtn.addEventListener('click', () => this.handleAnswer('no'));
if (retakeBtn) retakeBtn.addEventListener('click', () => this.retakeTest());
}

handleAnswer(answer) {
this.answers[this.currentQuestionIndex] = answer;
this.currentQuestionIndex++;

if (this.currentQuestionIndex < this.questions.length) {
this.displayQuestion();
} else {
this.completeTest();
}
}

displayQuestion() {
const questionText = document.getElementById('wellnessQuestionText');
const questionCounter = document.getElementById('wellnessQuestionCounter');
const question12Description = document.getElementById('wellnessQuestion12Description');

if (questionText && this.questions[this.currentQuestionIndex]) {
questionText.textContent = this.questions[this.currentQuestionIndex].question;
}

if (questionCounter) {
questionCounter.textContent = `VALUTAZIONE BENESSERE - DOMANDA ${this.currentQuestionIndex + 1} DI ${this.questions.length}`;
}

// Mostra testo descrittivo solo per domanda 12
if (question12Description) {
if (this.currentQuestionIndex === 11) { // DOMANDA 12 (index 11)
question12Description.style.display = 'block';
} else {
question12Description.style.display = 'none';
}
}
}

async completeTest() {
const yesCount = Object.values(this.answers).filter(a => a === 'yes').length;
const normalizedScore = Math.min(15, Math.round((yesCount / 13) * 15));
await this.saveResults(normalizedScore);
this.displayResults(normalizedScore);
}

async saveResults(score) {
const user = auth.currentUser;
if (user) {
await updateDoc(doc(db, "users", user.uid), {
wellnessScore: score,
wellnessAnswers: this.answers,
wellnessLastUpdate: serverTimestamp()
});
}
}

displayResults(score) {
const summary = document.getElementById('wellnessSummary');
const scoreDisplay = document.getElementById('wellnessScoreDisplay');
const scoreText = document.getElementById('wellnessScoreText');
const scoreLine = document.getElementById('wellnessScoreLine');
const tipsContainer = document.getElementById('wellnessTipsContainer');

// Genera suggerimenti basati sui NO
let tipsHtml = '';
if (this.questions && this.answers) {
for (let i = 0; i < this.questions.length; i++) {
const q = this.questions[i];
const answer = this.answers[i];
if (answer === 'no' && q.tip) {
tipsHtml += `<div class="tip-item"><i class="fas fa-lightbulb"></i> ${q.tip}</div>`;
}
}
}
const finalTips = tipsHtml || '<p>Complimenti! Il tuo stile di vita è eccellente.</p>';

if (tipsContainer) {
tipsContainer.innerHTML = finalTips;
}

if (summary) summary.style.display = 'none';
if (scoreDisplay) scoreDisplay.classList.remove('wellness-score-container-hidden');
if (scoreText) scoreText.textContent = `Punteggio: ${score}/15`;
if (scoreLine) {
const percentage = (score / 15) * 100;
scoreLine.style.left = `${percentage}%`;
}
}

retakeTest() {
this.currentQuestionIndex = 0;
this.answers = {};
const summary = document.getElementById('wellnessSummary');
const scoreDisplay = document.getElementById('wellnessScoreDisplay');

if (summary) summary.style.display = 'block';
if (scoreDisplay) scoreDisplay.classList.add('wellness-score-container-hidden');
this.displayQuestion();
}

async loadSavedTest() {
const user = auth.currentUser;
if (user) {
try {
const userDoc = await getDoc(doc(db, "users", user.uid));
if (userDoc.exists()) {
const data = userDoc.data();
if (data.wellnessScore !== undefined) {
this.displayResults(data.wellnessScore);
} else {
this.displayQuestion();
}
} else {
this.displayQuestion();
}
} catch (error) {
console.error('Errore caricamento test benessere:', error);
this.displayQuestion();
}
} else {
this.displayQuestion();
}
}

getQuestions() {
return this.questions;
}
}

export function initWellnessTest() {
if (document.getElementById('wellnessSummary')) {
new WellnessTestController();
}
}

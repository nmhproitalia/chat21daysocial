// WELLNESS TEST CONTROLLER - TANITA
// Versione 2.0 - 29 Aprile 2026

import { auth, db } from "../../js/firebase.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { WELLNESS_QUESTIONS } from "../profile/wellness-test-questions.js?v=1.0";

class WellnessTestController {
constructor() {
this.currentQuestionIndex = 0;
this.answers = {};
this.wellnessScore = 0;
this.isTestActive = false;
}

init() {
console.log('WellnessTestController inizializzato');
this.loadSavedTest();
this.setupEventListeners();
}

setupEventListeners() {
const yesBtn = document.getElementById('wellnessYesBtn');
const noBtn = document.getElementById('wellnessNoBtn');
const retakeBtn = document.getElementById('retakeWellnessBtn');

if (yesBtn) {
yesBtn.addEventListener('click', () => this.handleAnswer('yes'));
}

if (noBtn) {
noBtn.addEventListener('click', () => this.handleAnswer('no'));
}

if (retakeBtn) {
retakeBtn.addEventListener('click', () => this.retakeTest());
}
}

handleAnswer(answer) {
const question = WELLNESS_QUESTIONS[this.currentQuestionIndex];
this.answers[this.currentQuestionIndex] = answer;
this.currentQuestionIndex++;

if (this.currentQuestionIndex < WELLNESS_QUESTIONS.length) {
this.showQuestion(this.currentQuestionIndex);
} else {
this.completeTest();
}
}

showQuestion(index) {
const question = WELLNESS_QUESTIONS[index];
const questionText = document.getElementById('wellnessQuestionText');
const questionCounter = document.getElementById('wellnessQuestionCounter');
const question12Description = document.getElementById('wellnessQuestion12Description');

if (questionText) {
questionText.textContent = question.text;
}

if (questionCounter) {
questionCounter.textContent = `VALUTAZIONE DEL BENESSERE - DOMANDA ${index + 1} DI ${WELLNESS_QUESTIONS.length}`;
}

if (question12Description) {
if (question.id === 12 && question.description) {
question12Description.textContent = question.description;
question12Description.style.display = 'block';
} else {
question12Description.style.display = 'none';
}
}
}

async completeTest() {
const yesCount = Object.values(this.answers).filter(a => a === 'yes').length;
this.wellnessScore = Math.min(15, Math.round((yesCount / WELLNESS_QUESTIONS.length) * 15));

await this.saveTest();

this.showResults();
}

async saveTest() {
try {
const user = auth.currentUser;
if (!user) return;

const userRef = doc(db, "users", user.uid);
await updateDoc(userRef, {
wellnessScore: this.wellnessScore,
wellnessAnswers: this.answers,
wellnessLastUpdate: new Date().toISOString()
});

console.log('Test benessere salvato con punteggio:', this.wellnessScore);
} catch (error) {
console.error('Errore salvataggio test benessere:', error);
}
}

showResults() {
const wellnessSummary = document.getElementById('wellnessSummary');
const wellnessScoreDisplay = document.getElementById('wellnessScoreDisplay');
const wellnessQuestionCounter = document.getElementById('wellnessQuestionCounter');
const wellnessQuestionText = document.getElementById('wellnessQuestionText');
const wellnessYesBtn = document.getElementById('wellnessYesBtn');
const wellnessNoBtn = document.getElementById('wellnessNoBtn');

if (wellnessSummary) {
wellnessSummary.style.display = 'none';
}

if (wellnessScoreDisplay) {
wellnessScoreDisplay.style.display = 'block';
this.updateScoreDisplay();
}

if (wellnessQuestionCounter) {
wellnessQuestionCounter.style.display = 'none';
}

if (wellnessQuestionText) {
wellnessQuestionText.style.display = 'none';
}

if (wellnessYesBtn) {
wellnessYesBtn.style.display = 'none';
}

if (wellnessNoBtn) {
wellnessNoBtn.style.display = 'none';
}
}

updateScoreDisplay() {
const wellnessScoreText = document.getElementById('wellnessScoreText');
const wellnessScoreLine = document.getElementById('wellnessScoreLine');

if (wellnessScoreText) {
wellnessScoreText.textContent = `Punteggio: ${this.wellnessScore}/15`;
}

if (wellnessScoreLine) {
const percentage = (this.wellnessScore / 15) * 100;
wellnessScoreLine.style.left = `${percentage}%`;
}

this.generateTips();
}

generateTips() {
const tipsContainer = document.querySelector('#wellnessTipsContainer .tips-grid');
if (!tipsContainer) return;

tipsContainer.innerHTML = '';

WELLNESS_QUESTIONS.forEach((question, index) => {
const answer = this.answers[index];
if (answer === 'no' || answer === false) {
const tipItem = document.createElement('div');
tipItem.className = 'tip-item';
tipItem.innerHTML = `
<i class="fas fa-lightbulb"></i>
<span>${question.tip}</span>
`;
tipsContainer.appendChild(tipItem);
}
});
}

async loadSavedTest() {
try {
const user = auth.currentUser;
if (!user) return;

const userRef = doc(db, "users", user.uid);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
const userData = userSnap.data();
if (userData.wellnessScore !== undefined) {
this.wellnessScore = userData.wellnessScore;
this.answers = userData.wellnessAnswers || {};
this.showResults();
}
}
} catch (error) {
console.error('Errore caricamento test salvato:', error);
}
}

retakeTest() {
this.currentQuestionIndex = 0;
this.answers = {};
this.wellnessScore = 0;
this.isTestActive = true;

const wellnessSummary = document.getElementById('wellnessSummary');
const wellnessScoreDisplay = document.getElementById('wellnessScoreDisplay');
const wellnessQuestionCounter = document.getElementById('wellnessQuestionCounter');
const wellnessQuestionText = document.getElementById('wellnessQuestionText');
const wellnessQuestion12Description = document.getElementById('wellnessQuestion12Description');
const wellnessYesBtn = document.getElementById('wellnessYesBtn');
const wellnessNoBtn = document.getElementById('wellnessNoBtn');

if (wellnessSummary) {
wellnessSummary.style.display = 'block';
}

if (wellnessScoreDisplay) {
wellnessScoreDisplay.style.display = 'none';
}

if (wellnessQuestionCounter) {
wellnessQuestionCounter.style.display = 'block';
}

if (wellnessQuestionText) {
wellnessQuestionText.style.display = 'block';
}

if (wellnessQuestion12Description) {
wellnessQuestion12Description.style.display = 'none';
}

if (wellnessYesBtn) {
wellnessYesBtn.style.display = 'inline-block';
}

if (wellnessNoBtn) {
wellnessNoBtn.style.display = 'inline-block';
}

this.showQuestion(0);
}
}

export function initWellnessTest() {
const controller = new WellnessTestController();
controller.init();
}

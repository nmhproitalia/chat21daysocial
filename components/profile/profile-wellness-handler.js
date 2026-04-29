/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E CONFIGURAZIONE     # */
/* ############################################################ */
import { auth, db } from "../../js/firebase.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { WELLNESS_QUESTIONS } from "../../wellness/wellness-test-questions.js";


/* ############################################################ */
/* #                                                          # */
/* #           2. CLASSE GESTIONE WELLNESS UFFICIALE         # */
/* ############################################################ */
export class ProfileWellnessHandler {
constructor() {
this.questions = WELLNESS_QUESTIONS;
this.answers = {};
this.currentQuestionIndex = 0;
this.init();
}


// --- INIZIALIZZAZIONE ---
async init() {
console.log('[DEBUG] ProfileWellnessHandler init called');
const startBtn = document.getElementById('startWellnessTestBtn');
console.log('[DEBUG] startWellnessTestBtn found:', startBtn);
const isBiaPage = window.location.pathname.includes('tanita.html');
console.log('[DEBUG] isBiaPage:', isBiaPage);

if (startBtn) {
if (isBiaPage) {
startBtn.onclick = () => this.startTest();
} else {
// Nascondi il pulsante se non siamo nella pagina BIA
startBtn.style.display = 'none';
}
}
this.loadPreviousResults();
}


// --- CARICAMENTO RISULTATI PRECEDENTI ---
async loadPreviousResults() {
if (!auth.currentUser) return;
try {
const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
if (userDoc.exists()) {
const data = userDoc.data();
if (data.wellnessScore !== undefined) {
this.displayResults(data.wellnessScore, data.wellnessLastUpdate, data.wellnessAnswers || {});
}
}
} catch (error) {
console.error("Errore caricamento wellness:", error);
}
}


// --- INIZIO TEST ---
startTest() {
const container = document.getElementById('wellnessSummary');
if (!container) return;

const q = this.questions[this.currentQuestionIndex];
container.innerHTML = `
<div class="wellness-test-container">
<h4>Valutazione Benessere - Domanda ${this.currentQuestionIndex + 1} di ${this.questions.length}</h4>
<p class="wellness-question-text">${q.question}</p>
<div class="wellness-options-container">
<button class="btn-discord wellness-opt-btn" data-value="yes" style="background: var(--success-color)">SÌ</button>
<button class="btn-discord wellness-opt-btn" data-value="no" style="background: var(--danger-color)">NO</button>
</div>
<div id="textInputContainer" class="wellness-text-input-container">
<label class="wellness-text-label">Specifica quali spuntini fai:</label>
<textarea id="wellnessTextResponse" rows="2" class="wellness-textarea" placeholder="Es: Mandorle, frutto, yogurt..."></textarea>
<button id="nextWithText" class="btn-discord wellness-next-btn">Continua</button>
</div>
</div>
`;

container.querySelectorAll('.wellness-opt-btn').forEach(btn => {
btn.onclick = () => {
const val = btn.dataset.value;
if (q.hasText && val === 'yes') {
document.getElementById('textInputContainer').classList.remove('wellness-text-input-container');
document.getElementById('textInputContainer').style.display = 'block';
container.querySelectorAll('.wellness-opt-btn').forEach(b => b.style.opacity = '0.5');
btn.style.opacity = '1';
} else {
this.handleAnswer(val);
}
};
});

const nextBtn = document.getElementById('nextWithText');
if (nextBtn) {
nextBtn.onclick = () => {
const text = document.getElementById('wellnessTextResponse').value;
this.handleAnswer('yes', text);
};
}
}


// --- GESTIONE RISPOSTA ---
async handleAnswer(val, text = '') {
const q = this.questions[this.currentQuestionIndex];
if (!q) {
console.warn('Domanda non trovata, saltando...');
return;
}
this.answers[q.id] = { val, text };
this.currentQuestionIndex++;

if (this.currentQuestionIndex < this.questions.length) {
this.startTest();
} else {
await this.finishTest();
}
}


// --- COMPLETAMENTO TEST ---
async finishTest() {
// Calcolo punteggio: Ogni SÌ = 1 punto. Scala 0-15 (base 11 domande * 1.36 approx)
const yesCount = Object.values(this.answers).filter(a => a.val === 'yes').length;
const normalizedScore = Math.min(15, Math.round((yesCount / 11) * 15));

try {
await updateDoc(doc(db, "users", auth.currentUser.uid), {
wellnessScore: normalizedScore,
wellnessAnswers: this.answers,
wellnessLastUpdate: serverTimestamp()
});
this.displayResults(normalizedScore, new Date(), this.answers);
} catch (error) {
console.error("Errore salvataggio wellness:", error);
}
}


// --- VISUALIZZAZIONE RISULTATI ---
displayResults(score, date, answers) {
console.log('[DEBUG] displayResults called with:', { score, date, answers });
const container = document.getElementById('wellnessSummary');
console.log('[DEBUG] wellnessSummary container:', container);
if (!container) return;

const formattedDate = date instanceof Date ? date.toLocaleDateString() : (date?.toDate ? date.toDate().toLocaleDateString() : "Data non disponibile");
const status = this.getScoreStatus(score);
const isBiaPage = window.location.pathname.includes('tanita.html');

// Genera suggerimenti basati sui NO - logica semplice
let tipsHtml = '';
if (answers && this.questions) {
for (const q of this.questions) {
const answer = answers[q.id];
if (answer && answer.val === 'no' && q.tip) {
tipsHtml += `<div class="tip-item"><i class="fas fa-lightbulb"></i> ${q.tip}</div>`;
}
}
}
const finalTips = tipsHtml || '<p>Complimenti! Il tuo stile di vita è eccellente.</p>';

container.innerHTML = `
<div class="status-header">
<i class="fas fa-chart-line" style="color: ${status.color}"></i>
<span>Ultima Valutazione: ${formattedDate}</span>
</div>

<div class="wellness-graphic">
<div class="wellness-progress-header">
<span>Punteggio: ${score}/15</span>
<span style="color: ${status.color};">${status.text}</span>
</div>
<div class="wellness-progress-bar-container">
<div class="wellness-progress-bar-fill" style="width: ${(score/15)*100}%; background: ${status.color};"></div>
</div>
</div>

<div class="wellness-tips-section card">
<h4 style="color: var(--primary-color); margin-bottom: 1rem;"><i class="fas fa-magic"></i> Aree di miglioramento</h4>
<div class="tips-grid">
${finalTips}
</div>
</div>
`;

// Aggiungi pulsante "Rifai" SOLO nella pagina BIA
if (isBiaPage) {
const redoBtn = document.createElement('button');
redoBtn.id = 'startWellnessTestBtn';
redoBtn.className = 'btn-discord';
redoBtn.style.marginTop = '1.5rem';
redoBtn.innerHTML = '<i class="fas fa-redo"></i> Rifai Valutazione';
redoBtn.onclick = () => {
this.currentQuestionIndex = 0;
this.answers = {};
this.startTest();
};
container.appendChild(redoBtn);
}
}


// --- LOGICA STATUS E COLORI (GRAFICO) ---
getScoreStatus(score) {
if (score <= 5) return { text: "LIVELLO BASSO", color: "#2ecc71", desc: "Verde" }; // Verde nel grafico ufficiale indica margini di miglioramento o stato iniziale? Solitamente 0-5 è critico ma seguo la richiesta colori.
if (score <= 10) return { text: "LIVELLO MEDIO", color: "#f39c12", desc: "Arancione" };
return { text: "LIVELLO ALTO", color: "#e74c3c", desc: "Rosso" };
}
}



/* ############################################################ */
/* #                                                          # */
/* #           3. INIZIALIZZAZIONE E ESPORTAZIONI              # */
/* #                                                          # */
/* ############################################################ */
export function setupBiaInputActions() {
console.log("Irina: Wellness & BIA Handler inizializzato");
auth.onAuthStateChanged((user) => {
if (user && document.getElementById('wellnessSummary')) {
new ProfileWellnessHandler();
}
});
}

document.addEventListener('DOMContentLoaded', () => {
setupBiaInputActions();
});

export default ProfileWellnessHandler;

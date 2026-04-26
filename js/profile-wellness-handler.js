/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E CONFIGURAZIONE     # */
/* ############################################################ */
import { auth, db } from "./firebase.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


/* ############################################################ */
/* #                                                          # */
/* #           2. CLASSE GESTIONE WELLNESS UFFICIALE         # */
/* ############################################################ */
class ProfileWellnessHandler {
constructor() {
this.questions = [
{ id: "meat", text: "Consumi carne bianca magra, pesce o proteine vegetali almeno 5 volte a settimana?", tip: "Prova a sostituire la carne rossa con pollo, tacchino o legumi." },
{ id: "fruit", text: "Mangi almeno 5 porzioni di frutta e verdura al giorno?", tip: "Inizia ogni pasto con una porzione di verdura fresca." },
{ id: "fish", text: "Consumi pesce grasso (salmone, sgombro, noci) almeno 2-3 volte a settimana?", tip: "Il pesce grasso fornisce Omega-3 essenziali per il cuore." },
{ id: "fiber", text: "Consumi cereali integrali, pane integrale o avena quotidianamente?", tip: "Le fibre aiutano la digestione e aumentano il senso di sazietà." },
{ id: "exercise", text: "Fai almeno 30 minuti di attività fisica moderata 5 volte a settimana?", tip: "Basta una camminata veloce ogni giorno per fare la differenza." },
{ id: "weight", text: "Sei soddisfatto del tuo peso attuale?", tip: "Piccoli cambiamenti costanti portano a grandi risultati nel tempo." },
{ id: "meals", text: "Ti prendi almeno 20 minuti per consumare ogni pasto principale?", tip: "Mangiare lentamente favorisce la digestione e il controllo dell'appetito." },
{ id: "snacks", text: "Fai spuntini sani durante il giorno?", tip: "Scegli frutta secca o yogurt greco per i tuoi spuntini.", hasText: true },
{ id: "energy", text: "Ti senti energico per tutto l'arco della giornata?", tip: "Controlla l'idratazione e il bilanciamento dei nutrienti se ti senti stanco." },
{ id: "water", text: "Bevi almeno 2 litri di acqua al giorno?", tip: "Porta sempre con te una borraccia per ricordarti di bere." },
{ id: "cardio", text: "Ti senti in buona salute cardiovascolare?", tip: "L'attività aerobica costante migliora la salute del cuore." }
];
this.answers = {};
this.currentQuestionIndex = 0;
this.init();
}


// --- INIZIALIZZAZIONE ---
async init() {
const startBtn = document.getElementById('startWellnessTestBtn');
const isBiaPage = window.location.pathname.includes('bia-input.html');

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
<h4>Valutazione Benessere - Domanda ${this.currentQuestionIndex + 1} di 11</h4>
<p style="margin: 1.5rem 0; font-weight: bold; font-size: 1.1rem; color: #1a1a1a;">${q.text}</p>
<div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
<button class="btn-discord wellness-opt-btn" data-value="yes" style="background: var(--success-color)">SÌ</button>
<button class="btn-discord wellness-opt-btn" data-value="no" style="background: var(--danger-color)">NO</button>
</div>
<div id="textInputContainer" style="display: none; margin-top: 1rem;">
<label style="margin-bottom: 0.5rem; display: block;">Specifica quali spuntini fai:</label>
<textarea id="wellnessTextResponse" rows="2" style="width: 100%;" placeholder="Es: Mandorle, frutto, yogurt..."></textarea>
<button id="nextWithText" class="btn-discord" style="margin-top: 1rem;">Continua</button>
</div>
</div>
`;

container.querySelectorAll('.wellness-opt-btn').forEach(btn => {
btn.onclick = () => {
const val = btn.dataset.value;
if (q.hasText && val === 'yes') {
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
const container = document.getElementById('wellnessSummary');
if (!container) return;

const formattedDate = date instanceof Date ? date.toLocaleDateString() : (date?.toDate ? date.toDate().toLocaleDateString() : "Data non disponibile");
const status = this.getScoreStatus(score);
const isBiaPage = window.location.pathname.includes('bia-input.html');

// Genera suggerimenti basati sui NO
const tips = this.questions
.filter(q => answers[q.id]?.val === 'no')
.map(q => `<div class="tip-item"><i class="fas fa-lightbulb"></i> ${q.tip}</div>`)
.join('');

container.innerHTML = `
<div class="status-header">
<i class="fas fa-chart-line" style="color: ${status.color}"></i>
<span>Ultima Valutazione: ${formattedDate}</span>
</div>

<div class="wellness-graphic" style="margin: 1.5rem 0;">
<div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">
<span>Punteggio: ${score}/15</span>
<span style="color: ${status.color}">${status.text}</span>
</div>
<div class="progress-bar-container" style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #ccc;">
<div style="width: ${(score/15)*100}%; height: 100%; background: ${status.color}; transition: width 1s ease-in-out;"></div>
</div>
</div>

<div class="wellness-tips-section card" style="background: #fff; margin-top: 1rem;">
<h4 style="color: var(--primary-color); margin-bottom: 1rem;"><i class="fas fa-magic"></i> Suggerimenti Personalizzati</h4>
<div class="tips-grid">
${tips || '<p>Complimenti! Il tuo stile di vita è eccellente.</p>'}
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

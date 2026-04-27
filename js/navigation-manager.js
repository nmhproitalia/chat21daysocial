/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE FIREBASE E CONFIGURAZIONE     # */
/* #                                                          # */
/* ############################################################ */
import { auth, db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";



/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE GESTIONE MENU            # */
/* #                                                          # */
/* ############################################################ */
class NavigationManager {
// --- FUNZIONE COSTRUTTORE ---
constructor() {
this.currentPage = this.getCurrentPage();
this.isAdmin = false;
this.init();
}


// --- FUNZIONE INIZIALIZZAZIONE ---
init() {
this.setActivePage();
this.checkUserRole();
this.setupEventListeners();
}


// --- FUNZIONE DETERMINAZIONE PAGINA CORRENTE ---
getCurrentPage() {
const path = window.location.pathname;
const page = path.split('/').pop().replace('.html', '') || 'home';
const pageMap = {
'': 'home',
'index': 'home',
'profile': 'profile',
'wellness-test': 'wellness',
'tanita': 'bia',
'social': 'social',
'dashboard': 'admin',
'challengers': 'challengers',
'welcome': 'welcome',
'posts': 'posts'
};
return pageMap[page] || 'home';
}


// --- FUNZIONE IMPOSTAZIONE PAGINA ATTIVA ---
setActivePage() {
const activeButton = document.querySelector(`[data-page="${this.currentPage}"]`);
if (activeButton) {
activeButton.classList.add('active');
}
}


// --- FUNZIONE VERIFICA RUOLO UTENTE ---
async checkUserRole() {
try {
// Attendi un attimo se auth non è ancora pronto
if (!auth.currentUser) {
await new Promise(resolve => {
const unsubscribe = auth.onAuthStateChanged(user => {
unsubscribe();
resolve(user);
});
});
}

if (auth.currentUser) {
const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
if (userDoc.exists()) {
const userData = userDoc.data();
const userRole = (userData.role || '').toLowerCase();
this.isAdmin = userRole === 'admin' || userRole === 'coach';

console.log("NavigationManager - Ruolo rilevato:", userRole, "isAdmin:", this.isAdmin);

const adminButtons = document.querySelectorAll('.admin-link, #adminBtn');
adminButtons.forEach(btn => {
if (btn) {
if (this.isAdmin) {
btn.classList.remove('hidden');
btn.style.display = 'flex';
} else {
btn.classList.add('hidden');
btn.style.display = 'none';
}
}
});
}
}
} catch (error) {
console.error('Errore verifica ruolo utente:', error);
}
}


// --- FUNZIONE IMPOSTAZIONE EVENT LISTENERS ---
setupEventListeners() {
auth.onAuthStateChanged(() => {
this.checkUserRole();
});
const buttons = document.querySelectorAll('.nav-button, .nav-link');
buttons.forEach(button => {
button.addEventListener('click', (e) => {
this.handleButtonClick(e, button);
});
});
}


// --- FUNZIONE GESTIONE CLICK PULSANTE ---
handleButtonClick(event, button) {
button.classList.add('loading');
setTimeout(() => {
button.classList.remove('loading');
}, 1000);
}
}



/* ############################################################ */
/* #                                                          # */
/* #           3. INIZIALIZZAZIONE AUTOMATICA                  # */
/* #                                                          # */
/* ############################################################ */
document.addEventListener('DOMContentLoaded', () => {
new NavigationManager();
});

window.NavigationManager = NavigationManager;

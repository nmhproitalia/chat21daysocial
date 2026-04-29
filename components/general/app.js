/* ############################################################ */
/* #                                                          # */
/* #           1. IMPORTAZIONE MODULI E CONFIGURAZIONE       # */
/* ############################################################ */
import { auth, db } from "../../js/firebase.js";
import { initAuth, handleRegister, handleLogin } from "./auth.js";
import { initPosts, cleanupPosts, setupMediaUpload } from "../posts/posts.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { initGlobalEyes, initUnifiedHeader } from "./ui-helper.js";
// import { setupProfiloActions } from "./profile-manager.js"; // Rimosso per evitare errore MIME



/* ############################################################ */
/* #                                                          # */
/* #           2. INIZIALIZZAZIONE APPLICAZIONE              # */
/* ############################################################ */
// --- GLOBAL ERROR HANDLING ---
window.onerror = function(message, source, lineno, colno, error) {
console.error("Irina GLOBAL ERROR:", message);
console.error("Source:", source);
console.error("Line:", lineno, "Column:", colno);
console.error("Error object:", error);
return false;
};

window.addEventListener('unhandledrejection', function(event) {
console.error("Irina UNHANDLED PROMISE REJECTION:", event.reason);
console.error("Promise:", event.promise);
});

// --- FUNZIONE INIZIALIZZAZIONE GLOBALE ---
document.addEventListener('DOMContentLoaded', () => {
document.body.classList.add("app-ready");
setActiveNavigation();
setupEventListeners();
initGlobalEyes();
forceCursorPointer();

// BLINDAGGIO: Inizializzazione Header Unificato (Banner + Menu + Auto-Padding)
try {
initUnifiedHeader();
} catch (e) {
console.error("Errore inizializzazione header:", e);
}

initAuthHandler();
});

// Chiama forceCursorPointer anche se DOM già caricato (per import come modulo)
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', forceCursorPointer);
} else {
forceCursorPointer();
}

// Esponi globalmente per chiamata manuale
window.forceCursorPointer = forceCursorPointer;

// --- FORZATURA CURSOR POINTER ---
function forceCursorPointer() {
const clickableElements = document.querySelectorAll('button, input, select, textarea, .btn, a[href], a[role="button"], .nav-link, .interaction-btn, label');
clickableElements.forEach(el => {
el.style.cursor = 'pointer';
});
console.log(`Forzato cursor-pointer su ${clickableElements.length} elementi cliccabili`);
}


// --- FUNZIONE IMPOSTAZIONE NAVIGAZIONE ATTIVA ---
function setActiveNavigation() {
const currentPath = window.location.pathname;
const navLinks = document.querySelectorAll('.page-menu .nav-link');
navLinks.forEach(link => {
const href = link.getAttribute('href');
if (href && currentPath.includes(href)) {
link.classList.add('active');
}
});
}



/* ############################################################ */
/* #                                                          # */
/* #           3. GESTIONE AUTENTICAZIONE E STATO            # */
/* ############################################################ */
// --- FUNZIONE GESTORE STATO AUTENTICAZIONE ---
function initAuthHandler() {
initAuth(async (user) => {
if (user) {
console.log("Utente loggato:", user.email);
try {
const userDoc = await getDoc(doc(db, "users", user.uid));
if (userDoc.exists()) {
const userData = userDoc.data();

// --- FIX REDIRECT: SINCRONIZZAZIONE RUOLO PER MODULI BIA/ACCESS ---
localStorage.setItem('userRole', userData.role || 'user');

if (userData.role === 'admin') {
const adminBtns = document.querySelectorAll('#adminBtn, .admin-link');
adminBtns.forEach(btn => {
btn.classList.remove('hidden');
btn.style.display = 'flex';
});
}
}
} catch (error) {
console.error("Errore recupero dati utente:", error);
}

// Inizializza i post solo se siamo nella bacheca
const postsBox = document.getElementById('postsFeed');
if (postsBox) {
initPosts(postsBox);
setupMediaUpload();
}

// setupProfiloActions(user.uid); // Rimosso per evitare errore

} else {
// Utente non loggato: redirect solo se NON già su index.html
const isIndex = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
if (!isIndex) {
window.location.replace('index.html');
}
}
});
}



/* ############################################################ */
/* #                                                          # */
/* #           4. EVENT LISTENERS E AZIONI UI                # */
/* ############################################################ */
window.handleLogout = async function() {
    try {
        localStorage.removeItem('userRole'); // Pulisci ruolo al logout
        await signOut(auth);
        window.location.replace('index.html');
    } catch (error) {
        console.error("Errore logout:", error);
    }
};

// --- FUNZIONE SETUP EVENT LISTENERS ---
function setupEventListeners() {
// LOGOUT
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
logoutBtn.addEventListener('click', window.handleLogout);
}

// REGISTRAZIONE (FORM INDEX)
const registerForm = document.getElementById('registerForm');
if (registerForm) {
registerForm.addEventListener('submit', async (e) => {
e.preventDefault();
const submitBtn = e.target.querySelector('button[type="submit"]');
const originalText = submitBtn.innerHTML;

const email = document.getElementById('regEmail').value;
const pass = document.getElementById('regPassword').value;
const firstName = document.getElementById('regFirstName').value;
const lastName = document.getElementById('regLastName').value;
const phoneInput = document.getElementById('regPhone');
const phone = phoneInput ? phoneInput.value : '';

try {
submitBtn.disabled = true;
submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrazione...';
await handleRegister(email, pass, { firstName, lastName, phone });
window.location.href = 'welcome.html';
} catch (err) {
submitBtn.disabled = false;
submitBtn.innerHTML = originalText;
const statusEl = document.getElementById('registerStatus');
if (statusEl) {
statusEl.textContent = "Errore registrazione: " + err.message;
statusEl.classList.remove('hidden');
statusEl.classList.add('error');
}
}
});
}

// LOGIN (FORM INDEX)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
loginForm.addEventListener('submit', async (e) => {
e.preventDefault();
const submitBtn = e.target.querySelector('button[type="submit"]');
const originalText = submitBtn.innerHTML;

const email = document.getElementById('loginEmail').value;
const pass = document.getElementById('loginPassword').value;

try {
submitBtn.disabled = true;
submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso...';
await handleLogin(email, pass);
window.location.href = 'posts.html';
} catch (err) {
submitBtn.disabled = false;
submitBtn.innerHTML = originalText;
const statusEl = document.getElementById('loginStatus');
if (statusEl) {
statusEl.textContent = "Errore accesso: " + err.message;
statusEl.classList.remove('hidden');
statusEl.classList.add('error');
}
}
});
}
}


// --- FUNZIONE ESECUZIONE LOGOUT RIMOSSA PERCHÉ SPOSTATA IN WINDOW.HANDLELOGOUT ---

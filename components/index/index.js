import { handleRegister, handleLogin, resetPassword } from "../../components/general/auth.js";
import { updatePasswordUI } from "../../components/general/ui-helper.js";

/**
 * COMPONENT: AUTH FORMS
 * Gestisce la logica dei form di Login e Registrazione
 */
export function initAuthForms() {
const regCard = document.getElementById('registerCard');
const logCard = document.getElementById('loginCard');
const resetCard = document.getElementById('resetPasswordCard');
const regPass = document.getElementById('regPassword');

    // Toggle tra Login e Register
    const showLoginBtn = document.getElementById('showLogin');
    const showRegisterBtn = document.getElementById('showRegister');

    const switchView = (view) => {
regCard.classList.add('hidden');
logCard.classList.add('hidden');
resetCard.classList.add('hidden');
regCard.style.display = 'none';
logCard.style.display = 'none';
resetCard.style.display = 'none';

if (view === 'login') {
logCard.classList.remove('hidden');
logCard.style.display = 'block';
} else if (view === 'register') {
regCard.classList.remove('hidden');
regCard.style.display = 'block';
} else if (view === 'reset') {
resetCard.classList.remove('hidden');
resetCard.style.display = 'block';
}
window.scrollTo({ top: 0, behavior: 'smooth' });
};

    if (showLoginBtn) {
showLoginBtn.onclick = (e) => {
e.preventDefault();
switchView('login');
};
}

if (showRegisterBtn) {
showRegisterBtn.onclick = (e) => {
e.preventDefault();
switchView('register');
};
}

const forgotPassBtn = document.getElementById('forgotPass');
if (forgotPassBtn) {
forgotPassBtn.onclick = (e) => {
e.preventDefault();
switchView('reset');
};
}

const backToLoginBtn = document.getElementById('backToLogin');
if (backToLoginBtn) {
backToLoginBtn.onclick = (e) => {
e.preventDefault();
switchView('login');
};
}

    // Validazione Password in tempo reale
    if (regPass) {
        regPass.oninput = (e) => updatePasswordUI(e.target.value);
    }

    // Gestione Submit Form
    setupSubmitHandlers();
}

function setupSubmitHandlers() {
    const regForm = document.getElementById('registerForm');
    const logForm = document.getElementById('loginForm');
    const regStatus = document.getElementById('registerStatus');
    const logStatus = document.getElementById('loginStatus');

    const showMessage = (element, message, isError = true) => {
        if (!element) return;
        element.textContent = message;
        element.className = `system-message ${isError ? 'error' : 'success'}`;
        element.classList.remove('hidden');
    };

    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('regSubmitBtn');
            const originalText = btn.innerHTML;
            const email = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPassword').value;
            const firstName = document.getElementById('regFirstName').value;
            const lastName = document.getElementById('regLastName').value;

            try {
                regStatus.classList.add('hidden');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrazione...';
                await handleRegister(email, pass, { firstName, lastName });
                window.location.href = 'posts.html';
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = originalText;
                let errorMsg = "Errore durante la registrazione. Riprova.";
                if (err.code === 'auth/email-already-in-use') errorMsg = "Email già registrata.";
                if (err.code === 'auth/invalid-email') errorMsg = "Email non valida.";
                showMessage(regStatus, errorMsg);
            }
        };
    }

    if (logForm) {
        logForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginSubmitBtn');
            const originalText = btn.innerHTML;
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;

            try {
                logStatus.classList.add('hidden');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso...';
                await handleLogin(email, pass);
                window.location.href = 'posts.html';
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = originalText;
                let errorMsg = "Credenziali non valide. Riprova.";
                if (err.code === 'auth/user-not-found') errorMsg = "Utente non trovato.";
                if (err.code === 'auth/wrong-password') errorMsg = "Password errata.";
                showMessage(logStatus, errorMsg);
            }
        };
    }

    const resetForm = document.getElementById('resetPasswordForm');
    const resetStatus = document.getElementById('resetPasswordStatus');
    if (resetForm) {
        resetForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('resetPasswordSubmitBtn');
            const originalText = btn.innerHTML;
            const email = document.getElementById('resetEmail').value;

            try {
                resetStatus.classList.add('hidden');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';
                await resetPassword(email);
                showMessage(resetStatus, "Email di reset inviata. Controlla la tua casella di posta.", false);
                btn.disabled = false;
                btn.innerHTML = originalText;
            } catch (err) {
                console.error("Errore reset password dettagliato:", err);
                btn.disabled = false;
                btn.innerHTML = originalText;
                let errorMsg = "Errore durante l'invio dell'email. Riprova.";
                if (err.code === 'auth/user-not-found') errorMsg = "Utente non trovato.";
                if (err.code === 'auth/invalid-email') errorMsg = "Email non valida.";
                showMessage(resetStatus, errorMsg);
            }
        };
    }
}

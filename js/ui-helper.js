/* ############################################################ */
/* #                                                          # */
/* #           1. GESTIONE OCCHIETTI E PASSWORD              # */
/* #                                                          # */
/* ############################################################ */
// --- INIZIALIZZA OCCHIETTI PASSWORD ---
export function initGlobalEyes() {
document.querySelectorAll('.eye-toggle').forEach(eye => {
eye.onclick = () => {
const targetId = eye.dataset.target;
const input = targetId ? document.getElementById(targetId) : eye.previousElementSibling;
if (input) {
const isPass = input.type === 'password';
input.type = isPass ? 'text' : 'password';
eye.classList.toggle('fa-eye');
eye.classList.toggle('fa-eye-slash');
}
};
});
}

// --- SETUP VALIDAZIONE PASSWORD PRO ---
export function validatePasswordStrength(password) {
const rules = {
length: password.length >= 8,
upper: /[A-Z]/.test(password),
number: /[0-9]/.test(password),
special: /[!@#$%^&*]/.test(password)
};
return rules;
}

// --- VALIDAZIONE FORMATO TELEFONO ---
export function validatePhoneNumber(phone) {
    // Regex per formato internazionale o italiano: +39... o 3... (min 9 cifre)
    const phoneRegex = /^(\+39|0039)?\s?\d{9,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function updatePasswordUI(password, containerPrefix = 'rule-') {
const rules = validatePasswordStrength(password);
Object.keys(rules).forEach(rule => {
const el = document.getElementById(`${containerPrefix}${rule}`);
if (el) {
if (rules[rule]) {
el.classList.add('valid');
el.querySelector('i').className = 'fas fa-check-circle';
} else {
el.classList.remove('valid');
el.querySelector('i').className = 'fas fa-circle';
}
}
});
return Object.values(rules).every(r => r === true);
}



/* ############################################################ */
/* #                                                          # */
/* #           2. SISTEMA NOTIFICHE E CHALLENGE UI             # */
/* #                                                          # */
/* ############################################################ */
import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/**
 * SISTEMA HEADER UNIFICATO (BANNER + MENU) - PROTOCOLLO IRINA
 * Gestisce dinamicamente la creazione e il posizionamento dell'header globale
 */
export function initUnifiedHeader() {
    // Reset preventivo Body per eliminare margini browser
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    let headerContainer = document.getElementById('unified-header');
    // BLINDAGGIO: Se non trova il container, lo crea lui stesso all'inizio del body
    if (!headerContainer) {
        headerContainer = document.createElement('div');
        headerContainer.id = 'unified-header';
        document.body.prepend(headerContainer);
    }

    const isAuthPage = document.body.classList.contains('auth-page') || 
                       window.location.pathname.endsWith('index.html') || 
                       window.location.pathname === '/' ||
                       window.location.pathname.endsWith('/');
    const isDashboardPage = window.location.pathname.includes('dashboard.html');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // 1. COSTRUZIONE HTML DINAMICO
    const bClass = isAuthPage ? 'challenge-banner-index' : 'challenge-banner';
    const hClass = isAuthPage ? 'page-header-index' : 'page-header';
    const mClass = isAuthPage ? 'page-menu-index' : 'page-menu';

    headerContainer.innerHTML = `
        <div class="header-fixed-block">
            <div class="${bClass}">
                <div class="banner-content">
                    #21GIORNIFIT CHALLENGE
                    <div id="globalChallengeDate" class="challenge-date">
                        <i class="fas fa-calendar-star"></i> Inizio Sfida: <span id="globalStartDate">--</span> ore <span id="globalStartTime">--</span>
                    </div>
                    <div id="bannerTimerDisplay" class="banner-timer"></div>
                </div>
            </div>
            <div class="${hClass}">
                ${!isAuthPage ? `
                <div class="${mClass}">
                    <div class="nav-links-container">
                        <a href="posts.html" class="nav-link ${currentPage === 'posts.html' ? 'active' : ''}" data-page="posts"><i class="fas fa-comments"></i><span>Bacheca</span></a>
                        <a href="tanita.html" class="nav-link ${currentPage === 'tanita.html' ? 'active' : ''}" data-page="bia"><i class="fa-solid fa-weight-scale"></i><span>Tanita</span></a>
                        <a href="challengers.html" class="nav-link ${currentPage === 'challengers.html' ? 'active' : ''}" data-page="challengers"><i class="fas fa-users"></i><span>Challengers</span></a>
                        <a href="profile.html" class="nav-link ${currentPage === 'profile.html' ? 'active' : ''}" data-page="profile"><i class="fas fa-user"></i><span>Profilo</span></a>
                    </div>
                    <div class="menu-actions-right">
                        <a id="adminBtn" href="dashboard.html" class="nav-link admin-link ${isDashboardPage ? 'active' : ''} hidden" data-page="admin"><i class="fas fa-tachometer-alt"></i><span>Dashboard</span></a>
                        <button id="logoutBtn"><i class="fas fa-sign-out-alt"></i><span>Logout</span></button>
                    </div>
                </div>
                ` : `
                <div class="${mClass}" style="justify-content: center; padding: 0; height: 80px; display: flex; align-items: center;">
                    <span style="color: #8e8e93; font-weight: 800; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;">
                        Area Accesso Protetta
                    </span>
                </div>
                `}
            </div>
        </div>
    `;

    // 2. LOGICA SINCRONIZZAZIONE DATI (BANNER + TIMER)
    initChallengeBannerLogic();

    // 3. LOGICA LOGOUT
    const logoutBtn = headerContainer.querySelector('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            console.log("Irina: Logout attivato dall'header unificato");
            // Dispatch evento custom per app.js o chiama direttamente la logica
            if (window.handleLogout) {
                window.handleLogout();
            } else {
                // Fallback se non ancora globale
                localStorage.removeItem('userRole');
                import('./firebase.js').then(({ auth }) => {
                    import('https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js').then(({ signOut }) => {
                        signOut(auth).then(() => window.location.replace('index.html'));
                    });
                });
            }
        };
    }

    // 4. AUTO-PADDING DINAMICO (DISABILITATO - GESTITO DA header.js/header-index.js)
    // const adjustPadding = () => {
    //     const headerBlock = headerContainer.querySelector('.header-fixed-block');
    //     const wrapper = document.querySelector('.page-wrapper');
    //     if (headerBlock && wrapper) {
    //         const height = headerBlock.getBoundingClientRect().height;
    //         if (height > 0) {
    //             wrapper.style.paddingTop = `${height}px`;
    //             console.log(`Irina: Header Height adjusted to ${height}px`);
    //         }
    //     }
    // };

    // // Esegui subito e ad ogni resize/cambiamento DOM
    // setTimeout(adjustPadding, 100);
    // window.addEventListener('resize', adjustPadding);
    
    // // Observer per cambiamenti dinamici (es. timer che appare/scompare)
    // const observer = new MutationObserver(adjustPadding);
    // observer.observe(headerContainer, { childList: true, subtree: true });
}

function initChallengeBannerLogic() {
    const dateEl = document.getElementById('globalStartDate');
    const timeEl = document.getElementById('globalStartTime');
    const timerDisplay = document.getElementById('bannerTimerDisplay');
    if (!dateEl || !timeEl) return;

    let timerInterval = null;

    onSnapshot(doc(db, "challenge_settings", "global"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const rawDate = data.challengeStartDate;
            const time = data.challengeStartTime || '00:00';

            if (rawDate) {
                const [year, month, day] = rawDate.split('-');
                dateEl.textContent = `${day}-${month}-${year}`;
                timeEl.textContent = time;

                const startTime = new Date(`${rawDate}T${time}`).getTime();
                if (timerInterval) clearInterval(timerInterval);

                const updateTimer = () => {
                    const distance = startTime - new Date().getTime();
                    if (distance < 0) {
                        timerDisplay.innerHTML = '<span class="status-active">🚀 SFIDA IN CORSO!</span>';
                        if (timerInterval) clearInterval(timerInterval);
                        return;
                    }
                    const d = Math.floor(distance / 86400000).toString().padStart(2, '0');
                    const h = Math.floor((distance % 86400000) / 3600000).toString().padStart(2, '0');
                    const m = Math.floor((distance % 3600000) / 60000).toString().padStart(2, '0');
                    const s = Math.floor((distance % 60000) / 1000).toString().padStart(2, '0');
                    timerDisplay.innerHTML = `<div>${d}d</div><div>${h}h</div><div>${m}m</div><div>${s}s</div>`;
                };
                updateTimer();
                timerInterval = setInterval(updateTimer, 1000);
            }
        }
    });
}
/**
 * Mostra un messaggio di servizio statico nel corpo della pagina
 * @param {string} message - Testo da mostrare
 * @param {string} type - 'success', 'error', 'info'
 * @param {HTMLElement} anchorElement - Elemento vicino a cui mostrare il messaggio
 */
export function showServiceMessage(message, type = 'success', anchorElement = null) {
    // Rimuovi eventuali messaggi precedenti
    const existingMsg = document.querySelector('.service-message');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `service-message service-message--${type}`;
    msgDiv.innerHTML = `<span>${message}</span>`;
    
    // Stile base (aggiunto dinamicamente o in style.css)
    Object.assign(msgDiv.style, {
        padding: '10px 15px',
        borderRadius: '8px',
        marginTop: '10px',
        marginBottom: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        textAlign: 'center',
        transition: 'opacity 0.3s ease',
        opacity: '0'
    });

    // Colori basati sul tipo
    if (type === 'success') {
        msgDiv.style.backgroundColor = '#d4edda';
        msgDiv.style.color = '#155724';
        msgDiv.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        msgDiv.style.backgroundColor = '#f8d7da';
        msgDiv.style.color = '#721c24';
        msgDiv.style.border = '1px solid #f5c6cb';
    } else {
        msgDiv.style.backgroundColor = '#e2e3e5';
        msgDiv.style.color = '#383d41';
        msgDiv.style.border = '1px solid #d6d8db';
    }

    if (anchorElement && anchorElement.parentNode) {
        anchorElement.parentNode.insertBefore(msgDiv, anchorElement.nextSibling);
    } else {
        // Fallback: inizio del main app
        const app = document.getElementById('app');
        if (app) app.prepend(msgDiv);
    }

    // Animazione entrata
    setTimeout(() => msgDiv.style.opacity = '1', 10);

    // Scomparsa automatica dopo 4 secondi
    setTimeout(() => {
        msgDiv.style.opacity = '0';
        setTimeout(() => msgDiv.remove(), 300);
    }, 4000);
}

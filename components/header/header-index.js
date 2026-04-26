import { db } from "../../js/firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// --- GLOBAL ERROR HANDLING ---
window.onerror = function(message, source, lineno, colno, error) {
const errorData = {
message: message,
source: source,
line: lineno,
column: colno,
error: error ? error.toString() : 'No error object',
timestamp: new Date().toISOString()
};
console.error("Irina GLOBAL ERROR (INDEX):", errorData);
localStorage.setItem('irina_errors', JSON.stringify([...JSON.parse(localStorage.getItem('irina_errors') || '[]'), errorData]));
return false;
};

window.addEventListener('unhandledrejection', function(event) {
const errorData = {
reason: event.reason ? event.reason.toString() : 'No reason',
promise: event.promise ? 'Promise object' : 'No promise',
timestamp: new Date().toISOString()
};
console.error("Irina UNHANDLED PROMISE REJECTION (INDEX):", errorData);
localStorage.setItem('irina_errors', JSON.stringify([...JSON.parse(localStorage.getItem('irina_errors') || '[]'), errorData]));
});

// --- ERRORI CARICAMENTO RISORSE ---
window.addEventListener('error', function(event) {
const errorData = {
target: event.target ? event.target.tagName : 'No target',
type: event.type,
src: event.target ? event.target.src : 'No src',
timestamp: new Date().toISOString()
};
console.error("Irina RESOURCE ERROR (INDEX):", errorData);
localStorage.setItem('irina_errors', JSON.stringify([...JSON.parse(localStorage.getItem('irina_errors') || '[]'), errorData]));
}, true);

// --- LEGGI ERRORI PRECEDENTI ---
const previousErrors = localStorage.getItem('irina_errors');
if (previousErrors) {
console.log("Irina PREVIOUS ERRORS:", JSON.parse(previousErrors));
localStorage.removeItem('irina_errors');
}

/**
* COMPONENT: HEADER INDEX (Solo Banner)
* Gestisce esclusivamente il Banner sfida dorato per la pagina di login
*/
export function initHeaderIndex() {
const headerContainer = document.getElementById('unified-header');
    if (!headerContainer) {
        headerContainer = document.createElement('div');
        headerContainer.id = 'unified-header';
        document.body.prepend(headerContainer);
    }
    headerContainer.innerHTML = `
    <div class="header-fixed-block">
        <div class="challenge-banner-title">#21GIORNIFIT CHALLENGE</div>
        <div id="challenge-banner-container"></div>
        <header class="page-header">
            <nav class="page-menu">
                <span class="auth-text">Area Accesso Protetta</span>
            </nav>
        </header>
    </div>`;
    initBannerLogic(headerContainer);
    adjustWrapperPadding(headerContainer);
}
function initBannerLogic(container) {
const bannerBox = container.querySelector('#challenge-banner-container');
if (!bannerBox) return;

let timerInterval = null;

onSnapshot(doc(db, "challenge_settings", "global"), (docSnap) => {
if (docSnap.exists()) {
const data = docSnap.data();
const rawDate = data.challengeStartDate;
const rawTime = data.challengeStartTime;
if (rawDate && rawTime) {
const startDateTime = new Date(`${rawDate}T${rawTime}`).getTime();
bannerBox.innerHTML = `
<div class="challenge-banner-index">
<span>LA PROSSIMA CHALLENGE INIZIA TRA:</span>
<div id="bannerTimerDisplay" class="banner-timer">--d --h --m --s</div>
</div>
`;
const timerDisplay = bannerBox.querySelector('#bannerTimerDisplay');

if (timerInterval) clearInterval(timerInterval);

const updateTimer = () => {
const now = new Date().getTime();
const diff = startDateTime - now;
if (diff <= 0) {
if (timerDisplay) timerDisplay.innerHTML = "IN CORSO!";
if (timerInterval) clearInterval(timerInterval);
return;
}
const d = Math.floor(diff / (1000 * 60 * 60 * 24));
const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
const s = Math.floor((diff % (1000 * 60)) / 1000);
timerDisplay.innerHTML = `<div>${d}G</div><div>${h}H</div><div>${m}M</div><div>${s}S</div>`;
};
updateTimer();
timerInterval = setInterval(updateTimer, 1000);
}
}
});
}
function adjustWrapperPadding(container) {
let timeoutId = null;
const adjust = () => {
const block = container.querySelector('.header-fixed-block');
const wrapper = document.querySelector('.page-wrapper');
const footer = document.querySelector('.page-footer-fixed');
const domContainer = document.querySelector('.container');
if (domContainer) {
domContainer.style.setProperty('padding-left', '30px', 'important');
domContainer.style.setProperty('padding-right', '30px', 'important');
}
if (block && wrapper) {
const height = block.offsetHeight;
if (height > 0) {
wrapper.style.setProperty('padding-top', (height + 30) + 'px', 'important');
}
}
if (footer && wrapper) {
wrapper.style.setProperty('padding-bottom', '60px', 'important');
}
};
const debouncedAdjust = () => {
if (timeoutId) clearTimeout(timeoutId);
timeoutId = setTimeout(adjust, 100);
};
const block = container.querySelector('.header-fixed-block');
if (block) {
const observer = new ResizeObserver(debouncedAdjust);
observer.observe(block);
debouncedAdjust();
setTimeout(adjust, 500);
}
}

import { db } from "../../../js/firebase.js";
import { doc, onSnapshot, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/**
 * COMPONENT: UNIFIED HEADER
 * Gestisce Banner sfida + Menu navigazione (Pagine post-login)
 */
export function initHeader() {
const headerContainer = document.getElementById('unified-header');
if (!headerContainer) return;

const currentPage = window.location.pathname.split('/').pop() || 'posts.html';

headerContainer.innerHTML = `
<div class="header-fixed-block">
<div class="challenge-banner-title">#21GIORNIFIT CHALLENGE</div>
<div id="challenge-banner-container"></div>
<header class="page-header">
<nav class="page-menu">
<div class="nav-link posts-wrapper">
<a href="posts.html" class="nav-link" data-page="posts"><i class="fas fa-comments"></i><span>Bacheca</span></a>
<span id="posts-counter" class="posts-counter">0</span>
</div>
<div class="nav-link challengers-wrapper">
<a href="challengers.html" class="nav-link" data-page="challengers"><i class="fas fa-users"></i><span>Challengers</span></a>
<span id="challengers-counter" class="challengers-counter">0</span>
</div>
<a href="tanita.html" class="nav-link" data-page="wellness"><i class="fas fa-weight-scale"></i><span>Tanita®</span></a>
<a href="profile.html" class="nav-link" data-page="profile"><i class="fas fa-user-circle"></i><span>Profilo</span></a>
<a href="dashboard.html" class="nav-link admin-only hidden" data-page="admin"><i class="fas fa-user-shield"></i><span>Coach</span></a>
<button id="logoutBtn" class="nav-link"><i class="fas fa-sign-out-alt"></i><span>Esci</span></button>
</nav>
</header>
</div>`;

    initBannerLogic(headerContainer);
    setupHeaderEvents(headerContainer);
    highlightCurrentPage(headerContainer, currentPage);
    adjustWrapperPadding(headerContainer);
    loadChallengersCount(headerContainer);
    loadUnreadPostsCount(headerContainer);
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

                    if (timerDisplay) {
                        timerDisplay.innerHTML = `<div>${d}G</div><div>${h}H</div><div>${m}M</div><div>${s}S</div>`;
                    }
                };

                updateTimer();
                timerInterval = setInterval(updateTimer, 1000);
            }
        }
    });
}

function highlightCurrentPage(container, currentPage) {
    const links = container.querySelectorAll('.nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

function setupHeaderEvents(container) {
    const logoutBtn = container.querySelector('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (window.handleLogout) await window.handleLogout();
            else window.location.replace('index.html');
        };
    }
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

async function loadChallengersCount(container) {
const counter = container.querySelector('#challengers-counter');
if (!counter) return;

try {
const usersSnapshot = await getDocs(collection(db, "users"));
let count = 0;
usersSnapshot.forEach(doc => {
const userData = doc.data();
const userRole = (userData.role || '').toLowerCase();
const isCoach = userRole === 'admin' || userRole === 'coach';
const isAssistant = userRole === 'assistant' || userRole === 'assistente';
if (!isCoach && !isAssistant) count++;
});
counter.textContent = count;
} catch (error) {
console.error("Errore caricamento contatore challengers:", error);
counter.textContent = "0";
}
}

async function loadUnreadPostsCount(container) {
const counter = container.querySelector('#posts-counter');
if (!counter) return;

try {
// Ottieni l'ultimo timestamp di lettura da localStorage
const lastReadTimestamp = localStorage.getItem('lastPostReadTimestamp');
const lastRead = lastReadTimestamp ? parseInt(lastReadTimestamp) : 0;

// Conta post più recenti dell'ultima lettura
const postsSnapshot = await getDocs(collection(db, "posts"));
let unreadCount = 0;
postsSnapshot.forEach(doc => {
const postData = doc.data();
const postTimestamp = postData.timestamp || postData.createdAt;
if (postTimestamp && postTimestamp > lastRead) {
unreadCount++;
}
});

counter.textContent = unreadCount;
// Nascondi counter se 0
counter.style.display = unreadCount > 0 ? 'block' : 'none';
} catch (error) {
console.error("Errore caricamento contatore post non letti:", error);
counter.textContent = "0";
counter.style.display = 'none';
}
}

/* ############################################################ */
/* #                                                          # */
/* #           1. VIDEO SELECTOR - GESTIONE MEDIA             # */
/* ############################################################ */
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { auth } from "./firebase.js";
import { sanitizeHTML } from "./utils.js";


/* ############################################################ */
/* #                                                          # */
/* #           2. FUNZIONI GESTIONE MODAL VIDEO              # */
/* ############################################################ */
let videoModal = null;


// --- FUNZIONE APERTURA SELETTORE VIDEO ---
export function openVideoSelector(postId) {
console.log("?? Apro selettore video per post:", postId);
if (!videoModal) {
videoModal = createVideoModal();
document.body.appendChild(videoModal);
}
videoModal.style.display = 'flex';
setupVideoModalEvents(postId);
}


// --- FUNZIONE CREAZIONE MODAL VIDEO ---
function createVideoModal() {
const modal = document.createElement('div');
modal.id = 'videoSelectorModal';
modal.className = 'modal';
return modal;
}


// --- FUNZIONE SETUP EVENTI MODAL ---
function setupVideoModalEvents(postId) {
console.log("Setup eventi per post:", postId);
}


// --- ESPONI FUNZIONI GLOBALMENTE ---
window.openVideoSelector = openVideoSelector;

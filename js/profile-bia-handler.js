/* ############################################################ */
/* #                                                          # */
/* #           1. GESTORE MODIFICA BIA DA PROFILO            # */
/* ############################################################ */
/**
 * Gestore Pulsante Modifica BIA da Profile
 * Gestisce navigazione verso pagina bia-input.html
 * 
 * @author 21GIORNIFIT System
 * @version 1.0
 */
import { auth } from './firebase.js';


/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE BIA HANDLER             # */
/* ############################################################ */
export class ProfileBIAHandler {
constructor() {
this.editBiaBtn = null;
this.currentUser = null;
this.targetUid = null;
this.init();
}


// --- FUNZIONE INIZIALIZZAZIONE ---
init() {
this.setupEventListeners();
this.loadUserData();
}


// --- FUNZIONE SETUP EVENT LISTENERS ---
setupEventListeners() {
this.editBiaBtn = document.getElementById('editBiaBtn');
if (this.editBiaBtn) {
this.editBiaBtn.addEventListener('click', () => {
window.location.href = 'bia-input.html';
});
}
}


// --- FUNZIONE CARICAMENTO DATI UTENTE ---
loadUserData() {
this.currentUser = auth.currentUser;
}
}

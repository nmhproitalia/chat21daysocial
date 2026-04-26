/**
 * Controllo Accessi Pagina BIA
 * Gestisce permessi per accesso a pagina inserimento dati BIA
 * 
 * @author 21GIORNIFIT System
 * @version 1.0
 */

import { auth } from "../firebase.js";

/**
 * Controllo Accessi BIA
 */
export class BIAAccessControl {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
    }

    /**
     * Controlla permessi accesso pagina BIA
     * @param {string} userRole - Ruolo utente ('user' o 'admin')
     * @param {string} targetUid - UID utente target (per coach)
     * @returns {boolean} Permesso accesso
     */
    checkBIAAccess(userRole, targetUid = null) {
        this.currentUser = auth.currentUser;
        this.userRole = userRole || localStorage.getItem('userRole');
        
        if (!this.currentUser) {
            console.error('Utente non autenticato');
            return false;
        }
        
        // Utente può accedere solo ai propri dati BIA
        if (this.userRole === 'user') {
            return !targetUid || targetUid === this.currentUser.uid;
        }
        
        // Coach può accedere a tutti i dati BIA
        if (this.userRole === 'admin') {
            return true;
        }
        
        console.warn('Ruolo utente non riconosciuto:', this.userRole);
        return false;
    }

    /**
     * Reindirizza se accesso negato
     * @returns {boolean} Accesso consentito
     */
    enforceBIAAccess() {
        this.currentUser = auth.currentUser;
        
        // Recupera il ruolo utente se non è già stato impostato
        if (!this.userRole) {
            this.userRole = localStorage.getItem('userRole');
        }
        
        // Se non abbiamo ancora l'utente o il ruolo, non forzare il redirect immediato
        // lasciamo che l'inizializzazione asincrona faccia il suo corso
        if (!this.currentUser || !this.userRole) {
            console.log('BIA Access: Waiting for Auth/Role...');
            return true; 
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const targetUid = urlParams.get('uid');
        
        if (!this.checkBIAAccess(this.userRole, targetUid)) {
            console.warn('Accesso negato alla pagina BIA - Ruolo:', this.userRole, 'Target:', targetUid);
            this.redirectToProfile();
            return false;
        }
        
        console.log('Accesso consentito alla pagina BIA - Ruolo:', this.userRole);
        return true;
    }

    /**
     * Reindirizza al profilo
     */
    redirectToProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        const targetUid = urlParams.get('uid');
        
        if (targetUid && this.userRole === 'admin') {
            // Coach che accede a profilo utente specifico
            window.location.href = `profile.html?uid=${targetUid}`;
        } else {
            // Utente normale o coach che accede al proprio profilo
            window.location.href = 'profile.html';
        }
    }

    /**
     * Verifica se utente corrente è coach
     * @returns {boolean} È coach
     */
    isCoach() {
        return this.userRole === 'admin';
    }

    /**
     * Verifica se utente sta modificando propri dati
     * @param {string} targetUid - UID target
     * @returns {boolean} Modifica propri dati
     */
    isOwnProfile(targetUid) {
        return !targetUid || targetUid === this.currentUser.uid;
    }

    /**
     * Ottieni UID target per operazioni BIA
     * @returns {string} UID target
     */
    getTargetUid() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('uid') || this.currentUser.uid;
    }

    /**
     * Genera URL per pagina BIA
     * @param {string} targetUid - UID target (opzionale)
     * @returns {string} URL pagina BIA
     */
    generateBIAUrl(targetUid = null) {
        const uid = targetUid || this.currentUser.uid;
        return this.isCoach() && uid !== this.currentUser.uid 
            ? `bia-input.html?uid=${uid}`
            : 'bia-input.html';
    }

    /**
     * Genera URL per profilo
     * @param {string} targetUid - UID target (opzionale)
     * @returns {string} URL profilo
     */
    generateProfileUrl(targetUid = null) {
        const uid = targetUid || this.currentUser.uid;
        return this.isCoach() && uid !== this.currentUser.uid 
            ? `profile.html?uid=${uid}`
            : 'profile.html';
    }

    /**
     * Mostra/nasconde elementi UI basati su ruolo
     */
    updateUIForRole() {
        // Nascondi/mostra elementi admin
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = this.isCoach() ? 'block' : 'none';
        });

        // Nascondi/mostra elementi user-only
        const userElements = document.querySelectorAll('.user-only');
        userElements.forEach(element => {
            element.style.display = this.isCoach() ? 'none' : 'block';
        });

        // Aggiorna testo contestuale se necessario
        this.updateContextualText();
    }

    /**
     * Aggiorna testo contestuale basato su ruolo e target
     */
    updateContextualText() {
        const targetUid = this.getTargetUid();
        const isOwnProfile = this.isOwnProfile(targetUid);
        
        // Aggiorna titoli pagina
        const pageTitle = document.querySelector('title');
        if (pageTitle) {
            if (this.isCoach() && !isOwnProfile) {
                pageTitle.textContent = 'Inserimento Dati BIA Utente - #21GIORNIFIT';
            } else {
                pageTitle.textContent = 'Inserimento Dati BIA - #21GIORNIFIT';
            }
        }

        // Aggiorna header contesto
        const contextElement = document.getElementById('biaUserContext');
        if (contextElement) {
            if (this.isCoach() && !isOwnProfile) {
                contextElement.textContent = 'Inserisci i parametri BIA per la valutazione della composizione corporea dell\'utente.';
            } else {
                contextElement.textContent = 'Inserisci i parametri BIA per la valutazione completa della composizione corporea.';
            }
        }
    }

    /**
     * Verifica permessi per modifica dati BIA
     * @param {string} targetUid - UID target
     * @returns {boolean} Permesso modifica
     */
    canEditBIAD(targetUid) {
        // Utenti possono sempre modificare i propri dati
        if (this.userRole === 'user') {
            return this.isOwnProfile(targetUid);
        }
        
        // Coach possono modificare tutti i dati BIA
        if (this.userRole === 'admin') {
            return true;
        }
        
        return false;
    }

    /**
     * Verifica permessi per visualizzazione dati BIA
     * @param {string} targetUid - UID target
     * @returns {boolean} Permesso visualizzazione
     */
    canViewBIAD(targetUid) {
        // Utenti possono visualizzare solo i propri dati
        if (this.userRole === 'user') {
            return this.isOwnProfile(targetUid);
        }
        
        // Coach possono visualizzare tutti i dati BIA
        if (this.userRole === 'admin') {
            return true;
        }
        
        return false;
    }

    /**
     * Log azione di accesso
     * @param {string} action - Azione eseguita
     * @param {string} targetUid - UID target
     */
    logAccess(action, targetUid) {
        const logData = {
            action,
            userId: this.currentUser.uid,
            userRole: this.userRole,
            targetUid,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.log('BIA Access Log:', logData);
        
        // Qui potresti inviare i log a Firebase per audit trail
        // this.sendAccessLogToFirebase(logData);
    }

    /**
     * Inizializza controllo accessi
     */
    init() {
        // Ascolta cambiamenti stato autenticazione
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.userRole = localStorage.getItem('userRole');
                this.updateUIForRole();
            } else {
                // Utente non autenticato, reindirizza al login
                window.location.href = 'index.html';
            }
        });
    }
}

export default BIAAccessControl;

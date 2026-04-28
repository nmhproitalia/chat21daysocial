// ============================================================================
// USER MANAGER - Modulo centralizzato per gestione dati utente
// ============================================================================

import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js';

// Cache locale per dati utente
let userCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// Listener centralizzato per dati utente (Single Source of Truth)
let userListener = null;

/**
 * Genera URL avatar fallback con ui-avatars.com
 * @param {string} name - Nome o email dell'utente
 * @param {string} background - Colore di sfondo (default: #266431)
 * @param {string} color - Colore testo (default: #fff)
 * @returns {string} URL avatar generato
 */
export const generateAvatarFallback = () => {
return null;
};

/**
 * Formatta nome completo utente
 * @param {Object} userData - Dati utente da Firestore
 * @param {Object} authUser - Dati utente da Firebase Auth
 * @returns {string} Nome completo formattato
 */
export const formatDisplayName = (userData, authUser) => {
	// Usa SOLO dati da userData (Firestore o post/commento)
	// Priorità: firstName + lastName, poi authorName, poi displayName
	const firstName = userData?.firstName || '';
	const lastName = userData?.lastName || '';
	const authorName = userData?.authorName || '';
	const displayName = userData?.displayName || '';
	
	const fullName = `${firstName} ${lastName}`.trim();
	
	// Se firstName/lastName non sono presenti, usa authorName o displayName
	if (!fullName && authorName) {
		return authorName;
	}
	if (!fullName && displayName) {
		return displayName;
	}
	
	return fullName || 'Utente';
};

/**
 * Ottiene URL foto profilo con fallback dinamico
 * @param {Object} userData - Dati utente da Firestore
 * @param {Object} authUser - Dati utente da Firebase Auth
 * @returns {string} URL foto profilo
 */
export const getPhotoURL = (userData, authUser) => {
	// Usa SOLO dati da Firestore, NO fallback authUser
	return userData?.photoURL || null;
};

/**
 * Carica dati utente da Firestore con cache
 * @param {Object} db - Firestore database instance
 * @param {string} userId - ID utente
 * @returns {Promise<Object>} Dati utente
 */
export const loadUserData = async (db, userId) => {
	// Verifica cache
	const cached = userCache[userId];
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.data;
	}

	try {
		const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
		const userDoc = await getDoc(doc(db, "users", userId));
		const userData = userDoc.exists() ? userDoc.data() : {};

		// Salva in cache
		userCache[userId] = {
			data: userData,
			timestamp: Date.now()
		};

		return userData;
	} catch (error) {
		console.error('Errore caricamento dati utente:', error);
		return {};
	}
};

/**
 * Listener centralizzato per dati utente (Single Source of Truth)
 * @param {Object} db - Firestore database instance
 * @param {string} userId - ID utente
 * @param {Function} onUpdate - Callback quando i dati utente cambiano
 * @returns {Function} Funzione unsubscribe
 */
export const initUserListener = (db, userId, onUpdate) => {
// Rimuovi listener esistente se presente
if (userListener) {
userListener();
userListener = null;
}

try {
import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js').then(({ doc, onSnapshot }) => {
userListener = onSnapshot(doc(db, "users", userId), (docSnap) => {
if (docSnap.exists()) {
const userData = docSnap.data();

// Aggiorna cache
userCache[userId] = {
data: userData,
timestamp: Date.now()
};

// Log solo del ruolo per debug
const role = userData?.role || 'user';
console.log("UI Syncing for role:", role);

// Chiama callback di aggiornamento
if (onUpdate) onUpdate(userData);
}
});
});

return () => { if (userListener) userListener(); };
} catch (error) {
console.error('Errore inizializzazione listener utente:', error);
return () => {};
}
};

/**
 * Funzione centralizzata per aggiornare UI con dati utente
 * @param {Object} userData - Dati utente da Firestore
 * @param {Object} authUser - Dati utente da Firebase Auth
 */
export const updateUI = (userData, authUser) => {
const roleStyles = getRoleStyles(userData?.role);

// Force Render: Rimuovi vecchie classi prima di aggiungere nuove
const containers = document.querySelectorAll('.profile-avatar, .user-avatar, .avatar');
containers.forEach(container => {
container.classList.remove('role-coach', 'role-assistant', 'role-challenger');
if (container.classList.contains('profile-avatar') || container.classList.contains('user-avatar')) {
container.classList.add(roleStyles.class);
}
});

// Aggiorna badge ruolo
const roleBadges = document.querySelectorAll('.role-badge, .modal-user-role');
roleBadges.forEach(badge => {
badge.classList.remove('role-coach', 'role-assistant', 'role-challenger');
badge.classList.add(roleStyles.class);
});
};

/**
 * Funzione centralizzata per verifica permessi moderazione
 * @param {Object} currentUser - Utente che sta tentando l'azione
 * @param {Object} targetContent - Contenuto target (post/commento) con author
 * @returns {boolean} true se permesso concessi, false altrimenti
 */
export const checkPermission = (currentUser, targetContent) => {
if (!currentUser || !targetContent || !targetContent.author) {
return false;
}

// Normalizza ruoli per confronto (Firebase: Coach, Assistente, Challenge)
const roleMapping = {
'coach': 'admin',
'assistente': 'assistant',
'assistant': 'assistant',
'challenge': 'user',
'challenger': 'user',
'admin': 'admin',
'user': 'user'
};

const currentRole = roleMapping[(currentUser.role || '').toLowerCase()] || 'user';
const targetRole = roleMapping[(targetContent.author.role || '').toLowerCase()] || 'user';

// Matrice Poteri: Coach elimina tutti, Assistente elimina tutti tranne Coach, Challenger solo propri
// Coach (admin): può eliminare i contenuti di tutti
if (currentRole === 'admin') {
return true;
}

// Assistente (assistant): può eliminare tutti tranne i contenuti del Coach
if (currentRole === 'assistant' && targetRole !== 'admin') {
return true;
}

// Challenger (user): può eliminare solo i propri contenuti
if (currentUser.id === targetContent.author.id) {
return true;
}

return false;
};

/**
 * Genera HTML utente centralizzato
 * BLINDATO - NON MODIFICARE. Gestisce sia dati utente che post/commenti.
 * @param {Object} userData - Dati utente da Firestore o post/commento
 * @param {Object} authUser - Dati utente da Firebase Auth
 * @param {Object} options - Opzioni di configurazione
 * @returns {Promise<string>} HTML utente formattato
 */
export const renderUserHTML = async (userData, authUser, options = {}) => {
const uiData = getUserDataForUI(userData, authUser, options);
const rankClass = getRankClass(userData?.role);

let photoURL = uiData.photoURL;

// Usa placeholder se photoURL è null o vuoto
if (!photoURL) {
return `<div class="user-avatar placeholder ${rankClass}"><i class="fas fa-user"></i></div>
<div class="modal-user-info">
<span>${uiData.displayName}</span>
<span class="modal-user-role ${rankClass}"><i class="fas ${uiData.roleIcon}"></i> ${uiData.role}</span>
</div>`;
} else if (!photoURL.startsWith('https://') && window.storage) {
// Converti percorso Firebase Storage in URL pubblico
try {
photoURL = await getDownloadURL(ref(window.storage, photoURL));
} catch (error) {
console.error('Errore conversione photoURL:', error);
// Usa fallback placeholder CSS
return `<div class="user-avatar placeholder ${rankClass}"><i class="fas fa-user"></i></div>
<div class="modal-user-info">
<span>${uiData.displayName}</span>
<span class="modal-user-role ${rankClass}"><i class="fas ${uiData.roleIcon}"></i> ${uiData.role}</span>
</div>`;
}
}

return `
<img src="${photoURL}" class="user-avatar ${rankClass}">
<div class="modal-user-info">
<span>${uiData.displayName}</span>
<span class="modal-user-role ${rankClass}"><i class="fas ${uiData.roleIcon}"></i> ${uiData.role}</span>
</div>`;
};

export const renderUserAvatarOnly = async (userData, authUser, options = {}) => {
const uiData = getUserDataForUI(userData, authUser, options);
const rankClass = getRankClass(userData?.role);

let photoURL = uiData.photoURL;

// Usa placeholder se photoURL è null o vuoto
if (!photoURL) {
return `<div class="user-avatar placeholder ${rankClass}"><i class="fas fa-user"></i></div>`;
} else if (!photoURL.startsWith('https://') && window.storage) {
// Converti percorso Firebase Storage in URL pubblico
try {
photoURL = await getDownloadURL(ref(window.storage, photoURL));
} catch (error) {
console.error('Errore conversione photoURL:', error);
// Usa fallback placeholder CSS
return `<div class="user-avatar placeholder ${rankClass}"><i class="fas fa-user"></i></div>`;
}
}

return `
<img src="${photoURL}" class="user-avatar ${rankClass}">`;
};

/**
 * Aggiorna UI con dati utente
 * @param {Object} userData - Dati utente
 * @param {Object} authUser - Dati utente da Firebase Auth
 * @param {Object} options - Opzioni di configurazione
 * @returns {Object} Dati formattati per UI
 */
/**
 * Ottiene stili ruolo centralizzati per UI
 * @param {string} role - Ruolo dell'utente (admin, assistant, user, Coach, Assistente, Challenge)
 * @returns {Object} Stili ruolo (color, borderColor, gradient)
 */
export const getRoleStyles = (role) => {
	const roleMapping = {
		'admin': 'admin', 'assistant': 'assistant', 'user': 'user',
		'Coach': 'admin', 'Assistente': 'assistant', 'Challenge': 'user', 'Challenger': 'user',
		'coach': 'admin', 'assistant': 'assistant', 'challenger': 'user', 'user': 'user'
	};
	const mappedRole = roleMapping[role] || 'user';
	const styles = {
		'admin': { color: '#b1933a', borderColor: '#b1933a', label: 'Coach', icon: 'fa-crown', class: 'rank-coach' },
		'assistant': { color: '#6B3E26', borderColor: '#6B3E26', label: 'Assistente', icon: 'fa-user-shield', class: 'rank-assistant' },
		'user': { color: '#7a7a7a', borderColor: '#7a7a7a', label: 'Challenger', icon: 'fa-medal', class: 'rank-challenger' }
	};

	return styles[mappedRole] || styles['user'];
};

/**
 * Ottiene classe rank globale unificata basata sul ruolo
 * @param {string} role - Ruolo dell'utente (Coach, Assistente, Challenge, admin, assistant, user)
 * @returns {string} Classe CSS globale (rank-coach, rank-assistant, rank-challenger)
 */
export const getRankClass = (role) => {
const roleMapping = {
'Coach': 'rank-coach',
'admin': 'rank-coach',
'coach': 'rank-coach',
'Assistente': 'rank-assistant',
'assistant': 'rank-assistant',
'Challenge': 'rank-challenger',
'Challenger': 'rank-challenger',
'user': 'rank-challenger'
};
return roleMapping[role] || 'rank-challenger';
};

export const getUserDataForUI = (userData, authUser, options = {}) => {
	const displayName = formatDisplayName(userData, authUser);
	const photoURL = getPhotoURL(userData, authUser);
	const initials = displayName.charAt(0).toUpperCase();
	const roleStyles = getRoleStyles(userData?.role);

	return {
		displayName,
		photoURL,
		initials,
		role: roleStyles.label,
		roleIcon: roleStyles.icon,
		roleClass: roleStyles.class,
		roleColor: roleStyles.color,
		roleBorderColor: roleStyles.borderColor,
		roleGradient: roleStyles.gradient,
		isAdmin: (roleStyles.class === 'role-coach')
	};
};

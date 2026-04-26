/* ############################################################ */
/* #                                                          # */
/* #           1. UTILITÀ DI SANITIZZAZIONE E VALIDAZIONE     # */
/* ############################################################ */
// --- FUNZIONE SANITIZZAZIONE HTML ---
export function sanitizeHTML(str) {
if (!str) return '';
return str
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&#039;')
.replace(/\//g, '&#x2F;');
}


// --- FUNZIONE VALIDAZIONE EMAIL ---
export function validateEmail(email) {
const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
return re.test(email);
}


// --- FUNZIONE VALIDAZIONE PASSWORD ---
export function validatePassword(password) {
return {
isValid: password.length >= 6,
hasNumber: /\d/.test(password),
hasLetter: /[a-zA-Z]/.test(password),
hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
};
}

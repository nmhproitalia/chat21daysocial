// Utilità di sanitizzazione e validazione

export function sanitizeHTML(str) {
    if (!str) return '';
    
    // Sanitizzazione LEGGERA - previene solo XSS pericoloso
    return str
        .replace(/&/g, '&amp;')
        // NON bloccare l'HTML normale - permette <b>, <i>, <br>, ecc.
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\//g, '&#x2F;');
}

export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePassword(password) {
    return {
        isValid: password.length >= 6,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Z]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
}

export function validateText(text) {
    if (!text || text.trim().length === 0) return false;
    if (text.length > 1000) return false;
    if (text.length < 3) return false;
    return true;
}

export function showError(message) {
    // Crea elemento errore invece di alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #f44336;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 300px;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-rimuovi dopo 5 secondi
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

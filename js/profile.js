// --- PROFILE.JS PULITO - SOLO IMPORT DA PROFILE-MANAGER ---

import { 
    setupProfiloActions, 
    handlePhotoUpload,
    calculateBMI,
    calculateAge,
    updateCalculations
} from './profile-manager.js';

// Esporta le funzioni per compatibilità con profile.html
export { 
    setupProfiloActions, 
    handlePhotoUpload,
    calculateBMI,
    calculateAge,
    updateCalculations
};

// --- INIT AUTOMATICO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Profile.js caricato - funzioni disponibili:', {
        setupProfiloActions: typeof setupProfiloActions,
        handlePhotoUpload: typeof handlePhotoUpload,
        calculateBMI: typeof calculateBMI,
        calculateAge: typeof calculateAge,
        updateCalculations: typeof updateCalculations
    });
});

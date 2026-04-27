/* ############################################################ */
/* #                                                          # */
/* #           1. DEFINIZIONE LIMITI DI SICUREZZA TANITA     # */
/* #                                                          # */
/* ############################################################ */
/**
 * Parametri di validazione basati sugli standard di sicurezza Tanita
 * per la valutazione della composizione corporea.
 */
export const TANITA_LIMITS = {
    height: { min: 100, max: 250, label: "Altezza (cm)" },
    age: { min: 18, max: 99, label: "Età" },
    weight: { min: 30, max: 250, label: "Peso (kg)" },
    bodyFat: { min: 3, max: 75, label: "Massa Grassa (%)" },
    hydration: { min: 15, max: 85, label: "Idratazione (%)" },
    visceralFat: { min: 1, max: 59, label: "Grasso Viscerale" },
    leanMass: { min: 10, max: 200, label: "Massa Magra (kg)" },
    boneMass: { min: 0.5, max: 10, label: "Massa Ossea (kg)" },
    metabolicAge: { min: 12, max: 90, label: "Età Metabolica" }
};



/* ############################################################ */
/* #                                                          # */
/* #           2. LOGICA DI VALIDAZIONE TECNICA              # */
/* #                                                          # */
/* ############################################################ */
/**
 * Valida un valore numerico rispetto ai limiti Tanita
 * @param {string} field - Nome del campo
 * @param {number} value - Valore da validare
 * @param {Object} context - Contesto aggiuntivo (es. peso per massa magra)
 * @returns {Object} { isValid: boolean, message: string }
 */
export function validateTanitaValue(field, value, context = {}) {
    const limits = TANITA_LIMITS[field];
    if (!limits) return { isValid: true };

    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
        return { isValid: false, message: `Inserire un valore numerico per ${limits.label}` };
    }

    if (numValue < limits.min || numValue > limits.max) {
        return { 
            isValid: false, 
            message: `${limits.label} fuori scala Tanita (${limits.min}-${limits.max})` 
        };
    }

    if (field === 'leanMass' && context.weight) {
        if (numValue >= context.weight) {
            return { 
                isValid: false, 
                message: `Massa Magra non può essere superiore al peso totale` 
            };
        }
    }

    return { isValid: true };
}



/* ############################################################ */
/* #                                                          # */
/* #           3. APPLICAZIONE AUTOMATICA AI FORM            # */
/* #                                                          # */
/* ############################################################ */
/**
 * Configura i vincoli HTML5 (min/max) sugli input basandosi sui limiti Tanita
 */
export function applyTanitaConstraints() {
    Object.keys(TANITA_LIMITS).forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.min = TANITA_LIMITS[field].min;
            input.max = TANITA_LIMITS[field].max;
            input.placeholder = `Range: ${input.min}-${input.max}`;
        }
    });
}

console.log("Tanita Security Validator caricato correttamente");

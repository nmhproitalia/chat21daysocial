// GENERATORE PIANI HERBALIFE - SISTEMA 21GIORNIFIT
// =================================================

// Mappatura obiettivi form → piani Herbalife
const GOAL_TO_PLAN = {
    'fat_loss': 'perdita_massa_grassa',
    'maintenance': 'mantenimento',
    'toning': 'definizione',
    'muscle_gain': 'aumento_massa'
};

// 4 Piani completi Herbalife
const HERBALIFE_PLANS = {
    perdita_massa_grassa: {
        name: 'Programma Perdita Massa Grassa (2-1-1)',
        logic: 'Ideale per chi vuole ridurre il grasso corporeo in modo sano e costante.<br>Sostituendo due pasti con frullati, si crea un deficit calorico controllato senza soffrire la fame.',
        breakfast: {
            title: 'COLAZIONE (Pilastro Colazione)',
            items: [
                'Aloe Concentrato alle Erbe: 3 tappini (15ml) a stomaco vuoto',
                'Infuso alle Erbe: 1 cucchiaino raso in acqua calda',
                'Frullato Formula 1 + Protein Drink Mix: 2 misurini F1 + 2 misurini PDM in acqua'
            ]
        },
        lunch: {
            title: 'PRANZO O CENA (Frullato Sostitutivo)',
            items: [
                'Scegli UNO dei due pasti principali per il frullato',
                'Frullato Formula 1 + Protein Drink Mix: 2 misurini F1 + 2 misurini PDM in acqua',
                'Infuso alle Erbe: 1 cucchiaino raso (opzionale)'
            ]
        },
        dinner: {
            title: 'PASTO LIBERO (1 al giorno)',
            items: [
                'Regola del piatto:',
                '1/2 Piatto: Verdure (grigliate, al vapore o fresche)',
                '1/4 Piatto: Proteine (150-200g: pollo, tacchino, pesce, uova, tofu)',
                '1/4 Piatto: Carboidrati (60-80g: riso integrale, quinoa, patata media)'
            ]
        },
        snacks: {
            title: 'SPUNTINI (1-2 al giorno)',
            items: [
                'Barretta alle Proteine (Cacao-Arachidi, Vaniglia-Mandorla, Agrumi)',
                'Yogurt greco 0% grassi con cannella',
                '20g mandorle (10-12) + 1 mela'
            ]
        },
        notes: [
            'I frullati si fanno esclusivamente con acqua',
            'Bevi almeno 8 bicchieri d\'acqua al giorno',
            'L\'Infuso alle Erbe può essere bevuto durante la giornata'
        ],
        products: [
            'Formula 1 (Vaniglia consigliato)',
            'Protein Drink Mix (PDM)',
            'Aloe Concentrato (Naturale o Mango)',
            'Infuso alle Erbe (Naturale, Limone, Pesca o Lampone)',
            'Barrette alle Proteine'
        ]
    },
    mantenimento: {
        name: 'Programma Mantenimento (1-2-1)',
        logic: 'Ideale per chi ha raggiunto il peso forma e vuole stabilizzarlo.<br>La colazione Herbalife garantisce i nutrienti necessari, evitando picchi glicemici, mentre i due pasti liberi permettono una vita sociale normale.',
        breakfast: {
            title: 'COLAZIONE (Pilastro Colazione)',
            items: [
                'Aloe Concentrato alle Erbe: 3 tappini (15ml) a stomaco vuoto',
                'Infuso alle Erbe: 1 cucchiaino raso in acqua calda',
                'Frullato Formula 1 + Protein Drink Mix: 2 misurini F1 + 2 misurini PDM in acqua'
            ]
        },
        lunch: {
            title: 'PRANZO (Pasto Libero)',
            items: [
                'Regola del piatto:',
                '1/2 Piatto: Verdure',
                '1/4 Piatto: Proteine (150-200g)',
                '1/4 Piatto: Carboidrati (60-80g)'
            ]
        },
        dinner: {
            title: 'CENA (Pasto Libero)',
            items: [
                'Regola del piatto:',
                '1/2 Piatto: Verdure',
                '1/4 Piatto: Proteine (150-200g)',
                '1/4 Piatto: Carboidrati (60-80g)'
            ]
        },
        snacks: {
            title: 'SPUNTINO (1 al giorno)',
            items: [
                'Barretta alle Proteine',
                'Yogurt greco 0% grassi con cannella',
                '20g mandorle + 1 mela'
            ]
        },
        notes: [
            'I frullati si fanno esclusivamente con acqua',
            'Bevi almeno 8 bicchieri d\'acqua al giorno',
            'I pasti liberi permettono flessibilità per eventi sociali'
        ],
        products: [
            'Formula 1',
            'Protein Drink Mix (PDM)',
            'Aloe Concentrato',
            'Infuso alle Erbe',
            'Barrette alle Proteine'
        ]
    },
    definizione: {
        name: 'Programma Definizione (Focus Massa Grassa)',
        logic: 'Ideale per chi vuole "asciugarsi", tonificare e rendere i muscoli più visibili.<br>Alto apporto proteico per proteggere il muscolo e drastica riduzione di zuccheri e grassi.',
        breakfast: {
            title: 'COLAZIONE (Pilastro Colazione)',
            items: [
                'Aloe Concentrato alle Erbe: 3 tappini (15ml) a stomaco vuoto',
                'Infuso alle Erbe: 1 cucchiaino raso in acqua calda',
                'Frullato Formula 1 + Protein Drink Mix: 2 misurini F1 + 2 misurini PDM in acqua'
            ]
        },
        lunch: {
            title: 'PRANZO (Pasto "Clean")',
            items: [
                'Proteine (150-200g): Pollo, Pesce (tonno, salmone, branzino)',
                'Verdure verdi (a volontà): Broccoli, spinaci, zucchine, asparagi',
                'Carboidrati: MINIMO o NESSUNO (solo carboidrati vegetali)'
            ]
        },
        dinner: {
            title: 'CENA (Opzione A o B)',
            items: [
                'Opzione A: Frullato Formula 1 + Protein Drink Mix + Infuso',
                'Opzione B: Pasto proteico senza carboidrati (Proteine + Verdure verdi)'
            ]
        },
        snacks: {
            title: 'SPUNTINI (1-2 al giorno)',
            items: [
                'Barretta alle Proteine',
                'Yogurt greco 0% grassi con cannella',
                '20g mandorle (massimo)'
            ]
        },
        notes: [
            'I frullati si fanno esclusivamente con acqua',
            'Bevi almeno 8 bicchieri d\'acqua al giorno',
            'Eliminare i carboidrati a cena: raddoppiare le verdure verdi',
            'Phyto Complete supporta il metabolismo e contrasta grasso addominale'
        ],
        products: [
            'Formula 1',
            'Protein Drink Mix (PDM) - FONDAMENTALE',
            'Aloe Concentrato',
            'Infuso alle Erbe',
            'Phyto Complete - FONDAMENTALE',
            'Barrette alle Proteine'
        ],
        integration: {
            name: 'Phyto Complete',
            description: 'Utilizzo di termogenici per favorire la combustione dei grassi',
            dosage: '1-2 compresse al giorno secondo le indicazioni'
        }
    },
    aumento_massa: {
        name: 'Programma Aumento Massa Magra (3+3)',
        logic: 'Ideale per persone sottopeso o sportivi.<br>Il frullato viene aggiunto come dessert per fornire surplus di calorie di alta qualità e proteine per la crescita muscolare.',
        breakfast: {
            title: 'COLAZIONE (Pasto Completo + Frullato)',
            items: [
                'Pasto completo: Carboidrati + Proteine + Verdure',
                'Dessert: Frullato Formula 1 + Protein Drink Mix in acqua',
                'Pilastro: Aloe + Infuso'
            ]
        },
        lunch: {
            title: 'PRANZO (Pasto Completo + Frullato)',
            items: [
                'Pasto completo: Carboidrati + Proteine + Verdure',
                'Dessert: Frullato Formula 1 + Protein Drink Mix in acqua'
            ]
        },
        dinner: {
            title: 'CENA (Pasto Completo + Frullato)',
            items: [
                'Pasto completo: Carboidrati + Proteine + Verdure',
                'Dessert: Frullato Formula 1 + Protein Drink Mix in acqua'
            ]
        },
        snacks: {
            title: 'SPUNTINI (1-2 al giorno)',
            items: [
                'Barretta alle Proteine',
                'Yogurt greco con frutta e miele',
                'Frullato extra Formula 1 + PDM (post-allenamento)'
            ]
        },
        notes: [
            'I frullati si fanno esclusivamente con acqua',
            'Bevi almeno 8 bicchieri d\'acqua al giorno',
            'Il frullato è un "dessert" aggiunto al pasto, non sostituisce il pasto',
            'Ideale per sportivi dopo l\'allenamento'
        ],
        products: [
            'Formula 1 - FONDAMENTALE',
            'Protein Drive Mix (PDM) - FONDAMENTALE',
            'Aloe Concentrato',
            'Infuso alle Erbe',
            'Barrette alle Proteine'
        ]
    }
};

/**
 * Ottiene il piano completo in base all'obiettivo del form
 * @param {string} goal - Valore del form (fat_loss, muscle_gain, toning, maintenance)
 * @returns {object|null} Piano completo o null se obiettivo non valido
 */
export function getPlanByObjective(goal) {
    if (!goal || !GOAL_TO_PLAN[goal]) {
        return null;
    }
    const planKey = GOAL_TO_PLAN[goal];
    return HERBALIFE_PLANS[planKey] || null;
}

/**
 * Ottieni tutti i piani disponibili
 * @returns {object} Tutti i piani Herbalife
 */
export function getAllPlans() {
    return HERBALIFE_PLANS;
}

/**
 * Ottieni la mappatura completa obiettivo → piano
 * @returns {object} Mappatura GOAL_TO_PLAN
 */
export function getGoalMapping() {
    return GOAL_TO_PLAN;
}

export function generatePlanHTML(plan) {
    let html = `
    <div class="plan-header">
    <h3 class="plan-title">${plan.name}</h3>
    <p class="plan-logic">${plan.logic}</p>
    </div>
    `;

    if (plan.breakfast) {
        html += `
        <div class="plan-section">
        <h4 class="plan-section-title">${plan.breakfast.title}</h4>
        <ul class="plan-items">
        ${plan.breakfast.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        </div>
        `;
    }

    if (plan.lunch) {
        html += `
        <div class="plan-section">
        <h4 class="plan-section-title">${plan.lunch.title}</h4>
        <ul class="plan-items">
        ${plan.lunch.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        </div>
        `;
    }

    if (plan.dinner) {
        html += `
        <div class="plan-section">
        <h4 class="plan-section-title">${plan.dinner.title}</h4>
        <ul class="plan-items">
        ${plan.dinner.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        </div>
        `;
    }

    if (plan.snacks) {
        html += `
        <div class="plan-section">
        <h4 class="plan-section-title">${plan.snacks.title}</h4>
        <ul class="plan-items">
        ${plan.snacks.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        </div>
        `;
    }

    if (plan.notes) {
        html += `
        <div class="plan-section">
        <h4 class="plan-section-title">NOTE</h4>
        <ul class="plan-items">
        ${plan.notes.map(note => `<li>${note}</li>`).join('')}
        </ul>
        </div>
        `;
    }

    if (plan.products) {
        html += `
        <div class="plan-section">
        <h4 class="plan-section-title">PRODOTTI</h4>
        <ul class="plan-items">
        ${plan.products.map(product => `<li>${product}</li>`).join('')}
        </ul>
        </div>
        `;
    }

    if (plan.integration) {
        html += `
        <div class="plan-section phyto-section">
        <h4 class="plan-section-title">INTEGRAZIONE CONSIGLIATA</h4>
        <div class="plan-module-card">
        <p class="plan-module-title-bold">${plan.integration.name}</p>
        <p class="plan-module-desc-small">${plan.integration.description}</p>
        <p class="plan-module-desc-small">${plan.integration.dosage}</p>
        </div>
        </div>
        `;
    }

    return html;
}

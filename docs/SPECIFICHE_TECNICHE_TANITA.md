# SPECIFICHE TECNICHE PAGINA TANITA - 21GIORNIFIT

## OVERVIEW
- **Pagina:** tanita.html
- **Versione:** 2.0
- **Data Completamento:** 28 Aprile 2026
- **URL:** https://giornifit-app.web.app/tanita.html
- **Autore:** Irina (Cascade AI)

## STRUTTURA HTML

### Container Principale
```html
<div id="app">
  <!-- Header -->
  <div id="unified-header"></div>
  
  <!-- Main Content -->
  <main class="page-wrapper">
    <!-- Sezioni BIA -->
  </main>
  
  <!-- Footer -->
  <div id="unified-footer"></div>
</div>
```

### Sezioni Principali
1. **Valutazione Benessere** (Test Benessere)
2. **Progresso Ricomposizione Corporea**
3. **Classificazione Fisica Tanita (Physique Rating)**
4. **Inserimento Dati BIA**
5. **Risultati BIA**

## FILE DI CONFIGURAZIONE

### HTML
- **File:** `/tanita.html`
- **Dependencies:**
  - `components/general/header/header.js` (v6.0)
  - `components/general/footer/footer-brand.js` (v5.0)
  - `components/tanita/tanita-controller.js` (v1.0)
  - `wellness/wellness-test-controller.js` (v1.0)

### CSS
- **File:** `/components/tanita/tanita.css`
- **File:** `/css/utilities.css` (suggerimenti wellness)
- **File:** `/css/cards.css` (card base)
- **File:** `/css/base-layout.css` (layout generale)

### JavaScript
- **File:** `/components/tanita/tanita-controller.js` (BIAInputController)
- **File:** `/wellness/wellness-test-controller.js` (WellnessTestController)
- **File:** `/wellness/wellness-test-questions.js` (WELLNESS_QUESTIONS)
- **File:** `/js/firebase.js` (Firebase config)

## FUNZIONALITÀ IMPLEMENTATE

### 1. Test Benessere (Wellness Test)
**File:** `/wellness/wellness-test-controller.js`

**Features:**
- 13 domande ufficiali
- Punteggio normalizzato scala 0-15
- Suggerimenti personalizzati per risposte NO
- Testo descrittivo sotto domanda 12
- Barra progresso con lineetta nera
- Salvataggio risultati in Firebase
- Funzione "Rifai Valutazione"

**Formula Punteggio:**
```javascript
const yesCount = Object.values(this.answers).filter(a => a === 'yes').length;
const normalizedScore = Math.min(15, Math.round((yesCount / 13) * 15));
```

**Soglie Punteggio:**
- Eccellente: 12-15 (#28a745)
- Buono: 10-11 (#17a2b8)
- Medio: 7-9 (#ffc107)
- Da migliorare: 0-6 (#dc3545)

### 2. Inserimento Dati BIA
**File:** `/components/tanita/tanita-controller.js`

**Campi:**
- weight (peso in kg)
- bodyFat (% grasso corporeo)
- hydration (% idratazione)
- visceralFat (grasso viscerale)
- leanMass (massa magra in kg)
- boneMass (massa ossea in kg)
- metabolicAge (età metabolica)
- gender (sesso: male/female)

**Validazioni HTML5:**
- Min/Max per ogni campo
- Required per tutti i campi
- Type="number" per input numerici

### 3. Calcolo Fabbisogni
**File:** `/components/tanita/tanita-controller.js` + `/components/profile/profile-manager.js`

**Formule:**
```javascript
// Acqua (genere-specifica)
if (gender === 'male') {
    water = (weight * 0.035).toFixed(1); // 35ml/kg
} else {
    water = (weight * 0.030).toFixed(1); // 30ml/kg
}

// Proteine (genere-specifica)
if (leanMass) {
    switch(goal) {
        case 'fat_loss':
            protein = gender === 'male' ? Math.round(leanMass * 2.0) : Math.round(leanMass * 1.8);
            break;
        case 'muscle_gain':
            protein = gender === 'male' ? Math.round(leanMass * 2.2) : Math.round(leanMass * 2.0);
            break;
        default:
            protein = gender === 'male' ? Math.round(leanMass * 1.8) : Math.round(leanMass * 1.6);
    }
}

// BMR (Mifflin-St Jeor)
if (gender === 'male') {
    bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
} else {
    bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161);
}
```

### 4. Progresso Ricomposizione Corporea
**Layout:** Grid 3 colonne x 3 righe

**Riga 1:** Dati Iniziali
- Peso Iniziale
- Massa Magra Iniziale
- Massa Grassa Iniziale

**Riga 2:** Dati Attuali
- Peso Attuale
- Massa Magra Attuale
- Massa Grassa Attuale

**Riga 3:** Delta
- Δ Peso
- Δ Massa Magra
- Δ Massa Grassa

**Scenari Ricomposizione:**
- Ricomposizione Perfetta (fat < 0, lean > 0)
- Dimagrimento Eccellente (weight <= -0.5, fat <= -0.5)
- Lean Bulk (weight >= 0.5, lean >= 0.5)
- Maintenance

### 5. Physique Rating (Classificazione Fisica)
**Formula:** Basata su SMI (Skeletal Muscle Index) e soglie grasso genere-specifiche

**Classificazioni:**
- Very Thin
- Thin
- Standard
- Solid
- Muscular
- Very Muscular

### 6. Sistema Pallini BIA
**Metriche con pallini colorati:**
- BMI
- Body Fat
- Hydration
- Visceral Fat
- Lean Mass
- Bone Mass
- Metabolic Age

**Colori:**
- Verde: Ottimo
- Giallo: Accettabile
- Arancione: Attenzione
- Rosso: Critico

## CSS KEY PROPERTIES

### Suggerimenti Wellness
```css
.wellness-tips-section {
    background: #fff;
    margin-top: 1rem;
    box-shadow: none;
}

.wellness-tips-section.card {
    box-shadow: none !important;
}

.wellness-tips-section .tip-item {
    padding: 1rem 0;
    border-bottom: 1px solid #e0e0e0;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
}

.wellness-tips-section .tip-item i {
    color: #f39c12;
    font-size: 1.5rem;
}
```

### Progresso Ricomposizione Corporea
```css
.recomposition-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto auto auto;
    gap: 1rem;
    margin: 1.5rem 0;
}
```

### Barra Wellness
```css
.wellness-score-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: #000000;
    transition: left 0.3s ease;
    pointer-events: none;
    z-index: 10;
}
```

## FIREBASE STRUCTURE

### Collection: users
**Document Fields:**
- `firstName`: string
- `lastName`: string
- `userEmail`: string
- `gender`: string ('male' | 'female')
- `height`: number
- `weight`: number
- `age`: number
- `initial_bia`: object (dati BIA iniziali)
- `latest_bia`: object (dati BIA più recenti)
- `wellnessScore`: number (0-15)
- `wellnessLastUpdate`: timestamp

### BIA Object Structure
```javascript
{
    weight: number,
    bodyFat: number,
    hydration: number,
    visceralFat: number,
    leanMass: number,
    boneMass: number,
    metabolicAge: number,
    gender: string,
    bmi: number,
    waterNeeds: string,
    proteinNeeds: string,
    bmr: number,
    timestamp: timestamp
}
```

## INTEGRATIONS

### Firebase
- **Auth:** Firebase Authentication
- **Firestore:** Firebase Firestore (users collection)
- **Storage:** Firebase Storage (non utilizzato in tanita.html)

### Moduli Importati
```javascript
import { auth, db } from "../../js/firebase.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { WELLNESS_QUESTIONS } from "../../wellness/wellness-test-questions.js";
```

## BUG FIXES IMPLEMENTATI

1. **Export ProfileWellnessHandler mancante** - Aggiunto export keyword
2. **Import paths corretti** - Corretti percorsi relativi per firebase.js e wellness-test-questions.js
3. **Shadow box rimosso** - Aggiunto box-shadow: none per suggerimenti
4. **Layout Progresso Ricomposizione** - Cambiato da flex a grid 3x3
5. **Lineetta nera barra wellness** - Aggiunto left: 0 a wellness-score-line
6. **Punteggio normalizzato** - Formula per scala 0-15 da 13 domande

## BRAND COLORS
- Garden Green: #266431 (Primary scuro)
- Grass: #42a046 (Primary vivace)
- White: #ffffff (Background/Testo)
- Succulent: #e5ffc5 (Accento/Highlight)
- Lake: #3b9187 (Secondario/Variante)
- Deep Grey: #333333 (Testi primari)
- Medium Grey: #666666 (Testi secondari)

## RESPONSIVE DESIGN
- Mobile-first approach
- Media queries per tablet e desktop
- Grid layout adattivo
- Touch-friendly buttons

## ACCESSIBILITY
- HTML5 semantic structure
- ARIA labels dove necessario
- Keyboard navigation support
- Screen reader friendly

## PERFORMANCE OPTIMIZATIONS
- Lazy loading immagini
- Debouncing per ResizeObserver
- CSS transitions invece di JavaScript animation dove possibile
- Minimized reflows

## DEPLOYMENT
- **Platform:** Firebase Hosting
- **Command:** `npx -y firebase-tools@latest deploy --only hosting`
- **URL:** https://giornifit-app.web.app
- **Versioning:** Query parameters (?v=X.X) per cache busting

## TESTING CHECKLIST
- [x] Test Benessere: 13 domande funzionanti
- [x] Suggerimenti appaiono per risposte NO
- [x] Punteggio calcolato correttamente (scala 0-15)
- [x] Inserimento Dati BIA funzionante
- [x] Calcolo Fabbisogni corretto (genere-specifico)
- [x] Progresso Ricomposizione layout corretto
- [x] Physique Rating funzionante
- [x] Sistema pallini BIA funzionante
- [x] Salvataggio Firebase funzionante
- [x] Responsive design funzionante

## FUTURE ENHANCEMENTS
- Grafici progresso BIA nel tempo
- Export dati in PDF
- Confronto tra utenti (se permesso)
- Notifiche per test benessere periodico
- Integrazione con wearables per dati BIA automatici

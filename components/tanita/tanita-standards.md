# Standard Tanita Ufficiali - Formule e Soglie

Fonte: Documentazione Tanita Ufficiale (https://support.tanita.eu/support/solutions/folders/60000433609)

## FORMULE STANDARD TANITA

### Calcolo Massa Magra (Fat-Free Mass - FFM)
```
FFM = Peso - (Peso × BF% / 100)
```
Dove:
- Peso = peso corporeo in kg
- BF% = percentuale di grasso corporeo

### Coefficiente Idrico
Tanita assume che la massa magra sia idratata al **73,2%**.
Questo è il valore standard per ricavare l'acqua corporea se non hai il dato BIA diretto.

### Soglie Muscolari (SMI - Skeletal Muscle Index)
Per definire la massa muscolare "Media":
- **Uomini**: 8,5 kg/m²
- **Donne**: 7,0 kg/m²

### Calcolo SMI per Physique Rating
```
SMI = Massa Muscolare (kg) / Altezza (m)²
```

## SOGLIE UFFICIALI TANITA PER PHYSIQUE RATING

### 1. Parametro Grasso (BF%) - Adulti (18-59 anni)

| Livello Grasso | Uomini (BF%) | Donne (BF%) |
|----------------|--------------|-------------|
| Basso (Low) | < 13% | < 23% |
| Medio (Standard) | 13% - 24.9% | 23% - 33.9% |
| Alto (High) | ≥ 25% | ≥ 34% |

### 2. Parametro Muscoli (SMI)

| Livello Muscoli | Uomini (SMI) | Donne (SMI) |
|-----------------|--------------|-------------|
| Basso (Low) | < 8.2 | < 6.3 |
| Medio (Standard) | 8.2 - 9.9 | 6.3 - 7.9 |
| Alto (High) | ≥ 10.0 | ≥ 8.0 |

### 3. Matrice Physique Rating (1-9)

| Livello Muscoli \ Livello Grasso | ALTO (High) | MEDIO (Standard) | BASSO (Low) |
|----------------------------------|-------------|------------------|-------------|
| ALTO (High) | 3 (Robusto) | 6 (Standard Muscoloso) | 9 (Molto Muscoloso) |
| MEDIO (Standard) | 2 (Obeso) | 5 (Standard) | 8 (Magro e Muscoloso) |
| BASSO (Low) | 1 (Falso Magro) | 4 (Poco Allenato) | 7 (Magro) |

## NOTE IMPLEMENTATIVE

Questi standard devono essere utilizzati per:
1. Calcolo corretto della Massa Magra
2. Stima dell'acqua corporea basata sul coefficiente idrico 73,2%
3. Definizione dei livelli muscolari secondo SMI Tanita
4. Calcolo del BMR secondo le tabelle Tanite per decadi di età
5. Calcolo del Physique Rating usando le soglie ufficiali Tanita

## CONSIGLIO TECNICO - INTEGRAZIONE BILANCIA PROFESSIONALE

Per integrazione diretta con bilance Tanita professionali:
- Cercare su GitHub o forum sviluppatori: "Tanita RS232 parser"
- I parser decodificano le stringhe ufficiali Tanita da connessione RS232
- Utile per leggere dati grezzi direttamente da bilance professionali

## SPECIFICHE TECNICHE RICOMPOSIZIONE CORPOREA

### 1. Calcolo Massa Grassa (FM) e Massa Magra (FFM)
La Tanita fornisce peso totale e percentuale di grasso (BF%). Per calcolare la ricomposizione:
- Massa Grassa in kg: Peso × BF% / 100
- Massa Magra (FFM): Peso - Massa Grassa (kg)

Esempio:
- Peso: 80kg
- Massa Grassa (BF%): 25%
- Massa Grassa in kg: 80 × 0,25 = 20kg
- Massa Magra (FFM): 80 - 20 = 60kg

### 2. Monitoraggio del "Delta" (Calcolo Ricomposizione)
Confrontare misurazioni a distanza di almeno 4 settimane:
```
Δ Massa Grassa (kg) < 0 e Δ Massa Magra (kg) > 0
```

**Tre scenari della ricomposizione:**

| Scenario | Peso Totale | Massa Grassa (kg) | Massa Muscolare (kg) | Esito |
|----------|-------------|-------------------|---------------------|-------|
| A | Invariato | Diminuisce | Aumenta | Ricomposizione perfetta |
| B | Diminuisce | Diminuisce molto | Aumenta o Stabile | Dimagrimento eccellente |
| C | Aumenta | Stabile o Diminuisce | Aumenta molto | "Lean Bulk" (Crescita pulita) |

### 3. Come leggere i dati Tanita senza farsi ingannare
- Ignora fluttuazioni dell'Acqua Totale (TBW): 1kg in più può essere ritenzione idrica o glicogeno
- Usa la Media Settimanale: Somma dati 7 giorni, dividi per 7. Confronta medie settimane
- Muscle Mass include acqua: Se disidratato, bilancia sottrarrà muscoli che non hai perso

### 4. Calcolo Pratico (Check-list Mensile)
1. Massa Grassa in kg: (Peso × BF%) / 100
2. Massa Magra: Peso - Massa Grassa (kg)
3. Confronto: Se Massa Grassa scesa e Massa Magra salita, ricomposizione matematica

**Trucco**: Monitora Grasso Viscerale (scala 1-12+). Se scende, dieta e allenamento funzionano.

## RIFERIMENTI

- Documentazione Tanita Ufficiale: https://support.tanita.eu/support/solutions/folders/60000433609
- Sito Tanita: https://tanita.eu/
- Understanding Measurements: https://tanita.eu/understanding-your-measurements
- Physique Rating: https://tanita.eu/understanding-your-measurements/physique-rating

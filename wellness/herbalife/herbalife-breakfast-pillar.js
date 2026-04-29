/* ############################################################ */
/* #                                                          # */
/* #           1. PILASTRO COLAZIONE HERBALIFE               # */
/* ############################################################ */
/**
 * Pilastro Colazione Herbalife - Protocollo Italia Certificato
 * Colazione Base sempre presente per ogni obiettivo
 * 
 * @author 21GIORNIFIT System
 * @version 2.0
 */


/* ############################################################ */
/* #                                                          # */
/* #           2. CONFIGURAZIONE PILASTRO COLAZIONE          # */
/* ############################################################ */
export const BREAKFAST_PILLAR = {
name: "Pilastro Colazione",
description: "Colazione Equilibrata - Sempre presente per ogni obiettivo",
components: [
{
id: "aloe",
name: "Aloe Concentrato alle Erbe",
dosage: "1 misurino (15ml)",
timing: "Mattino a stomaco vuoto",
order: 1,
benefits: ["Supporto digestione", "Azione detox naturale", "Benessere intestinale"],
icon: "fas fa-leaf"
},
{
id: "infuso",
name: "Infuso alle Erbe",
dosage: "1 cucchiaino raso",
timing: "Con la colazione",
order: 2,
benefits: ["Energia naturale", "Effetto termogenico", "Supporto metabolismo"],
icon: "fas fa-fire"
},
{
id: "shake",
name: "Formula 1 + PDM",
dosage: "2 misurini F1 + 2 misurini PDM",
timing: "Colazione",
order: 3,
benefits: ["Nutrizione completa", "Sazietà prolungata", "Apporto proteico ottimale"],
icon: "fas fa-utensils"
}
]
};

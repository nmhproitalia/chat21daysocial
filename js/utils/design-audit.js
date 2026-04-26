/* ############################################################ */
/* #                                                          # */
/* #           1. DESIGN SYSTEM AUDIT - RISULTATI            # */
/* #                                                          # */
/* ############################################################ */
/**
 * Design System Audit - Verifica Coerenza Visiva
 * Audit automatico pre-deploy per garantire coerenza con Design System
 * 
 * @author 21GIORNIFIT System
 * @version 2.0
 */


/* ############################################################ */
/* #                                                          # */
/* #           2. DEFINIZIONE CLASSE RISULTATI AUDIT         # */
/* #                                                          # */
/* ############################################################ */
export class DesignAuditResults {
constructor() {
this.issues = [];
this.warnings = [];
this.passed = [];
this.score = 0;
this.totalChecks = 0;
}


// --- FUNZIONE AGGIUNTA PROBLEMA ---
addIssue(severity, category, message, element = null) {
this.totalChecks++;
const issue = {
severity,
category,
message,
element,
timestamp: new Date().toISOString()
};
if (severity === 'error') this.issues.push(issue);
else if (severity === 'warning') this.warnings.push(issue);
}


// --- FUNZIONE AGGIUNTA SUPERAMENTO ---
addPassed(category, message) {
this.totalChecks++;
this.passed.push({
category,
message,
timestamp: new Date().toISOString()
});
}


// --- FUNZIONE CALCOLO SCORE ---
calculateScore() {
if (this.totalChecks === 0) return 100;
const penalty = (this.issues.length * 10) + (this.warnings.length * 2);
this.score = Math.max(0, 100 - penalty);
return this.score;
}
}

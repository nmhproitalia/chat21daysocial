/* ############################################################ */
/* #                                                          # */
/* #           AUTH CORE - IDENTITY SYSTEM FOUNDATION          # */
/* #                                                          # */
/* ############################################################ */

/**
 * Funzione centralizzata per ottenere metadati ruolo
 * @param {string} role - Ruolo dell'utente (Coach, Assistant, Challenger, admin, user, etc.)
 * @returns {Object} Oggetto con label, className e icon
 */
export const getRoleMetadata = (role) => {
const roleMapping = {
// Coach variants
'Coach': {
label: 'Coach',
className: 'rank-coach',
icon: 'fa-crown',
color: '#b1933a'
},
'coach': {
label: 'Coach',
className: 'rank-coach',
icon: 'fa-crown',
color: '#b1933a'
},
'admin': {
label: 'Coach',
className: 'rank-coach',
icon: 'fa-crown',
color: '#b1933a'
},

// Assistant variants
'Assistente': {
label: 'Assistente',
className: 'rank-assistant',
icon: 'fa-user-shield',
color: '#6B3E26'
},
'assistant': {
label: 'Assistente',
className: 'rank-assistant',
icon: 'fa-user-shield',
color: '#6B3E26'
},
'Assistant': {
label: 'Assistente',
className: 'rank-assistant',
icon: 'fa-user-shield',
color: '#6B3E26'
},
'Assist': {
label: 'Assistente',
className: 'rank-assistant',
icon: 'fa-user-shield',
color: '#6B3E26'
},

// Challenger variants
'Challenger': {
label: 'Challenger',
className: 'rank-challenger',
icon: 'fa-medal',
color: '#7a7a7a'
},
'challenger': {
label: 'Challenger',
className: 'rank-challenger',
icon: 'fa-medal',
color: '#7a7a7a'
},
'Challenge': {
label: 'Challenger',
className: 'rank-challenger',
icon: 'fa-medal',
color: '#7a7a7a'
},
'user': {
label: 'Challenger',
className: 'rank-challenger',
icon: 'fa-medal',
color: '#7a7a7a'
}
};

return roleMapping[role] || {
label: 'Challenger',
className: 'rank-challenger',
icon: 'fa-medal',
color: '#7a7a7a'
};
};

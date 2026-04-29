export function toggleAccordion(id) {
const content = document.getElementById('content-' + id);
const icon = document.getElementById('icon-' + id);
if (content && icon) {
if (content.classList.contains('expanded')) {
content.classList.remove('expanded');
icon.classList.remove('rotated');
} else {
content.classList.add('expanded');
icon.classList.add('rotated');
}
}
}

// Esporta come funzione globale per compatibilità con onclick inline
if (typeof window !== 'undefined') {
window.toggleAccordion = toggleAccordion;
}

/* ############################################################ */
/* #                                                          # */
/* #           1. UTILITÀ CACHE BUSTER                       # */
/* ############################################################ */
// --- FUNZIONE AGGIUNTA CACHE BUSTER ---
export function addCacheBuster() {
const timestamp = Date.now();

// --- AGGIORNA LINK CSS ---
document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
const href = link.href;
link.href = href.includes('?') ? href.split('?')[0] + '?v=' + timestamp : href + '?v=' + timestamp;
});

// --- AGGIORNA SCRIPT JS ---
document.querySelectorAll('script[src]').forEach(script => {
const src = script.src;
script.src = src.includes('?') ? src.split('?')[0] + '?v=' + timestamp : src + '?v=' + timestamp;
});

console.log('🚀 Cache buster applicato:', timestamp);
}

// Cache buster utility
export function addCacheBuster() {
    // Aggiungi timestamp a tutti gli script e CSS
    const timestamp = Date.now();
    
    // Aggiorna tutti i link CSS e JS con cache buster
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.href;
        if (href.includes('?')) {
            link.href = href.split('?')[0] + '?v=' + timestamp;
        } else {
            link.href = href + '?v=' + timestamp;
        }
    });
    
    // Aggiorna tutti gli script
    document.querySelectorAll('script[src]').forEach(script => {
        const src = script.src;
        if (src.includes('?')) {
            script.src = src.split('?')[0] + '?v=' + timestamp;
        } else {
            script.src = src + '?v=' + timestamp;
        }
    });
    
    console.log('🚀 Cache buster applicato:', timestamp);
}

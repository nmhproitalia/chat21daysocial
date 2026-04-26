/**
* COMPONENT: UNIFIED FOOTER
* Gestisce il Brand Footer fisso in basso
*/
export function initFooter() {
let footerContainer = document.getElementById('unified-footer');
if (!footerContainer) {
footerContainer = document.createElement('div');
footerContainer.id = 'unified-footer';
document.body.appendChild(footerContainer);
}
footerContainer.innerHTML = `
<footer class="page-footer-fixed">
<div class="footer-brand">
Progetto Benessere
</div>
</footer>
`;
adjustWrapperPaddingBottom(footerContainer);
}
function adjustWrapperPaddingBottom(container) {
const adjust = () => {
const block = container.querySelector('.page-footer-fixed');
const wrapper = document.querySelector('.page-wrapper');
if (block && wrapper) {
const height = block.getBoundingClientRect().height;
if (height > 0) wrapper.style.paddingBottom = `${height + 20}px`;
}
};
setTimeout(adjust, 100);
window.addEventListener('resize', adjust);
new MutationObserver(adjust).observe(container, { childList: true, subtree: true });
}

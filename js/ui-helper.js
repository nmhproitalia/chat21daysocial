export function initGlobalEyes() {
    const eyes = document.querySelectorAll('.toggle-eye');
    eyes.forEach(eye => {
        // Reset del listener per evitare accumuli
        const newEye = eye.cloneNode(true);
        eye.parentNode.replaceChild(newEye, eye);

        newEye.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = newEye.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                newEye.classList.toggle('fa-eye');
                newEye.classList.toggle('fa-eye-slash');
                newEye.classList.toggle('fa-regular');
                newEye.classList.toggle('fa-solid');
            }
        });
    });
}

export function setupPasswordValidation() {
    const passwordRegex = /^(?=(.*[A-Z]){2,})(?=(.*[0-9]){2,}).{8,}$/;
    const inputs = [
        { id: 'regPassword', help: 'registerStrengthText' },
        { id: 'newPassword', help: 'strengthText' }
    ];

    inputs.forEach(({ id, help: helpId }) => {
        const input = document.getElementById(id);
        const help = document.getElementById(helpId);
        if (input && help) {
            input.oninput = () => { // Usiamo oninput per sovrascrivere vecchi listener
                if (input.value.length === 0) {
                    help.style.color = "#666";
                    help.innerText = "Min. 8 car., 2 maiuscole, 2 numeri.";
                } else if (passwordRegex.test(input.value)) {
                    help.style.color = "#28a745";
                    help.innerText = "✅ Password sicura!";
                } else {
                    help.style.color = "#dc3545";
                    help.innerText = "❌ Min. 8 car., 2 maiuscole, 2 numeri.";
                }
            };
        }
    });
}

// RENDIAMOLE DISPONIBILI OVUNQUE
window.initUI = () => {
    initGlobalEyes();
    setupPasswordValidation();
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initGlobalEyes();
    setupPasswordValidation();
}

// Esporta comunque le funzioni per toggleAuth
window.initGlobalEyes = initGlobalEyes;
window.setupPasswordValidation = setupPasswordValidation;
import { auth, db } from "./firebase.js";
import { initAuth, handleRegister } from "./auth.js";
import { initPosts, cleanupPosts, createNewPost, uploadMedia, setupMediaUpload } from "./posts.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, deleteDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { initGlobalEyes, setupPasswordValidation } from "./ui-helper.js";
import { setupProfiloActions } from "./profile-manager.js";

// =========================
// STATE
// =========================
document.body.classList.add("app-ready");

// Set active navigation state
function setActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.page-menu .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        if (currentPath.includes('posts.html') && link.textContent.includes('Posts')) {
            link.classList.add('active');
        } else if (currentPath.includes('profile.html') && link.textContent.includes('Profilo')) {
            link.classList.add('active');
        } else if (currentPath.includes('admin.html') && link.textContent.includes('Dashboard')) {
            link.classList.add('active');
        }
    });
}

// Initialize active state
setActiveNavigation();

let selectedFile = null;

// =========================
// AUTH INIT
// =========================
initAuth((user, role) => {

    initGlobalEyes();
    setupPasswordValidation();

    if (user) {

        const isAuthPage =
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/");

        if (isAuthPage) {
            window.location.replace("posts.html");
            return;
        }

        const postsBox = document.getElementById("posts");
        if (postsBox) {
            initPosts(postsBox);
            setupMediaUpload();
        }

        if (window.location.pathname.includes("profile.html")) {
            setTimeout(() => {
                setupProfiloActions();
            }, 300);
        }

        const adminBtn = document.getElementById("adminBtn");
        if (adminBtn) {
            adminBtn.classList.toggle("hidden", role !== "coach");
        }

    } else {
        const isIndex =
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/");

        if (!isIndex) window.location.replace("index.html");
    }

}, () => cleanupPosts());

// =========================
// CLICK EVENTS
// =========================
document.addEventListener("click", async (e) => {

    // POST CREATE
    const postBtn = e.target.closest("#postBtn");
    if (postBtn) {
        const input = document.getElementById("postText");
        const fileInput = document.getElementById("media-input");

        if (!input) return;

        const text = input.value.trim();

        if (!text && !selectedFile) {
            alert("Scrivi qualcosa prima di pubblicare!");
            return;
        }

        postBtn.disabled = true;
        postBtn.classList.add("loading");

        try {
            let mediaUrls = [];

            if (selectedFile) {
                const url = await uploadMedia(selectedFile);
                mediaUrls.push(url);
            }

            const success = await createNewPost(text, mediaUrls);

            if (success) {
                input.value = "";
                selectedFile = null;
                document.getElementById("mediaPreview").innerHTML = "";
            }

        } catch (err) {
            console.error(err);
            alert("Errore nel caricamento del post.");
        } finally {
            postBtn.disabled = false;
            postBtn.classList.remove("loading");
        }
        return;
    }

    // POST INTERACTIONS
    const interactionBtn = e.target.closest('.interaction-btn, .fa-star, .edit-btn, .del-btn');
    if (interactionBtn && auth.currentUser) {
        try {
            // LIKE
            if (interactionBtn.classList.contains('interaction-btn') && interactionBtn.dataset.type === "like") {
                const lRef = doc(db, `${interactionBtn.dataset.p}/likes`, auth.currentUser.uid);
                const snap = await getDoc(lRef);
                snap.exists() ? await deleteDoc(lRef) : await setDoc(lRef, { t: serverTimestamp() });
            }
            
            // RATING
            if (interactionBtn.classList.contains('fa-star')) {
                const wrapper = interactionBtn.closest('.star-rating-icons');
                await setDoc(doc(db, `${wrapper.dataset.path}/ratings`, auth.currentUser.uid), { 
                    rating: parseInt(interactionBtn.dataset.v), 
                    t: serverTimestamp() 
                });
            }
            
            // DELETE
            if (interactionBtn.classList.contains('del-btn')) {
                if (confirm("Eliminare questo post?")) {
                    await deleteDoc(doc(db, interactionBtn.dataset.p));
                }
            }
            
            // EDIT
            if (interactionBtn.classList.contains('edit-btn')) {
                const newText = prompt("Modifica post:", interactionBtn.dataset.text);
                if (newText && newText.trim()) {
                    await updateDoc(doc(db, interactionBtn.dataset.p), { text: newText.trim() });
                }
            }
            
        } catch (err) { 
            console.error("Errore interazione:", err); 
            alert("Errore nell'operazione");
        }
        return;
    }

    // REPLY TOGGLE
    const repTrig = e.target.closest(".rep-trig");
    if (repTrig) {
        const id = repTrig.dataset.id;
        const box = document.getElementById(`rep-box-${id}`);
        if (box) box.classList.toggle("active");
        return;
    }

    // REGISTER PAGE RESET UI
    if (e.target.tagName === "A" && e.target.innerText.includes("Registrati")) {
        setTimeout(() => {
            initGlobalEyes();
            setupPasswordValidation();
        }, 50);
    }

    // REGISTER USER
    if (e.target.id === "registerBtn") {
        const elEmail = document.getElementById("regEmail");
        const elPass = document.getElementById("regPassword");
        const elNome = document.getElementById("regNome");
        const elTel = document.getElementById("regTelefono");

        if (elNome && !elNome.checkValidity()) return elNome.reportValidity();
        if (elEmail && !elEmail.checkValidity()) return elEmail.reportValidity();
        if (elTel && !elTel.checkValidity()) return elTel.reportValidity();
        if (elPass && !elPass.checkValidity()) return elPass.reportValidity();

        const email = elEmail?.value.trim();
        const pass = elPass?.value.trim();
        const nome = elNome?.value.trim();
        const cognome = document.getElementById("regCognome")?.value.trim();
        const telefono = elTel?.value.trim();

        try {
            e.target.disabled = true;
            e.target.classList.add("loading");
            await handleRegister(email, pass, { nome, cognome, telefono });

        } catch (err) {
            console.error(err);
            e.target.disabled = false;
            e.target.classList.remove("loading");
        }
    }

    // LOGOUT
    const logoutBtn = e.target.closest("#logoutBtn");
    if (logoutBtn) {
        await signOut(auth);
        window.location.replace("index.html");
    }
});

// FILE CHANGE
document.addEventListener("change", (e) => {
    if (e.target.id === "fileInput") {
        selectedFile = e.target.files[0];

        const preview = document.getElementById("mediaPreview");
        if (preview) {
            preview.classList.add("active");
            preview.textContent = selectedFile
                ? `File pronto: ${selectedFile.name}`
                : "";
        }
    }
});

// DOM READY
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        initGlobalEyes();
        setupPasswordValidation();
    }, 300);
});
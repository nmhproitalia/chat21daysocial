import {
    collection, addDoc, query, orderBy, onSnapshot, doc,
    serverTimestamp, setDoc, deleteDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, auth } from './firebase.js';

const storage = getStorage();
let postsUnsub = null;
let isProcessing = false;

// =========================
// EMOJI CONFIG & HELPERS
// =========================
const WELLNESS_EMOJIS = ["💪","🔥","✨","🚀","💯","🎯","🏆","🥇","🌟","⚡","🏋️‍♂️","🏋️‍♀️","🏃‍♂️","🏃‍♀️","🧘‍♂️","🧘‍♀️","🥗","🥑","🍎","🙌","👏","🤝","❤️","✅"];

function autoResize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

function insertEmoji(inputEl, emoji) {
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    inputEl.value = inputEl.value.substring(0, start) + emoji + inputEl.value.substring(end);
    inputEl.focus();
    inputEl.selectionStart = inputEl.selectionEnd = start + emoji.length;
    autoResize(inputEl);
}

function createEmojiPicker(triggerEl, inputEl) {
    const old = document.getElementById("active-emoji-picker");
    if (old) {
        const wasSame = old.parentElement === triggerEl.parentElement;
        old.remove();
        if (wasSame) return;
    }

    const picker = document.createElement("div");
    picker.id = "active-emoji-picker";
    picker.className = "emoji-picker";

    WELLNESS_EMOJIS.forEach(e => {
        const span = document.createElement("span");
        span.className = "emoji-item";
        span.innerText = e;
        span.onclick = (ev) => {
            ev.stopPropagation();
            insertEmoji(inputEl, e);
        };
        picker.appendChild(span);
    });

    triggerEl.parentElement.appendChild(picker);

    // Chiudi se clicchi fuori
    setTimeout(() => {
        const close = (e) => {
            if (!picker.contains(e.target) && e.target !== triggerEl) {
                picker.remove();
                document.removeEventListener("click", close);
            }
        };
        document.addEventListener("click", close);
    }, 0);
}

// =========================
// DATA HELPERS
// =========================
function formatTime(timestamp) {
    if (!timestamp) return "...";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return `${diff}s`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}gg`;
    return date.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit' });
}

async function getAuthorData(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const d = snap.data();
            return {
                name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || auth.currentUser.displayName || "Utente",
                photo: d.photoURL || auth.currentUser.photoURL || ""
            };
        }
    } catch (e) {}
    return { name: auth.currentUser.displayName || "Utente", photo: auth.currentUser.photoURL || "" };
}

function processMediaInText(text, id, isPost = false) {
    if (!text) return "";
    const mediaRegex = /\[MEDIA:(https?:\/\/[^\]]+)\]/g;
    let mediaHtml = "";
    let cleanText = text.replace(mediaRegex, (match, url) => {
        const isVideo = url.split('?')[0].toLowerCase().match(/\.(mp4|webm|mov|ogg)$/);
        mediaHtml += isVideo 
            ? `<video src="${url}" controls class="post-media"></video>` 
            : `<img src="${url}" class="post-media" loading="lazy">`;
        return "";
    });
    return `<div class="text-content" id="${isPost ? 'post-text-' + id : ''}">${cleanText.trim()}</div>${mediaHtml}`;
}

// =========================
// INTERACTION SYNC
// =========================
function syncInteractions(path, id) {
    onSnapshot(collection(db, `${path}/likes`), (s) => {
        const btn = document.getElementById(`l-btn-${id}`);
        if (btn) {
            const isLiked = auth.currentUser && s.docs.some(d => d.id === auth.currentUser.uid);
            btn.classList.toggle('active-like', isLiked);
            const count = document.getElementById(`l-c-${id}`);
            if (count) count.textContent = s.size;
        }
    });
}

function syncRating(path, id) {
    onSnapshot(collection(db, `${path}/ratings`), (s) => {
        const rs = s.docs.map(d => d.data().rating || 0);
        const avg = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
        document.querySelectorAll(`.star-${id}`).forEach(st => {
            const val = parseInt(st.dataset.v);
            st.className = val <= avg ? `fas fa-star star-${id}` : `far fa-star star-${id}`;
        });
        const rText = document.getElementById(`r-t-${id}`);
        if (rText) rText.textContent = `(${avg})`;
    });
}

// EXPORTS
// =========================
export function initPosts(box) {
    postsUnsub = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => {
        box.innerHTML = "";
        snap.forEach(d => {
            const p = d.data(); const id = d.id;
            const card = document.createElement("div");
            card.className = "card post";
            card.innerHTML = `
                <div class="post-header">
                    <div class="author-info">
                        <img src="${p.photoURL || 'https://i.pravatar.cc/40'}" class="avatar">
                        <div class="meta"><strong>${p.author}</strong><br><span class="time">${formatTime(p.createdAt)}</span></div>
                    </div>
                    ${auth.currentUser?.uid === p.userId ? `
                        <div class="node-actions">
                            <button class="edit-btn" data-id="${id}" data-text="${p.text.replace(/"/g, '&quot;')}" data-p="posts/${id}"><i class="fas fa-edit"></i></button>
                            <button class="del-btn" data-p="posts/${id}"><i class="fas fa-trash-can"></i></button>
                        </div>` : ''}
                </div>
                ${processMediaInText(p.text, id, true)}
                <div class="post-actions">
                    <div class="interaction-btn" id="l-btn-${id}" data-p="posts/${id}" data-type="like"><i class="far fa-heart"></i> <span id="l-c-${id}">0</span></div>
                    <div class="star-rating-icons" data-path="posts/${id}">
                        ${[1,2,3,4,5].map(v => `<i class="far fa-star star-${id}" data-v="${v}"></i>`).join('')}
                        <span id="r-t-${id}">0</span>
                    </div>
                </div>
            `;
            box.appendChild(card);
            
            // Initialize interactions for this post
            syncInteractions(`posts/${id}`, id);
            syncRating(`posts/${id}`, id);
        });
    });
}

export function cleanupPosts() {
    if (postsUnsub) postsUnsub();
}

// =========================
// MEDIA UPLOAD FUNCTIONALITY
// =========================
export function setupMediaUpload() {
    const btn = document.getElementById('fotovideoBtn');
    const input = document.getElementById('media-input');
    const preview = document.getElementById('mediaPreview');

    window.pendingMedia = [];

    if (btn && input) {
        btn.onclick = (e) => {
            e.preventDefault();
            input.click();
        };

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const icon = btn.querySelector('i');
            icon.className = "fas fa-spinner fa-spin"; 

            try {
                const fileRef = ref(storage, `post-media/${Date.now()}_${file.name}`);
                
                const snap = await uploadBytes(fileRef, file);
                const url = await getDownloadURL(snap.ref);
                
                window.pendingMedia.push(`[MEDIA:${url}]`);

                const isVideo = file.type.startsWith('video');
                const mediaElement = isVideo 
                    ? `<video src="${url}" class="preview-item" muted></video>` 
                    : `<img src="${url}" class="preview-item">`;
                
                preview.innerHTML += mediaElement;
                
                icon.className = "fas fa-check";
                btn.style.color = "#28a745";

            } catch (err) {
                console.error("Errore caricamento:", err);
                alert("Errore nel caricamento del file.");
                icon.className = "fas fa-image";
            }
        };
    }
}

export async function uploadMedia(file) {
    const fileRef = ref(storage, `post-media/${Date.now()}_${file.name}`);
    const snap = await uploadBytes(fileRef, file);
    return await getDownloadURL(snap.ref);
}

export async function createNewPost(text, mediaUrls = []) {
    if (!auth.currentUser) return false;
    const user = await getAuthorData(auth.currentUser.uid);
    let content = text.trim();
    if (mediaUrls.length) content += "\n" + mediaUrls.map(u => `[MEDIA:${u}]`).join("\n");
    await addDoc(collection(db, "posts"), {
        text: content,
        author: user.name,
        userId: auth.currentUser.uid,
        photoURL: user.photo,
        createdAt: serverTimestamp()
    });
    return true;
}
/* ############################################################ */
/* #                                                          # */
/* #           CORE POSTS ENGINE - IRINA FULL RESTORE         # */
/* #                                                          # */
/* ############################################################ */
import { db, auth, storage } from "./firebase.js";
import {
collection, query, orderBy, onSnapshot, doc, getDoc,
where, addDoc, serverTimestamp, updateDoc, deleteDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { generateAvatarFallback, loadUserData as loadUserDataFromManager, getUserDataForUI, renderUserHTML, checkPermission } from "../components/general/user-manager.js";
import { getRoleMetadata } from "./auth-core.js";

/**
 * Converti percorso Firebase Storage in URL pubblico
 * @param {string} photoURL - Percorso o URL dell'immagine
 * @param {string} fallbackName - Nome per fallback UI Avatars
 * @returns {Promise<string>} URL pubblico dell'immagine
 */
const convertToPublicURL = async (photoURL, fallbackName = 'U') => {
// Fallback immediato se photoURL è vuoto o nullo
if (!photoURL) {
return null;
}

// Se è già un URL pubblico, usalo direttamente
if (photoURL.startsWith('https://') || photoURL.startsWith('http://')) {
return photoURL;
}

// Se inizia con gs://, converti in URL pubblico
if (photoURL.startsWith('gs://')) {
try {
const { getDownloadURL, ref: storageRef } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');
return await getDownloadURL(storageRef(storage, photoURL));
} catch (e) {
console.error('Errore conversione percorso Storage:', e);
return null;
}
}

// Se è un percorso locale, converti in URL pubblico
try {
const { getDownloadURL, ref: storageRef } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');
const storagePath = photoURL.startsWith('/') ? photoURL.substring(1) : photoURL;
return await getDownloadURL(storageRef(storage, storagePath));
} catch (e) {
console.error('Errore conversione percorso Storage:', e);
return null;
}
};

const ADMIN_EMAIL = "cristian.mulino@gmail.com";
let currentUserData = null;
let currentUserRole = null;

// Carica dati utente corrente per permessi
const loadCurrentUser = async () => {
	if (auth.currentUser) {
		currentUserData = await loadUserDataFromManager(db, auth.currentUser.uid);
		const uiData = getUserDataForUI(currentUserData, auth.currentUser);
		currentUserRole = uiData.role;
	}
};

// Carica utente corrente all'inizializzazione
if (auth.currentUser) {
	loadCurrentUser();
}

// Funzione per svuotare feed (Solo Coach)
window.clearAllPosts = async () => {
if (currentUserRole !== 'Coach') {
alert('Solo il Coach può svuotare il feed');
return;
}

if (!confirm('Sei sicuro di voler eliminare TUTTI i post? Questa azione è irreversibile.')) {
return;
}

try {
const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
const querySnapshot = await getDocs(collection(db, "posts"));
const batch = [];
querySnapshot.forEach((doc) => {
batch.push(deleteDoc(doc.ref));
});
await Promise.all(batch);
alert('Feed svuotato con successo');
} catch (error) {
console.error('Errore svuotamento feed:', error);
alert('Errore durante lo svuotamento del feed');
}
};

auth.onAuthStateChanged((user) => {
	if (user) {
		loadCurrentUser();
	}
});
let postsUnsub = null;


/* ############################################################ */
/* #                                                          # */
/* #           1. UTILS & FORMATTING                          # */
/* #                                                          # */
/* ############################################################ */
function formatTime(ts) {
if (!ts) return "";
try {
const d = ts.toDate ? ts.toDate() : new Date(ts);
const now = new Date();
const isToday = d.toDateString() === now.toDateString();
const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
if (isToday) return `Oggi alle ${timeStr}`;
return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ` ${timeStr}`;
} catch (e) { return ""; }
}


/* ############################################################ */
/* #                                                          # */
/* #           HELPER FUNCTIONS FOR AUTHOR DATA              # */
/* #                                                          # */
/* ############################################################ */

// Normalizza ruolo usando matrice traduzione
const normalizeRole = (role) => {
const roleMap = {
'coach': 'Coach',
'Coach': 'Coach',
'admin': 'Coach',
'assistant': 'Assistente',
'Assistente': 'Assistente',
'challenger': 'Challenger',
'Challenge': 'Challenger',
'Challenger': 'Challenger',
'user': 'Challenger'
};
return roleMap[role] || role || 'Challenger';
};

// Recupera dati autore da users collection (FORZATO per evitare undefined)
const getAuthorData = async (postData) => {
try {
const userDoc = await getDoc(doc(db, "users", postData.userId));
if (userDoc.exists()) {
const userData = userDoc.data();
let fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.displayName || userData.name || userData.userName;
if (!fullName && userData.email) {
fullName = userData.email.split('@')[0];
}
if (!fullName) fullName = "Utente";

// Ottieni URL pubblico per l'immagine usando getDownloadURL
let photoURL = userData.photoURL;
if (!photoURL) {
photoURL = null;
} else if (photoURL.startsWith('http://') || photoURL.startsWith('https://')) {
// URL già pubblico, usalo direttamente
photoURL = photoURL;
} else if (photoURL.startsWith('gs://')) {
// URL Firebase Storage, converti in URL pubblico
try {
photoURL = await getDownloadURL(storageRef(storage, photoURL));
} catch (e) {
console.error('Errore getDownloadURL:', e);
photoURL = null;
}
} else {
// Percorso relativo o altro formato, prova a costruire riferimento Storage
try {
const storagePath = photoURL.startsWith('/') ? photoURL.substring(1) : photoURL;
photoURL = await getDownloadURL(storageRef(storage, storagePath));
} catch (e) {
console.error('Errore conversione percorso Storage:', e);
photoURL = null;
}
}

const normalizedRole = normalizeRole(userData.role || 'Challenger');

return {
...postData,
authorName: fullName,
firstName: userData.firstName || fullName.split(' ')[0] || "Utente",
lastName: userData.lastName || fullName.split(' ').slice(1).join(' ') || "",
authorPhoto: photoURL,
authorRole: normalizedRole,
role: normalizedRole
};
}
} catch (e) {
console.error('Errore recupero dati autore:', e);
}
// Fallback se tutto fallisce
const fallbackName = "Utente";
return {
...postData,
authorName: fallbackName,
firstName: fallbackName,
lastName: "",
authorPhoto: null,
authorRole: 'Challenger',
role: 'Challenger'
};
};

/* ############################################################ */
/* #                                                          # */
/* #           2. INITIALIZATION & MAIN FEED                  # */
/* #                                                          # */
/* ############################################################ */
export function initPosts(box) {
if (!box) box = document.getElementById('postsFeed');
if (!box) {
console.warn("Irina: postsFeed non trovato nel DOM, riprovo tra 100ms");
setTimeout(() => initPosts(), 100);
return;
}

// Mostra loader
const loader = document.getElementById('loading-overlay');
if (loader) loader.style.display = 'flex';

// Mostra controlli admin solo se Coach
const adminControls = document.getElementById('adminControls');
if (adminControls) {
adminControls.style.display = currentUserRole === 'Coach' ? 'block' : 'none';
}

if (postsUnsub) postsUnsub();
postsUnsub = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "asc")), async (snap) => {
box.innerHTML = "";
if (snap.empty) {
box.innerHTML = '<div style="text-align:center; padding:2rem; color:#8e8e93;">Nessun post.</div>';
if (loader) loader.style.display = 'none';
return;
}

// Processa tutti i post in parallelo
const postPromises = [];
snap.forEach(d => {
const p = d.data(); const id = d.id;

postPromises.push(getAuthorData(p).then(processedData => {
processedData.authorRole = normalizeRole(processedData.authorRole || processedData.role);
console.log('Rendering ID:', id, '| Autore Recuperato:', processedData.authorName, '| Ruolo:', processedData.authorRole);
return { processedData, id };
}));
});

// Attendi che tutti i dati siano pronti
const postsData = await Promise.all(postPromises);

// Renderizza i post
for (const { processedData, id } of postsData) {
const card = await renderPostCard(processedData, id);
box.appendChild(card);

const s = card.querySelector(`#comments-section-${id}`);
if (s) s.style.display = "none";

syncLikes(`posts/${id}`, `l-p-count-${id}`, `l-p-btn-${id}`);
syncRating(`posts/${id}`, id);
syncCommentCount(id);
}

// Nascondi loader, rimuovi classe loading dal body e mostra pagina
if (loader) loader.style.display = 'none';
document.body.classList.remove('loading');
document.body.style.opacity = '1';
window.scrollTo(0, document.body.scrollHeight);
}, (err) => { console.error("Firestore Error:", err); if (loader) loader.style.display = 'none'; document.body.classList.remove('loading'); document.body.style.opacity = '1'; });
}


/* ############################################################ */
/* #                                                          # */
/* #           3. RENDERING ENGINE                            # */
/* #                                                          # */
/* ############################################################ */
function renderMediaGrid(mediaUrls) {
if (!mediaUrls || mediaUrls.length === 0) return '';

const gridStyle = mediaUrls.length === 1 
? 'grid-template-columns: 1fr;' 
: mediaUrls.length === 2 
? 'grid-template-columns: repeat(2, 1fr);' 
: 'grid-template-columns: 1fr 1fr;';

const mediaItems = mediaUrls.map((url, index) => {
const isVideo = url.includes('.mp4') || url.includes('.mov');
const itemStyle = mediaUrls.length === 1 
? 'aspect-ratio: 16/9;' 
: 'aspect-ratio: 1/1;';
return isVideo 
? `<video src="${url}" controls style="width:100%; height:100%; object-fit:cover; ${itemStyle}"></video>`
: `<img src="${url}" style="width:100%; height:100%; object-fit:cover; ${itemStyle}">`;
}).join('');

return `<div class="post-media-grid" style="margin:0 -15px 15px -15px; max-height:500px; overflow:hidden; display:grid; gap:2px; ${gridStyle}">${mediaItems}</div>`;
}


function renderLinkPreview(url) {
try {
const urlObj = new URL(url);
const domain = urlObj.hostname.toUpperCase();
return `
<a href="${url}" target="_blank" style="display:block; text-decoration:none; margin:0 -15px 15px -15px; background:#f0f2f5; border-radius:8px; overflow:hidden;">
<div style="background:#e4e6eb; height:120px; display:flex; align-items:center; justify-content:center; color:#65676b; font-size:2rem;">
<i class="fas fa-link"></i>
</div>
<div style="padding:12px;">
<div style="font-weight:bold; color:#1a1a1a; font-size:0.95rem; margin-bottom:4px;">${domain}</div>
<div style="color:#65676b; font-size:0.85rem;">${url}</div>
</div>
</a>
`;
} catch (e) {
return '';
}
}


async function renderPostCard(p, id) {
// I dati sono già processati da getAuthorData con getDownloadURL e normalizeRole
const roleMetadata = getRoleMetadata(p.authorRole || p.role);
const authorName = `${p.firstName} ${p.lastName}`.trim() || p.authorName || "Utente";

const currentUser = {
	id: auth.currentUser?.uid,
	role: currentUserRole === 'Coach' ? 'admin' : currentUserRole === 'Assistente' ? 'assistant' : 'user'
};

const targetContent = {
author: {
id: p.userId,
role: p.authorRole || p.role
}
};

const canDelete = checkPermission(currentUser, targetContent);

let textClean = p.text || "";
const mediaMatches = textClean.match(/\[MEDIA:(.*?)\]/g) || [];
mediaMatches.forEach(m => textClean = textClean.replace(m, ''));

// Leggi media array dal documento Firestore (nuova logica)
const mediaUrls = p.media && Array.isArray(p.media) ? p.media : [];

// Smart Text: font-size 24px per testi brevi senza media
const isShortText = textClean.length < 80 && mediaUrls.length === 0;
const textStyle = isShortText ? 'font-size: 24px;' : 'font-size: 1rem;';

// Line-clamp per testi lunghi (>5 righe)
const lines = textClean.split('\n').length;
const isLongText = lines > 5;
const textClampStyle = isLongText ? 'display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden;' : 'white-space: pre-wrap;';

// Link Preview: estrai URL dal testo
const urlMatch = textClean.match(/(https?:\/\/[^\s]+)/g);
const linkPreview = urlMatch && urlMatch[0] ? renderLinkPreview(urlMatch[0]) : '';

// Tasto "Altro..." per testi lunghi
const moreButton = isLongText ? `<button onclick="this.previousElementSibling.style.display='block'; this.style.display='none';" style="background:none; border:none; color:#007aff; font-weight:600; cursor:pointer; padding:0; margin-bottom:15px;">Altro...</button>` : '';

const card = document.createElement("div");
card.className = "card post";

// Converti photoURL in URL pubblico prima di renderizzare
const publicPhotoURL = await convertToPublicURL(p.authorPhoto, authorName);
const avatarHtml = publicPhotoURL 
? `<img src="${publicPhotoURL}" class="user-avatar ${roleMetadata.className}">`
: `<div class="user-avatar placeholder ${roleMetadata.className}"><i class="fas fa-user"></i></div>`;

card.innerHTML = `
<div class="post-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
<div class="post-modal-user" style="display:flex; gap:12px; align-items:center;">
${avatarHtml}
<div style="display:flex; flex-direction:column;">
<span style="font-size:1.1rem; font-weight:600; color:#1a1a1a;">${authorName}</span>
<span style="font-size:0.75rem; font-weight:600; padding:0; border:none; background:none; color:${roleMetadata.className === 'rank-coach' ? '#b1933a' : roleMetadata.className === 'rank-assistant' ? '#6B3E26' : '#7a7a7a'};"><i class="fas ${roleMetadata.icon}"></i> ${roleMetadata.label}</span>
</div>
</div>
${canDelete ? `
<div class="node-actions">
<button class="edit-btn" onclick="window.editNode('posts/${id}', '${id}', '${textClean.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')"><i class="fas fa-edit"></i></button>
<button class="del-btn" onclick="window.deleteNode('posts/${id}')"><i class="fas fa-trash-can"></i></button>
</div>` : ''}
</div>
<div class="text-content" style="line-height: 1.4; color: #1a1a1a; margin-bottom:15px; ${textStyle} ${textClampStyle}">${textClean.trim()}</div>
${moreButton}
${renderMediaGrid(mediaUrls)}
${linkPreview}
${mediaMatches.length > 0 ? `<div class="post-media-grid" style="margin-bottom:15px; display:grid; gap:4px; border-radius:12px; overflow:hidden;">${mediaMatches.map(m => renderMedia(m)).join('')}</div>` : ''}
<div class="post-actions" style="padding-top:12px; border-top:1px solid rgba(0,0,0,0.06);">
<div class="interaction-group" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
<div style="display:flex; align-items:center; gap:18px;">
<div class="interaction-btn" id="l-p-btn-${id}" onclick="window.toggleLike('posts/${id}', '${id}')" style="cursor:pointer; display:flex; align-items:center; gap:5px; font-size:0.9rem; font-weight:700;">
<i class="fas fa-heart"></i> <span id="l-p-count-${id}">0</span>
</div>
<div class="star-rating-icons star-rating-icons-${id}" style="display:flex; align-items:center; gap:2px;">
${[1,2,3,4,5].map(v => `<i class="fas fa-star star-${id}" data-v="${v}" onclick="window.setRating('posts/${id}', ${v})" style="cursor:pointer; font-size:1rem;"></i>`).join('')}
<span id="r-t-${id}" style="font-size: 0.8rem; margin-left: 5px; font-weight:700; color:#333;">(0)</span>
</div>
<div class="comment-counter-badge" style="display:flex; align-items:center; gap:6px; font-size:0.9rem; color:#007aff; font-weight:700;">
<i class="fas fa-comment"></i> <span id="c-count-${id}">0</span>
</div>
</div>
<div class="comments-toggle" onclick="window.toggleComments('${id}')" style="cursor:pointer; color:#28a745; font-weight:800; font-size: 0.9rem; margin-left:auto;">Commenta</div>
</div>
</div>
        <div id="comments-section-${id}" class="comments-section" style="display:none;">
        <div id="comments-container-${id}" class="comments-container"></div>
        <div class="comment-input-bar">
            <button class="btn-icon" style="color:#8e8e93; font-size:1.3rem; background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; height:100%;"><i class="fas fa-paperclip"></i></button>
            <textarea id="main-comment-input-${id}" class="comment-textarea" placeholder="Scrivi un commento..." rows="1" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); window.sendMainComment('${id}');}" style="background:transparent; border:none; color:white; resize:none; outline:none; font-size:1rem; padding:18px 0; flex:1;"></textarea>
            <button class="emoji-btn" onclick="window.toggleContextEmojiPicker('${id}', 'main-comment-input-${id}')" style="color:#8e8e93; background:none; border:none; cursor:pointer; font-size:1.3rem; display:flex; align-items:center; justify-content:center; height:100%;"><i class="far fa-smile"></i></button>
            <button onclick="window.sendMainComment('${id}')" class="btn-icon-send" style="background:none; border:none; color:#dcc48e; font-size:1.4rem; cursor:pointer; display:flex; align-items:center; justify-content:center; height:100%;"><i class="fas fa-paper-plane"></i></button>
        </div>
        <div class="emoji-picker-context" id="emoji-picker-${id}" style="display:none;"></div>
    </div>
`;
return card;
}


function renderMedia(m) {
const url = m.replace('[MEDIA:', '').replace(']', '');
return url.includes('.mp4') || url.includes('.mov') 
? `<video src="${url}" controls class="post-media-item" style="width:100%; border-radius:8px;"></video>`
: `<img src="${url}" class="post-media-item" style="width:100%; border-radius:8px;">`;
}


function renderMediaFromUrl(url) {
return url.includes('.mp4') || url.includes('.mov') 
? `<video src="${url}" controls class="post-media-item" style="width:100%; border-radius:8px;"></video>`
: `<img src="${url}" class="post-media-item" style="width:100%; border-radius:8px;">`;
}


/* ############################################################ */
/* #                                                          # */
/* #           4. POSTING & SOCIAL ACTIONS                    # */
/* #                                                          # */
/* ############################################################ */
window.submitPostTelegram = async () => {
const input = document.getElementById('postContent');
const text = input?.value.trim();
if (!text || !auth.currentUser) return;
try {
const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
const userData = userDoc.exists() ? userDoc.data() : {};
const isAdmin = auth.currentUser.email === ADMIN_EMAIL;
await addDoc(collection(db, "posts"), {
text: text,
author: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || auth.currentUser.displayName || "Utente",
authorEmail: auth.currentUser.email,
userId: auth.currentUser.uid,
photoURL: userData.photoURL || auth.currentUser.photoURL || "",
role: isAdmin ? "Coach" : (userData.role || "Challenge"),
firstName: userData.firstName || '',
lastName: userData.lastName || '',
authorName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || auth.currentUser.displayName || "Utente",
authorPhoto: userData.photoURL || auth.currentUser.photoURL || "",
authorRole: isAdmin ? "Coach" : (userData.role || "Challenge"),
createdAt: serverTimestamp()
});
input.value = "";
input.style.height = 'auto';
} catch (e) { console.error("Errore invio post:", e); }
};


window.toggleLike = async (path, id) => {
if (!auth.currentUser) return;
const likeRef = doc(db, `${path}/likes`, auth.currentUser.uid);
const snap = await getDoc(likeRef);
if (snap.exists()) await deleteDoc(likeRef);
else await setDoc(likeRef, { userId: auth.currentUser.uid, createdAt: serverTimestamp() });
};


window.setRating = async (path, val) => {
if (!auth.currentUser) return;
await setDoc(doc(db, `${path}/ratings`, auth.currentUser.uid), {
rating: val,
userId: auth.currentUser.uid,
createdAt: serverTimestamp()
});
};


const EMOJIS = [
    '😊','😂','❤️','🔥','💪','🙌','🥗','🌿','✨','🎯','🏆','👏','👍','😎','🤩','🚀',
    '💧','🥤','🍎','🥑','🍌','🥦','🍗','🥚','🥣','🍴','👣','🏃','🏋️','🚴','🧘','😴'
];

window.toggleContextEmojiPicker = (id, targetId) => {
    const pickerId = `emoji-picker-${id}`;
    const picker = document.getElementById(pickerId);
    if (!picker) {
        console.error(`Irina: Picker NON trovato con ID ${pickerId}`);
        return;
    }
    
    // Rileva lo stato attuale (inline o computato dal CSS)
    const currentDisplay = picker.style.display;
    const computedDisplay = window.getComputedStyle(picker).display;
    const isHidden = currentDisplay === 'none' || (currentDisplay === '' && computedDisplay === 'none');
    
    console.log(`Irina: Toggle picker ${pickerId}, current: ${currentDisplay}, computed: ${computedDisplay}, isHidden: ${isHidden}`);
    
    if (isHidden) {
        picker.style.setProperty('display', 'grid', 'important');
        picker.innerHTML = EMOJIS.map(e => `<span style="cursor:pointer;font-size:1.5rem;" onclick="window.insertContextEmoji('${e}', '${targetId}', '${id}')">${e}</span>`).join('');
    } else {
        picker.style.setProperty('display', 'none', 'important');
    }
};

window.insertContextEmoji = (emoji, targetId, pickerId) => {
    const input = document.getElementById(targetId);
    if (input) {
        input.value += emoji;
        input.focus();
        // Trigger input event to resize textarea
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
    }
    // NOTA: La chiusura automatica del picker (p.style.display = 'none') è stata rimossa per permettere inserimenti multipli
};

window.toggleEmojiPicker = () => {
    const p = document.getElementById('emojiPicker');
    if (!p) return;
    if (p.style.display === 'none') {
        p.style.display = 'grid';
        p.innerHTML = EMOJIS.map(e => `<span style="cursor:pointer;font-size:1.5rem;" onclick="window.insertEmoji('${e}')">${e}</span>`).join('');
    } else {
        p.style.display = 'none';
    }
};


window.insertEmoji = (emoji) => {
const input = document.getElementById('postContent');
if (input) { input.value += emoji; input.focus(); }
};


/* ############################################################ */
/* #                                                          # */
/* #           5. COMMENTS & REPLIES ENGINE (RECURSIVE)       # */
/* #                                                          # */
/* ############################################################ */
window.toggleComments = (id) => {
const s = document.getElementById(`comments-section-${id}`);
if (s) {
const isH = s.style.display === "none";
s.style.display = isH ? "block" : "none";
if (isH) loadNodes(id, `posts/${id}/comments`, `comments-container-${id}`);
}
};


function loadNodes(parentId, collectionPath, containerId) {
const container = document.getElementById(containerId);
if (!container) return;

onSnapshot(query(collection(db, collectionPath), orderBy("createdAt", "asc")), async (snap) => {
container.innerHTML = "";
if (snap.empty) return;

// Processa tutti i nodi in parallelo
const nodePromises = [];
snap.forEach(d => {
const data = d.data(); const id = d.id;
const nodePath = `${collectionPath}/${id}`;
console.log('Rendering Comment ID:', id, '| Autore DB:', data.authorName || data.firstName, '| Ruolo DB:', data.authorRole || data.role);

nodePromises.push(getAuthorData(data).then(processedData => {
processedData.authorRole = normalizeRole(processedData.authorRole || processedData.role);
return { processedData, id, nodePath };
}));
});

// Attendi che tutti i dati siano pronti
const nodesData = await Promise.all(nodePromises);

// Renderizza i nodi
for (const { processedData, id, nodePath } of nodesData) {
const div = await renderNode(processedData, id, nodePath, parentId);
container.appendChild(div);
syncLikes(nodePath, `l-n-count-${id}`, `l-n-btn-${id}`);
syncRating(nodePath, id);
}
});
}


async function renderNode(n, id, path, parentId) {
// I dati sono già processati da getAuthorData con getDownloadURL e normalizeRole
const roleMetadata = getRoleMetadata(n.authorRole || n.role);
const authorName = `${n.firstName} ${n.lastName}`.trim() || n.authorName || "Utente";

const currentUser = {
	id: auth.currentUser?.uid,
	role: currentUserRole === 'Coach' ? 'admin' : currentUserRole === 'Assistente' ? 'assistant' : 'user'
};

const targetContent = {
	author: {
		id: n.userId,
		role: n.authorRole || n.role
	}
};

const canDelete = checkPermission(currentUser, targetContent);

// Logica Media per Commenti/Reply
let textClean = n.text || "";
const mediaMatches = textClean.match(/\[MEDIA:(.*?)\]/g) || [];
mediaMatches.forEach(m => textClean = textClean.replace(m, ''));

const div = document.createElement("div");
div.className = "comment-node";
div.style.cssText = "background: white; border:none; margin: 0 0 12px 0; padding:12px; border-radius:12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 100%; box-sizing: border-box;";

// Converti photoURL in URL pubblico prima di renderizzare
const photoURL = n.authorPhoto || n.photoURL || null;
const publicCommentPhotoURL = await convertToPublicURL(photoURL, authorName);
const commentAvatarHtml = publicCommentPhotoURL 
? `<img src="${publicCommentPhotoURL}" class="user-avatar ${roleMetadata.className}">`
: `<div class="user-avatar placeholder ${roleMetadata.className}"><i class="fas fa-user"></i></div>`;

div.innerHTML = `
<div class="comment-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
<div class="post-modal-user" style="display:flex; gap:12px; align-items:center;">
${commentAvatarHtml}
<div style="display:flex; flex-direction:column;">
<span style="font-size:1.1rem; font-weight:600; color:#1a1a1a;">${authorName}</span>
<span style="font-size:0.75rem; font-weight:600; padding:0; border:none; background:none; color:${roleMetadata.className === 'rank-coach' ? '#b1933a' : roleMetadata.className === 'rank-assistant' ? '#6B3E26' : '#7a7a7a'};"><i class="fas ${roleMetadata.icon}"></i> ${roleMetadata.label}</span>
</div>
</div>
${canDelete ? `
<div class="node-actions">
<button class="edit-btn" onclick="window.editNode('${path}', '${id}', '${textClean.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')"><i class="fas fa-edit"></i></button>
<button class="del-btn" onclick="window.deleteNode('${path}')"><i class="fas fa-trash-can"></i></button>
</div>` : ''}
</div>
<div class="comment-text" style="color:#333; margin: 8px 0 8px 42px; font-size:0.95rem; line-height:1.4;">${textClean.trim()}</div>
${mediaMatches.length > 0 ? `<div class="comment-media-grid" style="margin: 10px 0 10px 42px; display:grid; gap:4px; border-radius:8px; overflow:hidden;">${mediaMatches.map(m => renderMedia(m)).join('')}</div>` : ''}
<div class="node-social-actions" style="display:flex; align-items:center; gap:15px; margin-left:42px; margin-top:8px; padding-top:8px; border-top:1px solid #f5f5f5;">
<div class="interaction-btn" id="l-n-btn-${id}" onclick="window.toggleLike('${path}', '${id}')" style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:0.8rem; color:#666; font-weight:600;">
<i class="fas fa-heart"></i> <span id="l-n-count-${id}">0</span>
</div>
<div class="star-rating-icons star-rating-icons-${id}" style="display:flex; align-items:center; gap:2px;">
${[1,2,3,4,5].map(v => `<i class="fas fa-star star-${id}" data-v="${v}" onclick="window.setRating('${path}', ${v})" style="cursor:pointer; font-size:0.85rem; color:#ddd;"></i>`).join('')}
</div>
<div class="reply-toggle-btn" onclick="window.toggleRepliesVisibility('${id}', '${path}')" style="cursor:pointer; font-size:0.8rem; color:#007aff; display:flex; align-items:center; gap:4px; font-weight:700;">
<i class="fas fa-comments"></i> Rispondi
<i class="fas fa-chevron-down chevron-${id}" style="transition: transform 0.3s; font-size:0.75rem;"></i>
</div>
</div>
<div id="replies-section-${id}" class="replies-section" style="display:none; margin:12px 0 0 0; padding:0; width: 100%;">
<div id="replies-container-${id}" class="replies-container"></div>
<div class="comment-input-bar">
<button class="btn-icon" style="color:#8e8e93; font-size:1.3rem; background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; height:100%;"><i class="fas fa-paperclip"></i></button>
<textarea id="reply-input-${id}" class="comment-textarea" placeholder="Rispondi..." rows="1" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); window.sendReply('${id}', '${path}');}" style="background:transparent; border:none; color:white; resize:none; outline:none; font-size:1rem; padding:18px 0; flex:1;"></textarea>
<button class="emoji-btn" onclick="window.toggleContextEmojiPicker('reply-${id}', 'reply-input-${id}')" style="color:#8e8e93; background:none; border:none; cursor:pointer; font-size:1.3rem; display:flex; align-items:center; justify-content:center; height:100%;"><i class="far fa-smile"></i></button>
<button onclick="window.sendReply('${id}', '${path}')" class="btn-icon-send" style="background:none; border:none; color:#dcc48e; font-size:1.4rem; cursor:pointer; display:flex; align-items:center; justify-content:center; height:100%;"><i class="fas fa-paper-plane"></i></button>
</div>
<div class="emoji-picker-context" id="emoji-picker-reply-${id}" style="display:none;"></div>
</div>
`;
return div;
}


window.toggleRepliesVisibility = (id, path) => {
const s = document.getElementById(`replies-section-${id}`);
const ch = document.querySelector(`.chevron-${id}`);
if (s) {
const isH = s.style.display === "none";
s.style.display = isH ? "block" : "none";
if (ch) ch.style.transform = isH ? "rotate(180deg)" : "rotate(0deg)";
if (isH) loadNodes(id, `${path}/replies`, `replies-container-${id}`);
}
};


window.sendMainComment = async (postId) => {
const input = document.getElementById(`main-comment-input-${postId}`);
const text = input?.value.trim();
if (!text || !auth.currentUser) return;
try {
const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
const userData = userDoc.exists() ? userDoc.data() : {};
const isAdmin = auth.currentUser.email === ADMIN_EMAIL;
await addDoc(collection(db, `posts/${postId}/comments`), {
text: text,
author: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || auth.currentUser.displayName || "Utente",
authorEmail: auth.currentUser.email,
userId: auth.currentUser.uid,
photoURL: userData.photoURL || auth.currentUser.photoURL || "",
role: isAdmin ? "Coach" : (userData.role || "Challenge"),
firstName: userData.firstName || '',
lastName: userData.lastName || '',
authorName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || auth.currentUser.displayName || "Utente",
authorPhoto: userData.photoURL || auth.currentUser.photoURL || "",
authorRole: isAdmin ? "Coach" : (userData.role || "Challenge"),
createdAt: serverTimestamp()
});
input.value = "";
input.style.height = "auto";
} catch (e) { console.error(e); }
};


window.sendReply = async (parentId, parentPath) => {
const input = document.getElementById(`reply-input-${parentId}`);
const text = input?.value.trim();
if (!text || !auth.currentUser) return;
try {
const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
const userData = userDoc.exists() ? userDoc.data() : {};
const isAdmin = auth.currentUser.email === ADMIN_EMAIL;
await addDoc(collection(db, `${parentPath}/replies`), {
text: text,
author: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || auth.currentUser.displayName || "Utente",
authorEmail: auth.currentUser.email,
userId: auth.currentUser.uid,
photoURL: userData.photoURL || auth.currentUser.photoURL || "",
role: isAdmin ? "Coach" : (userData.role || "Challenge"),
firstName: userData.firstName || '',
lastName: userData.lastName || '',
authorName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || auth.currentUser.displayName || "Utente",
authorPhoto: userData.photoURL || auth.currentUser.photoURL || "",
authorRole: isAdmin ? "Coach" : (userData.role || "Challenge"),
createdAt: serverTimestamp()
});
input.value = "";
input.style.height = "auto";
} catch (e) { console.error(e); }
};


/* ############################################################ */
/* #                                                          # */
/* #           6. DATA SYNCHRONIZATION                        # */
/* #                                                          # */
/* ############################################################ */
function syncCommentCount(postId) {
    const countEl = document.getElementById(`c-count-${postId}`);
    if (!countEl) return;

    // Mappa globale per questo post per tenere traccia dei conteggi di ogni sotto-collezione
    const postCounters = {
        main: 0,
        replies: {}
    };

    function updateDisplay() {
        const totalReplies = Object.values(postCounters.replies).reduce((a, b) => a + b, 0);
        countEl.textContent = postCounters.main + totalReplies;
    }

    // 1. Ascolta i commenti principali
    onSnapshot(collection(db, `posts/${postId}/comments`), (snap) => {
        postCounters.main = snap.size;
        
        // 2. Per ogni commento, ascolta le sue reply ricorsivamente
        snap.forEach(cDoc => {
            const cid = cDoc.id;
            // Evitiamo di ri-attaccare listener se già presenti (semplificato per real-time)
            onSnapshot(collection(db, `posts/${postId}/comments/${cid}/replies`), (rSnap) => {
                postCounters.replies[cid] = rSnap.size;
                
                // NOTA: Per reply infinite (livelli > 2), Firestore richiederebbe 
                // una struttura flat o contatori incrementali sui documenti.
                // Questa logica copre perfettamente Post -> Commento -> Reply.
                updateDisplay();
            });
        });
        updateDisplay();
    });
}


function syncLikes(path, countId, btnId) {
onSnapshot(collection(db, `${path}/likes`), (s) => {
const count = document.getElementById(countId);
const btn = document.getElementById(btnId);
if (count) count.textContent = s.size;
if (btn) btn.classList.toggle('has-likes', s.size > 0);
});
}


function syncRating(path, id) {
onSnapshot(collection(db, `${path}/ratings`), (s) => {
const rs = s.docs.map(d => d.data().rating || 0);
const avg = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
const rText = document.getElementById(`r-t-${id}`);
if (rText) rText.textContent = `(${avg})`;
const stars = document.querySelectorAll(`.star-${id}`);
stars.forEach(st => {
const val = parseInt(st.dataset.v);
st.classList.toggle('active-star', val <= avg);
st.style.color = val <= avg ? "#ffcc00" : "#8e8e93";
});
const container = document.querySelector(`.star-rating-icons-${id}`);
if (container) container.classList.toggle('has-rank', avg > 0);
});
}


/* ############################################################ */
/* #                                                          # */
/* #           7. CLEANUP & EXPORTS                           # */
/* #                                                          # */
/* ############################################################ */
export function cleanupPosts() { if (postsUnsub) postsUnsub(); }
export function setupMediaUpload() { console.log("Irina: Media upload engine ready."); }


window.editNode = async (path, id, oldText) => {
const modal = document.createElement("div");
modal.className = "modal-overlay";
modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:2000; padding:20px; box-sizing:border-box;";
modal.innerHTML = `
<div class="card" style="width:100%; max-width:500px; background:white; border-radius:12px; padding:0; overflow:hidden; box-shadow:0 12px 28px rgba(0,0,0,0.2);">
<div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
<h3 style="margin:0; font-size:1.2rem; color:#1a1a1a;">Modifica post</h3>
<button onclick="this.closest('.modal-overlay').remove()" style="background:#f0f2f5; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1.1rem; color:#65676b; display:flex; align-items:center; justify-content:center;"><i class="fas fa-times"></i></button>
</div>
<div style="padding:15px;">
<textarea id="edit-textarea" style="width:100%; min-height:150px; border:none; outline:none; font-size:1.1rem; font-family:inherit; resize:none; padding:0;">${oldText}</textarea>
<div id="edit-media-preview" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;"></div>
</div>
<div style="padding:10px 15px; display:flex; align-items:center; gap:15px; border-top:1px solid #eee;">
<button class="btn-icon" id="edit-media-btn" style="color:#65676b; font-size:1.3rem; background:none; border:none; cursor:pointer;"><i class="fas fa-paperclip"></i></button>
<button class="btn-icon" id="edit-emoji-btn" style="color:#65676b; font-size:1.3rem; background:none; border:none; cursor:pointer;"><i class="far fa-smile"></i></button>
<input type="file" id="edit-file-input" accept="image/*,video/*" multiple style="display:none">
<div style="margin-left:auto; display:flex; gap:10px;">
<button class="btn-cancel" style="padding:8px 20px; border-radius:6px; border:none; background:#f0f2f5; color:#050505; font-weight:600; cursor:pointer;">Annulla</button>
<button class="btn-save" style="padding:8px 20px; border-radius:6px; border:none; background:var(--primary-color); color:white; font-weight:600; cursor:pointer;">Salva</button>
</div>
</div>
</div>`;
document.body.appendChild(modal);

const tx = modal.querySelector("#edit-textarea");
const mediaBtn = modal.querySelector("#edit-media-btn");
const fileInput = modal.querySelector("#edit-file-input");
const emojiBtn = modal.querySelector("#edit-emoji-btn");

tx.focus();
tx.setSelectionRange(tx.value.length, tx.value.length);

mediaBtn.onclick = () => fileInput.click();
emojiBtn.onclick = () => window.toggleEmojiPicker(); // Usa il picker globale

modal.querySelector(".btn-cancel").onclick = () => modal.remove();
modal.querySelector(".btn-save").onclick = async () => {
const n = tx.value.trim();
if (n && n !== oldText) await updateDoc(doc(db, path), { text: n });
modal.remove();
};
};


export const deleteNode = async (path) => {
// Verifica permessi prima di eliminare
const pathParts = path.split('/');
const collectionName = pathParts[0];
const docId = pathParts[1];

try {
const docSnap = await getDoc(doc(db, path));
if (!docSnap.exists()) {
console.error('Accesso Negato: Documento non trovato');
return;
}

const content = docSnap.data();
const currentRoleNormalized = (currentUserRole || '').toLowerCase();
const currentUser = {
id: auth.currentUser.uid,
role: currentRoleNormalized === 'coach' ? 'admin' : currentRoleNormalized === 'assistente' || currentRoleNormalized === 'assistant' ? 'assistant' : 'user'
};

const targetRoleNormalized = (content.role || '').toLowerCase();
const targetContent = {
author: {
id: content.userId,
role: targetRoleNormalized === 'coach' ? 'admin' : targetRoleNormalized === 'assistente' || targetRoleNormalized === 'assistant' ? 'assistant' : 'user'
}
};

if (!checkPermission(currentUser, targetContent)) {
alert('Accesso Negato: Permessi insufficienti');
return;
}

// Determina messaggio conferma basato sul ruolo
const isModerator = currentUser.role === 'admin' || currentUser.role === 'assistant';
const isOwnContent = currentUser.id === targetContent.author.id;
const confirmMessage = isModerator && !isOwnContent 
? "Sei sicuro di voler eliminare questo post come Moderatore/Admin?"
: "Sei sicuro di voler eliminare il TUO post?";

// Creazione Modale Conferma Eliminazione stile Facebook
const modal = document.createElement("div");
modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:2000; padding:20px; box-sizing:border-box;";

modal.innerHTML = `
<div class="card" style="width:100%; max-width:400px; background:white; border-radius:12px; padding:20px; box-shadow:0 12px 28px rgba(0,0,0,0.2); text-align:center;">
<div style="font-size:3rem; color:#ff3b30; margin-bottom:15px;"><i class="fas fa-circle-exclamation"></i></div>
<h3 style="margin:0 0 10px 0; font-size:1.3rem; color:#1a1a1a;">Sei sicuro?</h3>
<p style="color:#65676b; margin-bottom:25px; font-size:1rem;">${confirmMessage}</p>
<div style="display:flex; gap:12px; justify-content:center;">
<button class="btn-cancel" style="flex:1; padding:10px; border-radius:8px; border:none; background:#f0f2f5; color:#050505; font-weight:600; cursor:pointer;">Annulla</button>
<button class="btn-confirm" style="flex:1; padding:10px; border-radius:8px; border:none; background:#ff3b30; color:white; font-weight:600; cursor:pointer;">Elimina</button>
</div>
</div>
`;
modal.className = "modal-overlay";
document.body.appendChild(modal);

modal.querySelector(".btn-cancel").onclick = () => modal.remove();
modal.querySelector(".btn-confirm").onclick = async () => {
await deleteDoc(doc(db, path));
modal.remove();
};
} catch (error) {
console.error('Errore eliminazione:', error);
alert('Errore durante l\'eliminazione: ' + error.message);
}
};

// Esporta su window per compatibilità onclick
window.deleteNode = deleteNode;

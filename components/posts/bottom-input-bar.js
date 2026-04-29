/**
* COMPONENT: BOTTOM INPUT BAR
* Gestisce la barra di input fisso in basso per la bacheca
*/
// Import funzioni user-manager
import { loadUserData as loadUserDataFromManager, getUserDataForUI, renderUserHTML, renderUserAvatarOnly, formatDisplayName, getPhotoURL } from "../../components/general/user-manager.js";

// Funzioni globali per accesso da HTML
window.openPostModal = () => {
console.log('openPostModal chiamato');
const modal = document.getElementById('postModal');
console.log('modal trovato:', modal);
if (modal) {
modal.classList.add('active');
console.log('classe active aggiunta');
const contentDiv = document.getElementById('modalPostContent');
if (contentDiv) {
contentDiv.focus();
}
// Chiama loadUserData se initBottomInputBar è già stato eseguito
if (window.loadUserDataFromManager) {
window.loadUserData();
}
} else {
console.error('Modal postModal non trovato nel DOM');
}
};

window.closePostModal = () => {
const modal = document.getElementById('postModal');
if (modal) {
modal.classList.remove('active');
const contentDiv = document.getElementById('modalPostContent');
if (contentDiv) {
contentDiv.innerHTML = '';
}
// Chiudi emoji picker se aperto
const emojiPicker = document.getElementById('emojiPickerPopover');
if (emojiPicker) {
emojiPicker.classList.remove('active');
}
}
};

export function initBottomInputBar() {
const bottomInputBar = document.querySelector('.bottom-input-bar');
if (!bottomInputBar) return;

// Array file locali per gestione media
let mediaFiles = [];

// Salva posizione cursore per emoji picker
let savedRange = null;

// Aggiungi click handler a input-wrapper per aprire modal
const inputWrapper = document.querySelector('.input-wrapper');
if (inputWrapper) {
inputWrapper.addEventListener('click', () => {
console.log('input-wrapper cliccato');
window.openPostModal();
});
}

// Aggiorna savedRange quando l'utente clicca nel contentEditable
const contentDiv = document.getElementById('modalPostContent');
if (contentDiv) {
contentDiv.addEventListener('click', () => {
const selection = window.getSelection();
if (selection.rangeCount > 0) {
savedRange = selection.getRangeAt(0).cloneRange();
}
});
contentDiv.addEventListener('keyup', () => {
const selection = window.getSelection();
if (selection.rangeCount > 0) {
savedRange = selection.getRangeAt(0).cloneRange();
}
});
}

// Carica avatar da localStorage o Firebase Auth o fallback
const loadAvatar = () => {
const userAvatar = document.querySelector('.user-avatar');
if (!userAvatar) return;

const user = JSON.parse(localStorage.getItem('user')) || {};
const photoURL = user.photoURL || user.avatar || '';
console.log('User photo path:', photoURL);
console.log('User data:', user);

if (photoURL && photoURL !== '') {
userAvatar.innerHTML = `<img src="${photoURL}" class="profile-img-full">`;
userAvatar.classList.remove('avatar-placeholder');
userAvatar.onerror = () => {
userAvatar.innerHTML = '<i class="fas fa-user"></i>';
userAvatar.className = 'user-avatar avatar-placeholder';
};
} else {
// Usa Firebase Auth se disponibile
if (window.auth && window.auth.currentUser) {
const currentUser = window.auth.currentUser;
const authPhotoURL = currentUser.photoURL || '';

if (authPhotoURL && authPhotoURL !== '') {
userAvatar.innerHTML = `<img src="${authPhotoURL}" class="profile-img-full">`;
userAvatar.classList.remove('avatar-placeholder');
userAvatar.onerror = () => {
userAvatar.innerHTML = '<i class="fas fa-user"></i>';
userAvatar.className = 'user-avatar avatar-placeholder';
};
} else {
userAvatar.innerHTML = '<i class="fas fa-user"></i>';
userAvatar.className = 'user-avatar avatar-placeholder';
}
} else {
// Fallback icona FontAwesome
userAvatar.innerHTML = '<i class="fas fa-user"></i>';
userAvatar.className = 'user-avatar avatar-placeholder';
}
}
};

loadAvatar();

// Listener per auth state change
if (window.auth) {
window.auth.onAuthStateChanged((user) => {
console.log('Auth state changed:', user);
loadAvatar();
loadUserData();
});
}

// Carica avatar e nome utente dal database Firebase
const loadUserData = async () => {
console.log('loadUserData chiamato');
const auth = window.auth;
const db = window.db;
console.log('auth:', auth);
console.log('db:', db);
if (!auth || !db) {
console.log('Auth o db non disponibili');
return;
}

console.log('auth.currentUser:', auth.currentUser);
if (auth.currentUser) {
const userData = await loadUserDataFromManager(db, auth.currentUser.uid);
console.log('User data:', userData);

const uiData = getUserDataForUI(userData, auth.currentUser);
console.log('UI data:', uiData);

// Aggiorna modal con HTML centralizzato
const modalUserContainer = document.querySelector('.post-modal-user');
console.log('modalUserContainer trovato:', modalUserContainer);
if (modalUserContainer) {
const userHTML = await renderUserHTML(userData, auth.currentUser);
console.log('HTML generato:', userHTML);
modalUserContainer.innerHTML = userHTML;
console.log('Modal popolato con HTML');
} else {
console.log('modalUserContainer non trovato nel DOM');
}

// Aggiorna input-container-main con solo avatar
const inputContainerUser = document.getElementById('inputContainerUser');
console.log('inputContainerUser trovato:', inputContainerUser);
if (inputContainerUser) {
const avatarHTML = await renderUserAvatarOnly(userData, auth.currentUser);
console.log('Avatar HTML generato:', avatarHTML);
inputContainerUser.innerHTML = avatarHTML;
console.log('Input container popolato con avatar');
} else {
console.log('inputContainerUser non trovato nel DOM');
}
}
};

// Esponi loadUserData globalmente per openPostModal
window.loadUserData = loadUserData;

// Inizializza emoji picker con 50 emoji comuni

// Apri emoji picker nel modal
window.toggleEmojiPicker = () => {
const emojiPicker = document.getElementById('emojiPickerPopover');
const emojiBtn = document.querySelector('.post-modal-emoji-btn');
if (emojiPicker && emojiBtn) {
emojiPicker.classList.toggle('active');
if (emojiPicker.classList.contains('active')) {
// Calcola posizione dinamicamente basata sul pulsante emoji
const btnRect = emojiBtn.getBoundingClientRect();
emojiPicker.style.position = 'fixed';
emojiPicker.style.top = (btnRect.top - 250) + 'px';
emojiPicker.style.right = (window.innerWidth - btnRect.right) + 'px';
initEmojiPicker();
} else {
savedRange = null;
}
}
};

// Inizializza emoji picker con 50 emoji comuni
const initEmojiPicker = () => {
const emojiPicker = document.getElementById('emojiPickerPopover');
if (!emojiPicker) return;

// Rimuovi check per permettere reinizializzazione
emojiPicker.innerHTML = '';

const commonEmojis = [
'😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
'😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
'😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
'🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
'😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧',
'❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
'❣️','💕','💞','💓','💗','💖','💘','💝','💟','❤️‍🔥'
];

const emojiGrid = document.createElement('div');
emojiGrid.className = 'emoji-grid';

commonEmojis.forEach(emoji => {
const emojiItem = document.createElement('div');
emojiItem.className = 'emoji-grid-item';
emojiItem.textContent = emoji;
emojiItem.onmouseover = () => emojiItem.style.background = '#f0f0f0';
emojiItem.onmouseout = () => emojiItem.style.background = 'transparent';
emojiItem.onclick = (e) => {
e.preventDefault();
e.stopPropagation();
insertEmojiAtCursor(emoji);
emojiPicker.classList.remove('active');
};
emojiGrid.appendChild(emojiItem);
});

emojiPicker.appendChild(emojiGrid);
};

// Inserisci emoji alla posizione del cursore
const insertEmojiAtCursor = (emoji) => {
const contentDiv = document.getElementById('modalPostContent');
if (!contentDiv) return;

// Ripristina il Range salvato se esiste
if (savedRange) {
const selection = window.getSelection();
selection.removeAllRanges();
selection.addRange(savedRange);
}

contentDiv.focus();

// Usa execCommand insertText per inserire come carattere Unicode
document.execCommand('insertText', false, emoji);

// Aggiorna savedRange dopo l'inserimento
setTimeout(() => {
const selection = window.getSelection();
if (selection.rangeCount > 0) {
savedRange = selection.getRangeAt(0).cloneRange();
}
}, 0);
};

// Chiudi picker click fuori
document.addEventListener('click', (e) => {
const emojiPicker = document.getElementById('emojiPickerPopover');
const emojiBtn = document.querySelector('.post-modal-emoji-btn');
if (emojiPicker && emojiBtn) {
if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
emojiPicker.classList.remove('active');
}
}
});

// Aggiungi file media - griglia intelligente sotto textarea con caricamento Firebase Storage
const addMediaFiles = async (files) => {
if (mediaFiles.length + files.length > 4) {
const errorMessage = document.getElementById('modalErrorMessage');
if (errorMessage) {
errorMessage.textContent = 'Puoi caricare massimo 4 media tra foto e video';
errorMessage.style.display = 'block';
setTimeout(() => {
errorMessage.style.display = 'none';
}, 3000);
}
return;
}

const auth = window.auth;
const storage = window.storage;

if (!auth || !auth.currentUser) {
alert('Devi essere autenticato per caricare file');
return;
}

if (!storage) {
alert('Storage non disponibile, ricarica la pagina');
return;
}

const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');

const submitBtn = document.querySelector('.post-modal-submit-btn');
if (submitBtn) {
submitBtn.disabled = true;
submitBtn.textContent = 'Caricamento...';
}

for (const file of Array.from(files)) {
if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
try {
console.log('Caricamento file:', file.name);
const fileName = `${Date.now()}_${file.name}`;
const storageRef = ref(storage, `posts/${auth.currentUser.uid}/${fileName}`);
console.log('Storage ref creato:', storageRef);
await uploadBytes(storageRef, file);
console.log('Upload completato per:', file.name);
const url = await getDownloadURL(storageRef);
console.log('URL ottenuto:', url);
mediaFiles.push({
file: file,
url: url,
type: file.type
});
console.log('MediaFiles aggiornato:', mediaFiles.length);
} catch (error) {
console.error('Errore caricamento file:', error);
alert('Errore durante il caricamento del file: ' + error.message);
}
}
}

if (submitBtn) {
submitBtn.disabled = false;
submitBtn.textContent = 'Pubblica';
}

console.log('MediaFiles finale:', mediaFiles);
updateMediaGrid();
};

// Aggiorna griglia media
const updateMediaGrid = () => {
const previewContainer = document.getElementById('modalMediaPreview');
if (!previewContainer) return;

previewContainer.innerHTML = '';
previewContainer.style.display = 'grid';
previewContainer.style.gap = '2px';
previewContainer.style.marginTop = '15px';

if (mediaFiles.length === 0) {
previewContainer.style.display = 'none';
return;
}

// Aggiungi data-count per griglia dinamica
previewContainer.setAttribute('data-count', mediaFiles.length);
previewContainer.style.gridTemplateColumns = '';

mediaFiles.forEach((mediaObj, index) => {
const mediaItem = document.createElement('div');
mediaItem.className = 'media-preview-wrapper';

const img = document.createElement(mediaObj.type.startsWith('image/') ? 'img' : 'video');
img.src = mediaObj.url;
img.className = 'media-preview-item';

if (mediaObj.type.startsWith('video/')) {
img.controls = true;
}

// Pulsante X per rimozione
const removeBtn = document.createElement('button');
removeBtn.textContent = '×';
removeBtn.className = 'media-preview-remove-btn';
removeBtn.onclick = () => removeMediaFile(index);

mediaItem.appendChild(img);
mediaItem.appendChild(removeBtn);
previewContainer.appendChild(mediaItem);
});
};

// Rimuovi file media
const removeMediaFile = (index) => {
URL.revokeObjectURL(mediaFiles[index].url);
mediaFiles.splice(index, 1);
updateMediaGrid();
};

// Gestione upload media nel modal footer
const modalMediaInput = document.getElementById('modalMediaInput');
if (modalMediaInput) {
modalMediaInput.addEventListener('change', (e) => {
addMediaFiles(e.target.files);
});
}

// Gestione drag-and-drop
const modalBody = document.querySelector('.post-modal-body');
if (modalBody) {
modalBody.addEventListener('dragover', (e) => {
e.preventDefault();
e.stopPropagation();
modalBody.style.border = '2px dashed #e0e0e0';
});

modalBody.addEventListener('dragleave', (e) => {
e.preventDefault();
e.stopPropagation();
modalBody.style.border = 'none';
});

modalBody.addEventListener('drop', (e) => {
e.preventDefault();
e.stopPropagation();
modalBody.style.border = 'none';
addMediaFiles(e.dataTransfer.files);
});
}

// Invia post
window.submitPost = async () => {
const contentDiv = document.getElementById('modalPostContent');
const text = contentDiv?.innerText?.trim() || '';
if (!text && mediaFiles.length === 0) return;

try {
const auth = window.auth;
const db = window.db;

if (!auth || !auth.currentUser) {
alert('Devi essere autenticato per pubblicare un post');
return;
}

if (!db) {
alert('Database non disponibile, ricarica la pagina');
return;
}

const { collection, doc, getDoc, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');

const userData = await loadUserDataFromManager(db, auth.currentUser.uid);
const uiData = getUserDataForUI(userData, auth.currentUser);
const isAdmin = uiData.isAdmin;
const displayName = uiData.displayName;
const photoURL = uiData.photoURL;

const normalizedRole = isAdmin ? 'admin' : (userData.role || 'challenger').toLowerCase();
const authorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || displayName || auth.currentUser.email?.split('@')[0] || "Utente";

const postData = {
text: text,
authorId: auth.currentUser.uid,
authorName: authorName,
authorRole: normalizedRole,
authorPhoto: photoURL,
authorEmail: auth.currentUser.email,
userId: auth.currentUser.uid,
photoURL: photoURL,
role: isAdmin ? "Coach" : (userData.role || "Challenger"),
createdAt: serverTimestamp()
};

if (mediaFiles.length > 0) {
postData.media = mediaFiles.map(m => m.url);
console.log('Media URLs da inviare:', mediaFiles.map(m => m.url));
console.log('postData prima invio:', postData);
}

await addDoc(collection(db, "posts"), postData);

console.log('Post inviato con successo:', postData);
console.log('Post data media field:', postData.media);

// Chiudi modal e reset
window.closePostModal();
contentDiv.innerHTML = '';
mediaFiles.forEach(mediaObj => URL.revokeObjectURL(mediaObj.url));
mediaFiles = [];
updateMediaGrid();
} catch (e) {
console.error("Errore invio post:", e);
alert('Errore durante l\'invio del post: ' + e.message);
}
};

// Gestione upload media nella barra
const mediaInput = document.getElementById('media-input');
const mediaPreview = document.getElementById('mediaPreviewInline');

if (mediaInput && mediaPreview) {
mediaInput.addEventListener('change', (e) => {
const files = e.target.files;
if (files.length > 0) {
mediaPreview.innerHTML = '';
Array.from(files).forEach(file => {
const reader = new FileReader();
reader.onload = (event) => {
const img = document.createElement('img');
img.src = event.target.result;
img.style.width = '100px';
img.style.height = '100px';
img.style.objectFit = 'cover';
img.style.borderRadius = '8px';
img.style.margin = '5px';
mediaPreview.appendChild(img);
};
reader.readAsDataURL(file);
});
}
});
}

// Chiudi funzione initBottomInputBar
}

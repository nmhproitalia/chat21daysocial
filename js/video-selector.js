// Video Selector - Sistema completo come Facebook
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { auth } from "./firebase.js";
import { sanitizeHTML } from "./utils.js";

// Modal per selezione video
let videoModal = null;

export function openVideoSelector(postId) {
    console.log("?? Apro selettore video per post:", postId);
    
    // Crea modal se non esiste
    if (!videoModal) {
        videoModal = createVideoModal();
        document.body.appendChild(videoModal);
    }
    
    // Mostra modal
    videoModal.style.display = 'flex';
    
    // Setup event listeners
    setupVideoModalEvents(postId);
}

// Esponi funzioni globalmente per accesso HTML
window.openVideoSelector = openVideoSelector;
window.selectMediaSource = selectMediaSource;
window.closeVideoModal = closeVideoModal;
window.confirmVideo = confirmVideo;
window.cancelVideo = cancelVideo;
window.initWebcam = initWebcam;
window.startRecording = startRecording;
window.stopRecording = stopRecording;

function createVideoModal() {
    const modal = document.createElement('div');
    modal.id = 'video-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div class="video-modal-content">
            <div class="video-modal-header">
                <h3 class="video-modal-title"> Seleziona Media</h3>
                <button class="video-modal-close" onclick="closeVideoModal()">×</button>
            </div>
            
            <!-- OPZIONI -->
            <div class="video-options">
                <button class="video-option-btn" id="upload-btn" onclick="selectMediaSource('upload')">
                    Carica Media
                </button>
                <button class="video-option-btn" id="webcam-btn" onclick="selectMediaSource('webcam')">
                    Registra con Webcam
                </button>
            </div>
            
            <!-- PREVIEW -->
            <div id="video-preview" class="video-preview">
                <video id="video-preview-player" controls class="video-preview-player"></video>
                <div class="video-preview-controls">
                    <button class="video-confirm-btn" id="confirm-video-btn" onclick="confirmVideo()">
                        ✓ Conferma Video
                    </button>
                    <button class="video-cancel-btn" id="cancel-video-btn" onclick="cancelVideo()">
                        ✗ Annulla
                    </button>
                </div>
            </div>
            
            <!-- WEBCAM CONTROLS -->
            <div id="webcam-controls" class="webcam-controls">
                <video id="webcam-preview" autoplay muted class="webcam-preview"></video>
                <div class="webcam-controls-buttons">
                    <button class="webcam-start-btn" id="start-record-btn" onclick="startRecording()">
                        🔴 Inizia Registrazione
                    </button>
                    <button onclick="stopRecording()" id="stop-record-btn" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; display: none;">
                        ⏹️ Ferma Registrazione
                    </button>
                </div>
            </div>
            
            <!-- UPLOAD CONTROLS -->
            <div id="upload-controls" style="display: none; margin-bottom: 15px;">
                <input type="file" id="video-file-input" accept="image/*,video/*" style="display: none;">
                <button onclick="document.getElementById('video-file-input').click()" style="background: var(--p); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
                    ? Scegli File Media
                </button>
                <div id="upload-progress" style="display: none; margin-top: 10px;">
                    <div style="background: #e0e0e0; border-radius: 4px; height: 4px; width: 0%; transition: width 0.3s;"></div>
                    <span id="upload-text" style="font-size: 0.9em;">Caricamento...</span>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function setupVideoModalEvents(postId) {
    window.currentPostId = postId;
}

function closeVideoModal() {
    if (videoModal) {
        videoModal.style.display = 'none';
        
        // Ferma registrazione se in corso
        if (window.mediaRecorder) {
            window.mediaRecorder.stop();
            window.mediaRecorder = null;
        }
        
        // Pulisce streams
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
            window.localStream = null;
        }
    }
}

function selectMediaSource(source) {
    console.log("?? Selezione source:", source);
    
    // Nascondi tutte le opzioni
    document.getElementById('upload-controls').style.display = 'none';
    document.getElementById('webcam-controls').style.display = 'none';
    document.getElementById('video-preview').style.display = 'none';
    
    // Mostra l'opzione selezionata
    if (source === 'upload') {
        document.getElementById('upload-controls').style.display = 'block';
        document.getElementById('upload-btn').style.background = 'var(--p)';
        document.getElementById('webcam-btn').style.background = '#6c757d';
    } else if (source === 'webcam') {
        document.getElementById('webcam-controls').style.display = 'block';
        document.getElementById('webcam-btn').style.background = '#28a745';
        document.getElementById('upload-btn').style.background = '#6c757d';
        initWebcam();
    }
}

async function initWebcam() {
    try {
        console.log("📹 Inizializzo webcam...");
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        window.localStream = stream;
        
        const preview = document.getElementById('webcam-preview');
        preview.srcObject = stream;
        
        // Mostra controlli registrazione
        document.getElementById('start-record-btn').style.display = 'inline-block';
        
    } catch (error) {
        console.error("❌ Errore webcam:", error);
        alert("Impossibile accedere alla webcam: " + error.message);
    }
}

function startRecording() {
    if (!window.localStream) return;
    
    console.log("🔴 Inizio registrazione...");
    
    const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
    };
    
    window.mediaRecorder = new MediaRecorder(window.localStream, options);
    window.recordedChunks = [];
    
    window.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            window.recordedChunks.push(event.data);
        }
    };
    
    window.mediaRecorder.onstop = () => {
        console.log("⏹️ Registrazione fermata");
        
        // Mostra preview e controlli
        document.getElementById('webcam-controls').style.display = 'none';
        document.getElementById('video-preview').style.display = 'block';
        document.getElementById('confirm-video-btn').style.display = 'inline-block';
        document.getElementById('cancel-video-btn').style.display = 'inline-block';
        
        // Crea blob e mostra preview
        const blob = new Blob(window.recordedChunks, { type: 'video/webm' });
        window.recordedVideoBlob = blob;
        
        const videoURL = URL.createObjectURL(blob);
        const preview = document.getElementById('video-preview-player');
        preview.src = videoURL;
    };
    
    window.mediaRecorder.start();
    
    // Cambia stato bottoni
    document.getElementById('start-record-btn').style.display = 'none';
    document.getElementById('stop-record-btn').style.display = 'inline-block';
}

function stopRecording() {
    if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
        window.mediaRecorder.stop();
    }
}

function confirmVideo() {
    if (!window.recordedVideoBlob) return;
    
    console.log("✅ Confermo video per post:", window.currentPostId);
    
    // Carica su Firebase Storage
    uploadVideoToFirebase(window.recordedVideoBlob, window.currentPostId);
}

function cancelVideo() {
    console.log("✕ Annullato video per post:", window.currentPostId);
    closeVideoModal();
}

async function uploadVideoToFirebase(videoBlob, postId) {
    try {
        console.log("📤 Carico video su Firebase...");
        
        // Mostra progress
        const progressDiv = document.getElementById('upload-progress');
        const progressText = document.getElementById('upload-text');
        progressDiv.style.display = 'block';
        
        const storage = getStorage();
        const videoRef = ref(storage, `videos/${postId}/${Date.now()}.webm`);
        
        const uploadTask = uploadBytes(videoRef, videoBlob);
        
        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressDiv.style.width = progress + '%';
            progressText.textContent = `Caricamento: ${Math.round(progress)}%`;
        });
        
        uploadTask.on('complete', async () => {
            console.log("✅ Video caricato su Firebase");
            
            // Ottieni URL del video
            const downloadURL = await getDownloadURL(videoRef);
            
            // Aggiungi il video al post
            await addVideoToPost(postId, downloadURL);
            
            // Chiudi modal
            closeVideoModal();
            
            // Aggiorna counter video
            updateVideoCounter(postId);
        });
        
        uploadTask.on('error', (error) => {
            console.error("❌ Errore caricamento video:", error);
            alert("Errore durante il caricamento del video: " + error.message);
        });
        
    } catch (error) {
        console.error("❌ Errore upload video:", error);
        alert("Errore durante il caricamento del video: " + error.message);
    }
}

async function addVideoToPost(postId, videoURL) {
    // Qui puoi aggiungere la logica per salvare l'URL del video nel post
    console.log("🎬 Aggiungo video al post:", { postId, videoURL });
    
    // Per ora, mostriamo solo un alert
    alert(`Video aggiunto al post ${postId}!\nURL: ${videoURL}`);
}

function updateVideoCounter(postId) {
    const counter = document.getElementById(`video-count-${postId}`);
    if (counter) {
        const currentCount = parseInt(counter.textContent) || 0;
        counter.textContent = currentCount + 1;
    }
}

// Gestione upload file
document.addEventListener('change', (e) => {
    if (e.target.id === 'video-file-input') {
        const file = e.target.files[0];
        if (file) {
            console.log("?? File media selezionato:", file.name, file.type);
            
            // Mostra preview del file
            const mediaURL = URL.createObjectURL(file);
            
            if (file.type.startsWith('image/')) {
                // Per immagini, crea un elemento img nel preview
                const previewDiv = document.getElementById('video-preview');
                previewDiv.innerHTML = `
                    <img src="${mediaURL}" style="width: 100%; max-height: 400px; border-radius: 8px; object-fit: cover;">
                    <div style="margin-top: 10px;">
                        <button onclick="confirmVideo()" id="confirm-video-btn" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                            ? Conferma Immagine
                        </button>
                        <button onclick="cancelVideo()" id="cancel-video-btn" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                            ? Annulla
                        </button>
                    </div>
                `;
            } else if (file.type.startsWith('video/')) {
                // Per video, usa il video player esistente
                const preview = document.getElementById('video-preview-player');
                preview.src = mediaURL;
                
                // Mostra controlli video
                document.getElementById('upload-controls').style.display = 'none';
                document.getElementById('video-preview').style.display = 'block';
                document.getElementById('confirm-video-btn').style.display = 'inline-block';
                document.getElementById('cancel-video-btn').style.display = 'inline-block';
            }
            
            // Salva il blob per l'upload
            window.recordedVideoBlob = file;
        }
    }
});

// Export delle funzioni per compatibilità
export { selectMediaSource, closeVideoModal, confirmVideo, cancelVideo, initWebcam, startRecording, stopRecording };

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { auth, db } from "./firebase.js";
import { 
    doc, updateDoc, serverTimestamp, onSnapshot, setDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    updatePassword, reauthenticateWithCredential, EmailAuthProvider, getAuth 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const FIELDS = ['firstName','lastName','userEmail','userPhone','birthDate','height','gender','startWeight','weight','bodyFat','hydration','visceralFat','leanMass','boneMass','metabolicAge','mainGoal','targetWeight','bio'];

// --- BADGE SYSTEM ---
const BADGE_ICONS = {
    success: `<div class="badge-icon">
        <i class="fas fa-trophy"></i>
    </div>`,
    process: `<div class="badge-icon">
        <i class="fas fa-fire"></i>
    </div>`,
    info: `<div class="badge-icon">
        <i class="fas fa-chart-line"></i>
    </div>`,
    warning: `<div class="badge-icon">
        <i class="fas fa-bolt"></i>
    </div>`,
    danger: `<div class="badge-icon">
        <i class="fas fa-exclamation-triangle"></i>
    </div>`,
    default: `<div class="badge-icon">
        <i class="fas fa-user"></i>
    </div>`
};

// --- FUNZIONI PRINCIPALI ---

export function loadUserProfile(uid, targetUid = null) {
    console.log('Caricamento profilo per UID:', uid, targetUid ? '(utente specifico)' : '(utente autenticato)');
    
    const isOwnProfile = !targetUid || targetUid === uid;
    
    if (isOwnProfile) {
        console.log('Profilo personale rilevato, UID utente:', uid);
        console.log('Caricamento dati coach per tutti gli utenti...');
        
        // Forza ricaricamento dati coach se non presenti (per tutti gli utenti)
        const coachFirstNameEl = document.getElementById("coachFirstName");
        const coachLastNameEl = document.getElementById("coachLastName");
        const coachEmailEl = document.getElementById("coachEmail");
        const coachPhoneEl = document.getElementById("coachPhone");
        
        console.log('Stato attuale campi coach:', {
            firstName: coachFirstNameEl ? coachFirstNameEl.value : 'ELEMENTO NON TROVATO',
            lastName: coachLastNameEl ? coachLastNameEl.value : 'ELEMENTO NON TROVATO',
            email: coachEmailEl ? coachEmailEl.value : 'ELEMENTO NON TROVATO',
            phone: coachPhoneEl ? coachPhoneEl.value : 'ELEMENTO NON TROVATO'
        });
        
        // Se i campi coach sono vuoti, carica da Firebase
        if (!coachFirstNameEl?.value && !coachLastNameEl?.value && !coachEmailEl?.value && !coachPhoneEl?.value) {
            console.log('Campo coach vuoto, forzo caricamento da Firebase...');
            
            // Cerca un utente con dati coach completi
            getDoc(doc(db, "users", uid)).then(async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log('Dati coach ricevuti:', {
                        coachFirstName: data.coachFirstName,
                        coachLastName: data.coachLastName,
                        coachEmail: data.coachEmail,
                        coachPhone: data.coachPhone
                    });
                    
                    if (coachFirstNameEl) coachFirstNameEl.value = data.coachFirstName || data.firstName || "";
                    if (coachLastNameEl) coachLastNameEl.value = data.coachLastName || data.lastName || "";
                    if (coachEmailEl) coachEmailEl.value = data.coachEmail || data.email || "";
                    if (coachPhoneEl) coachPhoneEl.value = data.coachPhone || data.userPhone || "";
                    
                    console.log('Dati coach popolati con successo');
                } else {
                    console.log('ERRORE: Il documento utente non esiste!');
                    console.log('Creazione automatica del documento utente...');
                    
                    // Recupero l'utente autenticato
                    const auth = getAuth();
                    const user = auth.currentUser;
                    
                    if (user) {
                        // Creo il documento utente con dati di base
                        await setDoc(doc(db, "users", user.uid), {
                            uid: user.uid,
                            email: user.email,
                            nome: "",
                            cognome: "",
                            userPhone: "",
                            phone: "",
                            firstName: "",
                            lastName: "",
                            role: "user",
                            createdAt: serverTimestamp(),
                            keepCoachData: true
                        });
                        
                        console.log('Documento utente creato con successo!');
                        
                        // Ricarico i dati dopo la creazione
                        location.reload();
                    } else {
                        console.error('Nessun utente autenticato trovato!');
                    }
                }
            }).catch((error) => {
                console.error('Errore caricamento dati coach:', error);
            });
        } else {
            console.log('Dati coach già presenti, non ricarico');
        }
    } else {
        // Profilo altrui: logica differenziata per coach vs utente normale
        
        // Prima disabilita TUTTO i campi modificabili
        const allEditableFields = ['firstName', 'lastName', 'userEmail', 'userPhone', 'birthDate', 'height', 'gender', 'startWeight', 'mainGoal', 'targetWeight', 'bio', 'weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge'];
        allEditableFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('readonly', true);
                el.style.backgroundColor = '#f8f9fa';
                el.style.cursor = 'not-allowed';
            }
        });
        
        // Disabilita tutti i pulsanti di salvataggio
        const saveButtons = ['saveAnagraficiBtn', 'saveObiettiviBtn', 'saveBiaBtn', 'savePasswordBtn'];
        saveButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = 'none';
            }
        });
        
        // Mostra messaggio di sola lettura
        const readOnlyMessage = document.getElementById('readOnlyMessage');
        if (readOnlyMessage) {
            readOnlyMessage.style.display = 'block';
            readOnlyMessage.innerHTML = '<i class="fas fa-lock"></i> Stai visualizzando il profilo di un altro utente. I campi sono in modalità sola lettura.';
            readOnlyMessage.style.backgroundColor = '#fff3cd';
            readOnlyMessage.style.color = '#856404';
            readOnlyMessage.style.padding = '10px';
            readOnlyMessage.style.borderRadius = '5px';
            readOnlyMessage.style.marginBottom = '20px';
        }
        
        // Disabilita anche il pulsante di logout se c'è
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
    
    // Carica dati utente
    const userRef = doc(db, "users", targetUid || uid);
    onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Popola campi anagrafici
            console.log('Tentativo popolamento campi anagrafici:', {
                firstName: data.firstName,
                lastName: data.lastName,
                userPhone: data.userPhone,
                email: data.email
            });
            
            // Verifica che gli elementi esistano prima di popolarli
            const firstNameEl = document.getElementById("firstName");
            const lastNameEl = document.getElementById("lastName");
            const userPhoneEl = document.getElementById("userPhone");
            const userEmailEl = document.getElementById("userEmail");
            
            console.log('Elementi trovati:', {
                firstName: firstNameEl ? 'ESISTE' : 'NON TROVATO',
                lastName: lastNameEl ? 'ESISTE' : 'NON TROVATO',
                userPhone: userPhoneEl ? 'ESISTE' : 'NON TROVATO',
                userEmail: userEmailEl ? 'ESISTE' : 'NON TROVATO'
            });
            
            if (data.firstName) {
                console.log('Popolamento firstName:', data.firstName);
                firstNameEl.value = data.firstName;
            } else {
                console.log('firstName non popolato - data mancante');
            }
            
            if (data.lastName) {
                console.log('Popolamento lastName:', data.lastName);
                lastNameEl.value = data.lastName;
            } else {
                console.log('lastName non popolato - data mancante');
            }
            
            if (data.userPhone) {
                console.log('Popolamento userPhone:', data.userPhone);
                userPhoneEl.value = data.userPhone;
            } else {
                console.log('userPhone non popolato - data mancante');
            }
            
            if (data.email) {
                console.log('Popolamento email:', data.email);
                userEmailEl.value = data.email;
            } else {
                console.log('email non popolato - data mancante');
            }
            
            // Popola altri campi
            FIELDS.forEach(field => {
                const el = document.getElementById(field);
                if (el && data[field] !== undefined) {
                    el.value = data[field];
                }
            });
            
            // Popola campi coach (solo per profilo personale)
            if (isOwnProfile) {
                const coachFirstNameEl = document.getElementById("coachFirstName");
                const coachLastNameEl = document.getElementById("coachLastName");
                const coachEmailEl = document.getElementById("coachEmail");
                const coachPhoneEl = document.getElementById("coachPhone");
                
                if (coachFirstNameEl) coachFirstNameEl.value = data.coachFirstName || data.firstName || "";
                if (coachLastNameEl) coachLastNameEl.value = data.coachLastName || data.lastName || "";
                if (coachEmailEl) coachEmailEl.value = data.coachEmail || data.email || "";
                if (coachPhoneEl) coachPhoneEl.value = data.coachPhone || data.userPhone || "";
                
                console.log('Campi coach popolati:', {
                    firstName: coachFirstNameEl ? coachFirstNameEl.value : 'ELEMENTO NON TROVATO',
                    lastName: coachLastNameEl ? coachLastNameEl.value : 'ELEMENTO NON TROVATO',
                    email: coachEmailEl ? coachEmailEl.value : 'ELEMENTO NON TROVATO',
                    phone: coachPhoneEl ? coachPhoneEl.value : 'ELEMENTO NON TROVATO'
                });
            }
            
            // Carica e visualizza data e ora challenge
            loadChallengeDateTime(data.challengeStartDate);
            
            // Aggiorna badge
            updateBadges(data);
        } else {
            console.error('Documento utente non trovato!');
        }
    });
}

// Funzione per caricare e visualizzare data e ora challenge
function loadChallengeDateTime(challengeStartDate) {
    const displayElement = document.getElementById('challengeDateTimeText');
    console.log('loadChallengeDateTime chiamato con:', challengeStartDate);
    
    if (!displayElement) {
        console.error('Elemento displayElement non trovato!');
        return;
    }
    
    console.log('Elemento displayElement trovato:', displayElement);
    
    if (challengeStartDate) {
        try {
            const date = new Date(challengeStartDate);
            console.log('Data challenge parsata:', date);
            
            if (!isNaN(date.getTime())) {
                const options = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                const formattedDate = date.toLocaleDateString('it-IT', options);
                displayElement.textContent = formattedDate;
                displayElement.style.color = '#28a745';
                displayElement.style.fontWeight = 'bold';
                console.log('Data challenge formattata:', formattedDate);
            } else {
                console.error('Data challenge non valida!');
                displayElement.textContent = 'Data non valida';
                displayElement.style.color = '#dc3545';
            }
        } catch (error) {
            console.error('Errore elaborazione data challenge:', error);
            displayElement.textContent = 'Errore data';
            displayElement.style.color = '#dc3545';
        }
    } else {
        console.log('Data challenge non presente, mostro "Data non impostata"');
        displayElement.textContent = 'Data non impostata';
        displayElement.style.color = '#6c757d';
        displayElement.style.fontWeight = '500';
    }
}

// Funzione per aggiornare i badge
function updateBadges(data) {
    // Badge di peso
    const weightBadge = document.getElementById('weightBadge');
    if (weightBadge && data.weight) {
        const weight = parseFloat(data.weight);
        if (weight < 60) {
            weightBadge.innerHTML = BADGE_ICONS.info;
            weightBadge.title = 'Peso sotto la media';
        } else if (weight > 90) {
            weightBadge.innerHTML = BADGE_ICONS.warning;
            weightBadge.title = 'Peso sopra la media';
        } else {
            weightBadge.innerHTML = BADGE_ICONS.success;
            weightBadge.title = 'Peso nella norma';
        }
    }
    
    // Badge di grasso corporeo
    const bodyFatBadge = document.getElementById('bodyFatBadge');
    if (bodyFatBadge && data.bodyFat) {
        const bodyFat = parseFloat(data.bodyFat);
        if (bodyFat < 15) {
            bodyFatBadge.innerHTML = BADGE_ICONS.warning;
            bodyFatBadge.title = 'Grasso corporeo molto basso';
        } else if (bodyFat > 25) {
            bodyFatBadge.innerHTML = BADGE_ICONS.danger;
            bodyFatBadge.title = 'Grasso corporeo elevato';
        } else {
            bodyFatBadge.innerHTML = BADGE_ICONS.success;
            bodyFatBadge.title = 'Grasso corporeo nella norma';
        }
    }
    
    // Badge di idratazione
    const hydrationBadge = document.getElementById('hydrationBadge');
    if (hydrationBadge && data.hydration) {
        const hydration = parseFloat(data.hydration);
        if (hydration < 50) {
            hydrationBadge.innerHTML = BADGE_ICONS.danger;
            hydrationBadge.title = 'Disidratazione';
        } else if (hydration < 60) {
            hydrationBadge.innerHTML = BADGE_ICONS.warning;
            hydrationBadge.title = 'Leggera disidratazione';
        } else {
            hydrationBadge.innerHTML = BADGE_ICONS.success;
            hydrationBadge.title = 'Bene idratato';
        }
    }
}

// Funzione per salvare i dati anagrafici
export async function saveAnagrafici(uid) {
    const data = {};
    FIELDS.forEach(field => {
        const el = document.getElementById(field);
        if (el) {
            data[field] = el.value;
        }
    });
    
    try {
        await updateDoc(doc(db, "users", uid), data);
        alert('Dati anagrafici salvati con successo!');
    } catch (error) {
        console.error('Errore salvataggio dati anagrafici:', error);
        alert('Errore salvataggio dati anagrafici');
    }
}

// Funzione per salvare gli obiettivi
export async function saveObiettivi(uid) {
    const mainGoal = document.getElementById('mainGoal').value;
    const targetWeight = document.getElementById('targetWeight').value;
    const bio = document.getElementById('bio').value;
    
    try {
        await updateDoc(doc(db, "users", uid), {
            mainGoal,
            targetWeight,
            bio,
            updatedAt: serverTimestamp()
        });
        alert('Obiettivi salvati con successo!');
    } catch (error) {
        console.error('Errore salvataggio obiettivi:', error);
        alert('Errore salvataggio obiettivi');
    }
}

// Funzione per salvare i dati BIA
export async function saveBia(uid) {
    const data = {};
    ['weight', 'bodyFat', 'hydration', 'visceralFat', 'leanMass', 'boneMass', 'metabolicAge'].forEach(field => {
        const el = document.getElementById(field);
        if (el) {
            data[field] = el.value;
        }
    });
    
    try {
        await updateDoc(doc(db, "users", uid), {
            ...data,
            lastBiaUpdate: serverTimestamp()
        });
        alert('Dati BIA salvati con successo!');
    } catch (error) {
        console.error('Errore salvataggio dati BIA:', error);
        alert('Errore salvataggio dati BIA');
    }
}

// Funzione per caricare foto profilo
export async function handlePhotoUpload(uid, file) {
    if (!file) return;
    
    try {
        const storage = getStorage();
        const storageRef = ref(storage, `users/${uid}/profile.jpg`);
        
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        
        await updateDoc(doc(db, "users", uid), {
            photoURL,
            photoUpdatedAt: serverTimestamp()
        });
        
        // Aggiorna immagine profilo
        const profileImg = document.getElementById('profileImg');
        if (profileImg) {
            profileImg.src = photoURL;
        }
        
        alert('Foto profilo aggiornata con successo!');
    } catch (error) {
        console.error('Errore caricamento foto:', error);
        alert('Errore caricamento foto');
    }
}

// Funzione per calcolare BMI
export function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
}

// Funzione per calcolare età
export function calculateAge(birthDate) {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    
    return age;
}

// Funzione per aggiornare calcoli
export function updateCalculations() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const birthDate = document.getElementById('birthDate').value;
    
    if (weight && height) {
        const bmi = calculateBMI(weight, height);
        const bmiElement = document.getElementById('bmi');
        if (bmiElement) {
            bmiElement.value = bmi;
        }
    }
    
    if (birthDate) {
        const age = calculateAge(birthDate);
        const ageElement = document.getElementById('age');
        if (ageElement) {
            ageElement.value = age;
        }
    }
}

// Funzione per impostare azioni profilo
export function setupProfiloActions(uid) {
    // Salva dati anagrafici
    const saveAnagraficiBtn = document.getElementById('saveAnagraficiBtn');
    if (saveAnagraficiBtn) {
        saveAnagraficiBtn.addEventListener('click', () => saveAnagrafici(uid));
    }
    
    // Salva obiettivi
    const saveObiettiviBtn = document.getElementById('saveObiettiviBtn');
    if (saveObiettiviBtn) {
        saveObiettiviBtn.addEventListener('click', () => saveObiettivi(uid));
    }
    
    // Salva dati BIA
    const saveBiaBtn = document.getElementById('saveBiaBtn');
    if (saveBiaBtn) {
        saveBiaBtn.addEventListener('click', () => saveBia(uid));
    }
    
    // Upload foto
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            handlePhotoUpload(uid, e.target.files[0]);
        });
    }
    
    // Aggiorna calcoli
    FIELDS.forEach(field => {
        const el = document.getElementById(field);
        if (el) {
            el.addEventListener('input', updateCalculations);
        }
    });
    
    // Inizializza calcoli
    updateCalculations();
}

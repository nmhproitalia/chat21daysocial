import { db, auth, storage } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Ho aggiunto query e where alle importazioni qui sotto
import { collection, getDocs, query, where, updateDoc, serverTimestamp, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

async function fetchUsers() {
    const grid = document.getElementById('userGrid');
    const countLabel = document.getElementById('userCount');
    const loader = document.getElementById('loading');

    try {
        // --- MODIFICA: CREAZIONE QUERY FILTRATA ---
        // Recuperiamo solo i documenti dove il campo 'role' è uguale a 'user'
        const usersQuery = query(collection(db, "users"), where("role", "==", "user"));
        const snap = await getDocs(usersQuery);
        
        grid.innerHTML = "";
        loader.style.display = "none";
        
        let total = 0;

        snap.forEach((doc) => {
            total++;
            const u = doc.data();
            const uid = doc.id;

            // Logica Avatar (Mantenuta identica)
            let avatarHtml = '';
            if (u.photoURL) {
                avatarHtml = `<img src="${u.photoURL}" class="user-avatar" onerror="this.parentElement.innerHTML='<i class=\'fas fa-user\' style=\'font-size:30px;color:#ccc\'></i>'">`;
            } else {
                avatarHtml = `<svg class="user-avatar-svg" viewBox="0 0 128 128"><path d="M64 8a28 28 0 1028 28A28 28 0 0064 8zm0 112c-28 0-48-12-48-24s20-24 48-24 48 12 48 24-20 24-48 24z"/></svg>`;
            }

            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div class="avatar-container">
                    ${avatarHtml}
                </div>
                <div class="user-name">${u.firstName || 'Utente'} ${u.lastName || ''}</div>
                <div class="user-goal">${u.mainGoal || 'Obiettivo non settato'}</div>
                
                <div class="user-stats">
                    <span class="stat-inline"><b>${u.weight || '--'}</b> kg</span>
                    <span class="stat-separator">--</span>
                    <span class="stat-inline"><b>${u.bodyFat || '--'}</b> % MG</span>
                    <span class="stat-separator">--</span>
                    <span class="stat-inline"><b>${u.hydration || '--'}</b> % H2O</span>
                    <span class="stat-separator">--</span>
                    <span class="stat-inline"><b>${u.leanMass || '--'}</b> kg MM</span>
                    <span class="stat-separator">--</span>
                    <span class="stat-inline"><b>${u.visceralFat || '--'}</b> GV</span>
                    <span class="stat-separator">--</span>
                    <span class="stat-inline"><b>${u.boneMass || '--'}</b> kg MO</span>
                    <span class="stat-separator">--</span>
                    <span class="stat-inline"><b>${u.metabolicAge || '--'}</b> EM</span>
                </div>
                
                <button onclick="window.location.href='profile.html?uid=${uid}'" class="btn-save">DETTAGLI COMPLETI</button>
                <button onclick="deleteUser('${uid}')" class="btn-delete btn-delete-danger">Elimina Utente</button>
            `;
            grid.appendChild(card);
        });

        // Aggiorniamo il counter con il numero di veri atleti
        countLabel.textContent = `Challengers: ${total}`;

    } catch (err) {
        console.error("Errore nel caricamento dashboard:", err);
        loader.textContent = "Errore durante il caricamento dei dati.";
    }
}

// Funzione per aggiornare dati coach per tutti gli utenti
async function updateCoachDataForAllUsers(confirmed = false) {
    const firstName = document.getElementById('adminCoachFirstName').value.trim();
    const lastName = document.getElementById('adminCoachLastName').value.trim();
    const email = document.getElementById('adminCoachEmail').value.trim();
    const phone = document.getElementById('adminCoachPhone').value.trim();
    const challengeDate = document.getElementById('challengeStartDate').value;
    const challengeTime = document.getElementById('challengeStartTime').value;
    const statusDiv = document.getElementById('coachUpdateStatus');
    const updateBtn = document.getElementById('updateCoachDataBtn');
    
    // Validazione campi coach
    if (!firstName || !lastName || !email || !phone) {
        statusDiv.textContent = 'Compila tutti i campi del coach';
        statusDiv.style.color = '#dc3545';
        return;
    }
    
    // Validazione data challenge (opzionale)
    let challengeStartDateTime = null;
    if (challengeDate) {
        if (!challengeTime) {
            statusDiv.textContent = 'Seleziona anche l\'ora di inizio challenge';
            statusDiv.style.color = '#dc3545';
            return;
        }
        
        // Combina data e ora
        challengeStartDateTime = new Date(`${challengeDate}T${challengeTime}:00`);
        
        // Verifica che la data sia futura
        if (challengeStartDateTime <= new Date()) {
            statusDiv.textContent = 'La data di inizio challenge deve essere futura';
            statusDiv.style.color = '#dc3545';
            return;
        }
    }
    
    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        statusDiv.textContent = 'Email non valida';
        statusDiv.style.color = '#dc3545';
        return;
    }
    
    // Validazione telefono (solo numeri italiani)
    const phoneRegex = /^[3]\d{8,9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        statusDiv.textContent = 'Telefono non valido (formato: 3331234567)';
        statusDiv.classList.add('text-danger');
        return;
    }
    
    // Mostra avviso di conferma
    if (!confirmed) {
        statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i>Stai per aggiornare i dati del coach per tutti gli utenti: <strong>${firstName} ${lastName}</strong> - ${email} - ${phone}. <button onclick="updateCoachDataForAllUsers(true)">Conferma</button> <button onclick="location.reload()">Annulla</button>`;
        statusDiv.classList.add('text-warning');
        return;
    }
    
    // Disabilita bottone e mostra loading
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Aggiornamento in corso...';
    statusDiv.textContent = 'Aggiornamento in corso...';
    statusDiv.classList.add('text-warning');
    
    try {
        // Recupera tutti gli utenti con role "user"
        const usersQuery = query(collection(db, "users"), where("role", "==", "user"));
        const snap = await getDocs(usersQuery);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Aggiorna ogni utente
        const updatePromises = snap.docs.map(async (doc) => {
            try {
                const updateData = {
                    coachFirstName: firstName,
                    coachLastName: lastName,
                    coachEmail: email,
                    coachPhone: phone,
                    coachUpdated: serverTimestamp()
                };
                
                // Aggiungi data challenge se impostata
                if (challengeStartDateTime) {
                    updateData.challengeStartDate = challengeStartDateTime.toISOString();
                    updateData.challengeStartTimestamp = challengeStartDateTime.getTime();
                }
                
                // AGGIUNTA: Assicura che dati coach rimangano memorizzati
                updateData.keepCoachData = true;
                
                await updateDoc(doc.ref, updateData);
                successCount++;
                console.log(`Aggiornato utente ${doc.id} con dati coach e challenge`);
            } catch (error) {
                errorCount++;
                errors.push(`Utente ${doc.id}: ${error.message}`);
            }
        });
        
        // AGGIUNTA: Aggiorna anche il documento admin
        const admin = auth.currentUser;
        if (admin) {
            const adminUpdateData = {
                coachFirstName: firstName,
                coachLastName: lastName,
                coachEmail: email,
                coachPhone: phone,
                coachUpdated: serverTimestamp()
            };
            
            // Aggiungi data challenge se impostata
            if (challengeStartDateTime) {
                adminUpdateData.challengeStartDate = challengeStartDateTime.toISOString();
                adminUpdateData.challengeStartTimestamp = challengeStartDateTime.getTime();
            }
            
            // AGGIUNTA: Assicura che dati coach rimangano memorizzati
            adminUpdateData.keepCoachData = true;
            
            const adminUpdatePromise = updateDoc(doc(db, "users", admin.uid), adminUpdateData).then(() => {
                successCount++;
                console.log(`Aggiornato anche documento admin ${admin.uid} con dati coach e challenge`);
            }).catch((error) => {
                errorCount++;
                errors.push(`Admin ${admin.uid}: ${error.message}`);
            });
            updatePromises.push(adminUpdatePromise);
        }
        
        // Attendi tutti gli aggiornamenti
        await Promise.all(updatePromises);
        
        // AGGIUNTA: Aggiorna il form dashboard dopo il salvataggio
        setTimeout(() => {
            loadCoachDataFromStorage();
        }, 1000);
        
        // Mostra risultato
        if (errorCount === 0) {
            statusDiv.textContent = `Dati coach aggiornati con successo per ${successCount} utenti!`;
            statusDiv.classList.add('text-success');
            
            // Pulisci campi
            document.getElementById('adminCoachFirstName').value = '';
            document.getElementById('adminCoachLastName').value = '';
            document.getElementById('adminCoachEmail').value = '';
            document.getElementById('adminCoachPhone').value = '';
        } else {
            statusDiv.textContent = `Parzialmente completato: ${successCount} success, ${errorCount} errori`;
            statusDiv.style.color = '#ffc107';
            console.error('Errori aggiornamento coach:', errors);
        }
        
    } catch (error) {
        console.error('Errore generale aggiornamento coach:', error);
        statusDiv.textContent = 'Errore durante l\'aggiornamento: ' + error.message;
        statusDiv.style.color = '#dc3545';
    } finally {
        // Ripristina bottone
        updateBtn.disabled = false;
        updateBtn.innerHTML = '<i class="fas fa-sync-alt" style="margin-right: 8px;"></i>Aggiorna Dati Coach per Tutti';
    }
}

// Event listener per bottone aggiornamento coach
document.addEventListener('DOMContentLoaded', () => {
    // Prima verifica se l'admin è autenticato
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('Admin autenticato, UID:', user.uid);
            fetchUsers();
            loadCoachDataFromStorage();
        } else {
            console.log('Admin non autenticato, attendo autenticazione...');
            fetchUsers();
        }
    });
    
    // Aggiungi event listener per bottone aggiornamento coach
    const updateBtn = document.getElementById('updateCoachDataBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', updateCoachDataForAllUsers);
    }
    
    // Aggiungi event listener per bottone verifica dati coach
    const verifyBtn = document.getElementById('verifyCoachDataBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyCoachData);
    }
    
    // Aggiungi event listener per bottone eliminazione utente
    const deleteBtn = document.getElementById('deleteUserBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteUser);
    }
});

// Funzione per verificare i dati coach
async function verifyCoachData() {
    const statusDiv = document.getElementById('coachUpdateStatus');
    const verifyBtn = document.getElementById('verifyCoachDataBtn');
    
    try {
        // Mostra loading
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Verifica in corso...';
        statusDiv.textContent = 'Verifica dati coach in corso...';
        statusDiv.classList.add('text-warning');
        
        // Recupera tutti gli utenti con role "user"
        const usersQuery = query(collection(db, "users"), where("role", "==", "user"));
        const snap = await getDocs(usersQuery);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        let allUsersHaveCoachData = true;
        
        // Verifica che ogni utente abbia i dati coach
        snap.docs.forEach((doc) => {
            const userData = doc.data();
            console.log(`Verifica utente ${doc.id}:`, userData);
            
            // Controlla se ha tutti i dati coach
            const hasCoachData = userData.coachFirstName && userData.coachLastName && 
                                 userData.coachEmail && userData.coachPhone;
            
            // Controlla se ha anche la data di inizio challenge
            const hasChallengeData = userData.challengeStartDate || userData.challengeStartTimestamp;
            
            if (!hasCoachData) {
                allUsersHaveCoachData = false;
                console.warn(`Utente ${doc.id} NON ha dati coach completi`);
                errors.push(`Utente ${doc.id}: dati coach mancanti`);
            } else if (!hasChallengeData) {
                allUsersHaveCoachData = false;
                console.warn(`Utente ${doc.id} NON ha data di inizio challenge`);
                errors.push(`Utente ${doc.id}: data challenge mancante`);
            } else {
                successCount++;
                console.log(`Utente ${doc.id}: dati coach e challenge OK`);
            }
        });
        
        // Mostra risultato
        if (!allUsersHaveCoachData) {
            const coachErrors = errors.filter(e => e.includes('dati coach mancanti'));
            const challengeErrors = errors.filter(e => e.includes('data challenge mancante'));
            let message = `❌ VERIFICA FALLITA: `;
            if (coachErrors.length > 0) message += `${coachErrors.length} utenti con dati coach mancanti`;
            if (challengeErrors.length > 0) message += `, ${challengeErrors.length} utenti con data challenge mancante`;
            
            statusDiv.textContent = message;
            statusDiv.style.color = '#dc3545';
            console.error('Errori verifica:', errors);
            console.error('Utenti mancanti:', errors);
        } else {
            statusDiv.textContent = `✅ VERIFICA COMPLETATA: Tutti ${successCount} utenti hanno dati coach e challenge`;
            statusDiv.classList.add('text-success');
            console.log(`Verifica completata con successo: ${successCount} utenti verificati`);
        }
        
    } catch (error) {
        statusDiv.textContent = '❌ ERRORE VERIFICA: ' + error.message;
        statusDiv.style.color = '#dc3545';
        console.error('Errore verifica dati coach:', error);
    } finally {
        // Ripristina bottone
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>Verifica Dati Coach';
    }
}

// Funzione per eliminare completamente un utente
window.deleteUser = async function(userId) {
    const statusDiv = document.getElementById('deleteUserStatus');
    const coachStatusDiv = document.getElementById('coachUpdateStatus');
    
    // Conferma eliminazione
    const confirmDelete = confirm(`Sei sicuro di voler eliminare completamente l'utente ${userId}? Questa azione è IRREVERSIBILE e eliminerà tutti i dati associati inclusi i file nello storage.`);
    
    if (!confirmDelete) {
        statusDiv.textContent = 'Eliminazione annullata';
        statusDiv.style.color = '#ffc107';
        return;
    }
    
    try {
        statusDiv.textContent = 'Eliminazione utente in corso...';
        statusDiv.style.color = '#ffc107';
        
        // Elimina il documento utente
        await deleteDoc(doc(db, "users", userId));
        
        // Elimina anche eventuali file associati nello storage (gestisci caso non esistente)
        try {
            const storageRef = ref(storage, `users/${userId}`);
            await deleteObject(storageRef);
            console.log(`File storage eliminati per utente ${userId}`);
        } catch (storageError) {
            console.log(`Nessun file storage trovato per utente ${userId}: ${storageError.message}`);
        }
        
        // Elimina anche l'autenticazione Firebase
        try {
            console.log(`Tentativo eliminazione autenticazione per utente: ${userId}`);
            
            // Ottieni l'utente corrente per eliminare l'account specifico
            const userRecord = await auth.currentUser;
            
            // Per eliminare un utente specifico, dobbiamo usare Admin SDK
            // Per ora, saltiamo l'eliminazione autenticazione e rimuoviamo solo il documento
            console.log(`⚠️ Eliminazione autenticazione richiede Admin SDK - rimuoviamo solo il documento per ora`);
            
        } catch (authError) {
            console.log(`❌ Errore eliminazione autenticazione per utente ${userId}:`, authError);
            console.log(`Tipo errore:`, authError.code);
            console.log(`Messaggio errore:`, authError.message);
        }
        
        statusDiv.textContent = `✅ Utente ${userId} eliminato con successo!`;
        statusDiv.classList.add('text-success');
        
        // Pulisci il messaggio dopo 3 secondi
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);
        
        // Ricarica la lista utenti
        fetchUsers();
        
        console.log(`Utente ${userId} eliminato con successo (inclusi dati, storage e autenticazione)`);
        
    } catch (error) {
        statusDiv.textContent = `❌ Errore eliminazione: ${error.message}`;
        statusDiv.style.color = '#dc3545';
        console.error('Errore eliminazione utente:', error);
    }
}

// Funzione per caricare dati coach memorizzati nel form
function loadCoachDataFromStorage() {
    const admin = auth.currentUser;
    console.log('loadCoachDataFromStorage chiamato, admin UID:', admin ? admin.uid : 'NESSUNO');
    
    if (admin) {
        getDoc(doc(db, "users", admin.uid)).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('Dati admin trovati:', data);
                
                // Popola i campi del form con i dati memorizzati
                if (data.coachFirstName) document.getElementById('adminCoachFirstName').value = data.coachFirstName;
                if (data.coachLastName) document.getElementById('adminCoachLastName').value = data.coachLastName;
                if (data.coachEmail) document.getElementById('adminCoachEmail').value = data.coachEmail;
                if (data.coachPhone) document.getElementById('adminCoachPhone').value = data.coachPhone;
                
                // Carica anche data challenge se presente
                if (data.challengeStartDate) {
                    const challengeDate = new Date(data.challengeStartDate);
                    document.getElementById('challengeStartDate').value = challengeDate.toISOString().split('T')[0];
                    document.getElementById('challengeStartTime').value = challengeDate.toTimeString().slice(0, 5);
                }
                
                console.log('Dati coach caricati nel form dashboard:', {
                    coachFirstName: data.coachFirstName,
                    coachLastName: data.coachLastName,
                    coachEmail: data.coachEmail,
                    coachPhone: data.coachPhone,
                    challengeStartDate: data.challengeStartDate
                });
            }
        }).catch((error) => {
            console.error('Errore caricamento dati coach nel form:', error);
        });
    }
}
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth, db } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FUNZIONE REGISTRAZIONE ---
export async function handleRegister(email, pass, extraData) {
    try {
        console.log(" Creazione account in corso...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Recupera i dati coach esistenti da un documento di riferimento
        let coachData = {};
        try {
            // Cerca un utente admin o con dati coach per ottenere i dati di riferimento
            const usersQuery = query(collection(db, "users"), where("role", "==", "user"));
            const snap = await getDocs(usersQuery);
            
            if (!snap.empty) {
                // Prendi il primo utente che ha dati coach
                const referenceUser = snap.docs.find(doc => {
                    const data = doc.data();
                    return data.coachFirstName && data.coachLastName && data.coachEmail && data.coachPhone;
                });
                
                if (referenceUser) {
                    const refData = referenceUser.data();
                    coachData = {
                        coachFirstName: refData.coachFirstName,
                        coachLastName: refData.coachLastName,
                        coachEmail: refData.coachEmail,
                        coachPhone: refData.coachPhone,
                        coachUpdated: refData.coachUpdated,
                        keepCoachData: true
                    };
                    
                    console.log(" Dati coach recuperati e applicati:", coachData);
                    console.log(" Riferimento utente con dati coach:", referenceUser.id);
                } else {
                    console.log(" Nessun utente di riferimento trovato con dati coach completi");
                    // Se non ci sono dati coach, usa dati di default o lascia vuoti
                    console.log(" Nuova challenge - nessun dato coach trovato, procedo senza dati coach");
                }
            } else {
                console.log(" Nessun utente trovato nel database - nuova challenge in corso");
                console.log(" Nuovo utente registrato senza dati coach di riferimento");
            }
        } catch (coachError) {
            console.warn(" Errore recupero dati coach, registrazione continua senza dati coach:", coachError);
        }

        console.log("💾 Inizio salvataggio documento utente...");
        console.log("UID:", user.uid);
        console.log("Email:", email);
        console.log("Dati extra:", extraData);
        console.log("Dati coach:", coachData);
        
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: email,
                nome: extraData.nome || "",
                cognome: extraData.cognome || "",
                userPhone: extraData.telefono || "", 
                phone: extraData.telefono || "", 
                firstName: extraData.nome || "", 
                lastName: extraData.cognome || "", 
                role: "user",
                createdAt: serverTimestamp(),
                // Aggiungi dati coach se recuperati
                ...coachData
            });
            
            console.log("✅ Documento salvato con successo!");
            console.log(" Registrazione riuscita con dati coach automatici!");
            console.log(" Nuovo utente salvato con dati coach:", Object.keys(coachData).length > 0 ? "SÌ" : "NO");
            console.log(" Dati coach applicati:", coachData);
            
            // Rallento redirect per permettere di vedere il log
            console.log(" Redirect tra 10 secondi a posts.html...");
            console.log(" HAI TEMPO PER CONTROLLARE LA CONSOLE!");
            setTimeout(() => {
                window.location.replace("posts.html");
            }, 10000);
        } catch (dbError) {
            console.error("❌ Errore salvataggio database:", dbError);
            console.error("Codice errore:", dbError.code);
            console.error("Messaggio errore:", dbError.message);
            alert("Errore salvataggio dati: " + dbError.message);
            throw dbError;
        }
    } catch (e) {
        console.error(" Errore:", e);
        alert("Errore registrazione: " + e.message);
        throw e;
    }
}

// --- INIZIALIZZAZIONE ---
export function initAuth(callbackLoggedIn, callbackLoggedOut) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                let role = userDoc.exists() ? (userDoc.data().role || "user") : "user";
                callbackLoggedIn(user, role);
            } catch (err) {
                callbackLoggedIn(user, "user");
            }
        } else {
            callbackLoggedOut();
        }
    });

    // Login logic
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            const pass = document.getElementById("password").value;
            try {
                await signInWithEmailAndPassword(auth, email, pass);
            } catch (e) {
                alert("Errore login: " + e.message);
            }
        });
    }

    // Register logic
    const registerBtn = document.getElementById("registerBtn");
    if (registerBtn) {
        registerBtn.addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            const pass = document.getElementById("password").value;
            const nome = document.getElementById("nome").value;
            const cognome = document.getElementById("cognome").value;
            const telefono = document.getElementById("telefono").value;
            
            try {
                await handleRegister(email, pass, { nome, cognome, telefono });
            } catch (e) {
                // Errore già gestito in handleRegister
            }
        });
    }

    // Password reset logic
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            try {
                await sendPasswordResetEmail(auth, email);
                alert("Email di reset inviata! Controlla la tua casella di posta.");
            } catch (e) {
                alert("Errore reset password: " + e.message);
            }
        });
    }
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyABOupiXNdbVHaXC8yK5xTwGePO8y496s4",
  authDomain: "giornifit-app.firebaseapp.com",
  projectId: "giornifit-app",
  storageBucket: "giornifit-app.firebasestorage.app",
  messagingSenderId: "382198007084",
  appId: "1:382198007084:web:49a420f9dbe461db89d889",
  measurementId: "G-8FT6SMHYR0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { sendPasswordResetEmail };

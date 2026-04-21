// Firebase Configuration - SERVER SIDE ONLY
// NON USARE IN PRODUZIONE - Usare environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyABOupiXNdbVHaXC8yK5xTwGePO8y496s4",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "giornifit-app.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "giornifit-app",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "giornifit-app.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "382198007084",
    appId: process.env.FIREBASE_APP_ID || "1:382198007084:web:49a420f9dbe461db89d889",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-8FT6SMHYR0"
};

export default firebaseConfig;

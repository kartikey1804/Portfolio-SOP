

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAdO_K72hLj-ACA6n1k1SK7MYVCibRS2Ew",
    authDomain: "portfolio-676c0.firebaseapp.com",
    projectId: "portfolio-676c0",
    storageBucket: "portfolio-676c0.firebasestorage.app",
    messagingSenderId: "603218218358",
    appId: "1:603218218358:web:6dd0575e9bd28ee93b3e57",
    measurementId: "G-K1SK3P8DNY"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

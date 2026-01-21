// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 🔥 REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDOzZRQLE_FTI2s7pcrkuyDsANeC52VF4U",
  authDomain: "beit-adna-gallery.firebaseapp.com",
  projectId: "beit-adna-gallery",
  storageBucket: "beit-adna-gallery.firebasestorage.app",
  messagingSenderId: "304937446721",
  appId: "1:304937446721:web:4c4c3f3e2534d7b79985c0",
  measurementId: "G-FVT2Q9BF7H"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// 🔹 Firestore database
export const db = getFirestore(app);

// 🔹 Firebase Authentication
export const auth = getAuth(app);

// 🔹 Firebase Storage
export const storage = getStorage(app);
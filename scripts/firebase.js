// scripts/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAC_s1O1SpiC2CHAx8l0w47QMxEmoWiMzs",
    authDomain: "daang-word-quest.firebaseapp.com",
    projectId: "daang-word-quest",
    storageBucket: "daang-word-quest.firebasestorage.app",
    messagingSenderId: "860992033182",
    appId: "1:860992033182:web:2e015ef1a835c64784868f",
    measurementId: "G-MCC1X07C32"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
console.log("Firebase Connected");
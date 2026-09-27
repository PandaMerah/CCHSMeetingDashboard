// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyAqu7Wz8f1ZGcsqTyn3AzzkOk3jvTRReDg",

  authDomain: "cchsmeetingdashboard.firebaseapp.com",

  projectId: "cchsmeetingdashboard",

  storageBucket: "cchsmeetingdashboard.firebasestorage.app",

  messagingSenderId: "652664574963",

  appId: "1:652664574963:web:cb0920af5cf74b2229f886",

  measurementId: "G-8QH9KJKQ8D"

};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, onValue, set, get, update };
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6oSGqSpAKXbcLpNEpVIvJqPwDUlDxh9E",
  authDomain: "shopmunimapp.firebaseapp.com",
  projectId: "shopmunimapp",
  storageBucket: "shopmunimapp.firebasestorage.app",
  messagingSenderId: "420593276076",
  appId: "1:420593276076:web:68be26cbc3c53ed661bb09",
  measurementId: "G-P1CQHLGCEY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
<<<<<<< HEAD
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
=======
import { getStorage } from "firebase/storage";
>>>>>>> e19f3bf9466a0f74e2c358da24d655e751192e65
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
<<<<<<< HEAD
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
=======
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
>>>>>>> e19f3bf9466a0f74e2c358da24d655e751192e65

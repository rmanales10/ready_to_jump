import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for Ready to Jump
const firebaseConfig = {
  apiKey: "AIzaSyAdHEufyQdPQN2Wrb0bp32T19JBOpPtSlw",
  authDomain: "ready-to-jump.firebaseapp.com",
  projectId: "ready-to-jump",
  storageBucket: "ready-to-jump.firebasestorage.app",
  messagingSenderId: "951161728936",
  appId: "1:951161728936:web:6ef8e13f34c0310056f79d",
  measurementId: "G-1JG83Q1KWD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;

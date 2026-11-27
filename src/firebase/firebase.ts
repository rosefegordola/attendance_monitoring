import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const environmentConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

export const isFirebaseConfigured = Object.values(environmentConfig).every(Boolean);
const firebaseConfig = {
  apiKey: environmentConfig.apiKey || "firebase-not-configured",
  authDomain: environmentConfig.authDomain || "firebase-not-configured.firebaseapp.com",
  projectId: environmentConfig.projectId || "firebase-not-configured",
  storageBucket: environmentConfig.storageBucket || "firebase-not-configured.appspot.com",
  messagingSenderId: environmentConfig.messagingSenderId || "000000000000",
  appId: environmentConfig.appId || "1:000000000000:web:firebase-not-configured",
};
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

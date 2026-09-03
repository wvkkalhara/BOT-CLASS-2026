import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDa7Mugp24uL9BoLT56utW1K30lLpGoTcY",
  authDomain: "bot-class-2026.firebaseapp.com",
  databaseURL: "https://bot-class-2026-default-rtdb.firebaseio.com",
  projectId: "bot-class-2026",
  storageBucket: "bot-class-2026.firebasestorage.app",
  messagingSenderId: "476771973105",
  appId: "1:476771973105:web:eadd53fc139b72adbdb650",
  measurementId: "G-J8WQSC63GS",
};

export const app = initializeApp(firebaseConfig);

try {
  getAnalytics(app);
} catch {
  /* analytics unavailable (offline / unsupported env) — safe to ignore */
}

export const db = getDatabase(app);
export const auth = getAuth(app);

/* Admin sessions persist locally across reloads */
setPersistence(auth, browserLocalPersistence).catch(() => {});

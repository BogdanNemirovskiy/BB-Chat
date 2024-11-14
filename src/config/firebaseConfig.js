import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBov3-ml5VmKR_wLQ6XgSbelwKy45_wNeo",
  authDomain: "bbchat-550e5.firebaseapp.com",
  databaseURL: "https://bbchat-550e5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bbchat-550e5",
  storageBucket: "bbchat-550e5.firebasestorage.app",
  messagingSenderId: "200286790684",
  appId: "1:200286790684:web:48a77339bebeb3a020abd9",
  measurementId: "G-7GDBP8RVPC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, auth, db };

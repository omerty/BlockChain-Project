import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "",
  authDomain: "react-98c2a.firebaseapp.com",
  projectId: "react-98c2a",
  storageBucket: "react-98c2a.firebasestorage.app",
  messagingSenderId: "544300463452",
  appId: "1:544300463452:web:21ac1af3ffbbf96fd33d99",
  measurementId: "G-L707BBRXGM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
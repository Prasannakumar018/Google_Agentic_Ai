// Import the functions you need from the SDKs you need
// import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDX6r6r-4ZXFGW6wAnOZ8__NWpM_sPArG8",
  authDomain: "namma-suttu-442dc.firebaseapp.com",
  projectId: "namma-suttu-442dc",
  storageBucket: "namma-suttu-442dc.firebasestorage.app",
  messagingSenderId: "600389927840",
  appId: "1:600389927840:web:1c624cce8a5f990b04dac5",
  measurementId: "G-Y7L6S3CWR3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };

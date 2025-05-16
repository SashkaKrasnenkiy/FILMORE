import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAdhoFM-pmKzJ-l10nxlNwCWevmlZA5pwQ",
  authDomain: "filmore-bdc98.firebaseapp.com",
  projectId: "filmore-bdc98",
  storageBucket: "filmore-bdc98.appspot.com",
  messagingSenderId: "846546561199",
  appId: "1:846546561199:web:2bd1860a6be13dddb58c5a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; // Экспортируем только то, что используем

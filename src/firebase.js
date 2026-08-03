import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDWTu31n4TGUuDgLGK4_He1reSC1yXDGgE",
  authDomain: "prepzo-ai.firebaseapp.com",
  projectId: "prepzo-ai",
  storageBucket: "prepzo-ai.firebasestorage.app",
  messagingSenderId: "919939834228",
  appId: "1:919939834228:web:d90379140a30f0ec72cc21"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);






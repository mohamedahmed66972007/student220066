
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYKmqmqKzT9MZhEvNk4JGqPAgs12ruvKs",
  authDomain: "studentsmo2025.firebaseapp.com",
  projectId: "studentsmo2025",
  storageBucket: "studentsmo2025.firebasestorage.app",
  messagingSenderId: "269657743492",
  appId: "1:269657743492:web:29d965fc991910cb5862d1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

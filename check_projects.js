import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

import { getAuth, signInAnonymously } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkProjects() {
  await signInAnonymously(auth);
  const querySnapshot = await getDocs(collection(db, "projects"));
  let count = 0;
  querySnapshot.forEach((doc) => {
    if (count < 5) {
      console.log(doc.id, " => ", doc.data());
    }
    count++;
  });
  console.log("Total projects:", count);
  process.exit(0);
}

checkProjects();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const committeeMapping = [
  { c: '1', keywords: ['Smart cut', 'AgriReach', 'black iris', 'Harvest Reach', 'PLANTO', 'prickly cut', 'Zeena M. O. Albustami', 'AgriHand', 'Baider', 'Zakaria I. S. Jaradat'] },
  { c: '2', keywords: ['AGRIFLEX', 'Khadirha', 'Retal B. M. Dawud', 'lemonade', 'BYMY Green', 'Assistive Plant', 'AGRIHARVEST', 'Tri Core', 'ZYO', 'Yara A. M. Al-Khawaldeh'] },
  { c: '3', keywords: ['OTC', 'Bloom', 'Olisweep', 'CHILLIEASE', 'Cantaloupe', 'MANGO-CARE', 'CropAid', 'Yousef M. A. Abu Shanab', 'CitraPick'] },
  { c: '4', keywords: ['The Fork', 'Harvest Haven', 'Hashem O. K. A. Alsharif', 'CauliFam', 'Laqta', 'ROOT CROP', 'Yousef B. M. B. Masoud', 'Strawberry', 'VON', 'AGROARM'] },
  { c: '5', keywords: ['GIZR', 'Clawtech', 'Dash', 'Croptech', 'Qataf', 'Ahmad A. K. A. Alsalhi', 'Future Designers', 'Silver class', 'APHD', 'Omar R. M. Ameerah'] }
];

async function updateCommittees() {
  await signInAnonymously(auth);
  const querySnapshot = await getDocs(collection(db, "projects"));
  let updatedCount = 0;
  
  for (const projectDoc of querySnapshot.docs) {
    const data = projectDoc.data();
    const title = (data.title || '').toLowerCase();
    const members = (data.team_members || '').toLowerCase();
    
    let assignedCommittee = null;
    
    for (const mapping of committeeMapping) {
      for (const keyword of mapping.keywords) {
        if (title.includes(keyword.toLowerCase()) || members.includes(keyword.toLowerCase())) {
          assignedCommittee = mapping.c;
          break;
        }
      }
      if (assignedCommittee) break;
    }
    
    if (assignedCommittee) {
      console.log(`Assigning Committee ${assignedCommittee} to ${data.title}`);
      await updateDoc(doc(db, "projects", projectDoc.id), {
        committee_number: assignedCommittee
      });
      updatedCount++;
    } else {
      console.log(`COULD NOT MATCH: ${data.title}`);
    }
  }
  
  console.log(`Updated ${updatedCount} out of ${querySnapshot.docs.length} projects.`);
  process.exit(0);
}

updateCommittees();

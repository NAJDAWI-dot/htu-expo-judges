import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

const committeeMapping = {
  '1': ['Smart cut', 'AgriReach', 'black iris', 'Harvest Reach', 'PLANTO', 'prickly cut', 'Zeena M. O. Albustami', 'AgriHand', 'Baider', 'Zakaria I. S. Jaradat', 'Natasha', 'Lujain'],
  '2': ['AGRIFLEX', 'Khadirha', 'Retal B. M. Dawud', 'lemonade', 'BYMY Green', 'Assistive Plant', 'AGRIHARVEST', 'Tri Core', 'ZYO', 'Yara A. M. Al-Khawaldeh', 'Jalal', 'خضرها', 'Maya Al-Bishawi'],
  '3': ['OTC', 'Bloom', 'Olisweep', 'CHILLIEASE', 'Cantaloupe', 'MANGO-CARE', 'CropAid', 'Yousef M. A. Abu Shanab', 'CitraPick', 'Mohammad Al-Ashhab', 'يامن محمد', 'Jana Al-Salameen', 'YARA MO\'AWYAH KHALEEL ALQAISI', 'HAMZA AL-SHAMI', 'NAWAL FIRAS ALNSOUR', 'WARD NAEM AHMAD SALEH', 'NOOR ESSAM ABED ELFATTAH ALNABULSI'],
  '4': ['The Fork', 'Harvest Haven', 'Hashem O. K. A. Alsharif', 'CauliFam', 'Laqta', 'ROOT CROP', 'Yousef B. M. B. Masoud', 'Strawberry', 'VON', 'AGROARM', 'جبر سلطان', 'Faris Damra', 'AMRO FERAS AHMED ALKHLAYFAT'],
  '5': ['GIZR', 'Clawtech', 'Dash', 'Croptech', 'Qataf', 'Ahmad A. K. A. Alsalhi', 'Future Designers', 'Silver class', 'APHD', 'Omar R. M. Ameerah', 'Khalid', 'قطاف']
};

async function check() {
  await signInAnonymously(auth);
  const querySnapshot = await getDocs(collection(db, "projects"));
  
  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const members = (data.team_members || '').toLowerCase();
    
    let assigned = null;
    for (const [c, keywords] of Object.entries(committeeMapping)) {
      if (keywords.some(k => title.includes(k.toLowerCase()) || members.includes(k.toLowerCase()))) {
        assigned = c;
        break;
      }
    }
    console.log(`Committee ${assigned || 'NONE'}: ${data.title}`);
  }
  process.exit(0);
}

check();

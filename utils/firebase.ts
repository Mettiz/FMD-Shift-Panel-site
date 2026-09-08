import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ShiftEntry, Personnel, PublishedRange } from '../types';

export interface CloudRosterState {
  schedule: ShiftEntry[];
  personnelList: Personnel[];
  unlockedMonths: string[];
  publishedRange: PublishedRange | null;
  adminPassword?: string;
  updatedAt: string;
}

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const ROSTER_DOC_PATH = 'roster_state';
const ROSTER_DOC_ID = 'current';

/**
 * Subscribes to real-time changes of the roster in Firestore.
 * This ensures that whenever the manager applies changes, all visitors and browsers
 * immediately receive the latest roster state without needing to refresh.
 */
export function subscribeToCloudRoster(
  onUpdate: (data: CloudRosterState) => void,
  onInitialEmpty?: () => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const docRef = doc(db, ROSTER_DOC_PATH, ROSTER_DOC_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudRosterState;
        onUpdate(data);
      } else {
        // Document does not exist yet on cloud, signal to seed initial data
        if (onInitialEmpty) {
          onInitialEmpty();
        }
      }
    },
    (error) => {
      console.warn('Firestore subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves or updates roster data to Firestore.
 */
export async function saveCloudRoster(
  data: Partial<CloudRosterState>
): Promise<void> {
  const docRef = doc(db, ROSTER_DOC_PATH, ROSTER_DOC_ID);
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
}

/**
 * Overwrites entire cloud roster with fresh initial data.
 */
export async function resetCloudRoster(
  data: CloudRosterState
): Promise<void> {
  const docRef = doc(db, ROSTER_DOC_PATH, ROSTER_DOC_ID);
  await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

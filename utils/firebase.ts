/**
 * Firebase Firestore Cloud Sync Module - v1.0.1
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  Unsubscribe,
  Firestore
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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const isBrowser = typeof window !== 'undefined';
const hasIndexedDB = isBrowser && typeof indexedDB !== 'undefined';

let firestoreInstance: Firestore;

try {
  firestoreInstance = initializeFirestore(
    app,
    {
      // Force long-polling in browser environments:
      // Resolves "@firebase/firestore: Could not reach Cloud Firestore backend. Connection failed 1 times. [code=unavailable]"
      // caused by WebChannel streaming duplex connections getting blocked or buffered by proxies/firewalls.
      experimentalForceLongPolling: isBrowser,
      localCache: hasIndexedDB
        ? persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          })
        : undefined,
    },
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? firebaseConfig.firestoreDatabaseId
      : undefined
  );
} catch {
  // If already initialized (e.g. during fast refresh or HMR), reuse existing instance
  firestoreInstance = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;

const ROSTER_DOC_PATH = 'roster_state';
const ROSTER_DOC_ID = 'current';

/**
 * Subscribes to real-time changes of the roster in Firestore.
 * Automatically recovers and reconnects when the network comes back online.
 */
export function subscribeToCloudRoster(
  onUpdate: (data: CloudRosterState) => void,
  onInitialEmpty?: () => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const docRef = doc(db, ROSTER_DOC_PATH, ROSTER_DOC_ID);
  let unsub: Unsubscribe | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let isCancelled = false;

  const startListening = () => {
    if (isCancelled) return;

    try {
      unsub = onSnapshot(
        docRef,
        { includeMetadataChanges: false },
        (snapshot) => {
          if (isCancelled) return;
          if (snapshot.exists()) {
            const data = snapshot.data() as CloudRosterState;
            onUpdate(data);
          } else {
            if (onInitialEmpty) {
              onInitialEmpty();
            }
          }
        },
        (error) => {
          if (isCancelled) return;
          if (onError) onError(error);

          // If disconnected/unavailable, schedule automatic reconnection
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(() => {
            if (!isCancelled) {
              startListening();
            }
          }, 5000);
        }
      );
    } catch (err) {
      if (onError) onError(err);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (!isCancelled) {
          startListening();
        }
      }, 5000);
    }
  };

  startListening();

  // Reconnect immediately when browser detects online status
  const handleOnline = () => {
    if (!isCancelled) {
      if (unsub) {
        try { unsub(); } catch {}
      }
      if (retryTimer) clearTimeout(retryTimer);
      startListening();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }

  return () => {
    isCancelled = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
    }
    if (unsub) {
      try { unsub(); } catch {}
    }
  };
}

/**
 * Sanitizes an object before writing to Firestore by removing any keys with `undefined` values.
 * Firestore throws a runtime exception if any field in an object or array is `undefined`.
 */
function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value === undefined) {
        return undefined; // JSON.stringify omits keys with undefined values
      }
      return value;
    })
  );
}

/**
 * Saves or updates roster data to Firestore.
 */
export async function saveCloudRoster(
  data: Partial<CloudRosterState>
): Promise<void> {
  const docRef = doc(db, ROSTER_DOC_PATH, ROSTER_DOC_ID);
  const payload = cleanFirestoreData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Overwrites entire cloud roster with fresh initial data.
 */
export async function resetCloudRoster(
  data: CloudRosterState
): Promise<void> {
  const docRef = doc(db, ROSTER_DOC_PATH, ROSTER_DOC_ID);
  const payload = cleanFirestoreData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await setDoc(docRef, payload);
}

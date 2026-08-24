import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Experiment } from '../types/trade';

const EXPERIMENTS_COLLECTION = 'experiments';
const SETTINGS_COLLECTION = 'user_settings';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on startup
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is in offline mode or waiting for connection.');
    }
  }
}

// Run connection test
testConnection();

/**
 * Real-time listener for experiments collection
 */
export const subscribeToExperiments = (
  userId: string | null,
  callback: (experiments: Experiment[]) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, EXPERIMENTS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Experiment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          type: data.type || 'backtest',
          pair: data.pair || 'EURUSD',
          timeframe: data.timeframe || 'M5',
          session: data.session || 'London',
          setupModel: data.setupModel || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          sampleSize: Number(data.sampleSize) || 0,
          trades: Array.isArray(data.trades) ? data.trades : [],
          keyFinding: data.keyFinding || '',
          hypotheses: data.hypotheses || '',
          verdict: data.verdict || 'KEEP_TESTING',
          verdictNotes: data.verdictNotes || '',
          screenshotUrls: Array.isArray(data.screenshotUrls) ? data.screenshotUrls : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          publishedToWhatsApp: Boolean(data.publishedToWhatsApp),
          publishedAt: data.publishedAt || undefined,
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      console.warn('Firestore subscription error (offline/permissions):', err.message);
      if (onError) {
        onError(err);
      }
    }
  );
};

/**
 * Save or update a single experiment in Firestore
 */
export const saveExperimentToFirestore = async (
  experiment: Experiment,
  userId?: string | null
) => {
  const path = `${EXPERIMENTS_COLLECTION}/${experiment.id}`;
  try {
    const docRef = doc(db, EXPERIMENTS_COLLECTION, experiment.id);
    const payload = {
      ...experiment,
      userId: userId || auth.currentUser?.uid || null,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

/**
 * Delete an experiment from Firestore
 */
export const deleteExperimentFromFirestore = async (experimentId: string) => {
  const path = `${EXPERIMENTS_COLLECTION}/${experimentId}`;
  try {
    const docRef = doc(db, EXPERIMENTS_COLLECTION, experimentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

/**
 * Batch wipe all experiments in Firestore
 */
export const clearAllExperimentsInFirestore = async (experimentIds: string[]) => {
  if (experimentIds.length === 0) return;
  const chunkSize = 400;
  try {
    for (let i = 0; i < experimentIds.length; i += chunkSize) {
      const chunk = experimentIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const ref = doc(db, EXPERIMENTS_COLLECTION, id);
        batch.delete(ref);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, EXPERIMENTS_COLLECTION);
  }
};

/**
 * Batch insert or update multiple experiments (e.g. reload demo or MT5 import)
 */
export const bulkSaveExperimentsToFirestore = async (
  experiments: Experiment[],
  userId?: string | null
) => {
  if (experiments.length === 0) return;
  const chunkSize = 400;
  try {
    for (let i = 0; i < experiments.length; i += chunkSize) {
      const chunk = experiments.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((exp) => {
        const ref = doc(db, EXPERIMENTS_COLLECTION, exp.id);
        batch.set(
          ref,
          {
            ...exp,
            userId: userId || auth.currentUser?.uid || null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, EXPERIMENTS_COLLECTION);
  }
};

/**
 * Save user custom WhatsApp group list to Firestore
 */
export const saveUserSettingsToFirestore = async (
  userId: string,
  whatsappGroups: string[]
) => {
  const path = `${SETTINGS_COLLECTION}/${userId}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    await setDoc(
      docRef,
      {
        userId,
        whatsappGroups,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchUserSettingsFromFirestore = async (userId: string): Promise<string[] | null> => {
  const path = `${SETTINGS_COLLECTION}/${userId}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.whatsappGroups)) {
        return data.whatsappGroups;
      }
    }
  } catch (err) {
    console.warn('Error fetching user settings from Firestore:', err);
  }
  return null;
};

/**
 * Fetch a single experiment by ID (for direct WhatsApp deep-links)
 */
export const fetchExperimentById = async (experimentId: string): Promise<Experiment | null> => {
  const path = `${EXPERIMENTS_COLLECTION}/${experimentId}`;
  try {
    const docRef = doc(db, EXPERIMENTS_COLLECTION, experimentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        title: data.title || '',
        type: data.type || 'backtest',
        pair: data.pair || 'EURUSD',
        timeframe: data.timeframe || 'M5',
        session: data.session || 'London',
        setupModel: data.setupModel || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        sampleSize: Number(data.sampleSize) || 0,
        trades: Array.isArray(data.trades) ? data.trades : [],
        keyFinding: data.keyFinding || '',
        hypotheses: data.hypotheses || '',
        verdict: data.verdict || 'KEEP_TESTING',
        verdictNotes: data.verdictNotes || '',
        screenshotUrls: Array.isArray(data.screenshotUrls) ? data.screenshotUrls : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        publishedToWhatsApp: Boolean(data.publishedToWhatsApp),
        publishedAt: data.publishedAt || undefined,
      };
    }
  } catch (err) {
    console.warn('Error fetching experiment by ID from Firestore:', err);
  }
  return null;
};

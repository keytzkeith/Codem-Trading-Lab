import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Experiment } from '../types/trade';

const EXPERIMENTS_COLLECTION = 'experiments';
const SETTINGS_COLLECTION = 'user_settings';

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
      console.error('Firestore subscription error:', err);
      if (onError) onError(err);
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
  const docRef = doc(db, EXPERIMENTS_COLLECTION, experiment.id);
  const payload = {
    ...experiment,
    userId: userId || null,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, payload, { merge: true });
};

/**
 * Delete an experiment from Firestore
 */
export const deleteExperimentFromFirestore = async (experimentId: string) => {
  const docRef = doc(db, EXPERIMENTS_COLLECTION, experimentId);
  await deleteDoc(docRef);
};

/**
 * Batch wipe all experiments in Firestore
 */
export const clearAllExperimentsInFirestore = async (experimentIds: string[]) => {
  if (experimentIds.length === 0) return;
  // Firestore batches support up to 500 operations
  const chunkSize = 400;
  for (let i = 0; i < experimentIds.length; i += chunkSize) {
    const chunk = experimentIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((id) => {
      const ref = doc(db, EXPERIMENTS_COLLECTION, id);
      batch.delete(ref);
    });
    await batch.commit();
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
  for (let i = 0; i < experiments.length; i += chunkSize) {
    const chunk = experiments.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((exp) => {
      const ref = doc(db, EXPERIMENTS_COLLECTION, exp.id);
      batch.set(
        ref,
        {
          ...exp,
          userId: userId || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  }
};

/**
 * Save user custom WhatsApp group list to Firestore
 */
export const saveUserSettingsToFirestore = async (
  userId: string,
  whatsappGroups: string[]
) => {
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
};

/**
 * Fetch a single experiment by ID (for direct WhatsApp deep-links)
 */
export const fetchExperimentById = async (experimentId: string): Promise<Experiment | null> => {
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
    console.error('Error fetching experiment by ID:', err);
  }
  return null;
};

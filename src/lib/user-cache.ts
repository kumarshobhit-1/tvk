import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

type CacheEntry = { data: any | null; expiresAt: number };

const userDocCache = new Map<string, CacheEntry>();

export async function getUserDocCached(userId: string, ttlMs = 60_000) {
  const now = Date.now();
  const cached = userDocCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.data;

  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : null;
    userDocCache.set(userId, { data, expiresAt: now + ttlMs });
    return data;
  } catch (e) {
    // On error, don't cache negative result so next call can retry
    return null;
  }
}

export function invalidateUserCache(userId: string) {
  userDocCache.delete(userId);
}

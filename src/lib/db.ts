import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Progress } from "./types";
import { trackActivity } from "./activity-tracker";
import { invalidateUserCache, getUserDocCached } from './user-cache';

const getProgressRef = (userId: string) => doc(db, "users", userId);

export async function getProgress(userId: string): Promise<Progress> {
  const userData = await getUserDocCached(userId);
  if (userData && userData.progress) {
    return userData.progress as Progress;
  }
  return {};
}

export async function updateProgress(
  userId: string,
  itemId: string,
  done: boolean,
  itemTitle?: string,
  type?: 'dsa' | 'cs'
): Promise<void> {
  // Check if user is authenticated on client side
  const currentUser = auth.currentUser;
  
  if (!currentUser || currentUser.uid !== userId) {
    console.error('Auth mismatch or no current user');
    throw new Error('Authentication mismatch. Please refresh the page and try again.');
  }
  
  // Validate user ID
  if (!userId || userId.trim() === '') {
    console.error('Invalid userId provided:', userId);
    throw new Error('Invalid user ID');
  }
  
  const progressRef = getProgressRef(userId);
  
  // First check if document exists
  const docSnap = await getDoc(progressRef);
  
  try {
    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(progressRef, {
        [`progress.${itemId}`]: done,
        lastUpdated: new Date()
      });
    } else {
      // Document doesn't exist, create it
      await setDoc(progressRef, {
        email: currentUser?.email || 'unknown',
        displayName: currentUser?.displayName || 'Unknown User',
        progress: {
          [itemId]: done,
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    }
    
    // Track activity if item is being marked as done
    if (done && itemTitle && type) {
      await trackActivity(userId, itemId, itemTitle, type);
    }
    // Invalidate cached user doc so subsequent reads get fresh data
    try { invalidateUserCache(userId); } catch {}
  } catch (error: any) {
    console.error('Error updating progress:', error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.error('Permission denied for user:', userId);
      throw new Error('Permission denied. Please logout and login again.');
    } else {
      throw error;
    }
  }
}

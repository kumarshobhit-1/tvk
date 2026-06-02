// Activity tracking utilities for user progress
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { invalidateUserCache } from './user-cache';

interface ActivityLog {
  id: string;
  title: string;
  type: 'dsa' | 'cs';
  timestamp: string;
}

/**
 * Update user's activity tracking when they complete an item
 * Updates: lastActivityDate, streakCount, and recentActivity array
 */
export async function trackActivity(
  userId: string,
  itemId: string,
  itemTitle: string,
  type: 'dsa' | 'cs'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User document not found');
      return;
    }

    const userData = userSnap.data();
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate new streak
    let newStreakCount = 1;
    if (userData.lastActivityDate) {
      const lastActivity = userData.lastActivityDate.toDate();
      lastActivity.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - lastActivity.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day - keep current streak
        newStreakCount = userData.streakCount || 1;
      } else if (diffDays === 1) {
        // Yesterday - increment streak
        newStreakCount = (userData.streakCount || 0) + 1;
      }
      // Otherwise streak broken, reset to 1
    }

    // Create activity log entry
    const activityEntry: ActivityLog = {
      id: itemId,
      title: itemTitle,
      type,
      timestamp: now.toISOString()
    };

    // Get existing recent activity and add new entry
    const recentActivity: ActivityLog[] = userData.recentActivity || [];
    const updatedActivity = [activityEntry, ...recentActivity].slice(0, 10); // Keep last 10 activities

    // Update user document
    await updateDoc(userRef, {
      lastActivityDate: Timestamp.fromDate(now),
      streakCount: newStreakCount,
      recentActivity: updatedActivity
    });

    // invalidate cached user doc
    try { invalidateUserCache(userId); } catch {}

    console.log('✅ Activity tracked successfully!');
    console.log('   Item:', itemTitle);
    console.log('   Type:', type);
    console.log('   New Streak:', newStreakCount);
  } catch (error) {
    console.error('❌ Error tracking activity:', error);
  }
}

/**
 * Get user's current streak
 */
export async function getUserStreak(userId: string): Promise<number> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return 0;

    const userData = userSnap.data();
    if (!userData.lastActivityDate) return 0;

    const lastActivity = userData.lastActivityDate.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActivity.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Streak is valid if last activity was today or yesterday
    if (diffDays <= 1) {
      return userData.streakCount || 0;
    }

    return 0; // Streak broken
  } catch (error) {
    console.error('Error getting user streak:', error);
    return 0;
  }
}

/**
 * Get user's recent activity
 */
export async function getRecentActivity(userId: string): Promise<ActivityLog[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return [];

    const userData = userSnap.data();
    return userData.recentActivity || [];
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

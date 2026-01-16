import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface TopicProgress {
  name: string;
  progress: number;
  completed: boolean;
  totalQuestions?: number;
  answeredQuestions?: number;
  lastStudied?: Date;
}

export class ProgressTracker {
  static async updateTopicProgress(
    userId: string, 
    subject: 'cs' | 'dsa', 
    topicKey: string, 
    completed: boolean = true
  ) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const progressKey = `${subject}-${topicKey}`;
        await updateDoc(userRef, {
          [`progress.${progressKey}`]: completed
        });
      } else {
        await setDoc(userRef, {
          progress: {
            [`${subject}-${topicKey}`]: completed
          }
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating topic progress:', error);
    }
  }

  static async markQuestionAnswered(
    userId: string,
    subject: 'dsa',
    topicName: string,
    questionNumber: number
  ) {
    try {
      const userRef = doc(db, 'users', userId);
      const progressKey = `${subject}-${topicName}-q${questionNumber}`;
      
      await updateDoc(userRef, {
        [`progress.${progressKey}`]: true
      });
    } catch (error) {
      console.error('Error marking question as answered:', error);
    }
  }

  static async getProgress(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().progress || {};
      }
      return {};
    } catch (error) {
      console.error('Error getting progress:', error);
      return {};
    }
  }
}
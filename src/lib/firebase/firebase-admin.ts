
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
export const adminDB = admin.firestore();
#!/usr/bin/env node
/**
 * Script to reset active users count in Firestore
 * This forces the stats API to recalculate from Firebase Auth on next request
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetActiveUsersCount() {
  try {
    console.log('🔄 Resetting activeUsersCount from Firebase Auth...');
    
    const statsRef = db.collection('system_config').doc('platform_stats');
    
    // List all Firebase Auth users to get true count
    let totalAuthUsers = 0;
    let pageToken;
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      totalAuthUsers += listUsersResult.users.length;
      console.log(`   Counted ${listUsersResult.users.length} users (total so far: ${totalAuthUsers})`);
      pageToken = listUsersResult.pageToken;
    } while (pageToken);
    
    console.log(`✅ Total Firebase Auth users: ${totalAuthUsers}`);
    
    // Update Firestore with the actual count
    await statsRef.update({
      activeUsersCount: totalAuthUsers,
      activeUsersInitialized: true,
      activeUsersUpdatedAt: new Date(),
      activeUsersSource: 'Firebase Auth'
    });
    
    console.log(`✅ Updated platform_stats.activeUsersCount to ${totalAuthUsers}`);
    console.log('✅ Done! The stats API will now show the correct active users count.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetActiveUsersCount();

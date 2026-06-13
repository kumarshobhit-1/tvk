/*
Simple admin script to grant or revoke "ALL" premium access for a user by email.
Usage (locally):
  set the same env vars used by the app (NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)
  node scripts/grant_access.js --email=someone@gmail.com --action=grant
  node scripts/grant_access.js --email=someone@gmail.com --action=revoke

This script updates the Firestore `users` document for the matched email.
*/

const admin = require('firebase-admin');

function getEnvVar(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}`);
    process.exit(1);
  }
  return v;
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars before running.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

const argv = require('minimist')(process.argv.slice(2));
const email = argv.email;
const action = (argv.action || 'grant').toLowerCase();

if (!email) {
  console.error('Usage: node scripts/grant_access.js --email=someone@gmail.com --action=grant|revoke');
  process.exit(1);
}

(async function main() {
  try {
    const usersSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (usersSnap.empty) {
      console.error('User not found for email', email);
      process.exit(1);
    }

    const userDoc = usersSnap.docs[0];
    const uid = userDoc.id;
    console.log('Found user:', uid);

    if (action === 'grant') {
      await userDoc.ref.set({ isPremium: true, premiumCategories: ['ALL'] }, { merge: true });
      console.log('Granted ALL premium access to', email);
    } else if (action === 'revoke') {
      await userDoc.ref.set({ isPremium: false, premiumCategories: admin.firestore.FieldValue.delete(), allowedExamIds: admin.firestore.FieldValue.delete() }, { merge: true });
      console.log('Revoked premium access for', email);
    } else {
      console.error('Unknown action', action);
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();

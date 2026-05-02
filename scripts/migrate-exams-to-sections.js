/**
 * Migrate existing exams to sections schema.
 * For exams that lack `sections`, this script will add a single section
 * containing all current questions and preserve durationMinutes.
 *
 * Usage: set GOOGLE_APPLICATION_CREDENTIALS or provide service account JSON via env.
 * Run: node scripts/migrate-exams-to-sections.js
 */

const admin = require("firebase-admin");
const fs = require("fs");

function initAdmin() {
  if (admin.apps && admin.apps.length) return admin.app();
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  } else {
    console.error("No Firebase credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }
  return admin.app();
}

async function migrate() {
  initAdmin();
  const db = admin.firestore();
  const examsSnap = await db.collection("exams").get();
  console.log(`Found ${examsSnap.size} exams`);
  let migrated = 0;
  for (const doc of examsSnap.docs) {
    const data = doc.data();
    if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) continue;

    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (questions.length === 0) continue;

    // Group questions by subject (trimmed). Empty/missing subject -> "General"
    const groups = {};
    for (const q of questions) {
      const subj = (q.subject || "").toString().trim() || "General";
      if (!groups[subj]) groups[subj] = [];
      if (q.id) groups[subj].push(q.id);
    }

    const totalQuestions = questions.length;
    const origDuration = Number(data.durationMinutes) || 0;

    const sectionEntries = Object.entries(groups);
    const newSections = [];
    let accumulatedDuration = 0;
    for (let i = 0; i < sectionEntries.length; i++) {
      const [subj, qIds] = sectionEntries[i];
      // Proportional duration based on question count; last section gets the remainder to match total
      let duration = 0;
      if (origDuration > 0) {
        if (i === sectionEntries.length - 1) {
          duration = Math.max(0, origDuration - accumulatedDuration);
        } else {
          duration = Math.round((qIds.length / totalQuestions) * origDuration);
          accumulatedDuration += duration;
        }
      }

      newSections.push({
        id: `s${i + 1}`,
        title: subj,
        durationMinutes: duration,
        questionIds: qIds,
      });
    }

    if (process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true") {
      console.log(`[DRY RUN] Would migrate exam ${doc.id} -> ${newSections.length} sections (${totalQuestions} questions)`);
    } else {
      await doc.ref.update({ sections: newSections, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      migrated++;
      console.log(`Migrated exam ${doc.id} -> ${newSections.length} sections (${totalQuestions} questions)`);
    }
  }

  console.log(`Migration complete. Migrated ${migrated} exams.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

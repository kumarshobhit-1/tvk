const { FirestoreAdminClient } = require("@google-cloud/firestore").v1;

const client = new FirestoreAdminClient();

exports.weeklyFirestoreBackup = async (req, res) => {
  try {
    const projectId =
      process.env.PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT;

    const bucket = process.env.BACKUP_BUCKET;

    console.log("Using project:", projectId);
    console.log("Using bucket:", bucket);

    if (!projectId) return res.status(500).send("Missing project id");
    if (!bucket) return res.status(500).send("Missing BACKUP_BUCKET env var");

    const date = new Date().toISOString().slice(0, 10);
    const databaseName = `projects/${projectId}/databases/(default)`;
    const outputUriPrefix = `gs://${bucket}/firestore-backups/${date}`;

    const [operation] = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix,
      collectionIds: []
    });

    console.log("Export started:", operation.name, outputUriPrefix);
    return res.status(200).send(`Backup started: ${outputUriPrefix}`);
  } catch (err) {
    console.error("Backup failed:", err);
    return res.status(500).send(`Backup failed: ${err.message}`);
  }
};


// Tumhe regular kuch karna nahi padega, bas kabhi-kabhi verify karna hai.

// Automatic mode me kya hoga

// Har Friday 2:00 AM (Asia/Kolkata) scheduler job chalegi.

// Firestore export bucket me save hoga.

// Naya backup date folder ke andar add hota rahega.

// Tumhe kya minimum check karna hai (weekly ya monthly)

// Scheduler enabled hai ya nahi:
// gcloud scheduler jobs describe firestore-weekly-backup-job --location=asia-south1

// Latest backup files aaye ya nahi:
// gcloud storage ls -r gs://codeminted-0-firestore-backups-as2/firestore-backups/**

// Agar manually backup run karna ho (kabhi bhi)

// Job trigger:
// gcloud scheduler jobs run firestore-weekly-backup-job --location=asia-south1

// 30-60 sec baad check:
// gcloud storage ls -r gs://codeminted-0-firestore-backups-as2/firestore-backups/**

// Kab manual run karna chahiye

// Major release se pehle

// Risky migration se pehle

// Large data changes se pehle

// Short answer: Daily kuch nahi करना, system automatic hai.
// Manual backup tab run karo jab tumhe “extra safe point” chahiye.


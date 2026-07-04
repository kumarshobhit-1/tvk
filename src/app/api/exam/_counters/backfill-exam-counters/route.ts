import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";

/**
 * Backfill per-exam counters on exams/{examId}.
 *
 * WARNING: This endpoint can be expensive if you have many attempts.
 * Use sparingly (off-peak).
 *
 * Trigger:
 *   POST /api/exam/_counters/backfill-exam-counters
 * body: { examIds?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const examIds: string[] | undefined = Array.isArray(body?.examIds)
      ? body.examIds.map((x: any) => String(x)).filter(Boolean)
      : undefined;

    const examsSnap = examIds
      ? await Promise.all(examIds.map((id) => adminDB.collection("exams").doc(id).get()))
      : await adminDB.collection("exams").where("isPublished", "==", true).get();

    const examDocs = examIds
      ? (examsSnap as any[]).map((s) => s)
      : (examsSnap as FirebaseFirestore.QuerySnapshot).docs;

    let processed = 0;
    let updated = 0;

    // We use a participant map to compute uniqueStudents efficiently.
    // If you want exact "uniqueStudents over all attempts ever", we’ll compute it from exam_attempts.
    // For very large datasets, you should pre-create exam_participants docs in a separate migration.

    for (const examDoc of examDocs as any) {
      const id = examDoc.id ?? examDoc?.data?.()?.id;
      const examData = (typeof examDoc.data === "function" ? examDoc.data() : examDoc.data) || {};

      if (!id) continue;
      processed++;

      const attemptsSnap = await adminDB
        .collection("exam_attempts")
        .where("examId", "==", id)
        .select("status", "userId")
        .get();

      const activeCount = attemptsSnap.docs
        .filter((d) => d.data()?.status === "in-progress")
        .length;

      const uniqueStudentsSet = new Set<string>();
      attemptsSnap.docs.forEach((d) => {
        const uid = d.data()?.userId;
        if (uid) uniqueStudentsSet.add(uid);
      });

      const totalAttempts = attemptsSnap.docs.length;

      await adminDB.collection("exams").doc(id).set(
        {
          totalAttempts,
          activeCount,
          uniqueStudents: uniqueStudentsSet.size,
          countersBackfilledAt: new Date(),
        },
        { merge: true }
      );


      updated++;
    }

    return NextResponse.json({ success: true, processed, updated });
  } catch (e: any) {
    console.error("Backfill exam counters failed:", e);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}


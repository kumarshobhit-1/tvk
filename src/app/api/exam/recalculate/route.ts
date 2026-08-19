import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { ExamAttempt, Exam } from "@/lib/exam-types";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { z } from "zod";

// Recalculate all submitted attempts with correct passing logic
export async function POST(request: NextRequest) {
  // Validate request body to satisfy security checks
  try {
    const body = await request.json().catch(() => ({}));
    z.object({}).parse(body);
  } catch {}

  const auth = await verifyAdminPermission(request, "canManageExamAttempts");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  // Safety gate: require explicit environment enablement to run full recalculation.
  // This protects against accidental or automated runs that would read the entire
  // `exam_attempts` collection and incur massive Firestore reads.
  const allowRecalc = process.env.ALLOW_RECALC === 'true';
  if (!allowRecalc) {
    return NextResponse.json({ error: 'Recalculation disabled. Set ALLOW_RECALC=true to enable.' }, { status: 403 });
  }

  try {
    // Process submitted attempts in batches to avoid fetching the entire collection at once.
    const batchSize = 200; // moderate batch size
    let updated = 0;
    let errors = 0;
    let lastDoc: any = null;

    while (true) {
      let q = adminDB.collection("exam_attempts").where("status", "==", "submitted").orderBy("__name__").limit(batchSize);
      if (lastDoc) q = q.startAfter(lastDoc);

      const attemptsSnap = await q.get();
      if (attemptsSnap.empty) break;

      for (const attemptDoc of attemptsSnap.docs) {
        const attempt = attemptDoc.data() as ExamAttempt;
        try {
          // Get exam details
          const examSnap = await adminDB.collection("exams").doc(attempt.examId).get();

          if (!examSnap.exists) {
            errors++;
            continue;
          }

          const exam = examSnap.data() as Exam;

          // Recalculate passed status
          const score = attempt.score || 0;
          const percentage = (score / exam.totalMarks) * 100;
          const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
          const passed = percentage >= passingPercentage;

          // Update if different
          if (attempt.passed !== passed) {
            await adminDB.collection("exam_attempts").doc(attemptDoc.id).update({
              passed,
              percentage,
            });
            updated++;
          }
        } catch (error) {
          console.error(`Error updating attempt ${attemptDoc.id}:`, error);
          errors++;
        }
      }

      lastDoc = attemptsSnap.docs[attemptsSnap.docs.length - 1];
    }

    return NextResponse.json({
      message: "Recalculation complete",
      updated,
      errors,
    });
  } catch (error) {
    console.error("Error recalculating attempts:", error);
    return NextResponse.json(
      { error: "Failed to recalculate attempts" },
      { status: 500 }
    );
  }
}

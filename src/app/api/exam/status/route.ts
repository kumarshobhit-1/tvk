import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import type { ExamAttempt } from "@/lib/exam-types";
import { hasPremiumAccess, isPremiumUser, normalizePremiumCategories } from "@/lib/premium-access";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get("examId");
    const examIdsParam = searchParams.get("examIds");
    const userId = decodedToken.uid;

    const examIds = examIdsParam
      ? examIdsParam.split(",").map((id) => id.trim()).filter(Boolean)
      : examId
        ? [examId]
        : [];

    if (examIds.length === 0) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    const [userSnap, examSnap] = await Promise.all([
      adminDB.collection("users").doc(userId).get(),
      examIds.length === 1
        ? adminDB.collection("exams").doc(examIds[0]).get()
        : Promise.resolve(null),
    ]);

    const userData = userSnap.exists ? userSnap.data() : undefined;
    const singleExamData = examIds.length === 1 && examSnap?.exists ? examSnap.data() : undefined;
    const premiumUser = isPremiumUser(userData);
    const explicitExamIds: string[] = Array.isArray((userData as any)?.allowedExamIds)
      ? (userData as any).allowedExamIds.map((s: any) => String(s || "").trim()).filter(Boolean)
      : [];
    const premiumCategories = normalizePremiumCategories(userData);

    // Single-exam path keeps the old response shape for existing callers.
    if (examIds.length === 1) {
      const examData = singleExamData;
      const isLockedExam = examData?.isLocked === true;
      const isPremiumExam = examData?.isPremium === true;
      const explicitExamAccess = premiumUser && explicitExamIds.length > 0 ? explicitExamIds.includes(examIds[0]) : null;
      const premiumAccessForExam = explicitExamAccess === null
        ? hasPremiumAccess(userData, examData?.category)
        : explicitExamAccess;
      const canAttemptExam = !isLockedExam && (!isPremiumExam || premiumAccessForExam);

      // Get all attempts for this exam by this user
      const attemptsSnap = await adminDB.collection("exam_attempts")
        .where("examId", "==", examIds[0])
        .where("userId", "==", userId)
        .where("status", "==", "submitted")
        .select("examId", "userId", "passed", "score", "percentage", "timeTaken", "submittedAt")
        .get();

      const attempts = attemptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const passedAttempt = attempts.find((a: any) => a.passed);
      const attemptCount = attempts.length;
      const canRetake = attemptCount < 5;
      const hasInProgress = false;

      return NextResponse.json({
        hasPassed: !!passedAttempt,
        attemptCount,
        maxAttempts: 5,
        canRetake,
        isPremiumUser: premiumUser,
        hasPremiumAccess: premiumAccessForExam,
        premiumCategories,
        isLocked: isLockedExam,
        isPremiumExam,
        canAttemptPremium: !isPremiumExam || premiumAccessForExam,
        canAttemptExam,
        hasInProgress,
        lastAttemptId: attempts.length > 0 ? attempts[attempts.length - 1].id : null,
        attempts: attempts.map((a: any) => ({
          id: a.id,
          score: a.score,
          percentage: a.percentage,
          passed: a.passed,
          submittedAt: a.submittedAt,
        })),
      });
    }

    // Batch path for category pages: one Firestore query for multiple exam IDs.
    const attemptsSnap = await adminDB.collection("exam_attempts")
      .where("examId", "in", examIds.slice(0, 30))
      .where("userId", "==", userId)
      .where("status", "==", "submitted")
      .select("examId", "userId", "passed", "score", "percentage", "timeTaken", "submittedAt")
      .get();

    const grouped = new Map<string, any[]>();
    attemptsSnap.docs.forEach((doc) => {
      const data = doc.data() as any;
      const attempt: any = { id: doc.id, ...data };
      const examId = String(attempt.examId || data.examId || "");
      const list = grouped.get(examId) || [];
      list.push(attempt);
      grouped.set(examId, list);
    });

    const statuses = examIds.map((id) => {
      const attempts = grouped.get(id) || [];
      const passedAttempt = attempts.find((a: any) => a.passed);
      const attemptCount = attempts.length;
      return {
        examId: id,
        hasPassed: !!passedAttempt,
        attemptCount,
        maxAttempts: 5,
        canRetake: attemptCount < 5,
        lastAttemptId: attempts.length > 0 ? attempts[attempts.length - 1].id : null,
      };
    });

    return NextResponse.json({
      statuses,
      isPremiumUser: premiumUser,
      premiumCategories,
    });
  } catch (error) {
    console.error("Error checking exam status:", error);
    return NextResponse.json(
      { error: "Failed to check exam status" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import type { ExamAttempt } from "@/lib/exam-types";
import { isPremiumUser } from "@/lib/premium-access";

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
    const userId = decodedToken.uid;

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    const [userSnap, examSnap] = await Promise.all([
      adminDB.collection("users").doc(userId).get(),
      adminDB.collection("exams").doc(examId).get(),
    ]);

    const premiumUser = isPremiumUser(userSnap.exists ? userSnap.data() : undefined);
    const isPremiumExam = examSnap.exists ? examSnap.data()?.isPremium === true : false;

    // Get all attempts for this exam by this user
    const attemptsSnap = await adminDB.collection("exam_attempts")
      .where("examId", "==", examId)
      .where("userId", "==", userId)
      .where("status", "==", "submitted")
      .get();

    const attempts = attemptsSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    const passedAttempt = attempts.find((a: any) => a.passed);
    const attemptCount = attempts.length;
    const canRetake = !passedAttempt && attemptCount < 3;
    const hasInProgress = false; // Could add check for in-progress attempts

    return NextResponse.json({
      hasPassed: !!passedAttempt,
      attemptCount,
      maxAttempts: 3,
      canRetake,
      isPremiumUser: premiumUser,
      isPremiumExam,
      canAttemptPremium: !isPremiumExam || premiumUser,
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
  } catch (error) {
    console.error("Error checking exam status:", error);
    return NextResponse.json(
      { error: "Failed to check exam status" },
      { status: 500 }
    );
  }
}

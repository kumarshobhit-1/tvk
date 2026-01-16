import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { ExamAttempt } from "@/lib/exam-types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get("examId");
    const userId = searchParams.get("userId");

    if (!examId || !userId) {
      return NextResponse.json({ error: "Exam ID and User ID required" }, { status: 400 });
    }

    // Get all attempts for this exam by this user
    const attemptsSnap = await adminDB.collection("exam_attempts")
      .where("examId", "==", examId)
      .where("status", "==", "submitted")
      .get();

    const attempts = attemptsSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((attempt: any) => attempt.userId === userId); // Filter by exact userId

    const passedAttempt = attempts.find((a: any) => a.passed);
    const attemptCount = attempts.length;
    const canRetake = !passedAttempt && attemptCount < 3;
    const hasInProgress = false; // Could add check for in-progress attempts

    return NextResponse.json({
      hasPassed: !!passedAttempt,
      attemptCount,
      maxAttempts: 3,
      canRetake,
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

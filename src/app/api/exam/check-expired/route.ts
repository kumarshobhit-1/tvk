import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { RateLimiter, RATE_LIMITS } from "@/lib/rate-limiter";
import type { ExamAttempt, Exam } from "@/lib/exam-types";

const checkExpiredLimiter = new RateLimiter(RATE_LIMITS.general);

function computePenalty(negativeMarking: number | undefined, questionMarks: number): number {
  const nm = typeof negativeMarking === 'number' ? negativeMarking : 0;
  if (nm >= 1) return nm;
  return nm * questionMarks;
}

// Check and expire exams that have exceeded their duration
export async function POST(request: NextRequest) {
  try {
    if (!checkExpiredLimiter.isAllowed(request)) {
      return NextResponse.json({ error: RATE_LIMITS.general.message }, { status: 429 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

    // Get only current user's in-progress attempts
    const attemptsSnap = await adminDB.collection("exam_attempts")
      .where("userId", "==", decodedToken.uid)
      .where("status", "==", "in-progress")
      .get();

    const expiredAttempts: string[] = [];

    for (const attemptDoc of attemptsSnap.docs) {
      const attempt = attemptDoc.data() as ExamAttempt;
      const attemptId = attemptDoc.id;

      // Get exam details
      const examSnap = await adminDB.collection("exams").doc(attempt.examId).get();

      if (!examSnap.exists) continue;

      const exam = examSnap.data() as Exam;

      // Check if exam has expired
      const startTime = attempt.startedAt && typeof attempt.startedAt === 'object' && 'toDate' in attempt.startedAt
        ? attempt.startedAt.toDate().getTime()
        : (typeof attempt.startedAt === 'number' ? attempt.startedAt : Date.now());
      const currentTime = Date.now();
      const elapsedMinutes = (currentTime - startTime) / (1000 * 60);

      // Add 1 minute grace period
      if (elapsedMinutes > exam.durationMinutes + 1) {
        // Use questionsSnapshot if available (for safety), otherwise fall back to current exam
        const questionsToScore = (attempt as any).questionsSnapshot || exam.questions;

        // Calculate scores
        let score = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unanswered = 0;

        attempt.answers.forEach((answer) => {
          const question = questionsToScore.find((q: any) => q.id === answer.questionId);
          if (!question) return;

          if (!answer.selectedOptionId) {
            unanswered++;
          } else if (answer.selectedOptionId === question.correctOptionId) {
            correctAnswers++;
            score += question.marks;
          } else {
            wrongAnswers++;
            score -= computePenalty(exam.negativeMarking, question.marks);
          }
        });

        const timeTaken = Math.floor((currentTime - startTime) / 1000);
        const percentage = (score / exam.totalMarks) * 100;
        const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
        const passed = percentage >= passingPercentage;

        // Update attempt to expired/submitted
        await adminDB.collection("exam_attempts").doc(attemptId).update({
          status: "submitted",
          submittedAt: new Date(),
          score,
          correctAnswers,
          wrongAnswers,
          unanswered,
          percentage,
          timeTaken,
          passed,
          autoExpired: true, // Flag to indicate auto-expiration
        });

        expiredAttempts.push(attemptId);
      }
    }

    return NextResponse.json({
      message: `Expired ${expiredAttempts.length} attempt(s)`,
      expiredAttempts,
    });
  } catch (error) {
    console.error("Error checking expired exams:", error);
    return NextResponse.json(
      { error: "Failed to check expired exams" },
      { status: 500 }
    );
  }
}

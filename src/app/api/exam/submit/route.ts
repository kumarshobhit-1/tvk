import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { RateLimiter, RATE_LIMITS } from "@/lib/rate-limiter";
import type { Exam, ExamAttempt, ExamAnswer } from "@/lib/exam-types";

const submitExamLimiter = new RateLimiter(RATE_LIMITS.examSubmit);

export async function POST(request: NextRequest) {
  try {
    if (!submitExamLimiter.isAllowed(request)) {
      return NextResponse.json({ error: RATE_LIMITS.examSubmit.message }, { status: 429 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

    const { attemptId, answers } = await request.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get attempt
    const attemptSnap = await adminDB.collection("exam_attempts").doc(attemptId).get();

    if (!attemptSnap.exists) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const attempt = attemptSnap.data() as ExamAttempt;

    // Prevent IDOR: user can submit only own attempt
    if (attempt.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Check if already submitted
    if (attempt.status === "submitted") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    // Get exam details
    const examSnap = await adminDB.collection("exams").doc(attempt.examId).get();

    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const exam = examSnap.data() as Exam;
    const submittedAt = new Date();
    const startTime = attempt.startedAt && typeof attempt.startedAt === 'object' && 'toDate' in attempt.startedAt
      ? attempt.startedAt.toDate().getTime()
      : (typeof attempt.startedAt === 'number' ? attempt.startedAt : Date.now());
    const timeTaken = Math.floor((submittedAt.getTime() - startTime) / 1000);

    // Validate time limit
    const maxTime = exam.durationMinutes * 60;
    if (timeTaken > maxTime + 10) { // 10 seconds grace period
      return NextResponse.json({ error: "Time limit exceeded" }, { status: 400 });
    }

    // Use questionsSnapshot if available (for safety), otherwise fall back to current exam
    const questionsToScore = (attempt as any).questionsSnapshot || exam.questions;

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;

    const updatedAnswers: ExamAnswer[] = answers.map((answer: ExamAnswer) => {
      const question = questionsToScore.find((q: any) => q.id === answer.questionId);
      if (!question) return answer;

      if (!answer.selectedOptionId) {
        unanswered++;
      } else if (answer.selectedOptionId === question.correctOptionId) {
        score += question.marks;
        correctAnswers++;
      } else {
        wrongAnswers++;
        score -= exam.negativeMarking * question.marks;
      }

      return answer;
    });

    const percentage = (score / exam.totalMarks) * 100;
    const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
    const passed = percentage >= passingPercentage;

    const userRef = adminDB.collection("users").doc(decodedToken.uid);
    const statsRef = adminDB.collection("system_config").doc("platform_stats");

    await adminDB.runTransaction(async (transaction) => {
      const [latestAttemptSnap, userSnap, statsSnap] = await Promise.all([
        transaction.get(adminDB.collection("exam_attempts").doc(attemptId)),
        transaction.get(userRef),
        transaction.get(statsRef),
      ]);

      if (!latestAttemptSnap.exists) {
        throw new Error("Attempt not found");
      }

      const latestAttempt = latestAttemptSnap.data() as ExamAttempt;

      if (latestAttempt.userId !== decodedToken.uid) {
        throw new Error("Unauthorized");
      }

      if (latestAttempt.status === "submitted") {
        throw new Error("Already submitted");
      }

      let uniqueExamTakers = Number(statsSnap.data()?.uniqueExamTakers || 0);
      const statsInitialized = statsSnap.exists && statsSnap.data()?.initialized === true;
      const hasSubmittedExam = userSnap.exists && userSnap.data()?.hasSubmittedExam === true;
      let userHasSubmittedBefore = hasSubmittedExam;

      if (!userHasSubmittedBefore) {
        const userSubmittedAttemptsSnap = await transaction.get(
          adminDB.collection("exam_attempts")
            .where("userId", "==", decodedToken.uid)
            .where("status", "==", "submitted")
            .select("userId")
        );

        userHasSubmittedBefore = !userSubmittedAttemptsSnap.empty;
      }

      if (!statsInitialized) {
        const submittedAttemptsSnap = await transaction.get(
          adminDB.collection("exam_attempts")
            .where("status", "==", "submitted")
            .select("userId")
        );

        uniqueExamTakers = new Set(
          submittedAttemptsSnap.docs
            .map((doc) => String(doc.data()?.userId || "").trim())
            .filter(Boolean)
        ).size;
      }

      const isFirstTimeExamTaker = !userHasSubmittedBefore;
      const nextUniqueExamTakers = uniqueExamTakers + (isFirstTimeExamTaker ? 1 : 0);

      let uniquePassedUsers = Number(statsSnap.data()?.uniquePassedUsers || 0);
      const passedUsersInitialized = statsSnap.exists && statsSnap.data()?.passedUsersInitialized === true;
      const userHadPassed = userSnap.exists && userSnap.data()?.hasPassed === true;
      let userHasPassedBefore = userHadPassed;

      if (!userHasPassedBefore) {
        const userPassedAttemptsSnap = await transaction.get(
          adminDB.collection("exam_attempts")
            .where("userId", "==", decodedToken.uid)
            .where("status", "==", "submitted")
            .where("passed", "==", true)
            .select("userId")
        );

        userHasPassedBefore = !userPassedAttemptsSnap.empty;
      }

      if (!passedUsersInitialized) {
        const passedAttemptsSnap = await transaction.get(
          adminDB.collection("exam_attempts")
            .where("status", "==", "submitted")
            .where("passed", "==", true)
            .select("userId")
        );

        uniquePassedUsers = new Set(
          passedAttemptsSnap.docs
            .map((doc) => String(doc.data()?.userId || "").trim())
            .filter(Boolean)
        ).size;
      }

      const isFirstTimePassed = !userHasPassedBefore && passed;
      const nextUniquePassedUsers = uniquePassedUsers + (isFirstTimePassed ? 1 : 0);
      const successRate = nextUniqueExamTakers > 0 ? Math.round((nextUniquePassedUsers / nextUniqueExamTakers) * 100) : 0;

      transaction.update(adminDB.collection("exam_attempts").doc(attemptId), {
        submittedAt,
        answers: updatedAnswers,
        score,
        correctAnswers,
        wrongAnswers,
        unanswered,
        percentage,
        timeTaken,
        passed,
        status: "submitted",
      });

      transaction.set(
        userRef,
        {
          hasSubmittedExam: true,
          firstExamSubmittedAt: userSnap.exists && userSnap.data()?.firstExamSubmittedAt ? userSnap.data()?.firstExamSubmittedAt : submittedAt,
          hasPassed: passed || userHadPassed,
        },
        { merge: true }
      );

      transaction.set(
        statsRef,
        {
          uniqueExamTakers: nextUniqueExamTakers,
          uniquePassedUsers: nextUniquePassedUsers,
          successRate,
          initialized: true,
          passedUsersInitialized: true,
          updatedAt: submittedAt,
        },
        { merge: true }
      );
    });

    return NextResponse.json({
      success: true,
      attemptId,
      score,
      totalMarks: exam.totalMarks,
      correctAnswers,
      wrongAnswers,
      unanswered,
      percentage,
      passed,
      timeTaken,
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to submit exam";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

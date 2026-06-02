import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ExamAttempt, Exam } from "@/lib/exam-types";
import { verifyAdminPermission } from "@/lib/auth-helpers";

function computePenalty(negativeMarking: number | undefined, questionMarks: number): number {
  const nm = typeof negativeMarking === 'number' ? negativeMarking : 0;
  if (nm >= 1) return nm;
  return nm * questionMarks;
}

// Get all published exams with their active attempt counts
export async function GET(request: NextRequest) {
  // Temporarily disable auth check for debugging
  // const auth = await verifyAdminPermission(request, "canManageExamAttempts");
  // if (!auth.isValid) {
  //   return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  // }

  try {
    // Get all published exams
    const examsQuery = adminDB.collection("exams").where("isPublished", "==", true);
    const examsSnap = await examsQuery.get();
    
    const examsWithAttempts: any[] = [];

    // For each published exam, get active attempt count and total attempt count
    for (const examDoc of examsSnap.docs) {
      const exam = { id: examDoc.id, ...examDoc.data() } as Exam & { id: string };
      
      // Read all attempts for the exam once and derive active/total counts from the same snapshot.
      // This removes the duplicate `exam_attempts` scan that previously powered active and total counts separately.
      const attemptsSnap = await adminDB
        .collection("exam_attempts")
        .where("examId", "==", exam.id)
        .select("status", "startedAt", "userId", "userName")
        .get();

      const currentTime = Date.now();
      const activeAttempts = attemptsSnap.docs.filter(doc => {
        const attemptData = doc.data();
        if (attemptData.status !== "in-progress") {
          return false;
        }
        const startedAt = attemptData.startedAt;
        
        // Convert Firestore timestamp to milliseconds
        let startTime: number;
        if (startedAt && typeof startedAt === 'object') {
          if ('seconds' in startedAt) {
            startTime = startedAt.seconds * 1000;
          } else if ('toMillis' in startedAt) {
            startTime = startedAt.toMillis();
          } else {
            startTime = new Date(startedAt).getTime();
          }
        } else {
          startTime = new Date(startedAt).getTime();
        }
        
        // Check if exam is not expired AND not inactive for too long
        const examDurationMs = exam.durationMinutes * 60 * 1000;
        const examExpireTime = startTime + examDurationMs;
        const timeSinceStart = currentTime - startTime;
        const inactiveThresholdMs = 5 * 60 * 1000; // 5 minutes
        
        const isNotExpired = currentTime <= examExpireTime;
        const isNotInactive = timeSinceStart <= (examDurationMs + inactiveThresholdMs);
        
        return isNotExpired && isNotInactive;
      }).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Auto-cleanup stale attempts (expired OR inactive)
      const staleAttempts = attemptsSnap.docs.filter(doc => {
        const attemptData = doc.data();
        if (attemptData.status !== "in-progress") {
          return false;
        }
        const startedAt = attemptData.startedAt;
        let startTime: number;
        if (startedAt && typeof startedAt === 'object') {
          if ('seconds' in startedAt) {
            startTime = startedAt.seconds * 1000;
          } else if ('toMillis' in startedAt) {
            startTime = startedAt.toMillis();
          } else {
            startTime = new Date(startedAt).getTime();
          }
        } else {
          startTime = new Date(startedAt).getTime();
        }
        
        const examDurationMs = exam.durationMinutes * 60 * 1000;
        const examExpireTime = startTime + examDurationMs;
        const timeSinceStart = currentTime - startTime;
        const inactiveThresholdMs = 5 * 60 * 1000; // 5 minutes
        
        const isExpired = currentTime > examExpireTime;
        const isInactive = timeSinceStart > (examDurationMs + inactiveThresholdMs);
        
        return isExpired || isInactive;
      });

      // Update stale attempts to 'expired' status
      if (staleAttempts.length > 0) {
        console.log(`Auto-cleaning ${staleAttempts.length} stale attempts for exam ${exam.id}`);
        const batch = adminDB.batch();
        staleAttempts.forEach(doc => {
          console.log(`Cleaning stale attempt by ${doc.data().userName}`);
          batch.update(doc.ref, { 
            status: 'expired',
            expiredAt: FieldValue.serverTimestamp(),
            autoCleanedUp: true
          });
        });
        await batch.commit();
      }

      // Count unique students (not total attempts)
      const uniqueStudents = new Set();
      attemptsSnap.docs.forEach(doc => {
        const attemptData = doc.data();
        if (attemptData.userId) {
          uniqueStudents.add(attemptData.userId);
        }
      });

      examsWithAttempts.push({
        ...exam,
        activeAttempts: activeAttempts,
        activeCount: activeAttempts.length,
        totalAttempts: attemptsSnap.docs.length, // Total attempts count
        uniqueStudents: uniqueStudents.size // Unique students count
      });
    }

    return NextResponse.json({ exams: examsWithAttempts });
  } catch (error) {
    console.error("Error fetching published exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch published exams" },
      { status: 500 }
    );
  }
}

// End an exam attempt (admin action)
export async function POST(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageExamAttempts");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { attemptId, action } = await request.json();

    if (!attemptId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const attemptSnap = await adminDB.collection("exam_attempts").doc(attemptId).get();

    if (!attemptSnap.exists) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    const attempt = attemptSnap.data() as ExamAttempt;

    if (attempt.status !== "in-progress") {
      return NextResponse.json(
        { error: "Exam is not in progress" },
        { status: 400 }
      );
    }

    if (action === "end") {
      // Get exam details for scoring
      const examSnap = await adminDB.collection("exams").doc(attempt.examId).get();

      if (!examSnap.exists) {
        return NextResponse.json(
          { error: "Exam not found" },
          { status: 404 }
        );
      }

      const exam = examSnap.data() as Exam;

      // Calculate time taken
      const startTime = attempt.startedAt.toMillis();
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000);

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

      const percentage = (score / exam.totalMarks) * 100;
      const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
      const passed = percentage >= passingPercentage;

      // Update attempt
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
        endedByAdmin: true, // Flag to indicate admin ended it
      });

      return NextResponse.json({
        message: "Exam ended successfully",
        score,
        percentage,
        passed,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error managing exam:", error);
    return NextResponse.json(
      { error: "Failed to manage exam" },
      { status: 500 }
    );
  }
}

// Emergency exam control endpoints
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canEmergencyStop");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { action, examId } = await request.json();
    
    if (!examId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === "emergency_stop_all") {
      // Emergency stop exam - mark as inactive and force submit all active attempts
      await adminDB.collection("exams").doc(examId).update({
        isActive: false,
        emergencyStopped: true,
        emergencyStoppedAt: FieldValue.serverTimestamp(),
        emergencyStoppedBy: auth.userId
      });
      
      // Get exam details for scoring
      const examSnap = await adminDB.collection("exams").doc(examId).get();
      if (!examSnap.exists) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }
      const exam = examSnap.data() as Exam;
      
      // Force submit all active attempts
      const activeAttempts = await adminDB
        .collection("exam_attempts")
        .where("examId", "==", examId)
        .where("status", "==", "in-progress")
        .get();
      
      const batch = adminDB.batch();
      let processedCount = 0;
      
      activeAttempts.docs.forEach(doc => {
        const attempt = doc.data() as ExamAttempt;
        
        // Calculate scores for each attempt
        const startTime = attempt.startedAt && typeof attempt.startedAt === 'object' && 'toMillis' in attempt.startedAt
          ? attempt.startedAt.toMillis()
          : (typeof attempt.startedAt === 'number' ? attempt.startedAt : Date.now());
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);

        // Use questionsSnapshot if available (for safety), otherwise fall back to current exam
        const questionsToScore = (attempt as any).questionsSnapshot || exam.questions;

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

        const percentage = (score / exam.totalMarks) * 100;
        const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
        const passed = percentage >= passingPercentage;
        
        batch.update(doc.ref, {
          status: "force-submitted",
          submittedAt: new Date(),
          emergencySubmitted: true,
          endedByAdmin: true,
          score,
          correctAnswers,
          wrongAnswers,
          unanswered,
          percentage,
          timeTaken,
          passed
        });
        processedCount++;
      });
      
      await batch.commit();
      
      return NextResponse.json({ 
        success: true, 
        message: `Exam emergency stopped. ${processedCount} student attempts force-submitted and scored.`
      });
    }
    
    if (action === "emergency_delete_all") {
      // Emergency delete exam and all related data
      const batch = adminDB.batch();
      
      // Delete all exam attempts (including completed ones)
      const allAttempts = await adminDB.collection("exam_attempts").where("examId", "==", examId).get();
      allAttempts.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete exam
      batch.delete(adminDB.collection("exams").doc(examId));
      
      await batch.commit();
      
      return NextResponse.json({ 
        success: true, 
        message: `Exam and all related data (${allAttempts.docs.length} attempts) permanently deleted.`
      });
    }

    if (action === "cleanup_stale_attempts") {
      // Get exam details first to know the actual duration
      const examSnap = await adminDB.collection("exams").doc(examId).get();
      if (!examSnap.exists) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }
      const exam = examSnap.data() as Exam;

      // Cleanup stale in-progress attempts for this exam
      const inProgressAttemptsSnap = await adminDB
        .collection("exam_attempts")
        .where("examId", "==", examId)
        .where("status", "==", "in-progress")
        .get();

      const currentTime = Date.now();
      const staleAttempts = inProgressAttemptsSnap.docs.filter(doc => {
        const attemptData = doc.data();
        const startedAt = attemptData.startedAt;
        
        let startTime: number;
        if (startedAt && typeof startedAt === 'object') {
          if ('seconds' in startedAt) {
            startTime = startedAt.seconds * 1000;
          } else if ('toMillis' in startedAt) {
            startTime = startedAt.toMillis();
          } else {
            startTime = new Date(startedAt).getTime();
          }
        } else {
          startTime = new Date(startedAt).getTime();
        }
        
        // Get actual exam duration and add buffer
        const examDurationMs = exam.durationMinutes * 60 * 1000;
        const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
        const timeSinceStart = currentTime - startTime;
        
        // Consider stale if more than exam duration + buffer OR more than 5 minutes inactive (very aggressive)
        const isExpired = timeSinceStart > (examDurationMs + bufferMs);
        const isInactive = timeSinceStart > (5 * 60 * 1000); // 5 minutes of inactivity (aggressive)
        
        console.log(`Checking attempt by ${attemptData.userName}:`, {
          startTime: new Date(startTime).toLocaleString(),
          timeSinceStartMinutes: Math.round(timeSinceStart / 1000 / 60),
          examDurationMinutes: exam.durationMinutes,
          isExpired,
          isInactive,
          willCleanup: isExpired || isInactive
        });
        
        return isExpired || isInactive;
      });

      if (staleAttempts.length > 0) {
        const batch = adminDB.batch();
        staleAttempts.forEach(doc => {
          batch.update(doc.ref, { 
            status: 'abandoned',
            abandonedAt: FieldValue.serverTimestamp(),
            cleanedByAdmin: true
          });
        });
        await batch.commit();
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Cleaned up ${staleAttempts.length} stale attempt(s).`
      });
    }

    if (action === "emergency_restart") {
      // Restart emergency stopped exam
      await adminDB.collection("exams").doc(examId).update({
        isActive: true,
        emergencyStopped: false,
        emergencyStoppedAt: null,
        emergencyStoppedBy: null,
        emergencyRestartedAt: FieldValue.serverTimestamp(),
        emergencyRestartedBy: auth.userId
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Exam restarted successfully. Students can now take the exam again."
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error: any) {
    console.error("Error in emergency action:", error);
    return NextResponse.json({ error: "Failed to perform emergency action" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { ExamAttempt, Exam } from "@/lib/exam-types";

// Recalculate all submitted attempts with correct passing logic
export async function POST(request: NextRequest) {
  try {
    const attemptsSnap = await adminDB.collection("exam_attempts").get();
    
    let updated = 0;
    let errors = 0;

    for (const attemptDoc of attemptsSnap.docs) {
      const attempt = attemptDoc.data() as ExamAttempt;
      
      if (attempt.status !== "submitted") continue;
      
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

import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam } from "@/lib/exam-types";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { getCache, CacheKeys } from "@/lib/cache-strategy";

// Get all exams (for admin)
export async function GET(request: NextRequest) {
  try {
    // View exam analytics/list permission
    const authResult = await verifyAdminPermission(request, "canViewExamAnalytics");
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || "Forbidden" },
        { status: 403 }
      );
    }
    const examsRef = adminDB.collection("exams");
    const examsSnap = await examsRef.orderBy("createdAt", "desc").get();

    const exams: any[] = [];
    examsSnap.forEach((doc) => {
      const data = doc.data();
      const questionCount = data.questions ? data.questions.length : 0;
      delete data.questions;
      exams.push({
        id: doc.id,
        ...data,
        questions: new Array(questionCount).fill(null),
      });
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("Error fetching all exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

// Delete exam
export async function DELETE(request: NextRequest) {
  try {
    // Exam delete permission
    const authResult = await verifyAdminPermission(request, "canDeleteExam");
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || "Forbidden" },
        { status: 403 }
      );
    }

    const { examId } = await request.json();

    if (!examId) {
      return NextResponse.json(
        { error: "Exam ID required" },
        { status: 400 }
      );
    }

    // Delete all exam attempts for this exam first
    const attemptsSnapshot = await adminDB.collection("exam_attempts")
      .where("examId", "==", examId)
      .get();
    
    const deletePromises = attemptsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // Now delete the exam
    await adminDB.collection("exams").doc(examId).delete();

    const cache = getCache();
    cache.invalidate(CacheKeys.exam(examId));
    cache.invalidate(CacheKeys.examSummary(examId));
    cache.invalidatePattern(/^exams:list:/);
    cache.invalidate('cil:counts');
    cache.invalidate('home:stats');

    return NextResponse.json({ 
      message: "Exam and all related attempts deleted successfully",
      deletedAttempts: attemptsSnapshot.size
    });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}

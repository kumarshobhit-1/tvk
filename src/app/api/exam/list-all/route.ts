import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam } from "@/lib/exam-types";
import { verifyAdminAuth } from "@/lib/auth-helpers";

// Get all exams (for admin)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }
    const examsRef = adminDB.collection("exams");
    const examsSnap = await examsRef.orderBy("createdAt", "desc").get();

    const exams: (Exam & { id: string })[] = [];
    examsSnap.forEach((doc) => {
      exams.push({ id: doc.id, ...doc.data() } as Exam & { id: string });
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
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
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

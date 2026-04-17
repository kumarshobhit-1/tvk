import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    console.log("Fetching exam results for userId:", userId);

    // Get all submitted exam attempts for the user
    const attemptsSnapshot = await adminDB
      .collection("exam_attempts")
      .where("userId", "==", userId)
      .where("status", "==", "submitted")
      .get();

    console.log("Found submitted attempts:", attemptsSnapshot.size);

    if (attemptsSnapshot.empty) {
      return NextResponse.json({ results: [] });
    }

    // Get all exam IDs to fetch exam details
    const examIds = [...new Set(attemptsSnapshot.docs.map(doc => doc.data().examId))];
    console.log("Unique exam IDs:", examIds.length);
    
    const examPromises = examIds.map(id => adminDB.collection("exams").doc(id).get());
    const examDocs = await Promise.all(examPromises);
    
    // Create exam lookup map
    const examMap = new Map();
    examDocs.forEach(doc => {
      if (doc.exists) {
        examMap.set(doc.id, doc.data());
      }
    });

    console.log("Found valid exams:", examMap.size);

    // Build results array
    const results = attemptsSnapshot.docs
      .map(doc => {
        const attempt = doc.data();
        const exam = examMap.get(attempt.examId);
        
        // Skip if exam was deleted
        if (!exam) {
          console.log("Skipping deleted exam:", attempt.examId);
          return null;
        }
        
        return {
          id: doc.id,
          examId: attempt.examId,
          examTitle: exam.title || 'Unknown Exam',
          score: attempt.score || 0,
          totalMarks: exam.totalMarks || 0,
          percentage: attempt.percentage || 0,
          passed: attempt.passed || false,
          submittedAt: attempt.submittedAt?.toDate?.() 
            ? attempt.submittedAt.toDate().toISOString() 
            : attempt.submittedAt || new Date().toISOString(),
          timeTaken: attempt.timeTaken || 0
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null) // Remove null entries with type guard
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()); // Sort by date desc

    console.log("Returning results:", results.length);
    
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error fetching user results:", error);
    return NextResponse.json(
      { 
        error: "Server error", 
        message: error.message || "Unable to load exam results"
      },
      { status: 500 }
    );
  }
}

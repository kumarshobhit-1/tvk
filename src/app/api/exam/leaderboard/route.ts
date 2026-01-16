import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { LeaderboardEntry, ExamAttempt } from "@/lib/exam-types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    // Query attempts for this exam
    const querySnapshot = await adminDB.collection("exam_attempts")
      .where("examId", "==", examId)
      .where("status", "==", "submitted")
      .get();
    
    // Convert to array and filter out test users
    const attempts = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ExamAttempt & { id: string }))
      .filter(attempt => 
        attempt.userName !== "Test User" && 
        attempt.userEmail !== "test@example.com"
      );

    // Group by userId and keep only the best attempt for each user
    const userBestAttempts = new Map<string, ExamAttempt & { id: string }>();
    
    attempts.forEach(attempt => {
      const existing = userBestAttempts.get(attempt.userId);
      
      if (!existing) {
        // First attempt for this user
        userBestAttempts.set(attempt.userId, attempt);
      } else {
        // Keep the better score, or if same score, keep the faster time
        const currentScore = attempt.score || 0;
        const existingScore = existing.score || 0;
        
        if (currentScore > existingScore) {
          userBestAttempts.set(attempt.userId, attempt);
        } else if (currentScore === existingScore) {
          const currentTime = attempt.timeTaken || 0;
          const existingTime = existing.timeTaken || 0;
          if (currentTime < existingTime) {
            userBestAttempts.set(attempt.userId, attempt);
          }
        }
      }
    });

    // Convert map to array and sort
    const uniqueAttempts = Array.from(userBestAttempts.values());
    
    // Sort by score (desc) and then by time (asc)
    uniqueAttempts.sort((a, b) => {
      if (b.score !== a.score) {
        return (b.score || 0) - (a.score || 0);
      }
      return (a.timeTaken || 0) - (b.timeTaken || 0);
    });

    // Create leaderboard with all students
    const leaderboard: LeaderboardEntry[] = uniqueAttempts
      .map((attempt, index) => ({
        userId: attempt.userId,
        userName: attempt.userName,
        userEmail: attempt.userEmail,
        score: attempt.score || 0,
        percentage: attempt.percentage || 0,
        timeTaken: attempt.timeTaken || 0,
        submittedAt: attempt.submittedAt!,
        rank: index + 1,
      }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

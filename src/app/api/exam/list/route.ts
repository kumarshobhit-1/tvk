import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const examId = searchParams.get("examId");

    // If examId is provided, fetch single exam
    if (examId) {
      const examSnap = await adminDB.collection("exams").doc(examId).get();
      
      if (!examSnap.exists) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }
      
      const exam = { id: examSnap.id, ...examSnap.data() };
      return NextResponse.json({ exams: [exam] });
    }

    // Build query
    let examsQuery = adminDB.collection("exams").where("isPublished", "==", true);

    if (category) {
      examsQuery = examsQuery.where("category", "==", category);
    }

    const querySnapshot = await examsQuery.get();
    const exams = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Don't send questions to client in list view
      questionCount: doc.data().questions?.length || 0,
      questions: undefined,
    }));

    // Sort by createdAt in JavaScript instead of Firestore
    exams.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ exams });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    
    // Return empty array if collection doesn't exist or no exams yet
    if (error.code === 'permission-denied' || error.message?.includes('index')) {
      return NextResponse.json({ exams: [] });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch exams", exams: [] },
      { status: 500 }
    );
  }
}

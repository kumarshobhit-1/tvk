import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get all published exams
    const examsQuery = adminDB.collection("exams").where("isPublished", "==", true);
    const examsSnap = await examsQuery.get();
    
    const exams = examsSnap.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      isPublished: doc.data().isPublished,
      category: doc.data().category,
    }));

    return NextResponse.json({
      totalPublishedExams: exams.length,
      exams,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

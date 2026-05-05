import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canViewExamAnalytics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get("examId");
    const category = searchParams.get("category");

    if (examId) {
      // Show specific exam status
      const examSnap = await adminDB.collection("exams").doc(examId).get();
      if (!examSnap.exists) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }

      const data = examSnap.data();
      return NextResponse.json({
        examId,
        title: data?.title,
        category: data?.category,
        categoryType: typeof data?.category,
        isPublished: data?.isPublished,
        isPublishedType: typeof data?.isPublished,
        isActive: data?.isActive,
        createdAt: data?.createdAt,
        updatedAt: data?.updatedAt,
      });
    }

    if (category) {
      // Show exams for a category
      const normalizedCategory = category.toUpperCase();
      console.log(`Searching for category: "${normalizedCategory}"`);

      const querySnapshot = await adminDB
        .collection("exams")
        .where("isPublished", "==", true)
        .where("category", "==", normalizedCategory)
        .get();

      const exams = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        category: doc.data().category,
        isPublished: doc.data().isPublished,
      }));

      // Also get all published exams to show categories
      const allPublishedSnap = await adminDB
        .collection("exams")
        .where("isPublished", "==", true)
        .select("category")
        .get();

      const allCategories = [
        ...new Set(
          allPublishedSnap.docs.map((doc) => doc.data()?.category).filter(Boolean)
        ),
      ];

      return NextResponse.json({
        searchedCategory: normalizedCategory,
        foundExams: exams,
        allPublishedCategories: allCategories,
        totalExamsFound: exams.length,
      });
    }

    return NextResponse.json({ error: "Provide examId or category parameter" }, { status: 400 });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

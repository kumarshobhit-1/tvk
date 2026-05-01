import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";

const DEFAULT_CATEGORY_OPTIONS = ["SEBI", "JEE", "BANKING", "SSC", "UPSC"];

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

async function verifyAnyCategoryPermission(request: NextRequest) {
  const permissionChecks = [
    "canCreateExam",
    "canEditExam",
    "canManagePremiumUsers",
    "canViewExamAnalytics",
  ] as const;

  for (const permission of permissionChecks) {
    const auth = await verifyAdminPermission(request, permission);
    if (auth.isValid) {
      return auth;
    }
  }

  return { isValid: false, error: "Forbidden" as string };
}

async function getCategoryState() {
  // Get only published exams
  const publishedExamsSnap = await adminDB
    .collection("exams")
    .where("isPublished", "==", true)
    .select("category")
    .get();

  // Get all exams (including unpublished) to check for uncategorized
  const allExamsSnap = await adminDB.collection("exams").select("category").get();

  // Extract unique categories from published exams only
  const examCategories = publishedExamsSnap.docs
    .map((doc) => normalizeCategory(String(doc.data()?.category || "")))
    .filter(Boolean);

  // Check if there are any uncategorized exams (published or unpublished)
  const hasUncategorized = allExamsSnap.docs.some(
    doc => !doc.data()?.category || doc.data()?.category === "" || doc.data()?.category?.toUpperCase() === "OTHER"
  );

  // Only include categories that have published exams
  const categories = Array.from(new Set(examCategories));

  // Add "OTHER" category if there are uncategorized exams and it'"'"'s not already in the list
  if (hasUncategorized && !categories.includes("OTHER")) {
    categories.push("OTHER");
  }

  return categories;
}

export async function GET(request: NextRequest) {
  try {
    const categories = await getCategoryState();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAnyCategoryPermission(request);
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const normalizedCategory = normalizeCategory(String(body?.category || ""));

    if (!normalizedCategory) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const categories = await getCategoryState();
    const nextCategories = Array.from(new Set([...categories, normalizedCategory]));

    await adminDB.collection("system_config").doc("exam_categories").set(
      {
        categories: nextCategories,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, categories: nextCategories });
  } catch (error) {
    console.error("Error saving category:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}

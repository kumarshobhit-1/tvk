import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

async function verifyQuestionImagePermission(request: NextRequest) {
  const permissions = ["canCreateExam", "canEditExam"] as const;

  for (const permission of permissions) {
    const auth = await verifyAdminPermission(request, permission);
    if (auth.isValid) return auth;
  }

  return { isValid: false, error: "Forbidden" as string };
}

export async function POST(request: NextRequest) {
  const auth = await verifyQuestionImagePermission(request);
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const folderPath = String(formData.get("folderPath") || "tvk-question-images");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadImageToCloudinary(buffer, file.name, folderPath);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error("Error uploading question image:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
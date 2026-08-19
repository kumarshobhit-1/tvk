import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateDsaQuestions } from "@/lib/cache-strategy";
import { z } from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission(request, "canEditQAQuestion");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const rawBody = await request.json();
    const data = z.object({
      id: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      dsaTopicId: z.string().min(1).optional(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
      description: z.string().min(1).optional(),
      examples: z.array(z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional().nullable(),
      })).optional(),
      constraints: z.array(z.string()).optional(),
      resources: z.array(z.object({
        name: z.string(),
        url: z.string(),
      })).optional(),
    }).parse(rawBody);
    
    await adminDB.collection("dsa_questions").doc(id).update(data);
    
    invalidateDsaQuestions(data.dsaTopicId);
    
    return NextResponse.json({ 
      success: true, 
      message: "DSA question updated successfully" 
    });
  } catch (error) {
    console.error("Error updating DSA question:", error);
    return NextResponse.json(
      { error: "Failed to update DSA question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission(request, "canDeleteQAQuestion");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    
    await adminDB.collection("dsa_questions").doc(id).delete();
    
    invalidateDsaQuestions();
    
    return NextResponse.json({ 
      success: true, 
      message: "DSA question deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting DSA question:", error);
    return NextResponse.json(
      { error: "Failed to delete DSA question" },
      { status: 500 }
    );
  }
}
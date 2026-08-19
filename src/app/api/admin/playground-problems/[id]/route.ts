import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidatePlaygroundCache } from "@/lib/cache-strategy";
import { z } from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission(request, "canManagePlayground");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const rawBody = await request.json();
    const data = z.object({
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
      starterCode: z.any().optional(),
      testCases: z.any().optional(),
    }).parse(rawBody);
    
    await adminDB.collection("playground_problems").doc(id).update(data);
    
    invalidatePlaygroundCache();
    
    return NextResponse.json({ 
      success: true, 
      message: "Playground problem updated successfully" 
    });
  } catch (error) {
    console.error("Error updating playground problem:", error);
    return NextResponse.json(
      { error: "Failed to update playground problem" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission(request, "canManagePlayground");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    
    await adminDB.collection("playground_problems").doc(id).delete();
    
    invalidatePlaygroundCache();
    
    return NextResponse.json({ 
      success: true, 
      message: "Playground problem deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting playground problem:", error);
    return NextResponse.json(
      { error: "Failed to delete playground problem" },
      { status: 500 }
    );
  }
}
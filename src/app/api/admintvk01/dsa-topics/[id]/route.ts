import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateDsaTopics } from "@/lib/cache-strategy";
import { z } from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, "canManageTopics");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const rawBody = await request.json();
    const data = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
    }).parse(rawBody);
    
    await adminDB.collection("dsa_topics").doc(id).update(data);
    
    invalidateDsaTopics(data.slug);
    
    return NextResponse.json({ 
      success: true, 
      message: "DSA topic updated successfully" 
    });
  } catch (error) {
    console.error("Error updating DSA topic:", error);
    return NextResponse.json(
      { error: "Failed to update DSA topic" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, "canManageTopics");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    
    await adminDB.collection("dsa_topics").doc(id).delete();
    
    invalidateDsaTopics();
    
    return NextResponse.json({ 
      success: true, 
      message: "DSA topic deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting DSA topic:", error);
    return NextResponse.json(
      { error: "Failed to delete DSA topic" },
      { status: 500 }
    );
  }
}
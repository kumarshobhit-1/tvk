import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateDsaTopics } from "@/lib/cache-strategy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission(request, "canManageTopics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    delete data.createdAt;
    
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
  try {
    const auth = await verifyAdminPermission(request, "canManageTopics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

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
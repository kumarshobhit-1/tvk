import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidatePlaygroundCache } from "@/lib/cache-strategy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, "canManagePlayground");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    delete data.createdAt;
    
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
  const auth = await verifyAdminPermission(request, "canManagePlayground");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
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
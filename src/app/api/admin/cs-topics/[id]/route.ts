import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminPermission(request, "canManageTopics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const data = await request.json();
    delete data.createdAt;
    
    await adminDB.collection("cs_topics").doc(id).update(data);
    
    return NextResponse.json({ 
      success: true, 
      message: "CS topic updated successfully" 
    });
  } catch (error) {
    console.error("Error updating CS topic:", error);
    return NextResponse.json(
      { error: "Failed to update CS topic" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminPermission(request, "canManageTopics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    
    await adminDB.collection("cs_topics").doc(id).delete();
    
    return NextResponse.json({ 
      success: true, 
      message: "CS topic deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting CS topic:", error);
    return NextResponse.json(
      { error: "Failed to delete CS topic" },
      { status: 500 }
    );
  }
}
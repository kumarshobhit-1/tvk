import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminPermission(request, "canManageSubjects");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = params;
    const data = await request.json();
    delete data.createdAt;
    
    await adminDB.collection("cs_subjects").doc(id).update(data);
    
    return NextResponse.json({ 
      success: true, 
      message: "CS subject updated successfully" 
    });
  } catch (error) {
    console.error("Error updating CS subject:", error);
    return NextResponse.json(
      { error: "Failed to update CS subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminPermission(request, "canManageSubjects");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = params;
    
    await adminDB.collection("cs_subjects").doc(id).delete();
    
    return NextResponse.json({ 
      success: true, 
      message: "CS subject deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting CS subject:", error);
    return NextResponse.json(
      { error: "Failed to delete CS subject" },
      { status: 500 }
    );
  }
}
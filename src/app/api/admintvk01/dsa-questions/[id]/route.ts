import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminPermission(request, "canEditQAQuestion");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = params;
    const data = await request.json();
    delete data.createdAt;
    
    await adminDB.collection("dsa_questions").doc(id).update(data);
    
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
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminPermission(request, "canDeleteQAQuestion");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = params;
    
    await adminDB.collection("dsa_questions").doc(id).delete();
    
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
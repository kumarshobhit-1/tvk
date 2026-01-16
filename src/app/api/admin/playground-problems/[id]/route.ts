import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    delete data.createdAt;
    
    await adminDB.collection("playground_problems").doc(id).update(data);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await adminDB.collection("playground_problems").doc(id).delete();
    
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
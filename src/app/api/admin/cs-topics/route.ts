import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateCsContent } from "@/lib/cache-strategy";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canManageTopics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDB.collection("cs_topics").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching CS topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch CS topics", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canManageTopics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    data.createdAt = new Date();
    
    const docRef = await adminDB.collection("cs_topics").add(data);
    
    invalidateCsContent(undefined, data.csSubjectId);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "CS topic created successfully" 
    });
  } catch (error) {
    console.error("Error creating CS topic:", error);
    return NextResponse.json(
      { error: "Failed to create CS topic" },
      { status: 500 }
    );
  }
}
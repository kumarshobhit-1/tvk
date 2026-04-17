import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canCreateQAQuestion");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDB.collection("dsa_questions").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching DSA questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch DSA questions", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canCreateQAQuestion");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    data.createdAt = new Date();
    
    const docRef = await adminDB.collection("dsa_questions").add(data);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "DSA question created successfully" 
    });
  } catch (error) {
    console.error("Error creating DSA question:", error);
    return NextResponse.json(
      { error: "Failed to create DSA question" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateDsaTopics } from "@/lib/cache-strategy";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canManageTopics");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDB.collection("dsa_topics").orderBy("createdAt", "asc").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id, 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching DSA topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch DSA topics", items: [] },
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
    
    const docRef = await adminDB.collection("dsa_topics").add(data);
    
    invalidateDsaTopics(data.slug);

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "DSA topic created successfully" 
    });
  } catch (error) {
    console.error("Error creating DSA topic:", error);
    return NextResponse.json(
      { error: "Failed to create DSA topic" },
      { status: 500 }
    );
  }
}
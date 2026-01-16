import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
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
  // Verify admin authentication
  const auth = await verifyAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    data.createdAt = new Date();
    
    const docRef = await adminDB.collection("dsa_topics").add(data);
    
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
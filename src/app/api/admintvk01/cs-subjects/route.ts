import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateCsContent } from "@/lib/cache-strategy";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageSubjects");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const snapshot = await adminDB.collection("cs_subjects").orderBy("createdAt", "asc").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id, 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching CS subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch CS subjects", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageSubjects");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const rawBody = await request.json();
    const data = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
    }).parse(rawBody);

    (data as any).createdAt = new Date();
    
    const docRef = await adminDB.collection("cs_subjects").add(data);
    
    invalidateCsContent(data.slug);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "CS subject created successfully" 
    });
  } catch (error) {
    console.error("Error creating CS subject:", error);
    return NextResponse.json(
      { error: "Failed to create CS subject" },
      { status: 500 }
    );
  }
}
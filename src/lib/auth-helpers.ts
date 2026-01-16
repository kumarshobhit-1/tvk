// src/lib/auth-helpers.ts
import { NextRequest } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";

export async function verifyAdminAuth(request: NextRequest): Promise<{
  isValid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isValid: false, error: "No authorization token provided" };
    }

    // Extract token
    const token = authHeader.split("Bearer ")[1];
    
    // Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if user is admin in Firestore
    const userDoc = await adminDB.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return { isValid: false, error: "User not found" };
    }

    const userData = userDoc.data();
    if (userData?.isAdmin !== true) {
      return { isValid: false, error: "Unauthorized: Admin access required" };
    }

    return { isValid: true, userId };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { isValid: false, error: "Invalid or expired token" };
  }
}

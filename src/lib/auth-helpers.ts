// src/lib/auth-helpers.ts
import { NextRequest } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import type { AdminRole, AdminPermissions } from "@/lib/role-types";
import { ROLE_PERMISSIONS, hasPermission } from "@/lib/role-types";

export interface AdminAuthResult {
  isValid: boolean;
  userId?: string;
  role?: AdminRole;
  permissions?: AdminPermissions;
  error?: string;
}

export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
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
    
    // Support both old 'isAdmin' and new 'adminRole' fields
    const role = userData?.adminRole as AdminRole | undefined;
    const isOldAdmin = userData?.isAdmin === true;
    
    // If neither new role nor old admin flag, deny
    if (!role && !isOldAdmin) {
      return { isValid: false, error: "Unauthorized: Admin access required" };
    }

    // Map old admins to isAdmin role (full site control, no admin-management)
    const effectiveRole = role || 'isAdmin';
    const permissions = ROLE_PERMISSIONS[effectiveRole];

    return { 
      isValid: true, 
      userId,
      role: effectiveRole,
      permissions
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { isValid: false, error: "Invalid or expired token" };
  }
}

// Permission check helper
export async function verifyAdminPermission(
  request: NextRequest,
  requiredPermission: keyof AdminPermissions
): Promise<AdminAuthResult> {
  const auth = await verifyAdminAuth(request);
  
  if (!auth.isValid || !auth.role) {
    return auth;
  }

  if (!hasPermission(auth.role, requiredPermission)) {
    return {
      isValid: false,
      error: `Insufficient permissions: ${requiredPermission} required`,
      userId: auth.userId,
      role: auth.role,
      permissions: auth.permissions,
    };
  }

  return auth;
}

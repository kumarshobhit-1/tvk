import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { z } from "zod";
import type { AdminRole } from "@/lib/role-types";

const VALID_ROLES: AdminRole[] = [
  "super_admin",
  "isAdmin",
  "content_admin",
  "exam_admin",
  "qa_admin",
];

type AdminUserRecord = {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
  adminRole?: AdminRole;
  isAdmin?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

// Super admin: create/assign admin by email (user must have logged in once)
export async function POST(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageAdmins");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const rawBody = await request.json();
    const { email, adminRole } = z.object({
      email: z.string().email(),
      adminRole: z.string().min(1),
    }).parse(rawBody);

    const normalizedEmail = email.trim().toLowerCase();

    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(normalizedEmail);
    } catch (error: any) {
      return NextResponse.json(
        { error: "User not found in Authentication. Ask user to login first." },
        { status: 404 }
      );
    }

    const userRef = adminDB.collection("users").doc(authUser.uid);
    const userSnap = await userRef.get();
    const currentData = userSnap.exists ? userSnap.data() : undefined;

    // If user has authenticated but profile doc is missing, create it automatically.
    if (!userSnap.exists) {
      await userRef.set({
        uid: authUser.uid,
        email: authUser.email || normalizedEmail,
        displayName: authUser.displayName || "",
        photoURL: authUser.photoURL || null,
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (auth.userId === authUser.uid && currentData?.adminRole === "super_admin" && adminRole !== "super_admin") {
      return NextResponse.json(
        { error: "You cannot downgrade your own super_admin role from UI" },
        { status: 400 }
      );
    }

    await userRef.update({
      email: currentData?.email || authUser.email || normalizedEmail,
      displayName: currentData?.displayName || authUser.displayName || "",
      role: "admin",
      adminRole,
      isAdmin: adminRole === "super_admin" || adminRole === "isAdmin",
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Admin assigned successfully",
      user: {
        id: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        adminRole,
      },
    });
  } catch (error) {
    console.error("Error assigning admin by email:", error);
    return NextResponse.json({ error: "Failed to assign admin" }, { status: 500 });
  }
}

// Super admin: list users and their effective admin roles
export async function GET(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageAdmins");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    // Email search + preview before assigning role
    if (mode === "lookup") {
      const email = (searchParams.get("email") || "").trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: "email is required" }, { status: 400 });
      }

      let authUser;
      try {
        authUser = await adminAuth.getUserByEmail(email);
      } catch (error) {
        return NextResponse.json({ found: false, error: "User not found in Authentication" }, { status: 404 });
      }

      const userDoc = await adminDB.collection("users").doc(authUser.uid).get();
      const userData = userDoc.exists ? userDoc.data() : undefined;

      return NextResponse.json({
        found: true,
        user: {
          uid: authUser.uid,
          email: authUser.email || email,
          displayName: userData?.displayName || authUser.displayName || "",
          hasFirestoreProfile: userDoc.exists,
          currentAdminRole: userData?.adminRole || null,
          isAdmin: userData?.isAdmin === true,
          role: userData?.role || "student",
        },
      });
    }

    const usersSnap = await adminDB.collection("users").get();
    const users: AdminUserRecord[] = usersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: data.displayName,
        email: data.email,
        role: data.role,
        adminRole: data.adminRole,
        isAdmin: data.isAdmin === true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    // Enrich missing displayName/email from Firebase Auth users
    const authLookup = new Map<string, { displayName?: string; email?: string }>();
    const userIdentifiers = users.map((u) => ({ uid: u.id }));
    const chunkSize = 100;
    for (let i = 0; i < userIdentifiers.length; i += chunkSize) {
      const chunk = userIdentifiers.slice(i, i + chunkSize);
      const authUsersResult = await adminAuth.getUsers(chunk);
      authUsersResult.users.forEach((authUser) => {
        authLookup.set(authUser.uid, {
          displayName: authUser.displayName || undefined,
          email: authUser.email || undefined,
        });
      });
    }

    const mergedUsers = users.map((u) => {
      const authProfile = authLookup.get(u.id);
      return {
        ...u,
        displayName: u.displayName || authProfile?.displayName,
        email: u.email || authProfile?.email,
      };
    });

    const adminUsers = mergedUsers
      .filter((u) => u.adminRole || u.isAdmin)
      .sort((a, b) => {
        const aRole = a.adminRole || (a.isAdmin ? "isAdmin" : "");
        const bRole = b.adminRole || (b.isAdmin ? "isAdmin" : "");
        return aRole.localeCompare(bRole);
      });

    return NextResponse.json({
      users: adminUsers,
      totalAdmins: adminUsers.length,
      summary: {
        super_admin: adminUsers.filter((u) => u.adminRole === "super_admin").length,
        isAdmin: adminUsers.filter((u) => u.adminRole === "isAdmin").length,
        content_admin: adminUsers.filter((u) => u.adminRole === "content_admin").length,
        exam_admin: adminUsers.filter((u) => u.adminRole === "exam_admin").length,
        qa_admin: adminUsers.filter((u) => u.adminRole === "qa_admin").length,
        isAdminOnly: adminUsers.filter((u) => !u.adminRole && u.isAdmin).length,
      },
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 });
  }
}

// Super admin: assign/update role or legacy isAdmin flag
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageAdmins");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const rawBody = await request.json();
    const { userId, adminRole, isAdmin } = z.object({
      userId: z.string().min(1),
      adminRole: z.string().nullable().optional(),
      isAdmin: z.boolean().optional(),
    }).parse(rawBody);

    if (adminRole && !VALID_ROLES.includes(adminRole as any)) {
      return NextResponse.json({ error: "Invalid adminRole" }, { status: 400 });
    }

    const userRef = adminDB.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = userSnap.data();
    if (auth.userId === userId && targetUser?.adminRole === "super_admin") {
      return NextResponse.json(
        { error: "You cannot change your own super_admin role from UI" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // If role passed, this is role-driven admin assignment
    if (adminRole) {
      updates.adminRole = adminRole;
      updates.role = "admin";
      // Keep isAdmin true for backward compatibility when super_admin or requested true
      updates.isAdmin = adminRole === "super_admin" || adminRole === "isAdmin" || isAdmin === true;
    } else if (typeof isAdmin === "boolean") {
      // Legacy mode support (isAdmin-only)
      updates.isAdmin = isAdmin;
      if (!isAdmin) {
        updates.adminRole = FieldValue.delete();
        updates.role = "student";
      } else {
        updates.role = "admin";
      }
    }

    await userRef.update(updates);

    return NextResponse.json({ success: true, message: "Admin updated successfully" });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json({ error: "Failed to update admin user" }, { status: 500 });
  }
}

// Super admin: remove admin access OR delete user document
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageAdmins");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode"); // remove_admin | delete_user

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const userRef = adminDB.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (auth.userId === userId) {
      return NextResponse.json(
        { error: "You cannot remove/delete your own admin user from UI" },
        { status: 400 }
      );
    }

    if (mode === "delete_user") {
      await userRef.delete();
      return NextResponse.json({ success: true, message: "User document deleted" });
    }

    await userRef.update({
      adminRole: FieldValue.delete(),
      isAdmin: false,
      role: "student",
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Admin access removed" });
  } catch (error) {
    console.error("Error deleting/removing admin user:", error);
    return NextResponse.json({ error: "Failed to delete/remove admin user" }, { status: 500 });
  }
}

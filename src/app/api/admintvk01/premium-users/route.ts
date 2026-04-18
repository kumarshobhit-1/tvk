import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { isPremiumUser } from "@/lib/premium-access";

function toIsoDate(value: any): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value?.toDate === "function") {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null;
  }

  return null;
}

async function ensureUserDocByUid(uid: string) {
  const userRef = adminDB.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    return { userRef, userData: userSnap.data() || {} };
  }

  let authUser;
  try {
    authUser = await adminAuth.getUser(uid);
  } catch {
    return null;
  }

  const now = new Date();
  const payload = {
    uid,
    email: authUser.email || "",
    displayName: authUser.displayName || "",
    photoURL: authUser.photoURL || null,
    role: "student",
    isPremium: false,
    premium: false,
    createdAt: now,
    updatedAt: now,
  };

  await userRef.set(payload);
  return { userRef, userData: payload };
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManagePremiumUsers");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "lookup") {
      const email = (searchParams.get("email") || "").trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: "email is required" }, { status: 400 });
      }

      let authUser;
      try {
        authUser = await adminAuth.getUserByEmail(email);
      } catch {
        return NextResponse.json(
          { found: false, error: "User not found in Authentication" },
          { status: 404 }
        );
      }

      const userDoc = await adminDB.collection("users").doc(authUser.uid).get();
      const userData = userDoc.exists ? userDoc.data() || {} : {};

      return NextResponse.json({
        found: true,
        user: {
          uid: authUser.uid,
          email: authUser.email || email,
          displayName: userData.displayName || authUser.displayName || "",
          hasFirestoreProfile: userDoc.exists,
          role: userData.role || "student",
          isPremium: isPremiumUser(userData),
          isPremiumRaw: userData.isPremium === true,
          premiumRaw: userData.premium === true,
          premiumUpdatedAt: toIsoDate(userData.premiumUpdatedAt),
          premiumUpdatedBy: userData.premiumUpdatedBy || null,
        },
      });
    }

    const premiumSnap = await adminDB.collection("users").where("isPremium", "==", true).limit(100).get();
    const users = await Promise.all(premiumSnap.docs.map(async (doc) => {
      const data = doc.data() || {};

      let email = (data.email || "").trim();
      let displayName = (data.displayName || "").trim();

      if (!email || !displayName) {
        try {
          const authUser = await adminAuth.getUser(doc.id);
          if (!email) email = (authUser.email || "").trim();
          if (!displayName) displayName = (authUser.displayName || "").trim();
        } catch {
          // Keep Firestore fallback values when Auth user lookup fails.
        }
      }

      return {
        id: doc.id,
        email,
        displayName,
        role: data.role || "student",
        isPremium: true,
        premiumUpdatedAt: toIsoDate(data.premiumUpdatedAt),
      };
    }));

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error("Error fetching premium users:", error);
    return NextResponse.json({ error: "Failed to fetch premium users" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManagePremiumUsers");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, isPremium } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (typeof isPremium !== "boolean") {
      return NextResponse.json({ error: "isPremium must be boolean" }, { status: 400 });
    }

    const ensured = await ensureUserDocByUid(userId);
    if (!ensured) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await ensured.userRef.update({
      isPremium,
      premium: isPremium,
      premiumUpdatedAt: new Date(),
      premiumUpdatedBy: auth.userId || null,
      premiumUpdatedByRole: auth.role || null,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: isPremium ? "User marked as premium" : "Premium removed from user",
    });
  } catch (error) {
    console.error("Error updating premium user:", error);
    return NextResponse.json({ error: "Failed to update premium user" }, { status: 500 });
  }
}

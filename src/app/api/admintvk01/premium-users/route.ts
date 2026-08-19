import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { isPremiumUser, normalizePremiumCategories } from "@/lib/premium-access";
import { z } from "zod";

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
    premiumCategories: [],
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
          premiumCategories: normalizePremiumCategories(userData),
          allowedExamIds: Array.isArray(userData.allowedExamIds) ? userData.allowedExamIds : [],
          allowedPdfIds: Array.isArray(userData.allowedPdfIds) ? userData.allowedPdfIds : [],
          premiumUpdatedAt: toIsoDate(userData.premiumUpdatedAt),
          premiumUpdatedBy: userData.premiumUpdatedBy || null,
        },
      });
    }

    // Fetch cached premium stats or bootstrap them
    const statsRef = adminDB.collection("system_config").doc("premium_stats");
    const statsSnap = await statsRef.get();
    
    let statsData: any = null;
    
    if (statsSnap.exists && statsSnap.data()?.initialized === true) {
      statsData = statsSnap.data();
    } else {
      // One-off bootstrap scan to build aggregated stats
      const premiumUsersSnap = await adminDB.collection("users")
        .where("isPremium", "==", true)
        .select("premiumCategories")
        .get();
      
      let totalPremiumUsers = 0;
      const categoryCounts: Record<string, number> = {};
      
      premiumUsersSnap.docs.forEach((doc) => {
        totalPremiumUsers++;
        const data = doc.data() || {};
        const categories = Array.isArray(data.premiumCategories) ? data.premiumCategories : [];
        categories.forEach((cat: string) => {
          const norm = String(cat || "").trim().toUpperCase();
          if (norm) {
            categoryCounts[norm] = (categoryCounts[norm] || 0) + 1;
          }
        });
      });
      
      statsData = {
        totalPremiumUsers,
        categoryCounts,
        initialized: true,
        updatedAt: new Date(),
      };
      
      await statsRef.set(statsData);
    }

    const premiumSnap = await adminDB.collection("users").where("isPremium", "==", true).get();
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
        premiumCategories: normalizePremiumCategories(data),
        premiumUpdatedAt: toIsoDate(data.premiumUpdatedAt),
      };
    }));

    return NextResponse.json({ 
      users, 
      total: users.length,
      stats: {
        totalPremiumUsers: statsData.totalPremiumUsers || 0,
        categoryCounts: statsData.categoryCounts || {},
      }
    });
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
    const rawBody = await request.json();
    const { userId, isPremium, premiumCategories, grantAllAccess, allowedExamIds, allowedPdfIds } = z.object({
      userId: z.string().min(1),
      isPremium: z.boolean(),
      premiumCategories: z.union([z.array(z.string()), z.string()]).optional().nullable(),
      grantAllAccess: z.boolean().optional().nullable(),
      allowedExamIds: z.array(z.string()).optional().nullable(),
      allowedPdfIds: z.array(z.string()).optional().nullable(),
    }).parse(rawBody);

    const normalizedCategories = Array.isArray(premiumCategories)
      ? premiumCategories
          .map((category) => String(category || "").trim().toUpperCase())
          .filter(Boolean)
      : typeof premiumCategories === "string"
        ? premiumCategories
            .split(/[,|]/)
            .map((category) => String(category || "").trim().toUpperCase())
            .filter(Boolean)
        : [];

    if (isPremium && !grantAllAccess && normalizedCategories.length === 0) {
      return NextResponse.json(
        { error: "premiumCategories are required when granting premium access" },
        { status: 400 }
      );
    }

    const ensured = await ensureUserDocByUid(userId);
    if (!ensured) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatePayload: any = {
      isPremium,
      premium: isPremium,
      premiumCategories: isPremium
        ? (grantAllAccess ? ["ALL"] : normalizedCategories)
        : [],
      premiumUpdatedAt: new Date(),
      premiumUpdatedBy: auth.userId || null,
      premiumUpdatedByRole: auth.role || null,
      updatedAt: new Date(),
    };

    // Optional per-user explicit access lists (arrays of IDs)
    if (isPremium) {
      if (Array.isArray(allowedExamIds)) {
        updatePayload.allowedExamIds = allowedExamIds.filter((x: any) => typeof x === 'string');
      }
      if (Array.isArray(allowedPdfIds)) {
        updatePayload.allowedPdfIds = allowedPdfIds.filter((x: any) => typeof x === 'string');
      }
    } else {
      updatePayload.allowedExamIds = [];
      updatePayload.allowedPdfIds = [];
    }

    // No per-category quotas — only explicit per-user allowed IDs are stored

    await ensured.userRef.update(updatePayload);

    const statsRef = adminDB.collection("system_config").doc("platform_stats");
    const premiumStatsRef = adminDB.collection("system_config").doc("premium_stats");

    await adminDB.runTransaction(async (transaction) => {
      // 1. Fetch platform_stats
      const statsSnap = await transaction.get(statsRef);
      let premiumUsersCount = Number(statsSnap.data()?.premiumUsersCount || 0);
      const statsInitialized = statsSnap.exists && statsSnap.data()?.premiumUsersInitialized === true;

      if (!statsInitialized) {
        const premiumUsersSnap = await transaction.get(
          adminDB.collection("users").where("isPremium", "==", true).select("isPremium")
        );
        premiumUsersCount = premiumUsersSnap.size;
      }

      // 2. Fetch premium_stats
      const premiumStatsSnap = await transaction.get(premiumStatsRef);
      let totalPremiumUsers = Number(premiumStatsSnap.data()?.totalPremiumUsers || 0);
      let categoryCounts = premiumStatsSnap.data()?.categoryCounts || {};
      const premiumStatsInitialized = premiumStatsSnap.exists && premiumStatsSnap.data()?.initialized === true;

      if (!premiumStatsInitialized) {
        // One-off load inside transaction if not initialized
        const pUsers = await transaction.get(
          adminDB.collection("users").where("isPremium", "==", true).select("premiumCategories")
        );
        totalPremiumUsers = pUsers.size;
        categoryCounts = {};
        pUsers.docs.forEach((doc) => {
          const data = doc.data() || {};
          const categories = Array.isArray(data.premiumCategories) ? data.premiumCategories : [];
          categories.forEach((cat: string) => {
            const norm = String(cat || "").trim().toUpperCase();
            if (norm) {
              categoryCounts[norm] = (categoryCounts[norm] || 0) + 1;
            }
          });
        });
      }

      const wasPremium = Boolean(ensured.userData?.isPremium || ensured.userData?.premium);
      const oldCategories = Array.isArray(ensured.userData?.premiumCategories)
        ? ensured.userData.premiumCategories.map((c: string) => String(c || "").trim().toUpperCase()).filter(Boolean)
        : [];
      
      const newCategories = isPremium
        ? (grantAllAccess ? ["ALL"] : normalizedCategories)
        : [];

      // Create a clean copy of category counts to update
      const updatedCategoryCounts = { ...categoryCounts };

      if (isPremium && !wasPremium) {
        // Non-premium to premium
        premiumUsersCount += 1;
        totalPremiumUsers += 1;
        newCategories.forEach((cat: string) => {
          updatedCategoryCounts[cat] = (updatedCategoryCounts[cat] || 0) + 1;
        });
      } else if (!isPremium && wasPremium) {
        // Premium to non-premium
        premiumUsersCount = Math.max(0, premiumUsersCount - 1);
        totalPremiumUsers = Math.max(0, totalPremiumUsers - 1);
        oldCategories.forEach((cat: string) => {
          if (updatedCategoryCounts[cat] !== undefined) {
            updatedCategoryCounts[cat] = Math.max(0, updatedCategoryCounts[cat] - 1);
            if (updatedCategoryCounts[cat] === 0) {
              delete updatedCategoryCounts[cat];
            }
          }
        });
      } else if (isPremium && wasPremium) {
        // Premium categories modification
        // Increment newly added categories
        newCategories.forEach((cat: string) => {
          if (!oldCategories.includes(cat)) {
            updatedCategoryCounts[cat] = (updatedCategoryCounts[cat] || 0) + 1;
          }
        });
        // Decrement removed categories
        oldCategories.forEach((cat: string) => {
          if (!newCategories.includes(cat)) {
            if (updatedCategoryCounts[cat] !== undefined) {
              updatedCategoryCounts[cat] = Math.max(0, updatedCategoryCounts[cat] - 1);
              if (updatedCategoryCounts[cat] === 0) {
                delete updatedCategoryCounts[cat];
              }
            }
          }
        });
      }

      // Write platform stats changes
      transaction.set(
        statsRef,
        {
          premiumUsersCount,
          premiumUsersInitialized: true,
          premiumUsersUpdatedAt: new Date(),
        },
        { merge: true }
      );

      // Write premium stats changes
      transaction.set(
        premiumStatsRef,
        {
          totalPremiumUsers: Math.max(0, totalPremiumUsers),
          categoryCounts: updatedCategoryCounts,
          initialized: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );
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

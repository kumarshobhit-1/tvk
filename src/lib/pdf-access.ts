import type { PDFFile, PDFFolder } from "@/lib/pdf-types";

function normalizeCategory(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

export function buildPdfAccessUrl(fileId: string, action: "view" | "download" = "view"): string {
  return `/api/pdf/access?fileId=${encodeURIComponent(fileId)}&action=${action}`;
}

export function canUserAccessPdf(userData: any, file: PDFFile, folder: PDFFolder): boolean {
  if (file.isLocked === true) return false;

  const effectiveCategory = file.category || folder.category || "";
  const requiresPremium =
    file.premiumOverridden === true
      ? file.isPremium === true
      : folder.isPremium === true;

  if (!requiresPremium) return true;

  const isPremiumUser = userData?.isPremium === true || userData?.premium === true;
  const allowedPdfIds: string[] = Array.isArray(userData?.allowedPdfIds)
    ? userData.allowedPdfIds.map((id: any) => String(id))
    : [];
  const allowedPdfSet = new Set(allowedPdfIds);

  if (isPremiumUser && allowedPdfSet.size > 0) {
    return allowedPdfSet.has(file.id);
  }

  const premiumCategories = Array.isArray(userData?.premiumCategories)
    ? userData.premiumCategories
    : Array.isArray(userData?.premiumAccessCategories)
      ? userData.premiumAccessCategories
      : Array.isArray(userData?.premiumCourses)
        ? userData.premiumCourses
        : Array.isArray(userData?.allowedCategories)
          ? userData.allowedCategories
          : [];

  const normalizedExamCategory = normalizeCategory(effectiveCategory);
  const normalizedPremiumCategories = Array.from(
    new Set(premiumCategories.map((category: unknown) => normalizeCategory(category)).filter(Boolean))
  );

  if (normalizedPremiumCategories.includes("ALL")) return true;
  if (normalizedPremiumCategories.length > 0) {
    if (!normalizedExamCategory) return true;
    return normalizedPremiumCategories.includes(normalizedExamCategory);
  }

  if (userData?.isPremium === true || userData?.premium === true) return true;

  const directPlan = String(userData?.plan || userData?.subscriptionPlan || userData?.tier || "").toLowerCase();
  if (["premium", "pro", "paid", "gold"].includes(directPlan)) return true;

  const subscriptionStatus = String(userData?.subscription?.status || userData?.membership?.status || "").toLowerCase();
  const subscriptionTier = String(userData?.subscription?.plan || userData?.subscription?.tier || "").toLowerCase();
  const membershipTier = String(userData?.membership?.plan || userData?.membership?.tier || "").toLowerCase();

  return (
    ["active", "trialing"].includes(subscriptionStatus) &&
    ["premium", "pro", "paid", "gold"].includes(subscriptionTier || membershipTier)
  );
}

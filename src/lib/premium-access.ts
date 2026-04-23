function normalizePremiumCategory(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

export function normalizePremiumCategories(userData: any): string[] {
  if (!userData) return [];

  const rawCategories =
    userData.premiumCategories ??
    userData.premiumAccessCategories ??
    userData.premiumCourses ??
    userData.allowedCategories ??
    [];

  const categoryValues = Array.isArray(rawCategories)
    ? rawCategories
    : typeof rawCategories === "string"
      ? rawCategories.split(/[,|]/)
      : [];

  return Array.from(
    new Set(
      categoryValues
        .map((category) => normalizePremiumCategory(category))
        .filter(Boolean)
    )
  );
}

export function hasPremiumAccess(userData: any, examCategory?: string): boolean {
  if (!userData) return false;

  const premiumCategories = normalizePremiumCategories(userData);
  const normalizedExamCategory = normalizePremiumCategory(examCategory);

  if (premiumCategories.includes("ALL")) {
    return true;
  }

  if (premiumCategories.length > 0) {
    if (!normalizedExamCategory) {
      return true;
    }

    return premiumCategories.includes(normalizedExamCategory);
  }

  if (userData.isPremium === true || userData.premium === true) {
    return true;
  }

  const directPlan = String(userData.plan || userData.subscriptionPlan || userData.tier || "").toLowerCase();
  if (["premium", "pro", "paid", "gold"].includes(directPlan)) {
    return true;
  }

  const subscriptionStatus = String(userData.subscription?.status || userData.membership?.status || "").toLowerCase();
  const subscriptionTier = String(userData.subscription?.plan || userData.subscription?.tier || "").toLowerCase();
  const membershipTier = String(userData.membership?.plan || userData.membership?.tier || "").toLowerCase();

  const hasActivePaidSubscription =
    ["active", "trialing"].includes(subscriptionStatus) &&
    ["premium", "pro", "paid", "gold"].includes(subscriptionTier || membershipTier);

  return hasActivePaidSubscription;
}

export function isPremiumUser(userData: any): boolean {
  return hasPremiumAccess(userData);
}

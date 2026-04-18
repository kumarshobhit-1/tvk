export function isPremiumUser(userData: any): boolean {
  if (!userData) return false;

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

  if (hasActivePaidSubscription) {
    return true;
  }

  return false;
}

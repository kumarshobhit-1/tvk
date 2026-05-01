"use client";

import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function CoreConceptsButton() {
  const { user, loading } = useRequireAuth();

  // Show button only if user is logged in
  if (loading) {
    return null; // Show nothing while loading
  }

  if (!user) {
    return null; // Don't show button if not logged in
  }

  return (
    <Link
      href="/dsa/core-concepts"
      className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      Open Core Concepts
    </Link>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";

export function useRequireAuth(redirectUrl = "/login") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  return { user, loading };
}

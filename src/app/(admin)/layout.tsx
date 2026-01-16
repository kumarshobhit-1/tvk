// src/app/(admin)/layout.tsx

"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      const checkAdminStatus = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
        setIsCheckingAdmin(false);
      };

      checkAdminStatus();
    }
  }, [user, authLoading, router]);

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying access...</span>
      </div>
    );
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  return null;
}
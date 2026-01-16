"use client";

import { CodePlayground } from "@/components/playground/code-playground";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";

export default function PlaygroundPage() {
  const { user, loading } = useRequireAuth("/login");
  const router = useRouter();
  const { toast } = useToast();
  const [showLoading, setShowLoading] = useState(true);

  // Add minimum delay to show loading
  useEffect(() => {
    document.title = "Code Playground | The Victory Key";
    
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500); // Show loading for at least 500ms
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Login Required",
        description: "Please login to access the Code Playground and practice DSA problems.",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [user, loading, router, toast]);

  if (loading || showLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return <CodePlayground />;
}

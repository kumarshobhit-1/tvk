// src/components/ui/protected-link.tsx

"use client";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// यह Link कंपोनेंट के सभी standard props को स्वीकार करेगा
type ProtectedLinkProps = React.ComponentProps<typeof Link>;

export default function ProtectedLink({ href, children, ...props }: ProtectedLinkProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // लिंक को तुरंत खुलने से रोकें
    event.preventDefault(); 
    
    if (!user) {
      // अगर यूज़र लॉगिन नहीं है, तो टोस्ट दिखाएँ
      toast({
        title: "Authentication Required",
        description: "Please log in to access this resource.",
        variant: "destructive",
        action: (
            <Button onClick={() => router.push('/login')}>Login</Button>
        ),
      });
    } else {
      // अगर लॉगिन है, तो लिंक को नए टैब में खोलें
      window.open(href.toString(), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
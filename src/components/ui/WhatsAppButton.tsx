"use client"
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function WhatsAppButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const phone = "919452903509";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Student";
  const loginUrl = `/login?redirect=${encodeURIComponent(pathname || "/")}`;
  const prefill = encodeURIComponent(
    `Hi, I am ${displayName}. I need help with your platform. I have a query regarding exam purchase, PDF access, or another site issue. Please assist me.`
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${prefill}`;

  const handlePrimaryAction = () => {
    if (!user) {
      router.push(loginUrl);
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed right-5 bottom-5 z-50">
      <button
        onClick={handlePrimaryAction}
        aria-label="Contact via WhatsApp"
        title="Contact via WhatsApp"
        className="h-14 w-14 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl hover:scale-105 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7">
          <path fill="currentColor" d="M20.52 3.48A11.95 11.95 0 0012 0C5.373 0 .002 5.373 0 12.001a11.9 11.9 0 001.64 6.03L0 24l6.25-1.63A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-11.999 0-3.2-1.247-6.2-3.48-8.53zM12 21.5c-1.02 0-2.02-.17-2.97-.5l-.21-.08-3.71.97.97-3.6-.06-.22A9.5 9.5 0 012.5 12C2.5 6.2 6.2 2.5 12 2.5S21.5 6.2 21.5 12 17.8 21.5 12 21.5z"/>
          <path fill="currentColor" d="M17.57 14.2c-.28-.14-1.66-.82-1.92-.91-.26-.08-.45-.13-.64.13-.18.26-.7.91-.86 1.1-.16.18-.32.2-.6.07-.28-.13-1.18-.44-2.25-1.39-.83-.74-1.39-1.66-1.55-1.94-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.27.28-.45.09-.18.05-.34-.02-.48-.07-.13-.64-1.54-.88-2.12-.23-.56-.46-.48-.64-.49l-.55-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.99 2.68 1.13 2.87.14.18 1.95 2.98 4.73 4.18 3.29 1.41 3.29 0 3.88-.96.6-.96.6-1.78.42-1.96-.18-.18-.43-.27-.7-.41z"/>
        </svg>
      </button>
    </div>
  );
}

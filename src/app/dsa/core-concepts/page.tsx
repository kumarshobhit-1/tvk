"use client";
import React, { useEffect, useRef } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import Loading from "@/components/ui/loading";

export default function Page() {
  const { user, loading: authLoading } = useRequireAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resizeIframe = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Get height of the actual shell element (the content container)
          const shellElement = iframeDoc.querySelector('.shell');
          if (shellElement) {
            const height = shellElement.scrollHeight + 20; // Add small margin
            iframe.style.height = height + "px";
          } else {
            // Fallback to document height
            const height = iframeDoc.documentElement.scrollHeight;
            iframe.style.height = height + "px";
          }
        }
      } catch (e) {
        iframe.style.height = "2000px";
      }
    };

    // Resize on load
    const handleLoad = () => {
      resizeIframe();
      
      // Try to attach ResizeObserver to the shell element
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const shellElement = iframeDoc.querySelector('.shell');
          if (shellElement && 'ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => {
              resizeIframe();
            });
            resizeObserver.observe(shellElement);
          }
        }
      } catch (e) {
        console.log("Could not attach ResizeObserver");
      }
    };

    iframe.addEventListener("load", handleLoad);
    
    // Initial resize
    setTimeout(resizeIframe, 500);

    // Aggressive polling - check every 300ms
    const checkInterval = setInterval(() => {
      resizeIframe();
    }, 300);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      clearInterval(checkInterval);
    };
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ width: "100%" }}>
      <iframe
        ref={iframeRef}
        src="/dsa/core-concepts.html"
        title="DSA Core Concepts"
        style={{ 
          width: "100%", 
          border: "none",
          display: "block",
          minHeight: "100px"
        }}
      />
    </div>
  );
}

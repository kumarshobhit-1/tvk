"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import Loading from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HpclIsPyqPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.title = "HPCL IS PYQ | The Victory Key";
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resizeIframe = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const shellElement = iframeDoc.querySelector('.shell');
          if (shellElement) {
            const height = (shellElement as HTMLElement).scrollHeight + 20;
            iframe.style.height = height + "px";
          } else {
            const height = iframeDoc.documentElement.scrollHeight;
            iframe.style.height = height + "px";
          }
        }
      } catch (e) {
        // Cross-origin or other issue — keep a sensible fallback
        iframe.style.height = "800px";
      }
    };

    const handleLoad = () => {
      resizeIframe();
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const shellElement = iframeDoc.querySelector('.shell');
          if (shellElement && 'ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => resizeIframe());
            resizeObserver.observe(shellElement);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    iframe.addEventListener('load', handleLoad);
    // initial attempt after short delay
    const t = setTimeout(resizeIframe, 500);
    const interval = setInterval(resizeIframe, 400);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-140px)] max-w-7xl flex-col px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-start md:justify-between md:p-6">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            HPCL IS PYQ
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">HPCL IS PYQ</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
            Previous year questions for HPCL Industrial Safety. This resource is available only after login.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full md:w-fit md:self-start">
          <Link href="/hpcl_is_pyq/HPCL_IS_PYQ_2022_Answers.html" target="_blank" rel="noreferrer">
            Open in new tab
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden border shadow-sm">
        <CardHeader className="border-b bg-muted/30 px-5 py-4 md:px-6">
          <CardTitle className="text-xl">PYQ Viewer</CardTitle>
          <CardDescription>
            Use the embedded viewer below or open the file in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div style={{ width: '100%' }}>
            <iframe
              ref={iframeRef}
              src="/hpcl_is_pyq/HPCL_IS_PYQ_2022_Answers.html"
              title="HPCL IS PYQ 2022 Answers"
              style={{ width: '100%', border: 'none', display: 'block', minHeight: '120px' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, ExternalLink, FileText, ShieldAlert } from "lucide-react";
import Loading from "@/components/ui/loading";

export default function PDFViewerPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    document.title = `${pdfName || "PDF Viewer"} | The Victory Key`;
  }, [pdfName]);

  useEffect(() => {
    const fileId = searchParams.get("fileId");
    const url = searchParams.get("url");
    const name = searchParams.get("name");
    let revokedBlobUrl: string | null = null;

    if (fileId) {
      setPdfUrl(`/api/pdf/access?fileId=${encodeURIComponent(fileId)}&action=view`);
      setPdfName(name || "PDF Document");
      setLoading(false);
      return;
    }

    if (url) {
      const decodedUrl = decodeURIComponent(url);
      if (decodedUrl.startsWith("/api/pdf/access")) {
        setPdfUrl(decodedUrl);
        setPdfName(name || "PDF Document");
        setLoading(false);
        return;
      }

      setError("Invalid PDF link");
      setLoading(false);
      return;
    }

    setError("No PDF URL provided");
    setLoading(false);

    return () => {
      if (revokedBlobUrl) URL.revokeObjectURL(revokedBlobUrl);
    };
  }, [searchParams]);

  useEffect(() => {
    if (!pdfUrl) return;

    let isMounted = true;
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        setIframeError(false);

        const res = await fetch(pdfUrl, { method: "GET" });

        if (!res.ok) {
          let message = "You do not have access to this PDF.";
          try {
            const data = await res.json();
            if (res.status === 403) {
              message = "This PDF is Premium (locked). Please upgrade your plan or contact support to access it.";
            } else if (data?.error) {
              message = data.error;
            }
          } catch {
            if (res.status === 403) {
              message = "This PDF is Premium (locked). Please upgrade your plan or contact support to access it.";
            }
          }

          if (isMounted) {
            setError(message);
          }
          return;
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (isMounted) {
          setPdfBlobUrl(objectUrl);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load the PDF right now. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfUrl]);

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const a = document.createElement("a");
      a.href = pdfBlobUrl;
      a.download = `${(pdfName || "PDF Document").replace(/\.[^/.]+$/, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleOpenDirect = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto rounded-xl border border-amber-200 bg-amber-50 p-6 text-left shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
              <h2 className="text-xl font-semibold text-amber-900">Access Denied</h2>
            </div>
            <p className="text-sm text-amber-800 mb-5">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/library")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        {/* <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/library")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="font-medium truncate max-w-[300px] md:max-w-[500px]">
            {pdfName}
          </h1>
        </div> */}
        <div className="flex items-center gap-2">
          {/* <Button variant="outline" size="sm" onClick={handleOpenDirect}>
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Direct Link</span>
          </Button> */}
          {/* <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button> */}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-muted overflow-hidden">
        {pdfBlobUrl && !iframeError ? (
          <iframe
            src={pdfBlobUrl}
            className="w-full h-full border-0"
            onError={() => setIframeError(true)}
            title={pdfName}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md mx-4">
              <CardContent className="pt-6 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">PDF Preview Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  Your browser cannot display this PDF inline. Use the options below:
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={handleOpenDirect} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Direct Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

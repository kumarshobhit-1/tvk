"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import Loading from "@/components/ui/loading";

export default function PDFViewerPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    document.title = `${pdfName || "PDF Viewer"} | The Victory Key`;
  }, [pdfName]);

  useEffect(() => {
    const url = searchParams.get("url");
    const name = searchParams.get("name");
    
    if (url) {
      setPdfUrl(decodeURIComponent(url));
      setPdfName(name || "PDF Document");
      setLoading(false);
    } else {
      setError("No PDF URL provided");
      setLoading(false);
    }
  }, [searchParams]);

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const handleOpenDirect = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const handleOpenGoogleDocs = () => {
    if (pdfUrl) {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      window.open(googleDocsUrl, "_blank");
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/library")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/library")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="font-medium truncate max-w-[300px] md:max-w-[500px]">
            {pdfName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenDirect}>
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Direct Link</span>
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-muted overflow-hidden">
        {pdfUrl && !iframeError ? (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
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
                  <Button variant="outline" onClick={handleOpenGoogleDocs} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Docs
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

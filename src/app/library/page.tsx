"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  FolderOpen, 
  Download, 
  Eye, 
  EyeOff,
  Search,
  ChevronRight,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import Loading from "@/components/ui/loading";
import type { PDFFolderWithFiles, PDFFile } from "@/lib/pdf-types";

export default function LibraryPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [folders, setFolders] = useState<PDFFolderWithFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<PDFFolderWithFiles | null>(null);
  const [folderStack, setFolderStack] = useState<PDFFolderWithFiles[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category") ?? "";

  function toSlug(value: string) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  const findFolderBySlug = (list: PDFFolderWithFiles[], slug: string): PDFFolderWithFiles | null => {
    for (const f of list) {
      const fslug = toSlug(f.category || f.name || "");
      if (fslug === slug) return f;
      if (f.subfolders && f.subfolders.length) {
        const found = findFolderBySlug(f.subfolders, slug);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    document.title = "PDF Library | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchData = async () => {
      try {
        const response = await fetch("/api/pdf/list");
        const data = await response.json();
        
        if (response.ok) {
          const foldersRes = data.folders || [];
          setFolders(foldersRes);
          // If a category query param is present, try to pre-select the folder
          if (categoryParam) {
            const match = findFolderBySlug(foldersRes, categoryParam);
            if (match) {
              setSelectedFolder(match);
              setFolderStack([match]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching PDFs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const trackAction = async (fileId: string, action: "view" | "download") => {
    try {
      await fetch("/api/pdf/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, action }),
      });
    } catch (error) {
      console.error("Error tracking action:", error);
    }
  };

  const handleViewPDF = (file: PDFFile) => {
    trackAction(file.id, "view");
    window.open(
      `/library/view?fileId=${encodeURIComponent(file.id)}&name=${encodeURIComponent(file.name || "PDF Document")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDownloadPDF = (file: PDFFile) => {
    trackAction(file.id, "download");
    const downloadUrl = file.downloadUrl || `/api/pdf/access?fileId=${encodeURIComponent(file.id)}&action=download`;
    (async () => {
      try {
        const res = await fetch(downloadUrl, { method: "GET" });
        if (!res.ok) {
          if (res.status === 403) {
            toast({
              title: "Access denied",
              description: "This PDF is Premium(locked). Upgrade your plan or contact support to download it.",
              variant: "destructive",
            });
            return;
          }

          let message = "Unable to download the PDF.";
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {}

          toast({
            title: "Download failed",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const contentType = res.headers.get("content-type") || "application/pdf";
        const blob = await res.blob();

        // If the response isn't a PDF, still attempt download but keep original type
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: contentType }));

        const a = document.createElement("a");
        a.href = blobUrl;
        // Ensure filename ends with .pdf
        const safeName = (file.name || "download").replace(/\.pdf$/i, "") + ".pdf";
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("PDF download failed:", err);
        toast({
          title: "Download failed",
          description: "Unable to download this PDF right now. Please try again later.",
          variant: "destructive",
        });
      }
    })();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderPublicFolderNode = (folder: PDFFolderWithFiles, depth = 0, showChildren = true) => {
    const hasChildren = (folder.subfolders || []).length > 0;

    return (
      <div key={folder.id}>
        <div
          className="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
          style={{ paddingLeft: 12 + depth * 18 }}
          onClick={() => setSelectedFolder(folder)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center text-2xl" style={{ backgroundColor: `${folder.color}20` }}>
                {folder.icon}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{folder.name}</div>
                <div className="text-xs text-muted-foreground">{folder.files.length} files</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div>{folder.category || "GENERAL"}</div>
              {folder.isPremium && <div className="text-secondary">Premium</div>}
              {hasChildren && <div className="ml-2">{(folder.subfolders || []).length} subfolders</div>}
            </div>
          </div>
        </div>
        {showChildren && (folder.subfolders || []).length > 0 && (
          <div className="mt-2 space-y-2">
            {folder.subfolders!.map((sub) => renderPublicFolderNode(sub, depth + 1, true))}
          </div>
        )}
      </div>
    );
  };

  const renderSidebarFolderNode = (folder: PDFFolderWithFiles, depth = 0) => {
    const children = folder.subfolders || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders[folder.id] === true;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors ${
            selectedFolder?.id === folder.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60"
          }`}
          style={{ paddingLeft: 8 + depth * 16 }}
        >
          <button
            type="button"
            className={`h-6 w-6 shrink-0 flex items-center justify-center rounded transition-transform ${hasChildren ? "text-muted-foreground hover:bg-muted" : "opacity-40 cursor-default"}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasChildren) return;
              setExpandedFolders((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }));
            }}
            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1" onClick={() => { setFolderStack([folder]); setSelectedFolder(folder); }}>
            <span className="shrink-0">{folder.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{folder.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{folder.files.length} files</span>
                {hasChildren && <span>· {children.length} subfolder{children.length > 1 ? "s" : ""}</span>}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {children.map((child) => renderSidebarFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter files for a given folder based on search
  const getFilteredFiles = (folder: PDFFolderWithFiles) => {
    const sortedFiles = [...folder.files].sort((a, b) => {
      const orderDiff = (a.order || 0) - (b.order || 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });

    if (!searchQuery.trim()) return sortedFiles;
    return sortedFiles.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Filter folders based on search (when in folder view)
  const getFilteredFolders = () => {
    if (!searchQuery.trim()) return folders;
    
    return folders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.files.some((file) => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  const getTotalFiles = () => {
    return folders.reduce((sum, folder) => sum + folder.files.length, 0);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PDF Library</h1>
          <p className="text-muted-foreground">
            Access study materials, previous year papers, and more
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary" className="text-sm">
              {folders.length} Folders
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {getTotalFiles()} Files
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={"Search folders or files..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Topkaroo-style layout: sidebar accordion + main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          {/* Left sidebar - Accordion with folders - hide on mobile when folder selected */}
          <aside className={selectedFolder ? "hidden md:block" : "block"} style={selectedFolder ? undefined : { display: "block" }}>
            <div className="bg-secondary/40 rounded-lg p-4 max-h-[70vh] overflow-auto">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Folders
            </h3>
            <div className="space-y-1">
              {getFilteredFolders().map((folder) => renderSidebarFolderNode(folder))}
            </div>
            </div>
          </aside>

          {/* Main content area - show on md+ always, on mobile only when folder selected */}
          <main className={selectedFolder ? "block" : "hidden md:block"}>
            {!selectedFolder ? (
              <div className="text-center py-16">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-medium mb-2">Select a folder</h3>
                <p className="text-muted-foreground">Click a folder on the left to view PDFs</p>
              </div>
            ) : (
              <div>
                {/* Folder header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Button variant="ghost" size="sm" className="md:hidden mr-2" onClick={() => setSelectedFolder(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {folderStack.length > 1 ? (
                      <Button variant="outline" size="sm" className="hidden md:inline-flex mr-2" onClick={() => {
                        const newStack = folderStack.slice(0, -1);
                        setFolderStack(newStack);
                        setSelectedFolder(newStack.length ? newStack[newStack.length - 1] : null);
                      }}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="hidden md:inline-flex mr-2" onClick={() => { setSelectedFolder(null); setFolderStack([]); }}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: `${selectedFolder.color}20` }}>
                      {selectedFolder.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedFolder.name}</h2>
                      <div className="text-sm text-muted-foreground mt-1">
                        {selectedFolder.files.length} files · {selectedFolder.category || "GENERAL"}
                        {selectedFolder.isPremium && " · Premium"}
                      </div>
                    </div>
                  </div>
                  {selectedFolder.description && (
                    <p className="text-muted-foreground">{selectedFolder.description}</p>
                  )}
                </div>

                {/* Subfolders */}
                {selectedFolder.subfolders && selectedFolder.subfolders.length > 0 && (
                  <div className="mb-6 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">Subfolders</p>
                        <p className="text-xs text-muted-foreground">{selectedFolder.subfolders.length} folder(s) inside this folder</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedFolder.subfolders.map((sub) => (
                        <div key={sub.id} onClick={() => { setFolderStack(prev => [...prev, sub]); setSelectedFolder(sub); }}>
                          {renderPublicFolderNode(sub, 1, false)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files list */}
                <div className="space-y-2">
                  {getFilteredFiles(selectedFolder).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No files in this folder</div>
                  ) : (
                    getFilteredFiles(selectedFolder).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate">{file.name}</div>
                              {file.isLocked && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}{file.pageCount ? ` · ${file.pageCount} pages` : ""}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground min-w-fit ml-2 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {file.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {file.downloadCount}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" disabled={file.canAccess === false} onClick={() => handleViewPDF(file)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" disabled={file.canAccess === false} onClick={() => handleDownloadPDF(file)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
  const router = useRouter();
  const [folders, setFolders] = useState<PDFFolderWithFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<PDFFolderWithFiles | null>(null);
  const [folderStack, setFolderStack] = useState<PDFFolderWithFiles[]>([]);

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
          setFolders(data.folders || []);
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
    // Use Google Docs Viewer to display PDF inline (prevents download)
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.cloudinarySecureUrl)}&embedded=true`;
    window.open(googleDocsUrl, "_blank");
  };

  const handleDownloadPDF = (file: PDFFile) => {
    trackAction(file.id, "download");
    // Direct download - Cloudinary raw files download directly
    window.open(file.cloudinarySecureUrl, "_blank");
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
            <Accordion type="single" collapsible className="w-full">
              {getFilteredFolders().map((folder, idx) => (
                <AccordionItem key={folder.id} value={folder.id}>
                  <AccordionTrigger
                    className="py-2 hover:no-underline data-[state=open]:font-semibold cursor-pointer"
                    onClick={() => { setFolderStack([folder]); setSelectedFolder(folder); }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{folder.icon}</span>
                      <div className="text-left min-w-0">
                        <div className="font-medium text-sm">{folder.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{folder.files.length} files</span>
                          {folder.subfolders && folder.subfolders.length > 0 && (
                            <span className="text-xs text-muted-foreground">· {folder.subfolders.length} subfolder{folder.subfolders.length > 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                    <AccordionContent className="pb-0 hidden">
                    <div className="space-y-2 pl-4 py-2">
                      {getFilteredFiles(folder).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-primary/10 cursor-pointer group"
                          onClick={() => { setFolderStack([folder]); setSelectedFolder(folder); }}
                        >
                          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-sm truncate">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{file.pageCount ? `${file.pageCount} pages` : formatFileSize(file.fileSize)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => {
                        const newStack = folderStack.slice(0, -1);
                        setFolderStack(newStack);
                        setSelectedFolder(newStack.length ? newStack[newStack.length - 1] : null);
                      }}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="mr-2" onClick={() => { setSelectedFolder(null); setFolderStack([]); }}>
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
                            <div className="font-medium text-sm truncate">{file.name}</div>
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

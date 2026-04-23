"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
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
  const router = useRouter();
  const [folders, setFolders] = useState<PDFFolderWithFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<PDFFolderWithFiles | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"folders" | "files">("folders");

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

  // Filter files based on search
  const getFilteredFiles = () => {
    if (!selectedFolder) return [];
    if (!searchQuery.trim()) return selectedFolder.files;
    
    return selectedFolder.files.filter((file) =>
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
              placeholder={selectedFolder ? "Search files..." : "Search folders..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {selectedFolder && (
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFolder(null);
                setSearchQuery("");
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Folders
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium flex items-center gap-2">
              <span>{selectedFolder.icon}</span>
              {selectedFolder.name}
            </span>
          </div>
        )}

        {/* Content */}
        {!selectedFolder ? (
          // Folders View
          <>
            {getFilteredFolders().length === 0 ? (
              <div className="text-center py-16">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No folders available</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "No folders match your search" 
                    : "Check back later for study materials"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredFolders().map((folder) => (
                  <Card
                    key={folder.id}
                    className={`transition-shadow ${folder.canAccess === false ? "opacity-80" : "cursor-pointer hover:shadow-md"}`}
                    onClick={() => {
                      if (folder.canAccess === false) return;
                      setSelectedFolder(folder);
                      setSearchQuery("");
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${folder.color}20` }}
                        >
                          {folder.icon}
                        </div>
                        <Badge variant="secondary">
                          {folder.files.length} files
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">{folder.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Course: {folder.category || "GENERAL"}
                        </Badge>
                        {folder.isPremium && (
                          <Badge variant="secondary" className="text-xs">Premium</Badge>
                        )}
                        {folder.canAccess === false && (
                          <Badge variant="destructive" className="text-xs">Locked</Badge>
                        )}
                      </div>
                      {folder.description && (
                        <CardDescription className="line-clamp-2">
                          {folder.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {folder.canAccess === false ? (
                        <Button variant="outline" className="w-full" disabled>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Premium Locked
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full">
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Open Folder
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          // Files View
          <>
            {selectedFolder.description && (
              <Card className="mb-6">
                <CardContent className="py-4">
                  <p className="text-muted-foreground">{selectedFolder.description}</p>
                </CardContent>
              </Card>
            )}

            {getFilteredFiles().length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No files available</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "No files match your search" 
                    : "This folder is empty"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredFiles().map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <div className="flex items-center p-4">
                      <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-4">
                        <FileText className="h-7 w-7 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{file.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.fileSize)}</span>
                          {file.pageCount && (
                            <span>{file.pageCount} pages</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {file.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {file.downloadCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPDF(file)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadPDF(file)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

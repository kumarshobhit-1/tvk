"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderPlus, 
  ArrowLeft,
  Upload, 
  Trash2, 
  FolderOpen, 
  FileText, 
  Eye, 
  EyeOff,
  Download,
  MoreVertical,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import { authenticatedFetch } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import type { PDFFolder, PDFFile } from "@/lib/pdf-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FOLDER_ICONS = ["📁", "📚", "📖", "📝", "📋", "📑", "🗂️", "💼", "🎓", "⚖️", "💰", "🏦"];
const FOLDER_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", 
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
];

const DEFAULT_CATEGORY_OPTIONS = ["SEBI", "JEE", "BANKING", "SSC", "UPSC"];

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

export default function AdminPDFsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [folders, setFolders] = useState<PDFFolder[]>([]);
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<PDFFolder | null>(null);

  // Dialog states
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [showRenameFolderDialog, setShowRenameFolderDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "folder" | "file"; id: string; name: string } | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORY_OPTIONS);
  const [editingFolder, setEditingFolder] = useState<PDFFolder | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [editParentFolderId, setEditParentFolderId] = useState<string | null>(null);

  // Form states
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderCategory, setFolderCategory] = useState("SEBI");
  const [folderIsPremium, setFolderIsPremium] = useState(false);
  const [folderIcon, setFolderIcon] = useState("📁");
  const [folderColor, setFolderColor] = useState("#3b82f6");
  const [folderPublished, setFolderPublished] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPublished, setUploadPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);
  const [updatingFolder, setUpdatingFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(false);

  const [editFolderCategory, setEditFolderCategory] = useState("SEBI");
  const [editFolderIsPremium, setEditFolderIsPremium] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");

  useEffect(() => {
    document.title = "PDF Management - Admin | The Victory Key";
  }, []);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await authenticatedFetch("/api/pdf/admintvk01");
      const data = await response.json();
      
      if (response.ok) {
        setFolders(data.folders || []);
        setFiles(data.files || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  const loadCategoryOptions = useCallback(async () => {
    try {
      const response = await authenticatedFetch("/api/exam/categories");
      if (!response.ok) return;

      const data = await response.json();
      const dynamicCategories = Array.isArray(data.categories)
        ? data.categories.map((item: string) => normalizeCategory(item)).filter(Boolean)
        : [];

      setCategoryOptions(Array.from(new Set([...DEFAULT_CATEGORY_OPTIONS, ...dynamicCategories])));
    } catch {
      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const checkAdmin = async () => {
      try {
        const response = await authenticatedFetch("/api/pdf/admintvk01");
        if (response.status === 403) {
          router.push("/");
          return;
        }
        setIsAdmin(true);
        fetchData();
        loadCategoryOptions();
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router, fetchData, loadCategoryOptions]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }

    setSavingFolder(true);
    try {
      const response = await authenticatedFetch("/api/pdf/admintvk01", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createFolder",
          name: folderName,
          description: folderDescription,
          category: folderCategory,
          isPremium: folderIsPremium,
          icon: folderIcon,
          color: folderColor,
          parentId: parentFolderId,
          isPublished: folderPublished,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Folder created successfully!",
        });
        setShowFolderDialog(false);
        resetFolderForm();
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    } finally {
      setSavingFolder(false);
    }
  };

  const openCreateFolderDialog = (parentId: string | null = null) => {
    resetFolderForm();
    setParentFolderId(parentId);
    setShowFolderDialog(true);
  };

  const handleUploadPDFs = async () => {
    if (!selectedFolder) {
      toast({
        title: "Error",
        description: "Please select a folder first",
        variant: "destructive",
      });
      return;
    }

    if (uploadFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("folderId", selectedFolder.id);
      formData.append("isPublished", String(uploadPublished));
      
      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await authenticatedFetch("/api/pdf/admintvk01", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        const message = data.errors?.length 
          ? `Uploaded ${data.uploadedCount} files. Errors: ${data.errors.join(", ")}`
          : `Successfully uploaded ${data.uploadedCount} files!`;
        
        toast({
          title: data.errors?.length ? "Partial Success" : "Success",
          description: message,
          variant: data.errors?.length ? "default" : "default",
        });
        
        setShowUploadDialog(false);
        setUploadFiles([]);
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePublish = async (type: "folder" | "file", id: string, currentStatus: boolean) => {
    try {
      const response = await authenticatedFetch("/api/pdf/admintvk01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id,
          isPublished: !currentStatus,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${type === "folder" ? "Folder" : "File"} ${!currentStatus ? "published" : "unpublished"}!`,
        });
        fetchData();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await authenticatedFetch(
        `/api/pdf/admintvk01?type=${deleteTarget.type}&id=${deleteTarget.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `${deleteTarget.type === "folder" ? "Folder" : "File"} deleted successfully!`,
        });
        setShowDeleteDialog(false);
        setDeleteTarget(null);
        if (deleteTarget.type === "folder" && selectedFolder?.id === deleteTarget.id) {
          setSelectedFolder(null);
        }
        fetchData();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const getSortedFolders = () => [...folders].sort((a, b) => (a.order || 0) - (b.order || 0));

  const getSortedFilesForFolder = (folderId: string) =>
    [...getFilesForFolder(folderId)].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleMoveFolder = async (folderId: string, direction: "up" | "down") => {
    const currentFolder = folders.find((folder) => folder.id === folderId);
    if (!currentFolder) return;

    // Only consider siblings (same parent)
    const siblings = getSortedFolders().filter((folder) => (folder.parentId || null) === (currentFolder.parentId || null));
    const index = siblings.findIndex((item) => item.id === folderId);
    if (index < 0) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;

    const target = siblings[swapIndex];

    // Assign deterministic order indices based on sibling positions and swap
    const updates = [
      { id: currentFolder.id, order: swapIndex },
      { id: target.id, order: index },
    ];

    try {
      await Promise.all(
        updates.map((u) =>
          authenticatedFetch("/api/pdf/admintvk01", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "folder", id: u.id, order: u.order }),
          })
        )
      );

      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reorder folders", variant: "destructive" });
    }
  };

  const handleMoveFile = async (fileId: string, folderId: string, direction: "up" | "down") => {
    const sorted = getSortedFilesForFolder(folderId);
    const index = sorted.findIndex((item) => item.id === fileId);
    if (index < 0) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[swapIndex];

    try {
      await Promise.all([
        authenticatedFetch("/api/pdf/admintvk01", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "file", id: current.id, order: target.order ?? swapIndex }),
        }),
        authenticatedFetch("/api/pdf/admintvk01", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "file", id: target.id, order: current.order ?? index }),
        }),
      ]);

      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reorder files", variant: "destructive" });
    }
  };

  const handleTogglePremium = async (type: "folder" | "file", id: string, currentStatus: boolean) => {
    try {
      const response = await authenticatedFetch("/api/pdf/admintvk01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id,
          isPremium: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to update premium status");
      }

      toast({
        title: "Updated",
        description: `${type === "folder" ? "Folder" : "File"} ${!currentStatus ? "marked premium" : "made free"}`,
      });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update premium", variant: "destructive" });
    }
  };

  const handleToggleLock = async (fileId: string, currentStatus: boolean) => {
    try {
      const response = await authenticatedFetch("/api/pdf/admintvk01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "file", id: fileId, isLocked: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to update lock status");
      }

      toast({ title: "Updated", description: `File ${!currentStatus ? "locked" : "unlocked"}` });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update lock", variant: "destructive" });
    }
  };

  const openEditFolderDialog = (folder: PDFFolder) => {
    setEditingFolder(folder);
    setEditFolderCategory(normalizeCategory(folder.category || "SEBI"));
    setEditFolderIsPremium(folder.isPremium === true);
    setEditParentFolderId(folder.parentId || null);
    setShowEditFolderDialog(true);
  };

  const handleUpdateFolderAccess = async () => {
    if (!editingFolder) return;

    setUpdatingFolder(true);
    try {
      const response = await authenticatedFetch("/api/pdf/admintvk01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "folder",
          id: editingFolder.id,
          category: normalizeCategory(editFolderCategory),
          isPremium: editFolderIsPremium,
          parentId: editParentFolderId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update folder access");
      }

      toast({
        title: "Updated",
        description: "Folder category/premium updated successfully",
      });

      setShowEditFolderDialog(false);
      setEditingFolder(null);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not update folder access",
        variant: "destructive",
      });
    } finally {
      setUpdatingFolder(false);
    }
  };

  const openRenameFolderDialog = (folder: PDFFolder) => {
    setEditingFolder(folder);
    setRenameFolderName(folder.name || "");
    setShowRenameFolderDialog(true);
  };

  const handleRenameFolder = async () => {
    if (!editingFolder) return;

    const nextName = renameFolderName.trim();
    if (!nextName) {
      toast({ title: "Error", description: "Folder name is required", variant: "destructive" });
      return;
    }

    setRenamingFolder(true);
    try {
      const response = await authenticatedFetch("/api/pdf/admintvk01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "folder", id: editingFolder.id, name: nextName }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to rename folder");
      }

      toast({ title: "Updated", description: "Folder renamed successfully" });
      setShowRenameFolderDialog(false);
      setEditingFolder(null);
      setRenameFolderName("");
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not rename folder", variant: "destructive" });
    } finally {
      setRenamingFolder(false);
    }
  };

  const resetFolderForm = () => {
    setFolderName("");
    setFolderDescription("");
    setFolderCategory("SEBI");
    setFolderIsPremium(false);
    setFolderIcon("📁");
    setFolderColor("#3b82f6");
    setFolderPublished(false);
    setParentFolderId(null);
  };

  const getFilesForFolder = (folderId: string) => {
    return files.filter((f) => f.folderId === folderId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getChildFolders = (parentId: string | null) => {
    return folders
      .filter((folder) => (folder.parentId || null) === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getRootFolders = () => {
    return folders
      .filter((folder) => {
        const parentId = folder.parentId || null;
        if (parentId === null) return true;
        return !folders.some((candidate) => candidate.id === parentId);
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getDescendantFolderIds = (folderId: string): string[] => {
    if (!folderId) return [];
    const children = folders.filter((folder) => folder.parentId === folderId);
    return children.flatMap((child) => [child.id, ...getDescendantFolderIds(child.id)]);
  };

  const renderFolderNode = (folder: PDFFolder, depth = 0, showChildren = true) => {
    const folderFiles = getFilesForFolder(folder.id);
    const childFolders = getChildFolders(folder.id);
    const hasChildren = childFolders.length > 0;
    const isOrphan = (folder.parentId || null) !== null && !folders.some((candidate) => candidate.id === folder.parentId);

    return (
      <div key={folder.id}>
        <div
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
            selectedFolder?.id === folder.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
          }`}
          style={{ paddingLeft: 12 + depth * 18 }}
          onClick={() => setSelectedFolder(folder)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl shrink-0" style={{ filter: `drop-shadow(0 0 2px ${folder.color})` }}>
                {folder.icon}
              </span>
              <div>
                <p className="font-medium flex items-center gap-2">
                  {folder.name}
                  {depth > 0 && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Child</span>}
                  {isOrphan && <span className="text-[10px] uppercase tracking-wide text-destructive">Orphan</span>}
                </p>
                <p className="text-xs text-muted-foreground">{folderFiles.length} files</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {folder.category || "GENERAL"}
                  </Badge>
                  {hasChildren && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {childFolders.length} subfolders
                    </Badge>
                  )}
                  {folder.isPremium && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={folder.isPublished ? "default" : "secondary"}>
                {folder.isPublished ? "Published" : "Draft"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCreateFolderDialog(folder.id); }}>
                    <FolderPlus className="h-4 w-4 mr-2" /> Create Subfolder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameFolderDialog(folder); }}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditFolderDialog(folder); }}>
                    <Check className="h-4 w-4 mr-2" /> Edit Access
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePremium("folder", folder.id, folder.isPremium === true); }}>
                    {folder.isPremium ? (<><Eye className="h-4 w-4 mr-2" /> Make Free</>) : (<><EyeOff className="h-4 w-4 mr-2" /> Mark Premium</>)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveFolder(folder.id, "up"); }}>
                    Move Up
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveFolder(folder.id, "down"); }}>
                    Move Down
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePublish("folder", folder.id, folder.isPublished); }}>
                    {folder.isPublished ? (<><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>) : (<><Eye className="h-4 w-4 mr-2" /> Publish</>)}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "folder", id: folder.id, name: folder.name }); setShowDeleteDialog(true); }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        {showChildren && (
          <div
            className={`space-y-2 mt-2 ${depth > 0 ? "ml-4 pl-4 border-l border-dashed border-muted-foreground/30" : ""}`}
          >
            {childFolders.map((child) => renderFolderNode(child, depth + 1, true))}
          </div>
        )}
      </div>
    );
  };

  const selectedFolderChildFolders = selectedFolder ? getChildFolders(selectedFolder.id) : [];
  const selectedFolderParent = selectedFolder
    ? folders.find((folder) => folder.id === selectedFolder.parentId) || null
    : null;

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">PDF Management</h1>
            <p className="text-muted-foreground">Upload and manage PDF files for users</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => openCreateFolderDialog()}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Folders ({folders.length})
              </CardTitle>
              <CardDescription>Select a folder to manage files</CardDescription>
            </CardHeader>
            <CardContent>
              {folders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No folders yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => openCreateFolderDialog()}
                  >
                    Create First Folder
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {getRootFolders().map((folder) => renderFolderNode(folder, 0, false))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedFolder ? selectedFolder.name : "Files"}
                  </CardTitle>
                  <CardDescription>
                    {selectedFolder 
                      ? `${getFilesForFolder(selectedFolder.id).length} files in this folder`
                      : "Select a folder to view files"
                    }
                  </CardDescription>
                </div>
                {selectedFolder && (
                  <div className="flex items-center gap-2">
                    {selectedFolderParent && (
                      <Button variant="outline" onClick={() => setSelectedFolder(selectedFolderParent)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => openCreateFolderDialog(selectedFolder.id)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Create Subfolder
                    </Button>
                    <Button onClick={() => setShowUploadDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDFs
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedFolder ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a folder to view and manage files</p>
                </div>
              ) : (
                <>
                  {selectedFolderChildFolders.length > 0 && (
                    <div className="mb-6 rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Subfolders</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedFolderChildFolders.length} folder(s) inside this folder
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {selectedFolderChildFolders.map((childFolder) => renderFolderNode(childFolder, 1))}
                      </div>
                    </div>
                  )}
                  {getFilesForFolder(selectedFolder.id).length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No files in this folder</p>
                      <Button onClick={() => setShowUploadDialog(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload PDFs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFilesForFolder(selectedFolder.id).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatFileSize(file.fileSize)}</span>
                                {file.pageCount && <span>{file.pageCount} pages</span>}
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {file.viewCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" /> {file.downloadCount}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={file.isPublished ? "default" : "secondary"}>
                              {file.isPublished ? "Published" : "Draft"}
                            </Badge>
                            {file.isPremium && <Badge variant="secondary">Premium</Badge>}
                            {file.isLocked && (
                              <Badge variant="destructive">Locked</Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleMoveFile(file.id, file.folderId, "up")}
                                >
                                  Move Up
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMoveFile(file.id, file.folderId, "down")}
                                >
                                  Move Down
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTogglePremium("file", file.id, file.isPremium === true)}
                                >
                                  {file.isPremium ? (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Make Free
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Mark Premium
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleLock(file.id, file.isLocked === true)}
                                >
                                  {file.isLocked ? (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Unlock
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Lock
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a 
                                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(file.cloudinarySecureUrl)}&embedded=true`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View PDF
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a 
                                    href={file.cloudinarySecureUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTogglePublish("file", file.id, file.isPublished)}
                                >
                                  {file.isPublished ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeleteTarget({ type: "file", id: file.id, name: file.name });
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Folder Dialog */}
        <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a folder to organize your PDF files
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., SEBI Grade A Papers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folderDescription">Description (Optional)</Label>
                <Textarea
                  id="folderDescription"
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="Brief description of the folder contents"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course Category</Label>
                  <Select value={folderCategory} onValueChange={setFolderCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parent Folder</Label>
                  <Select value={parentFolderId || "__none__"} onValueChange={(value) => setParentFolderId(value === "__none__" ? null : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Top level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Top level</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 mt-7">
                  <div className="space-y-0.5">
                    <Label>Premium Folder</Label>
                    <p className="text-xs text-muted-foreground">Category-wise premium access</p>
                  </div>
                  <Switch
                    checked={folderIsPremium}
                    onCheckedChange={setFolderIsPremium}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {FOLDER_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-colors ${
                          folderIcon === icon
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                        }`}
                        onClick={() => setFolderIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          folderColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFolderColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publish Immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this folder visible to users
                  </p>
                </div>
                <Switch
                  checked={folderPublished}
                  onCheckedChange={setFolderPublished}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={savingFolder}>
                {savingFolder ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditFolderDialog} onOpenChange={setShowEditFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Folder Access</DialogTitle>
              <DialogDescription>
                Update category and premium access for this existing folder.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Course Category</Label>
                <Select value={editFolderCategory} onValueChange={setEditFolderCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Parent Folder</Label>
                <Select value={editParentFolderId || "__none__"} onValueChange={(value) => setEditParentFolderId(value === "__none__" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Top level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Top level</SelectItem>
                    {folders
                      .filter((folder) => folder.id !== editingFolder?.id && !getDescendantFolderIds(editingFolder?.id || "").includes(folder.id))
                      .map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="space-y-0.5">
                  <Label>Premium Folder</Label>
                  <p className="text-xs text-muted-foreground">
                    Restrict folder by selected category premium
                  </p>
                </div>
                <Switch
                  checked={editFolderIsPremium}
                  onCheckedChange={setEditFolderIsPremium}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateFolderAccess} disabled={updatingFolder}>
                {updatingFolder ? "Updating..." : "Update Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRenameFolderDialog} onOpenChange={setShowRenameFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Update folder name for better sorting and readability.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="rename-folder-name">Folder Name</Label>
              <Input
                id="rename-folder-name"
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenameFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameFolder} disabled={renamingFolder}>
                {renamingFolder ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload PDFs to {selectedFolder?.name}</DialogTitle>
              <DialogDescription>
                Select one or more PDF files to upload
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pdfFiles">PDF Files</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    id="pdfFiles"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setUploadFiles(files);
                    }}
                  />
                  <label
                    htmlFor="pdfFiles"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to select PDFs or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Multiple files supported
                    </span>
                  </label>
                </div>
                {uploadFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">{uploadFiles.length} file(s) selected:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                          <span className="truncate">{file.name}</span>
                          <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publish Immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Make files visible to users after upload
                  </p>
                </div>
                <Switch
                  checked={uploadPublished}
                  onCheckedChange={setUploadPublished}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadPDFs} 
                disabled={uploading || uploadFiles.length === 0}
              >
                {uploading ? "Uploading..." : `Upload ${uploadFiles.length} File(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteTarget?.name}</span>?
                {deleteTarget?.type === "folder" && (
                  <span className="block mt-2 text-destructive">
                    This will also delete all files in this folder!
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

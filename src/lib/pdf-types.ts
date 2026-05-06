// PDF Library Types

export interface PDFFolder {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isPremium?: boolean;
  canAccess?: boolean;
  icon?: string;
  color?: string;
  parentId?: string | null; // For nested folders
  order: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PDFFile {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isLocked?: boolean;
  isPremium?: boolean;
  premiumOverridden?: boolean;
  canAccess?: boolean;
  folderId: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  cloudinarySecureUrl: string;
  thumbnailUrl?: string | null;
  fileSize: number; // in bytes
  pageCount?: number | null;
  mimeType: string;
  order: number;
  isPublished: boolean;
  downloadCount: number;
  viewCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PDFUploadResponse {
  success: boolean;
  publicId?: string;
  url?: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  error?: string;
}

export interface PDFFolderWithFiles extends PDFFolder {
  files: PDFFile[];
  subfolders?: PDFFolderWithFiles[];
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  category?: string;
  isPremium?: boolean;
  icon?: string;
  color?: string;
  parentId?: string | null;
  isPublished?: boolean;
}

export interface UploadPDFRequest {
  folderId: string;
  files: File[];
  isPublished?: boolean;
}

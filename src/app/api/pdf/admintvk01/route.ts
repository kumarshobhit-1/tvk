// Admin API for creating folders and uploading PDFs
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { uploadPDFToCloudinary, deletePDFFromCloudinary } from "@/lib/cloudinary";
import type { PDFFolder, PDFFile } from "@/lib/pdf-types";
import { invalidatePdfCaches } from "@/lib/cache-strategy";

// POST - Create folder or upload PDF
export async function POST(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManagePDFs");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    
    // Handle multipart form data (PDF upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const folderId = formData.get("folderId") as string;
      const files = formData.getAll("files") as File[];
      const isPublished = formData.get("isPublished") === "true";

      if (!folderId) {
        return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
      }

      if (!files || files.length === 0) {
        return NextResponse.json({ error: "No files provided" }, { status: 400 });
      }

      // Get folder to get its name for the cloud path
      const folderDoc = await adminDB.collection("pdf_folders").doc(folderId).get();
      if (!folderDoc.exists) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
      const folderData = folderDoc.data() as PDFFolder;

      const uploadedFiles: PDFFile[] = [];
      const errors: string[] = [];

      // Get current file count for ordering
      const existingFilesSnapshot = await adminDB
        .collection("pdf_files")
        .where("folderId", "==", folderId)
        .get();
      let orderIndex = existingFilesSnapshot.size;

      for (const file of files) {
        try {
          // Validate file type
          if (file.type !== "application/pdf") {
            errors.push(`${file.name}: Not a PDF file`);
            continue;
          }

          // Convert file to buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to Cloudinary
          const cloudinaryResult = await uploadPDFToCloudinary(
            buffer,
            file.name,
            folderData.name.replace(/[^a-zA-Z0-9-_]/g, "_")
          );

          // Create PDF file record in Firestore
          const pdfFile: Omit<PDFFile, "id"> = {
            name: file.name.replace(/\.pdf$/i, ""),
            category: folderData.category || "SEBI",
            // default to unlocked unless explicitly set later by admin
            isLocked: false,
            isPremium: folderData.isPremium === true,
            premiumOverridden: false,
            folderId,
            cloudinaryPublicId: cloudinaryResult.public_id,
            cloudinaryUrl: cloudinaryResult.url,
            cloudinarySecureUrl: cloudinaryResult.secure_url,
            thumbnailUrl: cloudinaryResult.thumbnail_url || null,
            fileSize: cloudinaryResult.bytes,
            pageCount: cloudinaryResult.pages || null,
            mimeType: "application/pdf",
            order: orderIndex++,
            isPublished,
            downloadCount: 0,
            viewCount: 0,
            createdBy: auth.userId!,
            createdAt: new Date() as any,
          };

          const fileRef = await adminDB.collection("pdf_files").add(pdfFile);
          uploadedFiles.push({ ...pdfFile, id: fileRef.id } as PDFFile);
          invalidatePdfCaches(folderId);
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error);
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        uploadedCount: uploadedFiles.length,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Handle JSON (folder creation)
    const data = await request.json();
    const { action } = data;

    if (action === "createFolder") {
      const { name, description, category, isPremium, icon, color, parentId, isPublished } = data;

      if (!name) {
        return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
      }

      // Get current folder count for ordering
      const existingFoldersSnapshot = await adminDB.collection("pdf_folders").get();
      const orderIndex = existingFoldersSnapshot.size;

      const folder: Omit<PDFFolder, "id"> = {
        name,
        description: description || "",
        category: String(category || "SEBI").trim().toUpperCase(),
        isPremium: isPremium === true,
        icon: icon || "📁",
        color: color || "#3b82f6",
        parentId: parentId || null,
        order: orderIndex,
        isPublished: isPublished ?? false,
        createdBy: auth.userId!,
        createdAt: new Date() as any,
      };

      const folderRef = await adminDB.collection("pdf_folders").add(folder);

      invalidatePdfCaches(folder.parentId || undefined);

      return NextResponse.json({
        success: true,
        folder: { ...folder, id: folderRef.id },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in PDF admin API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List all folders and files (admin)
export async function GET(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManagePDFs");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    // Get all folders
    const foldersSnapshot = await adminDB
      .collection("pdf_folders")
      .orderBy("order", "asc")
      .get();

    const folders: PDFFolder[] = foldersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PDFFolder[];

    // Get files - either all or for specific folder
    let filesQuery = adminDB.collection("pdf_files").orderBy("order", "asc");
    if (folderId) {
      filesQuery = adminDB
        .collection("pdf_files")
        .where("folderId", "==", folderId)
        .orderBy("order", "asc") as any;
    }

    const filesSnapshot = await filesQuery.get();
    const files: PDFFile[] = filesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PDFFile[];

    return NextResponse.json({ folders, files });
  } catch (error: any) {
    console.error("Error fetching PDFs:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update folder or file
export async function PUT(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManagePDFs");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { type, id, ...updates } = data;

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    const collection = type === "folder" ? "pdf_folders" : "pdf_files";
    const docRef = adminDB.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }

    const normalizedUpdates: Record<string, any> = {
      ...updates,
      updatedAt: new Date(),
    };

    if (type === "folder" && typeof normalizedUpdates.category === "string") {
      normalizedUpdates.category = normalizedUpdates.category.trim().toUpperCase();
    }

    if (type === "file" && typeof normalizedUpdates.isPremium === "boolean") {
      // File-level premium toggles are treated as explicit overrides.
      normalizedUpdates.premiumOverridden = true;
    }
    // Allow toggling lock on files
    if (type === "file" && typeof normalizedUpdates.isLocked === "boolean") {
      // no special handling required, just persist the flag
    }

    await docRef.update(normalizedUpdates);

    if (type === "folder") {
      const shouldSyncCategory = typeof normalizedUpdates.category === "string";
      const shouldSyncPremium = typeof normalizedUpdates.isPremium === "boolean";

      if (shouldSyncCategory || shouldSyncPremium) {
        const filesSnapshot = await adminDB
          .collection("pdf_files")
          .where("folderId", "==", id)
          .get();

        if (!filesSnapshot.empty) {
          const batch = adminDB.batch();
          filesSnapshot.docs.forEach((fileDoc) => {
            const fileUpdatePayload: Record<string, any> = { updatedAt: new Date() };
            if (shouldSyncCategory) fileUpdatePayload.category = normalizedUpdates.category;
            if (shouldSyncPremium) {
              // Folder premium toggle should apply to all files in that folder.
              fileUpdatePayload.isPremium = normalizedUpdates.isPremium;
              fileUpdatePayload.premiumOverridden = false;
            }

            batch.update(fileDoc.ref, fileUpdatePayload);
          });
          await batch.commit();
        }
      }
    }

    invalidatePdfCaches(type === "file" ? (normalizedUpdates.folderId || undefined) : id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete folder or file
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManagePDFs");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    if (type === "folder") {
      const foldersSnapshot = await adminDB.collection("pdf_folders").get();
      const allFolders = foldersSnapshot.docs.map((doc) => ({
        ...(doc.data() as PDFFolder),
        id: doc.id,
      }));

      const folderMap = new Map(allFolders.map((folder) => [folder.id, folder]));

      const collectDescendants = (folderId: string): string[] => {
        const directChildren = allFolders.filter((folder) => (folder.parentId || null) === folderId);
        return directChildren.flatMap((child) => [child.id, ...collectDescendants(child.id)]);
      };

      const descendantIds = collectDescendants(id);
      const folderIdsToDelete = [id, ...descendantIds];

      // Delete all files in the folder subtree first
      for (const folderId of folderIdsToDelete) {
        const filesSnapshot = await adminDB
          .collection("pdf_files")
          .where("folderId", "==", folderId)
          .get();

        for (const fileDoc of filesSnapshot.docs) {
          const fileData = fileDoc.data() as PDFFile;
          await deletePDFFromCloudinary(fileData.cloudinaryPublicId);
          await fileDoc.ref.delete();
        }
      }

      // Delete child folders deepest-first, then the parent folder
      const foldersByDepth = folderIdsToDelete
        .map((folderId) => ({ folderId, depth: collectDescendants(folderId).length }))
        .sort((a, b) => b.depth - a.depth);

      for (const item of foldersByDepth) {
        await adminDB.collection("pdf_folders").doc(item.folderId).delete();
      }
    } else if (type === "file") {
      // Get file data first
      const fileDoc = await adminDB.collection("pdf_files").doc(id).get();
      if (fileDoc.exists) {
        const fileData = fileDoc.data() as PDFFile;
        await deletePDFFromCloudinary(fileData.cloudinaryPublicId);
        await fileDoc.ref.delete();
      }
    }

    invalidatePdfCaches(type === "file" ? id : undefined);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

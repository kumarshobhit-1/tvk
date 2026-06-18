// Public API for listing published PDFs
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB, increment } from "@/lib/firebase/firebase-admin";

import type { PDFFolder, PDFFile, PDFFolderWithFiles } from "@/lib/pdf-types";
import { buildPdfAccessUrl, canUserAccessPdf } from "@/lib/pdf-access";

// GET - List published folders (optionally files for a single folder)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    let userData: any | undefined;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("session")?.value;
      if (sessionCookie) {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const userSnap = await adminDB.collection("users").doc(decodedToken.uid).get();
        userData = userSnap.exists ? userSnap.data() : undefined;
      }
    } catch {
      userData = undefined;
    }

    // 1) Fetch ONLY published folders. No pdf_files full scan.
    const foldersSnapshot = await adminDB
      .collection("pdf_folders")
      .where("isPublished", "==", true)
      .get();

    const folders: PDFFolder[] = foldersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as PDFFolder)
      .map((folder) => ({
        ...folder,
        // Folder stays browsable; access gating is enforced at file level.
        canAccess: true,
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const folderMap = new Map<string, PDFFolder>();
    folders.forEach((f) => folderMap.set(f.id, f));

    // 2) If folderId is present, fetch ONLY files from that folder.
    // If not present: return folders with empty files array (library sidebar stays fast).
    let files: PDFFile[] = [];
    if (folderId) {
      const filesSnapshot = await adminDB
        .collection("pdf_files")
        .where("isPublished", "==", true)
        .where("folderId", "==", folderId)
        .get();

      files = filesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as PDFFile)
        .filter((file) => folderMap.has(file.folderId))
        .map((file) => {
          const folder = folderMap.get(file.folderId)!;
          const effectiveCategory = file.category || folder.category || "";
          const isLocked = file.isLocked === true;
          const canAccess = canUserAccessPdf(userData, { ...file, category: effectiveCategory }, folder);
          const { cloudinaryUrl, cloudinarySecureUrl, ...safeFile } = file as PDFFile & {
            cloudinaryUrl?: string;
            cloudinarySecureUrl?: string;
          };

          return {
            ...safeFile,
            category: effectiveCategory,
            isPremium: file.premiumOverridden === true ? file.isPremium === true : folder.isPremium === true,
            isLocked,
            canAccess,
            viewUrl: buildPdfAccessUrl(file.id, "view"),
            downloadUrl: buildPdfAccessUrl(file.id, "download"),
          } as PDFFile;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // 3) Build folder objects and nest subfolders by parentId.
    // Each folder gets `files` only if folderId filter is provided.
    const folderMap2 = new Map<string, PDFFolderWithFiles>();
    folders.forEach((folder) => {
      const folderFiles = folderId ? files.filter((file) => file.folderId === folder.id) : [];
      folderMap2.set(folder.id, { ...folder, files: folderFiles, subfolders: [] });
    });

    const roots: PDFFolderWithFiles[] = [];
    for (const folder of folderMap2.values()) {
      const parentId = folder.parentId || null;
      if (parentId && folderMap2.has(parentId)) {
        const parent = folderMap2.get(parentId)!;
        parent.subfolders = parent.subfolders || [];
        parent.subfolders.push(folder);
      } else {
        roots.push(folder);
      }
    }

    const sortRecursively = (nodeList: PDFFolderWithFiles[] | undefined) => {
      if (!nodeList) return;
      nodeList.sort((a, b) => (a.order || 0) - (b.order || 0));
      nodeList.forEach((n) => sortRecursively(n.subfolders));
    };
    sortRecursively(roots);

    return NextResponse.json({ folders: roots, totalFiles: files.length });
  } catch (error: any) {
    console.error("Error fetching PDFs:", error);
    return NextResponse.json({ error: "Failed to fetch PDFs" }, { status: 500 });
  }
}


// POST - Track view/download
export async function POST(request: NextRequest) {
  try {
    const { fileId, action } = await request.json();

    if (!fileId || !action) {
      return NextResponse.json({ error: "File ID and action required" }, { status: 400 });
    }

    const fileRef = adminDB.collection("pdf_files").doc(fileId);

    // FieldValue.increment avoids an extra read (no doc.get())
    const field = action === "view" ? "viewCount" : "downloadCount";

    // We still perform a cheap existence check to preserve current 404 behavior.
    const fileDoc = await fileRef.get();
    if (!fileDoc.exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Atomic increment (no read-before-write).
    // Note: we keep a small doc.get() only for existence/404 behavior.
    // Atomic increment counter.
    await fileRef.update({
      [field]: increment(1),
    });





    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking:", error);
    return NextResponse.json({ error: "Failed to track action" }, { status: 500 });
  }
}


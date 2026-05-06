// Public API for listing published PDFs
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import type { PDFFolder, PDFFile, PDFFolderWithFiles } from "@/lib/pdf-types";
import { hasPremiumAccess } from "@/lib/premium-access";

// GET - List all published folders and files
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

    // Get all folders and filter/sort in memory (avoids composite index requirement)
    const foldersSnapshot = await adminDB
      .collection("pdf_folders")
      .get();

    const folders: PDFFolder[] = foldersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as PDFFolder)
      .filter((folder) => folder.isPublished === true)
      .map((folder) => ({
        ...folder,
        // Folder stays browsable; access gating is enforced at file level.
        canAccess: true,
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const folderMap = new Map(folders.map((folder) => [folder.id, folder]));

    // Get all published files and filter/sort in memory
    const filesSnapshot = await adminDB
      .collection("pdf_files")
      .get();

    let files: PDFFile[] = filesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as PDFFile)
      .filter((file) => file.isPublished === true)
      .filter((file) => folderMap.has(file.folderId))
      .map((file) => {
        const folder = folderMap.get(file.folderId)!;
        const effectiveCategory = file.category || folder.category || "";
        const requiresPremium =
          file.premiumOverridden === true
            ? file.isPremium === true
            : folder.isPremium === true;

        // Allow explicit per-user PDF access if present on profile.
        // When explicit IDs exist, they override broader category access.
        const isPremiumUser = userData?.isPremium === true || userData?.premium === true;
        const allowedPdfIds: string[] = Array.isArray(userData?.allowedPdfIds) ? userData.allowedPdfIds.map((id: any) => String(id)) : [];
        const allowedPdfSet = new Set(allowedPdfIds);
        const hasExplicitPdfAccess = isPremiumUser && allowedPdfSet.size > 0;

        const isLocked = file.isLocked === true;

        return {
          ...file,
          category: effectiveCategory,
          isPremium: requiresPremium,
          isLocked,
          canAccess: isLocked
            ? false
            : !requiresPremium
              ? true
              : hasExplicitPdfAccess
                ? allowedPdfSet.has(file.id)
                : hasPremiumAccess(userData, effectiveCategory),
        } as PDFFile;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (folderId) {
      files = files.filter((file) => file.folderId === folderId);
    }

    // Build folder objects with files and nest subfolders by parentId
    const folderMap2 = new Map<string, PDFFolderWithFiles>();

    // initialize entries with files
    folders.forEach((folder) => {
      const folderFiles = files.filter((file) => file.folderId === folder.id);
      folderMap2.set(folder.id, { ...folder, files: folderFiles, subfolders: [] });
    });

    const roots: PDFFolderWithFiles[] = [];

    // attach children to parents
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

    // sort subfolders in each parent by order
    const sortRecursively = (nodeList: PDFFolderWithFiles[] | undefined) => {
      if (!nodeList) return;
      nodeList.sort((a, b) => (a.order || 0) - (b.order || 0));
      nodeList.forEach((n) => sortRecursively(n.subfolders));
    };

    sortRecursively(roots);

    return NextResponse.json({ folders: roots, totalFiles: files.length });
  } catch (error: any) {
    console.error("Error fetching PDFs:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDFs" },
      { status: 500 }
    );
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
    const fileDoc = await fileRef.get();

    if (!fileDoc.exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const field = action === "view" ? "viewCount" : "downloadCount";
    const currentCount = fileDoc.data()?.[field] || 0;

    await fileRef.update({
      [field]: currentCount + 1,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking:", error);
    return NextResponse.json(
      { error: "Failed to track action" },
      { status: 500 }
    );
  }
}

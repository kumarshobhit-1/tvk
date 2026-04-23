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
        canAccess:
          folder.isPremium === true
            ? hasPremiumAccess(userData, folder.category)
            : true,
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const folderAccessMap = new Map(folders.map((folder) => [folder.id, folder.canAccess !== false]));

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
      .filter((file) => folderAccessMap.get(file.folderId) === true)
      .filter((file) => {
        if (file.isPremium !== true) return true;
        return hasPremiumAccess(userData, file.category);
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (folderId) {
      files = files.filter((file) => file.folderId === folderId);
    }

    // Group files by folder
    const foldersWithFiles: PDFFolderWithFiles[] = folders.map((folder) => ({
      ...folder,
      files: folder.canAccess === false ? [] : files.filter((file) => file.folderId === folder.id),
    }));

    return NextResponse.json({
      folders: foldersWithFiles,
      totalFiles: files.length,
    });
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

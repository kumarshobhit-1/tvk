import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import type { PDFFile, PDFFolder } from "@/lib/pdf-types";
import { canUserAccessPdf } from "@/lib/pdf-access";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const action = searchParams.get("action") === "download" ? "download" : "view";

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

    const fileSnap = await adminDB.collection("pdf_files").doc(fileId).get();
    if (!fileSnap.exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = { id: fileSnap.id, ...fileSnap.data() } as PDFFile;

    const folderSnap = await adminDB.collection("pdf_folders").doc(file.folderId).get();
    if (!folderSnap.exists) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const folder = { id: folderSnap.id, ...folderSnap.data() } as PDFFolder;

    const userSnap = await adminDB.collection("users").doc(decodedToken.uid).get();
    const userData = userSnap.exists ? userSnap.data() : undefined;

    const effectiveCategory = file.category || folder.category || "";
    const canAccess = canUserAccessPdf(userData, { ...file, category: effectiveCategory }, folder);

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sourceUrl = file.cloudinarySecureUrl || file.cloudinaryUrl;
    if (!sourceUrl) {
      return NextResponse.json({ error: "Resource URL missing" }, { status: 500 });
    }

    const upstream = await fetch(sourceUrl);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Unable to fetch resource" }, { status: 502 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      action === "download"
        ? (upstream.headers.get("content-type") || file.mimeType || "application/pdf")
        : "application/pdf"
    );
    headers.set("Cache-Control", "no-store");
    headers.set(
      "Content-Disposition",
      `${action === "download" ? "attachment" : "inline"}; filename="${(file.name || "document").replace(/[^a-z0-9-_\.]/gi, "_")}.pdf"`
    );

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("PDF access error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

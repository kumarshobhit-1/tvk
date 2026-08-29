// Redirected to Firebase Admin GCS Storage wrapper to avoid Cloudinary quota limits
import { adminStorage } from './firebase/firebase-admin';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  bytes: number;
  format: string;
  pages?: number;
  thumbnail_url?: string;
}

export async function uploadPDFToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folderPath: string
): Promise<CloudinaryUploadResult> {
  // Clean filename - remove extension and special characters
  const cleanFileName = fileName
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');
  
  // Generate unique ID with timestamp
  const uniqueId = `${cleanFileName}_${Date.now()}`;
  const storagePath = `tvk-pdfs/${folderPath}/${uniqueId}.pdf`;

  const bucket = adminStorage.bucket();
  const file = bucket.file(storagePath);

  console.log(`Firebase Storage: Uploading PDF to ${storagePath}`);
  await file.save(fileBuffer, {
    metadata: {
      contentType: 'application/pdf',
    }
  });

  const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  console.log(`Firebase Storage: Upload complete. URL: ${firebaseUrl}`);

  return {
    public_id: storagePath,
    secure_url: firebaseUrl,
    url: firebaseUrl,
    bytes: fileBuffer.length,
    format: 'pdf',
  };
}

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folderPath: string = 'tvk-question-images'
): Promise<CloudinaryUploadResult> {
  const cleanFileName = fileName
    .replace(/\.[^/.]+$/i, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');

  const uniqueId = `${cleanFileName}_${Date.now()}`;
  
  let ext = 'png';
  if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
    ext = 'jpg';
  } else if (fileName.toLowerCase().endsWith('.webp')) {
    ext = 'webp';
  } else if (fileName.toLowerCase().endsWith('.gif')) {
    ext = 'gif';
  }

  const storagePath = `${folderPath}/${uniqueId}.${ext}`;

  const bucket = adminStorage.bucket();
  const file = bucket.file(storagePath);

  console.log(`Firebase Storage: Uploading Image to ${storagePath}`);
  await file.save(fileBuffer, {
    metadata: {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    }
  });

  const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  console.log(`Firebase Storage: Upload complete. URL: ${firebaseUrl}`);

  return {
    public_id: storagePath,
    secure_url: firebaseUrl,
    url: firebaseUrl,
    bytes: fileBuffer.length,
    format: ext,
  };
}

export function generatePDFThumbnail(publicId: string): string {
  // Return null or empty as Cloudinary URL thumbnail is no longer needed
  return "";
}

export async function deletePDFFromCloudinary(publicId: string): Promise<boolean> {
  try {
    console.log(`Firebase Storage: Deleting asset ${publicId}`);
    const bucket = adminStorage.bucket();
    const file = bucket.file(publicId);
    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting asset from Firebase Storage:', error);
    return false;
  }
}

export async function getPDFInfo(publicId: string) {
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(publicId);
    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    console.error('Error getting PDF info from Firebase Storage:', error);
    return null;
  }
}

// Keep a mock cloudinary export object to prevent any compile breakages elsewhere
export const cloudinary = {
  config: () => {},
  uploader: {
    destroy: async (publicId: string) => {
      const ok = await deletePDFFromCloudinary(publicId);
      return { result: ok ? 'ok' : 'failed' };
    }
  }
};

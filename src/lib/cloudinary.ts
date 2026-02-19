// Cloudinary configuration for PDF uploads
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  return new Promise((resolve, reject) => {
    // Clean filename - remove extension and special characters
    const cleanFileName = fileName
      .replace(/\.pdf$/i, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Generate unique ID with timestamp
    const uniqueId = `${cleanFileName}_${Date.now()}`;
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: `tvk-pdfs/${folderPath}`,
        public_id: uniqueId,
        type: 'upload', // Public delivery type
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          console.log('Cloudinary upload success:', result.secure_url);
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            bytes: result.bytes,
            format: result.format || 'pdf',
            pages: result.pages,
            thumbnail_url: undefined,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export function generatePDFThumbnail(publicId: string): string {
  // Generate a thumbnail image from the first page of the PDF
  return cloudinary.url(publicId, {
    resource_type: 'image',
    format: 'jpg',
    transformation: [
      { page: 1 },
      { width: 300, height: 400, crop: 'fill' },
      { quality: 'auto' },
    ],
  });
}

export async function deletePDFFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting PDF from Cloudinary:', error);
    return false;
  }
}

export async function getPDFInfo(publicId: string) {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'raw',
    });
    return result;
  } catch (error) {
    console.error('Error getting PDF info:', error);
    return null;
  }
}

export { cloudinary };

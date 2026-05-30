import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

const isConfigured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export function isCloudinaryConfigured() {
  return isConfigured;
}

export function uploadImageBuffer(buffer: Buffer, originalFilename: string) {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'restaurant-incidents',
        resource_type: 'image',
        public_id: `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9_-]/g, '-')}`
      },
      (error: unknown, result: { secure_url?: string } | undefined) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result?.secure_url ?? '');
      }
    );

    uploadStream.end(buffer);
  });
}
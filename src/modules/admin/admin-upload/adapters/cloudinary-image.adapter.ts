import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ImageStorageAdapter } from '../interfaces/image-storage.interface';

@Injectable()
export class CloudinaryImageAdapter implements ImageStorageAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  upload(file: Express.Multer.File): Promise<{ url: string; storageKey: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'snacks-ecommerce/products',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload returned no result'));
            return;
          }
          resolve({ url: result.secure_url, storageKey: result.public_id });
        },
      );

      stream.end(file.buffer);
    });
  }

  async delete(storageKey: string): Promise<void> {
    console.log(`[CloudinaryImageAdapter] destroy() called with storageKey: "${storageKey}"`);
    const result = await cloudinary.uploader.destroy(storageKey);
    console.log(`[CloudinaryImageAdapter] destroy() result:`, result);
  }
}

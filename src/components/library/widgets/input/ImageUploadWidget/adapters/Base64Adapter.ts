/**
 * Base64Adapter - Converts images to base64 data URLs (client-only, ephemeral)
 */

import { message } from 'antd';
import type { ImageData, StorageAdapter } from '../types';

export class Base64Adapter implements StorageAdapter {
  async upload(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        const imageData: ImageData = {
          uid,
          name: file.name,
          url: dataUrl,
          type: 'base64',
          hasModifications: false,
          metadata: {
            size: file.size,
            type: file.type,
            width: 0,
            height: 0
          }
        };

        // Load image to get dimensions
        const img = new window.Image();
        img.onload = () => {
          if (imageData.metadata) {
            imageData.metadata.width = img.naturalWidth;
            imageData.metadata.height = img.naturalHeight;
          }
        };
        img.src = dataUrl;

        message.success(`${file.name} loaded successfully`);
        resolve(imageData);
      };

      reader.onerror = (error) => {
        console.error('[Base64Adapter] Read error:', error);
        message.error(`Failed to load ${file.name}`);
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }

  async delete(id: string): Promise<void> {
    // No-op for base64 (client-only data)
    console.log('[Base64Adapter] Delete called (no-op for base64):', id);
  }

  resolveUrl(image: ImageData): string {
    // Prioritize drawingData (annotated version) if it exists
    if (image.drawingData) {
      return image.drawingData;
    }
    // Otherwise return original Base64 URL
    return image.url;
  }
}


/**
 * GridFSAdapter - Uploads images to GridFS storage
 */

import { message } from 'antd';
import type { ImageData, StorageAdapter } from '../types';

export class GridFSAdapter implements StorageAdapter {
  async upload(file: File): Promise<ImageData> {
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'inspection');

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`[GridFSAdapter] Upload response:`, {
        success: result.success,
        deduplicated: result.deduplicated,
        fileId: result.file?.id || result.id,
        fileHash: result.file?.fileHash || result.fileHash
      });
      
      const fileData = result.file || result;
      const isDeduplicated = result.deduplicated || fileData.deduplicated;
      
      // Extract relative URL if backend provides full URL
      let imageUrl = fileData.url || `/api/uploads/image/${fileData.id}`;
      
      if (imageUrl.includes('http://') || imageUrl.includes('https://')) {
        try {
          const urlObj = new URL(imageUrl);
          imageUrl = urlObj.pathname;
          console.log(`[GridFSAdapter] Converted absolute URL to relative: ${imageUrl}`);
        } catch (e) {
          console.error('Failed to parse URL:', imageUrl);
        }
      }
      
      const imageData: ImageData = {
        uid,
        name: file.name,
        url: imageUrl,
        gridfsId: fileData.id,
        type: 'gridfs',
        fileHash: fileData.fileHash,
        deduplicated: isDeduplicated,
        hasModifications: false,
        metadata: {
          size: fileData.size || file.size,
          type: fileData.mimeType || file.type,
          width: fileData.metadata?.width,
          height: fileData.metadata?.height,
          referenceCount: fileData.metadata?.referenceCount || fileData.referenceCount
        }
      };

      if (isDeduplicated) {
        message.success(`${file.name} added (using existing file)`);
      } else {
        message.success(`${file.name} uploaded successfully`);
      }

      return imageData;
    } catch (error) {
      console.error('[GridFSAdapter] Upload error:', error);
      throw error;
    }
  }

  async delete(gridfsId: string): Promise<void> {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/uploads/image/${gridfsId}`, {
        method: 'DELETE',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[GridFSAdapter] Removed reference:`, result);
      }
    } catch (error) {
      console.error('[GridFSAdapter] Delete error:', error);
    }
  }

  resolveUrl(image: ImageData): string {
    // Prioritize drawingData (annotated version) if it exists
    if (image.drawingData) {
      return image.drawingData;
    }

    // Otherwise resolve the original GridFS URL
    if (!image.url) return '';

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return image.url;

    try {
      const isAbsolute = /^https?:\/\//i.test(image.url);
      const urlObj = new URL(image.url, window.location.origin);
      urlObj.searchParams.set('authToken', token);
      return isAbsolute ? urlObj.toString() : `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    } catch (err) {
      const separator = image.url.includes('?') ? '&' : '?';
      return `${image.url}${separator}authToken=${encodeURIComponent(token)}`;
    }
  }
}


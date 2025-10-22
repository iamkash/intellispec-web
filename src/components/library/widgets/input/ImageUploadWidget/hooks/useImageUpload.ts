/**
 * useImageUpload - Custom hook for image upload logic
 */

import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Base64Adapter } from '../adapters/Base64Adapter';
import { GridFSAdapter } from '../adapters/GridFSAdapter';
import type { ImageData, StorageAdapter, UseImageUploadOptions } from '../types';

export function useImageUpload(options: UseImageUploadOptions) {
  const { value, onChange, persistent, clientOnly, maxCount, maxSize } = options;
  
  const [fileList, setFileList] = useState<ImageData[]>(value || []);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);

  // Select storage adapter based on mode
  const adapter: StorageAdapter = (persistent && !clientOnly) 
    ? new GridFSAdapter() 
    : new Base64Adapter();

  // Sync with parent value
  useEffect(() => {
    setFileList(Array.isArray(value) ? value : []);
  }, [value]);

  // Custom upload handler
  const customRequest = useCallback(async (options: any) => {
    const { file, onSuccess, onError } = options;
    const uid = `upload-${Date.now()}`;
    
    setUploading(prev => ({ ...prev, [uid]: true }));

    try {
      const imageData = await adapter.upload(file);
      
      // Update file list
      setFileList(prevList => {
        const newList = [...prevList, imageData];
        onChange?.(newList);
        return newList;
      });

      onSuccess(imageData, file);
    } catch (error) {
      console.error('[useImageUpload] Upload error:', error);
      onError(error);
      message.error(`Failed to upload ${file.name}`);
    } finally {
      setUploading(prev => {
        const next = { ...prev };
        delete next[uid];
        return next;
      });
    }
  }, [adapter, onChange]);

  // Before upload validation
  const beforeUpload = useCallback((file: any) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isValidSize = file.size / 1024 / 1024 < maxSize;
    if (!isValidSize) {
      message.error(`Image must be smaller than ${maxSize}MB!`);
      return false;
    }

    if (fileList.length >= maxCount) {
      message.error(`You can only upload up to ${maxCount} images!`);
      return false;
    }

    return true;
  }, [maxSize, maxCount, fileList.length]);

  // Handle file removal
  const handleRemove = useCallback(async (uid: string) => {
    const imageToRemove = fileList.find(img => img.uid === uid);
    
    // Delete from storage if GridFS and not modified
    if (imageToRemove?.gridfsId && !imageToRemove.hasModifications) {
      await adapter.delete(imageToRemove.gridfsId);
    }
    
    // Update local state
    const newFileList = fileList.filter(img => img.uid !== uid);
    setFileList(newFileList);
    onChange?.(newFileList);
    
    message.success(`Removed ${imageToRemove?.name || 'image'}`);
  }, [adapter, fileList, onChange]);

  // Resolve URL for display
  const resolveUrl = useCallback((image: ImageData) => {
    return adapter.resolveUrl(image);
  }, [adapter]);

  // Rotate image
  const handleRotate = useCallback((uid: string, degrees: number) => {
    const newFileList = fileList.map(img =>
      img.uid === uid ? { ...img, rotation: degrees } : img
    );
    setFileList(newFileList);
    onChange?.(newFileList);
  }, [fileList, onChange]);

  // Copy/duplicate image
  const handleCopy = useCallback(async (uid: string) => {
    const imageToCopy = fileList.find(img => img.uid === uid);
    if (!imageToCopy) return;

    const newUid = `${Date.now()}-copy-${Math.random().toString(36).substr(2, 9)}`;
    const copiedImage: ImageData = {
      ...imageToCopy,
      uid: newUid,
      name: `Copy of ${imageToCopy.name}`,
      selected: false
    };

    const newFileList = [...fileList, copiedImage];
    setFileList(newFileList);
    onChange?.(newFileList);
  }, [fileList, onChange]);

  // Toggle selection
  const handleToggleSelect = useCallback((uid: string, selected: boolean) => {
    const newFileList = fileList.map(img =>
      img.uid === uid ? { ...img, selected } : img
    );
    setFileList(newFileList);
    onChange?.(newFileList);
  }, [fileList, onChange]);

  // Update description
  const handleUpdateDescription = useCallback((uid: string, description: string) => {
    const newFileList = fileList.map(img =>
      img.uid === uid ? { ...img, description } : img
    );
    setFileList(newFileList);
    onChange?.(newFileList);
  }, [fileList, onChange]);

  // Update caption
  const handleUpdateCaption = useCallback((uid: string, caption: string) => {
    const newFileList = fileList.map(img =>
      img.uid === uid ? { ...img, caption } : img
    );
    setFileList(newFileList);
    onChange?.(newFileList);
  }, [fileList, onChange]);

  // Update tags
  const handleUpdateTags = useCallback((uid: string, tags: string[]) => {
    const newFileList = fileList.map(img =>
      img.uid === uid ? { ...img, tags } : img
    );
    setFileList(newFileList);
    onChange?.(newFileList);
  }, [fileList, onChange]);

  // Reorder images
  const handleReorder = useCallback((newOrder: ImageData[]) => {
    setFileList(newOrder);
    onChange?.(newOrder);
  }, [onChange]);

  // Batch delete
  const handleBatchDelete = useCallback(async (uids: string[]) => {
    // Delete from storage if GridFS
    for (const uid of uids) {
      const imageToRemove = fileList.find(img => img.uid === uid);
      if (imageToRemove?.gridfsId && !imageToRemove.hasModifications) {
        await adapter.delete(imageToRemove.gridfsId);
      }
    }
    
    const newFileList = fileList.filter(img => !uids.includes(img.uid));
    setFileList(newFileList);
    onChange?.(newFileList);
    message.success(`Removed ${uids.length} image(s)`);
  }, [adapter, fileList, onChange]);

  // Batch download
  const handleBatchDownload = useCallback((uids: string[]) => {
    uids.forEach(uid => {
      const image = fileList.find(img => img.uid === uid);
      if (image) {
        const link = document.createElement('a');
        link.href = resolveUrl(image);
        link.download = image.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
    message.success(`Downloaded ${uids.length} image(s)`);
  }, [fileList, resolveUrl]);

  return {
    fileList,
    uploading,
    previewImage,
    setPreviewImage,
    customRequest,
    beforeUpload,
    handleRemove,
    handleRotate,
    handleCopy,
    handleToggleSelect,
    handleUpdateDescription,
    handleUpdateCaption,
    handleUpdateTags,
    handleReorder,
    handleBatchDelete,
    handleBatchDownload,
    resolveUrl
  };
}


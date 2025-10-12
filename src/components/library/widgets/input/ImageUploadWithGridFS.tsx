/**
 * ImageUploadWithGridFS - Clean image upload solution with GridFS storage
 * 
 * This widget:
 * 1. Uploads images to GridFS immediately when selected
 * 2. Never stores base64 in component state or database
 * 3. Prevents duplicate uploads
 * 4. Provides clean image management
 */

import {
    UploadOutlined
} from '@ant-design/icons';
import {
    message,
    Modal,
    Spin,
    Upload
} from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload';
import React, { useCallback, useEffect, useState } from 'react';

export interface GridFSImage {
    uid: string;
    name: string;
    url: string; // GridFS URL like /api/uploads/image/{id}
    gridfsId: string;
    originalSize: number;
    type: 'gridfs'; // Always 'gridfs', never 'base64'
    metadata?: {
        width?: number;
        height?: number;
        size: number;
        type: string;
    };
}

export interface ImageUploadWithGridFSProps {
    value?: GridFSImage[];
    onChange?: (value: GridFSImage[]) => void;
    disabled?: boolean;
    maxCount?: number;
    maxSize?: number; // in MB
    accept?: string;
    multiple?: boolean;
    showPreview?: boolean;
}

export const ImageUploadWithGridFS: React.FC<ImageUploadWithGridFSProps> = ({
    value = [],
    onChange,
    disabled = false,
    maxCount = 10,
    maxSize = 10, // 10MB default
    accept = 'image/*',
    multiple = true,
    showPreview = true
}) => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    // Convert GridFS images to Upload file list
    useEffect(() => {
        const uploadFiles: UploadFile[] = (value || []).map(img => ({
            uid: img.uid,
            name: img.name,
            status: 'done' as const,
            url: img.url,
            response: {
                gridfsId: img.gridfsId,
                url: img.url
            }
        }));
        setFileList(uploadFiles);
    }, [value]);

    // Custom upload to GridFS
    const customRequest = useCallback(async (options: any) => {
        const { file, onSuccess, onError, onProgress } = options;
        const uid = file.uid || `${Date.now()}-${Math.random()}`;

        // Mark as uploading
        setUploading(prev => ({ ...prev, [uid]: true }));

        try {
            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'inspection');

            // Upload to GridFS
            const response = await fetch('/api/uploads/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Create GridFS image object
            const gridfsImage: GridFSImage = {
                uid,
                name: file.name,
                url: `/api/uploads/image/${result.id}`,
                gridfsId: result.id,
                originalSize: file.size,
                type: 'gridfs',
                metadata: {
                    size: file.size,
                    type: file.type,
                    width: result.metadata?.width,
                    height: result.metadata?.height
                }
            };

            // Update parent component with GridFS reference only
            const currentImages = value || [];
            const newImages = [...currentImages, gridfsImage];
            onChange?.(newImages);

            // Notify upload success
            onSuccess(result, file);
            message.success(`${file.name} uploaded successfully`);

        } catch (error) {
            console.error('Upload error:', error);
            onError(error);
            message.error(`Failed to upload ${file.name}`);
        } finally {
            // Clear uploading state
            setUploading(prev => {
                const next = { ...prev };
                delete next[uid];
                return next;
            });
        }
    }, [value, onChange]);

    // Before upload validation
    const beforeUpload = useCallback((file: RcFile) => {
        // Check file type
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }

        // Check file size
        const isValidSize = file.size / 1024 / 1024 < maxSize;
        if (!isValidSize) {
            message.error(`Image must be smaller than ${maxSize}MB!`);
            return false;
        }

        // Check max count
        if (value && value.length >= maxCount) {
            message.error(`You can only upload up to ${maxCount} images!`);
            return false;
        }

        return true;
    }, [maxSize, maxCount, value]);

    // Handle file removal
    const handleRemove = useCallback((file: UploadFile) => {
        const gridfsId = file.response?.gridfsId || (value?.find(img => img.uid === file.uid)?.gridfsId);
        
        if (gridfsId) {
            // Optionally delete from GridFS
            fetch(`/api/uploads/image/${gridfsId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }).catch(err => console.error('Failed to delete from GridFS:', err));
        }

        // Update parent component
        const newImages = (value || []).filter(img => img.uid !== file.uid);
        onChange?.(newImages);
        
        return true;
    }, [value, onChange]);

    // Handle preview
    const handlePreview = useCallback(async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            return;
        }

        setPreviewImage(file.url || file.preview || '');
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf('/') + 1) || '');
    }, []);

    const uploadProps: UploadProps = {
        fileList,
        customRequest,
        beforeUpload,
        onRemove: handleRemove,
        onPreview: showPreview ? handlePreview : undefined,
        multiple,
        accept,
        disabled,
        listType: 'picture-card',
        className: 'gridfs-image-uploader'
    };

    const isUploading = Object.keys(uploading).length > 0;

    return (
        <div className="image-upload-gridfs-widget">
            <Spin spinning={isUploading} tip="Uploading...">
                <Upload {...uploadProps}>
                    {fileList.length < maxCount && (
                        <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Upload Image</div>
                        </div>
                    )}
                </Upload>
            </Spin>

            <Modal
                open={previewOpen}
                title={previewTitle}
                footer={null}
                onCancel={() => setPreviewOpen(false)}
            >
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && value && value.length > 0 && (
                <div style={{ marginTop: 8, padding: 8, background: '#f0f0f0', borderRadius: 4 }}>
                    <strong>GridFS Images:</strong>
                    {value.map(img => (
                        <div key={img.uid} style={{ fontSize: 11 }}>
                            {img.name}: {img.gridfsId} ({img.type})
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUploadWithGridFS;

/**
 * ImageUploadWithDrawingGridFS - Complete image upload with drawing capabilities and GridFS storage
 * 
 * This widget combines:
 * 1. Immediate GridFS upload (no base64)
 * 2. Drawing/annotation capabilities
 * 3. Drag & drop support
 * 4. Clean state management
 */

import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    PictureOutlined
} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Divider,
    message,
    Modal,
    Popconfirm,
    Row,
    Slider,
    Space,
    Tag,
    Tooltip,
    Typography,
    Upload
} from 'antd';
import type { RcFile } from 'antd/es/upload';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const { Text } = Typography;
const { Dragger } = Upload;

export interface GridFSImageWithDrawing {
    uid: string;
    name: string;
    url: string; // GridFS URL like /api/uploads/image/{id}
    gridfsId: string;
    type: 'gridfs'; // Always 'gridfs', never 'base64'
    fileHash?: string; // SHA256 hash for deduplication
    deduplicated?: boolean; // Whether this was deduplicated
    drawingData?: string; // Drawing annotations as base64 (only for annotations, not the image)
    hasModifications?: boolean; // Track if image has been edited
    annotations?: Array<{
        id: string;
        type: 'line' | 'circle' | 'rectangle' | 'text' | 'arrow';
        data: any;
        color: string;
        strokeWidth: number;
    }>;
    metadata?: {
        width?: number;
        height?: number;
        size: number;
        type: string;
        referenceCount?: number; // How many references to this file
    };
    description?: string;
}

export interface ImageUploadWithDrawingGridFSProps {
    id?: string;
    label?: string;
    value?: GridFSImageWithDrawing[];
    onChange?: (value: GridFSImageWithDrawing[]) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    style?: React.CSSProperties;
    // Upload options
    maxCount?: number;
    maxSize?: number; // in MB
    accept?: string;
    multiple?: boolean;
    // Drawing options
    drawingEnabled?: boolean;
    drawingTools?: Array<'pen' | 'line' | 'circle' | 'rectangle' | 'text' | 'arrow'>;
    drawingColors?: string[];
    strokeWidths?: number[];
    // UI options
    showPreview?: boolean;
    showThumbnails?: boolean;
    thumbnailSize?: number;
    layout?: 'grid' | 'list';
}

export const ImageUploadWithDrawingGridFS: React.FC<ImageUploadWithDrawingGridFSProps> = ({
    id = 'image-upload',
    label,
    value = [],
    onChange,
    disabled = false,
    required = false,
    className = '',
    style,
    maxCount = 10,
    maxSize = 10, // 10MB default
    accept = 'image/*',
    multiple = true,
    drawingEnabled = true,
    drawingTools = ['pen', 'line', 'circle', 'rectangle', 'text', 'arrow'],
    drawingColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
    strokeWidths = [2, 4, 6, 8, 10],
    showPreview = true,
    showThumbnails = true,
    thumbnailSize = 100,
    layout = 'grid'
}) => {
    const [fileList, setFileList] = useState<GridFSImageWithDrawing[]>(value || []);
    const [, setUploading] = useState<Record<string, boolean>>({});
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    
    // Drawing states
    const [editingImage, setEditingImage] = useState<GridFSImageWithDrawing | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentTool, setCurrentTool] = useState<string>('pen');
    const [currentColor, setCurrentColor] = useState('#000000');
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [, setDrawingHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Refs for drawing
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const drawingContext = useRef<CanvasRenderingContext2D | null>(null);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    const resolveDisplayUrl = useCallback((rawUrl?: string) => {
        if (!rawUrl) return rawUrl || '';

        const token = (typeof window !== 'undefined')
            ? (localStorage.getItem('authToken') || localStorage.getItem('token'))
            : null;

        if (!token) {
            return rawUrl;
        }

        try {
            const isAbsolute = /^https?:\/\//i.test(rawUrl);
            const urlObj = new URL(rawUrl, window.location.origin);
            urlObj.searchParams.set('authToken', token);
            return isAbsolute ? urlObj.toString() : `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        } catch (err) {
            const separator = rawUrl.includes('?') ? '&' : '?';
            return `${rawUrl}${separator}authToken=${encodeURIComponent(token)}`;
        }
    }, []);

    // Sync with parent value
    useEffect(() => {
        setFileList(Array.isArray(value) ? value : []);
    }, [value]);

    // Custom upload to GridFS
    const customRequest = useCallback(async (options: any) => {
        const { file, onSuccess, onError } = options;
        // Always generate a unique UID for each upload, even for the same file
        // This ensures each instance in the UI is independently trackable
        const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.uid || Math.random()}`;

        setUploading(prev => ({ ...prev, [uid]: true }));

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
            
            console.log(`[Upload] Response for ${file.name}:`, {
                success: result.success,
                deduplicated: result.deduplicated,
                fileId: result.file?.id || result.id,
                fileUrl: result.file?.url || result.url,
                fileHash: result.file?.fileHash || result.fileHash
            });
            
            // Check if file was deduplicated
            const fileData = result.file || result;
            const isDeduplicated = result.deduplicated || fileData.deduplicated;
            
            // Create GridFS image object
            // Extract relative URL if backend provides full URL
            let imageUrl = fileData.url || `/api/uploads/image/${fileData.id}`;
            
            // If URL is absolute (contains http/https), extract the path
            if (imageUrl.includes('http://') || imageUrl.includes('https://')) {
                try {
                    const urlObj = new URL(imageUrl);
                    imageUrl = urlObj.pathname; // Get just the path part
                    console.log(`[Upload] Converted absolute URL to relative: ${imageUrl}`);
                } catch (e) {
                    console.error('Failed to parse URL:', imageUrl);
                }
            }
            
            const gridfsImage: GridFSImageWithDrawing = {
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

            // Allow multiple instances of the same image in the selection
            // Each instance gets a unique UID for independent tracking
            // This is useful when you want to use the same image multiple times
            // with different annotations or in different contexts
            
            // Update file list using functional update to avoid stale closure
            setFileList(prevList => {
                const newList = [...prevList, gridfsImage];
                
                // Optional: Log if adding duplicate
                const duplicateCount = prevList.filter(img => 
                    img.fileHash === gridfsImage.fileHash && 
                    img.gridfsId === gridfsImage.gridfsId
                ).length;
                
                if (duplicateCount > 0) {
                    console.log(`[ImageUpload] Adding duplicate reference #${duplicateCount + 1} for ${file.name}`);
                }
                
                // Notify parent with the new list
                onChange?.(newList);
                return newList;
            });

            onSuccess(result, file);
            
            if (isDeduplicated) {
                message.success(`${file.name} added (using existing file)`);
            } else {
                message.success(`${file.name} uploaded successfully`);
            }

        } catch (error) {
            console.error('Upload error:', error);
            onError(error);
            message.error(`Failed to upload ${file.name}`);
        } finally {
            setUploading(prev => {
                const next = { ...prev };
                delete next[uid];
                return next;
            });
        }
    }, [onChange]);

    // Before upload validation
    const beforeUpload = useCallback((file: RcFile) => {
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

    // Handle file removal with proper GridFS cleanup
    const handleRemove = useCallback(async (uid: string) => {
        const imageToRemove = fileList.find(img => img.uid === uid);
        
        if (imageToRemove?.gridfsId && !imageToRemove.hasModifications) {
            try {
                // Call delete API to decrement reference count or delete file
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const response = await fetch(`/api/uploads/image/${imageToRemove.gridfsId}`, {
                    method: 'DELETE',
                    headers: token ? {
                        'Authorization': `Bearer ${token}`
                    } : undefined
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`[GridFS] Removed reference for ${imageToRemove.name}:`, result);
                }
            } catch (error) {
                console.error('Failed to remove GridFS reference:', error);
            }
        }
        
        // Update local state
        const newFileList = fileList.filter(img => img.uid !== uid);
        setFileList(newFileList);
        onChange?.(newFileList);
        
        message.success(`Removed ${imageToRemove?.name || 'image'}`);
    }, [fileList, onChange]);

    // Initialize drawing canvas
    const initializeDrawingCanvas = useCallback((image: GridFSImageWithDrawing) => {
        if (!canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imageRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        if (image.drawingData) {
            const drawingImg = new window.Image();
            drawingImg.onload = () => {
                ctx.drawImage(drawingImg, 0, 0);
            };
            drawingImg.src = image.drawingData;
        }
        
        drawingContext.current = ctx;
        setDrawingHistory([]);
        setHistoryIndex(-1);
    }, []);

    // Drawing functions
    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingContext.current || disabled) return;
        
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        lastPoint.current = { x, y };
        
        drawingContext.current.strokeStyle = currentColor;
        drawingContext.current.lineWidth = currentStrokeWidth;
        drawingContext.current.lineCap = 'round';
        drawingContext.current.lineJoin = 'round';
        
        if (currentTool === 'pen') {
            drawingContext.current.beginPath();
            drawingContext.current.moveTo(x, y);
        }
    }, [disabled, currentColor, currentStrokeWidth, currentTool]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !drawingContext.current || !lastPoint.current) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (currentTool === 'pen') {
            drawingContext.current.lineTo(x, y);
            drawingContext.current.stroke();
        }
        
        lastPoint.current = { x, y };
    }, [isDrawing, currentTool]);

    const stopDrawing = useCallback(() => {
        if (isDrawing) {
            setIsDrawing(false);
            // Save drawing state for undo/redo
            if (canvasRef.current) {
                const dataURL = canvasRef.current.toDataURL();
                setDrawingHistory(prev => [...prev.slice(0, historyIndex + 1), dataURL]);
                setHistoryIndex(prev => prev + 1);
            }
        }
    }, [isDrawing, historyIndex]);

    // Save drawing and mark as modified
    const saveDrawing = useCallback(() => {
        if (!canvasRef.current || !editingImage) return;
        
        const drawingData = canvasRef.current.toDataURL();
        const updatedImage = { 
            ...editingImage, 
            drawingData,
            hasModifications: true // Mark as modified since we added drawings
        };
        const newFileList = fileList.map(img => 
            img.uid === editingImage.uid ? updatedImage : img
        );
        
        setFileList(newFileList);
        onChange?.(newFileList);
        setEditingImage(null);
        message.success('Drawing saved! Image marked as modified.');
    }, [editingImage, fileList, onChange]);

    return (
        <div className={`image-upload-drawing-gridfs ${className}`} style={style}>
            {label && (
                <div className="widget-label">
                    {label} {required && <span className="required">*</span>}
                </div>
            )}

            {/* Upload Area */}
            <Dragger
                multiple={multiple}
                accept={accept}
                fileList={[]} // Don't show file list here, we'll render custom cards
                customRequest={customRequest}
                beforeUpload={beforeUpload}
                disabled={disabled || fileList.length >= maxCount}
                showUploadList={false}
            >
                <p className="ant-upload-drag-icon">
                    <PictureOutlined />
                </p>
                <p className="ant-upload-text">Click or drag images to upload</p>
                <p className="ant-upload-hint">
                    Support for {accept}. Max size: {maxSize}MB. Max count: {maxCount}
                </p>
            </Dragger>

            {/* Image Grid */}
            {fileList.length > 0 && (
                <>
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <Text>Total images: {fileList.length}</Text>
                    </div>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {fileList.map((image, index) => (
            <Col key={image.uid} xs={24} sm={12} md={8} lg={6} xl={4}>
            <Card
                hoverable
                cover={
                    <img
                        alt={image.name}
                        src={resolveDisplayUrl(image.url)}
                        style={{ height: thumbnailSize, objectFit: 'cover' }}
                        onError={(e) => {
                            console.error(`Failed to load image: ${image.name}`, {
                                url: image.url,
                                gridfsId: image.gridfsId,
                                                uid: image.uid
                                            });
                                            // Set a fallback image or placeholder
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                                        }}
                                        onLoad={() => {
                                            console.log(`Successfully loaded image: ${image.name}`, {
                                                url: image.url,
                                                gridfsId: image.gridfsId
                                            });
                                        }}
                                    />
                                }
                                actions={[
                    <Tooltip title="Preview">
                        <EyeOutlined onClick={() => {
                            setPreviewImage(resolveDisplayUrl(image.url));
                            setPreviewTitle(image.name);
                            setPreviewOpen(true);
                        }} />
                    </Tooltip>,
                                    drawingEnabled && (
                                        <Tooltip title="Draw">
                                            <EditOutlined onClick={() => setEditingImage(image)} />
                                        </Tooltip>
                                    ),
                                    <Tooltip title="Delete">
                                        <Popconfirm
                                            title="Delete this image?"
                                            onConfirm={() => handleRemove(image.uid)}
                                            disabled={disabled}
                                        >
                                            <DeleteOutlined />
                                        </Popconfirm>
                                    </Tooltip>
                                ].filter(Boolean)}
                            >
                            <Card.Meta
                                title={`${index + 1}. ${image.name}`}
                                description={
                                    <Space direction="vertical" size={0}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            ID: {image.gridfsId?.substring(0, 8) || 'N/A'}...
                                        </Text>
                                        <Space size={4}>
                                            {image.deduplicated && (
                                                <Tag color="green" style={{ fontSize: 10 }}>
                                                    Deduplicated
                                                </Tag>
                                            )}
                                            {image.hasModifications && (
                                                <Tag color="orange" style={{ fontSize: 10 }}>
                                                    Modified
                                                </Tag>
                                            )}
                                            {image.drawingData && (
                                                <Tag color="blue" style={{ fontSize: 10 }}>
                                                    Annotated
                                                </Tag>
                                            )}
                                            {image.metadata?.referenceCount && image.metadata.referenceCount > 1 && (
                                                <Tag color="purple" style={{ fontSize: 10 }}>
                                                    {image.metadata.referenceCount} refs
                                                </Tag>
                                            )}
                                        </Space>
                                    </Space>
                                }
                            />
                            </Card>
                        </Col>
                    ))}
                </Row>
                </>
            )}

            {/* Preview Modal */}
            <Modal
                open={previewOpen}
                title={previewTitle}
                footer={null}
                onCancel={() => setPreviewOpen(false)}
                width={800}
            >
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>

            {/* Drawing Modal */}
            <Modal
                open={!!editingImage}
                title={`Draw on ${editingImage?.name}`}
                footer={[
                    <Button key="cancel" onClick={() => setEditingImage(null)}>
                        Cancel
                    </Button>,
                    <Button key="save" type="primary" onClick={saveDrawing}>
                        Save Drawing
                    </Button>
                ]}
                onCancel={() => setEditingImage(null)}
                width={900}
            >
                {editingImage && (
                    <div>
                        {/* Drawing Tools */}
                        <Space style={{ marginBottom: 16 }}>
                            <Space>
                                <Text>Tool:</Text>
                                {drawingTools.map(tool => (
                                    <Button
                                        key={tool}
                                        size="small"
                                        type={currentTool === tool ? 'primary' : 'default'}
                                        onClick={() => setCurrentTool(tool)}
                                    >
                                        {tool}
                                    </Button>
                                ))}
                            </Space>
                            <Divider type="vertical" />
                            <Space>
                                <Text>Color:</Text>
                                {drawingColors.map(color => (
                                    <div
                                        key={color}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: color,
                                            border: currentColor === color ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                            cursor: 'pointer',
                                            borderRadius: 4
                                        }}
                                        onClick={() => setCurrentColor(color)}
                                    />
                                ))}
                            </Space>
                            <Divider type="vertical" />
                            <Space>
                                <Text>Width:</Text>
                                <Slider
                                    min={1}
                                    max={20}
                                    value={currentStrokeWidth}
                                    onChange={setCurrentStrokeWidth}
                                    style={{ width: 100 }}
                                />
                            </Space>
                        </Space>

                        {/* Canvas */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                ref={imageRef}
                                src={resolveDisplayUrl(editingImage.url)}
                                alt={editingImage.name}
                                onLoad={() => initializeDrawingCanvas(editingImage)}
                                style={{ display: 'none' }}
                            />
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                style={{ border: '1px solid #d9d9d9', cursor: 'crosshair' }}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ImageUploadWithDrawingGridFS;

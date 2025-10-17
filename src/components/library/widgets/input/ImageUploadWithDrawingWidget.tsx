/**
 * ImageUploadWithDrawingWidget - Advanced image upload with drawing capabilities
 * 
 * A sophisticated image upload widget that supports multiple images,
 * drawing annotations on each image, and advanced image management.
 */

import {
    ClearOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    PictureOutlined,
    RedoOutlined,
    SaveOutlined,
    UndoOutlined
} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Divider,
    Image,
    Input,
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
import type { UploadProps } from 'antd/es/upload';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const { Text, Title } = Typography;
const { Dragger } = Upload;

export interface ImageWithDrawing {
  uid: string;
  name: string;
  url: string;
  base64?: string; // Legacy support
  gridfsId?: string; // GridFS file ID
  drawingData?: string; // base64 canvas data
  annotations?: Array<{
    id: string;
    type: 'line' | 'circle' | 'rectangle' | 'text' | 'arrow';
    data: any;
    color: string;
    strokeWidth: number;
  }>;
  metadata?: {
    width: number;
    height: number;
    size: number;
    type: string;
    gridfsId?: string; // GridFS file ID
  };
  description?: string;
  selected?: boolean;
}


export interface ImageUploadWithDrawingWidgetProps {
  id: string;
  label?: string;
  value?: ImageWithDrawing[];
  onChange?: (value: ImageWithDrawing[]) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // Upload options
  maxCount?: number;
  maxSize?: number; // in bytes
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
  // Upload configuration
  action?: string;
  headers?: Record<string, string>;
  data?: Record<string, any>;
  name?: string;
  withCredentials?: boolean;
  /** If true, no network upload occurs; files are read locally as data URLs */
  clientOnly?: boolean;
  // Customization
  uploadText?: string;
  dragText?: string;
  dragHint?: string;
  theme?: 'light' | 'dark';
}

export const ImageUploadWithDrawingWidget: React.FC<ImageUploadWithDrawingWidgetProps> = ({
  id,
  label,
  value = [],
  onChange,
  disabled = false,
  required = false,
  className,
  style,
  maxCount = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = 'image/*',
  multiple = true,
  drawingEnabled = true,
  drawingTools = ['pen', 'line', 'circle', 'rectangle', 'text', 'arrow'],
  drawingColors = [],
  strokeWidths = [1, 2, 3, 5, 8, 12, 16],
  showPreview = true,
  showThumbnails = true,
  thumbnailSize = 120,
  layout = 'grid',
  action,
  headers,
  data,
  name = 'file',
  withCredentials = false,
  clientOnly = true,
  uploadText = 'Upload Images',
  dragText = 'Click or drag images to this area to upload',
  dragHint = 'Support for multiple image uploads with drawing capabilities',
  theme = 'light'
}) => {
  // Normalize incoming value to an array to avoid runtime errors when parent passes '' or a single object
  const normalizeToArray = useCallback((input: any): ImageWithDrawing[] => {
    if (Array.isArray(input)) return input as ImageWithDrawing[];
    if (!input) return [];
    if (typeof input === 'string') return [];
    if (typeof input === 'object' && input.uid && (input.url || input.base64)) return [input as ImageWithDrawing];
    return [];
  }, []); // No dependencies needed since function is pure

  const [fileList, setFileList] = useState<ImageWithDrawing[]>(normalizeToArray(value));

  // Keep internal state in sync when value prop changes
  useEffect(() => {
    const normalized = normalizeToArray(value);
    setFileList(normalized);
  }, [value, normalizeToArray]);
  const [drawingModalVisible, setDrawingModalVisible] = useState(false);
  const [currentDrawingImage, setCurrentDrawingImage] = useState<ImageWithDrawing | null>(null);
  const [currentTool, setCurrentTool] = useState<string>('pen');
  // Build a 12-color palette resolved from theme tokens (works on canvas; avoids var() in strokeStyle)
  const resolveThemeColor = useCallback((token: string, alpha?: number): string => {
    const root = document.documentElement;
    const hsl = getComputedStyle(root).getPropertyValue(token).trim();
    if (!hsl) return 'hsl(0 0% 0%)';
    return typeof alpha === 'number' ? `hsl(${hsl} / ${alpha})` : `hsl(${hsl})`;
  }, []);

  const themePalette = useMemo(() => {
    const tokens = ['--primary','--secondary','--accent','--success','--warning','--destructive','--foreground','--muted-foreground','--ring','--border','--muted','--card'];
    // Prefer opaque colors for legibility on varied backgrounds; adjust a few with slight alpha to diversify
    return tokens.map((t, idx) => resolveThemeColor(t as any, idx % 3 === 1 ? 0.9 : undefined));
  }, [resolveThemeColor]);

  const palette = useMemo(() => (drawingColors && drawingColors.length >= 12 ? drawingColors : themePalette), [drawingColors, themePalette]);

  const [currentColor, setCurrentColor] = useState<string>(palette[0]);
  const [customColor, setCustomColor] = useState<string>(palette[0]);
  // Keep current color in sync if palette updates
  useEffect(() => {
    if (!palette.includes(currentColor)) {
      setCurrentColor(palette[0]);
      setCustomColor(palette[0]);
    }
  }, [palette, currentColor]);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(strokeWidths[1]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [thumbSize, setThumbSize] = useState<number>(thumbnailSize);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Drawing context
  const [drawingContext, setDrawingContext] = useState<CanvasRenderingContext2D | null>(null);
  const [dragLayoutCompact, setDragLayoutCompact] = useState<boolean>(false);

  // Sync thumbnail size when prop changes
  React.useEffect(() => {
    setThumbSize(thumbnailSize);
  }, [thumbnailSize]);

  // Initialize drawing canvas
  const initializeDrawingCanvas = useCallback((image: ImageWithDrawing) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    ctx.drawImage(img, 0, 0);
    
    // Load existing drawing data
    if (image.drawingData) {
      const drawingImg = new window.Image();
      drawingImg.onload = () => {
        ctx.drawImage(drawingImg, 0, 0);
      };
      drawingImg.src = image.drawingData;
    }
    
    setDrawingContext(ctx);
    setDrawingHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Save drawing state
  const saveDrawingState = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    
    setDrawingHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataURL);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo drawing
  const undoDrawing = useCallback(() => {
    if (historyIndex > 0 && drawingHistory.length > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      if (canvasRef.current && drawingHistory[newIndex]) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new window.Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = drawingHistory[newIndex];
        }
      }
    }
  }, [historyIndex, drawingHistory]);

  // Redo drawing
  const redoDrawing = useCallback(() => {
    if (historyIndex < drawingHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      if (canvasRef.current && drawingHistory[newIndex]) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new window.Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = drawingHistory[newIndex];
        }
      }
    }
  }, [historyIndex, drawingHistory]);

  // Clear drawing
  const clearDrawing = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    saveDrawingState();
  }, [saveDrawingState]);

  // Drawing event handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingContext || disabled) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastPointRef.current = { x, y };
    
    drawingContext.strokeStyle = currentColor;
    drawingContext.lineWidth = currentStrokeWidth;
    drawingContext.lineCap = 'round';
    drawingContext.lineJoin = 'round';
    if (currentTool === 'pen') {
      drawingContext.beginPath();
      drawingContext.moveTo(x, y);
    }
    if (currentTool === 'text') {
      const text = window.prompt('Enter text');
      if (text && canvasRef.current) {
        drawingContext.fillStyle = currentColor;
        drawingContext.font = `${Math.max(12, currentStrokeWidth * 6)}px sans-serif`;
        drawingContext.fillText(text, x, y);
        saveDrawingState();
        setIsDrawing(false);
      }
    }
  }, [drawingContext, disabled, currentColor, currentStrokeWidth, currentTool, saveDrawingState]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingContext || !lastPointRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'pen') {
      drawingContext.lineTo(x, y);
      drawingContext.stroke();
    }
    
    lastPointRef.current = { x, y };
  }, [isDrawing, drawingContext, currentTool]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !drawingContext) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current) return;
    const start = lastPointRef.current;
    const ctx = drawingContext;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentStrokeWidth;
    ctx.beginPath();
    if (currentTool === 'rectangle') {
      ctx.strokeRect(start.x, start.y, 60, 40);
    } else if (currentTool === 'circle') {
      ctx.arc(start.x, start.y, Math.max(20, currentStrokeWidth * 4), 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTool === 'arrow') {
      const toX = start.x + 80;
      const toY = start.y;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(toX, toY);
      const headlen = 10 + currentStrokeWidth;
      const angle = Math.atan2(toY - start.y, toX - start.x);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
    saveDrawingState();
  }, [isDrawing, drawingContext, currentTool, currentColor, currentStrokeWidth, saveDrawingState]);

  // Open drawing modal
  const openDrawingModal = useCallback((image: ImageWithDrawing) => {
    setCurrentDrawingImage(image);
    setDrawingModalVisible(true);
  }, []);

  // Save drawing
  const saveDrawing = useCallback(() => {
    if (!canvasRef.current || !currentDrawingImage) return;

    const canvas = canvasRef.current;
    const drawingData = canvas.toDataURL();

    const updatedImage = {
      ...currentDrawingImage,
      drawingData,
      url: drawingData // Use data URL directly
    };

    const updatedFileList = fileList.map(img =>
      img.uid === currentDrawingImage.uid ? updatedImage : img
    );

    setFileList(updatedFileList);
    onChange?.(updatedFileList);
    setDrawingModalVisible(false);
    setCurrentDrawingImage(null);

    message.success('Drawing saved successfully');
  }, [currentDrawingImage, fileList, onChange]);

  // Handle file upload list changes (remove support)
  const handleUpload = useCallback((info: any) => {
    const { file } = info || {};
    if (file?.status === 'removed') {
      const updated = (fileList || []).filter(x => x.uid !== file.uid);
      setFileList(updated);
      onChange?.(updated);
    }
  }, [fileList, onChange]);

  // Remove image
  const removeImage = useCallback((uid: string) => {
    const updatedFileList = fileList.filter(img => img.uid !== uid);
    setFileList(updatedFileList);
    onChange?.(updatedFileList);
  }, [fileList, onChange]);

  // Download image
  const downloadImage = useCallback((image: ImageWithDrawing) => {
    const link = document.createElement('a');
    link.href = image.drawingData || image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Upload props
  const uploadProps: UploadProps = useMemo(() => ({
    name,
    multiple,
    accept,
    fileList: fileList.map(img => ({
      uid: img.uid,
      name: img.name,
      status: 'done' as const,
      url: img.url,
      thumbUrl: img.url
    })),
    onChange: handleUpload,
    maxCount,
    beforeUpload: (file, antdFileList) => {
      const isValidType = file.type.startsWith('image/');
      if (!isValidType) {
        message.error('You can only upload image files!');
        return false;
      }
      
      const isValidSize = file.size <= maxSize;
      if (!isValidSize) {
        message.error(`Image must be smaller than ${Math.round(maxSize / 1024 / 1024)}MB!`);
        return false;
      }
      
      // If server upload is desired, allow Upload to proceed (action/headers required)
      if (!clientOnly) {
        return true; // proceed with antd Upload default behavior
      }

      // Client-only: convert to base64 data URL (no server upload needed)
      const uid = `${Date.now()}-${Math.random()}`;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newImage: ImageWithDrawing = {
          uid,
          name: file.name,
          url: dataUrl, // Store as data URL
          metadata: {
            width: 0,
            height: 0,
            size: file.size,
            type: file.type
          }
        };

        setFileList(prev => {
          const updated = [...prev, newImage];
          onChange?.(updated);
          return updated;
        });

        // Load image metadata
        const img = new window.Image();
        img.onload = () => {
          setFileList(prev => {
            const finalUpdated = prev.map(existingImg => existingImg.uid === uid ? {
              ...existingImg,
              metadata: {
                ...existingImg.metadata,
                width: img.naturalWidth,
                height: img.naturalHeight,
                size: existingImg.metadata?.size || 0,
                type: existingImg.metadata?.type || ''
              }
            } : existingImg);
            onChange?.(finalUpdated);
            return finalUpdated;
          });
        };
        img.src = dataUrl;
        message.success(`${file.name} loaded successfully`);
      };
      reader.readAsDataURL(file);
      
      // Prevent default upload behavior (client-only)
      return false;
    },
    action,
    headers,
    data,
    withCredentials,
    disabled
  }), [name, multiple, accept, fileList, handleUpload, maxCount, maxSize, action, headers, data, withCredentials, disabled, onChange, clientOnly]);

  // Render image card
  const toggleSelect = useCallback((uid: string, selected: boolean) => {
    const updated = fileList.map(img => img.uid === uid ? { ...img, selected } : img);
    setFileList(updated);
    onChange?.(updated);
  }, [fileList, onChange]);

  const updateImage = useCallback((uid: string, patch: Partial<ImageWithDrawing>) => {
    const updated = fileList.map(img => img.uid === uid ? { ...img, ...patch } : img);
    setFileList(updated);
    onChange?.(updated);
  }, [fileList, onChange]);

  const moveImage = useCallback((uid: string, delta: number) => {
    const idx = fileList.findIndex(x => x.uid === uid);
    if (idx < 0) return;
    const newIdx = Math.max(0, Math.min(fileList.length - 1, idx + delta));
    if (newIdx === idx) return;
    const copy = [...fileList];
    const [item] = copy.splice(idx, 1);
    copy.splice(newIdx, 0, item);
    setFileList(copy);
    onChange?.(copy);
  }, [fileList, onChange]);

  const clearSelected = useCallback(() => {
    const rest = fileList.filter(x => !x.selected);
    setFileList(rest);
    onChange?.(rest);
  }, [fileList, onChange]);

  const selectAll = useCallback((checked: boolean) => {
    const updated = fileList.map(x => ({ ...x, selected: checked }));
    setFileList(updated);
    onChange?.(updated);
  }, [fileList, onChange]);

  const renderImageCard = useCallback((image: ImageWithDrawing) => (
    <Card
      key={image.uid}
      size="small"
      hoverable
      style={{ marginBottom: 16 }}
      cover={
        showThumbnails ? (
          <div style={{ 
            height: thumbSize, 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'hsl(var(--muted))'
          }}>
            <Image
              src={image.url}
              alt={image.name}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              preview={showPreview}
            />
          </div>
        ) : null
      }
      actions={[
        <Tooltip title="View">
          <EyeOutlined onClick={() => window.open(image.url, '_blank')} />
        </Tooltip>,
        drawingEnabled && (
          <Tooltip title="Draw">
            <EditOutlined onClick={() => openDrawingModal(image)} />
          </Tooltip>
        ),
        <Tooltip title="Download">
          <DownloadOutlined onClick={() => downloadImage(image)} />
        </Tooltip>,
        <Tooltip title="Move Left">
          <Button type="text" size="small" onClick={() => moveImage(image.uid, -1)}>{'←'}</Button>
        </Tooltip>,
        <Tooltip title="Move Right">
          <Button type="text" size="small" onClick={() => moveImage(image.uid, 1)}>{'→'}</Button>
        </Tooltip>,
        <Popconfirm
          title="Are you sure you want to remove this image?"
          onConfirm={() => removeImage(image.uid)}
          okText="Yes"
          cancelText="No"
        >
          <Tooltip title="Remove">
            <DeleteOutlined />
          </Tooltip>
        </Popconfirm>
      ].filter(Boolean)}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={!!image.selected}
              onChange={(e) => toggleSelect(image.uid, e.target.checked)}
            />
            <span style={{ color: 'hsl(var(--foreground))' }}>{image.name}</span>
            {image.drawingData && <Tag style={{ background: 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))', marginLeft: 'auto' }}>Annotated</Tag>}
          </div>
        }
        description={
          <Space direction="vertical" size="small">
            <Text type="secondary">
              {image.metadata?.width} × {image.metadata?.height}
            </Text>
            <Text type="secondary">
              {((image.metadata?.size || 0) / 1024 / 1024).toFixed(2)} MB
            </Text>
            <Input
              placeholder="Add description"
              value={image.description}
              onChange={(e) => updateImage(image.uid, { description: e.target.value })}
            />
            {image.drawingData && (
              <Text type="success">
                <EditOutlined /> Has annotations
              </Text>
            )}
          </Space>
        }
      />
    </Card>
  ), [showThumbnails, thumbSize, showPreview, drawingEnabled, openDrawingModal, downloadImage, removeImage, moveImage, toggleSelect, updateImage]);

  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
        </label>
      )}
      
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={() => selectAll(true)}>Select All</Button>
          <Button onClick={() => selectAll(false)}>Clear Selection</Button>
          <Button danger onClick={clearSelected}>Delete Selected</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Thumb Size</span>
            <Slider min={80} max={240} value={thumbSize} onChange={(v) => setThumbSize(Number(v))} style={{ width: 120 }} />
            <Tag style={{ background: 'hsl(var(--muted) / 0.2)', borderColor: 'hsl(var(--border))' }}>{thumbSize}px</Tag>
          </div>
          <Button type={dragLayoutCompact ? 'default' : 'primary'} onClick={() => setDragLayoutCompact(!dragLayoutCompact)}>
            {dragLayoutCompact ? 'Comfortable' : 'Compact'} Grid
          </Button>
        </div>

        {/* Upload Area */}
        <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
          <p className="ant-upload-drag-icon">
            <PictureOutlined />
          </p>
          <p className="ant-upload-text">{dragText}</p>
          <p className="ant-upload-hint">{dragHint}</p>
        </Dragger>
        
        {/* Image Grid/List */}
        {fileList.length > 0 && (
          <div>
            <Title level={5}>Uploaded Images ({fileList.length}/{maxCount})</Title>
            {layout === 'grid' ? (
              <Row gutter={[12, 12]}>
                {fileList.map(image => (
                  <Col key={image.uid} xs={24} sm={12} md={dragLayoutCompact ? 8 : 12} lg={dragLayoutCompact ? 6 : 8} xl={dragLayoutCompact ? 4 : 6}>
                    {renderImageCard(image)}
                  </Col>
                ))}
              </Row>
            ) : (
              <div>
                {fileList.map(renderImageCard)}
              </div>
            )}
          </div>
        )}
        
        {/* Drawing Modal */}
        <Modal
          title={`Draw on ${currentDrawingImage?.name}`}
          open={drawingModalVisible}
          onCancel={() => setDrawingModalVisible(false)}
          width="90%"
          style={{ top: 20 }}
          footer={[
            <Button key="cancel" onClick={() => setDrawingModalVisible(false)}>
              Cancel
            </Button>,
            <Button key="clear" icon={<ClearOutlined />} onClick={clearDrawing}>
              Clear
            </Button>,
            <Button key="undo" icon={<UndoOutlined />} onClick={undoDrawing} disabled={historyIndex <= 0}>
              Undo
            </Button>,
            <Button key="redo" icon={<RedoOutlined />} onClick={redoDrawing} disabled={historyIndex >= drawingHistory.length - 1}>
              Redo
            </Button>,
            <Button key="save" type="primary" icon={<SaveOutlined />} onClick={saveDrawing}>
              Save Drawing
            </Button>
          ]}
        >
          {currentDrawingImage && (
            <div style={{ textAlign: 'center' }}>
              {/* Drawing Tools */}
              <Space style={{ marginBottom: 16 }}>
                {drawingTools.map(tool => (
                  <Button
                    key={tool}
                    type={currentTool === tool ? 'primary' : 'default'}
                    onClick={() => setCurrentTool(tool)}
                    icon={<EditOutlined />}
                  >
                    {tool.charAt(0).toUpperCase() + tool.slice(1)}
                  </Button>
                ))}
              </Space>
              
              <Divider />
              
              {/* Color Palette */}
              <Space style={{ marginBottom: 16 }}>
                <Text strong>Color:</Text>
                {(palette || []).slice(0, 12).map(color => (
                  <div
                    key={color}
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: color,
                      border: currentColor === color ? '2px solid hsl(var(--ring))' : '1px solid hsl(var(--border))',
                      borderRadius: '50%',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCurrentColor(color)}
                    title={color}
                  />
                ))}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    title="Custom color"
                  />
                  <Button size="small" onClick={() => setCurrentColor(customColor)}>Use</Button>
                </div>
              </Space>
              
              <Divider />
              
              {/* Stroke Width */}
              <Space style={{ marginBottom: 16 }}>
                <Text strong>Width:</Text>
                {strokeWidths.map(width => (
                  <Button
                    key={width}
                    type={currentStrokeWidth === width ? 'primary' : 'default'}
                    onClick={() => setCurrentStrokeWidth(width)}
                    size="small"
                  >
                    {width}px
                  </Button>
                ))}
              </Space>
              
              <Divider />
              
              {/* Drawing Canvas */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  src={currentDrawingImage.url}
                  alt={currentDrawingImage.name}
                  style={{ display: 'none' }}
                  onLoad={() => initializeDrawingCanvas(currentDrawingImage)}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    border: '1px solid hsl(var(--border))',
                    cursor: currentTool === 'pen' ? 'crosshair' : 'default',
                    maxWidth: '100%',
                    maxHeight: '70vh'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
            </div>
          )}
        </Modal>
      </Space>
    </div>
  );
};

export default ImageUploadWithDrawingWidget; 

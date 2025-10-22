/**
 * Type definitions for ImageUploadWidget
 */

export interface ImageMetadata {
  width?: number;
  height?: number;
  size: number;
  type: string;
  referenceCount?: number;
}

export interface ImageData {
  uid: string;
  name: string;
  url: string;
  gridfsId?: string;
  type: 'gridfs' | 'base64';
  fileHash?: string;
  deduplicated?: boolean;
  drawingData?: string;
  hasModifications?: boolean;
  annotations?: Array<{
    id: string;
    type: 'line' | 'circle' | 'rectangle' | 'text' | 'arrow';
    data: any;
    color: string;
    strokeWidth: number;
  }>;
  metadata?: ImageMetadata;
  description?: string;
  caption?: string;
  tags?: string[];
  rotation?: number;
  selected?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  quality?: number;
  exif?: Record<string, any>;
  thumbnail?: string;
  order?: number;
}

export type DrawingTool = 'pen' | 'line' | 'circle' | 'rectangle' | 'text' | 'arrow';

export interface ImageUploadWidgetProps {
  id?: string;
  label?: string;
  value?: ImageData[];
  onChange?: (value: ImageData[]) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  
  // Storage configuration
  persistent?: boolean;
  clientOnly?: boolean;
  
  // Upload options
  maxCount?: number;
  maxSize?: number; // in MB
  accept?: string;
  multiple?: boolean;
  
  // Drawing options
  drawingEnabled?: boolean;
  drawingTools?: readonly DrawingTool[] | DrawingTool[];
  drawingColors?: string[];
  strokeWidths?: number[];
  
  // UI options
  showPreview?: boolean;
  showThumbnails?: boolean;
  thumbnailSize?: number;
  layout?: 'grid' | 'list';
}

export interface UseImageUploadOptions {
  value?: ImageData[];
  onChange?: (value: ImageData[]) => void;
  persistent: boolean;
  clientOnly: boolean;
  maxCount: number;
  maxSize: number;
}

export interface UseDrawingOptions {
  fileList: ImageData[];
  onChange?: (value: ImageData[]) => void;
}

export interface DrawingState {
  isDrawing: boolean;
  currentTool: string;
  currentColor: string;
  currentStrokeWidth: number;
  setIsDrawing: (value: boolean) => void;
  setCurrentTool: (tool: string) => void;
  setCurrentColor: (color: string) => void;
  setCurrentStrokeWidth: (width: number) => void;
}

export interface ImageGridProps {
  images: ImageData[];
  onPreview: (image: ImageData) => void;
  onEdit?: (image: ImageData) => void;
  onRemove: (uid: string) => void;
  uploading: Record<string, boolean>;
  thumbnailSize: number;
  resolveUrl: (image: ImageData) => string;
}

export interface ImageCardProps {
  image: ImageData;
  onPreview: () => void;
  onEdit?: () => void;
  onRemove: () => void;
  loading?: boolean;
  thumbnailSize: number;
  resolveUrl: (image: ImageData) => string;
}

export interface DrawingModalProps {
  image: ImageData | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  drawingState: DrawingState;
  drawingTools: readonly DrawingTool[] | DrawingTool[];
  drawingColors: string[];
  strokeWidths: number[];
  onSave: () => void;
  onSaveToHistory?: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
  resolveUrl: (image: ImageData) => string;
  historyIndex?: number;
  historyLength?: number;
}

export interface UploadAreaProps {
  onUpload: (options: any) => Promise<void>;
  disabled: boolean;
  maxSize: number;
  maxCount: number;
  accept: string;
  multiple: boolean;
  beforeUpload: (file: any) => boolean;
}

export interface StorageAdapter {
  upload(file: File): Promise<ImageData>;
  delete(id: string): Promise<void>;
  resolveUrl(image: ImageData): string;
}


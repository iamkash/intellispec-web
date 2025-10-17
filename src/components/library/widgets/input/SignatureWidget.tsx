/**
 * SignatureWidget - Digital signature input component
 * 
 * A form input widget that allows users to create digital signatures using canvas.
 * Supports touch/mouse drawing, signature validation, and export functionality.
 * Perfect for approvals, sign-offs, and digital document signing.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button, Space, Typography, Card } from 'antd';
import { 
  ClearOutlined, 
  UndoOutlined,
  RedoOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Signature data interface
export interface SignatureData {
  dataURL: string;
  timestamp: number;
  signedBy?: string;
  width: number;
  height: number;
}

// Signature widget props
export interface SignatureWidgetProps {
  id: string;
  label?: string;
  value?: SignatureData;
  defaultValue?: SignatureData;
  onChange?: (value: SignatureData) => void;
  onSign?: (signature: SignatureData) => void;
  onClear?: () => void;
  
  // Canvas configuration
  width?: number;
  height?: number;
  backgroundColor?: string;
  penColor?: string;
  penWidth?: number;
  
  // Behavior
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  
  // Validation
  validateOnChange?: boolean;
  validator?: (value: SignatureData) => string | null;
  minStrokeCount?: number;
  maxFileSize?: number; // in bytes
  
  // Export options
  exportFormat?: 'png' | 'jpeg' | 'svg';
  exportQuality?: number;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  canvasStyle?: React.CSSProperties;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Additional features
  showTools?: boolean;
  showTimestamp?: boolean;
  showSignedBy?: boolean;
  signedBy?: string;
  
  // Undo/Redo
  enableUndo?: boolean;
  maxUndoSteps?: number;
  
  // Touch/Mobile
  enableTouch?: boolean;
  preventScrollOnTouch?: boolean;
  
  // Placeholder
  placeholder?: string;
  placeholderStyle?: React.CSSProperties;
}

/**
 * SignatureWidget Component
 * 
 * Provides digital signature input using HTML5 Canvas.
 * Supports touch and mouse input, validation, and export functionality.
 */
export const SignatureWidget: React.FC<SignatureWidgetProps> = ({
  id,
  label,
  value,
  defaultValue,
  onChange,
  onSign,
  onClear,
  
  width = 400,
  height = 200,
  backgroundColor = '#ffffff',
  penColor = '#000000',
  penWidth = 2,
  
  disabled = false,
  readOnly = false,
  required = false,
  
  validateOnChange = true,
  validator,
  minStrokeCount = 1,
  maxFileSize = 1024 * 1024, // 1MB
  
  exportFormat = 'png',
  exportQuality = 0.92,
  
  className,
  style,
  canvasStyle,
  
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  showTools = true,
  showTimestamp = true,
  showSignedBy = true,
  signedBy,
  
  enableUndo = true,
  maxUndoSteps = 10,
  
  enableTouch = true,
  preventScrollOnTouch = true,
  
  placeholder = "Sign here",
  placeholderStyle = { color: '#ccc', fontSize: 16 },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [strokeCount, setStrokeCount] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Save canvas state to undo stack
  const saveToUndoStack = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    setUndoStack(prev => {
      const newStack = [...prev, imageData];
      return newStack.slice(-maxUndoSteps);
    });
    setRedoStack([]);
  }, [width, height, maxUndoSteps]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Set drawing properties
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Load existing signature if provided
    if (value?.dataURL) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = value.dataURL;
    } else if (defaultValue?.dataURL) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = defaultValue.dataURL;
    }
    
    // Save initial state for undo
    saveToUndoStack();
  }, [width, height, backgroundColor, penColor, penWidth, value, defaultValue, saveToUndoStack]);

  // Validation function
  const validateValue = useCallback((signatureData: SignatureData): string | null => {
    if (required && isEmpty) {
      return 'Signature is required';
    }
    
    if (signatureData && strokeCount < minStrokeCount) {
      return `Signature must have at least ${minStrokeCount} stroke${minStrokeCount > 1 ? 's' : ''}`;
    }
    
    if (signatureData?.dataURL) {
      const dataSize = signatureData.dataURL.length * 0.75; // Approximate size
      if (dataSize > maxFileSize) {
        return `Signature file size exceeds limit (${Math.round(maxFileSize / 1024)}KB)`;
      }
    }
    
    if (validator) {
      return validator(signatureData);
    }
    
    return null;
  }, [required, isEmpty, strokeCount, minStrokeCount, maxFileSize, validator]);

  // Get current signature data
  const getCurrentSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return null;
    
    const dataURL = canvas.toDataURL(`image/${exportFormat}`, exportQuality);
    
    return {
      dataURL,
      timestamp: Date.now(),
      signedBy: signedBy || 'Anonymous',
      width: canvas.width,
      height: canvas.height,
    };
  }, [isEmpty, exportFormat, exportQuality, signedBy]);

  // Handle value change
  const handleValueChange = useCallback((signatureData: SignatureData | null) => {
    if (validateOnChange && signatureData) {
      const error = validateValue(signatureData);
      setValidationError(error);
    }
    
    if (signatureData) {
      onChange?.(signatureData);
      onSign?.(signatureData);
    }
  }, [onChange, onSign, validateOnChange, validateValue]);

  // Get mouse/touch coordinates
  const getEventPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || readOnly) return;
    
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);
    
    const point = getEventPoint(e);
    setLastPoint(point);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [disabled, readOnly, getEventPoint]);

  // Continue drawing
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || readOnly) return;
    
    e.preventDefault();
    const point = getEventPoint(e);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    
    setLastPoint(point);
  }, [isDrawing, disabled, readOnly, getEventPoint]);

  // Stop drawing
  const stopDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
    setStrokeCount(prev => prev + 1);
    
    // Save to undo stack
    if (enableUndo) {
      saveToUndoStack();
    }
    
    // Update value
    const signatureData = getCurrentSignature();
    if (signatureData) {
      handleValueChange(signatureData);
    }
  }, [isDrawing, enableUndo, saveToUndoStack, getCurrentSignature, handleValueChange]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    setIsEmpty(true);
    setStrokeCount(0);
    setValidationError(null);
    
    if (enableUndo) {
      saveToUndoStack();
    }
    
    onClear?.();
  }, [backgroundColor, width, height, enableUndo, saveToUndoStack, onClear]);

  // Undo last action
  const undo = useCallback(() => {
    if (undoStack.length <= 1) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Move current state to redo stack
    const currentState = ctx.getImageData(0, 0, width, height);
    setRedoStack(prev => [...prev, currentState]);
    
    // Restore previous state
    const prevState = undoStack[undoStack.length - 2];
    ctx.putImageData(prevState, 0, 0);
    
    // Update undo stack
    setUndoStack(prev => prev.slice(0, -1));
    
    // Update state
    setStrokeCount(prev => Math.max(0, prev - 1));
    setIsEmpty(undoStack.length <= 2);
    
    // Update value
    const signatureData = getCurrentSignature();
    if (signatureData) {
      handleValueChange(signatureData);
    }
  }, [undoStack, width, height, getCurrentSignature, handleValueChange]);

  // Redo last undone action
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Save current state to undo stack
    const currentState = ctx.getImageData(0, 0, width, height);
    setUndoStack(prev => [...prev, currentState]);
    
    // Restore next state
    const nextState = redoStack[redoStack.length - 1];
    ctx.putImageData(nextState, 0, 0);
    
    // Update redo stack
    setRedoStack(prev => prev.slice(0, -1));
    
    // Update state
    setStrokeCount(prev => prev + 1);
    setIsEmpty(false);
    
    // Update value
    const signatureData = getCurrentSignature();
    if (signatureData) {
      handleValueChange(signatureData);
    }
  }, [redoStack, width, height, getCurrentSignature, handleValueChange]);

  // Download signature
  const downloadSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    
    const link = document.createElement('a');
    link.download = `signature_${Date.now()}.${exportFormat}`;
    link.href = canvas.toDataURL(`image/${exportFormat}`, exportQuality);
    link.click();
  }, [isEmpty, exportFormat, exportQuality]);

  // Render placeholder
  const renderPlaceholder = () => {
    if (!isEmpty) return null;
    
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          ...placeholderStyle,
        }}
      >
        {placeholder}
      </div>
    );
  };

  // Render signature info
  const renderSignatureInfo = () => {
    if (isEmpty) return null;
    
    const signatureData = getCurrentSignature();
    if (!signatureData) return null;
    
    return (
      <Card size="small" style={{ marginTop: 8 }}>
        <Space direction="vertical" size={2}>
          {showSignedBy && (
            <Text style={{ fontSize: 12 }}>
              <strong>Signed by:</strong> {signatureData.signedBy}
            </Text>
          )}
          {showTimestamp && (
            <Text style={{ fontSize: 12 }}>
              <strong>Signed at:</strong> {new Date(signatureData.timestamp).toLocaleString()}
            </Text>
          )}
          <Text style={{ fontSize: 12 }}>
            <strong>Strokes:</strong> {strokeCount}
          </Text>
        </Space>
      </Card>
    );
  };

  // Render tools
  const renderTools = () => {
    if (!showTools) return null;
    
    return (
      <Space style={{ marginTop: 8 }}>
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={clearSignature}
          disabled={disabled || isEmpty}
        >
          Clear
        </Button>
        
        {enableUndo && (
          <>
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={undo}
              disabled={disabled || undoStack.length <= 1}
            />
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={redo}
              disabled={disabled || redoStack.length === 0}
            />
          </>
        )}
        
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={downloadSignature}
          disabled={isEmpty}
        >
          Download
        </Button>
      </Space>
    );
  };

  return (
    <div className={className} style={style}>
      {label && (
        <label 
          htmlFor={id}
          style={{ 
            display: 'block', 
            marginBottom: 8,
            fontWeight: 500,
            color: required ? '#ff4d4f' : undefined
          }}
        >
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            cursor: disabled || readOnly ? 'not-allowed' : 'crosshair',
            touchAction: preventScrollOnTouch ? 'none' : 'auto',
            ...canvasStyle,
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={enableTouch ? startDrawing : undefined}
          onTouchMove={enableTouch ? draw : undefined}
          onTouchEnd={enableTouch ? stopDrawing : undefined}
          aria-label={ariaLabel || 'Signature canvas'}
          aria-describedby={ariaDescribedBy}
        />
        {renderPlaceholder()}
      </div>
      
      {renderTools()}
      {renderSignatureInfo()}
      
      {validationError && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {validationError}
        </div>
      )}
    </div>
  );
};

export default SignatureWidget; 

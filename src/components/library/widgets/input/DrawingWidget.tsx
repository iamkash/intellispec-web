/**
 * DrawingWidget - Simple drawing/sketch component
 * 
 * A form input widget for creating drawings and sketches.
 * Basic canvas implementation with clear functionality.
 */

import React, { useRef, useState, useCallback } from 'react';
import { Button, Space } from 'antd';
import { ClearOutlined } from '@ant-design/icons';

export interface DrawingWidgetProps {
  id: string;
  label?: string;
  value?: string; // base64 image
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const DrawingWidget: React.FC<DrawingWidgetProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  width = 400,
  height = 300,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [disabled]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [isDrawing, disabled]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      onChange?.(dataURL);
    }
  }, [onChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      onChange?.('');
    }
  }, [width, height, onChange]);

  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      
      <Space direction="vertical">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            border: '1px solid #d9d9d9',
            cursor: disabled ? 'not-allowed' : 'crosshair',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        <Button
          icon={<ClearOutlined />}
          onClick={clearCanvas}
          disabled={disabled}
          size="small"
        >
          Clear
        </Button>
      </Space>
    </div>
  );
};

export default DrawingWidget; 

/**
 * EnhancedDrawingModal - Advanced drawing modal with all tools working
 */

import { Button, Divider, Modal, Slider, Space, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawingModalProps, ImageData } from '../types';
import styles from './EnhancedDrawingModal.module.css';

const { Text } = Typography;

export const EnhancedDrawingModal: React.FC<DrawingModalProps> = ({
  image,
  canvasRef,
  drawingState,
  drawingTools,
  drawingColors,
  strokeWidths,
  onSave,
  onSaveToHistory,
  onClear,
  onUndo,
  onRedo,
  onClose,
  resolveUrl,
  historyIndex = 0,
  historyLength = 0
}) => {
  // ALL hooks must be before any early return
  const imageRef = useRef<HTMLImageElement>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null);

  // Helper to get original URL without annotations
  const getOriginalUrl = useCallback((img: ImageData) => {
    // For base64 images, return the original url
    if (img.type === 'base64') {
      return img.url;
    }
    // For GridFS, we need to add auth token manually
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return img.url;

    try {
      const isAbsolute = /^https?:\/\//i.test(img.url);
      const urlObj = new URL(img.url, window.location.origin);
      urlObj.searchParams.set('authToken', token);
      return isAbsolute ? urlObj.toString() : `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    } catch (err) {
      const separator = img.url.includes('?') ? '&' : '?';
      return `${img.url}${separator}authToken=${encodeURIComponent(token)}`;
    }
  }, []);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    // Load existing annotations only if they exist
    if (image.drawingData) {
      const drawingImg = new window.Image();
      drawingImg.onload = () => {
        ctx.drawImage(drawingImg, 0, 0);
      };
      drawingImg.src = image.drawingData;
    }
  }, [image, canvasRef]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, [canvasRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    setStartPoint(coords);
    
    ctx.strokeStyle = drawingState.currentColor;
    ctx.fillStyle = drawingState.currentColor;
    ctx.lineWidth = drawingState.currentStrokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (drawingState.currentTool === 'pen') {
      drawingState.setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else if (drawingState.currentTool === 'text') {
      const text = window.prompt('Enter text:');
      if (text) {
        ctx.font = `${drawingState.currentStrokeWidth * 8}px Arial`;
        ctx.fillText(text, coords.x, coords.y);
        onSave(); // Auto-save text
      }
    } else {
      // For shapes, save current canvas state before starting
      if (tempCanvas) {
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }
      }
      drawingState.setIsDrawing(true);
    }
  }, [canvasRef, drawingState, onSave, image, getCanvasCoordinates, tempCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !startPoint) return;
    
    const coords = getCanvasCoordinates(e);

    if (drawingState.currentTool === 'pen') {
      // Pen tool: draw in real-time (permanent)
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tempCanvas && tempCanvas.width > 0) {
      // For shapes: show live preview (temporary)
      // Restore saved canvas state (includes base image + previous drawings)
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      
      // Draw preview shape
      ctx.strokeStyle = drawingState.currentColor;
      ctx.lineWidth = drawingState.currentStrokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      switch (drawingState.currentTool) {
        case 'line':
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
          break;
          
        case 'rectangle':
          const width = coords.x - startPoint.x;
          const height = coords.y - startPoint.y;
          ctx.beginPath();
          ctx.strokeRect(startPoint.x, startPoint.y, width, height);
          break;
          
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(coords.x - startPoint.x, 2) + 
            Math.pow(coords.y - startPoint.y, 2)
          );
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case 'arrow':
          const headLength = 20 + drawingState.currentStrokeWidth;
          const angle = Math.atan2(coords.y - startPoint.y, coords.x - startPoint.x);
          
          ctx.beginPath();
          // Draw line
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
          
          // Draw arrowhead
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
          ctx.lineTo(
            coords.x - headLength * Math.cos(angle - Math.PI / 6),
            coords.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(coords.x, coords.y);
          ctx.lineTo(
            coords.x - headLength * Math.cos(angle + Math.PI / 6),
            coords.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          break;
      }
    }
  }, [drawingState, canvasRef, startPoint, tempCanvas, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing) return;
    
    // Save to history for undo/redo (after drawing is complete)
    onSaveToHistory?.();
    
    // Clear temp canvas for next drawing
    if (tempCanvas && drawingState.currentTool !== 'pen') {
      tempCanvas.width = 0;
      tempCanvas.height = 0;
    }
    
    drawingState.setIsDrawing(false);
    setStartPoint(null);
  }, [drawingState, tempCanvas, onSaveToHistory]);

  useEffect(() => {
    // Create temporary canvas for preview
    const temp = document.createElement('canvas');
    setTempCanvas(temp);
  }, []);

  useEffect(() => {
    if (image && imageRef.current && canvasRef.current) {
      initCanvas();
    }
  }, [image, initCanvas]);

  // Early return after ALL hooks
  if (!image) return null;

  return (
    <Modal
      open={!!image}
      title={`Draw on ${image?.name || 'Image'}`}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="clear" onClick={onClear}>
          Clear All
        </Button>,
        <Button 
          key="undo" 
          onClick={onUndo}
          disabled={historyIndex <= 0 || historyLength <= 1}
        >
          Undo
        </Button>,
        <Button 
          key="redo" 
          onClick={onRedo}
          disabled={historyIndex >= historyLength - 1}
        >
          Redo
        </Button>,
        <Button key="save" type="primary" onClick={onSave}>
          Save Drawing
        </Button>
      ]}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      className={styles.drawingModal}
    >
      <div className={styles.drawingContainer}>
        {/* Drawing Tools Toolbar */}
        <div className={styles.toolbar}>
          <Space size="middle" wrap>
            {/* Tools */}
            <Space size="small">
              <Text strong>Tool:</Text>
              {drawingTools.map(tool => (
                <Button
                  key={tool}
                  size="small"
                  type={drawingState.currentTool === tool ? 'primary' : 'default'}
                  onClick={() => drawingState.setCurrentTool(tool)}
                  className={drawingState.currentTool === tool ? styles.activeToolButton : ''}
                >
                  {tool.charAt(0).toUpperCase() + tool.slice(1)}
                </Button>
              ))}
            </Space>

            <Divider type="vertical" />

            {/* Colors */}
            <Space size="small">
              <Text strong>Color:</Text>
              <div className={styles.colorPalette}>
                {drawingColors.map(color => (
                  <div
                    key={color}
                    className={`${styles.colorSwatch} ${drawingState.currentColor === color ? styles.colorSwatchActive : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => drawingState.setCurrentColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </Space>

            <Divider type="vertical" />

            {/* Stroke Width */}
            <Space size="small">
              <Text strong>Width:</Text>
              <Slider
                min={1}
                max={20}
                value={drawingState.currentStrokeWidth}
                onChange={drawingState.setCurrentStrokeWidth}
                style={{ width: 150 }}
                tooltip={{ formatter: (val) => `${val}px` }}
              />
              <Text type="secondary">{drawingState.currentStrokeWidth}px</Text>
            </Space>
          </Space>
        </div>

        {/* Canvas Container */}
        <div className={styles.canvasContainer}>
          <img
            ref={imageRef}
            src={image ? getOriginalUrl(image) : ''}
            alt={image.name}
            onLoad={initCanvas}
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={styles.drawingCanvas}
            style={{
              cursor: drawingState.currentTool === 'pen' ? 'crosshair' : 
                     drawingState.currentTool === 'text' ? 'text' : 'default'
            }}
          />
        </div>

        {/* Instructions & History Info */}
        <div className={styles.instructions}>
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">
              {drawingState.currentTool === 'pen' && '🖊️ Click and drag to draw freehand'}
              {drawingState.currentTool === 'line' && '📏 Click and drag to draw a straight line'}
              {drawingState.currentTool === 'rectangle' && '▭ Click and drag to draw a rectangle'}
              {drawingState.currentTool === 'circle' && '⭕ Click and drag to draw a circle'}
              {drawingState.currentTool === 'arrow' && '➡️ Click and drag to draw an arrow'}
              {drawingState.currentTool === 'text' && '📝 Click where you want to add text'}
            </Text>
            {historyLength > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                History: {historyIndex + 1}/{historyLength}
              </Text>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
};


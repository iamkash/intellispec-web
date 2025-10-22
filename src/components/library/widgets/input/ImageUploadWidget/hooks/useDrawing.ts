/**
 * useDrawing - Custom hook for canvas drawing functionality
 */

import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import type { DrawingState, ImageData, UseDrawingOptions } from '../types';

export function useDrawing(options: UseDrawingOptions) {
  const { fileList, onChange } = options;
  
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const drawingContext = useRef<CanvasRenderingContext2D | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Initialize drawing canvas
  const initializeDrawingCanvas = useCallback((image: ImageData) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    // ALWAYS save the clean state first (without any drawings)
    const cleanState = canvas.toDataURL();
    setDrawingHistory([cleanState]);
    setHistoryIndex(0);
    
    // Then load existing drawings if any
    if (image.drawingData) {
      const drawingImg = new window.Image();
      drawingImg.onload = () => {
        ctx.drawImage(drawingImg, 0, 0);
        // Save the state WITH drawings as the second history entry
        const drawnState = canvas.toDataURL();
        setDrawingHistory([cleanState, drawnState]);
        setHistoryIndex(1); // Point to the drawn state
      };
      drawingImg.src = image.drawingData;
    }
    
    drawingContext.current = ctx;
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingContext.current) return;
    
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
  }, [currentColor, currentStrokeWidth, currentTool]);

  // Draw
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

  // Stop drawing
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

  // Save drawing
  const saveDrawing = useCallback(() => {
    if (!canvasRef.current || !editingImage) return;
    
    const drawingData = canvasRef.current.toDataURL();
    const updatedImage = { 
      ...editingImage, 
      drawingData,
      hasModifications: true
    };
    
    const newFileList = fileList.map(img => 
      img.uid === editingImage.uid ? updatedImage : img
    );
    
    onChange?.(newFileList);
    setEditingImage(null);
    message.success('Drawing saved! Image marked as modified.');
  }, [editingImage, fileList, onChange]);

  // Save current canvas state to history
  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    
    const dataURL = canvasRef.current.toDataURL();
    
    setDrawingHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataURL);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Clear drawing
  const clearDrawing = useCallback(() => {
    if (!canvasRef.current || !editingImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // IMPORTANT: Clear the drawingData from the image object FIRST
    const updatedImage = { 
      ...editingImage, 
      drawingData: undefined,
      hasModifications: false
    };
    
    // Update the image in the file list
    const newFileList = fileList.map(img => 
      img.uid === editingImage.uid ? updatedImage : img
    );
    onChange?.(newFileList);
    
    // IMPORTANT: Update the editingImage state to match (this will trigger modal re-render)
    setEditingImage(updatedImage);
    
    // Clear the canvas and redraw original image
    // Load the original image (without annotations)
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Reset history to just the clean state
      const cleanState = canvas.toDataURL();
      setDrawingHistory([cleanState]);
      setHistoryIndex(0);
      
      message.success('All annotations cleared');
    };
    // Use the original URL without drawingData
    img.src = updatedImage.url;
  }, [editingImage, fileList, onChange]);

  // Undo drawing
  const undoDrawing = useCallback(() => {
    if (historyIndex > 0 && drawingHistory.length > 1) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      if (canvasRef.current && drawingHistory[newIndex] && editingImage) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new window.Image();
          img.onload = () => {
            // Preserve canvas dimensions
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            
            ctx.clearRect(0, 0, originalWidth, originalHeight);
            ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
            
            // IMPORTANT: Update the image object's drawingData
            const newDrawingData = newIndex === 0 ? undefined : drawingHistory[newIndex];
            const updatedImage = { 
              ...editingImage, 
              drawingData: newDrawingData,
              hasModifications: newIndex > 0
            };
            
            // Update the image in the file list
            const newFileList = fileList.map(img => 
              img.uid === editingImage.uid ? updatedImage : img
            );
            onChange?.(newFileList);
            
            // IMPORTANT: Update the editingImage state to match
            setEditingImage(updatedImage);
          };
          img.src = drawingHistory[newIndex];
        }
      }
    }
  }, [historyIndex, drawingHistory, editingImage, fileList, onChange]);

  // Redo drawing
  const redoDrawing = useCallback(() => {
    if (historyIndex < drawingHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      if (canvasRef.current && drawingHistory[newIndex] && editingImage) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new window.Image();
          img.onload = () => {
            // Preserve canvas dimensions
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            
            ctx.clearRect(0, 0, originalWidth, originalHeight);
            ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
            
            // IMPORTANT: Update the image object's drawingData
            const newDrawingData = newIndex === 0 ? undefined : drawingHistory[newIndex];
            const updatedImage = { 
              ...editingImage, 
              drawingData: newDrawingData,
              hasModifications: newIndex > 0
            };
            
            // Update the image in the file list
            const newFileList = fileList.map(img => 
              img.uid === editingImage.uid ? updatedImage : img
            );
            onChange?.(newFileList);
            
            // IMPORTANT: Update the editingImage state to match
            setEditingImage(updatedImage);
          };
          img.src = drawingHistory[newIndex];
        }
      }
    }
  }, [historyIndex, drawingHistory, editingImage, fileList, onChange]);

  const drawingState: DrawingState = {
    isDrawing,
    currentTool,
    currentColor,
    currentStrokeWidth,
    setIsDrawing,
    setCurrentTool,
    setCurrentColor,
    setCurrentStrokeWidth
  };

  return {
    editingImage,
    setEditingImage,
    canvasRef,
    imageRef,
    drawingState,
    initializeDrawingCanvas,
    startDrawing,
    draw,
    stopDrawing,
    saveDrawing,
    saveToHistory,
    clearDrawing,
    undoDrawing,
    redoDrawing,
    historyIndex,
    drawingHistory
  };
}


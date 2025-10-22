/**
 * ImageUploadWidget - Unified image upload widget with drawing capabilities
 * 
 * Features:
 * - Smart storage selection (GridFS for persistent, Base64 for ephemeral)
 * - Drawing and annotation capabilities
 * - Drag & drop support
 * - Clean state management
 * - Backwards compatible with existing calculators
 */

import { Modal } from 'antd';
import React, { useState } from 'react';
import { EnhancedDrawingModal } from './components/EnhancedDrawingModal';
import { EnhancedImageGrid } from './components/EnhancedImageGrid';
import { UploadArea } from './components/UploadArea';
import {
    DEFAULT_ACCEPT,
    DEFAULT_DRAWING_COLORS,
    DEFAULT_DRAWING_TOOLS,
    DEFAULT_MAX_COUNT,
    DEFAULT_MAX_SIZE,
    DEFAULT_STROKE_WIDTHS,
    DEFAULT_THUMBNAIL_SIZE
} from './constants';
import { useDrawing } from './hooks/useDrawing';
import { useImageUpload } from './hooks/useImageUpload';
import type { ImageUploadWidgetProps } from './types';

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  id = 'image-upload',
  label,
  value = [],
  onChange,
  disabled = false,
  required = false,
  className = '',
  style,
  persistent = false,
  clientOnly = false,
  maxCount = DEFAULT_MAX_COUNT,
  maxSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  multiple = true,
  drawingEnabled = true,
  drawingTools = DEFAULT_DRAWING_TOOLS,
  drawingColors = DEFAULT_DRAWING_COLORS,
  strokeWidths = DEFAULT_STROKE_WIDTHS,
  showPreview = true,
  showThumbnails = true,
  thumbnailSize = DEFAULT_THUMBNAIL_SIZE,
  layout = 'grid',
  // Enhanced features
  showToolbar = true,
  showMetadata = true,
  showSelection = true,
  showAdvancedControls = true,
  enableDragDrop = true
}: ImageUploadWidgetProps & {
  showToolbar?: boolean;
  showMetadata?: boolean;
  showSelection?: boolean;
  showAdvancedControls?: boolean;
  enableDragDrop?: boolean;
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Image upload logic
  const {
    fileList,
    uploading,
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
  } = useImageUpload({
    value,
    onChange,
    persistent,
    clientOnly,
    maxCount,
    maxSize
  });

  // Drawing logic
  const {
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
  } = useDrawing({
    fileList,
    onChange
  });

  // Handle preview
  const handlePreview = (image: any) => {
    setPreviewImage(resolveUrl(image));
    setPreviewTitle(image.name);
    setPreviewOpen(true);
  };

  return (
    <div className={`image-upload-widget ${className}`} style={style}>
      {label && (
        <div className="widget-label" style={{ marginBottom: 8 }}>
          {label} {required && <span className="required">*</span>}
        </div>
      )}

      {/* Upload Area */}
      <UploadArea
        onUpload={customRequest}
        disabled={disabled || fileList.length >= maxCount}
        maxSize={maxSize}
        maxCount={maxCount}
        accept={accept}
        multiple={multiple}
        beforeUpload={beforeUpload}
      />

      {/* Enhanced Image Grid */}
      {showThumbnails && (
        <EnhancedImageGrid
          images={fileList}
          onPreview={handlePreview}
          onEdit={drawingEnabled ? setEditingImage : undefined}
          onRemove={handleRemove}
          onRotate={handleRotate}
          onCopy={handleCopy}
          onToggleSelect={handleToggleSelect}
          onUpdateDescription={handleUpdateDescription}
          onUpdateCaption={handleUpdateCaption}
          onUpdateTags={handleUpdateTags}
          onReorder={handleReorder}
          onBatchDelete={handleBatchDelete}
          onBatchDownload={handleBatchDownload}
          uploading={uploading}
          thumbnailSize={thumbnailSize}
          resolveUrl={resolveUrl}
          showToolbar={showToolbar}
          showMetadata={showMetadata}
          showSelection={showSelection}
          showAdvancedControls={showAdvancedControls}
          enableDragDrop={enableDragDrop}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <Modal
          open={previewOpen}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewOpen(false)}
          width={800}
        >
          <img alt="preview" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      )}

      {/* Enhanced Drawing Modal - All tools working */}
      {drawingEnabled && editingImage && (
        <EnhancedDrawingModal
          image={editingImage}
          canvasRef={canvasRef}
          drawingState={drawingState}
          drawingTools={drawingTools}
          drawingColors={drawingColors}
          strokeWidths={strokeWidths}
          onSave={saveDrawing}
          onSaveToHistory={saveToHistory}
          onClear={clearDrawing}
          onUndo={undoDrawing}
          onRedo={redoDrawing}
          onClose={() => setEditingImage(null)}
          resolveUrl={resolveUrl}
          historyIndex={historyIndex}
          historyLength={drawingHistory.length}
        />
      )}
    </div>
  );
};

export default ImageUploadWidget;


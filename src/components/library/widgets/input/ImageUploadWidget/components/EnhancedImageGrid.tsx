/**
 * EnhancedImageGrid - Advanced grid with batch operations and drag-drop
 */

import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PictureOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { Button, Col, Dropdown, Row, Space, Typography } from 'antd';
import React, { useState } from 'react';
import type { ImageData, ImageGridProps } from '../types';
import { EnhancedImageCard } from './EnhancedImageCard';
import styles from './EnhancedImageGrid.module.css';

const { Text } = Typography;

export const EnhancedImageGrid: React.FC<ImageGridProps & {
  onReorder?: (images: ImageData[]) => void;
  onBatchDelete?: (uids: string[]) => void;
  onBatchDownload?: (uids: string[]) => void;
  onRotate?: (uid: string, degrees: number) => void;
  onCopy?: (uid: string) => void;
  onToggleSelect?: (uid: string, selected: boolean) => void;
  onUpdateDescription?: (uid: string, description: string) => void;
  onUpdateCaption?: (uid: string, caption: string) => void;
  onUpdateTags?: (uid: string, tags: string[]) => void;
  showToolbar?: boolean;
  showMetadata?: boolean;
  showSelection?: boolean;
  showAdvancedControls?: boolean;
  enableDragDrop?: boolean;
}> = ({
  images,
  onPreview,
  onEdit,
  onRemove,
  uploading,
  thumbnailSize: initialThumbnailSize,
  resolveUrl,
  onReorder,
  onBatchDelete,
  onBatchDownload,
  onRotate,
  onCopy,
  onToggleSelect,
  onUpdateDescription,
  onUpdateCaption,
  onUpdateTags,
  showToolbar = true,
  showMetadata = true,
  showSelection = true,
  showAdvancedControls = true,
  enableDragDrop = true
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const selectedImages = images.filter(img => img.selected);
  const selectedCount = selectedImages.length;
  const allSelected = selectedCount === images.length && images.length > 0;

  const handleSelectAll = () => {
    images.forEach(img => onToggleSelect?.(img.uid, !allSelected));
  };

  const handleBatchDelete = () => {
    const selectedUids = selectedImages.map(img => img.uid);
    onBatchDelete?.(selectedUids);
  };

  const handleBatchDownload = () => {
    const selectedUids = selectedImages.map(img => img.uid);
    onBatchDownload?.(selectedUids);
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onReorder?.(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const sortItems = [
    { key: 'name', label: 'Sort by Name' },
    { key: 'date', label: 'Sort by Date' },
    { key: 'size', label: 'Sort by Size' },
    { key: 'type', label: 'Sort by Type' }
  ];

  const handleSort = (key: string) => {
    const sorted = [...images].sort((a, b) => {
      switch (key) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return (a.metadata?.size || 0) - (b.metadata?.size || 0);
        case 'date':
          return a.uid.localeCompare(b.uid);
        default:
          return 0;
      }
    });
    onReorder?.(sorted);
  };

  if (images.length === 0) {
    return (
      <div className={styles.emptyState}>
        <PictureOutlined className={styles.emptyStateIcon} />
        <div className={styles.emptyStateText}>No images uploaded yet</div>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      {/* Toolbar */}
      {showToolbar && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarSection}>
            <Text className={styles.imageCount}>
              {images.length} image{images.length !== 1 ? 's' : ''}
            </Text>
            
            {showSelection && (
              <>
                <Button
                  size="small"
                  type={allSelected ? 'primary' : 'default'}
                  icon={<CheckOutlined />}
                  onClick={handleSelectAll}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
                
                {selectedCount > 0 && (
                  <Text className={styles.selectedCount}>
                    {selectedCount} selected
                  </Text>
                )}
              </>
            )}
          </div>

          <div className={styles.toolbarSection}>
            {/* Sort Dropdown */}
            <Dropdown
              menu={{
                items: sortItems.map(item => ({
                  key: item.key,
                  label: item.label,
                  onClick: () => handleSort(item.key)
                }))
              }}
            >
              <Button size="small" icon={<SortAscendingOutlined />}>
                Sort
              </Button>
            </Dropdown>

            {/* Batch Operations */}
            {showSelection && selectedCount > 0 && (
              <Space size="small">
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleBatchDownload}
                >
                  Download ({selectedCount})
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  Delete ({selectedCount})
                </Button>
              </Space>
            )}
          </div>
        </div>
      )}

      {/* Image Grid - Responsive columns optimized for narrow containers */}
      <Row gutter={[16, 16]}>
        {images.map((image, index) => {
          // Optimized for narrow containers (like calculator forms at 50% width)
          return (
            <Col
              key={image.uid}
              xs={24}  // 1 column on mobile
              sm={24}  // 1 column on small screens
              md={12}  // 2 columns on tablets
              lg={12}  // 2 columns on desktop
              xl={12}  // 2 columns on large desktop
              xxl={8}  // 3 columns on extra large screens
              draggable={enableDragDrop}
              onDragStart={enableDragDrop ? handleDragStart(index) : undefined}
              onDragOver={enableDragDrop ? handleDragOver(index) : undefined}
              onDragEnd={enableDragDrop ? handleDragEnd : undefined}
              className={`${styles.dragItem} ${draggedIndex === index ? styles.dragItemDragging : ''}`}
            >
              <EnhancedImageCard
                image={image}
                onPreview={() => onPreview(image)}
                onEdit={onEdit ? () => onEdit(image) : undefined}
                onRemove={() => onRemove(image.uid)}
                onRotate={onRotate}
                onCopy={onCopy}
                onToggleSelect={onToggleSelect}
                onUpdateDescription={onUpdateDescription}
                onUpdateCaption={onUpdateCaption}
                onUpdateTags={onUpdateTags}
                loading={uploading[image.uid]}
                thumbnailSize={initialThumbnailSize}
                resolveUrl={resolveUrl}
                showMetadata={showMetadata}
                showSelection={showSelection}
                showAdvancedControls={showAdvancedControls}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};


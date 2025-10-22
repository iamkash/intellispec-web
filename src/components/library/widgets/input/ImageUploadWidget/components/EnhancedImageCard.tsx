/**
 * EnhancedImageCard - Advanced image card with rich features
 */

import {
    CopyOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    RotateLeftOutlined,
    RotateRightOutlined
} from '@ant-design/icons';
import {
    Card,
    Checkbox,
    Image,
    Input,
    message,
    Popconfirm,
    Progress,
    Space,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import React, { useState } from 'react';
import type { ImageCardProps } from '../types';
import styles from './EnhancedImageCard.module.css';

const { Text, Paragraph } = Typography;

export const EnhancedImageCard: React.FC<ImageCardProps & {
  onRotate?: (uid: string, degrees: number) => void;
  onCopy?: (uid: string) => void;
  onToggleSelect?: (uid: string, selected: boolean) => void;
  onUpdateDescription?: (uid: string, description: string) => void;
  onUpdateCaption?: (uid: string, caption: string) => void;
  onUpdateTags?: (uid: string, tags: string[]) => void;
  showMetadata?: boolean;
  showSelection?: boolean;
  showAdvancedControls?: boolean;
}> = ({
  image,
  onPreview,
  onEdit,
  onRemove,
  onRotate,
  onCopy,
  onToggleSelect,
  onUpdateDescription,
  onUpdateCaption,
  onUpdateTags,
  loading = false,
  thumbnailSize,
  resolveUrl,
  showMetadata = false,
  showSelection = false,
  showAdvancedControls = true
}) => {
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState(image.caption || '');
  const [showExif, setShowExif] = useState(false);

  const handleSaveCaption = () => {
    onUpdateCaption?.(image.uid, caption);
    setEditingCaption(false);
    message.success('Caption updated');
  };

  const handleRotate = (degrees: number) => {
    const newRotation = ((image.rotation || 0) + degrees) % 360;
    onRotate?.(image.uid, newRotation);
  };

  const handleCopy = () => {
    onCopy?.(image.uid);
    message.success('Image duplicated');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resolveUrl(image);
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Download started');
  };

  const renderImagePreview = () => {
    return (
      <div className={styles.imagePreviewContainer}>
        {showSelection && (
          <div className={styles.selectionCheckbox}>
            <Checkbox
              checked={image.selected}
              onChange={(e) => onToggleSelect?.(image.uid, e.target.checked)}
            />
          </div>
        )}
        
        {image.uploadProgress !== undefined && image.uploadProgress < 100 && (
          <div className={styles.progressContainer}>
            <Progress
              percent={image.uploadProgress}
              size="small"
              status={image.uploadError ? 'exception' : 'active'}
            />
          </div>
        )}

        {/* Use Ant Design Image for built-in zoom functionality */}
        <Image
          alt={image.name || 'Image'}
          src={resolveUrl(image)}
          preview={{
            mask: (
              <div className={styles.imageOverlay}>
                <Text className={styles.imageOverlayText}>
                  <EyeOutlined /> Click to zoom
                </Text>
              </div>
            )
          }}
          className={styles.imageElement}
          style={{
            transform: `rotate(${image.rotation || 0}deg)`
          }}
          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EError%3C/text%3E%3C/svg%3E"
        />
      </div>
    );
  };

  const actions = [
    <Tooltip title="Preview">
      <EyeOutlined onClick={onPreview} />
    </Tooltip>,
    
    showAdvancedControls && (
      <Tooltip title="Rotate Left">
        <RotateLeftOutlined onClick={() => handleRotate(-90)} />
      </Tooltip>
    ),
    
    showAdvancedControls && (
      <Tooltip title="Rotate Right">
        <RotateRightOutlined onClick={() => handleRotate(90)} />
      </Tooltip>
    ),
    
    onEdit && (
      <Tooltip title="Draw/Annotate">
        <EditOutlined onClick={onEdit} />
      </Tooltip>
    ),
    
    showAdvancedControls && (
      <Tooltip title="Duplicate">
        <CopyOutlined onClick={handleCopy} />
      </Tooltip>
    ),
    
    showAdvancedControls && (
      <Tooltip title="Download">
        <DownloadOutlined onClick={handleDownload} />
      </Tooltip>
    ),
    
    showMetadata && (
      <Tooltip title={showExif ? "Hide Info" : "Show Info"}>
        <InfoCircleOutlined onClick={() => setShowExif(!showExif)} />
      </Tooltip>
    ),
    
    <Tooltip title="Delete">
      <Popconfirm
        title="Delete this image?"
        description="This action cannot be undone."
        onConfirm={onRemove}
      >
        <DeleteOutlined style={{ color: '#ff4d4f' }} />
      </Popconfirm>
    </Tooltip>
  ].filter(Boolean);

  return (
    <Card
      hoverable
      loading={loading}
      cover={renderImagePreview()}
      actions={actions}
      className={`${styles.imageCard} ${image.selected ? styles.imageCardSelected : ''}`}
    >
      <Card.Meta
        title={
          <div className={styles.cardTitle}>
            <Tooltip title={image.name}>
              <Text ellipsis className={styles.cardTitleText}>
                {image.name}
              </Text>
            </Tooltip>
          </div>
        }
        description={
          <Space direction="vertical" size={8} className={styles.cardDescription}>
            {/* Caption - Larger, more prominent */}
            <div className={styles.captionContainer}>
              {editingCaption ? (
                <Input.TextArea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onBlur={handleSaveCaption}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleSaveCaption();
                  }}
                  placeholder="Add caption or description..."
                  autoSize={{ minRows: 3, maxRows: 5 }}
                  className={styles.captionInput}
                  autoFocus
                />
              ) : (
                <Paragraph
                  ellipsis={{ rows: 3, expandable: true }}
                  className={styles.captionText}
                  onClick={() => setEditingCaption(true)}
                >
                  {image.caption || (
                    <Text type="secondary" className={styles.captionPlaceholder}>
                      Click to add caption or description...
                    </Text>
                  )}
                </Paragraph>
              )}
            </div>

            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {image.tags.map(tag => (
                  <Tag key={tag} color="blue" className={styles.tag}>
                    {tag}
                  </Tag>
                ))}
              </div>
            )}

            {/* Status Tags */}
            <div className={styles.statusTags}>
              {image.metadata?.size && (
                <Tag className={styles.statusTag}>
                  {(image.metadata.size / 1024 / 1024).toFixed(2)} MB
                </Tag>
              )}
              
              {image.metadata?.width && image.metadata?.height && (
                <Tag className={styles.statusTag}>
                  {image.metadata.width} × {image.metadata.height}
                </Tag>
              )}
              
              {image.deduplicated && (
                <Tag color="green" className={styles.statusTag}>
                  Deduplicated
                </Tag>
              )}
              
              {image.hasModifications && (
                <Tag color="orange" className={styles.statusTag}>
                  Modified
                </Tag>
              )}
              
              {image.drawingData && (
                <Tag color="blue" className={styles.statusTag}>
                  Annotated
                </Tag>
              )}
              
              {image.metadata?.referenceCount && image.metadata.referenceCount > 1 && (
                <Tag color="purple" className={styles.statusTag}>
                  {image.metadata.referenceCount} refs
                </Tag>
              )}
              
              {image.rotation && image.rotation !== 0 && (
                <Tag color="cyan" className={styles.statusTag}>
                  Rotated {image.rotation}°
                </Tag>
              )}
            </div>

            {/* EXIF Data (expandable) - Only shown when toggled */}
            {showExif && image.metadata && (
              <div className={styles.metadataInfo}>
                <div className={styles.metadataTitle}>Image Information</div>
                {image.metadata.type && (
                  <div className={styles.metadataRow}>
                    <Text>Type: {image.metadata.type}</Text>
                  </div>
                )}
                {image.metadata.size && (
                  <div className={styles.metadataRow}>
                    <Text>File Size: {(image.metadata.size / 1024).toFixed(2)} KB</Text>
                  </div>
                )}
                {image.metadata.width && image.metadata.height && (
                  <div className={styles.metadataRow}>
                    <Text>Dimensions: {image.metadata.width} × {image.metadata.height} px</Text>
                  </div>
                )}
                {image.exif && Object.entries(image.exif).slice(0, 5).map(([key, value]) => (
                  <div key={key} className={styles.metadataRow}>
                    <Text>{key}: {String(value)}</Text>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Error */}
            {image.uploadError && (
              <Text type="danger" className={styles.errorText}>
                {image.uploadError}
              </Text>
            )}
          </Space>
        }
      />
    </Card>
  );
};

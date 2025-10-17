/**
 * Document Upload Widget - Generic document upload with metadata
 * 
 * A reusable document upload widget that provides file upload with categories,
 * descriptions, and metadata similar to InspectionFindingsWidget but for general documents.
 */

import React, { useState, useCallback } from 'react';
import { Upload, Typography, Space, Button, Card, Input, Select, Tag, Modal, message, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd/es/upload';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

export interface DocumentUpload {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  files: UploadFile[];
  uploadDate: string;
  uploadedBy: string;
  metadata?: Record<string, any>;
}

export interface DocumentUploadWidgetProps {
  id: string;
  label?: string;
  value?: DocumentUpload[];
  onChange?: (value: DocumentUpload[]) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  
  // Upload options
  maxUploads?: number;
  maxFilesPerUpload?: number;
  maxFileSize?: number; // in bytes
  accept?: string;
  
  // Category options
  categoryOptions?: Array<{ label: string; value: string; color?: string }>;
  defaultCategories?: string[];
  
  // Tag options
  tagOptions?: Array<{ label: string; value: string; color?: string }>;
  allowCustomTags?: boolean;
  
  // UI options
  showMetadata?: boolean;
  showTags?: boolean;
  layout?: 'card' | 'list';
  
  // Upload configuration
  action?: string;
  headers?: Record<string, string>;
  data?: Record<string, any>;
  name?: string;
  withCredentials?: boolean;
  
  // Customization
  addUploadText?: string;
  theme?: 'light' | 'dark';
}

export const DocumentUploadWidget: React.FC<DocumentUploadWidgetProps> = ({
  id,
  label,
  value = [],
  onChange,
  disabled = false,
  required = false,
  className = '',
  style,
  
  // Upload options
  maxUploads = 10,
  maxFilesPerUpload = 5,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip,.rar',
  
  // Category options
  categoryOptions = [
    { label: 'Technical Documentation', value: 'technical', color: 'blue' },
    { label: 'Previous Reports', value: 'previous-reports', color: 'green' },
    { label: 'Manufacturer Data', value: 'manufacturer-data', color: 'orange' },
    { label: 'Maintenance Records', value: 'maintenance-records', color: 'purple' },
    { label: 'Safety Documentation', value: 'safety-docs', color: 'red' },
    { label: 'Certificates', value: 'certificates', color: 'cyan' },
    { label: 'Procedures', value: 'procedures', color: 'magenta' },
    { label: 'Other', value: 'other', color: 'default' }
  ],
  defaultCategories = [],
  
  // Tag options
  tagOptions = [
    { label: 'Important', value: 'important', color: 'red' },
    { label: 'Reference', value: 'reference', color: 'blue' },
    { label: 'Historical', value: 'historical', color: 'green' },
    { label: 'Current', value: 'current', color: 'orange' },
    { label: 'Required', value: 'required', color: 'purple' },
    { label: 'Optional', value: 'optional', color: 'default' }
  ],
  allowCustomTags = true,
  
  // UI options
  showMetadata = false,
  showTags = true,
  layout = 'card',
  
  // Upload configuration
  action,
  headers,
  data,
  name = 'file',
  withCredentials = false,
  
  // Customization
  addUploadText = 'Add Document Upload',
  theme = 'light'
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUpload, setEditingUpload] = useState<DocumentUpload | null>(null);
  const [currentFiles, setCurrentFiles] = useState<UploadFile[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const handleAddUpload = useCallback(() => {
    setEditingUpload(null);
    setCurrentFiles([]);
    setCurrentTitle('');
    setCurrentDescription('');
    setCurrentCategory(defaultCategories[0] || '');
    setCurrentTags([]);
    setCustomTag('');
    setIsModalVisible(true);
  }, [defaultCategories]);

  const handleEditUpload = useCallback((upload: DocumentUpload) => {
    setEditingUpload(upload);
    setCurrentFiles(upload.files);
    setCurrentTitle(upload.title);
    setCurrentDescription(upload.description);
    setCurrentCategory(upload.category);
    setCurrentTags(upload.tags);
    setCustomTag('');
    setIsModalVisible(true);
  }, []);

  const handleDeleteUpload = useCallback((uploadId: string) => {
    const newValue = value.filter(upload => upload.id !== uploadId);
    onChange?.(newValue);
    message.success('Document upload deleted');
  }, [value, onChange]);

  const handleSaveUpload = useCallback(() => {
    if (!currentTitle.trim()) {
      message.error('Please enter a title');
      return;
    }
    
    if (!currentCategory) {
      message.error('Please select a category');
      return;
    }
    
    if (currentFiles.length === 0) {
      message.error('Please upload at least one file');
      return;
    }

    const uploadData: DocumentUpload = {
      id: editingUpload?.id || `upload-${Date.now()}`,
      title: currentTitle.trim(),
      description: currentDescription.trim(),
      category: currentCategory,
      tags: currentTags,
      files: currentFiles,
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Current User', // This could be passed as a prop
      metadata: showMetadata ? {} : undefined
    };

    let newValue: DocumentUpload[];
    if (editingUpload) {
      newValue = value.map(upload => 
        upload.id === editingUpload.id ? uploadData : upload
      );
      message.success('Document upload updated');
    } else {
      newValue = [...value, uploadData];
      message.success('Document upload added');
    }

    onChange?.(newValue);
    setIsModalVisible(false);
  }, [
    currentTitle, currentDescription, currentCategory, currentTags, currentFiles,
    editingUpload, value, onChange, showMetadata
  ]);

  const handleCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleFileChange: UploadProps['onChange'] = useCallback((info: any) => {
    setCurrentFiles(info.fileList);
  }, []);

  const handleAddTag = useCallback(() => {
    if (customTag.trim() && !currentTags.includes(customTag.trim())) {
      setCurrentTags([...currentTags, customTag.trim()]);
      setCustomTag('');
    }
  }, [customTag, currentTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setCurrentTags(currentTags.filter(t => t !== tag));
  }, [currentTags]);

  const getCategoryColor = useCallback((category: string) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption?.color || 'default';
  }, [categoryOptions]);

  const getTagColor = useCallback((tag: string) => {
    const tagOption = tagOptions.find(opt => opt.value === tag);
    return tagOption?.color || 'default';
  }, [tagOptions]);

  const renderUploadCard = useCallback((upload: DocumentUpload) => (
    <Card
      key={upload.id}
      size="small"
      style={{ marginBottom: 8 }}
      actions={[
        <EditOutlined key="edit" onClick={() => handleEditUpload(upload)} />,
        <DeleteOutlined key="delete" onClick={() => handleDeleteUpload(upload.id)} />
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
            {upload.title}
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {upload.description}
          </Text>
          
          <div style={{ marginTop: 8 }}>
            <Tag color={getCategoryColor(upload.category)}>
              {categoryOptions.find(opt => opt.value === upload.category)?.label || upload.category}
            </Tag>
            
            {showTags && upload.tags.map(tag => (
              <Tag
                key={tag}
                color={getTagColor(tag)}
                closable
                onClose={() => handleRemoveTag(tag)}
                style={{ marginTop: 4 }}
              >
                {tag}
              </Tag>
            ))}
          </div>
          
          {/* File Thumbnails */}
          {upload.files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                Files ({upload.files.length}):
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {upload.files.map((file, index) => {
                  const isImage = file.type?.startsWith('image/') || 
                                 file.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
                  
                  return (
                    <div key={file.uid || index} style={{ position: 'relative' }}>
                      {isImage && file.thumbUrl ? (
                        <img
                          src={file.thumbUrl}
                          alt={file.name}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid #d9d9d9'
                          }}
                        />
                      ) : isImage && file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid #d9d9d9'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #d9d9d9',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FileTextOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const newFiles = upload.files.filter((_, i) => i !== index);
                          const updatedUpload = { ...upload, files: newFiles };
                          const newValue = value.map(u => 
                            u.id === upload.id ? updatedUpload : u
                          );
                          onChange?.(newValue);
                        }}
                      >
                        ×
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {upload.files.length} file(s) • {new Date(upload.uploadDate).toLocaleDateString()}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  ), [categoryOptions, showTags, getCategoryColor, getTagColor, handleEditUpload, handleDeleteUpload, handleRemoveTag, value, onChange]);

  return (
    <div className={`document-upload-widget ${className}`} style={style}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Label */}
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: '#ff4d4f' }}>*</span>}
          </Text>
        )}

        {/* Uploads List */}
        {value.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {value.map(renderUploadCard)}
          </div>
        )}

        {/* Add Upload Button */}
        {value.length < maxUploads && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddUpload}
            disabled={disabled}
            style={{ width: '100%' }}
          >
            {addUploadText}
          </Button>
        )}

        {/* Upload Count */}
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {value.length} of {maxUploads} uploads
        </Text>
      </Space>

      {/* Upload Modal */}
      <Modal
        title={editingUpload ? 'Edit Document Upload' : 'Add Document Upload'}
        open={isModalVisible}
        onOk={handleSaveUpload}
        onCancel={handleCancel}
        width={600}
        okText="Save"
        cancelText="Cancel"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Title */}
          <div>
            <Text strong>Title *</Text>
            <Input
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="Enter document title"
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Description */}
          <div>
            <Text strong>Description</Text>
            <TextArea
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              placeholder="Enter document description"
              rows={3}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Category */}
          <div>
            <Text strong>Category *</Text>
            <Select
              value={currentCategory}
              onChange={setCurrentCategory}
              placeholder="Select category"
              style={{ width: '100%', marginTop: 4 }}
              options={categoryOptions}
            />
          </div>

          {/* Tags */}
          {showTags && (
            <div>
              <Text strong>Tags</Text>
              <div style={{ marginTop: 4 }}>
                {currentTags.map(tag => (
                  <Tag
                    key={tag}
                    color={getTagColor(tag)}
                    closable
                    onClose={() => handleRemoveTag(tag)}
                    style={{ marginBottom: 4 }}
                  >
                    {tag}
                  </Tag>
                ))}
                
                <Select
                  placeholder="Add tag"
                  style={{ width: 120, marginRight: 8 }}
                  options={tagOptions.filter(opt => !currentTags.includes(opt.value))}
                  onChange={(value) => {
                    if (value && !currentTags.includes(value)) {
                      setCurrentTags([...currentTags, value]);
                    }
                  }}
                />
                
                {allowCustomTags && (
                  <Input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Custom tag"
                    style={{ width: 120, marginRight: 8 }}
                    onPressEnter={handleAddTag}
                  />
                )}
              </div>
            </div>
          )}

          <Divider />

          {/* File Upload */}
          <div>
            <Text strong>Files *</Text>
            <Dragger
              fileList={currentFiles}
              onChange={handleFileChange}
              accept={accept}
              multiple
              maxCount={maxFilesPerUpload}
              disabled={disabled}
              style={{ marginTop: 4 }}
              listType="picture-card"
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
                showDownloadIcon: false
              }}
            >
              <div>
                <FileTextOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Dragger>
            
            {/* File Preview */}
            {currentFiles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                  Preview ({currentFiles.length} files):
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {currentFiles.map((file, index) => {
                    const isImage = file.type?.startsWith('image/') || 
                                   file.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
                    
                    return (
                      <div key={file.uid || index} style={{ position: 'relative' }}>
                        {isImage && file.thumbUrl ? (
                          <img
                            src={file.thumbUrl}
                            alt={file.name}
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid #d9d9d9'
                            }}
                          />
                        ) : isImage && file.url ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid #d9d9d9'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 80,
                              height: 80,
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #d9d9d9',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column'
                            }}
                          >
                            <FileTextOutlined style={{ fontSize: 24, color: '#8c8c8c', marginBottom: 4 }} />
                            <Text style={{ fontSize: '10px', color: '#8c8c8c', textAlign: 'center' }}>
                              {file.name?.split('.').pop()?.toUpperCase() || 'FILE'}
                            </Text>
                          </div>
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: '#ff4d4f',
                            color: 'white',
                            borderRadius: '50%',
                            width: 18,
                            height: 18,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            const newFiles = currentFiles.filter((_, i) => i !== index);
                            setCurrentFiles(newFiles);
                          }}
                        >
                          ×
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            {file.name?.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default DocumentUploadWidget; 

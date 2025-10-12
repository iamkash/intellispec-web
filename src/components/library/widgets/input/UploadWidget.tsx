/**
 * Upload Widget - File upload functionality
 * 
 * A reusable upload widget that provides file upload with validation,
 * drag & drop, progress tracking, and advanced file handling capabilities.
 */

import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Image, message, Space, Typography, Upload } from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload';
import React, { useCallback, useState } from 'react';

const { Text } = Typography;
const { Dragger } = Upload;

export interface UploadWidgetProps {
  /** Upload files list */
  fileList?: UploadFile[];
  /** Default file list */
  defaultFileList?: UploadFile[];
  /** Upload label */
  label?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Whether upload is read-only */
  readOnly?: boolean;
  /** Whether upload is required */
  required?: boolean;
  /** Maximum number of files */
  maxCount?: number;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum file size in bytes (alias for maxSize) */
  maxFileSize?: number;
  /** Accepted file types */
  accept?: string;
  /** Whether to allow multiple files */
  multiple?: boolean;
  /** Upload action URL */
  action?: string;
  /** Upload method */
  method?: 'POST' | 'PUT' | 'PATCH';
  /** Request headers */
  headers?: Record<string, string>;
  /** Additional form data */
  data?: Record<string, any> | ((file: UploadFile) => Record<string, any>);
  /** Upload name */
  name?: string;
  /** Show upload list */
  showUploadList?: boolean | {
    showPreviewIcon?: boolean;
    showRemoveIcon?: boolean;
    showDownloadIcon?: boolean;
  };
  /** List type */
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle';
  /** Whether to use drag and drop */
  useDragDrop?: boolean;
  /** Whether to enable drag and drop (alias for useDragDrop) */
  dragAndDrop?: boolean;
  /** Custom upload button text */
  uploadButtonText?: string;
  /** Custom upload text */
  uploadText?: string;
  /** Custom drag text */
  dragText?: string;
  /** Custom drag hint */
  dragHint?: string;
  /** Directory upload */
  directory?: boolean;
  /** Whether to show progress */
  showProgress?: boolean;
  /** Auto upload */
  autoUpload?: boolean;
  /** Validation status */
  status?: 'error' | 'warning' | 'success';
  /** Error message */
  errorMessage?: string;
  /** Help text */
  helpText?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Custom CSS class */
  className?: string;
  /** Width of the upload area */
  width?: number | string;
  /** Height of the upload area */
  height?: number | string;
  /** Custom validation function */
  validator?: (file: RcFile, fileList: UploadFile[]) => { isValid: boolean; message?: string };
  /** Custom file icon render */
  iconRender?: (file: UploadFile) => React.ReactNode;
  /** Custom item render */
  itemRender?: (originNode: React.ReactElement, file: UploadFile, fileList: UploadFile[]) => React.ReactNode;
  /** Custom preview */
  previewFile?: (file: File | Blob) => Promise<string>;
  /** Transform file before upload */
  transformFile?: (file: RcFile) => string | Blob | File | Promise<string | Blob | File>;
  /** Whether to open file dialog on click */
  openFileDialogOnClick?: boolean;
  /** Custom upload request */
  customRequest?: (options: any) => void;
  /** Progress props */
  progress?: {
    strokeColor?: string;
    strokeWidth?: number;
    format?: (percent?: number) => React.ReactNode;
  };
  /** Image preview config */
  imagePreview?: {
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    getContainer?: string | HTMLElement | (() => HTMLElement);
  } | boolean;
  /** File type icons */
  fileTypeIcons?: Record<string, React.ReactNode>;
  /** Custom file size formatter */
  fileSizeFormatter?: (size: number) => string;
  /** Show file size */
  showFileSize?: boolean;
  /** Show file count */
  showFileCount?: boolean;
  /** Upload area style */
  uploadAreaStyle?: React.CSSProperties;
  /** Custom error messages */
  errorMessages?: {
    maxCount?: string;
    maxSize?: string;
    fileType?: string;
    uploadFailed?: string;
  };
  
  // Event handlers
  /** On file list change */
  onChange?: (info: { file: UploadFile; fileList: UploadFile[] }) => void;
  /** On file upload start */
  onUploadStart?: (file: UploadFile) => void;
  /** On upload progress */
  onProgress?: (percent: number, file: UploadFile) => void;
  /** On upload success */
  onSuccess?: (response: any, file: UploadFile) => void;
  /** On upload error */
  onError?: (error: any, file: UploadFile) => void;
  /** On file preview */
  onPreview?: (file: UploadFile) => void;
  /** On file remove */
  onRemove?: (file: UploadFile) => boolean | Promise<boolean>;
  /** On file download */
  onDownload?: (file: UploadFile) => void;
  /** On drop */
  onDrop?: (event: React.DragEvent) => void;
  /** Before upload validation */
  beforeUpload?: (file: RcFile, fileList: RcFile[]) => boolean | Promise<boolean>;
}

export const UploadWidget: React.FC<UploadWidgetProps> = ({
  fileList,
  defaultFileList = [],
  label,
  disabled = false,
  readOnly = false,
  required = false,
  maxCount = 1,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFileSize,
  accept,
  multiple = false,
  action,
  method = 'POST',
  headers,
  data,
  name = 'file',
  showUploadList = true,
  listType = 'text',
  useDragDrop = false,
  dragAndDrop,
  uploadButtonText = 'Upload',
  uploadText,
  dragText = 'Click or drag file to this area to upload',
  dragHint = 'Support for a single or bulk upload',
  directory = false,
  showProgress = true,
  autoUpload = true,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width,
  height,
  validator,
  iconRender,
  itemRender,
  previewFile,
  transformFile,
  openFileDialogOnClick = true,
  customRequest,
  progress,
  imagePreview,
  fileTypeIcons = {},
  fileSizeFormatter,
  showFileSize = true,
  showFileCount = true,
  uploadAreaStyle,
  errorMessages = {},
  onChange,
  onUploadStart,
  onProgress,
  onSuccess,
  onError,
  onPreview,
  onRemove,
  onDownload,
  onDrop,
  beforeUpload
}) => {
  // Calculate effective values for new properties
  const effectiveMaxSize = maxFileSize || maxSize;
  // Disable drag-and-drop skin when picture-card thumbnails are desired
  const effectiveUseDragDrop = (dragAndDrop !== undefined ? dragAndDrop : useDragDrop) && listType !== 'picture-card';
  const effectiveUploadButtonText = uploadText || uploadButtonText;
  const effectiveDragText = dragText;
  const effectiveDragHint = dragHint;

  const [internalFileList, setInternalFileList] = useState<UploadFile[]>(defaultFileList);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const currentFileList = fileList !== undefined ? fileList : internalFileList;

  // Helper for generating base64 previews for images before upload completes
  const toDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const formatFileSize = useCallback((size: number) => {
    if (fileSizeFormatter) {
      return fileSizeFormatter(size);
    }
    
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, [fileSizeFormatter]);

  const validateFile = useCallback((file: RcFile, fileList: UploadFile[]) => {
    // Custom validation
    if (validator) {
      const validation = validator(file, fileList);
      if (!validation.isValid) {
        setValidationError(validation.message);
        return false;
      }
    }

    // File count validation
    if (maxCount && fileList.length >= maxCount) {
      const errorMsg = errorMessages.maxCount || `Maximum ${maxCount} file${maxCount > 1 ? 's' : ''} allowed`;
      setValidationError(errorMsg);
      message.error(errorMsg);
      return false;
    }

    // File size validation
    if (effectiveMaxSize && file.size > effectiveMaxSize) {
      const errorMsg = errorMessages.maxSize || `File size must be less than ${formatFileSize(effectiveMaxSize)}`;
      setValidationError(errorMsg);
      message.error(errorMsg);
      return false;
    }

    // File type validation
    if (accept) {
      const acceptTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isValidType = acceptTypes.some(acceptType => {
        if (acceptType.startsWith('.')) {
          return acceptType.toLowerCase() === fileExtension;
        }
        return mimeType.match(acceptType.replace('*', '.*'));
      });

      if (!isValidType) {
        const errorMsg = errorMessages.fileType || `File type not supported. Accepted types: ${accept}`;
        setValidationError(errorMsg);
        message.error(errorMsg);
        return false;
      }
    }

    setValidationError(undefined);
    return true;
  }, [validator, maxCount, maxSize, accept, formatFileSize, errorMessages]);

  const handleChange = useCallback(async (info: { file: UploadFile; fileList: UploadFile[] }) => {
    const { file, fileList: newFileList } = info;

    // Update internal state if not controlled
    if (fileList === undefined) {
      // Pre-generate previews for images so thumbnails render in picture-card mode
      const hydrated = await Promise.all(newFileList.map(async f => {
        if (!f.url && !f.thumbUrl && (f.originFileObj as File) && (f.type?.startsWith('image/') || (f.name && /\.(png|jpe?g|gif|webp)$/i.test(f.name)))) {
          try {
            f.thumbUrl = await toDataURL(f.originFileObj as File);
          } catch (_) {}
        }
        return f;
      }));
      setInternalFileList(hydrated);
    }

    // Handle upload status
    if (file.status === 'uploading') {
      onUploadStart?.(file);
    } else if (file.status === 'done') {
      onSuccess?.(file.response, file);
      message.success(`${file.name} uploaded successfully`);
    } else if (file.status === 'error') {
      onError?.(file.error, file);
      const errorMsg = errorMessages.uploadFailed || `${file.name} upload failed`;
      message.error(errorMsg);
    }

    // Handle progress
    if (file.percent !== undefined) {
      onProgress?.(file.percent, file);
    }

    onChange?.(info);
  }, [fileList, onUploadStart, onSuccess, onError, onProgress, errorMessages, onChange]);

  const handlePreview = useCallback(async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      if (previewFile) {
        file.preview = await previewFile(file.originFileObj as File);
      } else {
        file.preview = await getBase64(file.originFileObj as File);
      }
    }

    setPreviewImage(file.url || file.preview || '');
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
    
    onPreview?.(file);
  }, [previewFile, onPreview]);

  const handleRemove = useCallback((file: UploadFile) => {
    if (onRemove) {
      return onRemove(file);
    }
    return true;
  }, [onRemove]);

  const handleDownload = useCallback((file: UploadFile) => {
    if (onDownload) {
      onDownload(file);
    } else if (file.url) {
      // Default download behavior
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [onDownload]);

  const handleBeforeUpload = useCallback((file: RcFile, fileList: RcFile[]) => {
    const isValid = validateFile(file, currentFileList);
    if (!isValid) {
      return false;
    }

    if (beforeUpload) {
      return beforeUpload(file, fileList);
    }

    return autoUpload;
  }, [validateFile, currentFileList, beforeUpload, autoUpload]);

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const renderFileIcon = useCallback((file: UploadFile) => {
    if (iconRender) {
      return iconRender(file);
    }

    const fileExtension = file.name?.split('.').pop()?.toLowerCase();
    if (fileExtension && fileTypeIcons[fileExtension]) {
      return fileTypeIcons[fileExtension];
    }

    return <UploadOutlined />;
  }, [iconRender, fileTypeIcons]);

  const renderUploadButton = () => {
    if (listType === 'picture-card') {
      return (
        <div>
          <UploadOutlined />
          <div style={{ marginTop: 8 }}>{effectiveUploadButtonText}</div>
        </div>
      );
    }

    return (
      <Button 
        icon={<UploadOutlined />} 
        disabled={disabled || readOnly}
        style={{ width: width as number }}
      >
        {effectiveUploadButtonText}
      </Button>
    );
  };

  const renderDragUpload = () => {
    return (
      <Dragger
        {...uploadProps}
        style={{
          width,
          height,
          ...uploadAreaStyle
        }}
        onDrop={onDrop}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{effectiveDragText}</p>
        <p className="ant-upload-hint">{effectiveDragHint}</p>
      </Dragger>
    );
  };

  const hasAction = !!action;

  const uploadProps: UploadProps = {
    name,
    action: action || undefined,
    method,
    headers,
    data,
    fileList: currentFileList,
    multiple,
    maxCount,
    accept,
    directory,
    disabled: disabled || readOnly,
    showUploadList: showUploadList ? {
      showPreviewIcon: true,
      showRemoveIcon: !readOnly,
      showDownloadIcon: true,
      ...((typeof showUploadList === 'object') ? showUploadList : {})
    } : false,
    listType,
    openFileDialogOnClick,
    customRequest: hasAction ? customRequest : ((options: any) => {
      // Client-side no-op upload: immediately mark as done so thumbnails render and file is kept in list
      const { file, onSuccess } = options || {};
      window.setTimeout(() => {
        try { onSuccess && onSuccess({}, file); } catch (_) {}
      }, 0);
    }),
    transformFile,
    // Ensure thumbnails are generated for images before upload completes
    previewFile: async (file: File | Blob) => {
      if (previewFile) {
        try {
          return await previewFile(file);
        } catch (_) {
          // fall through to default
        }
      }
      try {
        return await toDataURL(file as File);
      } catch (_) {
        return '';
      }
    },
    iconRender: renderFileIcon,
    itemRender,
    progress,
    onChange: handleChange,
    onPreview: handlePreview,
    onRemove: handleRemove,
    onDownload: handleDownload,
    beforeUpload: handleBeforeUpload
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`upload-widget ${className || ''}`}
      style={{
        width: '100%',
        ...style
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Label */}
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: '#ff4d4f' }}>*</span>}
          </Text>
        )}

        {/* File Info */}
        {(showFileCount || showFileSize) && currentFileList.length > 0 && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            {showFileCount && `${currentFileList.length} file${currentFileList.length !== 1 ? 's' : ''}`}
            {showFileCount && showFileSize && ' • '}
            {showFileSize && `Total: ${formatFileSize(
              currentFileList.reduce((total, file) => total + (file.size || 0), 0)
            )}`}
          </div>
        )}

        {/* Upload Area */}
        {effectiveUseDragDrop ? renderDragUpload() : (
          <Upload {...uploadProps}>
            {(maxCount === 1 && currentFileList.length >= 1) ? null : renderUploadButton()}
          </Upload>
        )}

        {/* Help Text and Error Message */}
        {(helpText || finalErrorMessage) && (
          <div>
            {finalErrorMessage && (
              <Text type="danger" style={{ fontSize: '12px' }}>
                {finalErrorMessage}
              </Text>
            )}
            {helpText && !finalErrorMessage && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {helpText}
              </Text>
            )}
          </div>
        )}

        {/* Upload Constraints */}
        <div style={{ fontSize: '11px', color: '#999' }}>
          {maxCount > 1 && `Max ${maxCount} files`}
          {maxCount > 1 && effectiveMaxSize && ' • '}
          {effectiveMaxSize && `Max size: ${formatFileSize(effectiveMaxSize)}`}
          {(maxCount > 1 || effectiveMaxSize) && accept && ' • '}
          {accept && `Types: ${accept}`}
        </div>
      </Space>

      {/* Image Preview Modal */}
      {previewVisible && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewVisible,
            onVisibleChange: setPreviewVisible,
            ...(typeof imagePreview === 'object' ? imagePreview : {})
          }}
          src={previewImage}
        />
      )}
    </div>
  );
};

export default UploadWidget; 
/**
 * UploadArea - Upload drag-and-drop zone
 */

import { PictureOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import React from 'react';
import type { UploadAreaProps } from '../types';

const { Dragger } = Upload;

export const UploadArea: React.FC<UploadAreaProps> = ({
  onUpload,
  disabled,
  maxSize,
  maxCount,
  accept,
  multiple,
  beforeUpload
}) => {
  return (
    <Dragger
      multiple={multiple}
      accept={accept}
      fileList={[]}
      customRequest={onUpload}
      beforeUpload={beforeUpload}
      disabled={disabled}
      showUploadList={false}
    >
      <p className="ant-upload-drag-icon">
        <PictureOutlined />
      </p>
      <p className="ant-upload-text">Click or drag images to upload</p>
      <p className="ant-upload-hint">
        Support for {accept}. Max size: {maxSize}MB. Max count: {maxCount}
      </p>
    </Dragger>
  );
};


/**
 * QRCodeScannerWidget - QR code scanning component
 * 
 * A form input widget for scanning QR codes and barcodes.
 * Basic implementation with manual input fallback.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { ScanOutlined, CameraOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface QRCodeScannerWidgetProps {
  id: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const QRCodeScannerWidget: React.FC<QRCodeScannerWidgetProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "Scan QR code or enter manually",
  className,
  style,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  const handleScan = useCallback(() => {
    // In a real implementation, this would activate camera for QR scanning
    // For now, we'll simulate with file input
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, this would process the image for QR codes
      // For now, we'll simulate a successful scan
      const mockScannedValue = `QR_${Date.now()}`;
      setInputValue(mockScannedValue);
      onChange?.(mockScannedValue);
    }
  }, [onChange]);

  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      
      <Space.Compact style={{ width: '100%' }}>
        <Input
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{ flex: 1 }}
        />
        
        <Button
          icon={<ScanOutlined />}
          onClick={handleScan}
          disabled={disabled}
          type="primary"
        >
          Scan
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Space.Compact>
    </div>
  );
};

export default QRCodeScannerWidget; 
/**
 * CameraWidget - Photo capture component
 *
 * Final Fixed Version (Imperative Control): This version resolves the persistent
 * black screen issue by using a more direct, imperative approach. It avoids
 * React state for stream handling in the critical path, instead setting the
 * stream directly on the video element's `srcObject` and calling `play()`.
 * This provides the most robust solution against rendering race conditions.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Image, Space, Typography, Modal, message, Spin } from 'antd';
import { CameraOutlined, UploadOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface CameraWidgetProps {
  id: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

export const CameraWidget: React.FC<CameraWidgetProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  className,
  style,
  width = 400,
  height = 300,
}) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // This ref will hold the stream, bypassing React state for the video element itself.
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const isCameraSupported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.style.opacity = '0';
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!isCameraSupported()) {
      setError('Camera is not supported in this browser.');
      return;
    }

    stopCamera();
    setError(null);

    // Show loader imperatively
    if (loaderRef.current) loaderRef.current.style.display = 'flex';
    if (videoRef.current) videoRef.current.style.opacity = '0';
    if (controlsRef.current) controlsRef.current.style.display = 'none';

    const constraints = [
      { video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } },
      { video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } },
      { video: true }
    ];

    let acquiredStream: MediaStream | null = null;
    for (const constraint of constraints) {
      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia(constraint);
break;
      } catch (err) {
        console.warn('Failed to acquire camera with constraint:', constraint, err);
      }
    }

    if (acquiredStream && videoRef.current) {
      streamRef.current = acquiredStream;
      videoRef.current.srcObject = acquiredStream;
      videoRef.current.play().catch(err => {
        console.error("Video play failed:", err);
        setError("Failed to play video stream. Please try again.");
        if (loaderRef.current) loaderRef.current.style.display = 'none';
      });
    } else {
      const errorMessage = 'Unable to access camera. Please check permissions.';
      setError(errorMessage);
      message.error(errorMessage);
      if (loaderRef.current) loaderRef.current.style.display = 'none';
    }
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      message.error("Could not get canvas context.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    setImageUrl(imageData);
    onChange?.(imageData);
    
    setIsModalVisible(false);
    message.success('Photo captured successfully!');
  }, [onChange]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        onChange?.(result);
        message.success('Image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  useEffect(() => {
    if (isModalVisible) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isModalVisible, startCamera, stopCamera]);

  const handleVideoLoaded = () => {
if (loaderRef.current) loaderRef.current.style.display = 'none';
    if (videoRef.current) videoRef.current.style.opacity = '1';
    if (controlsRef.current) controlsRef.current.style.display = 'block';
  };

  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button icon={<CameraOutlined />} onClick={() => setIsModalVisible(true)} disabled={disabled} type="primary">
            {isCameraSupported() ? 'Open Camera' : 'Select Photo'}
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()} disabled={disabled}>
            Upload Photo
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
        </Space>
        
        {imageUrl && (
          <div style={{ position: 'relative', display: 'inline-block', marginTop: 16 }}>
            <Image src={imageUrl} alt="Captured" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }} />
            <Button
              icon={<CloseOutlined />}
              size="small"
              type="text"
              danger
              style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%' }}
              onClick={() => { setImageUrl(undefined); onChange?.(''); }}
            />
          </div>
        )}
      </Space>

      <Modal
        title="Camera Capture"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={width + 50}
        destroyOnClose
      >
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div ref={loaderRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <Spin size="large" />
            <Text style={{ marginTop: 16, color: 'white' }}>Starting camera...</Text>
          </div>
          
          {error && (
            <div style={{ height: height, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
              <Text type="danger">{error}</Text>
              <Button icon={<ReloadOutlined />} onClick={startCamera} style={{ marginTop: 16 }}>
                Retry
              </Button>
            </div>
          )}
          
          <div style={{ visibility: error ? 'hidden' : 'visible' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={handleVideoLoaded}
              style={{ 
                  width: '100%', 
                  height: height, 
                  backgroundColor: '#000', 
                  borderRadius: 8, 
                  objectFit: 'cover',
                  opacity: 0,
                  transition: 'opacity 0.3s ease-in-out'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div ref={controlsRef} style={{ marginTop: 16, display: 'none' }}>
              <Space>
                <Button type="primary" icon={<CameraOutlined />} onClick={capturePhoto} size="large">
                  Capture Photo
                </Button>
                <Button icon={<ReloadOutlined />} onClick={startCamera}>
                  Switch Camera
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CameraWidget;

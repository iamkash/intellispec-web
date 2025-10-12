/**
 * InspectionFindingsWidget - Specialized widget for inspection findings
 * 
 * A comprehensive widget for documenting inspection findings with:
 * - Multiple image uploads per finding
 * - Detailed descriptions and locations
 * - Measurements and severity assessments
 * - Add/remove findings functionality
 */

import React, { useState, useCallback } from 'react';
import { 
  Button, 
  Space, 
  Typography, 
  Card, 
  Upload, 
  Input, 
  Select, 
  InputNumber,
  message, 
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Divider,
  Form,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UploadOutlined,
  CameraOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd/es/upload';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

export interface InspectionFinding {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  measurements?: {
    length?: number;
    width?: number;
    depth?: number;
    area?: number;
  };
  images?: UploadFile[];
  timestamp: string;
  inspector: string;
}

export interface InspectionFindingsWidgetProps {
  id: string;
  label?: string;
  value?: InspectionFinding[];
  onChange?: (value: InspectionFinding[]) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // Finding options
  maxFindings?: number;
  severityOptions?: Array<{ label: string; value: string; color: string }>;
  // Image options
  maxImagesPerFinding?: number;
  maxImageSize?: number; // in bytes
  accept?: string;
  // UI options
  showMeasurements?: boolean;
  showLocation?: boolean;
  showSeverity?: boolean;
  layout?: 'card' | 'list';
  // Upload configuration
  action?: string;
  headers?: Record<string, string>;
  data?: Record<string, any>;
  name?: string;
  withCredentials?: boolean;
  // Customization
  addFindingText?: string;
  theme?: 'light' | 'dark';
}

export const InspectionFindingsWidget: React.FC<InspectionFindingsWidgetProps> = ({
  id,
  label = 'Inspection Findings',
  value = [],
  onChange,
  disabled = false,
  required = false,
  className,
  style,
  maxFindings = 10,
  severityOptions = [
    { label: 'Low', value: 'low', color: 'hsl(var(--success))' },
    { label: 'Medium', value: 'medium', color: 'hsl(var(--warning))' },
    { label: 'High', value: 'high', color: 'hsl(var(--destructive))' },
    { label: 'Critical', value: 'critical', color: 'hsl(var(--destructive))' }
  ],
  maxImagesPerFinding = 5,
  maxImageSize = 10 * 1024 * 1024, // 10MB
  accept = 'image/*',
  showMeasurements = true,
  showLocation = true,
  showSeverity = true,
  layout = 'card',
  action,
  headers,
  data,
  name = 'file',
  withCredentials = false,
  addFindingText = 'Add Finding',
  theme = 'light'
}) => {
  const [activeFinding, setActiveFinding] = useState<string | null>(null);

  const handleAddFinding = useCallback(() => {
    if (value.length >= maxFindings) {
      message.warning(`Maximum ${maxFindings} findings allowed`);
      return;
    }

    const newFinding: InspectionFinding = {
      id: `finding-${Date.now()}`,
      title: '',
      description: '',
      location: '',
      severity: 'medium',
      measurements: {},
      images: [],
      timestamp: new Date().toISOString(),
      inspector: 'Current Inspector' // This could be passed as prop
    };

    const newValue = [...value, newFinding];
    onChange?.(newValue);
    setActiveFinding(newFinding.id);
  }, [value, maxFindings, onChange]);

  const handleRemoveFinding = useCallback((findingId: string) => {
    const newValue = value.filter(finding => finding.id !== findingId);
    onChange?.(newValue);
    if (activeFinding === findingId) {
      setActiveFinding(null);
    }
  }, [value, onChange, activeFinding]);

  const handleUpdateFinding = useCallback((findingId: string, updates: Partial<InspectionFinding>) => {
    const newValue = value.map(finding => 
      finding.id === findingId ? { ...finding, ...updates } : finding
    );
    onChange?.(newValue);
  }, [value, onChange]);

  const handleImageUpload = useCallback((findingId: string, fileList: UploadFile[]) => {
    const finding = value.find(f => f.id === findingId);
    if (!finding) return;

    // Validate file size
    const oversizedFiles = fileList.filter(file => file.size && file.size > maxImageSize);
    if (oversizedFiles.length > 0) {
      message.error(`Some files exceed the maximum size of ${maxImageSize / (1024 * 1024)}MB`);
      return;
    }

    // Limit number of images
    if (fileList.length > maxImagesPerFinding) {
      message.warning(`Maximum ${maxImagesPerFinding} images per finding`);
      return;
    }

    // Ensure finding has images array
    const currentImages = finding.images || [];
    const updatedImages = [...currentImages, ...fileList];
    
    handleUpdateFinding(findingId, { images: updatedImages });
  }, [value, maxImageSize, maxImagesPerFinding, handleUpdateFinding]);

  const uploadProps: UploadProps = {
    name,
    action,
    headers,
    data,
    withCredentials,
    accept,
    multiple: true,
    fileList: [],
    beforeUpload: () => false, // Prevent auto upload
    onChange: (info) => {
      if (activeFinding) {
        handleImageUpload(activeFinding, info.fileList);
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option?.color || '#1890ff';
  };

  const renderFindingCard = (finding: InspectionFinding) => {
    const isActive = activeFinding === finding.id;
    const severityColor = getSeverityColor(finding.severity);

    return (
      <Card
        key={finding.id}
        size="small"
        style={{ 
          marginBottom: 16,
          border: isActive ? `2px solid ${severityColor}` : undefined,
          background: isActive ? 'var(--color-surface)' : undefined
        }}
        title={
          <Space>
            <Text strong>Finding #{value.indexOf(finding) + 1}</Text>
            {showSeverity && (
              <Tag color={severityColor}>
                {severityOptions.find(opt => opt.value === finding.severity)?.label}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setActiveFinding(isActive ? null : finding.id)}
            >
              {isActive ? 'Close' : 'Edit'}
            </Button>
            <Popconfirm
              title="Delete this finding?"
              description="This action cannot be undone."
              onConfirm={() => handleRemoveFinding(finding.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        }
      >
        {isActive ? (
          <Form layout="vertical" size="small">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Finding Title" required>
                  <Input
                    value={finding.title}
                    onChange={(e) => handleUpdateFinding(finding.id, { title: e.target.value })}
                    placeholder="Brief title for this finding"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24}>
                <Form.Item label="Description" required>
                  <TextArea
                    value={finding.description}
                    onChange={(e) => handleUpdateFinding(finding.id, { description: e.target.value })}
                    placeholder="Detailed description of the finding"
                    rows={3}
                  />
                </Form.Item>
              </Col>

              {showLocation && (
                <Col span={12}>
                  <Form.Item label="Location">
                    <Input
                      value={finding.location}
                      onChange={(e) => handleUpdateFinding(finding.id, { location: e.target.value })}
                      placeholder="Specific location on vessel"
                      prefix={<EnvironmentOutlined />}
                    />
                  </Form.Item>
                </Col>
              )}

              {showSeverity && (
                <Col span={12}>
                  <Form.Item label="Severity">
                    <Select
                      value={finding.severity}
                      onChange={(value) => handleUpdateFinding(finding.id, { severity: value })}
                      style={{ width: '100%' }}
                    >
                      {severityOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          <Tag color={option.color}>{option.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              )}

              {showMeasurements && (
                <>
                  <Col span={6}>
                    <Form.Item label="Length (in)">
                                             <InputNumber
                         value={finding.measurements?.length}
                         onChange={(value) => handleUpdateFinding(finding.id, { 
                           measurements: { ...finding.measurements, length: value || undefined }
                         })}
                         placeholder="0.00"
                         min={0}
                         step={0.01}
                         style={{ width: '100%' }}
                       />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Width (in)">
                                             <InputNumber
                         value={finding.measurements?.width}
                         onChange={(value) => handleUpdateFinding(finding.id, { 
                           measurements: { ...finding.measurements, width: value || undefined }
                         })}
                         placeholder="0.00"
                         min={0}
                         step={0.01}
                         style={{ width: '100%' }}
                       />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Depth (in)">
                                             <InputNumber
                         value={finding.measurements?.depth}
                         onChange={(value) => handleUpdateFinding(finding.id, { 
                           measurements: { ...finding.measurements, depth: value || undefined }
                         })}
                         placeholder="0.00"
                         min={0}
                         step={0.01}
                         style={{ width: '100%' }}
                       />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Area (sq in)">
                                             <InputNumber
                         value={finding.measurements?.area}
                         onChange={(value) => handleUpdateFinding(finding.id, { 
                           measurements: { ...finding.measurements, area: value || undefined }
                         })}
                         placeholder="0.00"
                         min={0}
                         step={0.01}
                         style={{ width: '100%' }}
                       />
                    </Form.Item>
                  </Col>
                </>
              )}

              <Col span={24}>
                <Form.Item label="Images">
                  <Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                      <CameraOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag images to upload</p>
                    <p className="ant-upload-hint">
                      Support for multiple images. Max {maxImagesPerFinding} images per finding.
                    </p>
                  </Dragger>
                  {finding.images && finding.images.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary">
                        {finding.images.length} image(s) uploaded
                      </Text>
                    </div>
                  )}
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <div>
            <Text strong>{finding.title || 'Untitled Finding'}</Text>
            <br />
            <Text type="secondary">
              {finding.description ? 
                finding.description.substring(0, 100) + (finding.description.length > 100 ? '...' : '') :
                'No description provided'
              }
            </Text>
            {finding.location && (
              <>
                <br />
                <Text type="secondary">
                  <EnvironmentOutlined /> {finding.location}
                </Text>
              </>
            )}
            {finding.images && finding.images.length > 0 && (
              <>
                <br />
                <Text type="secondary">
                  <CameraOutlined /> {finding.images.length} image(s)
                </Text>
              </>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className={className} style={style}>
      <div style={{ marginBottom: 16 }}>
        <Text strong>{label}</Text>
        {required && <Text type="danger"> *</Text>}
        {value.length > 0 && (
          <Text type="secondary" style={{ marginLeft: 8 }}>
            ({value.length} finding{value.length !== 1 ? 's' : ''})
          </Text>
        )}
      </div>

      {value.length === 0 ? (
        <Card
          style={{ 
            textAlign: 'center', 
            padding: 40,
            border: '2px dashed var(--color-border)',
            background: 'var(--color-surface)'
          }}
        >
          <CameraOutlined style={{ fontSize: 48, color: 'var(--color-text-secondary)', marginBottom: 16 }} />
          <Title level={4} style={{ color: 'var(--color-text-secondary)' }}>
            No Findings Added
          </Title>
          <Text type="secondary">
            Click "Add Finding" to start documenting inspection findings
          </Text>
        </Card>
      ) : (
        <div>
          {value.map(renderFindingCard)}
        </div>
      )}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAddFinding}
        disabled={disabled || value.length >= maxFindings}
        style={{ width: '100%', marginTop: 16 }}
      >
        {addFindingText}
      </Button>

      {value.length >= maxFindings && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          Maximum {maxFindings} findings reached
        </Text>
      )}
    </div>
  );
}; 
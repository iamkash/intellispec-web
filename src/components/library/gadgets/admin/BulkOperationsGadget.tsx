/**
 * BULK OPERATIONS GADGET
 * 
 * Provides CSV import/export functionality for documents
 * Supports companies, sites, asset groups, and assets
 */

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Upload, 
  Progress, 
  Alert, 
  Table, 
  Space, 
  Typography, 
  Divider,
  message,
  Modal
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { 
  BaseGadget, 
  GadgetMetadata, 
  GadgetSchema, 
  GadgetType, 
  GadgetConfig,
  GadgetContext
} from '../base';
import { ValidationResult } from '../../core/base';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface BulkOperationsConfig {
  allowedTypes?: string[];
  maxFileSize?: number;
  showInstructions?: boolean;
}

interface ImportResult {
  total: number;
  success: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  created: Array<{
    row: number;
    id: string;
    name: string;
  }>;
}

export class BulkOperationsGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'bulk-operations-gadget',
    name: 'Bulk Operations Gadget',
    description: 'CSV import/export functionality for documents',
    version: '1.0.0',
    author: 'System',
    gadgetType: GadgetType.CUSTOM,
    widgetTypes: [],
    tags: ['admin', 'bulk', 'csv', 'import', 'export']
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      allowedTypes: {
        type: 'array',
        items: { type: 'string' },
        default: ['company', 'site', 'asset_group', 'asset']
      },
      maxFileSize: {
        type: 'number',
        default: 10
      },
      showInstructions: {
        type: 'boolean',
        default: true
      }
    },
    widgetSchemas: {}
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    const config = props?.config || props;
    return <BulkOperationsComponent config={config} />;
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    if (!config.id) {
      errors.push('Gadget ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'single',
      props: {
        padding: '24px'
      }
    };
  }

  processDataFlow(data: any): any {
    return data;
  }
}

const BulkOperationsComponent: React.FC<{ config: BulkOperationsConfig }> = ({ config }) => {
  const [selectedType, setSelectedType] = useState<string>('company');
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const documentTypes = config?.allowedTypes || ['company', 'site', 'asset_group', 'asset'];
  
  const typeLabels: Record<string, string> = {
    company: 'Companies',
    site: 'Sites',
    asset_group: 'Asset Groups',
    asset: 'Assets'
  };

  // Handle CSV export
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const response = await BaseGadget.makeAuthenticatedFetch(`/api/bulk/export/${selectedType}`);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the CSV content
      const csvContent = await response.text();
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`${typeLabels[selectedType]} exported successfully!`);
      
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Failed to export ${typeLabels[selectedType]}: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const response = await BaseGadget.makeAuthenticatedFetch(`/api/bulk/template/${selectedType}`);
      
      if (!response.ok) {
        throw new Error(`Template download failed: ${response.statusText}`);
      }

      const csvContent = await response.text();
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedType}_import_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Template downloaded successfully!');
      
    } catch (error) {
      console.error('Template download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Failed to download template: ${errorMessage}`);
    }
  };

  // Handle CSV import
  const handleImport = async (file: UploadFile) => {
    try {
      setUploading(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('csvFile', file as any);

      const response = await fetch(`/api/bulk/import/${selectedType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      setImportResult(result);
      setShowResults(true);

      if (result.success > 0) {
        message.success(`Successfully imported ${result.success}/${result.total} ${typeLabels[selectedType]}`);
      }

      if (result.errors.length > 0) {
        message.warning(`${result.errors.length} rows had errors. Check the results for details.`);
      }

    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Failed to import ${typeLabels[selectedType]}: ${errorMessage}`);
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  // Error table columns
  const errorColumns = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      render: (data: any) => (
        <Text code style={{ fontSize: '12px' }}>
          {JSON.stringify(data, null, 2)}
        </Text>
      ),
      ellipsis: true,
    }
  ];

  // Success table columns
  const successColumns = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          Bulk Import/Export
        </Title>
        
        <Paragraph type="secondary">
          Import and export data in CSV format. Download templates to ensure proper formatting.
        </Paragraph>

        <Divider />

        {/* Document Type Selection */}
        <div style={{ marginBottom: '24px' }}>
          <Text strong>Document Type:</Text>
          <Select
            value={selectedType}
            onChange={setSelectedType}
            style={{ width: 200, marginLeft: '12px' }}
          >
            {documentTypes.map(type => (
              <Option key={type} value={type}>
                {typeLabels[type]}
              </Option>
            ))}
          </Select>
        </div>

        {/* Export Section */}
        <Card 
          size="small" 
          title="Export Data" 
          style={{ marginBottom: '16px' }}
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={exporting}
            >
              Export to CSV
            </Button>
          }
        >
          <Text type="secondary">
            Export all {typeLabels[selectedType].toLowerCase()} to a CSV file for backup or analysis.
          </Text>
        </Card>

        {/* Import Section */}
        <Card 
          size="small" 
          title="Import Data"
          extra={
            <Button
              icon={<FileTextOutlined />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              Import {typeLabels[selectedType].toLowerCase()} from a CSV file. Download the template first to ensure proper formatting.
            </Text>
            
            {config?.showInstructions !== false && (
              <Alert
                message="Import Instructions"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>Download the CSV template to see required columns</li>
                    <li>Fill in your data following the template format</li>
                    <li>Required fields must not be empty</li>
                    <li>For sites and assets, ensure parent records exist first</li>
                    <li>Maximum file size: {config?.maxFileSize || 10}MB</li>
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Upload
              accept=".csv"
              beforeUpload={handleImport}
              showUploadList={false}
              disabled={uploading}
            >
              <Button 
                icon={<UploadOutlined />} 
                loading={uploading}
                size="large"
              >
                {uploading ? 'Importing...' : 'Select CSV File to Import'}
              </Button>
            </Upload>

            {uploading && (
              <Progress 
                percent={100} 
                status="active" 
                showInfo={false}
                style={{ marginTop: '8px' }}
              />
            )}
          </Space>
        </Card>

        {/* Import Results Modal */}
        <Modal
          title="Import Results"
          open={showResults}
          onCancel={() => setShowResults(false)}
          footer={[
            <Button key="close" onClick={() => setShowResults(false)}>
              Close
            </Button>
          ]}
          width={800}
        >
          {importResult && (
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Summary */}
              <Card size="small">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                  <Text strong>{importResult.success} successful</Text>
                  <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                  <Text strong>{importResult.errors.length} errors</Text>
                  <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                  <Text strong>{importResult.total} total rows</Text>
                </Space>
              </Card>

              {/* Success Records */}
              {importResult.created.length > 0 && (
                <div>
                  <Title level={5}>Successfully Created ({importResult.created.length})</Title>
                  <Table
                    dataSource={importResult.created}
                    columns={successColumns}
                    size="small"
                    pagination={{ pageSize: 5 }}
                    rowKey="row"
                  />
                </div>
              )}

              {/* Error Records */}
              {importResult.errors.length > 0 && (
                <div>
                  <Title level={5}>Errors ({importResult.errors.length})</Title>
                  <Table
                    dataSource={importResult.errors}
                    columns={errorColumns}
                    size="small"
                    pagination={{ pageSize: 5 }}
                    rowKey="row"
                  />
                </div>
              )}
            </Space>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default BulkOperationsGadget;

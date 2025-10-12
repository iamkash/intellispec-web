import { CloudUploadOutlined, RobotOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import React from 'react';

const { Title, Paragraph } = Typography;

interface FileUploadStepProps {
  documentType: string;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({
  documentType,
  isProcessing,
  onFileSelect,
}) => {
  return (
    <Card
      style={{ 
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          background: 'hsl(var(--muted) / 0.2)',
          border: '2px dashed hsl(var(--border))',
          borderRadius: '8px',
          padding: '32px 24px',
          maxWidth: '500px',
          margin: '0 auto',
          transition: 'all 0.2s ease'
        }}>
          <CloudUploadOutlined style={{ 
            fontSize: 48, 
            color: 'hsl(var(--primary))', 
            marginBottom: 16,
            display: 'block'
          }} />
          <Title level={3} style={{ 
            marginBottom: 8,
            color: 'hsl(var(--foreground))',
            fontSize: 18
          }}>
            Upload Excel File
          </Title>
          <Paragraph style={{ 
            fontSize: 13,
            color: 'hsl(var(--muted-foreground))',
            marginBottom: 24,
            lineHeight: 1.5
          }}>
            Select an Excel file (.xlsx, .xls) to import {documentType} data.
            Our AI will automatically analyze and map your columns.
        </Paragraph>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="excel-upload"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                await onFileSelect(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          
        <label htmlFor="excel-upload">
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={isProcessing}
            disabled={isProcessing}
            onClick={() => document.getElementById('excel-upload')?.click()}
            style={{
              height: '40px',
              padding: '0 24px',
              fontSize: '14px',
              borderRadius: '6px',
              fontWeight: 500
            }}
          >
            {isProcessing ? 'Analyzing File...' : 'Choose Excel File'}
          </Button>
        </label>
          
          <div style={{ 
            marginTop: 16,
            padding: '12px',
            background: 'hsl(var(--muted) / 0.4)',
            borderRadius: '6px',
            fontSize: 12,
            color: 'hsl(var(--muted-foreground))'
          }}>
            <RobotOutlined style={{ marginRight: 6, color: 'hsl(var(--primary))' }} />
            AI-powered column detection • Supports .xlsx and .xls • Max 10MB
          </div>
        </div>
      </div>
    </Card>
  );
};

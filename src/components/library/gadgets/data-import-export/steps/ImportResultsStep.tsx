import { Button, Card, Tag, Typography } from 'antd';
import React from 'react';
import { ImportSummary } from '../types';

const { Title } = Typography;

export type { ImportSummary };

interface ImportResultsStepProps {
  summary: ImportSummary | null;
  documentType: string;
  onReset: () => void;
}

export const ImportResultsStep: React.FC<ImportResultsStepProps> = ({ summary, documentType, onReset }) => {
  if (!summary) {
    return (
        <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <Title level={4}>Processing Import...</Title>
            </div>
        </Card>
    );
  }
    
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Title level={4}>Import Complete</Title>
        
        <div style={{ marginBottom: 20 }}>
            <Tag color="success" style={{ fontSize: 16, padding: '8px 16px' }}>
            {summary.created} Created
            </Tag>
            <Tag color="blue" style={{ fontSize: 16, padding: '8px 16px' }}>
            {summary.updated} Updated
            </Tag>
            {summary.skipped > 0 && (
            <Tag color="warning" style={{ fontSize: 16, padding: '8px 16px' }}>
                {summary.skipped} Skipped (Duplicates)
            </Tag>
            )}
            {summary.failed > 0 && (
            <Tag color="error" style={{ fontSize: 16, padding: '8px 16px' }}>
                {summary.failed} Failed
            </Tag>
            )}
        </div>

        {summary.errors.length > 0 && (
            <div style={{ textAlign: 'left', maxHeight: 300, overflow: 'auto', border: '1px solid hsl(var(--border))', padding: '12px', borderRadius: '4px' }}>
            <Title level={5}>Errors:</Title>
            {summary.errors.map((err, idx) => (
                <div key={idx} style={{ marginBottom: 8, padding: '4px', background: 'hsl(var(--muted))', borderRadius: '2px' }}>
                <Typography.Text type="danger">
                    Row {err.row}: {err.error}
                </Typography.Text>
                </div>
            ))}
            </div>
        )}

        <div style={{ marginTop: 20 }}>
          <Button type="primary" onClick={onReset}>
            Import Another File
          </Button>
        </div>
      </div>
    </Card>
  );
};
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Card, Table, Tag, Tooltip, Typography } from 'antd';
import React from 'react';
import { ValidationError } from '../types';

const { Title, Paragraph, Text } = Typography;

export type { ValidationError };

interface ValidationStepProps {
    validationErrors: ValidationError[];
    previewData: any[];
    mappedColumns: { title: string, dataIndex: string, key: string }[];
}

export const ValidationStep: React.FC<ValidationStepProps> = ({ 
    validationErrors, 
    previewData,
    mappedColumns
}) => {
    const previewTableColumns = mappedColumns.map(col => ({
        ...col,
        render: (text: any, record: any, index: number) => {
            const rowIndexInFile = previewData.indexOf(record) + 2; // +2 for header and 0-index
            const error = validationErrors.find(
              (e) => e.row === rowIndexInFile && e.column === col.title
            );
            return error ? (
              <Tooltip title={error.error}>
                <Text type="danger">{String(text)}</Text>
              </Tooltip>
            ) : (
              String(text)
            );
          },
    }));

    return (
        <Card>
            <Title level={4}>Preview & Validate</Title>
            <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 24 }}>
                Review the first 10 rows before importing. Fix any validation errors in your source file and re-upload.
            </Paragraph>

            {validationErrors.length > 0 ? (
            <div style={{ marginBottom: 16, backgroundColor: 'hsl(var(--destructive) / 0.05)', padding: 16, border: '1px solid hsl(var(--destructive) / 0.2)', borderRadius: 4 }}>
                <Tag color="error" style={{ fontSize: 14, padding: '4px 12px' }}>
                <WarningOutlined /> {validationErrors.length} validation error(s) found
                </Tag>
                <div style={{ marginTop: 12, maxHeight: 200, overflow: 'auto' }}>
                {validationErrors.slice(0, 10).map((err, idx) => (
                    <div key={idx} style={{ marginBottom: 8, padding: 8, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--destructive) / 0.2)', borderRadius: 4 }}>
                    <Text type="danger" strong>
                        Row {err.row}, Column "{err.column}": {err.error}
                    </Text>
                    {err.value !== undefined && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                        Value: {String(err.value) || '(empty)'}
                        </div>
                    )}
                    </div>
                ))}
                </div>
            </div>
            ) : (
            <div style={{ marginBottom: 16, backgroundColor: 'hsl(var(--success) / 0.05)', padding: 16, border: '1px solid hsl(var(--success) / 0.2)', borderRadius: 4 }}>
                <Tag color="success" style={{ fontSize: 14, padding: '4px 12px' }}>
                <CheckCircleOutlined /> No validation errors - ready to import!
                </Tag>
            </div>
            )}

            <Table
                dataSource={previewData}
                columns={previewTableColumns}
                rowKey={(_, index) => index!.toString()}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
            />
        </Card>
    );
};
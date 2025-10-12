import {
    BulbOutlined,
    CheckCircleOutlined,
    RobotOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Card, Select, Table, Tag, Tooltip, Typography } from 'antd';
import React from 'react';
import {
    AIMapping,
    ColumnMapping,
    FieldDefinition,
} from '../types';

const { Title, Text, Paragraph } = Typography;

export type { AIMapping, ColumnMapping, FieldDefinition };

export interface ColumnMappingStepProps {
    columns: ColumnMapping[];
    aiMappings: AIMapping[];
    fieldDefinitions: FieldDefinition[];
    onColumnMappingChange: (excelColumn: string, dbField: string) => void;
}

export const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
    columns,
    aiMappings,
    fieldDefinitions,
    onColumnMappingChange,
}) => {
    const mappingColumns = [
        {
          title: 'Excel Column',
          dataIndex: 'excelColumn',
          key: 'excelColumn',
          render: (text: string) => {
            const aiMapping = aiMappings.find(m => m.excelColumn === text);
            const confidence = aiMapping?.confidence || 0;
            
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag color="blue">{text}</Tag>
                {aiMapping && aiMapping.dbField && confidence >= 0.7 && (
                  <Tooltip title={`AI: ${(confidence * 100).toFixed(0)}% - ${aiMapping.reason}`}>
                    {confidence >= 0.9 ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                    ) : (
                      <BulbOutlined style={{ color: '#faad14', fontSize: 16 }} />
                    )}
                  </Tooltip>
                )}
              </div>
            );
          },
        },
        {
          title: 'Sample Data',
          dataIndex: 'sampleValues',
          key: 'sampleValues',
          render: (values: any[]) => (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {values.slice(0, 2).join(', ')}
            </Text>
          ),
        },
        {
          title: 'Map to Field',
          dataIndex: 'dbField',
          key: 'dbField',
          render: (_: any, record: ColumnMapping) => {
            const aiMapping = aiMappings.find(m => m.excelColumn === record.excelColumn);
            
            return (
              <div>
                <Select
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  value={record.dbField || ''}
                  onChange={(value) => {
                    onColumnMappingChange(record.excelColumn, value);
                  }}
                  style={{ width: '100%'}}
                  options={[
                    { value: '', label: '-- Skip this column --' },
                    ...fieldDefinitions.map((field) => ({
                        value: field.dbField,
                        label: `${field.label} ${field.required ? '*' : ''}`
                    }))
                  ]}
                />
                {aiMapping && aiMapping.confidence >= 0.5 && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                    <RobotOutlined /> {(aiMapping.confidence * 100).toFixed(0)}% confident
                  </Text>
                )}
              </div>
            );
          },
        },
        {
          title: 'Status',
          key: 'status',
          render: (_: any, record: ColumnMapping) => {
            const fieldDef = fieldDefinitions.find(f => f.dbField === record.dbField);
            const isRequired = fieldDef?.required || false;
            
            if (record.mapped && isRequired) {
              return <Tag color="green"><CheckCircleOutlined /> Required</Tag>
            } else if (record.mapped) {
              return <Tag color="blue"><CheckCircleOutlined /> Mapped</Tag>
            } else if (isRequired) {
              return <Tag color="red"><WarningOutlined /> Required</Tag>;
            } else {
              return <Tag>Optional</Tag>;
            }
          },
        },
    ];

    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <RobotOutlined style={{ fontSize: 20, color: 'hsl(var(--primary))' }} />
                <Title level={4} style={{ margin: 0 }}>AI-Powered Column Mapping</Title>
            </div>
            
            <Paragraph type="secondary">
                <BulbOutlined style={{ color: '#faad14', marginRight: 6 }} />
                AI has analyzed your columns. Review and adjust mappings as needed. Required fields are marked with *.
            </Paragraph>
            
            <Table
                dataSource={columns}
                columns={mappingColumns}
                rowKey="excelColumn"
                pagination={false}
                size="small"
            />
            
            <div style={{ marginTop: 12, padding: 12, background: 'hsl(var(--muted))', borderRadius: 4 }}>
                <Text strong style={{ fontSize: 13 }}><RobotOutlined /> AI Mapping Summary:</Text>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color="green">
                    <CheckCircleOutlined /> High (≥90%): {aiMappings.filter(m => m.confidence >= 0.9).length}
                    </Tag>
                    <Tag color="orange">
                    <BulbOutlined /> Medium (70-89%): {aiMappings.filter(m => m.confidence >= 0.7 && m.confidence < 0.9).length}
                    </Tag>
                    <Tag>
                    <WarningOutlined /> Low (&lt;70%): {aiMappings.filter(m => m.confidence < 0.7 && m.confidence > 0).length}
                    </Tag>
                </div>
            </div>
        </Card>
    );
};

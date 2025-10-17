/**
 * Reference Options Grid Gadget
 * 
 * Right panel gadget for managing options within a selected list type.
 * Provides CRUD operations, AI generation, and bulk actions.
 */

import { BulbOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, RobotOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Form, Input, InputNumber, message, Modal, Select, Space, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import ReferenceDataOptionsGrid from './ReferenceDataOptionsGrid';
import './modal-theme.css';

const { Title, Text } = Typography;

interface ReferenceOptionsGridProps {
  dataUrl: string;
  dependsOn?: string;
  showAIGenerate?: boolean;
  aiGenerateButtonText?: string;
  columns: any[];
  rowActions?: any[];
  bulkActions?: any[];
  search?: any;
  pagination?: any;
  selectedListType?: any;
  aiConfig?: any;
  onAIGenerate?: (listTypeId: string) => void;
}

const ReferenceOptionsGridView: React.FC<ReferenceOptionsGridProps> = ({
  dataUrl,
  selectedListType,
  showAIGenerate = true,
  aiGenerateButtonText = "🤖 AI Generate Options",
  columns,
  rowActions,
  bulkActions,
  search,
  pagination,
  aiConfig = {},
  onAIGenerate
}) => {
  const [isAIModalVisible, setIsAIModalVisible] = useState(false);
  const [aiForm] = Form.useForm();
  const [aiGenerating, setAIGenerating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle AI generation
  const handleAIGenerate = () => {
    if (!selectedListType) {
      message.warning('Please select a list type first');
      return;
    }
    setIsAIModalVisible(true);
    aiForm.resetFields();
    aiForm.setFieldsValue({
      count: 10,
      replaceExisting: false
    });
  };

  // Submit AI generation request
  const handleAISubmit = async () => {
    try {
      const values = await aiForm.validateFields();
      setAIGenerating(true);

      const aiUrl = `/api/reference-data/ai-generate/${selectedListType._id}`;
      const requestBody = {
        ...values,
        aiConfig: aiConfig // Include AI configuration from gadget metadata
      };
const response = await BaseGadget.makeAuthenticatedFetch(aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
if (response.ok) {
        const result = await response.json();
        message.success(`Successfully generated ${result.generated} options!`);
        setIsAIModalVisible(false);
        aiForm.resetFields();
        // Trigger refresh of the inline grid
        setRefreshTrigger(prev => prev + 1);
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        message.error(`AI generation failed: ${error.error || 'Unknown error'}`);
        console.error('AI generation error response:', error);
      }
    } catch (error) {
      message.error('Failed to generate options');
      console.error('AI generation error:', error);
    } finally {
      setAIGenerating(false);
    }
  };

  // No list type selected state
  if (!selectedListType) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty
          description={
            <div>
              <Text type="secondary">Select a list type from the left panel</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                to manage its options
              </Text>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
              Options: {selectedListType.displayName}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {selectedListType.description || 'No description'}
            </Text>
          </div>
          
          <Space>
            {showAIGenerate && (
              <Tooltip title="Use AI to generate common options for this list type">
                <Button
                  icon={<RobotOutlined />}
                  onClick={handleAIGenerate}
                  style={{ 
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  {aiGenerateButtonText}
                </Button>
              </Tooltip>
            )}
          </Space>
        </div>

        {/* List Type Info */}
        <Card size="small" style={{ marginTop: 12, backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
          <Space split={<span style={{ color: 'hsl(var(--muted-foreground))' }}>•</span>}>
            <Text style={{ fontSize: '11px' }}>
              <strong>Category:</strong> {selectedListType.category}
            </Text>
            <Text style={{ fontSize: '11px' }}>
              <strong>Sort:</strong> {selectedListType.sortBy}
            </Text>
            <Text style={{ fontSize: '11px' }}>
              <strong>Custom Values:</strong> {selectedListType.allowCustom ? 'Allowed' : 'Not Allowed'}
            </Text>
            <Text style={{ fontSize: '11px' }}>
              <strong>Options:</strong> {selectedListType.optionCount || 0}
            </Text>
          </Space>
        </Card>
      </div>

      {/* Inline Editable Grid */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ReferenceDataOptionsGrid
          key={selectedListType._id} // Force re-render when list type changes
          listTypeId={selectedListType._id}
          refreshTrigger={refreshTrigger}
          onDataChange={(data) => {
            // Update the option count in the selected list type
            selectedListType.optionCount = data.length;
          }}
        />
      </div>

      {/* AI Generation Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '8px 0',
            borderBottom: '1px solid hsl(var(--border))',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RobotOutlined style={{ 
                fontSize: '18px', 
                color: 'hsl(var(--primary))' 
              }} />
            </div>
            <div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                color: 'hsl(var(--foreground))',
                marginBottom: '2px'
              }}>
                AI Generate Options
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'hsl(var(--muted-foreground))'
              }}>
                Generate options for "{selectedListType?.displayName}"
              </div>
            </div>
          </div>
        }
        open={isAIModalVisible}
        onOk={handleAISubmit}
        onCancel={() => setIsAIModalVisible(false)}
        confirmLoading={aiGenerating}
        okText={aiGenerating ? "Generating..." : "Generate Options"}
        cancelText="Cancel"
        width={600}
        centered
        destroyOnClose
        maskClosable={false}
        className="theme-aware-modal"
        style={{
          backgroundColor: 'hsl(var(--background))'
        }}
        styles={{
          header: { 
            borderBottom: 'none',
            paddingBottom: 0,
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))'
          },
          body: { 
            paddingTop: 0,
            paddingBottom: '24px',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))'
          },
          footer: {
            borderTop: '1px solid hsl(var(--border))',
            paddingTop: '16px',
            marginTop: '16px',
            backgroundColor: 'hsl(var(--background))'
          },
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          },
          content: {
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))'
          }
        }}
      >
        <div style={{ 
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'hsl(var(--muted) / 0.1)',
          borderRadius: '6px',
          border: '1px solid hsl(var(--border))'
        }}>
          <div style={{ 
            fontSize: '14px',
            color: 'hsl(var(--muted-foreground))',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <BulbOutlined style={{ 
              color: 'hsl(var(--primary))',
              fontSize: '16px',
              marginTop: '2px'
            }} />
            <span>
              The AI will analyze the list type "<strong>{selectedListType?.displayName}</strong>" and generate realistic, 
              commonly-used options based on the context and your additional requirements.
            </span>
          </div>
        </div>

        <Form form={aiForm} layout="vertical" requiredMark="optional">
          {/* Requirements Section */}
          <div style={{
            backgroundColor: 'hsl(var(--muted) / 0.1)',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'hsl(var(--foreground))',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <SettingOutlined style={{ color: 'hsl(var(--primary))' }} />
              Generation Requirements
            </div>

            <Form.Item
              name="prompt"
              label={<span style={{ fontWeight: 500 }}>Additional Requirements</span>}
              extra="Provide specific context or requirements to help the AI generate better options"
            >
              <Input.TextArea
                rows={3}
                placeholder="e.g., Include international options, focus on technology industry, add common abbreviations..."
                style={{ borderRadius: '6px' }}
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="count"
              label={
                <span style={{ fontWeight: 500 }}>
                  Number of Options <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Please specify the number of options' }]}
              extra="How many options should the AI generate (1-50)"
            >
              <InputNumber
                min={1}
                max={50}
                size="large"
                style={{ width: '100%', borderRadius: '6px' }}
                placeholder="10"
                defaultValue={10}
              />
            </Form.Item>
          </div>

          {/* Action Section */}
          <div style={{
            backgroundColor: 'hsl(var(--muted) / 0.1)',
            borderRadius: '6px',
            padding: '16px',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'hsl(var(--foreground))',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ThunderboltOutlined style={{ color: 'hsl(var(--primary))' }} />
              Action Configuration
            </div>

            <Form.Item
              name="replaceExisting"
              label={<span style={{ fontWeight: 500 }}>Replace Existing Options</span>}
              extra={
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--destructive))' }}>
                  <DeleteOutlined />
                  <span>Warning: Selecting 'Replace' will delete all current options for this list type</span>
                </div>
              }
              initialValue={false}
            >
              <Select 
                size="large"
                style={{ borderRadius: '6px' }}
              >
                <Select.Option value={false}>
                  <Space>
                    <PlusOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>Add to existing options</span>
                  </Space>
                </Select.Option>
                <Select.Option value={true}>
                  <Space>
                    <ReloadOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>Replace all existing options</span>
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>

        {selectedListType?.optionCount > 0 && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: 'hsl(var(--warning) / 0.1)', 
            border: '1px solid hsl(var(--warning))',
            borderRadius: 6 
          }}>
            <Text style={{ fontSize: '12px', color: 'hsl(var(--warning-foreground))' }}>
              <strong>Current Options:</strong> This list type already has {selectedListType.optionCount} options. 
              Choose whether to add to them or replace them entirely.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default class ReferenceOptionsGridGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'reference-options-grid-gadget',
    name: 'Reference Options Grid',
    description: 'Manage options for reference data list types with AI generation',
    version: '1.0.0',
    gadgetType: GadgetType.DISPLAY,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: { type: 'string' },
      dependsOn: { type: 'string' },
      showAIGenerate: { type: 'boolean' },
      aiGenerateButtonText: { type: 'string' },
      columns: { type: 'array' },
      rowActions: { type: 'array' },
      bulkActions: { type: 'array' },
      search: { type: 'object' },
      pagination: { type: 'object' }
    },
    required: ['dataUrl', 'columns'],
    widgetSchemas: {}
  };

  validate(config: GadgetConfig) { 
    return { isValid: true, errors: [] }; 
  }
  
  getRequiredWidgets(): string[] { 
    return []; 
  }
  
  getWidgetLayout(): Record<string, any> { 
    return { type: 'single', height: '100%' }; 
  }
  
  processDataFlow(data: any): any { 
    return data; 
  }

  renderBody(props: any): React.ReactNode {
    return <ReferenceOptionsGridView {...props} />;
  }
}

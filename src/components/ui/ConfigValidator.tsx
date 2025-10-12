/**
 * ConfigValidator - Configuration validation component
 * 
 * Shows the status of API keys and configuration, with helpful messages
 * for missing or invalid configuration.
 */

import React from 'react';
import { Alert, Card, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { validateConfig, getDevConfig } from '../../utils/config';

const { Text, Title } = Typography;

export interface ConfigValidatorProps {
  showDetails?: boolean;
  onConfigValid?: () => void;
  onConfigInvalid?: (errors: string[]) => void;
}

export const ConfigValidator: React.FC<ConfigValidatorProps> = ({
  showDetails = false,
  onConfigValid,
  onConfigInvalid
}) => {
  const validation = validateConfig();
  const devConfig = getDevConfig();

  React.useEffect(() => {
    if (validation.isValid) {
      onConfigValid?.();
    } else {
      onConfigInvalid?.(validation.errors);
    }
  }, [validation.isValid, validation.errors, onConfigValid, onConfigInvalid]);

  if (validation.isValid) {
    return (
      <Alert
        message="Configuration Valid"
        description="All required API keys and configuration are properly set."
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message="Configuration Issues"
          description="Some required configuration is missing or invalid."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
        
        <div>
          <Title level={5}>Missing Configuration:</Title>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index}>
                <Text type="danger">{error}</Text>
              </li>
            ))}
          </ul>
        </div>

        {showDetails && devConfig && (
          <div>
            <Title level={5}>Current Configuration:</Title>
            <Space direction="vertical">
              <div>
                <Text strong>OpenAI API Key: </Text>
                <Tag color={devConfig.showApiKey !== 'Not set' ? 'green' : 'red'}>
                  {devConfig.showApiKey}
                </Tag>
              </div>
              <div>
                <Text strong>Base URL: </Text>
                <Tag color="blue">{devConfig.baseUrl}</Tag>
              </div>
            </Space>
          </div>
        )}

        <Alert
          message="Setup Instructions"
          description={
            <div>
              <p>1. Create a <code>.env</code> file in your project root</p>
              <p>2. Add your OpenAI API key: <code>REACT_APP_OPENAI_API_KEY=sk-your_key_here</code></p>
              <p>3. Restart your development server</p>
              <p>See <code>API_KEY_SETUP.md</code> for detailed instructions.</p>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </Space>
    </Card>
  );
};

export default ConfigValidator; 
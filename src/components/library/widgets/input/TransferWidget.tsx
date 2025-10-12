/**
 * Transfer Widget - Move items between lists
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Transfer, Typography, Space } from 'antd';

const { Text } = Typography;

export interface TransferItem {
  key: string;
  title: string;
  description?: string;
  disabled?: boolean;
  chosen?: boolean;
}

export interface TransferWidgetProps {
  dataSource: TransferItem[];
  targetKeys?: string[];
  selectedKeys?: string[];
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  titles?: [string, string];
  operations?: [string, string];
  showSearch?: boolean;
  showSelectAll?: boolean;
  oneWay?: boolean;
  pagination?: boolean | { pageSize?: number };
  status?: 'error' | 'warning' | 'success';
  errorMessage?: string;
  helpText?: string;
  style?: React.CSSProperties;
  className?: string;
  validator?: (targetKeys: string[]) => { isValid: boolean; message?: string };
  
  onChange?: (targetKeys: string[], direction: 'left' | 'right', moveKeys: string[]) => void;
  onSelectChange?: (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => void;
  onSearch?: (direction: 'left' | 'right', value: string) => void;
}

export const TransferWidget: React.FC<TransferWidgetProps> = ({
  dataSource = [],
  targetKeys,
  selectedKeys,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  titles = ['Source', 'Target'],
  operations = ['', ''],
  showSearch = false,
  showSelectAll = true,
  oneWay = false,
  pagination = false,
  status,
  errorMessage,
  helpText,
  style,
  className,
  validator,
  onChange,
  onSelectChange,
  onSearch
}) => {
  const [internalTargetKeys, setInternalTargetKeys] = useState<string[]>([]);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | undefined>();

  // Use controlled vs uncontrolled logic without useEffect
  const currentTargetKeys = useMemo(() => {
    return targetKeys !== undefined ? targetKeys : internalTargetKeys;
  }, [targetKeys, internalTargetKeys]);
  
  const currentSelectedKeys = useMemo(() => {
    return selectedKeys !== undefined ? selectedKeys : internalSelectedKeys;
  }, [selectedKeys, internalSelectedKeys]);

  const handleChange = useCallback((newTargetKeys: string[], direction: 'left' | 'right', moveKeys: string[]) => {
    // Always update internal state immediately for visual feedback
    setInternalTargetKeys(newTargetKeys);

    if (validator) {
      const validation = validator(newTargetKeys);
      if (!validation.isValid) {
        setValidationError(validation.message);
      } else {
        setValidationError(undefined);
      }
    }

    onChange?.(newTargetKeys, direction, moveKeys);
  }, [targetKeys, validator, onChange]);

  const handleSelectChange = useCallback((sourceSelectedKeys: string[], targetSelectedKeys: string[]) => {
    // Always update internal state immediately for visual feedback
    setInternalSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);

    onSelectChange?.(sourceSelectedKeys, targetSelectedKeys);
  }, [onSelectChange]);

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div className={`transfer-widget ${className || ''}`} style={{ width: '100%', ...style }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        <Transfer
          dataSource={dataSource}
          targetKeys={currentTargetKeys}
          selectedKeys={currentSelectedKeys}
          disabled={disabled || readOnly}
          titles={titles}
          operations={operations}
          showSearch={showSearch}
          showSelectAll={showSelectAll}
          oneWay={oneWay}
          pagination={pagination}
          onChange={handleChange as any}
          onSelectChange={handleSelectChange as any}
          onSearch={onSearch}
          render={item => item.title}
        />

        {(helpText || finalErrorMessage) && (
          <div>
            {finalErrorMessage && (
              <Text type="danger" style={{ fontSize: '12px' }}>
                {finalErrorMessage}
              </Text>
            )}
            {helpText && !finalErrorMessage && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {helpText}
              </Text>
            )}
          </div>
        )}
      </Space>
    </div>
  );
};

export default TransferWidget; 
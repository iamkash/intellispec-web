/**
 * TagsInput Widget - Tag creation and selection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Tag, Space, Button, Tooltip, Popconfirm, Card, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface TagsInputWidgetProps {
  /** Input value */
  value?: string[];
  /** Default value */
  defaultValue?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether input is read-only */
  readOnly?: boolean;
  /** Whether input is required */
  required?: boolean;
  /** Input size */
  size?: 'small' | 'middle' | 'large';
  /** Validation status */
  status?: 'error' | 'warning' | 'success';
  /** Error message */
  error?: string;
  /** Warning message */
  warning?: string;
  /** Success message */
  success?: string;
  /** Help text */
  description?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Custom CSS class */
  className?: string;
  /** Width of the input */
  width?: number | string;
  /** Maximum number of tags */
  maxTags?: number;
  /** Whether to allow duplicates */
  allowDuplicates?: boolean;
  /** Whether to show individual edit/delete buttons */
  showIndividualControls?: boolean;
  /** Whether to show add/remove toolbar */
  showToolbar?: boolean;
  /** Custom validation function */
  validateTag?: (tag: string) => { isValid: boolean; message?: string };
  /** Whether to allow empty tags */
  allowEmpty?: boolean;
  /** Tag input size */
  inputSize?: 'small' | 'middle' | 'large';
  /** Whether to show tag count */
  showCount?: boolean;
  /** Custom tag renderer */
  renderTag?: (tag: string, index: number) => React.ReactNode;
  /** Add button text */
  addButtonText?: string;
  /** Remove all button text */
  removeAllButtonText?: string;
  /** Confirm remove all message */
  confirmRemoveAllMessage?: string;
  /** Custom validation function */
  validator?: (value: string[]) => { isValid: boolean; message?: string };
  
  // Event handlers
  /** On value change */
  onChange?: (value: string[]) => void;
  /** On reset */
  onReset?: () => void;
  /** On validate */
  onValidate?: (validation: { isValid: boolean; message?: string }) => void;
  /** On blur */
  onBlur?: () => void;
  /** On focus */
  onFocus?: () => void;
}

export const TagsInputWidget: React.FC<TagsInputWidgetProps> = ({
  value = [],
  onChange,
  onReset,
  onValidate,
  disabled = false,
  readOnly = false,
  required = false,
  label,
  placeholder = 'Add item',
  description,
  size = 'middle',
  error,
  warning,
  success,
  defaultValue = [],
  maxTags,
  allowDuplicates = false,
  showIndividualControls = false,
  showToolbar = true,
  validateTag,
  allowEmpty = false,
  inputSize = 'middle',
  showCount = false,
  renderTag,
  addButtonText = 'Add',
  removeAllButtonText = 'Remove All',
  confirmRemoveAllMessage = 'Are you sure you want to remove all items?',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState<string[]>(value || defaultValue);
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Update internal value when prop value changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Validate current value
  useEffect(() => {
    if (onValidate) {
      const validation = validateTags(internalValue);
      onValidate(validation);
    }
  }, [internalValue, onValidate]);

  const validateTags = useCallback((tags: string[]): { isValid: boolean; message?: string } => {
    // Check required field
    if (required && tags.length === 0) {
      return { isValid: false, message: `${label || 'Field'} is required` };
    }

    // Check max tags
    if (maxTags && tags.length > maxTags) {
      return { isValid: false, message: `Maximum ${maxTags} items allowed` };
    }

    // Check individual tag validation
    if (validateTag) {
      for (const tag of tags) {
        const tagValidation = validateTag(tag);
        if (!tagValidation.isValid) {
          return tagValidation;
        }
      }
    }

    // Check for empty tags if not allowed
    if (!allowEmpty) {
      for (const tag of tags) {
        if (!tag.trim()) {
          return { isValid: false, message: 'Empty items are not allowed' };
        }
      }
    }

    return { isValid: true };
  }, [required, maxTags, validateTag, allowEmpty, label]);

  const handleAdd = useCallback(() => {
    if (!inputValue.trim() && !allowEmpty) {
      setInputError('Item cannot be empty');
      return;
    }

    // Check for duplicates
    if (!allowDuplicates && internalValue.includes(inputValue.trim())) {
      setInputError('Item already exists');
      return;
    }

    // Check max tags
    if (maxTags && internalValue.length >= maxTags) {
      setInputError(`Maximum ${maxTags} items allowed`);
      return;
    }

    // Validate individual tag
    if (validateTag) {
      const tagValidation = validateTag(inputValue.trim());
      if (!tagValidation.isValid) {
        setInputError(tagValidation.message || 'Invalid item');
        return;
      }
    }

    const newValue = [...internalValue, inputValue.trim()];
    setInternalValue(newValue);
    setInputValue('');
    setInputError(null);
    onChange?.(newValue);
  }, [inputValue, internalValue, allowDuplicates, maxTags, validateTag, allowEmpty, onChange]);

  const handleRemove = useCallback((index: number) => {
    const newValue = internalValue.filter((_, i) => i !== index);
    setInternalValue(newValue);
    onChange?.(newValue);
  }, [internalValue, onChange]);

  const handleEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditingValue(internalValue[index]);
  }, [internalValue]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;

    if (!editingValue.trim() && !allowEmpty) {
      setInputError('Item cannot be empty');
      return;
    }

    // Check for duplicates (excluding current item)
    if (!allowDuplicates && internalValue.some((tag, i) => i !== editingIndex && tag === editingValue.trim())) {
      setInputError('Item already exists');
      return;
    }

    // Validate individual tag
    if (validateTag) {
      const tagValidation = validateTag(editingValue.trim());
      if (!tagValidation.isValid) {
        setInputError(tagValidation.message || 'Invalid item');
        return;
      }
    }

    const newValue = [...internalValue];
    newValue[editingIndex] = editingValue.trim();
    setInternalValue(newValue);
    setEditingIndex(null);
    setEditingValue('');
    setInputError(null);
    onChange?.(newValue);
  }, [editingIndex, editingValue, internalValue, allowDuplicates, validateTag, allowEmpty, onChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue('');
    setInputError(null);
  }, []);

  const handleRemoveAll = useCallback(() => {
    setInternalValue([]);
    onChange?.([]);
  }, [onChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  const handleReset = useCallback(() => {
    const resetValue = defaultValue;
    setInternalValue(resetValue);
    setInputValue('');
    setEditingIndex(null);
    setEditingValue('');
    setInputError(null);
    onChange?.(resetValue);
    onReset?.();
  }, [defaultValue, onChange, onReset]);

  const renderTagItem = useCallback((tag: string, index: number) => {
    if (renderTag) {
      return renderTag(tag, index);
    }

    if (editingIndex === index) {
      return (
        <div key={index} style={{ display: 'inline-block', marginRight: 8, marginBottom: 8 }}>
          <Space>
            <Input
              size={inputSize}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
              autoFocus
              style={{ width: 150 }}
            />
            <Button
              type="text"
              size="small"
              icon={<SaveOutlined />}
              onClick={handleSaveEdit}
              disabled={disabled}
            />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancelEdit}
              disabled={disabled}
            />
          </Space>
        </div>
      );
    }

    return (
      <Tag
        key={index}
        closable={Boolean(!readOnly && !disabled)}
        onClose={() => handleRemove(index)}
        style={{
          marginRight: 8,
          marginBottom: 8,
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <span>{tag}</span>
        {Boolean(showIndividualControls && !readOnly && !disabled) && (
          <Space size="small">
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(index)}
                style={{ padding: 0, height: 'auto' }}
              />
            </Tooltip>
            <Tooltip title="Remove">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(index)}
                style={{ padding: 0, height: 'auto' }}
              />
            </Tooltip>
          </Space>
        )}
      </Tag>
    );
  }, [editingIndex, editingValue, handleSaveEdit, handleCancelEdit, handleRemove, handleEdit, readOnly, disabled, showIndividualControls, renderTag, inputSize]);

  return (
    <div style={{ width: '100%' }}>
        {label && (
        <div style={{ marginBottom: 8 }}>
          <Text strong={required}>{label}</Text>
          {required && <Text type="danger"> *</Text>}
        </div>
        )}

      <Card size="small" style={{ border: error ? '1px solid #ff4d4f' : undefined }}>
        {/* Toolbar */}
        {showToolbar && !readOnly && !disabled && (
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                disabled={Boolean(!inputValue.trim() || (maxTags && internalValue.length >= maxTags))}
              >
                {addButtonText}
              </Button>
              {internalValue.length > 0 && (
                <Popconfirm
                  title={confirmRemoveAllMessage}
                  onConfirm={handleRemoveAll}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                  >
                    {removeAllButtonText}
                  </Button>
                </Popconfirm>
              )}
            </Space>
            {showCount && (
              <Text type="secondary">
                {internalValue.length}{maxTags ? `/${maxTags}` : ''} items
              </Text>
            )}
          </div>
        )}

        {/* Input Field */}
        {!readOnly && !disabled && (
          <div style={{ marginBottom: 12 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                size={size}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setInputError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled}
                status={inputError ? 'error' : undefined}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                onClick={handleAdd}
                disabled={Boolean(!inputValue.trim() || (maxTags && internalValue.length >= maxTags))}
                size={size}
              >
                <PlusOutlined />
              </Button>
            </Space.Compact>
            {inputError && (
              <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                {inputError}
              </Text>
            )}
          </div>
        )}

        {/* Tags Display */}
        <div style={{ minHeight: 32 }}>
          {internalValue.length === 0 ? (
            <Text type="secondary" italic>
              No items added
            </Text>
          ) : (
            internalValue.map(renderTagItem)
          )}
        </div>

        {/* Error/Warning/Success Messages */}
        {error && (
          <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            {error}
          </Text>
        )}
        {warning && (
          <Text type="warning" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            {warning}
          </Text>
        )}
        {success && (
          <Text type="success" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            {success}
          </Text>
        )}
        {description && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            {description}
          </Text>
        )}
      </Card>
    </div>
  );
};

export default TagsInputWidget; 
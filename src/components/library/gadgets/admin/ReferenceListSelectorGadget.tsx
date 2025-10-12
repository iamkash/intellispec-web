/**
 * Reference List Selector Gadget
 * 
 * Left panel gadget for searching and selecting reference data list types.
 * Provides search, filtering, and selection functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, List, Card, Tag, Typography, Space, Badge, Empty, Spin, Modal, Form, Select } from 'antd';
import { SearchOutlined, PlusOutlined, DatabaseOutlined, FolderOutlined, FileTextOutlined, SettingOutlined, TagOutlined, SortAscendingOutlined, UnlockOutlined, LockOutlined, AppstoreOutlined, TeamOutlined, ToolOutlined, ShoppingOutlined, BranchesOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { InputFieldWidget } from '../../widgets/input/InputFieldWidget';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import './modal-theme.css';

const { Text, Title } = Typography;

interface ListType {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  optionCount: number;
  lastUpdated: string;
  sortBy: string;
  allowCustom: boolean;
}

interface ReferenceListSelectorProps {
  dataUrl: string;
  searchPlaceholder?: string;
  showCategories?: boolean;
  showCreateButton?: boolean;
  createButtonText?: string;
  onSelectionChange?: (selectedListType: ListType | null) => void;
  onCreateClick?: () => void;
}

const ReferenceListSelectorView: React.FC<ReferenceListSelectorProps> = ({
  dataUrl,
  searchPlaceholder = "Search list types...",
  showCategories = true,
  showCreateButton = true,
  createButtonText = "New List Type",
  onSelectionChange,
  onCreateClick
}) => {
  const [listTypes, setListTypes] = useState<ListType[]>([]);
  const [filteredListTypes, setFilteredListTypes] = useState<ListType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedListType, setSelectedListType] = useState<ListType | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingListType, setEditingListType] = useState<ListType | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Load list types from API
  const loadListTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await BaseGadget.makeAuthenticatedFetch(dataUrl);
      if (response.ok) {
        const result = await response.json();
        const data = Array.isArray(result) ? result : result.data || [];
        setListTypes(data);
        setFilteredListTypes(data);
      } else {
        console.error('Failed to load list types:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading list types:', error);
    } finally {
      setLoading(false);
    }
  }, [dataUrl]);

  // Initial load
  useEffect(() => {
    loadListTypes();
  }, [loadListTypes]);

  // Filter list types based on search and category
  useEffect(() => {
    let filtered = listTypes;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.displayName.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredListTypes(filtered);
  }, [listTypes, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(listTypes.map(item => item.category));
    const cats = Array.from(uniqueCategories);
    return cats.sort();
  }, [listTypes]);

  // Handle list type selection
  const handleSelectListType = (listType: ListType) => {
    setSelectedListType(listType);
    onSelectionChange?.(listType);
  };

  // Handle create button click
  const handleCreateClick = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
  };

  // Handle edit list type
  const handleEditListType = async (listType: ListType, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card selection
    
    setEditingListType(listType);
    setIsEditModalVisible(true);
    
    // Pre-populate the form with existing values
    editForm.setFieldsValue({
      displayName: listType.displayName,
      name: listType.name,
      category: listType.category,
      description: listType.description,
      sortBy: listType.sortBy,
      allowCustom: listType.allowCustom
    });
  };

  // Handle delete list type
  const handleDeleteListType = async (listType: ListType, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card selection
    
    try {
      const response = await BaseGadget.makeAuthenticatedFetch(`${dataUrl}/${listType._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state
        setListTypes(prev => prev.filter(item => item._id !== listType._id));
        setFilteredListTypes(prev => prev.filter(item => item._id !== listType._id));
        
        // If the deleted item was selected, clear selection
        if (selectedListType?._id === listType._id) {
          setSelectedListType(null);
          onSelectionChange?.(null);
        }
} else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete failed:', errorData);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Handle form submission
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      
      const response = await BaseGadget.makeAuthenticatedFetch('/api/reference-data/list-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        loadListTypes(); // Refresh the list
        // TODO: Show success message
      } else {
        const error = await response.json();
        console.error('Failed to create list type:', error);
        // TODO: Show error message
      }
    } catch (error) {
      console.error('Error creating list type:', error);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!editingListType) return;
    
    try {
      const values = await editForm.validateFields();
      
      const response = await BaseGadget.makeAuthenticatedFetch(`/api/reference-data/list-types/${editingListType._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        const updatedListType = await response.json();
        
        // Update in local state
        setListTypes(prev => prev.map(item => 
          item._id === editingListType._id ? updatedListType : item
        ));
        setFilteredListTypes(prev => prev.map(item => 
          item._id === editingListType._id ? updatedListType : item
        ));
        
        // Update selected list type if it was the one being edited
        if (selectedListType?._id === editingListType._id) {
          setSelectedListType(updatedListType);
          onSelectionChange?.(updatedListType);
        }
        
        setIsEditModalVisible(false);
        setEditingListType(null);
        editForm.resetFields();
} else {
        console.error('Failed to update list type:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating list type:', error);
    }
  };

  // Format last updated date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            <DatabaseOutlined /> List Types
          </Title>
          {showCreateButton && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateClick}
              size="small"
            >
              {createButtonText}
            </Button>
          )}
        </div>

        {/* Search */}
        <Input
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />

        {/* Category Filter */}
        {showCategories && categories.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Space wrap>
              <Tag
                color={selectedCategory === 'all' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedCategory('all')}
              >
                All ({listTypes.length})
              </Tag>
              {categories.map(category => {
                const count = listTypes.filter(item => item.category === category).length;
                return (
                  <Tag
                    key={category}
                    color={selectedCategory === category ? 'blue' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <FolderOutlined /> {category} ({count})
                  </Tag>
                );
              })}
            </Space>
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : filteredListTypes.length === 0 ? (
          <Empty
            description={searchQuery ? "No list types match your search" : "No list types found"}
            style={{ marginTop: '40px' }}
          />
        ) : (
          <List
            dataSource={filteredListTypes}
            renderItem={(item) => (
              <List.Item style={{ padding: 0, marginBottom: 8 }}>
                <Card
                  size="small"
                  hoverable
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    border: selectedListType?._id === item._id ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                    backgroundColor: selectedListType?._id === item._id ? 'hsl(var(--primary) / 0.05)' : undefined
                  }}
                  onClick={() => handleSelectListType(item)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: '14px' }}>
                        {item.displayName}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge count={item.optionCount} style={{ backgroundColor: 'hsl(var(--primary))' }} />
                        <Space size="small">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => handleEditListType(item, e)}
                            style={{ 
                              color: 'hsl(var(--muted-foreground))',
                              opacity: 0.7,
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleDeleteListType(item, e)}
                            style={{ 
                              color: 'hsl(var(--destructive))',
                              opacity: 0.7,
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                          />
                        </Space>
                      </div>
                    </div>
                    
                    {item.description && (
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                        {item.description}
                      </Text>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color="geekblue" style={{ fontSize: '10px', margin: 0 }}>
                        {item.category}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        Updated: {formatDate(item.lastUpdated)}
                      </Text>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer Info */}
      {selectedListType && (
        <div style={{ padding: '12px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
          <Text strong style={{ fontSize: '12px', display: 'block' }}>
            Selected: {selectedListType.displayName}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {selectedListType.optionCount} options • Sort by: {selectedListType.sortBy}
            {selectedListType.allowCustom && ' • Allows custom values'}
          </Text>
        </div>
      )}

      {/* Create List Type Modal */}
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
              <PlusOutlined style={{ 
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
                Create New List Type
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'hsl(var(--muted-foreground))'
              }}>
                Define a new reference data list for dropdown options
              </div>
            </div>
          </div>
        }
        open={isCreateModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setIsCreateModalVisible(false)}
        okText="Create List Type"
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
        <Form
          form={createForm}
          layout="vertical"
          requiredMark="optional"
          style={{ marginTop: '4px' }}
        >
          {/* Basic Information Section */}
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
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <DatabaseOutlined style={{ color: 'hsl(var(--primary))' }} />
              Basic Information
            </div>
            
            <Form.Item
              name="displayName"
              label={
                <span style={{ fontWeight: 500 }}>
                  Display Name <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Please enter a display name' }]}
              extra="This is the user-friendly name shown in the interface"
            >
              <InputFieldWidget
                placeholder="e.g., User Status, Priority Levels"
                onChange={(value: string) => {
                  // Auto-generate internal name from display name
                  const internalName = value.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '_');
                  createForm.setFieldValue('name', internalName);
                }}
              />
            </Form.Item>

            <Form.Item
              name="name"
              label={
                <span style={{ fontWeight: 500 }}>
                  Internal Name <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[
                { required: true, message: 'Please enter an internal name' },
                { pattern: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers, and underscores allowed' }
              ]}
              extra="Used in API calls and database storage (auto-generated from display name)"
            >
              <InputFieldWidget
                placeholder="e.g., user_status, priority_levels"
              />
            </Form.Item>
          </div>

          {/* Classification Section */}
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
              <FolderOutlined style={{ color: 'hsl(var(--primary))' }} />
              Classification & Description
            </div>

            <Form.Item
              name="category"
              label={
                <span style={{ fontWeight: 500 }}>
                  Category <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Please select a category' }]}
              extra="Groups related list types together for better organization"
            >
              <Select 
                placeholder="Select category"
                size="large"
                style={{ borderRadius: '6px' }}
              >
                <Select.Option value="general">
                  <Space>
                    <AppstoreOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>General</span>
                  </Space>
                </Select.Option>
                <Select.Option value="user">
                  <Space>
                    <TeamOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>User Management</span>
                  </Space>
                </Select.Option>
                <Select.Option value="system">
                  <Space>
                    <ToolOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>System</span>
                  </Space>
                </Select.Option>
                <Select.Option value="business">
                  <Space>
                    <ShoppingOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>Business</span>
                  </Space>
                </Select.Option>
                <Select.Option value="workflow">
                  <Space>
                    <BranchesOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>Workflow</span>
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label={<span style={{ fontWeight: 500 }}>Description</span>}
              extra="Optional description to help others understand the purpose of this list"
            >
              <Input.TextArea
                placeholder="Brief description of what this list is used for..."
                rows={3}
                style={{ borderRadius: '6px' }}
                showCount
                maxLength={200}
              />
            </Form.Item>
          </div>

          {/* Configuration Section */}
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
              <SettingOutlined style={{ color: 'hsl(var(--primary))' }} />
              Configuration Options
            </div>

            <Form.Item
              name="sortBy"
              label={
                <span style={{ fontWeight: 500 }}>
                  Default Sort Order <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Please select sort order' }]}
              initialValue="label"
              extra="How options will be ordered when displayed in dropdowns"
            >
              <Select size="large" style={{ borderRadius: '6px' }}>
                <Select.Option value="label">
                  <Space>
                    <SortAscendingOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>By Label (A-Z)</span>
                  </Space>
                </Select.Option>
                <Select.Option value="value">
                  <Space>
                    <TagOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>By Value</span>
                  </Space>
                </Select.Option>
                <Select.Option value="order">
                  <Space>
                    <DatabaseOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>By Sort Order</span>
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="allowCustom"
              label={
                <span style={{ fontWeight: 500 }}>
                  Allow Custom Values <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Please select custom value policy' }]}
              initialValue={false}
              extra="Whether users can add their own custom options to this list"
            >
              <Select size="large" style={{ borderRadius: '6px' }}>
                <Select.Option value={false}>
                  <Space>
                    <LockOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>No - Fixed list only</span>
                  </Space>
                </Select.Option>
                <Select.Option value={true}>
                  <Space>
                    <UnlockOutlined style={{ color: 'hsl(var(--primary))' }} />
                    <span>Yes - Users can add custom values</span>
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Edit List Type Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '8px 0',
            borderBottom: '1px solid hsl(var(--border))',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <EditOutlined style={{ color: 'hsl(var(--primary))', fontSize: '16px' }} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                Edit List Type
              </div>
              <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                Update reference data list configuration
              </div>
            </div>
          </div>
        }
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingListType(null);
          editForm.resetFields();
        }}
        okText="Update List Type"
        cancelText="Cancel"
        width={600}
        styles={{
          header: {
            paddingBottom: 0,
            backgroundColor: 'hsl(var(--background))',
            borderBottom: 'none'
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
        <Form form={editForm} layout="vertical" requiredMark="optional">
          {/* Same form fields as create modal - you can reuse the same structure */}
          <div style={{
            backgroundColor: 'hsl(var(--muted) / 0.1)',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px',
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
              <FileTextOutlined style={{ color: 'hsl(var(--primary))' }} />
              Basic Information
            </div>

            <Form.Item
              name="displayName"
              label={
                <span style={{ fontWeight: 500 }}>
                  Display Name <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Please enter display name' }]}
              extra="User-friendly name shown in the interface"
            >
              <InputFieldWidget
                placeholder="e.g., User Status, Priority Levels"
                size="large"
                style={{ borderRadius: '6px' }}
                maxLength={50}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="name"
              label={
                <span style={{ fontWeight: 500 }}>
                  Internal Name <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
                </span>
              }
              rules={[
                { required: true, message: 'Please enter internal name' },
                { 
                  pattern: /^[a-z0-9_-]+$/, 
                  message: 'Only lowercase letters, numbers, hyphens and underscores allowed' 
                }
              ]}
              extra="Technical identifier used in APIs (auto-generated from display name)"
            >
              <InputFieldWidget
                placeholder="e.g., user_status, priority_levels"
                size="large"
                style={{ borderRadius: '6px' }}
                maxLength={50}
                showCount
              />
            </Form.Item>
          </div>

          <Form.Item
            name="category"
            label={
              <span style={{ fontWeight: 500 }}>
                Category <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
              </span>
            }
            rules={[{ required: true, message: 'Please select a category' }]}
            extra="Helps organize and filter list types"
          >
            <Select size="large" style={{ borderRadius: '6px' }}>
              <Select.Option value="general">
                <Space>
                  <AppstoreOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>General</span>
                </Space>
              </Select.Option>
              <Select.Option value="user">
                <Space>
                  <TeamOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>User Management</span>
                </Space>
              </Select.Option>
              <Select.Option value="system">
                <Space>
                  <ToolOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>System</span>
                </Space>
              </Select.Option>
              <Select.Option value="business">
                <Space>
                  <ShoppingOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>Business</span>
                </Space>
              </Select.Option>
              <Select.Option value="workflow">
                <Space>
                  <BranchesOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>Workflow</span>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 500 }}>Description</span>}
            extra="Brief description of what this list is used for"
          >
            <InputFieldWidget
              placeholder="Brief description of what this list is used for"
              size="large"
              style={{ borderRadius: '6px', minHeight: '80px' }}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="sortBy"
            label={
              <span style={{ fontWeight: 500 }}>
                Default Sort Order <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
              </span>
            }
            rules={[{ required: true, message: 'Please select sort order' }]}
            extra="How options will be ordered when displayed in dropdowns"
          >
            <Select size="large" style={{ borderRadius: '6px' }}>
              <Select.Option value="label">
                <Space>
                  <SortAscendingOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>By Label (A-Z)</span>
                </Space>
              </Select.Option>
              <Select.Option value="value">
                <Space>
                  <TagOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>By Value</span>
                </Space>
              </Select.Option>
              <Select.Option value="order">
                <Space>
                  <SettingOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>By Sort Order</span>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="allowCustom"
            label={
              <span style={{ fontWeight: 500 }}>
                Allow Custom Values <span style={{ color: 'hsl(var(--destructive))', fontSize: '14px' }}>*</span>
              </span>
            }
            rules={[{ required: true, message: 'Please select custom value policy' }]}
            extra="Whether users can add their own options beyond the predefined list"
          >
            <Select size="large" style={{ borderRadius: '6px' }}>
              <Select.Option value={false}>
                <Space>
                  <LockOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>No - Fixed list only</span>
                </Space>
              </Select.Option>
              <Select.Option value={true}>
                <Space>
                  <UnlockOutlined style={{ color: 'hsl(var(--primary))' }} />
                  <span>Yes - Users can add custom values</span>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default class ReferenceListSelectorGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'reference-list-selector-gadget',
    name: 'Reference List Selector',
    description: 'Search and select reference data list types',
    version: '1.0.0',
    gadgetType: GadgetType.INTERACTIVE,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: { 
        type: 'string',
        description: 'API endpoint for fetching list types'
      },
      searchPlaceholder: { 
        type: 'string',
        description: 'Placeholder text for search input',
        default: 'Search list types...'
      },
      showCategories: { 
        type: 'boolean',
        description: 'Whether to show category filter tags',
        default: true
      },
      showCreateButton: { 
        type: 'boolean',
        description: 'Whether to show the create new list type button',
        default: true
      },
      createButtonText: { 
        type: 'string',
        description: 'Text for the create button',
        default: 'New List Type'
      },
      onSelectionChange: { 
        type: 'string',
        description: 'Callback function name for selection changes'
      },
      requiredFields: {
        type: 'object',
        description: 'Configuration for required fields in create form',
        properties: {
          displayName: { 
            type: 'object',
            properties: {
              required: { type: 'boolean', default: true },
              minLength: { type: 'number', default: 2 },
              maxLength: { type: 'number', default: 100 },
              pattern: { type: 'string', description: 'Regex pattern for validation' }
            }
          },
          name: {
            type: 'object',
            properties: {
              required: { type: 'boolean', default: true },
              pattern: { type: 'string', default: '^[a-z0-9_]+$' },
              description: { type: 'string', default: 'Only lowercase letters, numbers, and underscores allowed' }
            }
          },
          category: {
            type: 'object',
            properties: {
              required: { type: 'boolean', default: true },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    label: { type: 'string' },
                    icon: { type: 'string' }
                  }
                },
                default: [
                  { value: 'general', label: 'General', icon: 'AppstoreOutlined' },
                  { value: 'user', label: 'User Management', icon: 'TeamOutlined' },
                  { value: 'system', label: 'System', icon: 'ToolOutlined' },
                  { value: 'business', label: 'Business', icon: 'ShoppingOutlined' },
                  { value: 'workflow', label: 'Workflow', icon: 'BranchesOutlined' }
                ]
              }
            }
          },
          description: {
            type: 'object',
            properties: {
              required: { type: 'boolean', default: false },
              maxLength: { type: 'number', default: 200 }
            }
          },
          sortBy: {
            type: 'object',
            properties: {
              required: { type: 'boolean', default: true },
              default: { type: 'string', default: 'label' },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    label: { type: 'string' },
                    icon: { type: 'string' }
                  }
                },
                default: [
                  { value: 'label', label: 'By Label (A-Z)', icon: 'SortAscendingOutlined' },
                  { value: 'value', label: 'By Value', icon: 'TagOutlined' },
                  { value: 'order', label: 'By Sort Order', icon: 'DatabaseOutlined' }
                ]
              }
            }
          },
          allowCustom: {
            type: 'object',
            properties: {
              required: { type: 'boolean', default: true },
              default: { type: 'boolean', default: false },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    value: { type: 'boolean' },
                    label: { type: 'string' },
                    icon: { type: 'string' }
                  }
                },
                default: [
                  { value: false, label: 'No - Fixed list only', icon: 'LockOutlined' },
                  { value: true, label: 'Yes - Users can add custom values', icon: 'UnlockOutlined' }
                ]
              }
            }
          }
        }
      }
    },
    required: ['dataUrl'],
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
    return <ReferenceListSelectorView {...props} />;
  }
}

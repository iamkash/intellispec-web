/**
 * InlineEditableGrid Usage Examples
 * 
 * This file demonstrates various ways to use the generic InlineEditableGrid
 * component for different data types and use cases.
 */

import React from 'react';
import InlineEditableGrid, { type ColumnDefinition, type GridConfig, type CrudEndpoints } from './InlineEditableGrid';

// ====================================================================
// EXAMPLE 1: User Management Grid
// ====================================================================
export const UserManagementGrid: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const columns: ColumnDefinition[] = [
    {
      key: 'firstName',
      title: 'First Name *',
      dataIndex: 'firstName',
      width: '20%',
      editable: true,
      required: true,
      type: 'text',
      placeholder: 'Enter first name',
      validation: { min: 1, max: 50 }
    },
    {
      key: 'lastName',
      title: 'Last Name *',
      dataIndex: 'lastName',
      width: '20%',
      editable: true,
      required: true,
      type: 'text',
      placeholder: 'Enter last name',
      validation: { min: 1, max: 50 }
    },
    {
      key: 'email',
      title: 'Email *',
      dataIndex: 'email',
      width: '25%',
      editable: true,
      required: true,
      type: 'email',
      placeholder: 'user@example.com',
      validation: { 
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        message: 'Please enter a valid email address'
      }
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role',
      width: '15%',
      editable: true,
      type: 'select',
      optionsUrl: '/api/admin/roles?format=options' // Dynamic options
    },
    {
      key: 'isActive',
      title: 'Active',
      dataIndex: 'isActive',
      width: '10%',
      editable: true,
      type: 'boolean'
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      dataIndex: 'lastLogin',
      width: '10%',
      editable: false,
      type: 'date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
    }
  ];

  const endpoints: CrudEndpoints = {
    read: '/api/admin/users',
    create: '/api/admin/users',
    update: '/api/admin/users',
    delete: '/api/admin/users'
  };

  const config: GridConfig = {
    title: 'User Management',
    subtitle: 'Manage tenant users and permissions',
    addButtonText: 'Add User',
    newRecordDefaults: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
      isActive: true
    }
  };

  return (
    <InlineEditableGrid
      entityId={tenantId}
      baseUrl=""
      endpoints={endpoints}
      columns={columns}
      config={config}
    />
  );
};

// ====================================================================
// EXAMPLE 2: Product Catalog Grid
// ====================================================================
export const ProductCatalogGrid: React.FC = () => {
  const columns: ColumnDefinition[] = [
    {
      key: 'name',
      title: 'Product Name *',
      dataIndex: 'name',
      width: '25%',
      editable: true,
      required: true,
      type: 'text',
      placeholder: 'Enter product name'
    },
    {
      key: 'sku',
      title: 'SKU *',
      dataIndex: 'sku',
      width: '15%',
      editable: true,
      required: true,
      type: 'text',
      placeholder: 'SKU-001',
      validation: {
        pattern: '^[A-Z0-9-]+$',
        message: 'SKU must contain only uppercase letters, numbers, and hyphens'
      }
    },
    {
      key: 'category',
      title: 'Category',
      dataIndex: 'category',
      width: '15%',
      editable: true,
      type: 'select',
      options: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'books', label: 'Books' },
        { value: 'home', label: 'Home & Garden' }
      ]
    },
    {
      key: 'price',
      title: 'Price ($)',
      dataIndex: 'price',
      width: '12%',
      editable: true,
      type: 'number',
      placeholder: '0.00',
      validation: { min: 0, max: 999999.99 }
    },
    {
      key: 'stock',
      title: 'Stock',
      dataIndex: 'stock',
      width: '10%',
      editable: true,
      type: 'number',
      placeholder: '0',
      validation: { min: 0, max: 999999 }
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      width: '23%',
      editable: true,
      type: 'text',
      placeholder: 'Product description...'
    }
  ];

  const endpoints: CrudEndpoints = {
    read: '/api/products',
    create: '/api/products',
    update: '/api/products',
    delete: '/api/products'
  };

  const config: GridConfig = {
    title: 'Product Catalog',
    subtitle: 'Manage your product inventory',
    addButtonText: 'Add Product',
    newRecordDefaults: {
      name: 'New Product',
      sku: `PROD-${Date.now()}`,
      category: 'electronics',
      price: 0,
      stock: 0,
      description: ''
    },
    styling: {
      size: 'middle',
      scroll: { x: 1200, y: 500 }
    }
  };

  return (
    <InlineEditableGrid
      baseUrl=""
      endpoints={endpoints}
      columns={columns}
      config={config}
    />
  );
};

// ====================================================================
// EXAMPLE 3: Task Management Grid (with static data)
// ====================================================================
export const TaskManagementGrid: React.FC<{ 
  tasks: any[], 
  onUpdate: (tasks: any[]) => void 
}> = ({ tasks, onUpdate }) => {
  const columns: ColumnDefinition[] = [
    {
      key: 'title',
      title: 'Task Title *',
      dataIndex: 'title',
      width: '30%',
      editable: true,
      required: true,
      type: 'text',
      placeholder: 'Enter task title'
    },
    {
      key: 'assignee',
      title: 'Assignee',
      dataIndex: 'assignee',
      width: '20%',
      editable: true,
      type: 'select',
      optionsUrl: '/api/users?format=options'
    },
    {
      key: 'priority',
      title: 'Priority',
      dataIndex: 'priority',
      width: '15%',
      editable: true,
      type: 'select',
      options: [
        { value: 'low', label: 'Low', color: 'green' },
        { value: 'medium', label: 'Medium', color: 'orange' },
        { value: 'high', label: 'High', color: 'red' },
        { value: 'urgent', label: 'Urgent', color: 'purple' }
      ]
    },
    {
      key: 'dueDate',
      title: 'Due Date',
      dataIndex: 'dueDate',
      width: '15%',
      editable: true,
      type: 'date',
      placeholder: 'Select date'
    },
    {
      key: 'completed',
      title: 'Completed',
      dataIndex: 'completed',
      width: '10%',
      editable: true,
      type: 'boolean'
    },
    {
      key: 'progress',
      title: 'Progress (%)',
      dataIndex: 'progress',
      width: '10%',
      editable: true,
      type: 'number',
      placeholder: '0',
      validation: { min: 0, max: 100 }
    }
  ];

  const endpoints: CrudEndpoints = {
    read: '/api/tasks',
    create: '/api/tasks',
    update: '/api/tasks',
    delete: '/api/tasks'
  };

  const config: GridConfig = {
    title: 'Task Management',
    subtitle: 'Track and manage project tasks',
    addButtonText: 'Add Task',
    instructionsText: '💡 Task Board: Edit tasks inline, track progress, and manage deadlines efficiently.',
    newRecordDefaults: {
      title: 'New Task',
      assignee: '',
      priority: 'medium',
      dueDate: new Date(),
      completed: false,
      progress: 0
    },
    pagination: {
      pageSize: 15,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: true
    }
  };

  return (
    <InlineEditableGrid
      baseUrl=""
      endpoints={endpoints}
      columns={columns}
      config={config}
      initialData={tasks}
      onDataChange={onUpdate}
    />
  );
};

// ====================================================================
// EXAMPLE 4: Read-Only Data Grid (view only)
// ====================================================================
export const ReadOnlyDataGrid: React.FC<{ data: any[] }> = ({ data }) => {
  const columns: ColumnDefinition[] = [
    {
      key: 'id',
      title: 'ID',
      dataIndex: 'id',
      width: '10%',
      editable: false,
      type: 'text'
    },
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      width: '25%',
      editable: false,
      type: 'text'
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      width: '15%',
      editable: false,
      type: 'text',
      render: (value) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: value === 'active' ? '#d4edda' : '#f8d7da',
          color: value === 'active' ? '#155724' : '#721c24'
        }}>
          {value}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataIndex: 'createdAt',
      width: '20%',
      editable: false,
      type: 'date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'value',
      title: 'Value',
      dataIndex: 'value',
      width: '15%',
      editable: false,
      type: 'number',
      render: (value) => `$${value.toLocaleString()}`
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      width: '15%',
      editable: false,
      type: 'text'
    }
  ];

  // No endpoints needed for read-only
  const endpoints: CrudEndpoints = {
    read: '',
    create: '',
    update: '',
    delete: ''
  };

  const config: GridConfig = {
    title: 'Data View',
    subtitle: 'Read-only data display',
    enableBulkActions: false,
    enableAdd: false,
    enableDelete: false,
    showInstructions: false,
    pagination: {
      pageSize: 20,
      showSizeChanger: true,
      showQuickJumper: false,
      showTotal: true
    }
  };

  return (
    <InlineEditableGrid
      baseUrl=""
      endpoints={endpoints}
      columns={columns}
      config={config}
      initialData={data}
    />
  );
};

// ====================================================================
// USAGE DOCUMENTATION
// ====================================================================

/**
 * USAGE GUIDE:
 * 
 * 1. BASIC USAGE:
 *    Import InlineEditableGrid and define your columns and endpoints
 * 
 * 2. COLUMN TYPES:
 *    - text: Regular text input
 *    - number: Number input with min/max validation
 *    - select: Dropdown with static options or dynamic optionsUrl
 *    - date: Date picker
 *    - boolean: Switch/toggle
 *    - email: Email input with validation
 *    - password: Password input
 * 
 * 3. CRUD ENDPOINTS:
 *    - read: GET {baseUrl}{read}/{entityId}
 *    - create: POST {baseUrl}{create}/{entityId} (entityId optional)
 *    - update: PUT {baseUrl}{update}/{recordId}
 *    - delete: DELETE {baseUrl}{delete}/{recordId}
 * 
 * 4. CONFIGURATION OPTIONS:
 *    - title/subtitle: Grid header text
 *    - enableBulkActions: Show save/reset buttons
 *    - enableAdd/enableDelete: Show add/delete functionality
 *    - newRecordDefaults: Default values for new records
 *    - pagination: Pagination settings
 *    - styling: Size, borders, scroll settings
 * 
 * 5. CALLBACKS:
 *    - onDataChange: Called when data changes
 *    - onError: Called on errors
 *    - onSuccess: Called on successful operations
 * 
 * 6. ADVANCED FEATURES:
 *    - Dynamic options loading via optionsUrl
 *    - Custom render functions for display
 *    - Field validation with patterns and ranges
 *    - Optimistic updates with rollback
 *    - Change tracking and highlighting
 *    - Theme-aware styling
 */

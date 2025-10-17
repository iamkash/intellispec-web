/**
 * Tenant Switcher Component
 * 
 * Top-bar dropdown that allows users to switch between their tenant memberships
 * while maintaining context within the application.
 */

import React, { useState, useEffect } from 'react';
import { 
  Dropdown, 
  Avatar, 
  Space, 
  Typography, 
  Input, 
  List, 
  Badge,
  Button,
  Divider
} from 'antd';
import { 
  DownOutlined, 
  SearchOutlined, 
  TeamOutlined, 
  BankOutlined,
  SwapOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { UserSession } from '../../schemas/tenant/models';

const { Text } = Typography;
const { Search } = Input;

interface TenantSwitcherProps {
  userSession: UserSession;
  currentTenantSlug: string;
  onTenantSwitch: (tenantSlug: string) => void;
  loading?: boolean;
  className?: string;
}

interface TenantMembership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  orgName?: string;
  role: string;
}

const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  userSession,
  currentTenantSlug,
  onTenantSwitch,
  loading = false,
  className
}) => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMemberships, setFilteredMemberships] = useState<TenantMembership[]>([]);

  const currentTenant = userSession.memberships.find(m => m.tenantSlug === currentTenantSlug);

  useEffect(() => {
    // Filter and sort memberships
    const filtered = userSession.memberships.filter(membership =>
      membership.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.orgName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort: current tenant first, then by organization, then by name
    filtered.sort((a, b) => {
      if (a.tenantSlug === currentTenantSlug) return -1;
      if (b.tenantSlug === currentTenantSlug) return 1;
      
      if (a.orgName && b.orgName && a.orgName !== b.orgName) {
        return a.orgName.localeCompare(b.orgName);
      }
      
      return a.tenantName.localeCompare(b.tenantName);
    });

    setFilteredMemberships(filtered);
  }, [userSession.memberships, searchTerm, currentTenantSlug]);

  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'red';
      case 'user': return 'blue';
      case 'viewer': return 'gray';
      default: return 'purple';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'Admin';
      case 'user': return 'User';
      case 'viewer': return 'Viewer';
      default: return 'Custom';
    }
  };

  const handleTenantSelect = (tenantSlug: string) => {
    if (tenantSlug !== currentTenantSlug && !loading) {
      onTenantSwitch(tenantSlug);
      setVisible(false);
      setSearchTerm('');
    }
  };

  const dropdownContent = (
    <div style={{ 
      width: 320, 
      maxHeight: 400, 
      padding: '12px 0',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      {/* Header */}
      <div style={{ padding: '0 16px 12px' }}>
        <Text strong style={{ fontSize: '14px' }}>
          Switch Workspace
        </Text>
        <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
          {userSession.memberships.length} workspace{userSession.memberships.length !== 1 ? 's' : ''} available
        </Text>
      </div>

      {/* Search */}
      {userSession.memberships.length > 5 && (
        <div style={{ padding: '0 16px 12px' }}>
          <Search
            placeholder="Search workspaces..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
          />
        </div>
      )}

      <Divider style={{ margin: '0 0 8px 0' }} />

      {/* Tenant List */}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        <List
          dataSource={filteredMemberships}
          renderItem={(membership) => (
            <List.Item
              style={{ 
                padding: '8px 16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: membership.tenantSlug === currentTenantSlug ? '#f6ffed' : 'transparent',
                borderLeft: membership.tenantSlug === currentTenantSlug ? '3px solid #52c41a' : '3px solid transparent',
                opacity: loading ? 0.6 : 1
              }}
              onClick={() => handleTenantSelect(membership.tenantSlug)}
              onMouseEnter={(e) => {
                if (!loading && membership.tenantSlug !== currentTenantSlug) {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && membership.tenantSlug !== currentTenantSlug) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    size={32}
                    style={{ 
                      backgroundColor: membership.orgName ? '#722ed1' : '#f56a00',
                      fontSize: '12px'
                    }}
                    icon={membership.orgName ? <BankOutlined /> : <TeamOutlined />}
                  >
                    {!membership.orgName && generateInitials(membership.tenantName)}
                  </Avatar>
                }
                title={
                  <Space>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: membership.tenantSlug === currentTenantSlug ? 600 : 400
                    }}>
                      {membership.tenantName}
                    </span>
                    {membership.tenantSlug === currentTenantSlug && (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    {membership.orgName && (
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {membership.orgName}
                      </Text>
                    )}
                    <Badge 
                      color={getRoleColor(membership.role)}
                      text={getRoleLabel(membership.role)}
                      style={{ fontSize: '11px' }}
                    />
                  </Space>
                }
              />
              {membership.tenantSlug !== currentTenantSlug && (
                <SwapOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
              )}
            </List.Item>
          )}
        />
      </div>

      {filteredMemberships.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text type="secondary">No workspaces found</Text>
        </div>
      )}
    </div>
  );

  if (!currentTenant) {
    return null;
  }

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      placement="bottomRight"
      className={className}
    >
      <Button 
        type="text" 
        style={{ 
          height: 'auto',
          padding: '4px 8px',
          border: 'none',
          boxShadow: 'none'
        }}
        loading={loading}
      >
        <Space align="center">
          <Avatar 
            size={24}
            style={{ 
              backgroundColor: currentTenant.orgName ? '#722ed1' : '#f56a00',
              fontSize: '10px'
            }}
            icon={currentTenant.orgName ? <BankOutlined /> : <TeamOutlined />}
          >
            {!currentTenant.orgName && generateInitials(currentTenant.tenantName)}
          </Avatar>
          
          <Space direction="vertical" size={0} style={{ textAlign: 'left' }}>
            <Text strong style={{ fontSize: '13px', lineHeight: 1.2 }}>
              {currentTenant.tenantName}
            </Text>
            {currentTenant.orgName && (
              <Text type="secondary" style={{ fontSize: '11px', lineHeight: 1.2 }}>
                {currentTenant.orgName}
              </Text>
            )}
          </Space>
          
          <DownOutlined style={{ fontSize: '10px', color: '#bfbfbf' }} />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default TenantSwitcher;

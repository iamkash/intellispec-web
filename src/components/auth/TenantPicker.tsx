/**
 * Tenant Picker Component
 * 
 * Displays after login when user has multiple tenant memberships.
 * Allows user to select which tenant to access.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Divider,
  Badge,
  Empty
} from 'antd';
import { 
  SearchOutlined, 
  TeamOutlined, 
  BankOutlined,
  RightOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { UserSession } from '../../schemas/tenant/models';

const { Title, Text } = Typography;
const { Search } = Input;

interface TenantPickerProps {
  userSession: UserSession;
  onTenantSelect: (tenantSlug: string) => void;
  loading?: boolean;
  lastSelectedTenant?: string;
}

interface TenantMembership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  orgName?: string;
  role: string;
}

const TenantPicker: React.FC<TenantPickerProps> = ({
  userSession,
  onTenantSelect,
  loading = false,
  lastSelectedTenant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMemberships, setFilteredMemberships] = useState<TenantMembership[]>([]);

  useEffect(() => {
    // Filter memberships based on search term
    const filtered = userSession.memberships.filter(membership =>
      membership.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.orgName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort by: last selected first, then by organization, then by name
    filtered.sort((a, b) => {
      // Prioritize last selected tenant
      if (a.tenantSlug === lastSelectedTenant) return -1;
      if (b.tenantSlug === lastSelectedTenant) return 1;
      
      // Group by organization
      if (a.orgName && b.orgName && a.orgName !== b.orgName) {
        return a.orgName.localeCompare(b.orgName);
      }
      
      // Sort by tenant name
      return a.tenantName.localeCompare(b.tenantName);
    });

    setFilteredMemberships(filtered);
  }, [userSession.memberships, searchTerm, lastSelectedTenant]);

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

  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleTenantClick = (tenantSlug: string) => {
    if (!loading) {
      onTenantSelect(tenantSlug);
    }
  };

  return (
    <div className="tenant-picker-container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 600, 
          minHeight: 500,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Avatar 
            size={64} 
            style={{ 
              backgroundColor: '#1890ff', 
              marginBottom: '16px',
              fontSize: '24px'
            }}
          >
            {generateInitials(userSession.name || userSession.email)}
          </Avatar>
          
          <Title level={3} style={{ margin: '0 0 8px 0' }}>
            Welcome back, {userSession.name || 'User'}!
          </Title>
          
          <Text type="secondary">
            Select a workspace to continue
          </Text>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {userSession.memberships.length > 5 && (
            <Search
              placeholder="Search workspaces..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
          )}

          {filteredMemberships.length === 0 ? (
            <Empty 
              description="No workspaces found"
              style={{ margin: '40px 0' }}
            />
          ) : (
            <List
              dataSource={filteredMemberships}
              renderItem={(membership) => (
                <List.Item
                  style={{ 
                    padding: '16px 20px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.6 : 1
                  }}
                  className="tenant-list-item"
                  onClick={() => handleTenantClick(membership.tenantSlug)}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#fafafa';
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#f0f0f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: '#f56a00',
                          fontSize: '16px'
                        }}
                        icon={membership.orgName ? <BankOutlined /> : <TeamOutlined />}
                      >
                        {!membership.orgName && generateInitials(membership.tenantName)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <span style={{ fontWeight: 600 }}>
                          {membership.tenantName}
                        </span>
                        {membership.tenantSlug === lastSelectedTenant && (
                          <Badge 
                            count={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                            title="Last accessed"
                          />
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        {membership.orgName && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <BankOutlined style={{ marginRight: '4px' }} />
                            {membership.orgName}
                          </Text>
                        )}
                        <Badge 
                          color={getRoleColor(membership.role)}
                          text={getRoleLabel(membership.role)}
                          style={{ fontSize: '12px' }}
                        />
                      </Space>
                    }
                  />
                  <RightOutlined style={{ color: '#bfbfbf' }} />
                </List.Item>
              )}
            />
          )}

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Need access to another workspace? Contact your administrator.
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default TenantPicker;

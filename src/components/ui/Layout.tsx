import * as Icons from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Space, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';
import type { MenuItem, Module } from '../../schemas/module';
import { useModule } from '../containers/ModuleContainer';
import { ModuleBar } from './ModuleBar';
import { ThemeSelector } from './ThemeSelector';
import { HeaderLogo } from './atoms/ThemeLogo';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  logo?: string;
  user?: { name: string; avatar?: string; role?: string };
  footerText?: string;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
  currentMenuItem?: any;
  onMenuClick?: (menuItem: MenuItem & Record<string, any>) => void;
  onModuleSelect?: (module: Module) => void;
  onLogout?: () => Promise<void>;
}

// Resolve Ant Design icon by string name with safe fallback
const resolveIcon = (iconName?: string) => {
  if (!iconName) return (Icons as any).AppstoreOutlined;
  return (Icons as any)[iconName] || (Icons as any).AppstoreOutlined;
};

// Build a hierarchical tree from flat items using parent_key
const buildMenuTree = (items: MenuItem[] = []): MenuItem[] => {
  const byKey = new Map<string, MenuItem & { children?: MenuItem[] }>();
  const roots: (MenuItem & { children?: MenuItem[] })[] = [];

  // Initialize map
  for (const raw of items) {
    byKey.set(raw.key, { ...raw, children: raw.children ? [...raw.children] : [] });
  }

  // Link children to parents
  Array.from(byKey.values()).forEach((item) => {
    if (item.parent_key) {
      const parent = byKey.get(item.parent_key);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        // Orphan; treat as root
        roots.push(item);
      }
    } else {
      roots.push(item);
    }
  });

  // Sort by order recursively
  const sortDeep = (arr: (MenuItem & { children?: MenuItem[] })[]) => {
    arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const n of arr) if (n.children && n.children.length) sortDeep(n.children as any);
  };
  sortDeep(roots);

  return roots as MenuItem[];
};

// Convert MenuItem tree to AntD Menu items
const toAntMenuItems = (items: MenuItem[] = []): any[] =>
  items
    .filter((it) => it.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((it) => {
      const icon = React.createElement(resolveIcon(it.icon));
      if (it.type === 'divider') {
        return { type: 'divider' } as any;
      }
      if ((it as any).children && (it as any).children.length > 0) {
        return {
          key: it.key,
          icon,
          label: it.label,
          children: toAntMenuItems((it as any).children as MenuItem[]),
        } as any;
      }
      return {
        key: it.key,
        icon,
        label: it.label,
      } as any;
    });

// Flatten MenuItem tree for lookup by key
const flattenMenuItems = (items: MenuItem[] = []): MenuItem[] => {
  const out: MenuItem[] = [];
  const walk = (arr: MenuItem[]): void => {
    for (const it of arr) {
      if (it.type === 'divider') continue;
      out.push(it);
      if (it.children && it.children.length) walk(it.children);
    }
  };
  walk(items);
  return out;
};

export const AppLayout: React.FC<LayoutProps> = ({
  children,
  title = 'Intellispec Web',
  logo,
  user,
  footerText,
  collapsed = false,
  onCollapse,
  isMobile = false,
  currentMenuItem,
  onMenuClick,
  onModuleSelect,
  onLogout,
}) => {
  const { availableModules, currentModule, moduleDefinition, selectModule } = useModule();

  const headerHeight = isMobile ? 44 : 48;
  const moduleBarHeight = isMobile ? 36 : 40;

  const handleToggle = useCallback(() => {
    onCollapse?.(!collapsed);
  }, [collapsed, onCollapse]);

  const handleModuleSelect = useCallback(
    (module: Module) => {
      if (onModuleSelect) onModuleSelect(module);
      selectModule(module);
      // On mobile, collapse menu upon module switch for better UX
      if (isMobile && !collapsed) onCollapse?.(true);
    },
    [onModuleSelect, selectModule, isMobile, collapsed, onCollapse]
  );

  const handleLogout = useCallback(async () => {
    if (onLogout) {
      try {
        await onLogout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  }, [onLogout]);

  const menuTree = useMemo(() => buildMenuTree(moduleDefinition?.menu_items || []), [moduleDefinition]);
  const antMenuItems = useMemo(() => toAntMenuItems(menuTree), [menuTree]);
  const flatItems = useMemo(() => flattenMenuItems(menuTree), [menuTree]);

  const onMenuSelect = useCallback(
    ({ key }: { key: React.Key }) => {
      const item = flatItems.find((it) => it.key === key);
      if (item) onMenuClick?.(item as any);
      if (isMobile) onCollapse?.(true);
    },
    [flatItems, onMenuClick, isMobile, onCollapse]
  );

  // Calculate selected keys based on current menu item
  const selectedKeys = useMemo(() => {
    if (currentMenuItem?.key) {
return [currentMenuItem.key];
    }
    return [];
  }, [currentMenuItem]);

  return (
    <Layout
      className="app-layout"
      style={{
        minHeight: '100vh',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
      }}
    >
      {/* Header */}
        <Header
          className="app-layout-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: isMobile ? '0 12px' : '0 16px',
            height: headerHeight,
            background: 'hsl(var(--card))',
            borderBottom: '1px solid hsl(var(--border))',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          <Space size={10} align="center">
            <Button
              type="text"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={handleToggle}
              icon={React.createElement(collapsed ? (Icons as any).MenuUnfoldOutlined : (Icons as any).MenuFoldOutlined)}
              style={{
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))',
                borderRadius: '6px',
                height: 28,
                width: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--accent))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'hsl(var(--background))';
              }}
            />
            <HeaderLogo alt="intelliSPEC Logo" />
            <div className="app-title" style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              {title}
            </div>
          </Space>

          <Space size={10} align="center" className="app-user" style={{ padding: '4px 8px', borderRadius: 8 }}>
            <ThemeSelector />
            {user?.role && (
              <Text style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>{user.role}</Text>
            )}
            <Avatar
              size={28}
              src={user?.avatar}
              style={{
                backgroundColor: 'hsl(var(--primary))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--primary-foreground))',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              {user?.name?.[0] || 'U'}
            </Avatar>
            <Text strong style={{ color: 'hsl(var(--foreground))', fontSize: 13 }}>
              {user?.name}
            </Text>
            {onLogout && (
              <Button
                type="text"
                icon={React.createElement((Icons as any).LogoutOutlined)}
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
                style={{
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  height: 28,
                  width: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--accent))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--background))';
                }}
              />
            )}
          </Space>
        </Header>

      {/* Main area: sidebar directly below header; module bar sits at top of content area */}
      <Layout hasSider style={{ height: `calc(100vh - ${headerHeight}px)`, overflow: 'hidden', background: 'hsl(var(--background))' }}>
        {/* Mobile overlay when sidebar is open (covers main area) */}
        {isMobile && !collapsed && (
          <div className="mobile-sidebar-overlay" onClick={() => onCollapse?.(true)} aria-hidden />
        )}

        {/* Sidebar (no header label) */}
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          collapsedWidth={isMobile ? 0 : 44} // Align collapsed sidebar with header toggle footprint
          width={240}
          style={{
            background: 'hsl(var(--card))',
            borderRight: '1px solid hsl(var(--border))',
            height: '100%',
          }}
          aria-label="Primary navigation"
        >
          <Menu
            mode="inline"
            inlineCollapsed={!!(collapsed && !isMobile)}
            items={antMenuItems as any}
            selectedKeys={selectedKeys}
            onClick={onMenuSelect as any}
            style={{
              background: 'transparent',
              color: 'hsl(var(--foreground))',
              padding: 8,
            }}
          />
        </Sider>

        {/* Right column: module bar on top, content scrolls below */}
        <Layout style={{ height: '100%', background: 'hsl(var(--background))' }}>
          <div
            style={{
              borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              padding: isMobile ? '0 6px' : '0 10px',
              height: moduleBarHeight,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ModuleBar
              modules={availableModules}
              currentModule={currentModule}
              onModuleSelect={handleModuleSelect}
              collapsed={collapsed}
              isMobile={isMobile}
            />
          </div>
          <Content style={{ padding: '8px 6px 6px', minHeight: 0, width: '100%', height: `calc(100% - ${moduleBarHeight}px)`, overflow: 'auto', background: 'hsl(var(--background))' }}>
            <div className="workspace-container" style={{ width: '100%', maxWidth: '100%', padding: 0 }}>
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* Footer */}
      {footerText && (
        <Footer style={{ textAlign: 'center', background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))' }}>
          <Text style={{ color: 'hsl(var(--muted-foreground))' }}>{footerText}</Text>
        </Footer>
      )}
    </Layout>
  );
};

export default AppLayout;

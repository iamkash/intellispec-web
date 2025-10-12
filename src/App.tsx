import { App as AntdApp, ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import React, { useCallback, useEffect, useState } from 'react';
import { LoginShell, defaultLoginMetadata } from './components/auth/LoginShell';
import { LayoutContainer } from './components/containers/LayoutContainer';
import { ModuleContainer, useModule } from './components/containers/ModuleContainer';
import { WorkspaceContainer, WorkspaceProvider } from './components/containers/WorkspaceContainer';
import { initializeRegistries } from './components/library/core/RegistryInitializer';
import { ShellDemo } from './components/pages/ShellDemo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './providers/ThemeProvider';
import './styles/globals.css';
import './styles/theme-icon.css';
import { AssetCrudHandler } from './utils/AssetCrudHandler';
// Simple placeholder component for menu items without workspace
const PlaceholderPage: React.FC<{ title: string; description?: string }> = ({ title, description }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      textAlign: 'center',
      color: 'var(--color-text-secondary)'
    }}>
      <h2 style={{
        fontSize: '2rem',
        marginBottom: '16px',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-family-accent)'
      }}>
        {title}
      </h2>
      {description && (
        <p style={{
          fontSize: '1.1rem',
          marginBottom: '24px',
          maxWidth: '500px',
          lineHeight: '1.6'
        }}>
          {description}
        </p>
      )}
      <div style={{
        padding: '10px',
        backgroundColor: 'hsl(var(--card))',
        borderRadius: '8px',
        border: '1px solid hsl(var(--border))',
        maxWidth: '400px'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          This section is coming soon. Please check back later for updates.
        </p>
      </div>
    </div>
  );
};

// Inner app component that uses the module context
const AppContent: React.FC = () => {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('home/home');
  const [currentMenuItem, setCurrentMenuItem] = useState<any>(null);
  const { moduleDefinition } = useModule();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const handleMenuClick = useCallback((menuItem: any) => {
    console.log('[App] handleMenuClick called with:', menuItem);
    
    // Store the current menu item for reference
    setCurrentMenuItem(menuItem);
    
    // Check if the menu item has a workspace property
    if (menuItem.workspace) {
      console.log('[App] Setting workspace to:', menuItem.workspace);
      
      // Store current workspace in sessionStorage for navigation back support
      // CRITICAL: Read from URL, not state, to get the ACTUAL current workspace
      const currentUrl = new URL(window.location.href);
      const currentWorkspace = currentUrl.searchParams.get('workspace');
      
      if (currentWorkspace && currentWorkspace !== menuItem.workspace) {
        console.log('[App] Storing navigation source (from URL):', currentWorkspace);
        sessionStorage.setItem('navigation-source', JSON.stringify(currentWorkspace));
      } else {
        console.log('[App] No valid navigation source to store', { currentWorkspace, targetWorkspace: menuItem.workspace });
      }
      
      setCurrentWorkspaceId(menuItem.workspace);

      // Reflect selection in URL (?workspace=... [&restoreId=...]) to support single-route deep linking
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('workspace', menuItem.workspace);
        if (menuItem.restoreId) {
          url.searchParams.set('restoreId', menuItem.restoreId);
        } else {
          url.searchParams.delete('restoreId');
        }
        // Clear existing parameters except workspace and restoreId
        const paramsToKeep = ['workspace', 'restoreId'];
        const existingParams = Array.from(url.searchParams.keys());
        existingParams.forEach(param => {
          if (!paramsToKeep.includes(param)) {
            url.searchParams.delete(param);
          }
        });
        
        // Handle additional parameters from navigation payload
        if (menuItem.params) {
          Object.entries(menuItem.params).forEach(([key, value]) => {
            if (value) {
              url.searchParams.set(key, String(value));
            }
          });
        }
        console.log('[App] Updating URL to:', url.toString());
        window.history.pushState({}, '', url.toString());
      } catch (error) {
        console.error('[App] Error updating URL:', error);
      }
    } else {
      console.log('[App] No workspace in menu item, clearing workspace ID');
      // Clear workspace ID to show placeholder
      setCurrentWorkspaceId('');
    }
  }, []);

  // Sync workspace with ?workspace=... query param
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ws = url.searchParams.get('workspace');
      console.log('[App] URL sync effect - workspace from URL:', ws);
      if (ws) {
        console.log('[App] Setting workspace ID from URL:', ws);
        setCurrentWorkspaceId(ws);
      }
    } catch (error) {
      console.error('[App] Error syncing workspace from URL:', error);
    }
  }, []);

  // Auto-select default menu item when module loads
  useEffect(() => {
    // Check if this is a wizard close navigation - if so, don't auto-select default
    const isWizardCloseNavigation = sessionStorage.getItem('wizard-close-navigation');
    if (isWizardCloseNavigation) {
      console.log('[App] Wizard close navigation detected - skipping auto-selection');
      sessionStorage.removeItem('wizard-close-navigation');
      return; // Skip auto-selection
    }
    
    // Don't auto-select if we already have a workspace set (from URL or previous navigation)
    if (currentWorkspaceId && currentWorkspaceId !== 'home/home') {
      console.log('[App] Workspace already set, skipping auto-selection:', currentWorkspaceId);
      return;
    }
    
    if (moduleDefinition?.menu_items) {
      const defaultMenuItem = moduleDefinition.menu_items.find((item: any) => item.is_default);
      if (defaultMenuItem && !currentMenuItem) {
        console.log('[App] Auto-selecting default menu item:', defaultMenuItem);
        handleMenuClick(defaultMenuItem);
      } else {
        console.log('[App] No auto-selection needed:', { 
          hasDefaultMenuItem: !!defaultMenuItem, 
          hasCurrentMenuItem: !!currentMenuItem,
          defaultMenuItem: defaultMenuItem?.workspace,
          currentMenuItem: currentMenuItem?.workspace,
          currentWorkspaceId
        });
      }
    }
  }, [moduleDefinition, currentMenuItem, handleMenuClick, currentWorkspaceId]);

  // Handle form save navigation events
  useEffect(() => {
    const handleFormSaveNavigate = (event: CustomEvent) => {
const { workspace, target } = event.detail;
      const navigationTarget = workspace || target;
      
      if (navigationTarget) {
        const menuItem = {
          key: 'form-save-nav',
          label: 'Return to Dashboard',
          workspace: navigationTarget
        };
        handleMenuClick(menuItem);
      }
    };

    window.addEventListener('form-save-navigate', handleFormSaveNavigate as EventListener);
    
    return () => {
      window.removeEventListener('form-save-navigate', handleFormSaveNavigate as EventListener);
    };
  }, [handleMenuClick]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'hsl(var(--background))'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid hsl(var(--border))',
            borderTop: '2px solid hsl(var(--primary))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginShell 
        metadata={defaultLoginMetadata}
        onAuthenticated={(user, token) => {
// The AuthContext will handle the state update
        }}
        onError={(error) => {
          console.error('Authentication error:', error);
        }}
      />
    );
  }

  // Render content based on menu item
  const renderContent = () => {
    // Check if this is a shell demo component
    if (currentMenuItem?.component === 'shell-demo') {
      return <ShellDemo />;
    }
    
    // Check if this is a workspace
    if (currentWorkspaceId) {
      return (
        <WorkspaceContainer 
          workspaceId={currentWorkspaceId}
          onAction={async (action, payload) => {
// Handle navigation actions from quicklinks
            if (action === 'navigate' && payload?.workspace) {
              const menuItem = {
                key: payload.key,
                label: payload.label,
                route: payload.route,
                workspace: payload.workspace,
                type: payload.type,
                restoreId: payload.restoreId,
                params: payload.params
              };
              handleMenuClick(menuItem);
            } else if (action === 'contextAction') {
              // Handle context menu actions - extract the nested action
              const crudHandler = AssetCrudHandler.getInstance();
              // Pass context for navigation
              crudHandler.setContext({
                onAction: async (contextAction: string, contextPayload: any) => {
                  if (contextAction === 'navigate' && contextPayload?.workspace) {
                    const menuItem = {
                      key: contextPayload.key,
                      label: contextPayload.label,
                      route: contextPayload.route,
                      workspace: contextPayload.workspace,
                      type: contextPayload.type,
                      restoreId: contextPayload.restoreId,
                      params: contextPayload.params
                    };
                    handleMenuClick(menuItem);
                  }
                }
              });
              await crudHandler.handleAction(payload.action, payload);
            } else {
              // Handle direct CRUD operations using AssetCrudHandler
              const crudHandler = AssetCrudHandler.getInstance();
              // Pass context for navigation
              crudHandler.setContext({
                onAction: async (contextAction: string, contextPayload: any) => {
                  if (contextAction === 'navigate' && contextPayload?.workspace) {
                    const menuItem = {
                      key: contextPayload.key,
                      label: contextPayload.label,
                      route: contextPayload.route,
                      workspace: contextPayload.workspace,
                      type: contextPayload.type,
                      restoreId: contextPayload.restoreId,
                      params: contextPayload.params
                    };
                    handleMenuClick(menuItem);
                  }
                }
              });
              await crudHandler.handleAction(action, payload);
            }
          }}
        />
      );
    }
    
    // Default placeholder
    return (
      <PlaceholderPage 
        title={currentMenuItem?.label || 'Page'} 
        description={currentMenuItem?.route ? `Route: ${currentMenuItem.route}` : undefined}
      />
    );
  };

  return (
    <WorkspaceProvider>
      <LayoutContainer
        title=""
        user={{
          name: user ? `${user.firstName} ${user.lastName}` : "User",
          role: user?.roles?.[0]?.name || "User",
          avatar: user?.avatar
        }}
        onMenuClick={handleMenuClick}
        onLogout={logout}
      >
        {renderContent()}
      </LayoutContainer>
    </WorkspaceProvider>
  );
};

const App: React.FC = () => {
  // Initialize registries on app start
  useEffect(() => {
    initializeRegistries();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          // Ensure messages/notifications appear above all content
          zIndexPopupBase: 9999,
        },
      }}
    >
      <AntdApp>
        <ThemeProvider>
          <AuthProvider>
            <ModuleContainer>
              <AppContent />
            </ModuleContainer>
          </AuthProvider>
        </ThemeProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;

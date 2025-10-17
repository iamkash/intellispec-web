import { App as AntdApp, ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LoginShell, defaultLoginMetadata } from './components/auth/LoginShell';
import { LayoutContainer } from './components/containers/LayoutContainer';
import { ModuleContainer, useModule } from './components/containers/ModuleContainer';
import { WorkspaceContainer, WorkspaceProvider } from './components/containers/WorkspaceContainer';
import { initializeRegistries } from './components/library/core/RegistryInitializer';
import { ShellDemo } from './components/pages/ShellDemo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
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
  const [currentMenuItem, setCurrentMenuItem] = useState<any>(null);
  const { currentModule, moduleDefinition } = useModule();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const {
    currentWorkspaceId,
    openWorkspace,
    getLastWorkspaceForModule,
  } = useNavigation();
  const previousModuleIdRef = useRef<string | null>(null);

  const handleMenuClick = useCallback((menuItem: any) => {
    setCurrentMenuItem(menuItem);
    if (menuItem.workspace) {
      const params: Record<string, string> = {};
      if (menuItem.restoreId) {
        params.restoreId = String(menuItem.restoreId);
      }
      if (menuItem.params) {
        Object.entries(menuItem.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params[key] = String(value);
          }
        });
      }

      openWorkspace(menuItem.workspace, {
        params,
        returnTo: currentWorkspaceId ?? null,
      });
    }
  }, [currentWorkspaceId, openWorkspace]);

  // Auto-select default menu item when module loads
  useEffect(() => {
    if (!currentModule) {
      return;
    }

    const moduleId = currentModule.id;
    const previousModuleId = previousModuleIdRef.current;
    const workspaceModuleId = currentWorkspaceId
      ? currentWorkspaceId.split('/')[0]
      : null;
    const moduleChanged = previousModuleId !== moduleId;
    const menuItems = moduleDefinition?.menu_items ?? [];

    const matchingMenuItem =
      menuItems.find((item: any) => item.workspace === currentWorkspaceId) ||
      null;

    if (
      currentWorkspaceId &&
      matchingMenuItem &&
      currentMenuItem?.key !== matchingMenuItem.key
    ) {
      setCurrentMenuItem(matchingMenuItem);
    }

    if (
      moduleChanged ||
      !currentWorkspaceId ||
      workspaceModuleId !== moduleId
    ) {
      const lastWorkspace = getLastWorkspaceForModule(moduleId);
      if (
        moduleChanged &&
        lastWorkspace &&
        lastWorkspace !== currentWorkspaceId
      ) {
        previousModuleIdRef.current = moduleId;
        openWorkspace(lastWorkspace, { replace: true });
        setCurrentMenuItem(
          menuItems.find((item: any) => item.workspace === lastWorkspace) || null
        );
        return;
      }

      const defaultMenuItem =
        menuItems.find((item: any) => item.is_default && item.workspace) ||
        null;

      const moduleDefaultWorkspace = currentModule.default_workspace;
      const moduleDefaultMenuItem =
        moduleDefaultWorkspace
          ? menuItems.find(
              (item: any) => item.workspace === moduleDefaultWorkspace
            ) ||
            {
              key: `${moduleId}-default`,
              label: currentModule.label || 'Default',
              workspace: moduleDefaultWorkspace,
              type: 'item',
            }
          : null;

      const firstModuleWorkspace =
        menuItems.find(
          (item: any) =>
            item.workspace && item.workspace.split('/')[0] === moduleId
        ) || null;

      const fallbackMenuItem =
        defaultMenuItem || moduleDefaultMenuItem || firstModuleWorkspace || null;

      if (fallbackMenuItem?.workspace) {
        previousModuleIdRef.current = moduleId;
        openWorkspace(fallbackMenuItem.workspace, { replace: true });
        setCurrentMenuItem(fallbackMenuItem);
        return;
      }
    }

    if (
      currentWorkspaceId &&
      currentMenuItem?.workspace &&
      currentMenuItem.workspace !== currentWorkspaceId &&
      !matchingMenuItem
    ) {
      setCurrentMenuItem(null);
    } else if (matchingMenuItem && !currentMenuItem) {
      setCurrentMenuItem(matchingMenuItem);
    }

    if (!currentWorkspaceId && currentMenuItem) {
      setCurrentMenuItem(null);
    }

    if (moduleChanged) {
      previousModuleIdRef.current = moduleId;
    }
  }, [
    currentMenuItem,
    currentModule,
    currentWorkspaceId,
    getLastWorkspaceForModule,
    moduleDefinition,
    openWorkspace,
  ]);

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
        setCurrentMenuItem(menuItem);
        openWorkspace(navigationTarget, { replace: false });
      }
    };

    window.addEventListener('form-save-navigate', handleFormSaveNavigate as EventListener);
    
    return () => {
      window.removeEventListener('form-save-navigate', handleFormSaveNavigate as EventListener);
    };
  }, [openWorkspace]);

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
    // Check if this is a workspace
    if (currentMenuItem?.component === 'shell-demo') {
      return <ShellDemo />;
    }

    const shouldRenderWorkspace =
      !!currentWorkspaceId &&
      (!currentMenuItem || currentMenuItem.workspace === currentWorkspaceId);

    if (shouldRenderWorkspace) {
      return (
        <WorkspaceContainer 
          workspaceId={currentWorkspaceId}
          onAction={async (action, payload) => {
            const workspaceTarget = payload?.workspace ?? payload?.workspaceId;
            const returnToTarget = payload?.returnTo ?? currentWorkspaceId ?? null;
            if (action === 'navigate' && workspaceTarget) {
              const menuItem = {
                key: payload.key,
                label: payload.label,
                route: payload.route,
                workspace: workspaceTarget,
                type: payload.type,
                restoreId: payload.restoreId,
                params: payload.params
              };
              setCurrentMenuItem(menuItem);
              const params: Record<string, string> = {};
              if (payload.restoreId) {
                params.restoreId = String(payload.restoreId);
              }
              if (payload.params) {
                Object.entries(payload.params).forEach(([key, value]) => {
                  if (value !== undefined && value !== null) {
                    params[key] = String(value);
                  }
                });
              }
              openWorkspace(workspaceTarget, {
                params,
                returnTo: returnToTarget,
              });
            } else if (action === 'contextAction') {
              // Handle context menu actions - extract the nested action
              const crudHandler = AssetCrudHandler.getInstance();
              // Pass context for navigation
              crudHandler.setContext({
                onAction: async (contextAction: string, contextPayload: any) => {
                  if (contextAction === 'navigate') {
                    const workspaceTarget =
                      contextPayload?.workspace ?? contextPayload?.workspaceId;
                    if (!workspaceTarget) {
                      return;
                    }
                    const menuItem = {
                      key: contextPayload.key,
                      label: contextPayload.label,
                      route: contextPayload.route,
                      workspace: workspaceTarget,
                      type: contextPayload.type,
                      restoreId: contextPayload.restoreId,
                      params: contextPayload.params
                    };
                    setCurrentMenuItem(menuItem);
                    const params: Record<string, string> = {};
                    if (contextPayload?.restoreId) {
                      params.restoreId = String(contextPayload.restoreId);
                    }
                    if (contextPayload?.params) {
                      Object.entries(contextPayload.params).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                          params[key] = String(value);
                        }
                      });
                    }
                    const ctxReturnTo =
                      contextPayload?.returnTo ?? currentWorkspaceId ?? null;
                    openWorkspace(workspaceTarget, {
                      params,
                      returnTo: ctxReturnTo,
                    });
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
                  if (contextAction === 'navigate') {
                    const workspaceTarget = contextPayload?.workspace ?? contextPayload?.workspaceId;
                    if (!workspaceTarget) {
                      return;
                    }
                    const menuItem = {
                      key: contextPayload.key,
                      label: contextPayload.label,
                      route: contextPayload.route,
                      workspace: workspaceTarget,
                      type: contextPayload.type,
                      restoreId: contextPayload.restoreId,
                      params: contextPayload.params
                    };
                    setCurrentMenuItem(menuItem);
                    const params: Record<string, string> = {};
                    if (contextPayload?.restoreId) {
                      params.restoreId = String(contextPayload.restoreId);
                    }
                    if (contextPayload?.params) {
                      Object.entries(contextPayload.params).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                          params[key] = String(value);
                        }
                      });
                    }
                    const ctxReturnTo =
                      contextPayload?.returnTo ?? currentWorkspaceId ?? null;
                    openWorkspace(workspaceTarget, {
                      params,
                      returnTo: ctxReturnTo,
                    });
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
        description={
          currentMenuItem?.route
            ? `Route: ${currentMenuItem.route}`
            : undefined
        }
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
        currentMenuItem={currentMenuItem}
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
              <NavigationProvider>
                <AppContent />
              </NavigationProvider>
            </ModuleContainer>
          </AuthProvider>
        </ThemeProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;

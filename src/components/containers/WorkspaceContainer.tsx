import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { WorkspaceContext as IWorkspaceContext, WorkspaceDefinition } from '../../schemas/workspace';
import { GadgetWorkspaceRenderer } from '../ui/workspace/GadgetWorkspaceRenderer';
/**
 * WorkspaceContainer Component
 * 
 * Loads workspace definitions and renders them using the unified grid system.
 * All gadgets are rendered through GadgetWorkspaceRenderer which uses
 * GridLayoutRenderer for consistent 12-column grid layout.
 */

const WorkspaceContext = createContext<IWorkspaceContext | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (workspaceId: string) => {
setIsLoading(true);
    setError(null);
    
    // Clear OpenAI conversation state when switching workspaces
    try {
      (window as any).__previousResponseId = null;
} catch (err) {
      console.warn('Failed to clear OpenAI state:', err);
    }
    
    try {
const workspaceUrl = `/data/workspaces/${workspaceId}.json`;
      const response = await fetch(workspaceUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load workspace: ${response.status} ${response.statusText}`);
      }
      
      const workspaceData: WorkspaceDefinition = await response.json();
setCurrentWorkspace(workspaceData);
    } catch (err) {
      console.error('Error loading workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
      setCurrentWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (currentWorkspace) {
      await loadWorkspace(currentWorkspace.id || '');
    }
  }, [currentWorkspace, loadWorkspace]);

  const executeAction = useCallback(async (action: string, payload?: any) => {
switch (action) {
      case 'refresh':
        await refreshWorkspace();
        break;
      default:
break;
    }
  }, [refreshWorkspace]);

  const contextValue: IWorkspaceContext = {
    currentWorkspace,
    isLoading,
    error,
    loadWorkspace,
    refreshWorkspace,
    executeAction,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

interface WorkspaceContainerProps {
  workspaceId: string;
  onAction?: (action: string, payload?: any) => void;
  className?: string;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  workspaceId,
  onAction,
  className = '',
}) => {
  const { currentWorkspace, isLoading, error, loadWorkspace } = useWorkspace();

  useEffect(() => {
    const currentId = currentWorkspace?.id;
    if (workspaceId && workspaceId !== currentId) {
      loadWorkspace(workspaceId);
    }
  }, [workspaceId, currentWorkspace?.id, loadWorkspace]);

  if (isLoading) {
    return (
      <div 
        className={`workspace-loading ${className}`}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: 'var(--color-text-secondary)'
        }}
      >
        <div>Loading workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`workspace-error ${className}`}
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--color-error)'
        }}
      >
        <h3>Error Loading Workspace</h3>
        <p>{error}</p>
        <button onClick={() => loadWorkspace(workspaceId)}>Retry</button>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div 
        className={`workspace-not-found ${className}`}
        style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}
      >
        <h3>Workspace Not Found</h3>
        <p>Workspace "{workspaceId}" could not be loaded.</p>
      </div>
    );
  }

  // Use the new GadgetWorkspaceRenderer for the entire workspace
  return (
    <GadgetWorkspaceRenderer
      workspace={currentWorkspace}
      onAction={onAction}
      className={className}
    />
  );
};

export default WorkspaceContainer; 
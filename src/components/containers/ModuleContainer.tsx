import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Module, ModuleDefinition, ModuleContainerProps } from '../../schemas/module';

/**
 * Extended Module Context with actions
 */
interface ModuleContextValue {
  currentModule: Module | null;
  moduleDefinition: ModuleDefinition | null;
  availableModules: Module[];
  isLoading: boolean;
  error?: string;
  selectModule: (module: Module) => Promise<void>;
  reloadModules: () => Promise<void>;
  clearError: () => void;
}

/**
 * Module Context
 * 
 * Provides module state and actions throughout the application
 */
const ModuleContextProvider = createContext<ModuleContextValue | null>(null);

export const useModule = () => {
  const context = useContext(ModuleContextProvider);
  if (!context) {
    throw new Error('useModule must be used within a ModuleContainer');
  }
  return context;
};

/**
 * ModuleContainer Component
 * 
 * Manages module loading, state, and provides context for the module system
 */
export const ModuleContainer: React.FC<ModuleContainerProps> = ({
  children,
  onModuleChange,
}) => {
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [moduleDefinition, setModuleDefinition] = useState<ModuleDefinition | null>(null);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Load module definition
  const loadModuleDefinition = useCallback(async (module: Module): Promise<ModuleDefinition | null> => {
    try {
      const response = await fetch(module.menu_url);
      if (!response.ok) {
        throw new Error(`Failed to load module definition: ${response.statusText}`);
      }
      
      const definition = await response.json();
      return definition;
    } catch (err) {
      console.error(`Error loading module definition for ${module.id}:`, err);
      return null;
    }
  }, []);

  // Select a module and load its definition
  const selectModule = useCallback(async (module: Module) => {
    // Don't reload if the same module is already selected
    if (currentModule && currentModule.id === module.id) {
return;
    }

    try {
setIsLoading(true);
      setError(undefined);
      
      const definition = await loadModuleDefinition(module);
      
      setCurrentModule(module);
      setModuleDefinition(definition);
      
      // Notify parent component of module change
      onModuleChange?.(module);
    } catch (err) {
      console.error('Error selecting module:', err);
      setError(err instanceof Error ? err.message : 'Failed to select module');
    } finally {
      setIsLoading(false);
    }
  }, [currentModule, loadModuleDefinition, onModuleChange]);

  // Load available modules from JSON
  const loadModules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      const response = await fetch('/data/modules.json');
      if (!response.ok) {
        throw new Error(`Failed to load modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAvailableModules(data.modules || []);
      
      // Check if there's a workspace parameter that indicates which module to load
      let targetModule: Module | null = null;
      
      try {
        const url = new URL(window.location.href);
        const workspaceParam = url.searchParams.get('workspace');
        
        if (workspaceParam) {
          const workspaceModuleId = workspaceParam.split('/')[0];
const enabledModules = data.modules.filter((m: Module) => m.enabled);
          targetModule = enabledModules.find((m: Module) => m.id === workspaceModuleId) || null;
          
          if (targetModule) {
} else {
}
        }
      } catch (error) {
        console.warn('Error parsing workspace parameter:', error);
      }
      
      // Set target module or fall back to default module (first enabled module or 'home')
      if (!targetModule) {
        const enabledModules = data.modules.filter((m: Module) => m.enabled);
        targetModule = enabledModules.find((m: Module) => m.id === 'home') || enabledModules[0];
      }
      
      if (targetModule) {
        // Load the target module definition
        try {
const definition = await loadModuleDefinition(targetModule);
          setCurrentModule(targetModule);
          setModuleDefinition(definition);
          onModuleChange?.(targetModule);
        } catch (err) {
          console.error('Error loading target module:', err);
        }
      }
    } catch (err) {
      console.error('Error loading modules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  }, [loadModuleDefinition, onModuleChange]);

  // Clear error
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  // Initialize modules on mount
  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Context value
  const contextValue: ModuleContextValue = {
    currentModule,
    moduleDefinition,
    availableModules,
    isLoading,
    error,
    selectModule,
    reloadModules: loadModules,
    clearError,
  };

  return (
    <ModuleContextProvider.Provider value={contextValue}>
      {children}
    </ModuleContextProvider.Provider>
  );
};

// Export additional hook for module actions (deprecated - use useModule instead)
export const useModuleActions = () => {
  console.warn('useModuleActions is deprecated. Use useModule instead.');
  return useModule();
}; 
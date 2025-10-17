import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  NavigateBackOptions,
  NavigateOptions,
  NavigationContextValue,
  NavigationParams,
  ReturnTarget,
  WorkspaceNavigationEventDetail,
} from '../navigation/types';

type NavigationState = {
  currentWorkspaceId: string | null;
  history: string[];
  lastWorkspaceByModule: Record<string, string>;
  workspaceModuleMap: Record<string, string>;
  returnTargets: ReturnTarget[];
};

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined
);

const getModuleFromWorkspace = (workspaceId: string | null): string | null => {
  if (!workspaceId) return null;
  const [module] = workspaceId.split('/');
  return module || null;
};

const normalizeParams = (
  params?: NavigationParams
): Record<string, string> | undefined => {
  if (!params) return undefined;
  const normalized: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      normalized[key] = String(value);
    }
  });
  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const buildWorkspaceUrl = (
  workspaceId: string,
  params?: NavigationParams
): string => {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('workspace', workspaceId);

  const normalizedParams = normalizeParams(params);
  if (normalizedParams) {
    Object.entries(normalizedParams).forEach(([key, value]) => {
      if (key !== 'workspace') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
};

const initialState = (): NavigationState => {
  const initialWorkspace = (() => {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('workspace');
    } catch {
      return null;
    }
  })();

  const moduleId = getModuleFromWorkspace(initialWorkspace);

  return {
    currentWorkspaceId: initialWorkspace,
    history: initialWorkspace ? [initialWorkspace] : [],
    lastWorkspaceByModule: moduleId && initialWorkspace
      ? { [moduleId]: initialWorkspace }
      : {},
    workspaceModuleMap: moduleId && initialWorkspace
      ? { [initialWorkspace]: moduleId }
      : {},
    returnTargets: [],
  };
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<NavigationState>(() => initialState());
  const isInternalNavigationRef = useRef(false);

  const applyNavigation = useCallback(
    (
      workspaceId: string,
      options: NavigateOptions = {},
      mode: 'push' | 'replace' = 'push'
    ) => {
      setState((prev) => {
        const replace = options.replace ?? mode === 'replace';
        const moduleOverride = options.moduleId ?? prev.workspaceModuleMap[workspaceId];
        const moduleId = moduleOverride ?? getModuleFromWorkspace(workspaceId);

        const nextHistory = (() => {
          if (replace && prev.history.length > 0) {
            const clone = prev.history.slice(0, prev.history.length - 1);
            clone.push(workspaceId);
            return clone;
          }
          if (prev.history.length === 0) {
            return [workspaceId];
          }
          const last = prev.history[prev.history.length - 1];
          if (last === workspaceId) {
            return prev.history;
          }
          return [...prev.history, workspaceId];
        })();

        const lastWorkspaceByModule = moduleId
          ? { ...prev.lastWorkspaceByModule, [moduleId]: workspaceId }
          : prev.lastWorkspaceByModule;

        const workspaceModuleMap = moduleId
          ? { ...prev.workspaceModuleMap, [workspaceId]: moduleId }
          : prev.workspaceModuleMap;

        const returnTargets =
          options.returnTo &&
          options.returnTo !== workspaceId &&
          prev.returnTargets[prev.returnTargets.length - 1]?.workspaceId !==
            options.returnTo
            ? [
                ...prev.returnTargets,
                { workspaceId: options.returnTo, params: undefined },
              ]
            : prev.returnTargets;

        return {
          currentWorkspaceId: workspaceId,
          history: nextHistory,
          lastWorkspaceByModule,
          workspaceModuleMap,
          returnTargets,
        };
      });

      const url = buildWorkspaceUrl(workspaceId, options.params);
      isInternalNavigationRef.current = true;
      if (options.replace || mode === 'replace') {
        window.history.replaceState({}, '', url);
      } else {
        window.history.pushState({}, '', url);
      }
      isInternalNavigationRef.current = false;
    },
    []
  );

  const openWorkspace = useCallback(
    (workspaceId: string, options?: NavigateOptions) => {
      applyNavigation(workspaceId, options);
    },
    [applyNavigation]
  );

  const getLastWorkspaceForModule = useCallback(
    (moduleId: string) => state.lastWorkspaceByModule[moduleId],
    [state.lastWorkspaceByModule]
  );

  const pushReturnTarget = useCallback(
    (workspaceId: string, params?: NavigationParams) => {
      setState((prev) => ({
        ...prev,
        returnTargets: [
          ...prev.returnTargets,
          { workspaceId, params: normalizeParams(params) },
        ],
      }));
    },
    []
  );

  const clearReturnTargets = useCallback(() => {
    setState((prev) => ({ ...prev, returnTargets: [] }));
  }, []);

  const navigateBack = useCallback(
    (options?: NavigateBackOptions) => {
      let resolvedTarget: ReturnTarget | undefined;
      let mode: 'replace' | 'push' = 'replace';
      setState((prev) => {
        if (prev.returnTargets.length > 0) {
          resolvedTarget = prev.returnTargets[prev.returnTargets.length - 1];
          const moduleId = getModuleFromWorkspace(resolvedTarget.workspaceId);
          const lastWorkspaceByModule = moduleId
            ? {
                ...prev.lastWorkspaceByModule,
                [moduleId]: resolvedTarget.workspaceId,
              }
            : prev.lastWorkspaceByModule;
          const workspaceModuleMap = moduleId
            ? {
                ...prev.workspaceModuleMap,
                [resolvedTarget.workspaceId]: moduleId,
              }
            : prev.workspaceModuleMap;

          return {
            currentWorkspaceId: resolvedTarget.workspaceId,
            history:
              prev.history.length > 0
                ? [
                    ...prev.history.slice(0, prev.history.length - 1),
                    resolvedTarget.workspaceId,
                  ]
                : [resolvedTarget.workspaceId],
            lastWorkspaceByModule,
            workspaceModuleMap,
            returnTargets: prev.returnTargets.slice(0, -1),
          };
        }

        if (prev.history.length > 1) {
          const workspaceId = prev.history[prev.history.length - 2];
          resolvedTarget = { workspaceId };
          const moduleId = getModuleFromWorkspace(workspaceId);
          const lastWorkspaceByModule = moduleId
            ? { ...prev.lastWorkspaceByModule, [moduleId]: workspaceId }
            : prev.lastWorkspaceByModule;
          const workspaceModuleMap = moduleId
            ? { ...prev.workspaceModuleMap, [workspaceId]: moduleId }
            : prev.workspaceModuleMap;
          return {
            currentWorkspaceId: workspaceId,
            history: prev.history.slice(0, -1),
            lastWorkspaceByModule,
            workspaceModuleMap,
            returnTargets: prev.returnTargets,
          };
        }

        if (options?.fallbackWorkspace) {
          resolvedTarget = { workspaceId: options.fallbackWorkspace };
          const moduleId = getModuleFromWorkspace(resolvedTarget.workspaceId);
          const lastWorkspaceByModule = moduleId
            ? {
                ...prev.lastWorkspaceByModule,
                [moduleId]: resolvedTarget.workspaceId,
              }
            : prev.lastWorkspaceByModule;
          const workspaceModuleMap = moduleId
            ? {
                ...prev.workspaceModuleMap,
                [resolvedTarget.workspaceId]: moduleId,
              }
            : prev.workspaceModuleMap;
          mode = prev.history.length === 0 ? 'push' : 'replace';
          return {
            currentWorkspaceId: resolvedTarget.workspaceId,
            history:
              prev.history.length === 0
                ? [resolvedTarget.workspaceId]
                : [
                    ...prev.history.slice(0, prev.history.length - 1),
                    resolvedTarget.workspaceId,
                  ],
            lastWorkspaceByModule,
            workspaceModuleMap,
            returnTargets: prev.returnTargets,
          };
        }

        return prev;
      });

      if (resolvedTarget) {
        const url = buildWorkspaceUrl(
          resolvedTarget.workspaceId,
          resolvedTarget.params
        );
        isInternalNavigationRef.current = true;
        if (mode === 'replace') {
          window.history.replaceState({}, '', url);
        } else {
          window.history.pushState({}, '', url);
        }
        isInternalNavigationRef.current = false;
        return true;
      }
      return false;
    },
    []
  );

  useEffect(() => {
    const handler = () => {
      if (isInternalNavigationRef.current) {
        return;
      }
      try {
        const url = new URL(window.location.href);
        const workspace = url.searchParams.get('workspace');
        if (!workspace) {
          setState((prev) => ({
            ...prev,
            currentWorkspaceId: null,
          }));
          return;
        }

        setState((prev) => {
          if (prev.currentWorkspaceId === workspace) {
            return prev;
          }
          const moduleId = getModuleFromWorkspace(workspace);
          const lastWorkspaceByModule = moduleId
            ? { ...prev.lastWorkspaceByModule, [moduleId]: workspace }
            : prev.lastWorkspaceByModule;
          const workspaceModuleMap = moduleId
            ? { ...prev.workspaceModuleMap, [workspace]: moduleId }
            : prev.workspaceModuleMap;

          return {
            currentWorkspaceId: workspace,
            history: [...prev.history, workspace],
            lastWorkspaceByModule,
            workspaceModuleMap,
            returnTargets: prev.returnTargets,
          };
        });
      } catch {
        // ignore malformed URLs
      }
    };

    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceNavigationEventDetail>).detail;
      if (!detail) {
        return;
      }
      const workspaceId = detail.workspaceId || detail.workspace;
      if (!workspaceId) {
        return;
      }
      openWorkspace(workspaceId, {
        params: detail.params,
        replace: detail.replace,
        returnTo: detail.returnTo ?? null,
      });
    };

    window.addEventListener('app-navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('app-navigate', handleNavigate as EventListener);
    };
  }, [openWorkspace]);


  const value = useMemo<NavigationContextValue>(() => {
    const currentModuleId = getModuleFromWorkspace(state.currentWorkspaceId);
    return {
      currentWorkspaceId: state.currentWorkspaceId,
      currentModuleId,
      openWorkspace,
      navigateBack,
      getLastWorkspaceForModule,
      pushReturnTarget,
      clearReturnTargets,
    };
  }, [
    state.currentWorkspaceId,
    openWorkspace,
    navigateBack,
    getLastWorkspaceForModule,
    pushReturnTarget,
    clearReturnTargets,
  ]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

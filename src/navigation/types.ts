export type NavigationParams = Record<
  string,
  string | number | boolean | undefined
>;

export interface NavigateOptions {
  params?: NavigationParams;
  replace?: boolean;
  returnTo?: string | null;
  moduleId?: string | null;
}

export interface NavigateBackOptions {
  fallbackWorkspace?: string;
}

export interface ReturnTarget {
  workspaceId: string;
  params?: NavigationParams;
}

export interface WorkspaceNavigationEventDetail {
  workspace?: string;
  workspaceId?: string;
  params?: NavigationParams;
  returnTo?: string | null;
  replace?: boolean;
}

export interface NavigationContextValue {
  currentWorkspaceId: string | null;
  currentModuleId: string | null;
  openWorkspace: (workspaceId: string, options?: NavigateOptions) => void;
  navigateBack: (options?: NavigateBackOptions) => boolean;
  getLastWorkspaceForModule: (moduleId: string) => string | undefined;
  pushReturnTarget: (workspaceId: string, params?: NavigationParams) => void;
  clearReturnTargets: () => void;
}

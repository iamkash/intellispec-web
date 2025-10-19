/**
 * Type definitions for Timeline Gadget
 * All interfaces are metadata-driven - no hardcoded business logic
 */

import { GadgetConfig } from "../../base";

export interface TimelineItemConfig {
  titlePath: string;
  descriptionPath?: string;
  datePath?: string;
  statusPath?: string;
  durationPath?: string;
  dependenciesPath?: string;
  iconPath?: string;
}

export interface StatusColorConfig {
  [status: string]: string;
}

export interface LabelsConfig {
  emptyState?: string;
  loadingMessage?: string;
  errorMessage?: string;
  noDateLabel?: string;
  noDurationLabel?: string;
  daysLabel?: string;
  dependsOnLabel?: string;
}

export interface TimelineGadgetConfig extends GadgetConfig {
  dataUrl: string;
  dataPath?: string;
  itemsPath?: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  itemConfig: TimelineItemConfig;
  statusColors?: StatusColorConfig;
  showDates?: boolean;
  showDuration?: boolean;
  showDependencies?: boolean;
  showStatus?: boolean;
  labels?: LabelsConfig;
  
  // ✅ OPTIMIZATION: Performance options
  debounceMs?: number; // Debounce delay for status changes (default: 300ms)
  enableVirtualization?: boolean; // Use virtual scrolling for 100+ items (requires react-window)
  itemHeight?: number; // Height of each item for virtualization (default: 100px)
  containerHeight?: number; // Container height for virtualization (default: 600px)
  usePatchApi?: boolean; // Use PATCH instead of PUT for updates (90% data reduction, requires backend support)
}

export interface TimelineItem {
  title: string;
  description?: string;
  date?: string;
  status?: string;
  duration?: number;
  dependencies?: string;
  icon?: string;
  id?: string;
}

export interface TimelineItemActions {
  onStatusChange?: (itemId: string, newStatus: string) => void;
  onAddLog?: (itemId: string) => void;
  onAddComment?: (itemId: string) => void;
}


/**
 * Timeline Hooks
 * Centralized exports for all timeline-related hooks
 */

export { useDocumentUpdater } from "./useDocumentUpdater";
export type { DocumentUpdaterOptions } from "./useDocumentUpdater";

export { useMilestoneActions } from "./useMilestoneActions";
export type { UseMilestoneActionsOptions } from "./useMilestoneActions";

export { useDebouncedCallback, useDebouncedValue } from "./useDebounced";

export { 
  useSharedDocument, 
  clearDocumentCache, 
  clearDocumentFromCache 
} from "./useSharedDocument";


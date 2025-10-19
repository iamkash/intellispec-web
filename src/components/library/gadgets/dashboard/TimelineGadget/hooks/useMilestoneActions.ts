/**
 * Milestone Actions Hook
 * Centralized logic for milestone operations (status updates, logs, comments)
 */

import { useCallback } from "react";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { BaseGadget } from "../../../base"; // Import for makeAuthenticatedFetch
import {
  updateMilestoneStatus,
  addMilestoneEntry,
  getMilestoneDisplayName,
} from "../utils/milestoneUtils";
import { navigateToParent } from "../utils/documentNavigator";
import { useDocumentUpdater, DocumentUpdaterOptions } from "./useDocumentUpdater";

export interface UseMilestoneActionsOptions extends DocumentUpdaterOptions {
  itemsPath?: string;
  usePatchApi?: boolean; // ✅ PATCH optimization flag
}

export const useMilestoneActions = (options: UseMilestoneActionsOptions) => {
  const { itemsPath, ...docUpdaterOptions } = options;
  const { isUpdating, executeUpdate, executePatchUpdate } = useDocumentUpdater(docUpdaterOptions);
  
  // ✅ HIGH PRIORITY OPTIMIZATION: Get author from auth context
  const { user } = useAuth();
  const authorName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : "Unknown User";

  /**
   * Update milestone status
   * ✅ OPTIMIZATION: Use PATCH when available for 90% data reduction
   */
  const handleStatusChange = useCallback(
    async (itemId: string, newStatus: string): Promise<boolean> => {
      // ❌ DISABLED: PATCH approach creates data inconsistency
      // The wizard document stores milestone data in multiple locations:
      // - summary.scheduleMilestones (display data)
      // - data.wizardState.sections[].formData.scheduleMilestones (wizard form data)
      // - data.formData.scheduleMilestones (backup)
      // 
      // PATCH only updates one location, breaking the single source of truth.
      // We need PUT to update ALL locations consistently.
      
      if (options.usePatchApi) {
        console.warn("[useMilestoneActions] PATCH disabled - causes data inconsistency. Using PUT for single source of truth.");
      }
      
      // Fallback to full document update
      return executeUpdate(
        (document) => {
          // Get milestone name from display data for matching
          const navResult = itemsPath
            ? navigateToParent(document, itemsPath, {
                dataPath: options.dataPath,
              })
            : null;

          let milestoneName: string | undefined;

          if (navResult) {
            const milestones = navResult.parent[navResult.key];
            if (Array.isArray(milestones)) {
              const milestone = milestones.find(
                (m: any, idx: number) =>
                  (m.id || m._id || String(idx)) === itemId
              );
              if (milestone) {
                milestoneName = getMilestoneDisplayName(milestone);
              }
            }
          }

          // Update across all locations
          return updateMilestoneStatus(document, itemId, newStatus, milestoneName);
        },
        {
          successMessage: `Status updated to ${newStatus}`,
          skipRefresh: false,
        }
      );
    },
    [executeUpdate, executePatchUpdate, itemsPath, options.dataPath, options.usePatchApi]
  );

  /**
   * Add log or comment to milestone
   * ✅ OPTIMIZATION: Author now comes from auth context
   */
  const handleAddEntry = useCallback(
    async (
      itemId: string,
      content: string,
      type: "log" | "comment"
    ): Promise<boolean> => {
      if (!content.trim()) {
        return false;
      }

      return executeUpdate(
        (document) => {
          // Get milestone name from display data
          const navResult = itemsPath
            ? navigateToParent(document, itemsPath, {
                dataPath: options.dataPath,
              })
            : null;

          let milestoneName: string | undefined;

          if (navResult) {
            const milestones = navResult.parent[navResult.key];
            if (Array.isArray(milestones)) {
              const milestone = milestones.find(
                (m: any, idx: number) =>
                  (m.id || m._id || String(idx)) === itemId
              );
              if (milestone) {
                milestoneName = getMilestoneDisplayName(milestone);
              }
            }
          }

          // Create entry with authenticated user
          const entry = {
            content,
            timestamp: new Date().toISOString(),
            author: authorName,
          };

          // Add across all locations
          return addMilestoneEntry(document, itemId, entry, type, milestoneName);
        },
        {
          successMessage: `${type === "log" ? "Log" : "Comment"} added successfully`,
          skipRefresh: false,
        }
      );
    },
    [executeUpdate, itemsPath, options.dataPath, authorName]
  );

  return {
    isUpdating,
    handleStatusChange,
    handleAddEntry,
  };
};


/**
 * Tour Hook
 * Manages guided tour/walkthrough for the portfolio gadget using Driver.js
 * Styled with shadcn/ui theme colors and Ant Design icons
 */

import { useCallback, useEffect, useRef } from "react";
import { driver, DriveStep, Driver, Config } from "driver.js";
import "driver.js/dist/driver.css";
import "../PortfolioTour.css"; // Custom theme styles
import ReactDOMServer from "react-dom/server";
import React from "react";
import {
  SearchOutlined,
  SortAscendingOutlined,
  GroupOutlined,
  HeartOutlined,
  AppstoreOutlined,
  SaveOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";

export interface TourConfig {
  onComplete?: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  allowClose?: boolean;
  storageKey?: string;
}

export const useTour = (config?: TourConfig) => {
  const driverRef = useRef<Driver | null>(null);
  const {
    onComplete,
    onSkip,
    showProgress = true,
    allowClose = true,
    storageKey = "portfolio-tour-completed",
  } = config || {};

  // Check if user has completed the tour before
  const hasCompletedTour = useCallback((): boolean => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  }, [storageKey]);

  // Mark tour as completed
  const markTourCompleted = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.error("Failed to mark tour as completed:", error);
    }
  }, [storageKey]);

  // Reset tour (for testing or when user wants to see it again)
  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to reset tour:", error);
    }
  }, [storageKey]);

  // Helper to create title with icon
  const createTitle = (IconComponent: any, text: string): string => {
    const iconElement = React.createElement(IconComponent);
    return `<span style="display: flex; align-items: center; gap: 8px;">${ReactDOMServer.renderToStaticMarkup(
      iconElement
    )}<span>${text}</span></span>`;
  };

  // Define tour steps
  const getTourSteps = useCallback((): DriveStep[] => {
    return [
      // Introduction
      {
        popover: {
          title: createTitle(RocketOutlined, "Welcome to Portfolio Gadget"),
          description:
            "Let's take a quick tour of all the powerful features available to help you manage your projects efficiently.",
          side: "bottom",
          align: "center",
        },
      },

      // Search
      {
        element: '[data-tour="search-input"]',
        popover: {
          title: createTitle(SearchOutlined, "Search"),
          description:
            "Quickly find projects by searching across titles, codes, types, and other visible fields. The search updates instantly as you type.",
          side: "bottom",
          align: "start",
        },
      },

      // Sort
      {
        element: '[data-tour="sort-select"]',
        popover: {
          title: createTitle(SortAscendingOutlined, "Sort Projects"),
          description:
            "Sort projects by any field like name, date, priority, or type. Click the arrow button to switch between ascending and descending order.",
          side: "bottom",
          align: "start",
        },
      },

      // Group By
      {
        element: '[data-tour="group-by-select"]',
        popover: {
          title: createTitle(GroupOutlined, "Group By"),
          description:
            "Organize projects into collapsible groups by type, status, priority, or any other field. Perfect for managing large portfolios!",
          side: "bottom",
          align: "start",
        },
      },

      // Favorites
      {
        element: '[data-tour="favorites-button"]',
        popover: {
          title: createTitle(HeartOutlined, "Favorites"),
          description:
            "Star your favorite projects and filter to show only favorites. Your selections are saved automatically.",
          side: "bottom",
          align: "start",
        },
      },

      // View Modes
      {
        element: '[data-tour="view-modes"]',
        popover: {
          title: createTitle(AppstoreOutlined, "View Modes"),
          description:
            "Switch between Grid (cards), List (compact), Table (detailed), or Kanban (swim lanes) views. Each view mode is optimized for different workflows.",
          side: "bottom",
          align: "start",
        },
      },

      // Save Preferences
      {
        element: '[data-tour="save-preferences"]',
        popover: {
          title: createTitle(SaveOutlined, "Save Preferences"),
          description:
            "Save your current filters, sort, grouping, and view mode. Your preferences are restored automatically when you return!",
          side: "bottom",
          align: "start",
        },
      },

      // Reset
      {
        element: '[data-tour="reset-button"]',
        popover: {
          title: createTitle(ReloadOutlined, "Reset"),
          description:
            "Clear all filters and reload fresh data from the server. Perfect for starting over or getting the latest updates.",
          side: "bottom",
          align: "start",
        },
      },

      // Cards
      {
        element: '[data-tour="portfolio-cards"]',
        popover: {
          title: createTitle(FileTextOutlined, "Project Cards"),
          description:
            "Each card shows key project information. Click the heart icon to favorite, click the card to open details. Recently viewed items show a dot.",
          side: "top",
          align: "center",
        },
      },

      // Completion
      {
        popover: {
          title: createTitle(CheckCircleOutlined, "You're All Set!"),
          description:
            "You now know all the features! The gadget will remember your preferences, so customize it to your workflow. Click 'Done' to get started!",
          side: "bottom",
          align: "center",
        },
      },
    ];
  }, []);

  // Initialize driver
  useEffect(() => {
    const driverConfig: Config = {
      showProgress: showProgress,
      allowClose: allowClose,
      showButtons: ["next", "previous"],
      nextBtnText: "Next",
      prevBtnText: "Previous",
      doneBtnText: "Got it!",
      progressText: "Step {{current}} of {{total}}",
      popoverClass: "portfolio-tour-popover",
      overlayOpacity: 0.75,
      smoothScroll: true,
      onDestroyStarted: () => {
        if (driverRef.current) {
          // Check if user completed or skipped
          const currentStep = driverRef.current.getActiveIndex();
          const totalSteps = getTourSteps().length;

          if (currentStep === totalSteps - 1) {
            // Completed
            markTourCompleted();
            onComplete?.();
          } else {
            // Skipped
            onSkip?.();
          }

          driverRef.current.destroy();
        }
      },
    };

    driverRef.current = driver(driverConfig);

    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [
    showProgress,
    allowClose,
    getTourSteps,
    markTourCompleted,
    onComplete,
    onSkip,
  ]);

  // Start tour
  const startTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.setSteps(getTourSteps());
      driverRef.current.drive();
    }
  }, [getTourSteps]);

  // Auto-start tour for first-time users
  const startTourIfFirstTime = useCallback(() => {
    if (!hasCompletedTour()) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        startTour();
      }, 500);
    }
  }, [hasCompletedTour, startTour]);

  return {
    startTour,
    startTourIfFirstTime,
    hasCompletedTour: hasCompletedTour(),
    resetTour,
    markTourCompleted,
  };
};


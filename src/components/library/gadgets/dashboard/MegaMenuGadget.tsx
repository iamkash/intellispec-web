import * as Icons from "@ant-design/icons";
import {
  AppstoreOutlined,
  BarsOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  HeartFilled,
  HeartOutlined,
  SearchOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import {
  BaseGadget,
  GadgetConfig,
  GadgetContext,
  GadgetMetadata,
  GadgetSchema,
  GadgetType,
} from "../base";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface MenuItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  type: string;
  workspace: string;
  route?: string;
  category: string;
  tags: string[];
}

interface MegaMenuGadgetConfig extends GadgetConfig {
  dataUrl: string;
  dataPath: string;
  title?: string;
  itemType?: string;
  modulePath?: string;
  workspacePath?: string;
  showDescriptions: boolean;
  enableSearch: boolean;
  enableCategoryFilter: boolean;
  enableTagFilter: boolean;
  enableFavorites: boolean;
  enableSorting: boolean;
  enableViewToggle: boolean;
  searchFields: string[];
  cardSize: "small" | "medium" | "large";
}

/**
 * Generic Mega Menu Gadget - Framework Level Component
 *
 * A fully configurable mega menu component that can display any type of menu items
 * (calculators, documents, tools, reports, etc.) across different modules.
 *
 * Configuration Examples:
 *
 * 1. For Calculators:
 * {
 *   "dataUrl": "/api/calculators?module=inspect",
 *   "itemType": "calculators",
 *   "modulePath": "intelliINSPECT",
 *   "workspacePath": "calculators"
 * }
 *
 * 2. For Documents:
 * {
 *   "dataUrl": "/api/documents?type=reports",
 *   "itemType": "documents",
 *   "modulePath": "documents",
 *   "workspacePath": "reports"
 * }
 *
 * 3. For Custom Tools:
 * {
 *   "dataUrl": "/api/tools",
 *   "itemType": "tools",
 *   "modulePath": "tools",
 *   "workspacePath": "utilities"
 * }
 *
 * Required Properties:
 * - dataUrl: API endpoint for menu data
 *
 * Optional Properties:
 * - modulePath: Used for workspace path construction (fallback)
 * - workspacePath: Used for workspace path construction (fallback)
 *
 * Navigation: Uses the proper workspace navigation system like ActionPanelGadget
 * - Handles cross-module navigation automatically
 * - Uses context.onAction for same-module navigation
 * - Falls back to direct URL for cross-module navigation
 */
export class MegaMenuGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: "mega-menu-gadget",
    name: "Mega Menu Gadget",
    description: "Advanced searchable mega menu with filtering capabilities",
    category: "dashboard",
    tags: ["menu", "search", "filter", "mega", "navigation"],
    version: "1.0.0",
    author: "System",
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
    dataFlow: {
      inputs: ["calculators-data"],
      outputs: ["navigation-events"],
      transformations: ["data-filtering"],
    },
  };

  schema: GadgetSchema = {
    type: "object",
    properties: {
      dataUrl: { type: "string", format: "uri" },
      dataPath: { type: "string" },
      title: { type: "string" },
      itemType: { type: "string" },
      modulePath: { type: "string" },
      workspacePath: { type: "string" },
      showDescriptions: { type: "boolean", default: true },
      enableSearch: { type: "boolean", default: true },
      enableCategoryFilter: { type: "boolean", default: true },
      enableTagFilter: { type: "boolean", default: true },
      enableFavorites: { type: "boolean", default: true },
      enableSorting: { type: "boolean", default: true },
      enableViewToggle: { type: "boolean", default: true },
      searchFields: {
        type: "array",
        items: { type: "string" },
        default: ["label", "description", "tags"],
      },
      cardSize: {
        type: "string",
        enum: ["small", "medium", "large"],
        default: "medium",
      },
    },
    required: ["dataUrl"],
    widgetSchemas: {},
  };

  getContainerProps(props: any, context?: GadgetContext): any {
    return {
      ...super.getContainerProps(props, context),
      noPadding: true, // MegaMenu manages its own internal padding
    };
  }

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    return React.createElement(MegaMenuComponent, {
      config: props.config || props,
      context,
    });
  }

  getRequiredWidgets(): string[] {
    return []; // This gadget doesn't require any specific widgets
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: "grid",
      responsive: true,
    };
  }

  processDataFlow(data: any): any {
    return data; // Pass through data as-is
  }

  validate(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.dataUrl) {
      errors.push("dataUrl is required");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

interface MegaMenuComponentProps {
  config: MegaMenuGadgetConfig;
  context?: GadgetContext;
}

type IconContainerStyle = React.CSSProperties & {
  "--icon-glow": string;
  "--icon-accent": string;
};

const ICON_ACCENT_TOKENS = [
  "--color-primary",
  "--color-accent-yellow",
  "--color-accent-orange",
  "--color-success",
  "--color-info",
  "--primary",
  "--accent",
  "--secondary",
];

const stringToHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

const getIconPresentation = (menuItem: MenuItem, palette: string[]) => {
  const seed =
    menuItem.category || menuItem.workspace || menuItem.type || menuItem.key;
  const paletteIndex = Math.abs(stringToHash(seed)) % palette.length;
  const accentToken = palette[paletteIndex] || "--color-primary";
  const baseColor = `var(${accentToken}, var(--color-primary, var(--primary)))`;
  const containerStyle: IconContainerStyle = {
    "--icon-accent": baseColor,
    "--icon-glow":
      "radial-gradient(circle at center, color-mix(in srgb, var(--icon-accent) 35%, transparent) 0%, transparent 68%)",
    color: `hsl(var(--primary))`,
  };
  return {
    accent: baseColor,
    containerStyle,
  };
};

const MegaMenuComponent: React.FC<MegaMenuComponentProps> = ({
  config,
  context,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  // Load favorites from localStorage
  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem(
        `${config.itemType || "menu"}-favorites`
      );
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save favorites to localStorage
  const saveFavorites = (favorites: string[]) => {
    try {
      localStorage.setItem(
        `${config.itemType || "menu"}-favorites`,
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.warn("Failed to save favorites to localStorage:", error);
    }
  };

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    try {
      const stored = localStorage.getItem("calculator-preferences");
      return stored
        ? JSON.parse(stored)
        : {
            viewMode: "grid" as "grid" | "list",
            sortBy: "name" as "name" | "category" | "recent" | "favorites",
          };
    } catch {
      return {
        viewMode: "grid" as "grid" | "list",
        sortBy: "name" as "name" | "category" | "recent" | "favorites",
      };
    }
  };

  // Save user preferences to localStorage
  const saveUserPreferences = (preferences: {
    viewMode: "grid" | "list";
    sortBy: "name" | "category" | "recent" | "favorites";
  }) => {
    try {
      localStorage.setItem(
        "calculator-preferences",
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.warn("Failed to save preferences to localStorage:", error);
    }
  };

  const preferences = loadUserPreferences();

  const [favorites, setFavorites] = useState<string[]>(loadFavorites());
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    preferences.viewMode
  );
  const [sortBy, setSortBy] = useState<
    "name" | "category" | "recent" | "favorites"
  >(preferences.sortBy);

  const [searchDebounce, setSearchDebounce] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const toggleFavorite = (
    event: React.MouseEvent<HTMLElement>,
    itemKey: string
  ) => {
    event.stopPropagation();
    setFavorites((prev) => {
      const newFavorites = prev.includes(itemKey)
        ? prev.filter((id) => id !== itemKey)
        : [...prev, itemKey];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  const renderActions = (menuItem: MenuItem) => {
    const showFavoriteAction = config.enableFavorites;
    const showRecentMarker = recentItems.includes(menuItem.key);

    if (!showFavoriteAction && !showRecentMarker) {
      return null;
    }

    return (
      <div className="mega-menu-card__actions">
        {showFavoriteAction && (
          <Tooltip
            title={
              favorites.includes(menuItem.key)
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Button
              type="text"
              size="small"
              icon={
                favorites.includes(menuItem.key) ? (
                  <HeartFilled style={{ color: "#ff4d4f" }} />
                ) : (
                  <HeartOutlined />
                )
              }
              onClick={(event) => toggleFavorite(event, menuItem.key)}
            />
          </Tooltip>
        )}
        {showRecentMarker && (
          <Tooltip title="Recently used">
            <Badge dot>
              <ClockCircleOutlined style={{ color: "hsl(var(--primary))" }} />
            </Badge>
          </Tooltip>
        )}
      </div>
    );
  };

  // Dynamic icon loading function (supports any icon from database)
  const getIconComponent = (iconName: string, accentColor?: string) => {
    try {
      // Get icon component dynamically from the Icons module
      const IconComponent = (Icons as any)[iconName];

      if (IconComponent) {
        // Return the actual icon component with enhanced professional styling
        return React.createElement(IconComponent, {
          style: {
            fontSize: "26px",
            color: "currentColor",
            fontWeight: 600,
            strokeWidth: 0.5,
          },
        });
      } else {
        // Fallback to a default icon if the specified icon doesn't exist
        console.warn(`Icon "${iconName}" not found, using fallback`);
        return React.createElement(Icons.CalculatorOutlined, {
          style: {
            fontSize: "26px",
            color: "currentColor",
            fontWeight: 600,
          },
        });
      }
    } catch (error) {
      console.warn(`Failed to render icon: ${iconName}`, error);
      // Ultimate fallback
      return React.createElement(Icons.QuestionCircleOutlined, {
        style: {
          fontSize: "26px",
          color: "currentColor",
          fontWeight: 600,
        },
      });
    }
  };

  // Skeleton loader for cards
  const SkeletonCard = () => (
    <Card
      className="mega-menu-card"
      style={{ position: "relative", height: "100%" }}
      bodyStyle={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "100%",
      }}
    >
      <div className="mega-menu-card__header">
        <div
          className="mega-menu-card__icon"
          style={{ border: "none", background: "hsl(var(--muted) / 0.1)" }}
        >
          <Skeleton.Avatar
            size={28}
            shape="square"
            style={{ borderRadius: "8px" }}
          />
        </div>
        <div className="mega-menu-card__header-main">
          <div className="mega-menu-card__title-row">
            <Skeleton.Input style={{ width: "70%", height: "16px" }} active />
            <Skeleton.Button
              active
              size="small"
              style={{ width: "24px", height: "24px", borderRadius: "6px" }}
            />
          </div>
        </div>
      </div>
      <Skeleton paragraph={{ rows: 2, width: ["100%", "85%"] }} active />
      <div className="mega-menu-card__tags">
        <Skeleton.Input style={{ width: "72px", height: "22px" }} active />
        <Skeleton.Input style={{ width: "56px", height: "22px" }} active />
      </div>
    </Card>
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchText);
      setIsSearching(false);
    }, 300);

    if (searchText !== searchDebounce) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchText, searchDebounce]);

  // Fetch calculators data
  useEffect(() => {
    const fetchCalculators = async () => {
      try {
        setLoading(true);
        const response = await BaseGadget.makeAuthenticatedFetch(
          config.dataUrl
        );
        if (!response.ok) {
          if (response.status === 401) {
            BaseGadget.forceLogout();
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Navigate to data path if specified
        let calculatorData = data;
        if (config.dataPath) {
          const pathParts = config.dataPath.split(".");
          for (const part of pathParts) {
            calculatorData = calculatorData?.[part];
          }
        }

        if (Array.isArray(calculatorData)) {
          setMenuItems(calculatorData);
        }
      } catch (error) {
        console.error("Error fetching calculators:", error);
      } finally {
        setLoading(false);
      }
    };

    if (config.dataUrl) {
      fetchCalculators();
    }
  }, [config.dataUrl, config.dataPath]);

  // Get unique categories and tags
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(menuItems.map((item) => item.category))
    );
    return uniqueCategories.sort();
  }, [menuItems]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    menuItems.forEach((item) => {
      item.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [menuItems]);

  // Sort menu items based on sortBy
  const sortedMenuItems = useMemo(() => {
    let sorted = [...menuItems];

    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => a.label.localeCompare(b.label));
        break;
      case "category":
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "recent":
        // Sort by recent items first, then by name
        sorted.sort((a, b) => {
          const aRecent = recentItems.includes(a.key);
          const bRecent = recentItems.includes(b.key);
          if (aRecent && !bRecent) return -1;
          if (!aRecent && bRecent) return 1;
          return a.label.localeCompare(b.label);
        });
        break;
      case "favorites":
        // Sort by favorites first, then by name
        sorted.sort((a, b) => {
          const aFav = favorites.includes(a.key);
          const bFav = favorites.includes(b.key);
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          return a.label.localeCompare(b.label);
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [menuItems, sortBy, recentItems, favorites]);

  // Filter menu items based on search and filters
  const filteredMenuItems = useMemo(() => {
    return sortedMenuItems.filter((item) => {
      // Favorites filter
      if (showOnlyFavorites && !favorites.includes(item.key)) {
        return false;
      }

      // Search filter
      if (searchDebounce && config.searchFields?.length) {
        const searchLower = searchDebounce.toLowerCase();
        const matchesSearch = config.searchFields.some((field) => {
          if (field === "tags" && item.tags) {
            return item.tags.some((tag) =>
              tag.toLowerCase().includes(searchLower)
            );
          }
          const value = item[field as keyof MenuItem];
          return (
            typeof value === "string" &&
            value.toLowerCase().includes(searchLower)
          );
        });
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some((tag) =>
          item.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [
    sortedMenuItems,
    searchDebounce,
    selectedCategory,
    selectedTags,
    config.searchFields,
    showOnlyFavorites,
    favorites,
  ]);

  const handleMenuItemClick = (menuItem: MenuItem) => {
    if (menuItem.workspace) {
      // Track recent items for premium UX
      setRecentItems((prev) => {
        const filtered = prev.filter((id) => id !== menuItem.key);
        return [menuItem.key, ...filtered].slice(0, 5); // Keep only 5 recent items
      });

      // Use the proper navigation system like ActionPanelGadget
      if (context && (context as any).onAction) {
        console.log("🔗 Navigating to workspace:", menuItem.workspace);

        // Determine the current module from current workspace query
        const workspacePath = menuItem.workspace;
        const moduleIdFromItem = workspacePath.split("/")[0];
        // Check if we need to switch modules by comparing workspace paths
        const currentWorkspace = window.location.search.includes("workspace=")
          ? new URLSearchParams(window.location.search).get("workspace")
          : "";
        const currentModuleId = currentWorkspace
          ? currentWorkspace.split("/")[0]
          : "";

        const desiredModuleId = (config as any)?.modulePath || moduleIdFromItem;
        if (currentModuleId !== desiredModuleId) {
          console.log(
            "🎯 Navigating from",
            currentModuleId,
            "to",
            desiredModuleId
          );
          // Build module-correct dynamic-calculator target for calculators
          let workspaceForUrl = menuItem.workspace;
          let extraParams = "";
          if (menuItem.workspace?.includes("/calculators/")) {
            const parts = menuItem.workspace.split("/");
            const calculatorId = parts[parts.length - 1];
            const moduleIdForCalc = desiredModuleId;
            const workspacePathName =
              (config as any)?.workspacePath || "calculators";
            workspaceForUrl = `${moduleIdForCalc}/${workspacePathName}/dynamic-calculator`;
            extraParams = `&calculatorId=${encodeURIComponent(calculatorId)}`;
          }
          // Use clean URL construction - base URL with workspace (and calculatorId if present)
          const baseUrl = window.location.origin + window.location.pathname;
          const cleanUrl = `${baseUrl}?workspace=${encodeURIComponent(
            workspaceForUrl
          )}${extraParams}`;
          window.location.href = cleanUrl;
          return;
        }

        // Handle workspace navigation using the proper action system within same module
        // For calculators, route to the module's dynamic calculator workspace
        let targetWorkspace = menuItem.workspace;
        if (menuItem.workspace?.includes("/calculators/")) {
          const parts = menuItem.workspace.split("/");
          const calculatorId = parts[parts.length - 1];
          const moduleIdForCalc =
            desiredModuleId || currentModuleId || parts[0];
          const workspacePathName =
            (config as any)?.workspacePath || "calculators";
          targetWorkspace = `${moduleIdForCalc}/${workspacePathName}/dynamic-calculator`;
          (context as any).onAction("navigate", {
            workspace: targetWorkspace,
            route: menuItem.route,
            key: menuItem.key,
            label: menuItem.label,
            type: menuItem.type || "item",
            params: { calculatorId },
          });
        } else {
          (context as any).onAction("navigate", {
            workspace: targetWorkspace,
            route: menuItem.route,
            key: menuItem.key,
            label: menuItem.label,
            type: menuItem.type || "item",
          });
        }
      } else {
        // Fallback to direct URL navigation if context is not available
        const baseUrl = window.location.origin + window.location.pathname;
        const cleanUrl = `${baseUrl}?workspace=${encodeURIComponent(
          menuItem.workspace
        )}`;
        window.location.href = cleanUrl;
      }
    }
  };

  const getCardSize = () => {
    switch (config.cardSize) {
      case "small":
        return 6;
      case "large":
        return 8;
      default:
        return 6;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "hsl(var(--background))",
          borderRadius: "20px",
          boxShadow: "inset 0 1px 3px hsl(var(--foreground) / 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "16px",
            background:
              "linear-gradient(135deg, hsl(var(--muted) / 0.3) 0%, hsl(var(--muted) / 0.1) 100%)",
            borderRadius: "12px",
            border: "1px solid hsl(var(--border) / 0.5)",
          }}
        >
          <div>
            <Skeleton.Input style={{ width: "200px", height: "24px" }} active />
            <Skeleton.Input
              style={{ width: "150px", height: "16px", marginTop: "8px" }}
              active
            />
          </div>
          <Space>
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
            <Skeleton.Input style={{ width: "120px", height: "24px" }} active />
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <SkeletonCard />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mega-menu-card,
          .mega-menu-list-card {
            position: relative;
            border-radius: 14px;
            border: 1px solid hsl(var(--border) / 0.5);
            background: linear-gradient(
              145deg,
              hsl(var(--background)) 0%,
              hsl(var(--muted) / 0.03) 100%
            );
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            box-shadow: 
              0 1px 3px hsl(var(--foreground) / 0.04),
              inset 0 1px 0 hsl(var(--background) / 0.8);
          }
          .mega-menu-card:hover,
          .mega-menu-list-card:hover {
            border-color: hsl(var(--primary) / 0.4);
            box-shadow: 
              0 12px 28px hsl(var(--foreground) / 0.12),
              0 4px 12px hsl(var(--primary) / 0.08),
              inset 0 1px 0 hsl(var(--background) / 0.9);
            transform: translateY(-4px);
          }
          .mega-menu-card::before,
          .mega-menu-list-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(
              90deg,
              hsl(var(--primary)) 0%,
              hsl(var(--primary) / 0.7) 50%,
              hsl(var(--primary) / 0.3) 100%
            );
            opacity: 0;
            transition: opacity 0.25s ease;
          }
          .mega-menu-card:hover::before,
          .mega-menu-list-card:hover::before {
            opacity: 1;
          }
          .mega-menu-card .ant-card-body,
          .mega-menu-list-card .ant-card-body {
            padding: 16px 18px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            height: 100%;
          }
          .mega-menu-card__header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .mega-menu-card__icon {
            position: relative;
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: linear-gradient(
              145deg,
              hsl(var(--primary) / 0.20),
              hsl(var(--primary) / 0.12),
              hsl(var(--primary) / 0.06)
            );
            border: 2.5px solid hsl(var(--primary) / 0.60);
            display: flex;
            align-items: center;
            justify-content: center;
            color: hsl(var(--primary));
            overflow: visible;
            box-shadow: 
              0 4px 16px hsl(var(--primary) / 0.20),
              0 2px 6px hsl(var(--primary) / 0.12),
              inset 0 1px 3px hsl(var(--background) / 0.8),
              inset 0 -2px 4px hsl(var(--primary) / 0.08);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .mega-menu-card__icon::before {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 19px;
            background: linear-gradient(135deg, 
              hsl(var(--primary)),
              hsl(var(--primary) / 0.7),
              hsl(var(--primary) / 0.3)
            );
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
            pointer-events: none;
            /* Create ring effect - only show the border/outline */
            -webkit-mask: 
              linear-gradient(#fff 0 0) padding-box, 
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask: 
              linear-gradient(#fff 0 0) padding-box, 
              linear-gradient(#fff 0 0);
            mask-composite: exclude;
            padding: 2px;
          }
          .mega-menu-card__icon::after {
            content: '';
            position: absolute;
            inset: -12px;
            border-radius: 28px;
            background: radial-gradient(
              circle at center,
              hsl(var(--primary) / 0.20) 0%,
              hsl(var(--primary) / 0.08) 40%,
              transparent 70%
            );
            opacity: 0;
            transition: opacity 0.4s ease;
            z-index: -2;
            pointer-events: none;
          }
          .mega-menu-card:hover .mega-menu-card__icon,
          .mega-menu-list-card:hover .mega-menu-card__icon {
            transform: translateY(-3px) scale(1.08);
            box-shadow: 
              0 12px 32px hsl(var(--primary) / 0.35),
              0 6px 20px hsl(var(--primary) / 0.25),
              0 2px 10px hsl(var(--primary) / 0.18),
              inset 0 2px 4px hsl(var(--background)),
              inset 0 -2px 4px hsl(var(--primary) / 0.15);
            border-color: hsl(var(--primary));
            border-width: 3px;
            background: hsl(var(--card));
            color: hsl(var(--primary));
          }
          .mega-menu-card:hover .mega-menu-card__icon::before,
          .mega-menu-list-card:hover .mega-menu-card__icon::before {
            opacity: 1;
          }
          .mega-menu-card:hover .mega-menu-card__icon::after,
          .mega-menu-list-card:hover .mega-menu-card__icon::after {
            opacity: 1;
          }
          .mega-menu-card__icon svg {
            filter: 
              drop-shadow(0 1px 3px hsl(var(--primary) / 0.35))
              drop-shadow(0 0 0 transparent);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0.92;
          }
          .mega-menu-card:hover .mega-menu-card__icon svg,
          .mega-menu-list-card:hover .mega-menu-card__icon svg {
            filter: 
              drop-shadow(0 2px 8px hsl(var(--primary) / 0.50))
              drop-shadow(0 0 12px hsl(var(--primary) / 0.25));
            opacity: 1;
            transform: scale(1.05);
          }
          .mega-menu-card__header-main {
            flex: 1;
            min-width: 0;
          }
          .mega-menu-card__title-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .mega-menu-card__title {
            margin: 0;
            font-size: 16px;
            font-weight: 650;
            line-height: 1.3;
            color: hsl(var(--foreground));
            flex: 1;
            letter-spacing: -0.015em;
            text-shadow: 0 1px 2px hsl(var(--foreground) / 0.08);
          }
          .mega-menu-card__actions {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .mega-menu-card__actions .ant-btn {
            width: 26px;
            height: 26px;
            padding: 0;
            border-radius: 6px;
          }
          .mega-menu-card__description {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
            color: hsl(var(--muted-foreground));
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-weight: 450;
            letter-spacing: 0.005em;
          }
          .mega-menu-card__tags {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 2px;
          }
          .mega-menu-card__chip {
            font-size: 11px;
            border-radius: 7px;
            padding: 3px 8px;
            background: hsl(var(--muted) / 0.15);
            border: 1px solid hsl(var(--border) / 0.6);
            color: hsl(var(--muted-foreground));
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 550;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px hsl(var(--foreground) / 0.04);
          }
          .mega-menu-card:hover .mega-menu-card__chip,
          .mega-menu-list-card:hover .mega-menu-card__chip {
            border-color: hsl(var(--border) / 0.8);
            box-shadow: 0 2px 4px hsl(var(--foreground) / 0.06);
          }
          .mega-menu-card__chip--category {
            background: linear-gradient(135deg, 
              hsl(var(--primary) / 0.15), 
              hsl(var(--primary) / 0.08)
            );
            border-color: hsl(var(--primary) / 0.5);
            color: hsl(var(--primary));
            font-weight: 600;
          }
          .mega-menu-card__chip--more {
            border-style: dashed;
            background: transparent;
          }
        `,
        }}
      />
      <div
        style={{
          padding: "24px",
          backgroundColor: "hsl(var(--background))",
          borderRadius: "20px",
          boxShadow: "inset 0 1px 3px hsl(var(--foreground) / 0.05)",
        }}
      >
        {/* Premium Header with Stats and Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "20px 24px",
            background:
              "linear-gradient(135deg, hsl(var(--muted) / 0.25) 0%, hsl(var(--muted) / 0.08) 100%)",
            backdropFilter: "blur(8px)",
            borderRadius: "16px",
            border: "1px solid hsl(var(--border) / 0.4)",
            boxShadow:
              "0 2px 8px hsl(var(--foreground) / 0.03), inset 0 1px 0 hsl(var(--background) / 0.6)",
          }}
        >
          <div style={{ flex: 1 }}>
            <Title
              level={4}
              style={{
                margin: "0 0 6px 0",
                color: "hsl(var(--foreground))",
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {config.title || "Menu Items"}
            </Title>
            <Text
              style={{
                color: "hsl(var(--muted-foreground))",
                fontSize: "13.5px",
                fontWeight: 500,
                letterSpacing: "0.01em",
              }}
            >
              {filteredMenuItems.length} of {menuItems.length}{" "}
              {config.itemType || "items"}
              {selectedCategory && ` • ${selectedCategory}`}
              {selectedTags.length > 0 &&
                ` • ${selectedTags.length} tag${
                  selectedTags.length > 1 ? "s" : ""
                }`}
              {showOnlyFavorites && ` • favorites only`}
            </Text>
          </div>
          <Space>
            {config.enableViewToggle && (
              <>
                <Tooltip title="Grid View">
                  <Button
                    type={viewMode === "grid" ? "primary" : "text"}
                    icon={<AppstoreOutlined />}
                    onClick={() => {
                      setViewMode("grid");
                      saveUserPreferences({ viewMode: "grid", sortBy });
                    }}
                    size="small"
                  />
                </Tooltip>
                <Tooltip title="List View">
                  <Button
                    type={viewMode === "list" ? "primary" : "text"}
                    icon={<BarsOutlined />}
                    onClick={() => {
                      setViewMode("list");
                      saveUserPreferences({ viewMode: "list", sortBy });
                    }}
                    size="small"
                  />
                </Tooltip>
              </>
            )}
            {config.enableFavorites && (
              <Tooltip
                title={
                  showOnlyFavorites
                    ? `Show all ${config.itemType || "items"}`
                    : "Show only favorites"
                }
              >
                <Button
                  type={showOnlyFavorites ? "primary" : "text"}
                  icon={
                    <HeartFilled
                      style={{
                        color: showOnlyFavorites ? "#ff4d4f" : undefined,
                      }}
                    />
                  }
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  size="small"
                />
              </Tooltip>
            )}
            {config.enableSorting && (
              <Select
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value);
                  saveUserPreferences({ viewMode, sortBy: value });
                }}
                size="small"
                style={{ width: "120px" }}
                suffixIcon={<SortAscendingOutlined />}
              >
                <Option value="name">Name</Option>
                <Option value="category">Category</Option>
                <Option value="favorites">Favorites</Option>
                <Option value="recent">Recent</Option>
              </Select>
            )}
          </Space>
        </div>

        {/* Search and Filter Controls */}
        <Space
          direction="vertical"
          size={8}
          style={{ width: "100%", marginBottom: "16px" }}
        >
          {config.enableSearch && (
            <Input
              placeholder={`Search ${config.itemType || "items"}...`}
              prefix={
                isSearching ? <ClockCircleOutlined spin /> : <SearchOutlined />
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              allowClear
              style={{
                borderRadius: "12px",
                border: "2px solid hsl(var(--border))",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px hsl(var(--foreground) / 0.04)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "hsl(var(--primary) / 0.5)";
                e.target.style.boxShadow =
                  "0 4px 12px hsl(var(--primary) / 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "hsl(var(--border))";
                e.target.style.boxShadow =
                  "0 2px 8px hsl(var(--foreground) / 0.04)";
              }}
            />
          )}

          <Space wrap>
            {config.enableCategoryFilter && categories.length > 0 && (
              <Select
                placeholder="Filter by category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                allowClear
                style={{ minWidth: "200px" }}
                suffixIcon={<FilterOutlined />}
              >
                {categories.map((category) => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            )}

            {config.enableTagFilter && allTags.length > 0 && (
              <Select
                mode="multiple"
                placeholder="Filter by tags"
                value={selectedTags}
                onChange={setSelectedTags}
                allowClear
                style={{ minWidth: "250px" }}
                suffixIcon={<FilterOutlined />}
              >
                {allTags.map((tag) => (
                  <Option key={tag} value={tag}>
                    {tag}
                  </Option>
                ))}
              </Select>
            )}
          </Space>
        </Space>

        {/* Menu Items - Dynamic Layout */}
        {filteredMenuItems.length === 0 ? (
          <Empty
            description={`No ${
              config.itemType || "items"
            } found matching your criteria`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : viewMode === "list" ? (
          // List View
          <div style={{ padding: "12px 0" }}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              {filteredMenuItems.map((menuItem) => {
                const visibleTags = menuItem.tags
                  ? menuItem.tags.slice(0, 2)
                  : [];
                const extraTagsCount =
                  menuItem.tags && menuItem.tags.length > visibleTags.length
                    ? menuItem.tags.length - visibleTags.length
                    : 0;
                const hasTags =
                  Boolean(menuItem.category) ||
                  visibleTags.length > 0 ||
                  extraTagsCount > 0;
                const actions = renderActions(menuItem);
                const { accent, containerStyle } = getIconPresentation(
                  menuItem,
                  ICON_ACCENT_TOKENS
                );

                return (
                  <Card
                    key={menuItem.key}
                    hoverable
                    onClick={() => handleMenuItemClick(menuItem)}
                    className="mega-menu-list-card"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="mega-menu-card__header">
                      <div
                        className="mega-menu-card__icon"
                        style={containerStyle}
                      >
                        {getIconComponent(menuItem.icon, accent)}
                      </div>
                      <div className="mega-menu-card__header-main">
                        <div className="mega-menu-card__title-row">
                          <Title
                            level={5}
                            className="mega-menu-card__title"
                            style={{ color: "hsl(var(--foreground))" }}
                          >
                            {menuItem.label}
                          </Title>
                          {actions}
                        </div>
                      </div>
                    </div>
                    {config.showDescriptions && menuItem.description && (
                      <Paragraph
                        className="mega-menu-card__description"
                        ellipsis={{ rows: 1, tooltip: menuItem.description }}
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {menuItem.description}
                      </Paragraph>
                    )}
                    {hasTags && (
                      <div className="mega-menu-card__tags">
                        {menuItem.category && (
                          <Tag className="mega-menu-card__chip mega-menu-card__chip--category">
                            {menuItem.category}
                          </Tag>
                        )}
                        {visibleTags.map((tag) => (
                          <Tag key={tag} className="mega-menu-card__chip">
                            {tag}
                          </Tag>
                        ))}
                        {extraTagsCount > 0 && (
                          <Tag className="mega-menu-card__chip mega-menu-card__chip--more">
                            +{extraTagsCount} more
                          </Tag>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </Space>
          </div>
        ) : (
          // Grid View
          <div
            style={{
              padding: "12px 0",
            }}
          >
            <Row gutter={[16, 16]}>
              {filteredMenuItems.map((menuItem) => {
                const visibleTags = menuItem.tags
                  ? menuItem.tags.slice(0, 2)
                  : [];
                const extraTagsCount =
                  menuItem.tags && menuItem.tags.length > visibleTags.length
                    ? menuItem.tags.length - visibleTags.length
                    : 0;
                const hasTags =
                  Boolean(menuItem.category) ||
                  visibleTags.length > 0 ||
                  extraTagsCount > 0;
                const actions = renderActions(menuItem);
                const { accent, containerStyle } = getIconPresentation(
                  menuItem,
                  ICON_ACCENT_TOKENS
                );

                return (
                  <Col xs={24} sm={12} md={getCardSize()} key={menuItem.key}>
                    <Card
                      hoverable
                      onClick={() => handleMenuItemClick(menuItem)}
                      className="mega-menu-card"
                      style={{
                        cursor: "pointer",
                        height: "100%",
                      }}
                    >
                      <div className="mega-menu-card__header">
                        <div
                          className="mega-menu-card__icon"
                          style={containerStyle}
                        >
                          {getIconComponent(menuItem.icon, accent)}
                        </div>
                        <div className="mega-menu-card__header-main">
                          <div className="mega-menu-card__title-row">
                            <Title
                              level={5}
                              className="mega-menu-card__title"
                              style={{ color: "hsl(var(--foreground))" }}
                            >
                              {menuItem.label}
                            </Title>
                            {actions}
                          </div>
                        </div>
                      </div>

                      {config.showDescriptions && menuItem.description && (
                        <Paragraph
                          className="mega-menu-card__description"
                          ellipsis={{ rows: 2, tooltip: menuItem.description }}
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {menuItem.description}
                        </Paragraph>
                      )}

                      {hasTags && (
                        <div className="mega-menu-card__tags">
                          {menuItem.category && (
                            <Tag className="mega-menu-card__chip mega-menu-card__chip--category">
                              {menuItem.category}
                            </Tag>
                          )}
                          {visibleTags.map((tag) => (
                            <Tag key={tag} className="mega-menu-card__chip">
                              {tag}
                            </Tag>
                          ))}
                          {extraTagsCount > 0 && (
                            <Tag className="mega-menu-card__chip mega-menu-card__chip--more">
                              +{extraTagsCount} more
                            </Tag>
                          )}
                        </div>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </div>
    </>
  );
};

export default MegaMenuGadget;

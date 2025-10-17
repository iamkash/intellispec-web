import * as AntIcons from "@ant-design/icons";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  message,
  Row,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import React from "react";
import { commercialFormulaCalculator } from "../../../../utils/CommercialFormulaCalculator";
import { WizardUtils } from "../../../../utils/WizardUtils";
import { AIChatbotWidget } from "../../widgets/input/AIChatbotWidget";
import { BaseGadget } from "../base";
import DocumentFormGadget from "./DocumentFormGadget";
import { getGroupIcon, getSectionIcon } from "./iconUtils";
import {
  FieldConfig,
  FormData,
  FormGroup,
  FormSection,
  FormValidationResult,
  WizardStep,
} from "./types";
import {
  createWidgetFactory,
  extractFieldSpecificProps,
  getPropsForWidget,
} from "./widgetFactory";
import { useNavigation } from "../../../../contexts/NavigationContext";

const { Title, Text } = Typography;
interface FormRendererProps {
  gadget: DocumentFormGadget;
  initialProps: any;
  onFormDataChange?: (data: FormData) => void;
  fitContent?: boolean; // When true, avoids fixed viewport height and scrolls with parent
}

// Interface for section metadata response
interface SectionMetadataResponse {
  sections?: Record<string, FormSection>;
  groups?: Record<string, FormGroup>;
  fieldConfigs?: Record<string, FieldConfig>;
  sectionGroups?: Record<string, string[]>;
  groupFields?: Record<string, string[]>;
  // For API 510 format
  fields?: Array<{
    id: string;
    type: string;
    title: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    size?: number;
    icon?: string;
    sectionId: string;
    groupId: string;
    options?: Array<{ label: string; value: any }>;
    defaultValue?: any;
    description?: string;
    watchField?: string;
    showWhen?: any;
    showOnMatch?: boolean;
    calculated?: boolean;
    formula?: string;
    disabled?: boolean;
    props?: Record<string, any>;
  }>;
  api510Groups?: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    sectionId: string;
    order: number;
    size: number;
    icon?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    watchField?: string;
    showWhen?: any;
    showOnMatch?: boolean;
  }>;
}

// Validate line items for paint invoices
const validateLineItems = (
  formData: FormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (formData.lineItems && Array.isArray(formData.lineItems)) {
    formData.lineItems.forEach((item: any, index: number) => {
      // Check for empty paint specification
      if (!item.paintSpecId || item.paintSpecId === "") {
        const fieldPath = `lineItems.${index}.paintSpecId`;
        errors[fieldPath] = "Paint specification is required";
      }

      // Check for zero or negative quantity
      if (!item.quantityPurchased || item.quantityPurchased <= 0) {
        const fieldPath = `lineItems.${index}.quantityPurchased`;
        errors[fieldPath] = "Quantity must be greater than 0";
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const FormRenderer: React.FC<FormRendererProps> = ({
  gadget,
  initialProps,
  onFormDataChange,
  fitContent,
}) => {
  const mode = (gadget.config as any).mode;
  const navigation = useNavigation();
  const currentWorkspaceId = navigation.currentWorkspaceId;

  const navigateBackOrFallback = React.useCallback(() => {
    const navigated = navigation.navigateBack();
    if (navigated) {
      return;
    }

    const moduleId = currentWorkspaceId?.split('/')?.[0];
    if (moduleId) {
      const fallback = navigation.getLastWorkspaceForModule(moduleId);
      if (fallback && fallback !== currentWorkspaceId) {
        navigation.openWorkspace(fallback, { replace: true });
        return;
      }
    }

    if (window.history.length > 1) {
      window.history.back();
    }
  }, [navigation, currentWorkspaceId]);

  const triggerNavigation = React.useCallback((target?: string | null, params?: Record<string, string>, options?: { replace?: boolean }) => {
    const mergedParams: Record<string, string> = { ...(params || {}) };
    if (currentWorkspaceId && mergedParams.returnTo === undefined) {
      mergedParams.returnTo = currentWorkspaceId;
    }

    if (target && target !== 'back') {
      navigation.openWorkspace(target, {
        params: mergedParams,
        replace: options?.replace ?? true,
      });
      return;
    }

    navigateBackOrFallback();
  }, [navigation, navigateBackOrFallback, currentWorkspaceId]);
  // Memoize the data URL to prevent unnecessary re-fetches
  const memoizedDataUrl: string | undefined = React.useMemo(
    () => gadget.config.dataUrl,
    [gadget.config.dataUrl]
  );
  // All state is now managed by React Hooks
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<FormData>({});
  const formDataRef = React.useRef(formData);
  React.useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  const [originalData, setOriginalData] = React.useState<FormData>({});

  // Broadcast form data changes to parent when requested
  // Debounce broadcasts to avoid flooding parent with updates
  const broadcastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Clear existing timer
    if (broadcastTimerRef.current) {
      clearTimeout(broadcastTimerRef.current);
    }

    // Debounce the broadcast by 16ms (one frame) to batch rapid changes
    broadcastTimerRef.current = setTimeout(() => {
      try {
        if (onFormDataChange) {
          onFormDataChange(formData);
        }
      } catch {}
    }, 16); // 16ms = one frame at 60fps

    return () => {
      if (broadcastTimerRef.current) {
        clearTimeout(broadcastTimerRef.current);
      }
    };
  }, [formData, onFormDataChange]);
  const [fieldConfigs, setFieldConfigs] = React.useState<
    Record<string, FieldConfig>
  >({});
  const [sections, setSections] = React.useState<Record<string, FormSection>>(
    {}
  );
  const [groups, setGroups] = React.useState<Record<string, FormGroup>>({});
  const [sectionGroups, setSectionGroups] = React.useState<
    Record<string, string[]>
  >({});
  const [groupFields, setGroupFields] = React.useState<
    Record<string, string[]>
  >({});
  const [validationResult, setValidationResult] =
    React.useState<FormValidationResult>({
      isValid: true,
      errors: {},
      warnings: {},
    });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = React.useState<
    Record<string, boolean>
  >({});
  const [isMobile, setIsMobile] = React.useState(false);
  const [showScrollToTop, setShowScrollToTop] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const isUpdatingCalculatedFields = React.useRef(false);
  const initializationRef = React.useRef(false);

  // Wizard state
  const [currentStep, setCurrentStep] = React.useState(0);
  const [wizardSteps, setWizardSteps] = React.useState<WizardStep[]>([]);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set()
  );
  const [stepValidation, setStepValidation] = React.useState<
    Record<string, FormValidationResult>
  >({});
  const [wizardLoading] = React.useState(false);

  // Section loading state
  const [loadingSections, setLoadingSections] = React.useState<Set<string>>(
    new Set()
  );
  const [loadedSections, setLoadedSections] = React.useState<Set<string>>(
    new Set()
  );
  const [sectionErrors, setSectionErrors] = React.useState<
    Record<string, string>
  >({});

  // Refs for section scrolling
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const contentContainerRef = React.useRef<HTMLDivElement>(null);

  const mapOptionsData = React.useCallback(
    (data: any[], config: FieldConfig) => {
      return data.map((item) => {
        const valueField = config.optionsValueField || "value";
        const labelField = config.optionsLabelField || "label";

        const rawValue =
          item?.[valueField] ??
          item?.id ??
          item?._id ??
          item?.value ??
          item?.code ??
          null;
        const optionValue =
          rawValue !== undefined && rawValue !== null
            ? String(rawValue)
            : "";

        let optionLabel: string | undefined;
        if (typeof labelField === "string") {
          if (labelField.includes("{")) {
            optionLabel = labelField
              .replace(/\{([^}]+)\}/g, (_match, key) => {
                const lookupKey = String(key).trim();
                const replacement = item?.[lookupKey];
                return replacement !== undefined && replacement !== null
                  ? String(replacement)
                  : "";
              })
              .replace(/\s+/g, " ")
              .trim();
          } else if (
            item?.[labelField] !== undefined &&
            item?.[labelField] !== null
          ) {
            optionLabel = String(item[labelField]);
          }
        }

        if (!optionLabel || optionLabel.length === 0) {
          const fallback =
            item?.name ??
            item?.label ??
            item?.title ??
            item?.description ??
            null;
          optionLabel =
            fallback !== undefined && fallback !== null
              ? String(fallback)
              : optionValue;
        }

        if (!optionLabel || optionLabel.length === 0) {
          optionLabel = optionValue;
        }

        return {
          label: optionLabel,
          value: optionValue,
        };
      });
    },
    []
  );

  // Function to load section metadata from URL
  const loadSectionMetadata = React.useCallback(
    async (sectionId: string, sectionOptionsUrl: string) => {
      if (loadingSections.has(sectionId) || loadedSections.has(sectionId)) {
        return;
      }
      setLoadingSections((prev) => new Set(prev).add(sectionId));

      setSectionErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[sectionId];
        return newErrors;
      });

      try {
        // Construct the full URL
        const baseUrl = window.location.origin;
        const fullUrl = sectionOptionsUrl.startsWith("http")
          ? sectionOptionsUrl
          : `${baseUrl}/data/workspaces/inspection/${sectionOptionsUrl}`;

        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();

        // Process the metadata based on format
        let newFieldConfigs: Record<string, FieldConfig> = {};
        let newGroups: Record<string, FormGroup> = {};
        let newSectionGroups: Record<string, string[]> = {};
        let newGroupFields: Record<string, string[]> = {};

        // Check if it's a nested section format
        if (
          rawData.type === "section" &&
          rawData.groups &&
          Array.isArray(rawData.groups)
        ) {
          // Nested format (section with groups containing fields)

          // Process groups
          rawData.groups.forEach((group: any) => {
            newGroups[group.id] = {
              id: group.id,
              title: group.title,
              description: group.description,
              sectionId: rawData.id,
              order: group.order,
              size: group.size,
              icon: group.icon,
              collapsible: group.collapsible,
              defaultCollapsed: group.defaultCollapsed,
              watchField: group.watchField,
              showWhen: group.showWhen,
              showOnMatch: group.showOnMatch,
            };

            // Debug: Log conditional properties for groups
            if (group.watchField) {
              console.log(
                `[SECTION LOAD] Group ${group.id} has conditional logic:`,
                {
                  watchField: group.watchField,
                  showWhen: group.showWhen,
                  showOnMatch: group.showOnMatch,
                }
              );
            }

            // Initialize section groups mapping
            if (!newSectionGroups[rawData.id]) {
              newSectionGroups[rawData.id] = [];
            }
            newSectionGroups[rawData.id].push(group.id);

            // Process fields within this group
            if (group.fields && Array.isArray(group.fields)) {
              group.fields.forEach((field: any) => {
                newFieldConfigs[field.id] = {
                  id: field.id,
                  type: field.type,
                  title: field.title,
                  label: field.label,
                  placeholder: field.placeholder,
                  required: field.required,
                  size: field.size,
                  icon: field.icon,
                  sectionId: rawData.id,
                  groupId: group.id,
                  options: field.options,
                  defaultValue: field.defaultValue,
                  description: field.description,
                  watchField: field.watchField,
                  showWhen: field.showWhen,
                  showOnMatch: field.showOnMatch,
                  calculated: field.calculated,
                  formula: field.formula,
                  disabled: field.disabled,
                  props: field.props,
                };

                // Initialize group fields mapping
                if (!newGroupFields[group.id]) {
                  newGroupFields[group.id] = [];
                }
                newGroupFields[group.id].push(field.id);
              });
            }
          });
        } else if (typeof rawData === "object" && !Array.isArray(rawData)) {
          const metadata: SectionMetadataResponse = rawData;

          if (metadata.fieldConfigs && metadata.sections && metadata.groups) {
            // Wizard-demo format (already processed)
            newFieldConfigs = metadata.fieldConfigs;
            newGroups = metadata.groups;
            newSectionGroups = metadata.sectionGroups || {};
            newGroupFields = metadata.groupFields || {};
          } else if (metadata.fields && metadata.api510Groups) {
            // API 510 format (flat structure)

            // Process groups
            metadata.api510Groups.forEach((group) => {
              newGroups[group.id] = {
                id: group.id,
                title: group.title,
                description: group.description,
                sectionId: group.sectionId,
                order: group.order,
                size: group.size,
                icon: group.icon,
                collapsible: group.collapsible,
                defaultCollapsed: group.defaultCollapsed,
                watchField: group.watchField,
                showWhen: group.showWhen,
                showOnMatch: group.showOnMatch,
              };

              // Initialize section groups mapping
              if (!newSectionGroups[group.sectionId]) {
                newSectionGroups[group.sectionId] = [];
              }
              newSectionGroups[group.sectionId].push(group.id);
            });

            // Process fields
            metadata.fields.forEach((field) => {
              newFieldConfigs[field.id] = {
                id: field.id,
                type: field.type,
                title: field.title,
                label: field.label,
                placeholder: field.placeholder,
                required: field.required,
                size: field.size,
                icon: field.icon,
                sectionId: field.sectionId,
                groupId: field.groupId,
                options: field.options,
                defaultValue: field.defaultValue,
                description: field.description,
                watchField: field.watchField,
                showWhen: field.showWhen,
                showOnMatch: field.showOnMatch,
                calculated: field.calculated,
                formula: field.formula,
                disabled: field.disabled,
                props: field.props,
              };

              // Initialize group fields mapping
              if (!newGroupFields[field.groupId]) {
                newGroupFields[field.groupId] = [];
              }
              newGroupFields[field.groupId].push(field.id);
            });
          } else {
            throw new Error("Invalid metadata format: missing required fields");
          }
        } else if (Array.isArray(rawData)) {
          // Array format (mixed fields and groups)

          rawData.forEach((item) => {
            if (item.type === "group") {
              // Process group
              newGroups[item.id] = {
                id: item.id,
                title: item.title,
                description: item.description,
                sectionId: item.sectionId,
                order: item.order,
                size: item.size,
                icon: item.icon,
                collapsible: item.collapsible,
                defaultCollapsed: item.defaultCollapsed,
                watchField: item.watchField,
                showWhen: item.showWhen,
                showOnMatch: item.showOnMatch,
              };

              // Debug: Log conditional properties for groups
              if (item.watchField) {
                console.log(
                  `[SECTION LOAD] Group ${item.id} has conditional logic:`,
                  {
                    watchField: item.watchField,
                    showWhen: item.showWhen,
                    showOnMatch: item.showOnMatch,
                  }
                );
              }

              // Initialize section groups mapping
              if (!newSectionGroups[item.sectionId]) {
                newSectionGroups[item.sectionId] = [];
              }
              newSectionGroups[item.sectionId].push(item.id);
            } else if (item.type && item.id && item.sectionId && item.groupId) {
              // Process field (must have type, id, sectionId, and groupId)
              newFieldConfigs[item.id] = {
                id: item.id,
                type: item.type,
                title: item.title,
                label: item.label,
                placeholder: item.placeholder,
                required: item.required,
                size: item.size,
                icon: item.icon,
                sectionId: item.sectionId,
                groupId: item.groupId,
                options: item.options,
                defaultValue: item.defaultValue,
                description: item.description,
                watchField: item.watchField,
                showWhen: item.showWhen,
                showOnMatch: item.showOnMatch,
                calculated: item.calculated,
                formula: item.formula,
                disabled: item.disabled,
                props: item.props,
              };

              // Initialize group fields mapping
              if (!newGroupFields[item.groupId]) {
                newGroupFields[item.groupId] = [];
              }
              newGroupFields[item.groupId].push(item.id);
            }
          });
        } else {
          throw new Error("Invalid metadata format: expected object or array");
        }

        // Merge with existing data
        setFieldConfigs((prev) => ({ ...prev, ...newFieldConfigs }));
        setGroups((prev) => ({ ...prev, ...newGroups }));
        setSectionGroups((prev) => ({ ...prev, ...newSectionGroups }));
        setGroupFields((prev) => ({ ...prev, ...newGroupFields }));

        // Update section metadata if the loaded data includes section information
        if (rawData.type === "section" && rawData.id) {
          setSections((prev) => ({
            ...prev,
            [rawData.id]: {
              ...prev[rawData.id],
              icon: rawData.icon || prev[rawData.id]?.icon,
              title: rawData.title || prev[rawData.id]?.title,
              description: rawData.description || prev[rawData.id]?.description,
              order: rawData.order || prev[rawData.id]?.order,
            },
          }));
        }

        // Mark section as loaded
        setLoadedSections((prev) => new Set(prev).add(sectionId));
      } catch (error) {
        console.error(
          `[FormRenderer] Error loading section ${sectionId}:`,
          error
        );
        setSectionErrors((prev) => ({
          ...prev,
          [sectionId]:
            error instanceof Error
              ? error.message
              : "Failed to load section metadata",
        }));
      } finally {
        setLoadingSections((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });
      }
    },
    [loadingSections, loadedSections]
  );

  // Load sections when they become active (for wizard mode)
  React.useEffect(() => {
    if (mode === "wizard" && wizardSteps.length > 0) {
      const currentStepObj = wizardSteps[currentStep];
      if (currentStepObj) {
        const section = sections[currentStepObj.id];
        if (
          section &&
          section.sectionOptionsUrl &&
          !loadedSections.has(currentStepObj.id) &&
          !loadingSections.has(currentStepObj.id)
        ) {
          loadSectionMetadata(currentStepObj.id, section.sectionOptionsUrl);
        }
      }
    }
  }, [
    mode,
    wizardSteps,
    currentStep,
    sections,
    loadedSections,
    loadingSections,
    loadSectionMetadata,
  ]);

  // Load sections when they become visible (for regular mode)
  React.useEffect(() => {
    if (mode !== "wizard" && activeSection) {
      const section = sections[activeSection];
      if (
        section &&
        section.sectionOptionsUrl &&
        !loadedSections.has(activeSection) &&
        !loadingSections.has(activeSection)
      ) {
        loadSectionMetadata(activeSection, section.sectionOptionsUrl);
      }
    }
  }, [
    mode,
    activeSection,
    sections,
    loadedSections,
    loadingSections,
    loadSectionMetadata,
  ]);

  // Load all sections with sectionOptionsUrl on initial load
  React.useEffect(() => {
    // Only run once when sections are first set and we're initialized
    if (isInitialized && Object.keys(sections).length > 0) {
      Object.keys(sections).forEach((sectionId) => {
        const section = sections[sectionId];
        if (
          section &&
          section.sectionOptionsUrl &&
          !loadedSections.has(sectionId) &&
          !loadingSections.has(sectionId)
        ) {
          loadSectionMetadata(sectionId, section.sectionOptionsUrl);
        }
      });
    }
  }, [
    isInitialized,
    sections,
    loadedSections,
    loadingSections,
    loadSectionMetadata,
  ]);

  // Initialize wizard steps after sections are loaded (only once when sections change)
  React.useEffect(() => {
    if (
      mode === "wizard" &&
      isInitialized &&
      Object.keys(sections).length > 0 &&
      loadedSections.size > 0
    ) {
      // Wait for at least some sections to be loaded before creating wizard steps
      const sectionsWithUrl = Object.values(sections).filter(
        (section) => section.sectionOptionsUrl
      );
      const loadedSectionsCount = loadedSections.size;
      console.log("[FormRenderer] Loaded sections count:", loadedSectionsCount);

      // Only create wizard steps if we have sections and at least some are loaded
      if (sectionsWithUrl.length > 0 && loadedSectionsCount > 0) {
        let steps: WizardStep[] = [];

        // Try to use the new method with loaded data, fallback to original method
        const latestFormData = formDataRef.current;
        if (typeof gadget.parseWizardStepsWithLoadedData === "function") {
          steps = gadget.parseWizardStepsWithLoadedData(
            sections,
            groups,
            fieldConfigs,
            sectionGroups,
            groupFields,
            latestFormData
          );
        } else {
          // Fallback to original method
          steps = gadget.parseWizardSteps(latestFormData);
        }
        setWizardSteps(steps);

        // Initialize with default values - the gadget will manage its own state
        setCurrentStep(0);
        setCompletedSteps(new Set());
      }
    }
  }, [
    mode,
    isInitialized,
    sections,
    loadedSections,
    gadget,
    groups,
    fieldConfigs,
    sectionGroups,
    groupFields,
  ]); // Removed formData to prevent re-initialization on field changes

  // Check if device is mobile
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle scroll events for scroll to top button
  React.useEffect(() => {
    const container = contentContainerRef.current;
    if (!container || !isMobile) return;

    const handleScroll = () => {
      setShowScrollToTop(container.scrollTop > 200);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  // Scroll spy functionality - auto-select section based on scroll position
  React.useEffect(() => {
    const container = contentContainerRef.current;
    if (!container) return;

    const handleScrollSpy = () => {
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerHeight = containerRect.height;

      let bestSection = activeSection;
      let bestVisibility = 0;

      // Check each section's visibility
      Object.keys(sectionRefs.current).forEach((sectionId) => {
        const sectionElement = sectionRefs.current[sectionId];
        if (!sectionElement) return;

        const sectionRect = sectionElement.getBoundingClientRect();
        const sectionTop = sectionRect.top;
        const sectionHeight = sectionRect.height;

        // Calculate how much of the section is visible
        const visibleTop = Math.max(sectionTop, containerTop);
        const visibleBottom = Math.min(
          sectionTop + sectionHeight,
          containerTop + containerHeight
        );
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibility = visibleHeight / sectionHeight;

        // Update best section if this one is more visible
        if (visibility > bestVisibility) {
          bestVisibility = visibility;
          bestSection = sectionId;
        }
      });

      // Update active section if it changed and visibility is significant
      if (
        bestSection &&
        bestSection !== activeSection &&
        bestVisibility > 0.3
      ) {
        setActiveSection(bestSection);
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScrollSpy = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScrollSpy();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", throttledScrollSpy);
    return () => container.removeEventListener("scroll", throttledScrollSpy);
  }, [activeSection]);

  // Create widget factory
  const widgetFactory = React.useMemo(
    () => createWidgetFactory(gadget),
    [gadget]
  );

  // Calculate formula value for calculated fields
  const calculateFormulaValue = React.useCallback(
    (fieldPath: string, config: FieldConfig): number => {
      if (!config.formula) return 0;

      // Formula evaluation

      const result = commercialFormulaCalculator.evaluateWithContext(
        config.formula,
        { formData }
      );

      // Convert result to number, handling different types
      if (typeof result.value === "number") {
        return result.value;
      } else if (typeof result.value === "string") {
        const numValue = Number(result.value);
        return isNaN(numValue) ? 0 : numValue;
      } else if (typeof result.value === "boolean") {
        return result.value ? 1 : 0;
      } else {
        return 0;
      }
    },
    [formData]
  );

  // Smart default value logic based on previous selections
  const calculateSmartDefaults = React.useCallback(
    (
      fieldPath: string,
      config: FieldConfig,
      currentFormData: FormData
    ): any => {
      // Skip if field already has a value
      if (currentFormData[fieldPath] !== undefined) {
        return undefined;
      }

      // Smart defaults based on field path and other field values
      switch (fieldPath) {
        case "confined-space-required":
          // If inspection type is internal, likely needs confined space
          if (currentFormData["inspection-type"] === "internal") {
            return "yes";
          }
          break;

        case "lockout-tagout-required":
          // If internal inspection or combined, likely needs LOTO
          if (
            ["internal", "combined"].includes(
              currentFormData["inspection-type"]
            )
          ) {
            return "yes";
          }
          break;

        case "ventilation-required":
          // If confined space entry is required, likely needs ventilation
          if (currentFormData["confined-space-required"] === "yes") {
            return "yes";
          }
          break;

        case "hot-work-permit":
          // If using equipment that could create sparks
          const equipmentUsed = currentFormData["equipment-used"] || [];
          if (
            Array.isArray(equipmentUsed) &&
            equipmentUsed.some((eq) =>
              ["mt-equipment", "pt-kit", "rt-equipment"].includes(eq)
            )
          ) {
            return "yes";
          }
          break;

        case "confined-space-permit":
          // If confined space entry is required, permit is likely needed
          if (currentFormData["confined-space-required"] === "yes") {
            return "yes";
          }
          break;

        case "access-method":
          // Smart default based on inspection type
          if (currentFormData["inspection-type"] === "external") {
            return "external";
          } else if (currentFormData["inspection-type"] === "internal") {
            return "manhole";
          }
          break;

        case "atmosphere-testing":
          // If confined space entry, atmosphere testing is required
          if (currentFormData["confined-space-required"] === "yes") {
            return "yes";
          }
          break;

        case "isolation-verified":
          // If internal inspection, isolation is likely required
          if (
            ["internal", "combined"].includes(
              currentFormData["inspection-type"]
            )
          ) {
            return "yes";
          }
          break;

        case "ventilation-verified":
          // If ventilation is required, verification is needed
          if (currentFormData["ventilation-required"] === "yes") {
            return "yes";
          }
          break;

        case "communication-system":
          // If confined space entry, communication is required
          if (currentFormData["confined-space-required"] === "yes") {
            return "yes";
          }
          break;

        case "rescue-equipment-available":
          // If confined space entry, rescue equipment is required
          if (currentFormData["confined-space-required"] === "yes") {
            return "yes";
          }
          break;

        case "rescue-team-available":
          // If confined space entry, rescue team is required
          if (currentFormData["confined-space-required"] === "yes") {
            return "yes";
          }
          break;

        case "safety-briefing-completed":
          // Safety briefing should always be completed
          return "yes";

        case "pre-inspection-approval":
          // Default to approved if all safety checks pass
          const safetyChecks = [
            currentFormData["atmosphere-testing"],
            currentFormData["isolation-verified"],
            currentFormData["communication-system"],
            currentFormData["rescue-equipment-available"],
          ];
          if (
            safetyChecks.every(
              (check) => check === "yes" || check === "not-required"
            )
          ) {
            return "approved";
          }
          break;

        // New Step 2 smart defaults
        case "ppe-available":
          // If PPE is required in Step 1, default to checking availability
          if (
            currentFormData["ppe-required"] &&
            Array.isArray(currentFormData["ppe-required"]) &&
            currentFormData["ppe-required"].length > 0
          ) {
            return "yes";
          }
          break;

        case "ppe-being-worn":
          // If PPE is available, likely being worn
          if (currentFormData["ppe-available"] === "yes") {
            return "yes";
          }
          break;

        case "work-area-illumination":
          // Default to yes for most inspections
          return "yes";

        case "work-area-ventilation":
          // If ventilation is required, work area should be ventilated
          if (currentFormData["ventilation-required"] === "yes") {
            return "yes";
          }
          return "yes";

        case "work-area-cleanliness":
          // Default to yes for most inspections
          return "yes";

        case "work-area-barriers":
          // If confined space entry, barriers likely required
          if (currentFormData["confined-space-required"] === "yes") {
            return "yes";
          }
          return "not-required";

        case "tools-inspected":
          // Default to yes for safety
          return "yes";

        case "electrical-equipment-safe":
          // If using electrical equipment, should be safe
          const electricalEquipment = currentFormData["equipment-used"] || [];
          if (
            Array.isArray(electricalEquipment) &&
            electricalEquipment.some((eq) =>
              [
                "ut-gauge",
                "digital-camera",
                "thermal-camera",
                "vibration-analyzer",
              ].includes(eq)
            )
          ) {
            return "yes";
          }
          return "not-required";

        case "all-safety-requirements-met":
          // Check if all critical safety requirements are met
          const criticalSafetyChecks = [
            currentFormData["atmosphere-testing"],
            currentFormData["isolation-verified"],
            currentFormData["communication-system"],
            currentFormData["rescue-equipment-available"],
            currentFormData["ppe-available"],
            currentFormData["work-area-illumination"],
            currentFormData["work-area-ventilation"],
            currentFormData["tools-inspected"],
          ];
          if (
            criticalSafetyChecks.every(
              (check) => check === "yes" || check === "not-required"
            )
          ) {
            return "yes";
          }
          break;

        case "safety-issues-resolved":
          // If all requirements met, issues should be resolved
          if (currentFormData["all-safety-requirements-met"] === "yes") {
            return "yes";
          }
          return "not-applicable";

        // Step 3 smart defaults
        case "inspection-methodology":
          // Default based on inspection type
          if (currentFormData["inspection-type"] === "external") {
            return "visual";
          } else if (currentFormData["inspection-type"] === "internal") {
            return "combined";
          }
          break;

        case "inspection-coverage":
          // Default to representative sample for most inspections
          return "representative";

        case "shell-inspection":
          // Most inspections include shell inspection
          return "not-started";

        case "head-inspection":
          // Most inspections include head inspection
          return "not-started";

        case "nozzle-inspection":
          // Most inspections include nozzle inspection
          return "not-started";

        case "support-inspection":
          // Support inspection is often required
          return "not-started";

        case "photographs-taken":
          // Default to yes for documentation
          return "yes";

        case "sketches-prepared":
          // Default to yes for documentation
          return "yes";

        // Step 4 smart defaults
        case "overall-assessment":
          // Default based on defects found
          if (currentFormData["defects-found"] === "no") {
            return "acceptable";
          } else if (currentFormData["defects-found"] === "minor") {
            return "acceptable-monitoring";
          } else if (currentFormData["defects-found"] === "yes") {
            return "conditional";
          }
          break;

        case "critical-findings":
          // Default based on defect severity
          if (currentFormData["defect-severity"] === "critical") {
            return "yes";
          }
          return "no";

        case "next-inspection-interval":
          // Default based on overall assessment
          if (currentFormData["overall-assessment"] === "acceptable") {
            return "5-years";
          } else if (
            currentFormData["overall-assessment"] === "acceptable-monitoring"
          ) {
            return "2-years";
          } else if (currentFormData["overall-assessment"] === "conditional") {
            return "1-year";
          } else if (
            currentFormData["overall-assessment"] === "repair-required"
          ) {
            return "as-required";
          }
          break;

        case "repair-requirements":
          // Default based on defects found
          if (currentFormData["defects-found"] === "yes") {
            return "yes";
          } else if (currentFormData["defects-found"] === "minor") {
            return "minor";
          }
          return "no";

        case "api-510-compliance":
          // Default based on overall assessment
          if (
            currentFormData["overall-assessment"] === "acceptable" ||
            currentFormData["overall-assessment"] === "acceptable-monitoring"
          ) {
            return "compliant";
          } else if (currentFormData["overall-assessment"] === "conditional") {
            return "conditional";
          } else {
            return "non-compliant";
          }

        case "inspection-report-prepared":
          // Default to yes for completed inspections
          return "yes";

        case "inspection-completed":
          // Default to yes if we've reached this step
          return "yes";

        case "return-to-service-approved":
          // Default based on overall assessment
          if (currentFormData["overall-assessment"] === "acceptable") {
            return "approved";
          } else if (
            currentFormData["overall-assessment"] === "acceptable-monitoring" ||
            currentFormData["overall-assessment"] === "conditional"
          ) {
            return "conditional";
          } else {
            return "not-approved";
          }

        case "inspection-date-completed":
          // Default to today's date
          return new Date().toISOString().split("T")[0];

        // Step 5 smart defaults
        case "photographs-uploaded":
          // Default based on photographs taken in Step 3
          if (currentFormData["photographs-taken"] === "yes") {
            return "yes";
          } else if (currentFormData["photographs-taken"] === "partial") {
            return "in-progress";
          }
          return "no";

        case "drawings-prepared":
          // Default based on sketches prepared in Step 3
          if (currentFormData["sketches-prepared"] === "yes") {
            return "yes";
          } else if (currentFormData["sketches-prepared"] === "not-required") {
            return "not-required";
          }
          return "no";

        case "supporting-documents-uploaded":
          // Default to yes for comprehensive documentation
          return "yes";

        case "inspector-signature-date":
          // Default to today's date
          return new Date().toISOString().split("T")[0];

        case "supervisor-approval-required":
          // Default based on critical findings
          if (
            currentFormData["critical-findings"] === "yes" ||
            currentFormData["overall-assessment"] === "repair-required" ||
            currentFormData["overall-assessment"] === "replacement-required"
          ) {
            return "yes";
          }
          return "not-applicable";

        case "client-approval-required":
          // Default based on overall assessment
          if (
            currentFormData["overall-assessment"] === "conditional" ||
            currentFormData["overall-assessment"] === "repair-required" ||
            currentFormData["overall-assessment"] === "replacement-required"
          ) {
            return "yes";
          }
          return "not-applicable";

        case "report-format":
          // Default to PDF for professional reports
          return "pdf";

        case "report-delivery-method":
          // Default to email for standard delivery
          return "email";

        case "report-urgency":
          // Default based on overall assessment
          if (currentFormData["overall-assessment"] === "immediate-shutdown") {
            return "critical";
          } else if (
            currentFormData["overall-assessment"] === "repair-required" ||
            currentFormData["overall-assessment"] === "replacement-required"
          ) {
            return "urgent";
          } else if (currentFormData["overall-assessment"] === "conditional") {
            return "standard";
          }
          return "routine";

        case "data-verification-complete":
          // Default to yes if we've reached this step
          return "yes";

        case "quality-review-complete":
          // Default to yes if we've reached this step
          return "yes";

        case "compliance-check-complete":
          // Default to yes if we've reached this step
          return "yes";

        case "final-approval-given":
          // Default based on all verification steps
          const verificationSteps = [
            currentFormData["data-verification-complete"],
            currentFormData["quality-review-complete"],
            currentFormData["compliance-check-complete"],
          ];
          if (verificationSteps.every((step) => step === "yes")) {
            return "yes";
          } else if (verificationSteps.some((step) => step === "in-progress")) {
            return "pending";
          }
          return "no";

        case "submission-status":
          // Default based on final approval
          if (currentFormData["final-approval-given"] === "yes") {
            return "ready-review";
          } else if (currentFormData["final-approval-given"] === "pending") {
            return "draft";
          }
          return "draft";

        case "submission-date":
          // Default to today's date when submitted
          if (
            currentFormData["submission-status"] === "submitted" ||
            currentFormData["submission-status"] === "completed"
          ) {
            return new Date().toISOString().split("T")[0];
          }
          break;

        // Equipment calibration defaults based on selected equipment
        case "ut-gauge-calibration":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].includes("ut-gauge")
          ) {
            // Set to 6 months from today
            const date = new Date();
            date.setMonth(date.getMonth() + 6);
            return date.toISOString().split("T")[0];
          }
          break;

        case "mt-equipment-calibration":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].includes("mt-equipment")
          ) {
            // Set to 1 year from today
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date.toISOString().split("T")[0];
          }
          break;

        case "pt-kit-expiry":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].includes("pt-kit")
          ) {
            // Set to 2 years from today
            const date = new Date();
            date.setFullYear(date.getFullYear() + 2);
            return date.toISOString().split("T")[0];
          }
          break;

        case "rt-equipment-calibration":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].includes("rt-equipment")
          ) {
            // Set to 1 year from today
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date.toISOString().split("T")[0];
          }
          break;

        case "camera-calibration":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].includes("digital-camera")
          ) {
            // Set to 1 year from today
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date.toISOString().split("T")[0];
          }
          break;

        case "measuring-tools-calibration":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].some((eq) =>
              ["measuring-tape", "caliper"].includes(eq)
            )
          ) {
            // Set to 6 months from today
            const date = new Date();
            date.setMonth(date.getMonth() + 6);
            return date.toISOString().split("T")[0];
          }
          break;

        case "thermal-camera-calibration":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].includes("thermal-camera")
          ) {
            // Set to 1 year from today
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date.toISOString().split("T")[0];
          }
          break;

        case "vibration-analyzer-calibration":
          if (
            Array.isArray(currentFormData["equipment-used"]) &&
            currentFormData["equipment-used"].includes("vibration-analyzer")
          ) {
            // Set to 1 year from today
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date.toISOString().split("T")[0];
          }
          break;

        // Environmental condition defaults
        case "temperature":
          // Default to room temperature if not specified
          return 72;

        case "humidity":
          // Default to moderate humidity
          return 50;

        case "lighting-conditions":
          // Default to mixed lighting
          return "mixed";

        case "weather-conditions":
          // Default to indoor
          return "indoor";

        case "visibility":
          // Default to good visibility
          return "good";

        case "air-quality":
          // Default to good air quality
          return "good";

        default:
          // Return static default value if configured
          return config.defaultValue;
      }

      return config.defaultValue;
    },
    []
  );

  // Apply smart defaults when form data changes
  React.useEffect(() => {
    if (Object.keys(formData).length === 0) return;

    const newDefaults: FormData = {};
    let hasChanges = false;

    // Check each field for smart defaults
    Object.keys(fieldConfigs).forEach((fieldPath) => {
      const config = fieldConfigs[fieldPath];
      const smartDefault = calculateSmartDefaults(fieldPath, config, formData);

      if (smartDefault !== undefined && formData[fieldPath] === undefined) {
        newDefaults[fieldPath] = smartDefault;
        hasChanges = true;
      }
    });

    // Apply smart defaults if any were calculated
    if (hasChanges) {
      setFormData((prev) => ({ ...prev, ...newDefaults }));
    }
  }, [formData, fieldConfigs, calculateSmartDefaults]);

  // Track which fields are currently loading and which have been loaded
  const loadingFieldsRef = React.useRef<Set<string>>(new Set());
  const loadedFieldsRef = React.useRef<Set<string>>(new Set());
  // Load options for fields with optionsUrl (independent fields only, loaded once)
  React.useEffect(() => {
    if (!isInitialized || Object.keys(fieldConfigs).length === 0) {
      return;
    }
    const loadIndependentFieldOptions = async () => {
      const fieldsToLoad: string[] = [];

      // First, identify which fields need loading
      for (const [fieldId, fieldConfig] of Object.entries(fieldConfigs)) {
        // Skip if already loaded, currently loading, or if it's a dependent field
        if (
          loadedFieldsRef.current.has(fieldId) ||
          loadingFieldsRef.current.has(fieldId) ||
          fieldConfig.dependsOn
        ) {
          continue;
        }

        if (
          fieldConfig.optionsUrl &&
          (!fieldConfig.options || fieldConfig.options.length === 0)
        ) {
          fieldsToLoad.push(fieldId);
        }
      }

      if (fieldsToLoad.length === 0) {
        return;
      }
      // Mark fields as loading
      if (fieldsToLoad.length > 0) {
        const nextLoadingFields = new Set(loadingFieldsRef.current);
        fieldsToLoad.forEach((fieldId) => nextLoadingFields.add(fieldId));
        loadingFieldsRef.current = nextLoadingFields;
      }

      // Load options for each field
      const loadPromises = fieldsToLoad.map(async (fieldId) => {
        const fieldConfig = fieldConfigs[fieldId];
        try {
          const response = await BaseGadget.makeAuthenticatedFetch(
            fieldConfig.optionsUrl!
          );

          if (response.ok) {
            const data = await response.json();

            // Extract options from response based on optionsPath
            let optionsData = data;
            if (fieldConfig.optionsPath) {
              const pathParts = fieldConfig.optionsPath.split(".");
              for (const part of pathParts) {
                optionsData = optionsData?.[part];
              }
            } else if (optionsData && Array.isArray(optionsData.data)) {
              optionsData = optionsData.data;
            }

            // Convert to options format
            const options = Array.isArray(optionsData)
              ? mapOptionsData(optionsData, fieldConfig)
              : [];
            return { fieldId, options };
          } else {
            console.warn(
              `[FormRenderer] Failed to load options for ${fieldId}: ${response.status} ${response.statusText}`
            );
            return { fieldId, options: [] };
          }
        } catch (err) {
          console.warn(
            `[FormRenderer] Failed to load options for ${fieldId}:`,
            err
          );
          return { fieldId, options: [] };
        }
      });

      // Wait for all options to load, then update in batch
      const results = await Promise.all(loadPromises);

      // Update field configs with all loaded options at once
      setFieldConfigs((prev) => {
        const updated = { ...prev };
        results.forEach(({ fieldId, options }) => {
          updated[fieldId] = {
            ...updated[fieldId],
            options,
          };
        });
        return updated;
      });

      // Mark fields as loaded and remove from loading
      if (results.length > 0) {
        const loadedIds = results.map(({ fieldId }) => fieldId);

        const nextLoadedFields = new Set(loadedFieldsRef.current);
        loadedIds.forEach((fieldId) => nextLoadedFields.add(fieldId));
        loadedFieldsRef.current = nextLoadedFields;

        const nextLoadingFields = new Set(loadingFieldsRef.current);
        loadedIds.forEach((fieldId) => nextLoadingFields.delete(fieldId));
        loadingFieldsRef.current = nextLoadingFields;
      }
    };

    loadIndependentFieldOptions();
  }, [isInitialized, fieldConfigs, mapOptionsData]);

  // Track which dependent field + parent value combinations have been loaded
  const loadedDependentFieldsRef = React.useRef<Set<string>>(new Set());

  // Load options for dependent fields when their parent values change
  React.useEffect(() => {
    const loadDependentFieldOptions = async () => {
      const fieldsToLoad: Array<{
        fieldId: string;
        optionsUrl: string;
        parentValue: string;
        loadKey: string;
      }> = [];

      // Identify dependent fields that need loading
      for (const [fieldId, fieldConfig] of Object.entries(fieldConfigs)) {
        if (!fieldConfig.dependsOn) {
          continue;
        }

        const parentValue = formData[fieldConfig.dependsOn];
        const loadKey = `${fieldId}_${parentValue || "empty"}`;

        // Skip if already loaded for this parent value
        if (loadedDependentFieldsRef.current.has(loadKey)) {
          continue;
        }

        if (!parentValue) {
          // Clear options if parent value is not selected
          setFieldConfigs((prev) => ({
            ...prev,
            [fieldId]: {
              ...prev[fieldId],
              options: [],
            },
          }));
          // Mark as "loaded" for empty parent value to prevent repeated clearing
          loadedDependentFieldsRef.current.add(loadKey);
          continue;
        }

        // Build dependent options URL
        let optionsUrl;
        if (fieldConfig.dependentOptionsUrl) {
          optionsUrl = fieldConfig.dependentOptionsUrl.replace(
            "{parentValue}",
            parentValue
          );
        } else if (fieldConfig.referenceListType) {
          optionsUrl = `/api/reference-data/list-options/${fieldConfig.referenceListType}?parentValue=${parentValue}`;
        } else if (fieldConfig.optionsUrl && fieldConfig.filterBy) {
          // Support filterBy parameter for generic filtering
          const baseUrl = fieldConfig.optionsUrl;
          const separator = baseUrl.includes("?") ? "&" : "?";
          optionsUrl = `${baseUrl}${separator}${fieldConfig.filterBy}=${parentValue}`;
        }

        if (optionsUrl) {
          fieldsToLoad.push({ fieldId, optionsUrl, parentValue, loadKey });
        } else {
          console.warn(
            `[FormRenderer] No optionsUrl constructed for dependent field ${fieldId}`
          );
        }
      }

      if (fieldsToLoad.length === 0) {
        return;
      }

      // Load options for dependent fields
      const loadPromises = fieldsToLoad.map(
        async ({ fieldId, optionsUrl, parentValue, loadKey }) => {
          const fieldConfig = fieldConfigs[fieldId];
          try {
            const response = await BaseGadget.makeAuthenticatedFetch(
              optionsUrl
            );

            if (response.ok) {
              const data = await response.json();

              // Extract options from response based on optionsPath
              let optionsData = data;
              if (fieldConfig.optionsPath) {
                const pathParts = fieldConfig.optionsPath.split(".");
                for (const part of pathParts) {
                  optionsData = optionsData?.[part];
                }
              } else if (data.data && Array.isArray(data.data)) {
                // Default to 'data' field if no optionsPath specified and data.data exists
                optionsData = data.data;
              }

              // Convert to options format
              const options = Array.isArray(optionsData)
                ? mapOptionsData(optionsData, fieldConfig)
                : [];

              return { fieldId, options, parentValue, loadKey };
            } else {
              console.warn(
                `[FormRenderer] Failed to load dependent options for ${fieldId}: ${response.status} ${response.statusText}`
              );
              return { fieldId, options: [], parentValue, loadKey };
            }
          } catch (err) {
            console.warn(
              `[FormRenderer] Failed to load dependent options for ${fieldId}:`,
              err
            );
            return { fieldId, options: [], parentValue, loadKey };
          }
        }
      );

      // Wait for all dependent options to load, then update in batch
      const results = await Promise.all(loadPromises);

      // Update field configs with loaded dependent options and mark as loaded
      setFieldConfigs((prev) => {
        const updated = { ...prev };
        results.forEach(({ fieldId, options }) => {
          updated[fieldId] = {
            ...updated[fieldId],
            options,
          };
        });
        return updated;
      });

      // Mark all loaded combinations as complete
      if (results.length > 0) {
        results.forEach(({ loadKey }) => {
          loadedDependentFieldsRef.current.add(loadKey);
        });
      }
    };

    loadDependentFieldOptions();
  }, [formData, fieldConfigs, mapOptionsData]);

  // Load mock data from dataUrl if specified
  React.useEffect(() => {
    const loadMockData = async () => {
      if (!memoizedDataUrl) {
        return;
      }

      // Check for new record first, before any URL processing
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get("id") || "";

      if (idParam === "new" || !idParam) {
        // Handle pre-population for new records
        const prePopulateData: any = {};

        // Check for common pre-population parameters
        if (urlParams.get("company_id")) {
          prePopulateData.company_id = urlParams.get("company_id");
        }
        if (urlParams.get("site_id")) {
          prePopulateData.site_id = urlParams.get("site_id");
        }
        if (urlParams.get("asset_group_id")) {
          prePopulateData.asset_group_id = urlParams.get("asset_group_id");
        }

        // Apply pre-population data if any
        if (Object.keys(prePopulateData).length > 0) {
          // Fetch display names for pre-populated fields based on field configurations
          const enhancedData = { ...prePopulateData };

          // Check each field config to see if it needs display name fetching
          for (const [fieldId, fieldConfig] of Object.entries(fieldConfigs)) {
            if (prePopulateData[fieldId] && fieldConfig.fetchDisplayName) {
              try {
                const fetchConfig = fieldConfig.fetchDisplayName;
                const url = fetchConfig.url.replace(
                  "{id}",
                  prePopulateData[fieldId]
                );

                const response = await BaseGadget.makeAuthenticatedFetch(url);

                if (response.ok) {
                  const data = await response.json();
                  const displayValue = data[fetchConfig.displayField || "name"];
                  const displayFieldName =
                    fetchConfig.storeAs || `_${fieldId}_name`;

                  enhancedData[displayFieldName] = displayValue;
                }
              } catch (err) {
                console.warn(
                  `[FormRenderer] Failed to fetch ${fieldId} display name:`,
                  err
                );
              }
            }
          }

          setFormData((prevData) => ({ ...prevData, ...enhancedData }));
        }

        return; // Exit early for new records
      }

      // Substitute URL parameters in dataUrl for existing records
      let resolvedDataUrl = memoizedDataUrl;
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // Replace common parameter placeholders
        const idParam = urlParams.get("id") || "";
        const recordIdParam = urlParams.get("recordId") || "";
        const restoreIdParam = urlParams.get("restoreId") || "";

        resolvedDataUrl = resolvedDataUrl.replace(/{id}/g, idParam);
        resolvedDataUrl = resolvedDataUrl.replace(/{recordId}/g, recordIdParam);
        resolvedDataUrl = resolvedDataUrl.replace(
          /{restoreId}/g,
          restoreIdParam
        );
      } catch (err) {
        console.warn("[FormRenderer] Error substituting URL parameters:", err);
      }

      // Don't fetch if URL still contains placeholders
      if (resolvedDataUrl.includes("{")) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await BaseGadget.makeAuthenticatedFetch(
          resolvedDataUrl
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "[FormRenderer] API Error:",
            response.status,
            response.statusText,
            errorText
          );
          throw new Error(
            `Failed to load record data: ${response.status} ${response.statusText}`
          );
        }

        const mockData = await response.json();

        // Extract formData from the API response
        // The API returns the document directly, not wrapped in formData or data
        const apiData = mockData.formData || mockData.data || mockData || {};

        // Use proper form data initialization with nested path support
        const properlyInitializedData = gadget.initializeFormData(
          apiData,
          fieldConfigs
        );

        // Set the properly initialized data
        setFormData(properlyInitializedData);
        setOriginalData({ ...properlyInitializedData });
      } catch (err) {
        console.error("[FormRenderer] Error loading mock data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load mock data"
        );
      } finally {
        setLoading(false);
      }
    };

    // Only load mock data if we have field configs (after initialization)
    if (Object.keys(fieldConfigs).length > 0) {
      loadMockData();
    }
  }, [memoizedDataUrl, isInitialized, fieldConfigs, gadget]);

  // Watch for URL changes to reload data when parameters change
  React.useEffect(() => {
    const handleLocationChange = () => {
      if (Object.keys(fieldConfigs).length > 0 && memoizedDataUrl) {
        // Trigger data reload by calling loadMockData again
        const loadMockData = async () => {
          if (!memoizedDataUrl) return;

          // Check for new record first, before any URL processing
          const urlParams = new URLSearchParams(window.location.search);
          const idParam = urlParams.get("id") || "";

          if (idParam === "new" || !idParam) {
            return;
          }

          // Substitute URL parameters in dataUrl for existing records
          let resolvedDataUrl = memoizedDataUrl;
          try {
            const recordIdParam = urlParams.get("recordId") || "";
            const restoreIdParam = urlParams.get("restoreId") || "";

            resolvedDataUrl = resolvedDataUrl.replace(/{id}/g, idParam);
            resolvedDataUrl = resolvedDataUrl.replace(
              /{recordId}/g,
              recordIdParam
            );
            resolvedDataUrl = resolvedDataUrl.replace(
              /{restoreId}/g,
              restoreIdParam
            );
          } catch (err) {
            console.warn(
              "[FormRenderer] Error substituting URL parameters:",
              err
            );
          }

          if (resolvedDataUrl.includes("{")) {
            return;
          }

          setLoading(true);
          setError(null);

          try {
            const response = await BaseGadget.makeAuthenticatedFetch(
              resolvedDataUrl
            );
            if (!response.ok) {
              throw new Error(
                `Failed to load data: ${response.status} ${response.statusText}`
              );
            }

            const mockData = await response.json();

            const loadedFormData =
              mockData.formData || mockData.data || mockData || {};

            setFormData((prevFormData) => ({
              ...prevFormData,
              ...loadedFormData,
            }));

            setOriginalData((prevOriginalData) => ({
              ...prevOriginalData,
              ...loadedFormData,
            }));
          } catch (err) {
            console.error(
              "[FormRenderer] URL change - Error loading data:",
              err
            );
            setError(
              err instanceof Error ? err.message : "Failed to load data"
            );
          } finally {
            setLoading(false);
          }
        };

        loadMockData();
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", handleLocationChange);

    // Also trigger on mount if URL has parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("id") ||
      urlParams.get("recordId") ||
      urlParams.get("restoreId")
    ) {
      handleLocationChange();
    }

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [memoizedDataUrl, isInitialized, fieldConfigs, gadget]);

  // Initialization logic now lives in useEffect, which runs once
  React.useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    let initialFieldConfigs: Record<string, FieldConfig> = {};
    let parsedStructure:
      | {
          sections: Record<string, FormSection>;
          groups: Record<string, FormGroup>;
          fieldConfigs: Record<string, FieldConfig>;
          sectionGroups: Record<string, string[]>;
          groupFields: Record<string, string[]>;
        }
      | undefined;

    if (gadget.config.gadgetOptions && gadget.config.gadgetOptions.length > 0) {
      parsedStructure = gadget.parseGadgetOptions(gadget.config.gadgetOptions);
      initialFieldConfigs = parsedStructure.fieldConfigs;
    } else if (gadget.config.fieldConfigs) {
      initialFieldConfigs = gadget.config.fieldConfigs;
    }

    const initialFormData = gadget.initializeFormData(
      initialProps.data || {},
      initialFieldConfigs
    );

    // Set all state properties
    setFieldConfigs(initialFieldConfigs);
    setFormData(initialFormData);
    setOriginalData({ ...initialFormData });

    // Set sections for both form and wizard modes
    if (parsedStructure) {
      setSections(parsedStructure.sections);
      setGroups(parsedStructure.groups);
      setSectionGroups(parsedStructure.sectionGroups);
      setGroupFields(parsedStructure.groupFields);

      // Only set active section for form mode, not wizard mode
      if ((gadget.config as any).mode !== "wizard") {
        setActiveSection((prevActiveSection) => {
          if (prevActiveSection === null && parsedStructure) {
            return Object.keys(parsedStructure.sections)[0] || null;
          }
          return prevActiveSection;
        });
      }
    }

    setIsInitialized(true);
  }, [gadget, initialProps]);

  // Initialize wizard if in wizard mode
  React.useEffect(() => {
    if (mode === "wizard" && isInitialized) {
      // Always parse gadget options to ensure we have the latest sections with sectionOptionsUrl
      if (
        gadget.config.gadgetOptions &&
        gadget.config.gadgetOptions.length > 0
      ) {
        const parsedStructure = gadget.parseGadgetOptions(
          gadget.config.gadgetOptions
        );
        setSections(parsedStructure.sections);
        setGroups(parsedStructure.groups);
        setSectionGroups(parsedStructure.sectionGroups);
        setGroupFields(parsedStructure.groupFields);

        // Initialize the gadget's internal wizard steps
        gadget.initializeWizardSteps();
      }
    }
  }, [mode, isInitialized, gadget]);

  // Wizard navigation handlers
  const handleNextStep = React.useCallback(() => {
    if (mode !== "wizard") {
      return;
    }

    const currentStepObj = wizardSteps[currentStep];
    if (!currentStepObj) {
      console.error("FormRenderer: No current step object found");
      return;
    }

    // Use current form data instead of stepData for validation
    const currentStepData = formData;

    // Use WizardUtils directly with current wizard steps instead of gadget's internal steps
    const validation = WizardUtils.validateStep(
      currentStepObj.id,
      currentStepData,
      wizardSteps
    );

    if (!validation.isValid) {
      console.warn("FormRenderer: Step validation failed:", validation.errors);
      setStepValidation((prev) => ({
        ...prev,
        [currentStepObj.id]: validation,
      }));
      message.error("Please fix the errors before proceeding.");
      return;
    }

    // Try to use gadget's completeCurrentStep method first
    const stepCompleted = gadget.completeCurrentStep(currentStepData);

    if (stepCompleted) {
      // Update our local state to match gadget's state using public getters
      setCurrentStep(gadget.getCurrentStepIndex());
      setCompletedSteps(gadget.getCompletedSteps());
      setStepValidation(gadget.getStepValidation());

      // Check if wizard is completed
      if (gadget.getCurrentStepIndex() >= wizardSteps.length) {
        message.success("Wizard completed successfully!");
      }
    } else {
      // Fallback to local state management if gadget method fails
      console.warn(
        "FormRenderer: Gadget step completion failed, using fallback"
      );

      // Mark step as completed in our local state
      setCompletedSteps(
        (prev) => new Set(Array.from(prev).concat(currentStep))
      );

      // Navigate to next step
      const nextStep = currentStep + 1;

      if (nextStep < wizardSteps.length) {
        setCurrentStep(nextStep);
        setStepValidation((prev) => {
          const newValidation = { ...prev };
          delete newValidation[currentStepObj.id];
          return newValidation;
        });
      } else {
        // Wizard completed
        message.success("Wizard completed successfully!");
      }
    }
  }, [gadget, currentStep, wizardSteps, formData, mode]);

  const handlePreviousStep = React.useCallback(() => {
    if (mode !== "wizard" || currentStep === 0) return;

    // Try to use gadget's navigation method first
    const navigationSuccess = gadget.navigateToStep(currentStep - 1);

    if (navigationSuccess) {
      // Update our local state to match gadget's state using public getters
      setCurrentStep(gadget.getCurrentStepIndex());
    } else {
      // Fallback to local state management
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
    }
  }, [gadget, mode, currentStep]);

  const handleStepChange = React.useCallback(
    (stepIndex: number) => {
      if (mode !== "wizard") return;

      // Allow navigation to completed steps or the next step
      if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
        // Try to use gadget's navigation method first
        const navigationSuccess = gadget.navigateToStep(stepIndex);

        if (navigationSuccess) {
          // Update our local state to match gadget's state using public getters
          setCurrentStep(gadget.getCurrentStepIndex());
        } else {
          // Fallback to local state management
          setCurrentStep(stepIndex);
        }
      } else {
        message.error(
          "Cannot navigate to this step. Please complete the current step first."
        );
      }
    },
    [gadget, mode, currentStep, completedSteps]
  );

  // Update calculated fields when formData changes (but not when we're already updating)
  // Debounced to prevent excessive calculations
  const calculatedFieldsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isUpdatingCalculatedFields.current) {
      isUpdatingCalculatedFields.current = false;
      return;
    }

    // Clear existing timeout
    if (calculatedFieldsTimeoutRef.current) {
      clearTimeout(calculatedFieldsTimeoutRef.current);
    }

    // Debounce calculated field updates to prevent excessive calculations
    calculatedFieldsTimeoutRef.current = setTimeout(() => {
      if (Object.keys(fieldConfigs).length > 0) {
        let hasChanges = false;
        const updatedFormData = { ...formData };

        Object.entries(fieldConfigs).forEach(([fieldPath, config]) => {
          if (config.calculated && config.formula) {
            // Calculate formula value inline to avoid dependency issues
            const result = commercialFormulaCalculator.evaluateWithContext(
              config.formula,
              { formData }
            );
            const calculatedValue =
              typeof result.value === "number"
                ? result.value
                : typeof result.value === "string"
                ? parseFloat(result.value) || 0
                : 0;

            if (updatedFormData[fieldPath] !== calculatedValue) {
              updatedFormData[fieldPath] = calculatedValue;
              hasChanges = true;
            }
          }
        });

        // Only update if something actually changed
        if (hasChanges) {
          isUpdatingCalculatedFields.current = true;
          setFormData(updatedFormData);
        }
      }
    }, 100); // 100ms debounce for calculated fields

    // Cleanup timeout on unmount
    return () => {
      if (calculatedFieldsTimeoutRef.current) {
        clearTimeout(calculatedFieldsTimeoutRef.current);
      }
    };
  }, [fieldConfigs, formData]);

  // Scroll to section function
  const scrollToSection = React.useCallback((sectionId: string) => {
    const sectionElement = sectionRefs.current[sectionId];
    const containerElement = contentContainerRef.current;

    if (sectionElement && containerElement) {
      const containerRect = containerElement.getBoundingClientRect();
      const sectionRect = sectionElement.getBoundingClientRect();
      const scrollTop = containerElement.scrollTop;
      const targetScrollTop =
        scrollTop + sectionRect.top - containerRect.top - 20; // 20px offset

      containerElement.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  }, []);

  // Event handlers are now functions inside the component
  const handleSectionChange = React.useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);

      // Scroll to section on both mobile and desktop
      scrollToSection(sectionId);
    },
    [scrollToSection]
  );

  const handleGroupToggle = React.useCallback((groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  // Convert class methods to functions within this component
  const getSortedSections = (): FormSection[] => {
    return Object.values(sections).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  };

  const getSortedGroups = React.useCallback((sectionId: string): FormGroup[] => {
    const groupIds = sectionGroups[sectionId];
    if (!groupIds) return [];

    const sortedGroups = groupIds
      .map((groupId) => groups[groupId])
      .filter((group) => group)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Filter out hidden groups based on conditional logic
    const visibleGroups = sortedGroups.filter((group) => {
      // Check if group should be shown based on conditional logic
      if (group.watchField && group.showWhen !== undefined) {
        const watchedValue = formData[group.watchField];

        // Handle comma-separated string values for showWhen (e.g., "confined-space,internal")
        if (
          typeof group.showWhen === "string" &&
          group.showWhen.includes(",")
        ) {
          const showWhenArray = group.showWhen
            .split(",")
            .map((s: string) => s.trim());
          const isIncluded = showWhenArray.includes(watchedValue);
          return isIncluded;
        } else {
          // Handle single value for showWhen
          return watchedValue === group.showWhen;
        }
      }

      // If no conditional logic, always show the group
      return true;
    });

    // Debug: Log groups and their conditional properties
    if (
      sectionId === "safety-preparation" ||
      sectionId === "visual-inspection"
    ) {
      visibleGroups.forEach((g) => {
        console.log("Group conditional properties:", {
          id: g.id,
          title: g.title,
          watchField: g.watchField,
          showWhen: g.showWhen,
        });
      });
    }

    return visibleGroups;
  }, [sectionGroups, groups, formData]);

  const getFieldsForGroup = React.useCallback((groupId: string): string[] => {
    const fieldIds = groupFields[groupId];
    if (!fieldIds) return [];

    return fieldIds.filter((fieldId) => fieldConfigs[fieldId]);
  }, [groupFields, fieldConfigs]);

  // Validation functions
  const validateField = React.useCallback(
    (fieldPath: string, config: FieldConfig, value: any): string | null => {
      // Required field validation
      if (
        config.required &&
        (value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0))
      ) {
        return `${config.label || fieldPath} is required`;
      }

      // Custom validator if provided
      if (config.validator) {
        const result = config.validator(value);
        if (!result.isValid) {
          return result.message || `${config.label || fieldPath} is invalid`;
        }
      }

      // Type-specific validation
      if (
        config.type === "email" &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        return "Please enter a valid email address";
      }

      if (config.type === "url" && value && !/^https?:\/\/.+/.test(value)) {
        return "Please enter a valid URL";
      }

      if (config.type === "number" && value && isNaN(Number(value))) {
        return "Please enter a valid number";
      }

      return null;
    },
    []
  );

  // Function to check if a field should be visible based on conditional rendering
  const shouldShowField = React.useCallback(
    (config: FieldConfig, formData: FormData): boolean => {
      if (!config.watchField || config.showWhen === undefined) {
        return true;
      }

      const watchedValue = formData[config.watchField];

      // Handle array values for showWhen
      if (Array.isArray(config.showWhen)) {
        const isIncluded = config.showWhen.includes(watchedValue);
        return config.showOnMatch !== false ? isIncluded : !isIncluded;
      }

      // Handle comma-separated string values for showWhen (e.g., "yes,planned")
      if (
        typeof config.showWhen === "string" &&
        config.showWhen.includes(",")
      ) {
        const showWhenArray = config.showWhen.split(",").map((s) => s.trim());
        const isIncluded = showWhenArray.includes(watchedValue);
        return config.showOnMatch !== false ? isIncluded : !isIncluded;
      }

      // Handle single value for showWhen
      const matches = watchedValue === config.showWhen;
      return config.showOnMatch !== false ? matches : !matches;
    },
    []
  );

  const getSectionErrorCount = React.useCallback(
    (sectionId: string): number => {
      const sectionGroups = getSortedGroups(sectionId);
      let errorCount = 0;

      sectionGroups.forEach((group) => {
        const fields = getFieldsForGroup(group.id);
        fields.forEach((fieldPath) => {
          const config = fieldConfigs[fieldPath];
          if (!config) return;

          // Check if field is currently visible
          const isVisible = shouldShowField(config, formData);

          // Only count errors for visible fields
          if (isVisible && validationResult.errors[fieldPath]) {
            errorCount++;
          }
        });
      });

      return errorCount;
    },
    [
      validationResult.errors,
      getSortedGroups,
      getFieldsForGroup,
      fieldConfigs,
      formData,
      shouldShowField,
    ]
  );

  // Function to validate conditional fields when their watched field changes
  // Create a dependency map for conditional fields to avoid iterating through all fields
  const conditionalFieldDependencies = React.useMemo(() => {
    const dependencies: Record<string, string[]> = {};
    Object.entries(fieldConfigs).forEach(([fieldPath, config]) => {
      if (config.watchField) {
        if (!dependencies[config.watchField]) {
          dependencies[config.watchField] = [];
        }
        dependencies[config.watchField].push(fieldPath);
      }
    });
    return dependencies;
  }, [fieldConfigs]);

  const validateConditionalFields = React.useCallback(
    (watchedFieldPath: string, watchedValue: any) => {
      // Get only the fields that depend on this field (much more efficient)
      const dependentFields =
        conditionalFieldDependencies[watchedFieldPath] || [];

      if (dependentFields.length === 0) return;

      const fieldsToValidate: Array<{
        fieldPath: string;
        config: FieldConfig;
        value: any;
      }> = [];
      const fieldsToHide: string[] = [];

      // Process only the dependent fields
      dependentFields.forEach((fieldPath) => {
        const config = fieldConfigs[fieldPath];
        if (!config || config.showWhen === undefined) return;

        const shouldShow = shouldShowField(config, formData);

        if (shouldShow) {
          // Field is now visible, validate it
          const value = formData[fieldPath];
          fieldsToValidate.push({ fieldPath, config, value });
        } else {
          // Field is now hidden, mark for error clearing
          fieldsToHide.push(fieldPath);
        }
      });

      // Batch update validation results to reduce re-renders
      setValidationResult((prev) => {
        const newErrors = { ...prev.errors };

        // Clear errors for hidden fields
        fieldsToHide.forEach((fieldPath) => {
          delete newErrors[fieldPath];
        });

        // Validate visible fields
        fieldsToValidate.forEach(({ fieldPath, config, value }) => {
          const error = validateField(fieldPath, config, value);
          if (error) {
            newErrors[fieldPath] = error;
          } else {
            delete newErrors[fieldPath];
          }
        });

        return {
          ...prev,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0,
        };
      });
    },
    [
      conditionalFieldDependencies,
      fieldConfigs,
      formData,
      validateField,
      shouldShowField,
    ]
  );

  // Handle field changes for wizard mode - optimized with refs
  const handleWizardFieldChange = React.useCallback(
    (fieldPath: string, value: any) => {
      if (modeRef.current !== "wizard" || wizardStepsRef.current.length === 0)
        return;

      const currentStepObj = wizardStepsRef.current[currentStepRef.current];
      if (!currentStepObj) return;

      // Update main form data
      setFormData((prev) => ({
        ...prev,
        [fieldPath]: value,
      }));

      // Validate the field immediately on change
      const config = fieldConfigsRef.current[fieldPath];
      if (config) {
        const error = validateFieldRef.current(fieldPath, config, value);

        setStepValidation((prev) => {
          const currentStepValidation = prev[currentStepObj.id] || {
            isValid: true,
            errors: {},
            warnings: {},
          };
          const newErrors = { ...currentStepValidation.errors };

          if (error) {
            newErrors[fieldPath] = error;
          } else {
            delete newErrors[fieldPath];
          }

          const newStepValidation = {
            ...prev,
            [currentStepObj.id]: {
              ...currentStepValidation,
              errors: newErrors,
              isValid: Object.keys(newErrors).length === 0,
            },
          };

          return newStepValidation;
        });
      }

      // Validate conditional fields that depend on this field
      validateConditionalFieldsRef.current(fieldPath, value);
    },
    []
  ); // Empty dependencies - stable callback

  // Debounced validation function to prevent excessive validation on every keystroke
  const debouncedValidation = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Cleanup debounced validation timeouts on unmount
  React.useEffect(() => {
    const timeouts = debouncedValidation.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Use refs for stable references to prevent callback recreation
  const modeRef = React.useRef(mode);
  const fieldConfigsRef = React.useRef(fieldConfigs);
  const validateFieldRef = React.useRef(validateField);
  const validateConditionalFieldsRef = React.useRef(validateConditionalFields);
  const wizardStepsRef = React.useRef(wizardSteps);
  const currentStepRef = React.useRef(currentStep);

  // Update refs when values change
  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  React.useEffect(() => {
    fieldConfigsRef.current = fieldConfigs;
  }, [fieldConfigs]);

  React.useEffect(() => {
    validateFieldRef.current = validateField;
  }, [validateField]);

  React.useEffect(() => {
    validateConditionalFieldsRef.current = validateConditionalFields;
  }, [validateConditionalFields]);

  React.useEffect(() => {
    wizardStepsRef.current = wizardSteps;
  }, [wizardSteps]);

  React.useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Optimized field change handler with stable callback
  const handleFieldChangeWithValidation = React.useCallback(
    (fieldPath: string, value: any) => {
      // In wizard mode, use wizard field change handler
      if (modeRef.current === "wizard") {
        handleWizardFieldChange(fieldPath, value);
        return;
      }

      // Use startTransition to mark this update as non-urgent
      // This breaks it out of the synchronous click handler
      React.startTransition(() => {
        // Update form data immediately for responsive UI
        setFormData((prevData) => ({
          ...prevData,
          [fieldPath]: value,
        }));
        setIsDirty(true);
      });

      // Clear existing timeout for this field
      if (debouncedValidation.current[fieldPath]) {
        clearTimeout(debouncedValidation.current[fieldPath]);
      }

      // Debounce validation to prevent excessive validation on every keystroke
      debouncedValidation.current[fieldPath] = setTimeout(() => {
        const config = fieldConfigsRef.current[fieldPath];
        if (!config) return;

        const error = validateFieldRef.current(fieldPath, config, value);

        setValidationResult((prev) => {
          const newErrors = { ...prev.errors };

          if (error) {
            newErrors[fieldPath] = error;
          } else {
            delete newErrors[fieldPath];
          }

          return {
            ...prev,
            errors: newErrors,
            isValid: Object.keys(newErrors).length === 0,
          };
        });

        // Validate conditional fields that depend on this field
        validateConditionalFieldsRef.current(fieldPath, value);

        delete debouncedValidation.current[fieldPath];
      }, 300); // 300ms delay
    },
    [handleWizardFieldChange]
  );

  const renderField = (
    fieldPath: string,
    config: FieldConfig
  ): React.ReactNode => {
    // For calculated fields, get the calculated value
    let value = formData[fieldPath];
    if (config.calculated && config.formula) {
      value = calculateFormulaValue(fieldPath, config);
    }

    // Get error from appropriate validation state
    let error = validationResult.errors[fieldPath];
    if (mode === "wizard" && wizardSteps.length > 0) {
      const currentStepObj = wizardSteps[currentStep];
      if (currentStepObj && stepValidation[currentStepObj.id]) {
        error = stepValidation[currentStepObj.id].errors[fieldPath] || error;
      }
    }

    // Conditional rendering is now handled at the group level
    // This ensures the entire Form.Item (including label) is hidden when field should not be shown

    // Extract field-specific properties that should be passed to widgets
    const fieldSpecificProps = extractFieldSpecificProps(config);

    // Check if field should be disabled when pre-populated
    const urlParams = new URLSearchParams(window.location.search);
    const isPrePopulated =
      config.disableWhenPrePopulated && urlParams.get(config.id);

    // Generic handling for pre-populated fields based on metadata configuration
    let effectiveFieldType = config.type;
    let effectiveValue = value ?? "";

    if (isPrePopulated && config.prePopulatedFieldType) {
      // Change field type based on metadata configuration
      effectiveFieldType = config.prePopulatedFieldType;

      // Use fetched display name if available in formData
      const displayNameField = config.prePopulatedDisplayField;
      if (displayNameField && formData[displayNameField]) {
        effectiveValue = formData[displayNameField];
      } else if (config.options && Array.isArray(config.options)) {
        // Fallback to options if display name not fetched yet
        const selectedOption = config.options.find(
          (opt) => opt.value === effectiveValue
        );
        if (selectedOption) {
          effectiveValue = selectedOption.label;
        }
      }

      // Update label based on metadata configuration
    }

    const baseProps = {
      value: effectiveValue,
      onChange: (newValue: any) =>
        handleFieldChangeWithValidation(fieldPath, newValue),
      disabled: config.disabled || isPrePopulated,
      size: "middle" as const,
      placeholder: config.placeholder,
      // Remove hardcoded width to allow Ant Design grid system to work
      required: config.required,
      status: error ? ("error" as const) : undefined,
      // Don't pass errorMessage to widgets when using Form.Item error handling
      // errorMessage: error,
      fieldPath,
      options: config.options,
      widgetProps: config.widgetProps,
      formData: formData, // Pass the entire form data to widgets
      ...fieldSpecificProps,
      ...config.props,
    };

    // Props for widgets that support underlined variant
    const underlinedProps = {
      ...baseProps,
      variant: "underlined" as const,
    };

    // Props for widgets that don't support underlined variant
    const standardProps = {
      ...baseProps,
      variant: "outlined" as const,
    };

    // Get the widget factory function using effective field type
    const widgetFactoryFn =
      widgetFactory[effectiveFieldType as keyof typeof widgetFactory];

    if (widgetFactoryFn) {
      const props = getPropsForWidget(
        effectiveFieldType || "",
        baseProps,
        underlinedProps,
        standardProps
      );
      return widgetFactoryFn(props);
    }

    // Fallback to default widget
    console.warn(
      `Widget type "${effectiveFieldType}" not found in factory, using default InputFieldWidget`
    );
    return React.createElement(
      require("../../widgets/input").InputFieldWidget,
      underlinedProps
    );
  };

  const renderGroupCard = (group: FormGroup): React.ReactNode => {
    const isCollapsed =
      collapsedGroups[group.id] ||
      (group.defaultCollapsed && collapsedGroups[group.id] === undefined);
    const fields = getFieldsForGroup(group.id);

    if (fields.length === 0) {
      return null;
    }

    const cardTitle = (
      <Space>
        {getGroupIcon(group.id, groups)}
        <span>{group.title}</span>
      </Space>
    );

    return (
      <Card
        key={group.id}
        title={cardTitle}
        size="small"
        className="form-group-card"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surface) !important",
          border: "none",
          borderBottom: "none",
          boxShadow: "none",
        }}
        bodyStyle={isCollapsed ? { padding: 0 } : undefined}
        extra={
          group.collapsible ? (
            <Button
              type="text"
              size="small"
              onClick={() => handleGroupToggle(group.id)}
            >
              {isCollapsed ? "Expand" : "Collapse"}
            </Button>
          ) : undefined
        }
      >
        {!isCollapsed && (
          <Row
            key={`${group.id}-${isDirty ? "dirty" : "clean"}`}
            gutter={[16, 16]}
          >
            {fields.map((fieldPath) => {
              const config = fieldConfigs[fieldPath];
              if (!config) return null;

              // Check conditional rendering at the group level to hide entire Form.Item
              if (!shouldShowField(config, formData)) {
                return null;
              }

              // Use field size directly for 24-column grid system
              const baseSpan = config.size
                ? Math.min(Number(config.size), 24)
                : 24;
              const responsiveSpan = {
                xs: baseSpan, // Use defined size on all screen sizes
                sm: baseSpan,
                md: baseSpan,
                lg: baseSpan,
                xl: baseSpan,
                xxl: baseSpan,
              };

              // Get error from appropriate validation state (same logic as renderField)
              let error = validationResult.errors[fieldPath];
              if (mode === "wizard" && wizardSteps.length > 0) {
                const currentStepObj = wizardSteps[currentStep];
                if (currentStepObj && stepValidation[currentStepObj.id]) {
                  error =
                    stepValidation[currentStepObj.id].errors[fieldPath] ||
                    error;
                }
              }

              // Calculate effective label for pre-populated fields based on metadata configuration
              const urlParams = new URLSearchParams(window.location.search);
              const isPrePopulated =
                config.disableWhenPrePopulated && urlParams.get(config.id);
              let effectiveLabel = config.label;

              if (isPrePopulated && config.prePopulatedLabel) {
                effectiveLabel = config.prePopulatedLabel;
              }

              return (
                <Col
                  key={fieldPath}
                  {...responsiveSpan}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <Form.Item
                    key={fieldPath}
                    label={
                      config.tooltip ? (
                        <Space size="small">
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "200px",
                            }}
                          >
                            {effectiveLabel}
                          </span>
                          <Tooltip title={config.tooltip}>
                            <QuestionCircleOutlined
                              style={{
                                color: "var(--color-text-secondary)",
                                fontSize: "12px",
                              }}
                            />
                          </Tooltip>
                        </Space>
                      ) : (
                        effectiveLabel
                      )
                    }
                    help={error}
                    required={config.required}
                    validateStatus={error ? "error" : undefined}
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                  >
                    {renderField(fieldPath, config)}
                  </Form.Item>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    );
  };

  const renderSectionContent = (sectionId: string): React.ReactNode => {
    const groups = getSortedGroups(sectionId);
    const isLoading = loadingSections.has(sectionId);
    const hasError = sectionErrors[sectionId];

    // Show loading state
    if (isLoading) {
      return (
        <div
          style={{
            textAlign: "center",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Spin size="large" />
            <Text type="secondary">Loading section content...</Text>
          </div>
        </div>
      );
    }

    // Show error state
    if (hasError) {
      return (
        <div
          style={{
            textAlign: "center",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <Alert
            message="Error Loading Section"
            description={hasError}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                onClick={() => {
                  const section = sections[sectionId];
                  if (section?.sectionOptionsUrl) {
                    loadSectionMetadata(sectionId, section.sectionOptionsUrl);
                  }
                }}
              >
                Retry
              </Button>
            }
          />
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div
          style={{
            textAlign: "center",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text type="secondary">No groups found in this section</Text>
        </div>
      );
    }

    return (
      <div className="form-section-content">
        <Form
          layout="vertical"
          className="form-underline"
          style={{ height: "100%" }}
        >
          <Row gutter={[16, 24]}>
            {groups.map((group) => {
              // Use group.size directly for 24-column grid system
              const baseSpan = group.size
                ? Math.min(Number(group.size), 24)
                : 24;
              const responsiveSpan = {
                xs: baseSpan, // Use defined size on all screen sizes
                sm: baseSpan, // Use defined size on all screen sizes
                md: baseSpan, // Use defined size on all screen sizes
                lg: baseSpan, // Use defined size on large screens
                xl: baseSpan, // Use defined size on extra large screens
              };
              // console.log(`[FormRenderer] Group ${group.id} span:`, responsiveSpan);
              return (
                <Col
                  key={group.id}
                  {...responsiveSpan}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {renderGroupCard(group)}
                </Col>
              );
            })}
          </Row>
        </Form>
      </div>
    );
  };

  const renderSectionMenu = (): React.ReactNode => {
    const sortedSections = getSortedSections();

    if (sortedSections.length === 0) {
      return null;
    }

    return (
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: "8px",
        }}
      >
        {sortedSections.map((section) => {
          const errorCount = getSectionErrorCount(section.id);
          const hasErrors = errorCount > 0;
          const isSelected = activeSection === section.id;

          const isLoading = loadingSections.has(section.id);
          const hasSectionError = sectionErrors[section.id];

          return (
            <div
              key={section.id}
              style={{
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                cursor: "pointer",
                margin: "2px 8px",
                borderRadius: "8px",
                background: isSelected ? "hsl(var(--primary))" : "transparent",
                color: isSelected
                  ? "hsl(var(--primary-foreground))"
                  : "hsl(var(--foreground))",
                transition: "all 0.2s ease",
                position: "relative",
                padding: "0 12px",
              }}
              onClick={() => handleSectionChange(section.id)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "hsl(var(--muted))";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <div
                style={{
                  position: "relative",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              >
                {getSectionIcon(section.id, sections)}
                {isLoading && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "hsl(var(--primary))",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                )}
                {hasSectionError && (
                  <Badge
                    count={
                      <AntIcons.ExclamationCircleOutlined
                        style={{
                          color: "hsl(var(--destructive-foreground))",
                          fontSize: "8px",
                        }}
                      />
                    }
                    size="small"
                    style={{
                      backgroundColor: "hsl(var(--destructive))",
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                    }}
                  />
                )}
                {hasErrors && !hasSectionError && (
                  <Badge
                    count={errorCount}
                    size="small"
                    style={{
                      backgroundColor: "hsl(var(--destructive))",
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected
                    ? "hsl(var(--primary-foreground))"
                    : "hsl(var(--foreground))",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {section.title}
              </div>
              {hasErrors && (
                <div
                  style={{
                    fontSize: "11px",
                    color: isSelected
                      ? "hsl(var(--primary-foreground))"
                      : "hsl(var(--destructive))",
                    marginLeft: "8px",
                    flexShrink: 0,
                  }}
                >
                  {errorCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderFormHeader = (): React.ReactNode => {
    const { title, description, headerActions } = gadget.config as any;

    // If no title and no description, return null to hide header
    if (!title && !description) {
      return null;
    }

    const handleClose = () => {
      const config = gadget.config as any;

      if (config.onCancel?.action === "navigate") {
        triggerNavigation(config.onCancel.target, undefined, { replace: true });
      } else if (config.onCancel?.action === "close") {
        triggerNavigation(undefined);
      } else {
        triggerNavigation(config.onCancel?.target);
      }
    };

    const handleMaximize = () => {
      // Toggle fullscreen mode
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };

    return (
      <>
        <div style={{ flex: 1 }}>
          {title && (
            <Title level={4} style={{ color: "var(--color-text)", margin: 0 }}>
              {title}
              {isDirty && <Badge status="warning" style={{ marginLeft: 8 }} />}
            </Title>
          )}

          {description && (
            <Typography.Text
              type="secondary"
              style={{
                display: "block",
                marginTop: 4,
                color: "var(--color-text-secondary)",
              }}
            >
              {description}
            </Typography.Text>
          )}
        </div>
        {headerActions &&
          (headerActions.showClose || headerActions.showMaximize) && (
            <Space style={{ marginLeft: "auto" }}>
              {headerActions.showMaximize && (
                <Button
                  type="text"
                  icon={React.createElement(AntIcons.FullscreenOutlined as any)}
                  onClick={handleMaximize}
                  title="Toggle Fullscreen"
                />
              )}
              {headerActions.showClose && (
                <Button
                  type="text"
                  icon={React.createElement(AntIcons.CloseOutlined as any)}
                  onClick={handleClose}
                  title="Close"
                />
              )}
            </Space>
          )}
      </>
    );
  };

  const renderActions = (): React.ReactNode => {
    const {
      showSaveButton = true,
      showResetButton = true,
      showClearButton = false,
      showCancelButton = false,
      readOnly,
    } = gadget.config;

    if (readOnly) {
      return null;
    }

    // Wizard navigation
    if (mode === "wizard") {
      const isFirstStep = currentStep === 0;
      const isLastStep = currentStep === wizardSteps.length - 1;
      const currentStepObj = wizardSteps[currentStep];
      const currentStepValidation = currentStepObj
        ? stepValidation[currentStepObj.id]
        : null;
      const hasErrors = currentStepValidation && !currentStepValidation.isValid;

      return (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",

            gap: "12px",
          }}
        >
          <Button
            size="small"
            icon={<AntIcons.LeftOutlined />}
            onClick={handlePreviousStep}
            disabled={isFirstStep || wizardLoading || false}
          >
            Previous
          </Button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {hasErrors && (
              <Text type="danger" style={{ fontSize: "11px" }}>
                Fix errors to continue
              </Text>
            )}
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {currentStep + 1} / {wizardSteps.length}
            </Text>
          </div>

          {isLastStep ? (
            <Button
              type="primary"
              size="small"
              icon={<AntIcons.CheckOutlined />}
              onClick={handleNextStep}
              loading={wizardLoading || false}
              disabled={hasErrors || false}
            >
              Complete
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<AntIcons.RightOutlined />}
              onClick={handleNextStep}
              loading={wizardLoading || false}
              disabled={hasErrors || false}
            >
              Next
            </Button>
          )}
        </div>
      );
    }

    // If no actions are enabled, don't render footer space
    if (
      !showSaveButton &&
      !showResetButton &&
      !showClearButton &&
      !showCancelButton
    ) {
      return null;
    }

    // Regular form actions
    return (
      <Space size="middle">
        {showCancelButton && (
          <Button
            icon={<AntIcons.CloseOutlined />}
            onClick={() => {
              const config = gadget.config as any;
              if (config.onCancel?.action === "navigate") {
                triggerNavigation(config.onCancel.target, undefined, {
                  replace: true,
                });
              } else {
                triggerNavigation(undefined);
              }
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}

        {showClearButton && (
          <Button
            icon={<AntIcons.ClearOutlined />}
            onClick={() => {
              setFormData({});
              setIsDirty(true);
            }}
            disabled={isSubmitting}
          >
            Clear
          </Button>
        )}

        {showResetButton && (
          <Button
            icon={<AntIcons.ReloadOutlined />}
            onClick={() => {
              setFormData({ ...originalData });
              setIsDirty(false);
              setValidationResult({ isValid: true, errors: {}, warnings: {} });
            }}
            disabled={isSubmitting || !isDirty}
          >
            Reset
          </Button>
        )}

        {showSaveButton && (
          <Button
            type="primary"
            icon={<AntIcons.SaveOutlined />}
            loading={isSubmitting}
            onClick={async () => {
              // Validate line items before submission
              const lineItemsValidation = validateLineItems(formData);

              // Check if form is valid before saving
              if (validationResult.isValid && lineItemsValidation.isValid) {
                setIsSubmitting(true);

                try {
                  // Get save configuration from gadget config
                  const config = gadget.config as any;
                  const isEdit = formData.id && formData.id !== "new";

                  // Determine URL and method
                  let url = isEdit ? config.updateUrl : config.submitUrl;
                  const method = isEdit
                    ? config.updateMethod || "PUT"
                    : config.submitMethod || "POST";

                  // Replace URL parameters
                  if (url && formData.id && formData.id !== "new") {
                    url = url.replace("{id}", formData.id);
                  }

                  if (!url) {
                    throw new Error("No save URL configured");
                  }

                  // Check authentication status
                  const token = localStorage.getItem("authToken");

                  console.log("🔐 Authentication status:", {
                    hasToken: !!token,
                    tokenLength: token?.length,
                    tokenPreview: token?.substring(0, 20) + "...",
                  });

                  // Prepare data for submission
                  const submitData = { ...formData };

                  // Add type for new records
                  if (!isEdit && config.submitUrl === "/api/documents") {
                    submitData.type = config.documentType || "company"; // Use configured document type
                  }

                  // Remove UI-only fields
                  if (submitData.id === "new" || !submitData.id) {
                    delete submitData.id;
                  }

                  // Make authenticated API call using BaseGadget's method
                  const { BaseGadget } = await import("../base");
                  const response = await BaseGadget.makeAuthenticatedFetch(
                    url,
                    {
                      method,
                      body: JSON.stringify(submitData),
                    }
                  );

                  if (!response.ok) {
                    // Get detailed error information
                    let errorDetails;
                    try {
                      errorDetails = await response.json();
                    } catch {
                      errorDetails = { message: response.statusText };
                    }

                    console.error("❌ API Error Details:", {
                      status: response.status,
                      statusText: response.statusText,
                      errorDetails,
                    });

                    throw new Error(
                      `Save failed (${response.status}): ${
                        errorDetails.error ||
                        errorDetails.message ||
                        response.statusText
                      }`
                    );
                  }

                  // Show success message
                  const successMessage =
                    config.onSaveSuccess?.message || "Saved successfully!";
                  message.success(successMessage);

                  if (config.onSaveSuccess?.action === "navigate") {
                    const targetWorkspace = config.onSaveSuccess.target || undefined;
                    const params = config.onSaveSuccess.params as Record<string, string> | undefined;

                    setTimeout(() => {
                      triggerNavigation(targetWorkspace, params, { replace: true });
                    }, 300);
                  }

                  // Refresh asset data
                  window.dispatchEvent(new CustomEvent("asset-data-refresh"));

                  setIsDirty(false);
                } catch (error: any) {
                  console.error("❌ Save failed:", error);

                  // Handle validation errors from server
                  if (
                    error.response?.data?.error === "Validation failed" &&
                    error.response?.data?.details
                  ) {
                    const validationErrors: Record<string, string> = {};

                    error.response.data.details.forEach((detail: any) => {
                      const fieldPath = detail.path.join(".");
                      // Take the first error message for each field
                      if (!validationErrors[fieldPath]) {
                        validationErrors[fieldPath] = detail.message;
                      }
                    });

                    // Update validation state to show errors
                    setValidationResult({
                      isValid: false,
                      errors: validationErrors,
                      warnings: {},
                    });

                    // Show summary message
                    message.error("Please fix the validation errors below");
                  } else {
                    // Generic error handling
                    const errorMessage =
                      (gadget.config as any).onSaveError?.message ||
                      "Failed to save. Please try again.";
                    message.error(errorMessage);
                  }
                } finally {
                  setIsSubmitting(false);
                }
              } else {
                // Form has validation errors, don't submit
                setIsSubmitting(false);

                // If line items validation failed, update validation state
                if (!lineItemsValidation.isValid) {
                  setValidationResult((prev) => ({
                    isValid: false,
                    errors: { ...prev.errors, ...lineItemsValidation.errors },
                    warnings: prev.warnings,
                  }));
                }

                message.warning("Please fix validation errors before saving");
              }
            }}
          >
            Save
          </Button>
        )}
      </Space>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Form"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => setError(null)}>
            Retry
          </Button>
        }
      />
    );
  }

  if (
    !isInitialized ||
    !fieldConfigs ||
    Object.keys(fieldConfigs).length === 0
  ) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Spin size="large" />
        <div style={{ marginLeft: "12px" }}>
          <Text type="secondary">Loading form configuration...</Text>
        </div>
      </div>
    );
  }

  const sortedSections = getSortedSections();
  const headerContent = renderFormHeader();

  return (
    <div
      style={{
        height: fitContent
          ? "auto"
          : (gadget.config as any).fullHeight
          ? "calc(100vh - 180px)"
          : "calc(100vh - 280px)",
        display: "flex",
        flexDirection: "column",
        overflow: fitContent ? "visible" : "hidden",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        boxShadow:
          "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      {/* Header - Fixed (only if content exists) */}
      {headerContent && (
        <div
          style={{
            minHeight: "60px",
            flexShrink: 0,
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border, #e5e7eb)",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {headerContent}
        </div>
      )}

      {/* Wizard Progress Bar - Slim border-style progress */}
      {mode === "wizard" && (
        <div
          style={{
            flexShrink: 0,
            background: "transparent",
            borderBottom: "none",
            padding: "0",
            height: "4px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "var(--color-primary)",
              width: `${gadget.getWizardProgress()}%`,
              transition: "width 0.3s ease",
              borderRadius: "0 2px 2px 0",
            }}
          />
        </div>
      )}

      {/* Wizard Breadcrumbs - Compact step navigation */}
      {mode === "wizard" && (
        <div
          style={{
            flexShrink: 0,
            background: "var(--color-surface)",
            borderBottom: "none",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
          }}
        >
          {wizardSteps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isActive = index === currentStep;
            const currentStepValidation = stepValidation[step.id];
            const hasErrors =
              currentStepValidation && !currentStepValidation.isValid;

            return (
              <React.Fragment key={index}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: gadget.config.allowStepNavigation
                      ? "pointer"
                      : "default",
                    background: isActive
                      ? "var(--color-primary)"
                      : isCompleted
                      ? "var(--color-success-bg)"
                      : "transparent",
                    color: isActive
                      ? "var(--color-text)"
                      : isCompleted
                      ? "var(--color-success)"
                      : "var(--color-text-secondary)",
                    fontWeight: isActive ? "600" : "400",
                    fontSize: "11px",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() =>
                    gadget.config.allowStepNavigation && handleStepChange(index)
                  }
                >
                  {step.icon &&
                    (() => {
                      try {
                        const IconComponent = (AntIcons as any)[step.icon];
                        if (
                          IconComponent &&
                          typeof IconComponent === "function"
                        ) {
                          return <IconComponent style={{ fontSize: "10px" }} />;
                        } else {
                          return (
                            <AntIcons.FormOutlined
                              style={{ fontSize: "10px" }}
                            />
                          );
                        }
                      } catch (error) {
                        return React.createElement(AntIcons.FormOutlined, {
                          style: { fontSize: "10px" },
                        });
                      }
                    })()}
                  <span>{step.title}</span>
                  {hasErrors && (
                    <AntIcons.ExclamationCircleOutlined
                      style={{
                        color: "var(--color-error)",
                        fontSize: "10px",
                      }}
                    />
                  )}
                </div>
                {index < wizardSteps.length - 1 && (
                  <AntIcons.RightOutlined
                    style={{
                      fontSize: "8px",
                      color: "var(--color-text-secondary)",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Body - Contains sidebar and content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
          position: "relative", // For mobile overlay positioning
        }}
      >
        {Object.keys(sections).length > 0 ? (
          <>
            {/* Sidebar - Only show on desktop and NOT in wizard mode (unless hidden via config) */}
            {!isMobile &&
              mode !== "wizard" &&
              !(gadget.config as any)?.hideSidebar && (
                <div
                  className="form-sidebar"
                  style={{
                    width: "220px",
                    flexShrink: 0,
                    background: "hsl(var(--background))",
                    borderRight: "1px solid hsl(var(--border))",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    transition: "width 0.3s ease",
                    boxShadow: "2px 0 8px hsl(var(--border) / 0.1)",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      minHeight: "50px",
                      boxShadow: "0 1px 3px hsl(var(--border))",
                    }}
                  >
                    <Text
                      strong
                      style={{
                        color: "hsl(var(--foreground))",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      Form Sections
                    </Text>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      overflowX: "hidden",
                      padding: "8px 0",
                    }}
                  >
                    {renderSectionMenu()}
                  </div>
                </div>
              )}

            {/* Content - Full width on mobile, with sidebar on desktop */}
            <div
              ref={contentContainerRef}
              style={{
                flex: 1,
                overflowY: fitContent ? "visible" : "auto",
                overflowX: "hidden",
                padding: isMobile ? "12px" : "12px",
                background: "transparent",
              }}
            >
              {mode === "wizard" ? (
                // Wizard mode: Show only current step's section
                (() => {
                  const currentStepObj = wizardSteps[currentStep];
                  if (!currentStepObj) {
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <Text type="secondary">No step data available</Text>
                      </div>
                    );
                  }

                  const currentSection = sortedSections.find(
                    (section) => section.id === currentStepObj.id
                  );
                  if (!currentSection) {
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <Text type="secondary">Step section not found</Text>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        padding: 0,
                        borderRadius: 0,
                        background: "transparent",
                        border: "none",
                      }}
                    >
                      {renderSectionContent(currentSection.id)}
                    </div>
                  );
                })()
              ) : isMobile ? (
                // Mobile: Show all sections in a single scrollable view
                <div>
                  {sortedSections.map((section) => (
                    <div
                      key={`mobile-section-${section.id}`}
                      ref={(el) => {
                        sectionRefs.current[section.id] = el;
                      }}
                      style={{
                        marginBottom: "16px",
                        borderRadius: 0,
                        background: "transparent",
                        padding: 0,
                        border: "none",
                      }}
                    >
                      {/* Section Header */}
                      <div
                        style={{
                          background: "transparent",
                          padding: "8px 12px",
                          borderBottom: "none",
                          borderRadius: "0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "none",
                        }}
                        onClick={() => scrollToSection(section.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-hover)";
                          e.currentTarget.style.color = "var(--color-text)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--color-text)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {getSectionIcon(section.id, sections)}
                        <Title
                          level={5}
                          style={{
                            color: "inherit",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          {section.title}
                        </Title>
                        {getSectionErrorCount(section.id) > 0 && (
                          <Badge
                            count={getSectionErrorCount(section.id)}
                            size="small"
                            style={{ backgroundColor: "var(--color-error)" }}
                          />
                        )}
                      </div>

                      {/* Section Content */}
                      <div
                        style={{
                          background: "transparent",
                          border: "none",
                          borderRadius: "0",
                          padding: "0",
                        }}
                      >
                        {renderSectionContent(section.id)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop: Show all sections in scrollable view (like mobile)
                <div>
                  {sortedSections.map((section) => (
                    <div
                      key={`desktop-section-${section.id}`}
                      ref={(el) => {
                        sectionRefs.current[section.id] = el;
                      }}
                      style={{
                        marginBottom: "16px",
                        borderRadius: "8px",
                        background: "var(--color-surface-darker) !important",
                        padding: "0",
                        border: "1px solid transparent",
                      }}
                    >
                      {/* Section Header */}
                      <div
                        style={{
                          background: "transparent",
                          padding: "12px 16px",
                          borderBottom: "none",
                          borderRadius: "0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "none",
                        }}
                        onClick={() => scrollToSection(section.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-hover)";
                          e.currentTarget.style.color = "var(--color-text)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--color-text)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {getSectionIcon(section.id, sections)}
                        <Title
                          level={5}
                          style={{
                            color: "inherit",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          {section.title}
                        </Title>
                        {getSectionErrorCount(section.id) > 0 && (
                          <Badge
                            count={getSectionErrorCount(section.id)}
                            size="small"
                            style={{ backgroundColor: "var(--color-error)" }}
                          />
                        )}
                      </div>

                      {/* Section Content */}
                      <div
                        style={{
                          background: "transparent",
                          border: "none",
                          borderRadius: "0",
                          padding: "0 16px 16px 16px",
                        }}
                      >
                        {renderSectionContent(section.id)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scroll to Top Button - Mobile Only */}
            {isMobile && showScrollToTop && (
              <Button
                type="primary"
                shape="circle"
                icon={<AntIcons.ArrowUpOutlined />}
                onClick={() => {
                  contentContainerRef.current?.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                style={{
                  position: "fixed",
                  bottom: "80px",
                  right: "20px",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            )}
          </>
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: 0,
              background: "var(--color-surface)",
            }}
          >
            <Form
              layout="vertical"
              size={gadget.config.size || "middle"}
              className="form-underline"
              style={{ height: "100%" }}
            >
              {mode === "wizard" ? (
                // Wizard mode: Use group-based layout for proper sizing
                (() => {
                  const currentStepObj = wizardSteps[currentStep];
                  if (!currentStepObj) return null;

                  // Get the current section ID from the wizard step
                  const currentSectionId = currentStepObj.id;

                  // Get groups for this section
                  const sectionGroups = getSortedGroups(currentSectionId);

                  return (
                    <Row gutter={[16, 24]}>
                      {sectionGroups.map((group) => {
                        // Get fields for this group that are in the current wizard step
                        const groupFieldIds = getFieldsForGroup(group.id);
                        const wizardFields = groupFieldIds.filter(
                          (fieldId) => currentStepObj.fields[fieldId]
                        );

                        if (wizardFields.length === 0) return null;

                        // Use group.size directly for 24-column grid system
                        const baseSpan = group.size
                          ? Math.min(Number(group.size), 24)
                          : 24;
                        const responsiveSpan = {
                          xs: baseSpan, // Use defined size on all screen sizes
                          sm: baseSpan, // Use defined size on all screen sizes
                          md: baseSpan, // Use defined size on all screen sizes
                          lg: baseSpan, // Use defined size on large screens
                          xl: baseSpan, // Use defined size on extra large screens
                        };

                        return (
                          <Col
                            key={group.id}
                            {...responsiveSpan}
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            {renderGroupCard(group)}
                          </Col>
                        );
                      })}
                    </Row>
                  );
                })()
              ) : (
                // Regular form mode: Flat layout
                <Row gutter={[16, 24]}>
                  {Object.keys(fieldConfigs).map((fieldPath) => {
                    const config = fieldConfigs[fieldPath];
                    if (!config) return null;
                    // Check conditional rendering for flat layout
                    if (!shouldShowField(config, formData)) {
                      return null;
                    }
                    const baseSpan = config.size
                      ? Math.min(Number(config.size), 24)
                      : 24;
                    const responsiveSpan = {
                      xs: baseSpan, // Use defined size on all screen sizes
                      sm: baseSpan, // Use defined size on all screen sizes
                      md: baseSpan, // Use defined size on all screen sizes
                      lg: baseSpan, // Use defined size on large screens
                      xl: baseSpan, // Use defined size on extra large screens
                    };
                    // Get error from appropriate validation state (same logic as renderField)
                    let error = validationResult.errors[fieldPath];
                    if (mode === "wizard" && wizardSteps.length > 0) {
                      const currentStepObj = wizardSteps[currentStep];
                      if (currentStepObj && stepValidation[currentStepObj.id]) {
                        error =
                          stepValidation[currentStepObj.id].errors[fieldPath] ||
                          error;
                      }
                    }

                    return (
                      <Col
                        key={fieldPath}
                        {...responsiveSpan}
                        style={{ display: "flex", flexDirection: "column" }}
                      >
                        <Form.Item
                          key={fieldPath}
                          label={
                            config.tooltip ? (
                              <Space size="small">
                                <span
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "200px",
                                  }}
                                >
                                  {config.label}
                                </span>
                                <Tooltip title={config.tooltip}>
                                  <QuestionCircleOutlined
                                    style={{
                                      color: "var(--color-text-secondary)",
                                      fontSize: "12px",
                                    }}
                                  />
                                </Tooltip>
                              </Space>
                            ) : (
                              config.label
                            )
                          }
                          help={error}
                          required={config.required}
                          validateStatus={error ? "error" : undefined}
                          labelCol={{ span: 24 }}
                          wrapperCol={{ span: 24 }}
                        >
                          {renderField(fieldPath, config)}
                        </Form.Item>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Form>
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      {renderActions() && (
        <div
          style={{
            minHeight: "60px",
            flexShrink: 0,
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border, #e5e7eb)",
            borderBottomLeftRadius: "8px",
            borderBottomRightRadius: "8px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          {renderActions()}
        </div>
      )}

      {/* AI Chatbot Assistant */}
      {(gadget.config as any).aiAssistant?.enabled && (
        <AIChatbotWidget
          id="form-ai-assistant"
          title={(gadget.config as any).aiAssistant?.title || "AI Assistant"}
          description={
            (gadget.config as any).aiAssistant?.description ||
            "Get help with form filling and inspection documentation"
          }
          placeholder="Ask me anything about this form..."
          formSchema={Object.entries(fieldConfigs).map(([fieldId, config]) => ({
            id: fieldId,
            type: config.type || "text",
            title: config.label || fieldId,
            label: config.label,
            description: config.tooltip,
            required: config.required,
            defaultValue: config.defaultValue,
            options: config.options,
            validation: config.validation,
            dependencies: config.dependencies,
            sectionId: config.sectionId,
            groupId: config.groupId,
          }))}
          currentFormData={formData}
          currentSection={activeSection || undefined}
          currentField={undefined}
          openaiConfig={{
            ...(gadget.config as any).aiAssistant?.openaiConfig,
            apiKey:
              process.env.REACT_APP_OPENAI_API_KEY ||
              (gadget.config as any).aiAssistant?.openaiConfig?.apiKey,
          }}
          modelConfig={(gadget.config as any).aiAssistant?.modelConfig}
          enableVoice={
            (gadget.config as any).aiAssistant?.features?.enableVoice
          }
          enableImageUpload={
            (gadget.config as any).aiAssistant?.features?.enableImageUpload
          }
          enableDocumentUpload={
            (gadget.config as any).aiAssistant?.features?.enableDocumentUpload
          }
          enableSuggestions={
            (gadget.config as any).aiAssistant?.features?.enableSuggestions
          }
          enableAutoFill={
            (gadget.config as any).aiAssistant?.features?.enableAutoFill
          }
          position={(gadget.config as any).aiAssistant?.position || "drawer"}
          onFieldUpdate={(fieldId, value) => {
            setFormData((prev) => ({ ...prev, [fieldId]: value }));
            setIsDirty(true);
          }}
          onFieldFocus={(fieldId) => {
            // Scroll to field if needed
            const fieldElement = document.querySelector(
              `[data-field-id="${fieldId}"]`
            );
            if (fieldElement) {
              fieldElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }}
          onSectionChange={(sectionId) => {
            setActiveSection(sectionId);
            // For wizard mode, navigate to the step containing this section
            if (mode === "wizard" && wizardSteps.length > 0) {
              const stepIndex = wizardSteps.findIndex((step) =>
                Object.keys(step.fields).some(
                  (field: string) =>
                    fieldConfigs[field]?.sectionId === sectionId
                )
              );
              if (stepIndex !== -1) {
                setCurrentStep(stepIndex);
              }
            }
          }}
          onFormComplete={(formData) => {
            // Could trigger form submission or other actions
          }}
        />
      )}
    </div>
  );
};

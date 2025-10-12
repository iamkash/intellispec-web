/**
 * Simple Calculator Gadget
 *
 * A basic calculator that takes inputs and shows AI-powered results as markdown.
 *
 * Features:
 * - Simple form inputs (text, number, select)
 * - AI streaming response displayed as markdown
 * - Two cards: input parameters and output results
 */

import * as AntIcons from "@ant-design/icons";
import {
  CalculatorOutlined,
  ClearOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { Button, Card, message, Space, Spin, Typography } from "antd";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useOpenAI } from "../../../../hooks/useOpenAI";
import {
  GenericPdfMetadata,
  normalizeForPdf,
  PDFGeneratorWidget,
} from "../../widgets/input/PDFGeneratorWidget";
import {
  BaseGadget,
  GadgetConfig,
  GadgetContext,
  GadgetMetadata,
  GadgetSchema,
  GadgetType,
} from "../base";
import DocumentFormGadget from "../forms/DocumentFormGadget";
import { FormRenderer } from "../forms/FormRenderer";

const { Title, Text } = Typography;
//

// Simple configuration - just what we need
interface SimpleCalculatorConfig extends GadgetConfig {
  title?: string;
  calculatorId?: string; // Add calculatorId to fetch from database
  inputs?: Array<{
    id: string;
    label: string;
    type: "text" | "number" | "select" | "textarea";
    placeholder?: string;
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
  aiPrompt?: string;
}

/**
 * Simple Calculator Gadget Implementation
 */
export class DynamicCalculatorGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: "dynamic-calculator-gadget",
    name: "Calculator",
    description: "AI-powered calculator with streaming markdown output",
    category: "dashboard",
    tags: ["calculator", "ai"],
    version: "1.0.0",
    author: "System",
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
    dataFlow: {
      inputs: ["form-data"],
      outputs: ["ai-response"],
      transformations: ["ai-streaming"],
    },
  };

  schema: GadgetSchema = {
    type: "object",
    properties: {
      title: { type: "string", description: "Calculator title" },
      inputs: {
        type: "array",
        description: "Input field definitions",
      },
      aiPrompt: { type: "string", description: "AI prompt template" },
    },
    widgetSchemas: {},
  };

  getContainerProps(props: any, context?: GadgetContext): any {
    const containerProps = {
      ...super.getContainerProps(props, context),
      noPadding: true, // Calculator manages its own internal padding
    };
    console.log(
      "[DynamicCalculatorGadget] getContainerProps returning:",
      containerProps
    );
    return containerProps;
  }

  renderBody(props: any): React.ReactNode {
    // Handle both direct config and nested config structure
    const config = props.config || props;

    return (
      <SimpleCalculatorComponent config={config as SimpleCalculatorConfig} />
    );
  }

  validate(config: GadgetConfig): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout(): any {
    return { type: "simple" };
  }

  processDataFlow(data: any): any {
    return data;
  }
}

/**
 * Calculator Header - Memoized component for better performance
 */
const CalculatorHeader = React.memo<{
  icon?: string;
  name?: string;
  description?: string;
}>(({ icon, name, description }) => {
  const IconCmp = icon ? (AntIcons as any)[icon] : null;
  const isValidIcon =
    IconCmp && (typeof IconCmp === "function" || IconCmp.$$typeof);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isValidIcon && (
          <IconCmp style={{ fontSize: 24, color: "hsl(var(--foreground))" }} />
        )}
        <div>
          <Title
            level={3}
            style={{ margin: 0, color: "hsl(var(--foreground))" }}
          >
            {name}
          </Title>
          {description && (
            <Text type="secondary" style={{ fontSize: "14px", marginTop: 4 }}>
              {description}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Simple Calculator Component
 */
const SimpleCalculatorComponent: React.FC<{
  config: SimpleCalculatorConfig;
}> = React.memo(({ config }) => {
  const renderCount = React.useRef(0);
  renderCount.current++;
  const componentRenderStart = performance.now();
  console.log(
    `[PERF] ========== SimpleCalculatorComponent RENDER #${renderCount.current} START ==========`
  );

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [calculatorMetadata, setCalculatorMetadata] = useState<any>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1200);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Handle responsive layout and window height - memoized
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1200);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Removed empty useEffect - dead code

  // Resolve calculatorId from config or URL query string
  // Parse URLSearchParams only once, not on every render
  const resolvedCalculatorId = React.useMemo(() => {
    const configId = config?.calculatorId;
    if (configId && configId !== "{calculatorId}") return configId;

    // Only parse URL if config doesn't have ID
    const queryId =
      new URLSearchParams(window.location.search).get("calculatorId") ||
      undefined;
    return queryId || undefined;
  }, [config?.calculatorId]);

  // Fetch calculator metadata when a valid calculatorId is available - memoized
  useEffect(() => {
    if (resolvedCalculatorId) {
      fetchCalculatorMetadata(resolvedCalculatorId);
    } else {
      fetchCalculatorMetadata(undefined);
    }
  }, [resolvedCalculatorId]); // Only depend on resolvedCalculatorId

  const fetchCalculatorMetadata = React.useCallback(
    async (calculatorIdParam?: string) => {
      let calculatorId = calculatorIdParam || config?.calculatorId;

      // Resolve from URL query if placeholder or missing
      if (!calculatorId || calculatorId === "{calculatorId}") {
        const queryId =
          new URLSearchParams(window.location.search).get("calculatorId") || "";
        calculatorId = queryId || "scope-sizing";
        if (queryId) {
        } else {
        }
      }

      setMetadataLoading(true);
      try {
        const apiBase =
          process.env.REACT_APP_API_BASE || "http://localhost:4000";
        // Prefer metadata-driven URL if provided, otherwise fall back to standard endpoint
        let urlPath =
          (config as any)?.dataUrl ||
          `/api/calculators/{calculatorId}/metadata`;
        urlPath = urlPath.replace("{calculatorId}", String(calculatorId));
        const url = urlPath.startsWith("http")
          ? urlPath
          : `${apiBase}${urlPath}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setCalculatorMetadata(data);
        } else {
          // Handle error silently
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setMetadataLoading(false);
      }
    },
    [config?.calculatorId]
  ); // Add dependency for useCallback

  // Build gadgetOptions and field list from config or metadata (supports flat uiDefinition arrays)
  // Memoize with stable dependencies to prevent unnecessary re-creation
  const { gadgetOptions, fieldList } = React.useMemo(() => {
    // If config.inputs provided, synthesize a basic section/group and map the fields
    if (Array.isArray(config?.inputs) && (config.inputs as any[]).length > 0) {
      const sectionId = "input-section";
      const groupId = "input-group";
      const baseFields = (config.inputs as any[]).map((f: any) => ({
        ...f,
        sectionId,
        groupId,
        size: Number.isFinite(f?.size) ? f.size : 24,
      }));
      // Add debounceDelay to all textarea and text fields to prevent performance issues
      const optimizedFields = baseFields.map((f: any) => {
        if (f.type === "textarea" || f.type === "text") {
          return {
            ...f,
            debounceDelay: f.debounceDelay ?? 300, // Default 300ms debounce for text inputs
          };
        }
        return f;
      });

      const withContext = optimizedFields.some(
        (f: any) => f?.id === "additional_context"
      )
        ? optimizedFields
        : [
            ...optimizedFields,
            {
              id: "additional_context",
              type: "textarea",
              title: "Additional Context",
              label: "Additional Context",
              placeholder:
                "Enter any constraints, standards, access limitations, etc.",
              required: false,
              size: 24,
              rows: 4,
              sectionId,
              groupId,
              defaultValue: "",
              debounceDelay: 300, // Debounce textarea input to prevent lag on every keystroke
            },
          ];
      const opts = [
        {
          id: sectionId,
          type: "section",
          title: "Input Parameters",
          icon: "FormOutlined",
          size: 24,
          order: 1,
        },
        {
          id: groupId,
          type: "group",
          title: "Details",
          sectionId,
          size: 24,
          order: 1,
          collapsible: false,
        },
        ...withContext,
      ];
      return { gadgetOptions: opts, fieldList: withContext };
    }

    // From metadata
    const ui = calculatorMetadata?.uiDefinition;
    // If uiDefinition is already a flat array of entries
    if (Array.isArray(ui)) {
      const sections = ui.filter((i: any) => i?.type === "section");
      const groups = ui.filter((i: any) => i?.type === "group");
      const fields = ui.filter(
        (i: any) => i?.type && i.type !== "section" && i.type !== "group"
      );

      // Ensure Additional Context exists; attach to first group or create one
      const hasAdditional = fields.some(
        (f: any) => f?.id === "additional_context"
      );
      let augmented = [...ui];
      if (!hasAdditional) {
        const targetSectionId =
          (groups[0]?.sectionId as string) ||
          (sections[0]?.id as string) ||
          "input-card";
        const targetGroupId = groups[0]?.id || "additional-context-group";
        const mustAddGroup = !groups[0];
        if (mustAddGroup) {
          augmented = [
            ...augmented,
            {
              id: targetGroupId,
              type: "group",
              title: "Additional Context",
              description: "Optional notes and constraints",
              sectionId: targetSectionId,
              order: 99,
              size: 24,
              collapsible: true,
            },
          ];
        }
        augmented = [
          ...augmented,
          {
            id: "additional_context",
            type: "textarea",
            title: "Additional Context",
            label: "Additional Context",
            placeholder:
              "Enter any constraints, standards, access limitations, etc.",
            required: false,
            size: 24,
            rows: 4,
            sectionId: targetSectionId,
            groupId: targetGroupId,
            defaultValue: "",
          },
        ];
      }
      // Optimize all text/textarea fields with debouncing
      const optimizedAugmented = augmented.map((i: any) => {
        if (
          (i.type === "textarea" || i.type === "text") &&
          i.type !== "section" &&
          i.type !== "group"
        ) {
          return {
            ...i,
            debounceDelay: i.debounceDelay ?? 300,
          };
        }
        return i;
      });

      const finalFields = optimizedAugmented.filter(
        (i: any) => i?.type && i.type !== "section" && i.type !== "group"
      );
      return { gadgetOptions: optimizedAugmented, fieldList: finalFields };
    }

    // Legacy nested support (sections[0] with groups/fields)
    const section = ui?.sections?.[0];
    if (section) {
      const sectionId = section.id || "input-section";
      const collected: any[] = [
        {
          id: sectionId,
          type: "section",
          title: section.title || "Input Parameters",
          icon: section.icon || "FormOutlined",
          size: section.size || 24,
          order: section.order || 1,
        },
      ];
      const fields: any[] = [];
      if (Array.isArray(section.groups) && section.groups.length > 0) {
        section.groups.forEach((g: any, idx: number) => {
          const gid = g.id || `group-${idx + 1}`;
          collected.push({
            id: gid,
            type: "group",
            title: g.title || "Group",
            sectionId,
            size: g.size || 24,
            order: g.order || idx + 1,
            collapsible: !!g.collapsible,
          });
          (g.fields || []).forEach((f: any) => {
            fields.push({
              ...f,
              sectionId,
              groupId: gid,
              size: Number.isFinite(f?.size) ? f.size : 24,
            });
          });
        });
      } else if (Array.isArray(section.fields)) {
        const groupId = "input-group";
        collected.push({
          id: groupId,
          type: "group",
          title: "Details",
          sectionId,
          size: 24,
          order: 1,
          collapsible: false,
        });
        section.fields.forEach((f: any) =>
          fields.push({
            ...f,
            sectionId,
            groupId,
            size: Number.isFinite(f?.size) ? f.size : 24,
          })
        );
      }
      // Optimize all text/textarea fields with debouncing
      const optimizedFields = fields.map((f: any) => {
        if (f.type === "textarea" || f.type === "text") {
          return {
            ...f,
            debounceDelay: f.debounceDelay ?? 300,
          };
        }
        return f;
      });

      const hasAdditional = optimizedFields.some(
        (f: any) => f?.id === "additional_context"
      );
      const finalFields = hasAdditional
        ? optimizedFields
        : [
            ...optimizedFields,
            {
              id: "additional_context",
              type: "textarea",
              title: "Additional Context",
              label: "Additional Context",
              placeholder:
                "Enter any constraints, standards, access limitations, etc.",
              required: false,
              size: 24,
              rows: 4,
              sectionId,
              groupId: (optimizedFields[0]?.groupId as string) || "input-group",
              defaultValue: "",
              debounceDelay: 300,
            },
          ];
      return {
        gadgetOptions: [...collected, ...finalFields],
        fieldList: finalFields,
      };
    }

    // Default empty
    return { gadgetOptions: [], fieldList: [] };
  }, [config?.inputs, calculatorMetadata?.uiDefinition]); // Stable dependencies

  const aiPrompt =
    config?.aiPrompt ||
    calculatorMetadata?.aiPrompt ||
    "Analyze this scope sizing request: Asset Type: {asset_type}, Scope Size: {scope_size}, Notes: {additional_context}";

  // Removed empty useEffect - dead code

  // Memoize OpenAI config to prevent hook recreation on every render
  const openAIConfig = React.useMemo(
    () => ({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
      baseUrl: process.env.REACT_APP_OPENAI_BASE_URL,
    }),
    []
  ); // Empty deps - config never changes

  const openAI = useOpenAI(openAIConfig);

  // Memoize ReactMarkdown components to prevent recreation on every render
  const markdownComponents = React.useMemo(
    () => ({
      h1: ({ children }: any) => (
        <h1
          style={{
            color: "#111",
            marginBottom: 16,
            fontWeight: 800,
            letterSpacing: "-0.01em",
          }}
        >
          {children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2 style={{ color: "#111", marginBottom: 12, fontWeight: 700 }}>
          {children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3 style={{ color: "#111", marginBottom: 8, fontWeight: 700 }}>
          {children}
        </h3>
      ),
      h4: ({ children }: any) => (
        <h4 style={{ color: "#111", marginBottom: 8, fontWeight: 600 }}>
          {children}
        </h4>
      ),
      p: ({ children }: any) => (
        <p style={{ marginBottom: 10, lineHeight: 1.75 }}>{children}</p>
      ),
      ul: ({ children }: any) => (
        <ul style={{ marginBottom: 8, paddingLeft: 20 }}>{children}</ul>
      ),
      ol: ({ children }: any) => (
        <ol style={{ marginBottom: 8, paddingLeft: 20 }}>{children}</ol>
      ),
      li: ({ children }: any) => (
        <li style={{ marginBottom: 4, paddingLeft: 2 }}>{children}</li>
      ),
      code: ({ children }: any) => (
        <code
          style={{
            backgroundColor: "#f6f7f9",
            padding: "2px 4px",
            borderRadius: "3px",
            fontSize: "0.9em",
          }}
        >
          {children}
        </code>
      ),
      pre: ({ children }: any) => (
        <pre
          style={{
            backgroundColor: "#f6f7f9",
            padding: "12px",
            borderRadius: "6px",
            overflow: "auto",
            marginBottom: 16,
          }}
        >
          {children}
        </pre>
      ),
    }),
    []
  );

  // Streaming state for markdown rendering
  const [streamingResult, setStreamingResult] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Map field id -> type for placeholder interpolation - memoized
  const fieldTypeById = React.useMemo(() => {
    const map: Record<string, string> = {};
    (fieldList || []).forEach((f: any) => {
      if (f?.id) map[f.id] = String(f?.type || "");
    });
    return map;
  }, [fieldList]);

  // Optimized input change handler with immediate UI updates
  const handleInputChange = React.useCallback((fieldId: string, value: any) => {
    const startTime = performance.now();
    console.log(`[PERF] handleInputChange START - field: ${fieldId}`);

    // Use functional update to prevent stale closure issues
    setFormData((prev) => {
      // Only update if the value actually changed
      if (prev[fieldId] === value) {
        console.log(
          `[PERF] handleInputChange SKIP - value unchanged (${(
            performance.now() - startTime
          ).toFixed(2)}ms)`
        );
        return prev;
      }
      console.log(
        `[PERF] handleInputChange UPDATE - value changed (${(
          performance.now() - startTime
        ).toFixed(2)}ms)`
      );
      return {
        ...prev,
        [fieldId]: value,
      };
    });

    const endTime = performance.now();
    console.log(
      `[PERF] handleInputChange END - total: ${(endTime - startTime).toFixed(
        2
      )}ms`
    );
  }, []);

  const handleCalculate = React.useCallback(async () => {
    setLoading(true);
    setIsStreaming(true);
    setResult("");
    setStreamingResult("");

    try {
      // Interpolate placeholders in the calculator's prompt
      let interpolated =
        aiPrompt || "Analyze the following data and provide insights:";
      Object.entries(formData).forEach(([key, value]) => {
        const sanitizedForPlaceholder = sanitizeValueForPrompt(
          value,
          fieldTypeById[key]
        );
        interpolated = interpolated.replace(
          new RegExp(`\\{${key}\\}`, "g"),
          typeof sanitizedForPlaceholder === "string"
            ? sanitizedForPlaceholder
            : JSON.stringify(sanitizedForPlaceholder)
        );
      });

      // Build an explicit input summary from current form values to ensure they appear in results
      const inputLines: string[] = [];
      const inputObject: Record<string, any> = {};
      (fieldList || []).forEach((f: any) => {
        const fieldId = f?.id;
        if (!fieldId) return;
        const label = f?.label || f?.title || fieldId;
        const raw = formData[fieldId];
        const sanitized = sanitizeValueForPrompt(raw, f?.type);
        // Include all fields; mark missing as N/A, and truncate long strings
        const display =
          sanitized === undefined ||
          sanitized === null ||
          (typeof sanitized === "string" && sanitized.trim() === "")
            ? "N/A"
            : truncateIfLong(sanitized);
        inputLines.push(
          `- ${label}: ${
            typeof display === "string" ? display : JSON.stringify(display)
          }`
        );
        inputObject[fieldId] = sanitized ?? null;
      });
      const inputJson = JSON.stringify(inputObject, null, 2);
      const prefix = `Use these input values (all fields listed):\n${inputLines.join(
        "\n"
      )}\n\nInput JSON (machine-readable):\n\n\`\`\`json\n${inputJson}\n\`\`\`\n\n`;
      const prompt = `${prefix}${interpolated}`;

      // Extract image URLs from form data to include as vision inputs
      const imageUrls: string[] = [];
      try {
        (fieldList || []).forEach((f: any) => {
          const fid = f?.id;
          if (!fid) return;
          const val = (formData as any)[fid];
          if (Array.isArray(val)) {
            val.forEach((item: any) => {
              const url = item?.url;
              if (
                typeof url === "string" &&
                (url.startsWith("data:image") || url.startsWith("http"))
              ) {
                imageUrls.push(url);
              }
            });
          } else if (
            val &&
            typeof val === "object" &&
            typeof (val as any).url === "string"
          ) {
            const url = (val as any).url;
            if (url.startsWith("data:image") || url.startsWith("http"))
              imageUrls.push(url);
          }
        });
      } catch {}
      const uniqueImages = Array.from(new Set(imageUrls)).slice(0, 10);

      // Use GPT-5 with streaming so the markdown renders progressively
      const previousResponseId =
        (window as any)?.__previousResponseId || undefined;
      const response = await openAI.respondStream({
        modelConfig: {
          model: "gpt-5",
          temperature: 0.5,
          maxTokens: 8000,
        },
        promptConfig: {
          systemPrompt: [
            "You are a senior technical writer and NDT inspection planner.",
            "Respect hard constraints even if not repeated in the user prompt:",
            "- Do not add extra sections beyond those requested.",
            "- Do not include costs, resources, QA/QC, schedules, or broad narratives unless explicitly requested.",
            "- Provide formulas/assumptions where calculations are presented.",
            "Formatting guidelines:",
            "- Prefer tables where appropriate with valid Markdown table syntax.",
            "- Use bold for key labels and summary numbers.",
            "- Render numeric values with units where applicable.",
            "- End the report with the exact line: END OF REPORT",
          ].join("\n"),
          userPrompt: prompt,
        },
        images: uniqueImages.map((u) => ({ url: u })),
        previousResponseId,
        store: true,
        onTextDelta: (delta: string) => {
          // Append streamed chunks and flush to DOM
          setStreamingResult((prev) => prev + delta);
        },
      });

      let finalResult =
        response.data ||
        (typeof response.rawText === "string" && response.rawText.length > 0
          ? response.rawText
          : streamingResult) ||
        "No response received";
      setResult(finalResult);

      // Store responseId for conversation continuity
      if ((response as any)?.responseId) {
        (window as any).__previousResponseId = (response as any).responseId;
      }

      // Continuation: if report did not finish with END OF REPORT, request completion
      if (!/END OF REPORT/i.test(finalResult)) {
        try {
          setIsStreaming(true);
          const continuation = await openAI.respondStream({
            modelConfig: {
              model: "gpt-5",
              temperature: 0.4,
              maxTokens: 4000,
            },
            promptConfig: {
              systemPrompt:
                "Continue and complete the previous report. Only provide missing/remaining sections and tables. Do not repeat content. End with: END OF REPORT.",
              userPrompt: "",
            },
            previousResponseId: (response as any)?.responseId,
            store: true,
            onTextDelta: (delta: string) => {
              setStreamingResult((prev) => prev + delta);
            },
          });
          finalResult = (finalResult || "") + (continuation.data || "");
          setResult(finalResult);
          if ((continuation as any)?.responseId) {
            (window as any).__previousResponseId = (
              continuation as any
            ).responseId;
          }
        } catch (e) {
          // Handle continuation attempt failure silently
        }
      }
    } catch (error) {
      const errorMessage = "Error: Failed to calculate. Please try again.";
      setResult(errorMessage);
      setStreamingResult(errorMessage);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [openAI, aiPrompt, fieldList, formData, fieldTypeById]); // Add dependencies for useCallback

  // Helper functions - memoized to prevent re-creation
  const truncateIfLong = React.useCallback((value: any, maxLen = 1000): any => {
    if (typeof value === "string") {
      return value.length > maxLen
        ? `${value.slice(0, maxLen)}… [truncated]`
        : value;
    }
    return value;
  }, []);

  // Helper: sanitize values (especially images) for safe inclusion in prompts
  const sanitizeValueForPrompt = React.useCallback(
    (value: any, fieldType?: string): any => {
      // Nullish stays null
      if (value === undefined || value === null) return value;

      // Strings: strip data URLs and truncate
      if (typeof value === "string") {
        if (/^data:(?:image|application)\//i.test(value)) {
          return "[binary data omitted]";
        }
        return truncateIfLong(value);
      }

      // Arrays: if image-upload-like, summarize instead of embedding data
      if (Array.isArray(value)) {
        // Detect image object shape
        const looksLikeImageArray =
          value.length > 0 &&
          typeof value[0] === "object" &&
          ("url" in (value[0] || {}) || "base64" in (value[0] || {}));
        if (String(fieldType || "").includes("image") || looksLikeImageArray) {
          const names = value.map((v: any) => String(v?.name || "image"));
          const annotated = value.filter((v: any) => !!v?.drawingData).length;
          const dims = value
            .map((v: any) => ({
              w: v?.metadata?.width,
              h: v?.metadata?.height,
            }))
            .filter((d: any) => Number.isFinite(d.w) && Number.isFinite(d.h));
          return {
            count: value.length,
            annotatedCount: annotated,
            names: names.slice(0, 10),
            sizes: dims.slice(0, 10),
          };
        }
        // Generic arrays: sanitize recursively but cap size
        return value
          .slice(0, 50)
          .map((item: any) => sanitizeValueForPrompt(item, fieldType));
      }

      // Objects: strip base64 url fields, keep metadata
      if (typeof value === "object") {
        // Image-like object
        const hasDataUrl =
          typeof (value as any)?.url === "string" &&
          /^data:/i.test((value as any).url);
        if (hasDataUrl || String(fieldType || "").includes("image")) {
          return {
            name: (value as any)?.name || "image",
            annotated: !!(value as any)?.drawingData,
            width: (value as any)?.metadata?.width,
            height: (value as any)?.metadata?.height,
            size: (value as any)?.metadata?.size,
          };
        }
        // Generic object: shallow sanitize and truncate long strings
        const out: Record<string, any> = {};
        Object.entries(value as Record<string, any>).forEach(([k, v]) => {
          out[k] = sanitizeValueForPrompt(v, fieldType);
        });
        return out;
      }

      // Numbers/booleans
      return value;
    },
    [truncateIfLong]
  );

  const handleReset = React.useCallback(() => {
    setFormData({});
    setResult("");
  }, []);

  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const handleExportPDF = React.useCallback(() => {
    if (!result && !streamingResult) {
      message.warning("No results to export");
      return;
    }
    setShowPdfPreview(true);
  }, [result, streamingResult]);

  // Use the enhanced sanitization function from PDFGeneratorWidget

  // Create PDF metadata for the PDFGeneratorWidget
  const pdfMetadata: GenericPdfMetadata = React.useMemo(() => {
    const contentToPrint = result || streamingResult;
    if (!contentToPrint) return { sections: [] };

    // Use original markdown content without parsing tables or changing layout
    // Just normalize Unicode characters for PDF compatibility
    const cleanContent = normalizeForPdf(contentToPrint);

    const sections: any[] = [];

    // Extract images from form data for PDF inclusion
    const imageFields: Array<{ fieldLabel: string; images: any[] }> = [];
    try {
      (fieldList || []).forEach((f: any) => {
        const fid = f?.id;
        if (!fid) return;
        const val = (formData as any)[fid];
        const fieldLabel = f?.label || f?.title || fid;

        // Check if field contains image data
        if (Array.isArray(val) && val.length > 0) {
          const images = val.filter((item: any) => {
            const url = item?.url;
            return (
              typeof url === "string" &&
              (url.startsWith("data:image") || url.startsWith("http"))
            );
          });
          if (images.length > 0) {
            imageFields.push({ fieldLabel, images });
          }
        } else if (
          val &&
          typeof val === "object" &&
          typeof (val as any).url === "string"
        ) {
          const url = (val as any).url;
          if (url.startsWith("data:image") || url.startsWith("http")) {
            imageFields.push({ fieldLabel, images: [val] });
          }
        }
      });
    } catch (err) {
      console.warn("Error extracting images for PDF:", err);
    }

    // Add images section if any images were found
    if (imageFields.length > 0) {
      sections.push({
        id: "input-images",
        title: "Input Images",
        includeInPdf: true,
        order: 0, // Show before results
        hideHeader: false,
        content: {
          type: "image", // Use 'image' not 'images'
          data: imageFields.flatMap((field) =>
            field.images.map((img: any) => ({
              url: img.url, // PDFGeneratorWidget looks for 'url' property
              src: img.url, // Fallback for compatibility
              caption: `${field.fieldLabel}${img.name ? `: ${img.name}` : ""}`,
              width: img.metadata?.width,
              height: img.metadata?.height,
              drawingData: img.drawingData, // Include annotations if present
            }))
          ),
        },
      });
    }

    // Add single content section with original markdown preserved
    if (contentToPrint.trim()) {
      sections.push({
        id: "content",
        title: "Results", // Shorter title
        includeInPdf: true,
        order: 1,
        hideHeader: true, // Hide section header to avoid duplicate titles
        content: {
          type: "rawtext", // Use a new type to preserve exact formatting
          template: contentToPrint, // Use original content without any processing
        },
      });
    }

    return {
      header: {
        title: calculatorMetadata?.name || config.title || "Calculator Results",
        companyName: "", // Remove company name from header
        companyAddress: "",
      },
      pdfStyling: {
        header: {
          backgroundColor: [240, 240, 240] as [number, number, number], // Light gray instead of blue
          textColor: [50, 50, 50] as [number, number, number], // Dark gray text
          fontSize: 12,
          showMainTitle: false, // Don't show title in document body
          showHeaderTitle: true, // Show title in header instead
        },
        footer: {
          textColor: [100, 100, 100] as [number, number, number],
          fontSize: 8,
          leftText: `Generated: ${new Date().toLocaleDateString()}`,
          centerText: "",
          rightText: "Page {page} of {pages}",
        },
        sections: {
          headerFontSize: 11,
          contentFontSize: 9,
          lineSpacing: 1.3,
          margins: { left: 15, right: 195 },
        },
        tables: {
          headerBackground: [245, 245, 245] as [number, number, number], // Light gray
          headerTextColor: [50, 50, 50] as [number, number, number], // Dark text
          headerFontSize: 9,
          contentFontSize: 8,
          cellPadding: 4,
        },
      },
      sections,
    };
  }, [
    result,
    streamingResult,
    calculatorMetadata?.name,
    config.title,
    formData,
    fieldList,
  ]);

  // Only calculate pdfGadgetData when PDF preview is shown
  // Use a getter function instead of useMemo to avoid recalculation on every formData change
  const getPdfGadgetData = React.useCallback(
    () => ({
      reportTitle:
        calculatorMetadata?.name || config.title || "Calculator Results",
      generatedDate: new Date().toLocaleDateString(),
      ...formData,
    }),
    [calculatorMetadata?.name, config.title, formData]
  );

  // Calculate dynamic height based on window height
  const dynamicHeight = React.useMemo(() => {
    if (!isLargeScreen) return "auto";

    // Calculate available height accounting for all UI elements:
    // - Main header/navigation bar: ~64px
    // - Module bar/breadcrumbs: ~48px
    // - Workspace title/padding: ~60px
    // - Card margins and gaps: ~32px
    // - Bottom padding/buffer: ~16px
    const uiOverhead = 64 + 58 + 64 + 58 + 50; // Total: 220px
    const availableHeight = windowHeight - uiOverhead;

    // Set minimum height of 400px and maximum of 800px
    const calculatedHeight = Math.max(400, Math.min(800, availableHeight));

    return `${calculatedHeight}px`;
  }, [isLargeScreen, windowHeight]);

  // Helper to render a richer Collapse header - memoized
  const renderPanelHeader = React.useCallback(
    (title: string, iconName?: string) => {
      const IconCmp = iconName ? (AntIcons as any)[iconName] : null;
      const isValidIcon =
        IconCmp && (typeof IconCmp === "function" || IconCmp.$$typeof);
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 0",
          }}
        >
          {isValidIcon ? (
            <IconCmp
              style={{ fontSize: 18, color: "hsl(var(--foreground))" }}
            />
          ) : null}
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "hsl(var(--foreground))",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </span>
        </div>
      );
    },
    []
  );

  // Memoize inline styles to prevent recreation on every render
  // No padding - BaseGadgetContainer padding is disabled via noPadding: true
  const containerStyle = React.useMemo(() => ({ padding: 0 }), []);

  const layoutStyle = React.useMemo(
    () => ({
      display: "flex",
      flexDirection: isLargeScreen ? ("row" as const) : ("column" as const),
      gap: 16,
    }),
    [isLargeScreen]
  );

  const inputsCardStyle = React.useMemo(
    () => ({
      flex: isLargeScreen ? "0 0 800px" : "1 1 auto",
      minWidth: 0,
      marginBottom: isLargeScreen ? 0 : 16,
      height: dynamicHeight,
      borderRadius: 16,
      border: "1px solid hsl(var(--border))",
      background: "hsl(var(--background))",
      boxShadow: "0 6px 18px hsl(var(--foreground) / 0.08)",
    }),
    [isLargeScreen, dynamicHeight]
  );

  const inputsBodyStyle = React.useMemo(
    () => ({
      padding: 0,
      height: isLargeScreen ? `calc(${dynamicHeight} - 57px)` : "auto",
      display: "flex",
      flexDirection: "column" as const,
    }),
    [isLargeScreen, dynamicHeight]
  );

  const resultsCardStyle = React.useMemo(
    () => ({
      flex: "1 1 auto",
      minWidth: 0,
      height: dynamicHeight,
      borderRadius: 16,
      border: "1px solid hsl(var(--border))",
      background: "hsl(var(--background))",
      boxShadow: "0 6px 18px hsl(var(--foreground) / 0.08)",
    }),
    [dynamicHeight]
  );

  const resultsBodyStyle = React.useMemo(
    () => ({
      padding: 0,
      position: "relative" as const,
      height: isLargeScreen ? `calc(${dynamicHeight} - 57px)` : "auto",
      display: "flex",
      flexDirection: "column" as const,
    }),
    [isLargeScreen, dynamicHeight]
  );

  const scrollableFormStyle = React.useMemo(
    () => ({
      flex: 1,
      padding: 0,
      overflowY: isLargeScreen ? ("auto" as const) : ("visible" as const),
      minHeight: 0,
    }),
    [isLargeScreen]
  );

  const scrollableResultsStyle = React.useMemo(
    () => ({
      flex: 1,
      padding: 0,
      overflowY: isLargeScreen ? ("auto" as const) : ("visible" as const),
      minHeight: 0,
      position: "relative" as const,
    }),
    [isLargeScreen]
  );

  const footerStyle = React.useMemo(
    () => ({
      padding: "12px 16px",
      borderTop: "1px solid hsl(var(--border))",
      background: "hsl(var(--background))",
      borderRadius: "0 0 16px 16px",
    }),
    []
  );

  // Memoize CSS for markdown rendering
  const markdownStyles = React.useMemo(
    () => `
    .doc-wrapper {
      display: flex;
      justify-content: center;
      background: transparent;
    }
    .doc-page {
      width: 794px; /* ~A4 width at 96 DPI */
      max-width: 100%;
      background: #ffffff;
      color: #111111;
      border: 1px solid hsl(var(--border));
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      padding: 32px 40px; /* page margins */
    }
    .doc-page h1, .doc-page h2, .doc-page h3, .doc-page h4 { margin-top: 0.75em; }
    .doc-page table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    .doc-page th, .doc-page td { border: 1px solid hsl(var(--border)); padding: 8px; vertical-align: top; }
    .doc-page thead th { background: #f6f7f9; font-weight: 700; text-align: left; }
    .doc-page tbody tr:nth-child(odd) td { background: #fafafa; }
    .doc-page p { line-height: 1.75; }
    @media print {
      .doc-page { width: 210mm; min-height: 297mm; padding: 20mm 18mm; border: none; box-shadow: none; }
    }
  `,
    []
  );

  // Inputs are rendered via FormRenderer to respect size spans and widgets

  // Log render completion
  React.useEffect(() => {
    const componentRenderEnd = performance.now();
    console.log(
      `[PERF] ========== SimpleCalculatorComponent RENDER #${
        renderCount.current
      } END - ${(componentRenderEnd - componentRenderStart).toFixed(
        2
      )}ms ==========`
    );
  });

  return (
    <div style={containerStyle}>
      {/* Gadget Title Header with Calculator Info */}
      {metadataLoading ? (
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <Spin size="small" />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Loading calculator...</Text>
          </div>
        </div>
      ) : (
        (calculatorMetadata?.name || config.title) && (
          <CalculatorHeader
            icon={calculatorMetadata?.icon}
            name={calculatorMetadata?.name || config.title}
            description={calculatorMetadata?.description}
          />
        )
      )}

      {/* Side-by-side layout for large screens, stacked for small screens */}
      <div style={layoutStyle}>
        {/* Inputs Card */}
        <Card
          title={renderPanelHeader("Inputs", "FormOutlined")}
          style={inputsCardStyle}
          bodyStyle={inputsBodyStyle}
        >
          {/* Scrollable Form Content */}
          <div style={scrollableFormStyle}>
            {metadataLoading ? (
              <div style={{ padding: 20, textAlign: "center" }}>
                <Spin size="small" />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Loading calculator configuration...
                  </Text>
                </div>
              </div>
            ) : gadgetOptions && gadgetOptions.length > 0 ? (
              <MemoizedFormRenderer
                gadgetOptions={gadgetOptions}
                onFormDataChange={handleInputChange}
              />
            ) : (
              <div style={{ padding: 20, textAlign: "center" }}>
                <Text type="secondary">No input parameters found</Text>
              </div>
            )}
          </div>

          {/* Fixed Footer with Buttons */}
          <div style={footerStyle}>
            <Space>
              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={handleCalculate}
                loading={loading}
              >
                {loading ? "Calculating..." : "Calculate"}
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
            </Space>
          </div>
        </Card>

        {/* Results Card */}
        <Card
          title={renderPanelHeader("Results", "FileTextOutlined")}
          style={resultsCardStyle}
          bodyStyle={resultsBodyStyle}
        >
          <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />

          {/* Scrollable Results Content */}
          <div style={scrollableResultsStyle}>
            {isStreaming && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  zIndex: 10,
                }}
              >
                <Spin size="small" />
                <Text type="secondary">Streaming…</Text>
              </div>
            )}
            {loading && !streamingResult ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
                <div style={{ marginTop: 8 }}>
                  <Text>Processing…</Text>
                </div>
              </div>
            ) : streamingResult ? (
              <div className="doc-wrapper">
                <div className="doc-page">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {streamingResult}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <Text type="secondary">
                Results will appear here after calculation
              </Text>
            )}
          </div>

          {/* Fixed Footer with Export Button */}
          {(result || streamingResult) && (
            <div style={footerStyle}>
              <Space>
                <Button
                  type="default"
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={loading || isStreaming}
                >
                  Export PDF
                </Button>
              </Space>
            </div>
          )}
        </Card>
      </div>

      {/* PDF Preview Modal/Section */}
      {showPdfPreview && (result || streamingResult) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: "hsl(var(--background))",
              borderRadius: 16,
              width: "90%",
              height: "90%",
              maxWidth: 1200,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* PDF Modal Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid hsl(var(--border))",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                PDF Preview -{" "}
                {calculatorMetadata?.name ||
                  config.title ||
                  "Calculator Results"}
              </Title>
              <Button
                type="text"
                onClick={() => setShowPdfPreview(false)}
                style={{ fontSize: 18 }}
              >
                ✕
              </Button>
            </div>

            {/* PDF Content */}
            <div style={{ flex: 1, padding: 16 }}>
              <PDFGeneratorWidget
                id="calculator-pdf-preview"
                metadata={pdfMetadata}
                gadgetData={getPdfGadgetData()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Optimized Form Renderer - removed redundant debouncing
const MemoizedFormRenderer = React.memo<{
  gadgetOptions: any[];
  onFormDataChange: (fieldId: string, value: any) => void;
}>(
  ({ gadgetOptions, onFormDataChange }) => {
    const renderStartTime = performance.now();
    console.log("[PERF] MemoizedFormRenderer RENDER START");

    // Use ref to store formGadget instance to prevent recreation
    const formGadgetRef = React.useRef<DocumentFormGadget | null>(null);

    // Only create new gadget if gadgetOptions actually changed (deep comparison of length and first item id)
    const gadgetOptionsKey = React.useMemo(() => {
      return `${gadgetOptions.length}-${gadgetOptions[0]?.id || "empty"}`;
    }, [gadgetOptions]);

    if (
      !formGadgetRef.current ||
      formGadgetRef.current.config.gadgetOptions !== gadgetOptions
    ) {
      const gadgetStartTime = performance.now();
      console.log("[PERF] Creating NEW DocumentFormGadget...");

      formGadgetRef.current = new DocumentFormGadget({
        layout: "vertical",
        size: "middle",
        gadgetOptions,
        hideSidebar: true,
        showSaveButton: false,
        showResetButton: false,
        showClearButton: false,
      } as any);

      const gadgetEndTime = performance.now();
      console.log(
        `[PERF] DocumentFormGadget created in ${(
          gadgetEndTime - gadgetStartTime
        ).toFixed(2)}ms`
      );
    } else {
      console.log("[PERF] Reusing existing DocumentFormGadget");
    }

    // Track previous formData to only process changed fields
    const prevFormDataRef = React.useRef<Record<string, any>>({});

    // Debounce timer for batching multiple rapid changes
    const batchTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const pendingChangesRef = React.useRef<Map<string, any>>(new Map());

    // Direct form data change handler - batch and debounce changes
    const handleFormDataChange = React.useCallback(
      (data: Record<string, any>) => {
        const startTime = performance.now();
        console.log(
          `[PERF] handleFormDataChange START - ${
            Object.keys(data).length
          } total fields`
        );

        let changedCount = 0;

        // Collect changed fields
        Object.entries(data).forEach(([fieldId, value]) => {
          if (prevFormDataRef.current[fieldId] !== value) {
            pendingChangesRef.current.set(fieldId, value);
            changedCount++;
          }
        });

        // Update the reference
        prevFormDataRef.current = data;

        console.log(
          `[PERF] handleFormDataChange - ${changedCount} changed fields detected, batching...`
        );

        // Clear existing timer
        if (batchTimerRef.current) {
          clearTimeout(batchTimerRef.current);
        }

        // Batch changes with a microtask (immediate but async)
        batchTimerRef.current = setTimeout(() => {
          const batchStart = performance.now();
          const changes = Array.from(pendingChangesRef.current.entries());
          console.log(`[PERF] Processing ${changes.length} batched changes...`);

          changes.forEach(([fieldId, value]) => {
            onFormDataChange(fieldId, value);
          });

          pendingChangesRef.current.clear();

          const batchEnd = performance.now();
          console.log(
            `[PERF] Batch processing complete in ${(
              batchEnd - batchStart
            ).toFixed(2)}ms`
          );
        }, 0); // 0ms = next event loop (breaks out of click handler)

        const endTime = performance.now();
        console.log(
          `[PERF] handleFormDataChange END - ${(endTime - startTime).toFixed(
            2
          )}ms (async batch queued)`
        );
      },
      [onFormDataChange]
    );

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (batchTimerRef.current) {
          clearTimeout(batchTimerRef.current);
        }
      };
    }, []);

    const renderEndTime = performance.now();
    console.log(
      `[PERF] MemoizedFormRenderer RENDER END - ${(
        renderEndTime - renderStartTime
      ).toFixed(2)}ms`
    );

    return (
      <FormRenderer
        gadget={formGadgetRef.current as any}
        initialProps={{}}
        onFormDataChange={handleFormDataChange}
        fitContent
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders when gadgetOptions haven't actually changed
    if (prevProps.gadgetOptions.length !== nextProps.gadgetOptions.length)
      return false;
    if (prevProps.onFormDataChange !== nextProps.onFormDataChange) return false;

    // Check if first and last field ids are the same (quick check)
    const prevFirst = prevProps.gadgetOptions[0]?.id;
    const nextFirst = nextProps.gadgetOptions[0]?.id;
    const prevLast =
      prevProps.gadgetOptions[prevProps.gadgetOptions.length - 1]?.id;
    const nextLast =
      nextProps.gadgetOptions[nextProps.gadgetOptions.length - 1]?.id;

    return prevFirst === nextFirst && prevLast === nextLast;
  }
);

export default DynamicCalculatorGadget;

import {
  CloseOutlined,
  CompressOutlined,
  ExpandOutlined,
  FileMarkdownOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import React, { useMemo } from "react";
import type {
  AIAnalysisWizardConfig,
  AIAnalysisWizardData,
} from "../AIAnalysisWizardGadget.types";

interface WizardHeaderProps {
  config: AIAnalysisWizardConfig;
  wizardData?: AIAnalysisWizardData;
  currentStep: number;
  totalSteps: number;
  isFullscreen?: boolean;
  onClose?: () => void;
  onToggleFullscreen?: () => void;
}

/**
 * Resolve template variables in strings like {recordContext.summary.project_name}
 */
const resolveTemplate = (
  template: string | undefined,
  context: Record<string, any>
): string => {
  if (!template) return "";

  return template.replace(/\{([^}]+)\}/g, (_match, token) => {
    const path = token.trim().split(".");
    let value: any = context;
    for (const segment of path) {
      value = value?.[segment];
      if (value === undefined) break;
    }
    if (typeof value === "object") return JSON.stringify(value);
    return value !== undefined ? String(value) : "";
  });
};

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  config,
  wizardData,
  currentStep,
  totalSteps,
  isFullscreen = false,
  onClose,
  onToggleFullscreen,
}) => {
  // Build context for template resolution
  const templateContext = useMemo(
    () => ({
      recordContext: wizardData?.recordContext || {},
      formData: wizardData?.globalFormData || {},
      sections:
        wizardData?.sections?.reduce((acc: any, s: any) => {
          acc[s.id] = s;
          return acc;
        }, {}) || {},
    }),
    [wizardData]
  );

  // Resolve title and description with template variables
  const resolvedTitle = useMemo(
    () => resolveTemplate(config.title, templateContext),
    [config.title, templateContext]
  );

  const resolvedDescription = useMemo(
    () => resolveTemplate(config.description, templateContext),
    [config.description, templateContext]
  );

  const resolvedSubtitle = useMemo(
    () => resolveTemplate((config as any).subtitle, templateContext),
    [config, templateContext]
  );

  return (
    <div className="wizard-header">
      <div>
        <h1 className="wizard-header__title">
          <FileMarkdownOutlined style={{ fontSize: "1.25rem" }} />
          {resolvedTitle || "AI Inspection Assistant"}
        </h1>
        <p className="wizard-header__subtitle">
          {resolvedSubtitle ||
            resolvedDescription ||
            "Intelligent inspection workflow with AI-powered analysis and documentation"}
        </p>
      </div>
      <div className="wizard-header__actions">
        <span
          style={{
            fontSize: "0.875rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          Step {currentStep + 1} of {totalSteps}
        </span>
        <div className="wizard-header__buttons">
          {onToggleFullscreen && (
            <Tooltip
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <Button
                type="text"
                size="small"
                icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={onToggleFullscreen}
                className="wizard-header__button"
              />
            </Tooltip>
          )}
          {onClose && (
            <Tooltip title="Close Wizard">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClose}
                className="wizard-header__button wizard-header__close-button"
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

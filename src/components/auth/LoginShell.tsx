/**
 * Login Shell Component - Metadata-Driven Authentication UI
 *
 * This is a production-grade, metadata-driven shell component for user authentication
 * following the Shell framework pattern established in the codebase.
 *
 * Features:
 * - Metadata-driven UI configuration
 * - Multi-tenant support with tenant discovery
 * - Progressive enhancement (fallback UI)
 * - Comprehensive error handling and validation
 * - Accessibility compliance (ARIA, semantic HTML)
 * - Professional styling with theme support
 * - Security-focused UX (rate limiting feedback, account lockout)
 * - TypeScript throughout with strong typing
 *
 * Extension Points:
 * - Custom authentication providers via metadata
 * - Branding customization per tenant
 * - Additional authentication factors
 * - Custom validation rules
 * - Internationalization support
 *
 * Usage:
 * <LoginShell metadata={loginMetadata} onAuthenticated={handleAuth} />
 *
 * Sample Metadata Structure:
 * {
 *   "title": "Sign In to intelliSPEC",
 *   "subtitle": "Enter your credentials to access your workspace",
 *   "branding": {
 *     "logo": "/assets/logo.png",
 *     "primaryColor": "#1890ff",
 *     "companyName": "intelliSPEC"
 *   },
 *   "fields": [
 *     {
 *       "id": "email",
 *       "type": "email",
 *       "label": "Email Address",
 *       "placeholder": "Enter your email",
 *       "required": true,
 *       "validation": {
 *         "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
 *         "message": "Please enter a valid email address"
 *       }
 *     },
 *     {
 *       "id": "password",
 *       "type": "password",
 *       "label": "Password",
 *       "placeholder": "Enter your password",
 *       "required": true,
 *       "validation": {
 *         "minLength": 8,
 *         "message": "Password must be at least 8 characters"
 *       }
 *     }
 *   ],
 *   "actions": [
 *     {
 *       "id": "login",
 *       "type": "submit",
 *       "label": "Sign In",
 *       "variant": "primary"
 *     },
 *     {
 *       "id": "forgot-password",
 *       "type": "link",
 *       "label": "Forgot Password?",
 *       "variant": "text"
 *     }
 *   ],
 *   "features": {
 *     "tenantDiscovery": true,
 *     "rememberMe": true,
 *     "socialLogin": false
 *   },
 *   "theme": {
 *     "mode": "professional",
 *     "layout": "centered"
 *   }
 * }
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
} from "react";
import { z } from "zod";
import { getApiFullUrl } from "../../config/api.config";
import { sanitizeHtml } from "../../utils/sanitizeData";
import { LoginLogo } from "../ui/atoms/ThemeLogo";

const BRAND_REGEX = /intellispec/gi;

const stylizeBrand = (text: string): React.ReactNode => {
  if (!text) return null;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = BRAND_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`brand-pre-${key}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
      key += 1;
    }

    nodes.push(
      <span key={`brand-${key}`} className="brand-name">
        <span className="brand-name__prefix">intelli</span>
        <span className="brand-name__spec">SPEC</span>
      </span>
    );
    key += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`brand-post-${key}`}>{text.slice(lastIndex)}</Fragment>
    );
  }

  return nodes;
};

const renderBrandAwareText = (input?: string): React.ReactNode => {
  if (!input) return null;
  const sanitized = sanitizeHtml(input);
  return stylizeBrand(sanitized);
};

// ==================== TYPE DEFINITIONS ====================

/**
 * Field validation configuration
 */
interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

/**
 * Form field configuration
 */
interface LoginField {
  id: string;
  type: "text" | "email" | "password" | "tel";
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: FieldValidation;
  autoComplete?: string;
  disabled?: boolean;
}

/**
 * Action button configuration
 */
interface LoginAction {
  id: string;
  type: "submit" | "button" | "link";
  label: string;
  variant: "primary" | "secondary" | "text" | "link";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Branding configuration
 */
interface LoginBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  backgroundImage?: string;
}

/**
 * Feature flags
 */
interface LoginFeatures {
  tenantDiscovery?: boolean;
  rememberMe?: boolean;
  socialLogin?: boolean;
  multiFactorAuth?: boolean;
  autoComplete?: boolean;
}

/**
 * Theme configuration
 */
interface LoginTheme {
  mode: "professional" | "modern" | "minimal";
  layout: "centered" | "split" | "sidebar";
  animations?: boolean;
}

/**
 * Hero content configuration for storytelling panel
 */
interface LoginHeroContent {
  eyebrow?: string;
  heading: string;
  tagline?: string;
  body?: string;
  badge?: string;
}

/**
 * Value proposition bullets displayed in hero
 */
interface LoginValueProposition {
  title: string;
  description?: string;
}

/**
 * Highlight metrics displayed in hero
 */
interface LoginStatHighlight {
  label: string;
  value: string;
}

/**
 * Main metadata interface
 */
export interface LoginMetadata {
  title: string;
  subtitle?: string;
  description?: string;
  branding?: LoginBranding;
  fields: LoginField[];
  actions: LoginAction[];
  features?: LoginFeatures;
  theme?: LoginTheme;
  hero?: LoginHeroContent;
  valuePropositions?: LoginValueProposition[];
  statHighlights?: LoginStatHighlight[];
  securityAssurance?: string;
  apiEndpoint?: string;
  redirectUrl?: string;
  errorMessages?: Record<string, string>;
}

/**
 * Form data interface
 */
interface LoginFormData {
  [key: string]: string;
}

/**
 * Component props
 */
interface LoginShellProps {
  metadata: LoginMetadata;
  onAuthenticated?: (user: any, token: string) => void;
  onError?: (error: any) => void;
  className?: string;
  loading?: boolean;
}

/**
 * Authentication response
 */
interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: any[];
    tenantSlug: string;
    isExternalCustomer: boolean;
  };
  message: string;
}

// ==================== VALIDATION SCHEMA ====================

const LoginMetadataSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  branding: z
    .object({
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      companyName: z.string().optional(),
      backgroundImage: z.string().optional(),
    })
    .optional(),
  fields: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["text", "email", "password", "tel"]),
        label: z.string().min(1),
        placeholder: z.string().optional(),
        required: z.boolean().optional(),
        validation: z
          .object({
            required: z.boolean().optional(),
            minLength: z.number().optional(),
            maxLength: z.number().optional(),
            pattern: z.string().optional(),
            message: z.string().optional(),
          })
          .optional(),
        autoComplete: z.string().optional(),
        disabled: z.boolean().optional(),
      })
    )
    .min(1),
  actions: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["submit", "button", "link"]),
        label: z.string().min(1),
        variant: z.enum(["primary", "secondary", "text", "link"]),
        disabled: z.boolean().optional(),
        loading: z.boolean().optional(),
      })
    )
    .min(1),
  features: z
    .object({
      tenantDiscovery: z.boolean().optional(),
      rememberMe: z.boolean().optional(),
      socialLogin: z.boolean().optional(),
      multiFactorAuth: z.boolean().optional(),
      autoComplete: z.boolean().optional(),
    })
    .optional(),
  theme: z
    .object({
      mode: z.enum(["professional", "modern", "minimal"]),
      layout: z.enum(["centered", "split", "sidebar"]),
      animations: z.boolean().optional(),
    })
    .optional(),
  hero: z
    .object({
      eyebrow: z.string().optional(),
      heading: z.string().min(1),
      tagline: z.string().optional(),
      body: z.string().optional(),
      badge: z.string().optional(),
    })
    .optional(),
  valuePropositions: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .optional(),
  statHighlights: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional(),
  securityAssurance: z.string().optional(),
  apiEndpoint: z.string().optional(),
  redirectUrl: z.string().optional(),
  errorMessages: z.record(z.string()).optional(),
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validate metadata against schema
 */
const validateMetadata = (
  metadata: LoginMetadata
): { isValid: boolean; errors?: string[] } => {
  try {
    LoginMetadataSchema.parse(metadata);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        ),
      };
    }
    return { isValid: false, errors: ["Invalid metadata format"] };
  }
};

/**
 * Validate form field
 */
const validateField = (field: LoginField, value: string): string | null => {
  const validation = field.validation;
  if (!validation) return null;

  // Required validation
  if (validation.required && !value.trim()) {
    return validation.message || `${field.label} is required`;
  }

  // Skip other validations for empty optional fields
  if (!value.trim() && !validation.required) return null;

  // Length validation
  if (validation.minLength && value.length < validation.minLength) {
    return (
      validation.message ||
      `${field.label} must be at least ${validation.minLength} characters`
    );
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    return (
      validation.message ||
      `${field.label} must not exceed ${validation.maxLength} characters`
    );
  }

  // Pattern validation
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return validation.message || `${field.label} format is invalid`;
    }
  }

  return null;
};

/**
 * Generate CSS custom properties from branding
 */
const generateBrandingStyles = (
  branding?: LoginBranding
): React.CSSProperties => {
  if (!branding) return {};

  return {
    "--login-primary-color": branding.primaryColor || "hsl(var(--primary))",
    "--login-secondary-color":
      branding.secondaryColor || "hsl(var(--secondary))",
    "--login-background-image": branding.backgroundImage
      ? `url(${branding.backgroundImage})`
      : "none",
  } as React.CSSProperties;
};

// ==================== MAIN COMPONENT ====================

/**
 * LoginShell - Main component for metadata-driven authentication
 */
export const LoginShell: React.FC<LoginShellProps> = React.memo(
  ({
    metadata,
    onAuthenticated,
    onError,
    className = "",
    loading: externalLoading = false,
  }) => {
    // ==================== STATE MANAGEMENT ====================

    const [formData, setFormData] = useState<LoginFormData>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [tenantDiscovered, setTenantDiscovered] = useState<string | null>(
      null
    );
    const [availableTenants, setAvailableTenants] = useState<
      Array<{ slug: string; name: string }>
    >([]);
    const [isDiscoveringTenant, setIsDiscoveringTenant] = useState(false);
    const [showTenantSelector, setShowTenantSelector] = useState(false);
    const [authView, setAuthView] = useState<
      "login" | "forgot" | "forgot-success" | "reset" | "reset-success"
    >("login");
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState<string | null>(null);
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [resetValidationStatus, setResetValidationStatus] = useState<
      "idle" | "validating" | "valid" | "invalid"
    >("idle");
    const [resetContext, setResetContext] = useState<{
      maskedEmail?: string;
      tenantSlug?: string;
      expiresAt?: string;
    } | null>(null);
    const [resetPassword, setResetPassword] = useState("");
    const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);

    // Refs for accessibility and focus management
    const formRef = useRef<HTMLFormElement>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);

    // ==================== VALIDATION & MEMOIZATION ====================

    const validationResult = useMemo(
      () => validateMetadata(metadata),
      [metadata]
    );

    const brandingStyles = useMemo(
      () => generateBrandingStyles(metadata.branding),
      [metadata.branding]
    );

    const theme = useMemo(
      () => ({
        mode: metadata.theme?.mode || "professional",
        layout: metadata.theme?.layout || "centered",
        animations: metadata.theme?.animations !== false,
      }),
      [metadata.theme]
    );

    const statHighlights = useMemo(
      () => metadata.statHighlights ?? [],
      [metadata.statHighlights]
    );
    const valuePropositions = useMemo(
      () => metadata.valuePropositions ?? [],
      [metadata.valuePropositions]
    );
    const heroContent = metadata.hero;
    const shouldRenderHeroPanel =
      theme.layout === "split" || theme.layout === "sidebar";
    const heroPanelContent = useMemo<LoginHeroContent | undefined>(() => {
      if (!shouldRenderHeroPanel) return undefined;
      if (heroContent) return heroContent;
      if (metadata.title || metadata.subtitle || metadata.description) {
        return {
          heading: metadata.title,
          tagline: metadata.subtitle,
          body: metadata.description,
        };
      }
      return undefined;
    }, [
      shouldRenderHeroPanel,
      heroContent,
      metadata.title,
      metadata.subtitle,
      metadata.description,
    ]);
    const showHeroPanel =
      shouldRenderHeroPanel &&
      (heroPanelContent ||
        statHighlights.length > 0 ||
        valuePropositions.length > 0);

    // ==================== TENANT DISCOVERY ====================

    /**
     * Get remembered tenant from localStorage for this email
     */
    const getRememberedTenant = useCallback((email: string): string | null => {
      try {
        const key = `intellispec_tenant_${email}`;
        return localStorage.getItem(key);
      } catch (error) {
        console.warn("Failed to read from localStorage:", error);
        return null;
      }
    }, []);

    /**
     * Save tenant selection to localStorage for this email
     */
    const rememberTenant = useCallback((email: string, tenantSlug: string) => {
      try {
        const key = `intellispec_tenant_${email}`;
        localStorage.setItem(key, tenantSlug);
      } catch (error) {
        console.warn("Failed to save to localStorage:", error);
      }
    }, []);

    /**
     * Discover tenant(s) by email domain
     */
    const discoverTenantByEmail = useCallback(
      async (email: string) => {
        if (!email || !email.includes("@")) return;

        // First check localStorage
        const remembered = getRememberedTenant(email);
        if (remembered) {
          setTenantDiscovered(remembered);
          setShowTenantSelector(false);
          return;
        }

        setIsDiscoveringTenant(true);

        try {
          const domain = email.split("@")[1];
          const response = await fetch(
            getApiFullUrl(
              `/api/tenants/discover?email=${encodeURIComponent(
                email
              )}&domain=${encodeURIComponent(domain)}`
            ),
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Tenant discovery failed");
          }

          const data = await response.json();

          if (data.tenantSlug && !data.tenants) {
            // Single tenant found - auto-select and remember
            setTenantDiscovered(data.tenantSlug);
            setShowTenantSelector(false);
            rememberTenant(email, data.tenantSlug);
          } else if (data.tenants && data.tenants.length > 0) {
            // Multiple tenants found - show selector
            setAvailableTenants(data.tenants);
            setShowTenantSelector(true);

            // If only one tenant, auto-select it
            if (data.tenants.length === 1) {
              setTenantDiscovered(data.tenants[0].slug);
              setShowTenantSelector(false);
              rememberTenant(email, data.tenants[0].slug);
            }
          } else {
            // No tenant found - show error
            setSubmitError(
              "No organization found for this email address. Please contact your administrator."
            );
            setShowTenantSelector(false);
          }
        } catch (error) {
          console.error("Tenant discovery error:", error);
          // Don't show error, just proceed without discovery
          setShowTenantSelector(false);
        } finally {
          setIsDiscoveringTenant(false);
        }
      },
      [getRememberedTenant, rememberTenant]
    );

    /**
     * Handle tenant selection from dropdown
     */
    const handleTenantSelect = useCallback(
      (tenantSlug: string) => {
        setTenantDiscovered(tenantSlug);
        setShowTenantSelector(false);

        // Remember this selection
        const email = formData["email"];
        if (email) {
          rememberTenant(email, tenantSlug);
        }
      },
      [formData, rememberTenant]
    );

    /**
     * Load tenant from subdomain or query param on mount
     */
    useEffect(() => {
      const hostname = window.location.hostname;

      // Development: ?tenant=hf-sinclair
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        const params = new URLSearchParams(window.location.search);
        const tenantParam = params.get("tenant");
        if (tenantParam) {
          setTenantDiscovered(tenantParam);
          return;
        }
      }

      // Production: tenant.intellispec.com
      const parts = hostname.split(".");
      if (parts.length >= 2) {
        const subdomain = parts[0];
        if (
          subdomain &&
          subdomain !== "www" &&
          subdomain !== "app" &&
          subdomain !== "localhost"
        ) {
          setTenantDiscovered(subdomain);
        }
      }
    }, []);

    // ==================== EVENT HANDLERS ====================

    const handleFieldChange = useCallback(
      (fieldId: string, value: string) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));

        // Clear field error when user starts typing
        if (errors[fieldId]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldId];
            return newErrors;
          });
        }

        // Clear submit error
        if (submitError) {
          setSubmitError(null);
        }
      },
      [errors, submitError]
    );

    const handleFieldBlur = useCallback(
      (field: LoginField) => {
        const value = formData[field.id] || "";
        const error = validateField(field, value);

        if (error) {
          setErrors((prev) => ({ ...prev, [field.id]: error }));
        }

        // Trigger tenant discovery when email field loses focus
        if (field.id === "email" && value && value.includes("@") && !error) {
          discoverTenantByEmail(value);
        }
      },
      [formData, discoverTenantByEmail]
    );

    const validateForm = useCallback((): boolean => {
      const newErrors: Record<string, string> = {};
      let isValid = true;

      metadata.fields.forEach((field) => {
        const value = formData[field.id] || "";
        const error = validateField(field, value);
        if (error) {
          newErrors[field.id] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    }, [metadata.fields, formData]);

    const handleLoginSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || externalLoading) return;

        // Validate form
        if (!validateForm()) {
          // Focus first error field
          const firstErrorField = metadata.fields.find(
            (field) => errors[field.id]
          );
          if (firstErrorField) {
            const errorElement = document.getElementById(firstErrorField.id);
            errorElement?.focus();
          }
          return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
          // Prepare request data
          const requestData = {
            ...formData,
            tenantSlug: tenantDiscovered,
          };

          // Call authentication API
          const apiEndpoint =
            metadata.apiEndpoint || getApiFullUrl("/api/auth/login");
          const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          });

          // Safe parse in case of non-JSON error
          const raw = await response.text();
          let data: any = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {}

          if (!response.ok) {
            throw new Error(
              data?.error || data?.message || raw || "Authentication failed"
            );
          }

          const authData: AuthResponse = data;

          // Store token (in production, use secure storage)
          if (authData.token) {
            localStorage.setItem("authToken", authData.token);
            localStorage.setItem("user", JSON.stringify(authData.user));
          }

          // Redirect after login if metadata provides a redirectUrl or default to home workspace
          if (metadata.redirectUrl) {
            window.location.href = metadata.redirectUrl;
          } else {
            try {
              const url = new URL(window.location.href);
              url.searchParams.set("workspace", "home/home");
              window.location.replace(url.toString());
            } catch {
              // Fallback to onAuthenticated callback
              onAuthenticated?.(authData.user, authData.token);
            }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Authentication failed";
          setSubmitError(errorMessage);
          onError?.(error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        isSubmitting,
        externalLoading,
        validateForm,
        metadata.fields,
        metadata.apiEndpoint,
        metadata.redirectUrl,
        errors,
        formData,
        tenantDiscovered,
        onAuthenticated,
        onError,
      ]
    );

    const clearResetTokenFromUrl = useCallback(() => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("token")) {
          url.searchParams.delete("token");
        }
        if (url.searchParams.has("resetToken")) {
          url.searchParams.delete("resetToken");
        }
        window.history.replaceState({}, document.title, url.toString());
      } catch (error) {
        console.error("Failed to clear reset token from URL:", error);
      }
    }, []);

    const handleForgotPasswordClick = useCallback(() => {
      setForgotError(null);
      setAuthView("forgot");
      setForgotEmail((formData["email"] as string) || "");
      setResetError(null);
      setResetPassword("");
      setResetPasswordConfirm("");
      setResetToken(null);
      setResetValidationStatus("idle");
      setResetContext(null);
      clearResetTokenFromUrl();
    }, [formData, clearResetTokenFromUrl]);

    const handleReturnToLogin = useCallback(() => {
      setAuthView("login");
      setForgotError(null);
      setResetError(null);
      setForgotLoading(false);
      setResetLoading(false);
      setResetPassword("");
      setResetPasswordConfirm("");
      setResetToken(null);
      setResetValidationStatus("idle");
      setResetContext(null);
      clearResetTokenFromUrl();
    }, [clearResetTokenFromUrl]);

    const handleForgotPasswordSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (forgotLoading) return;

        const emailToUse =
          forgotEmail.trim() ||
          ((formData["email"] as string) || "").trim();

        if (!emailToUse) {
          setForgotError("Please enter the email associated with your account.");
          return;
        }

        setForgotLoading(true);
        setForgotError(null);

        try {
          const response = await fetch(
            getApiFullUrl("/api/auth/forgot-password"),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: emailToUse,
                tenantSlug: tenantDiscovered,
              }),
            }
          );

          const raw = await response.text();
          let data: any = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {}

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                raw ||
                "Unable to process password reset request"
            );
          }

          setAuthView("forgot-success");
          setForgotEmail(emailToUse);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to process password reset request";
          setForgotError(message);
        } finally {
          setForgotLoading(false);
        }
      },
      [forgotEmail, forgotLoading, formData, tenantDiscovered]
    );

    const validateResetToken = useCallback(
      async (tokenValue: string) => {
        if (!tokenValue) return;

        setResetValidationStatus("validating");
        setResetError(null);

        try {
          const response = await fetch(
            getApiFullUrl(`/api/auth/reset-password/${tokenValue}`)
          );
          const raw = await response.text();
          let data: any = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {}

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                raw ||
                "Invalid or expired password reset link"
            );
          }

          setResetValidationStatus("valid");
          setResetContext({
            maskedEmail: data?.maskedEmail,
            tenantSlug: data?.tenantSlug,
            expiresAt: data?.expiresAt,
          });
        } catch (error) {
          setResetValidationStatus("invalid");
          const message =
            error instanceof Error
              ? error.message
              : "Invalid or expired password reset link";
          setResetError(message);
        }
      },
      []
    );

    useEffect(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get("token") || params.get("resetToken");
        if (tokenParam) {
          setResetToken(tokenParam);
          setAuthView("reset");
          setResetPassword("");
          setResetPasswordConfirm("");
          validateResetToken(tokenParam);
        }
      } catch (error) {
        console.error("Failed to parse password reset token from URL:", error);
      }
    }, [validateResetToken]);

    const handleResetPasswordSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetLoading) return;

        if (!resetToken) {
          setResetError(
            "This password reset link is invalid or has already been used."
          );
          setResetValidationStatus("invalid");
          return;
        }

        if (!resetPassword || resetPassword.length < 8) {
          setResetError("Password must be at least 8 characters long.");
          return;
        }

        if (resetPassword !== resetPasswordConfirm) {
          setResetError("Passwords do not match.");
          return;
        }

        setResetLoading(true);
        setResetError(null);

        try {
          const response = await fetch(
            getApiFullUrl("/api/auth/reset-password"),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                token: resetToken,
                password: resetPassword,
              }),
            }
          );

          const raw = await response.text();
          let data: any = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {}

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                raw ||
                "Unable to reset password. Request a new reset link and try again."
            );
          }

          setAuthView("reset-success");
          setResetPassword("");
          setResetPasswordConfirm("");
          setResetToken(null);
          setResetValidationStatus("idle");
          setResetContext(null);
          clearResetTokenFromUrl();
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to reset password. Request a new reset link and try again.";
          setResetError(message);
          if (message.toLowerCase().includes("invalid")) {
            setResetValidationStatus("invalid");
          }
        } finally {
          setResetLoading(false);
        }
      },
      [
        resetLoading,
        resetToken,
        resetPassword,
        resetPasswordConfirm,
        clearResetTokenFromUrl,
      ]
    );

    // ==================== EFFECTS ====================

    // Focus first field on mount
    useEffect(() => {
      if (authView === "login" && firstFieldRef.current) {
        firstFieldRef.current.focus();
      }
      if (authView === "forgot") {
        const forgotInput = document.getElementById(
          "forgot-email"
        ) as HTMLInputElement | null;
        forgotInput?.focus();
      }
      if (authView === "reset" && resetValidationStatus === "valid") {
        const resetInput = document.getElementById(
          "reset-password"
        ) as HTMLInputElement | null;
        resetInput?.focus();
      }
    }, [authView, resetValidationStatus]);

    // ==================== RENDER HELPERS ====================

    const actionsToRender = useMemo(() => {
      return metadata.actions.map((action) => {
        if (action.id === "forgot-password") {
          return {
            ...action,
            onClick: handleForgotPasswordClick,
          };
        }
        return action;
      });
    }, [metadata.actions, handleForgotPasswordClick]);

    /**
     * Render form field
     */
    const renderField = useCallback(
      (field: LoginField, index: number) => {
        const value = formData[field.id] || "";
        const error = errors[field.id];
        const isFirstField = index === 0;

        return (
          <div key={field.id} className="field-group">
            <label htmlFor={field.id} className="field-label">
              {renderBrandAwareText(field.label)}
              {field.required && (
                <span className="required-indicator" aria-label="required">
                  *
                </span>
              )}
            </label>

            <input
              ref={isFirstField ? firstFieldRef : undefined}
              id={field.id}
              name={field.id}
              type={field.type}
              value={value}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              disabled={field.disabled || isSubmitting || externalLoading}
              required={field.required}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
              className={`field-input ${error ? "field-input--error" : ""}`}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
            />

            {error && (
              <div
                id={`${field.id}-error`}
                className="field-error"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}
          </div>
        );
      },
      [
        formData,
        errors,
        isSubmitting,
        externalLoading,
        handleFieldChange,
        handleFieldBlur,
      ]
    );

    /**
     * Render action button
     */
    const renderAction = useCallback(
      (action: LoginAction) => {
        const isSubmitAction = action.type === "submit";
        const isLoading =
          (isSubmitAction && isSubmitting) || action.loading || externalLoading;

        if (action.type === "link") {
          return (
            <button
              key={action.id}
              type="button"
              className={`action-button action-button--${action.variant}`}
              disabled={action.disabled || isLoading}
              onClick={action.onClick}
            >
              {renderBrandAwareText(action.label)}
            </button>
          );
        }

        return (
          <button
            key={action.id}
            type={action.type}
            className={`action-button action-button--${action.variant} ${
              isLoading ? "action-button--loading" : ""
            }`}
            disabled={action.disabled || isLoading}
            onClick={action.type === "button" ? action.onClick : undefined}
          >
            {isLoading && (
              <span className="loading-spinner" aria-hidden="true"></span>
            )}
            <span>{renderBrandAwareText(action.label)}</span>
          </button>
        );
      },
      [isSubmitting, externalLoading]
    );

    // ==================== RENDER ====================

    // Show validation errors for invalid metadata
    if (!validationResult.isValid) {
      return (
        <div className="login-shell-error" role="alert">
          <h2>Configuration Error</h2>
          <p>The login form metadata is invalid:</p>
          <ul>
            {validationResult.errors?.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div
        className={`login-shell login-shell--${theme.mode} login-shell--${theme.layout} ${className}`}
        style={brandingStyles}
      >
        {showHeroPanel && (
          <aside
            className="login-shell__hero"
            role="banner"
            aria-label="Industrial intelligence platform overview"
          >
            <div className="login-shell__hero-glow" aria-hidden="true"></div>
            <div className="login-shell__hero-surface">
              {(heroPanelContent?.badge || metadata.branding?.companyName) && (
                <span className="hero-badge">
                  {renderBrandAwareText(
                    heroPanelContent?.badge ||
                      metadata.branding?.companyName ||
                      ""
                  )}
                </span>
              )}
              {heroPanelContent?.eyebrow && (
                <span className="hero-eyebrow">
                  {renderBrandAwareText(heroPanelContent.eyebrow)}
                </span>
              )}
              <h2 className="hero-heading">
                {renderBrandAwareText(
                  heroPanelContent?.heading || metadata.title
                )}
              </h2>
              {heroPanelContent?.tagline && (
                <p className="hero-tagline">
                  {renderBrandAwareText(heroPanelContent.tagline)}
                </p>
              )}
              {heroPanelContent?.body && (
                <p className="hero-body">
                  {renderBrandAwareText(heroPanelContent.body)}
                </p>
              )}
              {statHighlights.length > 0 && (
                <div className="hero-stats" role="list">
                  {statHighlights.map((stat, index) => (
                    <div
                      key={`${stat.label}-${index}`}
                      className="hero-stat"
                      role="listitem"
                    >
                      <span className="hero-stat__value">
                        {renderBrandAwareText(stat.value)}
                      </span>
                      <span className="hero-stat__label">
                        {renderBrandAwareText(stat.label)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {valuePropositions.length > 0 && (
                <ul className="hero-feature-list">
                  {valuePropositions.map((item, index) => (
                    <li key={`${item.title}-${index}`} className="hero-feature">
                      <div className="hero-feature__content">
                        <span className="hero-feature__title">
                          {renderBrandAwareText(item.title)}
                        </span>
                        {item.description && (
                          <span className="hero-feature__description">
                            {renderBrandAwareText(item.description)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}
        <div className="login-shell__container">
          {/* Branding Section */}
          <div className="login-shell__branding">
            <LoginLogo
              alt={`${metadata.branding?.companyName || "intelliSPEC"} Logo`}
              className="branding-logo"
            />
          </div>

          {/* Header Section */}
          <div className="login-shell__header">
            <h1 className="login-title">
              {renderBrandAwareText(metadata.title)}
            </h1>
            {metadata.subtitle && (
              <p className="login-subtitle">
                {renderBrandAwareText(metadata.subtitle)}
              </p>
            )}
            {metadata.description && (
              <p className="login-description">
                {renderBrandAwareText(metadata.description)}
              </p>
            )}
          </div>

          {/* Form Section */}
          {authView === "login" && (
            <form
              ref={formRef}
              className="login-shell__form"
              onSubmit={handleLoginSubmit}
              noValidate
            >
              <div className="form-fields">
                {metadata.fields.map((field, index) =>
                  renderField(field, index)
                )}
              </div>

              {isDiscoveringTenant && (
                <div
                  className="tenant-discovery-indicator"
                  role="status"
                  aria-live="polite"
                >
                  <span className="discovery-spinner"></span>
                  <span className="discovery-text">
                    Finding your organization...
                  </span>
                </div>
              )}

              {showTenantSelector && availableTenants.length > 0 && (
                <div className="tenant-selector-container">
                  <label
                    htmlFor="tenant-selector"
                    className="tenant-selector-label"
                  >
                    Select Your Organization
                  </label>
                  <select
                    id="tenant-selector"
                    className="tenant-selector"
                    value={tenantDiscovered || ""}
                    onChange={(e) => handleTenantSelect(e.target.value)}
                    aria-label="Select organization"
                  >
                    <option value="">-- Select Organization --</option>
                    {availableTenants.map((tenant) => (
                      <option key={tenant.slug} value={tenant.slug}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                  <p className="tenant-selector-hint">
                    You have access to multiple organizations. Please select one
                    to continue.
                  </p>
                </div>
              )}

              {tenantDiscovered &&
                !showTenantSelector &&
                formData["email"] && (
                  <div className="tenant-confirmed-indicator" role="status">
                    <svg
                      className="tenant-icon"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="tenant-name">
                      Organization:{" "}
                      <strong>
                        {availableTenants.find(
                          (t) => t.slug === tenantDiscovered
                        )?.name || tenantDiscovered}
                      </strong>
                    </span>
                  </div>
                )}

              {submitError && (
                <div className="form-error" role="alert" aria-live="polite">
                  {submitError}
                </div>
              )}

              <div className="form-actions">
                {actionsToRender.map(renderAction)}
              </div>

              {metadata.securityAssurance && (
                <div className="login-security-note" role="note">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 8a5 5 0 1110 0v1h.5A1.5 1.5 0 0117 10.5v5A1.5 1.5 0 0115.5 17h-11A1.5 1.5 0 013 15.5v-5A1.5 1.5 0 014.5 9H5V8zm2 1h6V8a3 3 0 10-6 0v1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{renderBrandAwareText(metadata.securityAssurance)}</span>
                </div>
              )}
            </form>
          )}

          {authView === "forgot" && (
            <form
              className="login-shell__form"
              onSubmit={handleForgotPasswordSubmit}
              noValidate
            >
              <div className="form-fields">
                <div className="field-group">
                  <label htmlFor="forgot-email" className="field-label">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    name="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="field-input"
                    placeholder="you@company.com"
                  />
                  <p className="form-helper">
                    We will email password reset instructions to the address on
                    file.
                  </p>
                </div>
              </div>

              {forgotError && (
                <div className="form-error" role="alert" aria-live="polite">
                  {forgotError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className={`action-button action-button--primary ${
                    forgotLoading ? "action-button--loading" : ""
                  }`}
                  disabled={forgotLoading}
                >
                  {forgotLoading && (
                    <span className="loading-spinner" aria-hidden="true"></span>
                  )}
                  <span>Send reset link</span>
                </button>
                <button
                  type="button"
                  className="action-button action-button--text"
                  onClick={handleReturnToLogin}
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {authView === "forgot-success" && (
            <div className="login-shell__form login-shell__form--static">
              <div className="form-success" role="status">
                <svg
                  className="form-success__icon"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v6a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h7" />
                </svg>
                <h2>Password reset email sent</h2>
                <p>
                  If an account matches{" "}
                  <strong>{renderBrandAwareText(forgotEmail)}</strong>, we just
                  sent reset instructions. Check your inbox (and spam folder) to
                  continue.
                </p>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="action-button action-button--primary"
                  onClick={handleReturnToLogin}
                >
                  Return to sign in
                </button>
              </div>
            </div>
          )}

          {authView === "reset" && (
            <form
              className="login-shell__form"
              onSubmit={handleResetPasswordSubmit}
              noValidate
            >
              {resetValidationStatus === "validating" && (
                <div
                  className="tenant-discovery-indicator"
                  role="status"
                  aria-live="polite"
                >
                  <span className="discovery-spinner"></span>
                  <span className="discovery-text">
                    Validating your reset link...
                  </span>
                </div>
              )}

              {resetValidationStatus === "valid" && (
                <div className="form-fields">
                  <p className="form-helper">
                    Reset password for{" "}
                    <strong>
                      {renderBrandAwareText(
                        resetContext?.maskedEmail || "your account"
                      )}
                    </strong>
                    . Your link expires soon—choose a new password below.
                  </p>
                  <div className="field-group">
                    <label htmlFor="reset-password" className="field-label">
                      New Password
                    </label>
                    <input
                      id="reset-password"
                      name="reset-password"
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="field-input"
                      placeholder="Enter a new password"
                    />
                  </div>
                  <div className="field-group">
                    <label
                      htmlFor="reset-password-confirm"
                      className="field-label"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="reset-password-confirm"
                      name="reset-password-confirm"
                      type="password"
                      value={resetPasswordConfirm}
                      onChange={(e) =>
                        setResetPasswordConfirm(e.target.value)
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="field-input"
                      placeholder="Re-enter your new password"
                    />
                  </div>
                </div>
              )}

              {resetValidationStatus === "invalid" && (
                <div className="form-error" role="alert" aria-live="polite">
                  {resetError ||
                    "This password reset link is invalid or has expired. Request a new one to continue."}
                </div>
              )}

              {resetValidationStatus === "valid" && resetError && (
                <div className="form-error" role="alert" aria-live="polite">
                  {resetError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className={`action-button action-button--primary ${
                    resetLoading ? "action-button--loading" : ""
                  }`}
                  disabled={
                    resetLoading || resetValidationStatus !== "valid"
                  }
                >
                  {resetLoading && (
                    <span className="loading-spinner" aria-hidden="true"></span>
                  )}
                  <span>Update password</span>
                </button>
                <button
                  type="button"
                  className="action-button action-button--text"
                  onClick={
                    resetValidationStatus === "invalid"
                      ? handleForgotPasswordClick
                      : handleReturnToLogin
                  }
                >
                  {resetValidationStatus === "invalid"
                    ? "Request a new link"
                    : "Back to sign in"}
                </button>
              </div>
            </form>
          )}

          {authView === "reset-success" && (
            <div className="login-shell__form login-shell__form--static">
              <div className="form-success" role="status">
                <svg
                  className="form-success__icon"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v6a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h7" />
                </svg>
                <h2>Password updated</h2>
                <p>
                  Your password has been reset successfully. Sign in with your
                  new credentials to continue.
                </p>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="action-button action-button--primary"
                  onClick={handleReturnToLogin}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {authView === "login" && (isSubmitting || externalLoading) && (
          <div className="login-shell__overlay" aria-hidden="true">
            <div className="loading-indicator">
              <span className="loading-spinner"></span>
              <span className="loading-text">Signing in...</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

LoginShell.displayName = "LoginShell";

// ==================== STYLES ====================

/**
 * Professional, accessible, and responsive CSS styles
 * Following shadcn design tokens and the project's theme system
 */
export const loginShellStyles = `
/* intelliSPEC Auth Shell styling aligned with theme tokens */
.brand-name {
  display: inline-flex;
  align-items: baseline;
  font-weight: inherit;
  line-height: inherit;
}

.brand-name__prefix {
  text-transform: lowercase;
}

.brand-name__spec {
  color: hsl(var(--primary));
  font-weight: 700;
  text-transform: uppercase;
}

.login-shell {
  --login-spacing-xs: 0.5rem;
  --login-spacing-sm: 1rem;
  --login-spacing-md: 1.5rem;
  --login-spacing-lg: 2rem;
  --login-spacing-xl: 3rem;
  
  --login-border-radius: 0.5rem;
  --login-border-width: 1px;
  --login-font-size-sm: 0.875rem;
  --login-font-size-base: 1rem;
  --login-font-size-lg: 1.125rem;
  --login-font-size-xl: 1.25rem;
  --login-font-size-2xl: 1.5rem;
  
  --login-transition: all 0.2s ease-in-out;
  --login-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --login-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --login-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  position: relative;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 3.25rem);
  isolation: isolate;
}

.login-shell::before,
.login-shell::after {
  content: none;
}

.login-shell__container {
  width: 100%;
  max-width: 420px;
  padding: clamp(1.6rem, 2.8vw, 2.4rem);
  background: hsl(var(--card) / 0.82);
  border: 1px solid hsl(var(--border) / 0.4);
  border-radius: var(--login-border-radius);
  box-shadow: 0 30px 60px -35px hsl(var(--primary) / 0.45), var(--login-shadow-lg);
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vh, 1rem);
  backdrop-filter: saturate(180%) blur(24px);
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(18px);
  animation: panelSlideIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.18s forwards;
}

.login-shell__container::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 4px;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(90deg, hsl(var(--primary) / 0.65), hsl(var(--accent) / 0.55), transparent);
  opacity: 0.75;
}

.login-shell__container::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid hsl(var(--border) / 0.35);
  pointer-events: none;
}

.login-shell__hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.8rem, 3.4vh, 3rem) clamp(1.4rem, 3vw, 2.6rem);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  overflow: hidden;
  min-height: clamp(360px, 66vh, 600px);
  isolation: isolate;
  border-radius: calc(var(--login-border-radius) * 2.4);
  border: 1px solid hsl(var(--border));
  box-shadow:
    inset 0 1px 0 hsl(var(--background) / 0.6),
    var(--login-shadow-lg);
}

.login-shell__hero::before {
  display: none;
}

.login-shell__hero::after {
  display: none;
}

.login-shell__hero-glow {
  display: none;
}

.login-shell__hero-surface {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.7rem, 1.4vh, 1.2rem);
  width: min(760px, 100%);
  align-self: center;
  padding: clamp(1rem, 2.3vh, 1.8rem) clamp(0.5rem, 1.4vw, 1rem);
}

.hero-badge,
.hero-eyebrow,
.hero-heading,
.hero-tagline,
.hero-body,
.hero-stats,
.hero-feature,
.hero-stat {
  opacity: 0;
  transform: translateY(18px);
  animation: heroFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.hero-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
  border: 1px solid hsl(var(--primary) / 0.24);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  animation-delay: 0.08s;
}

.hero-eyebrow {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--primary));
  animation-delay: 0.12s;
}

.hero-heading {
  font-size: clamp(2.1rem, 3.3vw, 2.9rem);
  font-weight: 700;
  line-height: 1.05;
  margin: 0;
  color: hsl(var(--foreground));
  letter-spacing: -0.02em;
  animation-delay: 0.18s;
}

.hero-tagline {
  margin: 0;
  font-size: clamp(1rem, 2.3vw, 1.4rem);
  color: hsl(var(--muted-foreground));
  animation-delay: 0.26s;
}

.hero-body {
  margin: 0;
  font-size: clamp(0.92rem, 1.9vw, 1.05rem);
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
  animation-delay: 0.32s;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.55rem;
  animation-delay: 0.42s;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.9rem 1.05rem;
  border-radius: calc(var(--login-border-radius) * 1.4);
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  box-shadow: var(--login-shadow-sm);
  animation-delay: 0.48s;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}

.hero-stat:hover,
.hero-stat:focus-within {
  transform: translateY(-3px);
  border-color: hsl(var(--primary) / 0.35);
  box-shadow: 0 16px 28px -24px hsl(var(--primary) / 0.45);
}

.hero-stat__value {
  font-size: 1.1rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.15;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

.hero-stat__label {
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.35;
}

.hero-feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.hero-feature {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.95rem 1.2rem 1rem 1.35rem;
  border-radius: calc(var(--login-border-radius) * 1.4);
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: var(--login-shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
}

.hero-feature::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, hsl(var(--primary) / 0.16), hsl(var(--accent) / 0.14));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.hero-feature::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)));
  opacity: 0.85;
  border-top-left-radius: calc(var(--login-border-radius) * 1.4);
  border-bottom-left-radius: calc(var(--login-border-radius) * 1.4);
  z-index: 1;
}

.hero-feature:hover,
.hero-feature:focus-within {
  transform: translateY(-3px);
  border-color: hsl(var(--primary) / 0.35);
  box-shadow: 0 16px 28px -24px hsl(var(--primary) / 0.45);
}

.hero-feature:hover::before,
.hero-feature:focus-within::before {
  opacity: 1;
}

.hero-feature__content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative;
  z-index: 2;
}

.hero-feature__title {
  font-weight: 600;
  font-size: clamp(0.95rem, 2vw, 1.08rem);
  color: hsl(var(--foreground));
  letter-spacing: -0.01em;
}

.hero-feature__description {
  font-size: 0.84rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.45;
}

.hero-feature:nth-child(1) { animation-delay: 0.6s; }
.hero-feature:nth-child(2) { animation-delay: 0.68s; }
.hero-feature:nth-child(3) { animation-delay: 0.76s; }
.hero-feature:nth-child(4) { animation-delay: 0.84s; }

.hero-stat:nth-child(1) { animation-delay: 0.48s; }
.hero-stat:nth-child(2) { animation-delay: 0.56s; }
.hero-stat:nth-child(3) { animation-delay: 0.64s; }
.hero-stat:nth-child(4) { animation-delay: 0.72s; }

.login-shell__branding {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: clamp(0.4rem, 1.5vh, 0.8rem);
}

.branding-logo {
  max-height: 54px;
  max-width: 200px;
  width: auto;
  height: auto;
}

.login-shell__header {
  text-align: left;
  margin-bottom: clamp(0.8rem, 2vh, 1.2rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.login-title {
  font-size: clamp(1.8rem, 3.2vw, 2.2rem);
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0;
  line-height: 1.1;
}

.login-subtitle {
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: hsl(var(--muted-foreground));
  margin: 0;
  line-height: 1.4;
}

.login-description {
  font-size: 0.92rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
  line-height: 1.5;
}

.login-shell__form {
  width: 100%;
  opacity: 0;
  transform: translateY(18px);
  animation: panelSlideIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.24s forwards;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: clamp(0.55rem, 1.6vh, 0.9rem);
  margin-bottom: clamp(0.9rem, 2.4vh, 1.2rem);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-xs);
}

.field-label {
  font-size: var(--login-font-size-sm);
  font-weight: 500;
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-indicator {
  color: hsl(var(--destructive));
  font-weight: bold;
}

.field-input {
  width: 100%;
  padding: clamp(0.6rem, 1.9vh, 0.75rem);
  font-size: var(--login-font-size-base);
  line-height: 1.5;
  color: hsl(var(--foreground));
  background: hsl(var(--card) / 0.6);
  border: 1px solid hsl(var(--border) / 0.6);
  border-radius: var(--login-border-radius);
  box-shadow: inset 0 1px 0 hsl(var(--background) / 0.4);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  outline: none;
}

.field-input:hover {
  border-color: hsl(var(--ring) / 0.7);
  background: hsl(var(--card) / 0.7);
}

.field-input::placeholder {
  color: hsl(var(--muted-foreground) / 0.8);
}

.field-input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.18), 0 14px 28px -24px hsl(var(--ring) / 0.55);
}

.field-input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  background: hsl(var(--muted) / 0.4);
  border-color: hsl(var(--muted) / 0.6);
}

.field-input--error {
  border-color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 0.05);
}

.field-input--error:focus {
  border-color: hsl(var(--destructive));
  box-shadow: 0 0 0 3px hsl(var(--destructive) / 0.18);
}

.field-error {
  font-size: var(--login-font-size-sm);
  color: hsl(var(--destructive));
  margin-top: var(--login-spacing-xs);
}

.form-error {
  padding: var(--login-spacing-sm);
  background: hsl(var(--destructive) / 0.12);
  border: var(--login-border-width) solid hsl(var(--destructive) / 0.28);
  border-radius: var(--login-border-radius);
  color: hsl(var(--destructive));
  font-size: var(--login-font-size-sm);
  margin-bottom: var(--login-spacing-md);
  box-shadow: 0 12px 24px -22px hsl(var(--destructive) / 0.5);
}

.form-helper {
  margin-top: var(--login-spacing-xs);
  font-size: var(--login-font-size-sm);
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

.login-shell__form--static {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-md);
}

.form-success {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-sm);
  padding: var(--login-spacing-md);
  border-radius: var(--login-border-radius);
  background: hsl(var(--success) / 0.12);
  border: 1px solid hsl(var(--success) / 0.32);
  color: hsl(var(--success-foreground));
  box-shadow: 0 18px 32px -28px hsl(var(--success) / 0.4);
}

.form-success__icon {
  width: 2.25rem;
  height: 2.25rem;
  color: hsl(var(--success));
  flex-shrink: 0;
}

.form-success h2 {
  margin: 0;
  font-size: var(--login-font-size-lg);
  font-weight: 600;
  color: hsl(var(--foreground));
}

.form-success p {
  margin: 0;
  font-size: var(--login-font-size-base);
  color: hsl(var(--muted-foreground));
  line-height: 1.6;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: clamp(0.65rem, 1.5vh, 0.9rem);
  margin-top: 0.2rem;
}

.login-security-note {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.6rem;
}

.login-security-note svg {
  width: 0.9rem;
  height: 0.9rem;
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--login-spacing-xs);
  padding: var(--login-spacing-sm) var(--login-spacing-md);
  font-size: var(--login-font-size-base);
  font-weight: 500;
  line-height: 1.5;
  border: var(--login-border-width) solid transparent;
  border-radius: var(--login-border-radius);
  cursor: pointer;
  transition: var(--login-transition);
  text-decoration: none;
  outline: none;
  min-height: 44px;
}

.action-button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button--primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  box-shadow: 0 18px 32px -18px hsl(var(--primary) / 0.75), 0 14px 32px -20px hsl(var(--accent) / 0.65);
}

.action-button--primary:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.9);
}

.action-button--secondary {
  background: hsl(var(--secondary) / 0.9);
  color: hsl(var(--secondary-foreground));
  border: 1px solid hsl(var(--secondary-foreground) / 0.2);
}

.action-button--secondary:hover:not(:disabled) {
  background: hsl(var(--secondary) / 0.75);
}

.action-button--text {
  background: transparent;
  color: hsl(var(--primary));
  border-color: transparent;
  padding: var(--login-spacing-xs) 0;
}

.action-button--text:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.1);
}

.action-button--link {
  background: transparent;
  color: hsl(var(--primary));
  border: none;
  padding: 0;
  min-height: auto;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.action-button--link:hover:not(:disabled) {
  text-decoration-thickness: 2px;
}

.action-button--loading {
  position: relative;
  color: transparent;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.action-button--loading .loading-spinner {
  position: absolute;
  color: inherit;
}

.login-shell__overlay {
  position: absolute;
  inset: 0;
  background: hsl(var(--background) / 0.82);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--login-spacing-sm);
  padding: var(--login-spacing-lg);
  background: hsl(var(--card) / 0.92);
  border-radius: var(--login-border-radius);
  box-shadow: 0 20px 40px -28px hsl(var(--primary) / 0.45);
}

.loading-text {
  font-size: var(--login-font-size-sm);
  color: hsl(var(--muted-foreground));
}

.login-shell-error {
  max-width: 500px;
  padding: var(--login-spacing-lg);
  background: hsl(var(--destructive) / 0.12);
  border: var(--login-border-width) solid hsl(var(--destructive) / 0.3);
  border-radius: var(--login-border-radius);
  color: hsl(var(--destructive));
  box-shadow: 0 20px 40px -28px hsl(var(--destructive) / 0.55);
}

.login-shell-error h2 {
  margin: 0 0 var(--login-spacing-sm) 0;
  font-size: var(--login-font-size-xl);
}

.login-shell-error p {
  margin: 0 0 var(--login-spacing-sm) 0;
}

.login-shell-error ul {
  margin: 0;
  padding-left: var(--login-spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes heroGradientShift {
  0% { transform: rotate(0deg) scale(1); opacity: 0.88; }
  40% { transform: rotate(6deg) scale(1.05); opacity: 0.94; }
  70% { transform: rotate(-4deg) scale(1.02); opacity: 0.9; }
  100% { transform: rotate(0deg) scale(1); opacity: 0.88; }
}

@keyframes heroGlowPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.55; }
}

@keyframes heroFadeUp {
  0% { opacity: 0; transform: translateY(26px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes panelSlideIn {
  0% { opacity: 0; transform: translateY(26px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Theme Variations */
.login-shell--modern {
  background: linear-gradient(160deg, hsl(var(--primary) / 0.06), hsl(var(--secondary) / 0.04));
}

.login-shell--minimal .login-shell__container {
  box-shadow: none;
  border: none;
  background: transparent;
}

/* Layout Variations */
.login-shell--split {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.65fr);
  min-height: 100vh;
  padding: clamp(0.6rem, 2.2vh, 1.2rem);
  align-items: stretch;
  gap: clamp(0.9rem, 2vw, 1.4rem);
}

.login-shell--split .login-shell__container {
  align-self: center;
  justify-self: center;
  margin: 0;
  max-width: 420px;
}

.login-shell--sidebar .login-shell__container {
  max-width: 300px;
  position: fixed;
  left: var(--login-spacing-lg);
  top: 50%;
  transform: translateY(-50%);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .login-shell--split {
    grid-template-columns: 1fr;
  }

  .login-shell__hero {
    min-height: auto;
  }

  .login-shell--split .login-shell__container {
    margin: clamp(1.5rem, 4vw, 2.5rem);
  }
}

@media (max-width: 768px) {
  .login-shell {
    padding: var(--login-spacing-md);
    align-items: flex-start;
    padding-top: var(--login-spacing-xl);
  }
  
  .login-shell__container {
    max-width: 100%;
    padding: var(--login-spacing-md);
  }
  
  .login-shell--split {
    grid-template-columns: 1fr;
    gap: var(--login-spacing-lg);
  }

  .login-shell__hero {
    border-radius: calc(var(--login-border-radius) * 1.5);
    margin-bottom: 0;
    order: -1;
    padding: clamp(1.25rem, 4vw, 2rem);
  }

  .login-shell__hero-surface {
    width: 100%;
  }

  .hero-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .login-shell--split .login-shell__container {
    margin: 0;
  }
  
  .login-shell--sidebar .login-shell__container {
    position: static;
    transform: none;
    max-width: 100%;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .field-input {
    border-width: 2px;
  }
  
  .action-button {
    border-width: 2px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .login-shell *,
  .login-shell *::before,
  .login-shell *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .login-shell__hero::before,
  .login-shell__hero-glow {
    animation: none !important;
  }
  
  .hero-badge,
  .hero-eyebrow,
  .hero-heading,
  .hero-tagline,
  .hero-body,
  .hero-stats,
  .hero-stat,
  .hero-feature,
  .login-shell__container,
  .login-shell__form {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .login-shell {
    color-scheme: dark;
    background: hsl(var(--background));
  }
  
  .login-shell__background {
    opacity: 0.3;
  }
}

/* Tenant Discovery & Selection Styles */
.tenant-discovery-indicator {
  display: flex;
  align-items: center;
  gap: var(--login-spacing-sm);
  padding: var(--login-spacing-md);
  background: hsl(var(--primary) / 0.05);
  border: 1px solid hsl(var(--primary) / 0.2);
  border-radius: var(--login-border-radius);
  margin-top: var(--login-spacing-md);
  color: hsl(var(--primary));
  font-size: 0.875rem;
}

.discovery-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--primary) / 0.3);
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.discovery-text {
  font-weight: 500;
}

.tenant-selector-container {
  margin-top: clamp(0.5rem, 1.6vh, 0.9rem);
  padding: clamp(0.55rem, 1.4vh, 0.85rem);
  background: hsl(var(--muted) / 0.32);
  border: 1px solid hsl(var(--border) / 0.9);
  border-radius: calc(var(--login-border-radius) * 0.9);
  box-shadow: inset 0 1px 0 hsl(var(--background) / 0.4);
}

.tenant-selector-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: var(--login-spacing-xs);
}

.tenant-selector {
  width: 100%;
  padding: clamp(0.5rem, 1.5vh, 0.65rem) var(--login-spacing-md);
  font-size: 0.95rem;
  font-family: inherit;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  border: 1px solid hsl(var(--input));
  border-radius: calc(var(--login-border-radius) * 0.9);
  transition: all 0.2s ease;
  cursor: pointer;
}

.tenant-selector:hover {
  border-color: hsl(var(--ring));
}

.tenant-selector:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.12);
}

.tenant-selector-hint {
  margin-top: clamp(0.35rem, 1vh, 0.5rem);
  font-size: 0.76rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
}

.tenant-confirmed-indicator {
  display: flex;
  align-items: center;
  gap: var(--login-spacing-sm);
  padding: var(--login-spacing-sm) var(--login-spacing-md);
  margin-top: var(--login-spacing-md);
  background: hsl(var(--success) / 0.1);
  border: 1px solid hsl(var(--success) / 0.3);
  border-radius: var(--login-border-radius);
  font-size: 0.875rem;
  color: hsl(var(--success-foreground));
}

.tenant-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: hsl(var(--success));
}

.tenant-name {
  color: hsl(var(--foreground));
}

.tenant-name strong {
  font-weight: 600;
  color: hsl(var(--primary));
}

`;

// ==================== DEFAULT METADATA ====================

/**
 * Default login metadata for fallback and demo purposes
 */
export const defaultLoginMetadata: LoginMetadata = {
  title: "Access intelliSPEC Command Center",
  subtitle: "Industrial Intelligence Platform",
  branding: {
    companyName: "intelliSPEC",
    primaryColor: "hsl(var(--primary))",
  },
  fields: [
    {
      id: "email",
      type: "email",
      label: "Email Address",
      placeholder: "Enter your email",
      required: true,
      autoComplete: "email",
      validation: {
        required: true,
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        message: "Please enter a valid email address",
      },
    },
    {
      id: "password",
      type: "password",
      label: "Password",
      placeholder: "Enter your password",
      required: true,
      autoComplete: "current-password",
      validation: {
        required: true,
        minLength: 8,
        message: "Password must be at least 8 characters",
      },
    },
  ],
  actions: [
    {
      id: "login",
      type: "submit",
      label: "Launch Workspace",
      variant: "primary",
    },
    {
      id: "forgot-password",
      type: "link",
      label: "Forgot Password?",
      variant: "text",
    },
  ],
  features: {
    tenantDiscovery: true,
    rememberMe: true,
    socialLogin: false,
    autoComplete: true,
  },
  hero: {
    badge: "Industrial Intelligence Platform",
    eyebrow:
      "Beyond CMMS/EAM. A unified intelligence platform that orchestrates your industrial ecosystem with modular precision.",
    heading: "Anticipate every risk. Orchestrate every turnaround.",
    tagline:
      "intelliSPEC unites AI copilots with your crews so reliability, integrity, and safety decisions land before the alarms, delivering accuracy, efficiency, and compliance you can defend.",
  },
  valuePropositions: [
    {
      title: "Predictive Reliability",
      description:
        "Know what fails next. intelliSPEC insights trigger proactive, auditable maintenance before production feels it.",
    },
    {
      title: "Crew-Ready AI",
      description:
        "Your crews launch with prioritized work packs, digital procedures, and approvals aligned to site constraints.",
    },
    {
      title: "Audit-Proof Confidence",
      description:
        "Every inspection, signature, and mitigation is captured with immutable traceability.",
    },
  ],
  statHighlights: [
    {
      value: "Uptime Unlocked",
      label: "Up to 30% fewer unplanned outages across high-criticality assets",
    },
    {
      value: "AI At Work",
      label: "Thousands of workflows orchestrated by copilots every week",
    },
    {
      value: "Compliance On Demand",
      label: "Executive-ready evidence packs generated in minutes, not days",
    },
  ],
  securityAssurance:
    "SOC 2 Type II • ISO 27001 • AES-256 encryption in transit & at rest",
  theme: {
    mode: "modern",
    layout: "split",
    animations: true,
  },
};

export default LoginShell;

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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { getApiFullUrl } from '../../config/api.config';
import { sanitizeHtml } from '../../utils/sanitizeData';
import { LoginLogo } from '../ui/atoms/ThemeLogo';

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
  type: 'text' | 'email' | 'password' | 'tel';
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
  type: 'submit' | 'button' | 'link';
  label: string;
  variant: 'primary' | 'secondary' | 'text' | 'link';
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
  mode: 'professional' | 'modern' | 'minimal';
  layout: 'centered' | 'split' | 'sidebar';
  animations?: boolean;
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
  branding: z.object({
    logo: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    companyName: z.string().optional(),
    backgroundImage: z.string().optional()
  }).optional(),
  fields: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(['text', 'email', 'password', 'tel']),
    label: z.string().min(1),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    validation: z.object({
      required: z.boolean().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      message: z.string().optional()
    }).optional(),
    autoComplete: z.string().optional(),
    disabled: z.boolean().optional()
  })).min(1),
  actions: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(['submit', 'button', 'link']),
    label: z.string().min(1),
    variant: z.enum(['primary', 'secondary', 'text', 'link']),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional()
  })).min(1),
  features: z.object({
    tenantDiscovery: z.boolean().optional(),
    rememberMe: z.boolean().optional(),
    socialLogin: z.boolean().optional(),
    multiFactorAuth: z.boolean().optional(),
    autoComplete: z.boolean().optional()
  }).optional(),
  theme: z.object({
    mode: z.enum(['professional', 'modern', 'minimal']),
    layout: z.enum(['centered', 'split', 'sidebar']),
    animations: z.boolean().optional()
  }).optional(),
  apiEndpoint: z.string().optional(),
  redirectUrl: z.string().optional(),
  errorMessages: z.record(z.string()).optional()
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validate metadata against schema
 */
const validateMetadata = (metadata: LoginMetadata): { isValid: boolean; errors?: string[] } => {
  try {
    LoginMetadataSchema.parse(metadata);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid metadata format'] };
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
    return validation.message || `${field.label} must be at least ${validation.minLength} characters`;
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    return validation.message || `${field.label} must not exceed ${validation.maxLength} characters`;
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
const generateBrandingStyles = (branding?: LoginBranding): React.CSSProperties => {
  if (!branding) return {};
  
  return {
    '--login-primary-color': branding.primaryColor || 'hsl(var(--primary))',
    '--login-secondary-color': branding.secondaryColor || 'hsl(var(--secondary))',
    '--login-background-image': branding.backgroundImage ? `url(${branding.backgroundImage})` : 'none',
  } as React.CSSProperties;
};

// ==================== MAIN COMPONENT ====================

/**
 * LoginShell - Main component for metadata-driven authentication
 */
export const LoginShell: React.FC<LoginShellProps> = React.memo(({
  metadata,
  onAuthenticated,
  onError,
  className = '',
  loading: externalLoading = false
}) => {
  // ==================== STATE MANAGEMENT ====================
  
  const [formData, setFormData] = useState<LoginFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tenantDiscovered, setTenantDiscovered] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Array<{slug: string, name: string}>>([]);
  const [isDiscoveringTenant, setIsDiscoveringTenant] = useState(false);
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  
  // Refs for accessibility and focus management
  const formRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  
  // ==================== VALIDATION & MEMOIZATION ====================
  
  const validationResult = useMemo(() => validateMetadata(metadata), [metadata]);
  
  const brandingStyles = useMemo(() => generateBrandingStyles(metadata.branding), [metadata.branding]);
  
  const theme = useMemo(() => ({
    mode: metadata.theme?.mode || 'professional',
    layout: metadata.theme?.layout || 'centered',
    animations: metadata.theme?.animations !== false
  }), [metadata.theme]);
  
  const companyName = metadata.branding?.companyName || 'intelliSPEC';
  
  const heroContent = useMemo(() => ({
    headline: 'Industrial Intelligence Platform',
    title: 'IntelliSpec Symmetry Suite',
    tagline: 'Modular. Scalable. Enterprise-ready. Future-proof.',
    description: metadata.description || 'Command inspections, integrity, and turnarounds from one harmonious control plane.',
    sellingPoints: [
      {
        id: 'orchestrate',
        title: 'Orchestrate Enterprise Ops',
        detail: 'Synchronize field, engineering, and safety teams across every site with live AI copilots.'
      },
      {
        id: 'velocity',
        title: 'Deploy in 4–6 Weeks',
        detail: 'Modular launch playbooks proven across Fortune 500 operators.'
      }
    ],
    stats: [
      { id: 'efficiency', value: '35%', label: 'Efficiency lift' },
      { id: 'deployments', value: '50+', label: 'Enterprise rollouts' }
    ],
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Explore Platform'
  }), [metadata.description]);
  
  // ==================== TENANT DISCOVERY ====================
  
  /**
   * Get remembered tenant from localStorage for this email
   */
  const getRememberedTenant = useCallback((email: string): string | null => {
    try {
      const key = `intellispec_tenant_${email}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
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
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);
  
  /**
   * Discover tenant(s) by email domain
   */
  const discoverTenantByEmail = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    // First check localStorage
    const remembered = getRememberedTenant(email);
    if (remembered) {
      setTenantDiscovered(remembered);
      setShowTenantSelector(false);
      return;
    }
    
    setIsDiscoveringTenant(true);
    
    try {
      const domain = email.split('@')[1];
      const response = await fetch(getApiFullUrl(`/api/tenants/discover?email=${encodeURIComponent(email)}&domain=${encodeURIComponent(domain)}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Tenant discovery failed');
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
        setSubmitError('No organization found for this email address. Please contact your administrator.');
        setShowTenantSelector(false);
      }
    } catch (error) {
      console.error('Tenant discovery error:', error);
      // Don't show error, just proceed without discovery
      setShowTenantSelector(false);
    } finally {
      setIsDiscoveringTenant(false);
    }
  }, [getRememberedTenant, rememberTenant]);
  
  /**
   * Handle tenant selection from dropdown
   */
  const handleTenantSelect = useCallback((tenantSlug: string) => {
    setTenantDiscovered(tenantSlug);
    setShowTenantSelector(false);
    
    // Remember this selection
    const email = formData['email'];
    if (email) {
      rememberTenant(email, tenantSlug);
    }
  }, [formData, rememberTenant]);
  
  /**
   * Load tenant from subdomain or query param on mount
   */
  useEffect(() => {
    const hostname = window.location.hostname;
    
    // Development: ?tenant=hf-sinclair
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const params = new URLSearchParams(window.location.search);
      const tenantParam = params.get('tenant');
      if (tenantParam) {
        setTenantDiscovered(tenantParam);
        return;
      }
    }
    
    // Production: tenant.intellispec.com
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost') {
        setTenantDiscovered(subdomain);
      }
    }
  }, []);
  
  // ==================== EVENT HANDLERS ====================
  
  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear field error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError(null);
    }
  }, [errors, submitError]);
  
  const handleFieldBlur = useCallback((field: LoginField) => {
    const value = formData[field.id] || '';
    const error = validateField(field, value);
    
    if (error) {
      setErrors(prev => ({ ...prev, [field.id]: error }));
    }
    
    // Trigger tenant discovery when email field loses focus
    if (field.id === 'email' && value && value.includes('@') && !error) {
      discoverTenantByEmail(value);
    }
  }, [formData, discoverTenantByEmail]);
  
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    metadata.fields.forEach(field => {
      const value = formData[field.id] || '';
      const error = validateField(field, value);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [metadata.fields, formData]);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || externalLoading) return;
    
    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = metadata.fields.find(field => errors[field.id]);
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
        tenantSlug: tenantDiscovered
      };
      
      // Call authentication API
      const apiEndpoint = metadata.apiEndpoint || getApiFullUrl('/api/auth/login');
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Safe parse in case of non-JSON error
      const raw = await response.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      if (!response.ok) {
        throw new Error(data?.error || data?.message || raw || 'Authentication failed');
      }

      const authData: AuthResponse = data;

      // Store token (in production, use secure storage)
      if (authData.token) {
        localStorage.setItem('authToken', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
      }

      // Redirect after login if metadata provides a redirectUrl or default to home workspace
      if (metadata.redirectUrl) {
        window.location.href = metadata.redirectUrl;
      } else {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('workspace', 'home/home');
          window.location.replace(url.toString());
        } catch {
          // Fallback to onAuthenticated callback
          onAuthenticated?.(authData.user, authData.token);
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setSubmitError(errorMessage);
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
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
    onError
  ]);
  
  // ==================== EFFECTS ====================
  
  // Focus first field on mount
  useEffect(() => {
    if (firstFieldRef.current) {
      firstFieldRef.current.focus();
    }
  }, []);
  
  // ==================== RENDER HELPERS ====================
  
  /**
   * Render form field
   */
  const renderField = useCallback((field: LoginField, index: number) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];
    const isFirstField = index === 0;
    
    return (
      <div key={field.id} className="field-group">
        <label 
          htmlFor={field.id}
          className="field-label"
        >
          {sanitizeHtml(field.label)}
          {field.required && <span className="required-indicator" aria-label="required">*</span>}
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
          className={`field-input ${error ? 'field-input--error' : ''}`}
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
  }, [formData, errors, isSubmitting, externalLoading, handleFieldChange, handleFieldBlur]);
  
  /**
   * Render action button
   */
  const primaryActions = useMemo(
    () => metadata.actions.filter(
      (action): action is LoginAction & { type: 'submit' | 'button' } => action.type !== 'link'
    ),
    [metadata.actions]
  );

  const linkActions = useMemo(
    () => metadata.actions.filter(action => action.type === 'link'),
    [metadata.actions]
  );
  
  const renderPrimaryAction = useCallback((action: LoginAction & { type: 'submit' | 'button' }) => {
    const isSubmitAction = action.type === 'submit';
    const isLoading = (isSubmitAction && isSubmitting) || action.loading || externalLoading;
    const buttonType: 'submit' | 'button' = action.type === 'submit' ? 'submit' : 'button';
    
    return (
      <button
        key={action.id}
        type={buttonType}
        className={`action-button action-button--${action.variant} ${isLoading ? 'action-button--loading' : ''}`}
        disabled={action.disabled || isLoading}
        onClick={action.type === 'button' ? action.onClick : undefined}
      >
        {isLoading && (
          <span className="loading-spinner" aria-hidden="true"></span>
        )}
        <span>{sanitizeHtml(action.label)}</span>
      </button>
    );
  }, [isSubmitting, externalLoading]);
  
  const renderLinkAction = useCallback((action: LoginAction) => (
    <button
      key={action.id}
      type="button"
      className="action-link"
      disabled={action.disabled}
      onClick={action.onClick}
    >
      {sanitizeHtml(action.label)}
    </button>
  ), []);
  
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
      <div className="login-shell__background" aria-hidden="true">
        <span className="login-shell__gradient login-shell__gradient--primary"></span>
        <span className="login-shell__gradient login-shell__gradient--secondary"></span>
        <span className="login-shell__orb login-shell__orb--one"></span>
        <span className="login-shell__orb login-shell__orb--two"></span>
        <span className="login-shell__mesh"></span>
      </div>

      <div className="login-shell__content">
        <section
          className="login-shell__panel login-shell__panel--hero"
          aria-label="Platform overview"
        >
          <div className="hero-panel">
            <div className="hero-panel__identity">
              <span className="hero-panel__badge">
                <span className="hero-panel__badge-dot" aria-hidden="true"></span>
                {sanitizeHtml('Industrial Intelligence')}
              </span>
              <h2 className="hero-panel__headline">{sanitizeHtml(heroContent.headline)}</h2>
              <h3 className="hero-panel__title">{sanitizeHtml(heroContent.title)}</h3>
              <span className="hero-panel__divider" aria-hidden="true"></span>
              <p className="hero-panel__tagline">{sanitizeHtml(heroContent.tagline)}</p>
            </div>
            <p className="hero-panel__description">{sanitizeHtml(heroContent.description)}</p>
            <div className="hero-panel__selling-points">
              {heroContent.sellingPoints.map((point) => (
                <div key={point.id} className="selling-point">
                  <span className="selling-point__title">{sanitizeHtml(point.title)}</span>
                  <span className="selling-point__detail">{sanitizeHtml(point.detail)}</span>
                </div>
              ))}
            </div>
            <div className="hero-panel__stats" role="list">
              {heroContent.stats.map((stat) => (
                <div key={stat.id} className="hero-panel__stat" role="listitem">
                  <span className="hero-panel__stat-value">{sanitizeHtml(stat.value)}</span>
                  <span className="hero-panel__stat-label">{sanitizeHtml(stat.label)}</span>
                </div>
              ))}
            </div>
            <div className="hero-panel__cta" role="group" aria-label="Platform call to action">
              <button type="button" className="cta-button cta-button--primary">
                {sanitizeHtml(heroContent.ctaPrimary)}
              </button>
              <button type="button" className="cta-button cta-button--ghost">
                {sanitizeHtml(heroContent.ctaSecondary)}
              </button>
            </div>
          </div>
        </section>

        <section
          className="login-shell__panel login-shell__panel--form"
          aria-labelledby="login-form-title"
        >
          <div className="login-shell__panel-content">
            <div className="login-shell__branding">
              <LoginLogo 
                alt={`${companyName} Logo`}
                className="branding-logo"
                height={56}
              />
              <p className="branding-tagline">
                {sanitizeHtml(`Precision workflows for ${companyName} teams.`)}
              </p>
            </div>
            
            <div className="login-shell__header">
              <h1 id="login-form-title" className="login-title">{sanitizeHtml(metadata.title)}</h1>
              {metadata.subtitle && (
                <p className="login-subtitle">{sanitizeHtml(metadata.subtitle)}</p>
              )}
              {metadata.description && (
                <p className="login-description">{sanitizeHtml(metadata.description)}</p>
              )}
            </div>
            
            <form 
              ref={formRef}
              className="login-shell__form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="form-fields">
                {metadata.fields.map((field, index) => renderField(field, index))}
              </div>
              
              {isDiscoveringTenant && (
                <div className="tenant-discovery-indicator" role="status" aria-live="polite">
                  <span className="discovery-spinner"></span>
                  <span className="discovery-text">Finding your organization...</span>
                </div>
              )}
              
              {showTenantSelector && availableTenants.length > 0 && (
                <div className="tenant-selector-container">
                  <label htmlFor="tenant-selector" className="tenant-selector-label">
                    Select Your Organization
                  </label>
                  <select
                    id="tenant-selector"
                    className="tenant-selector"
                    value={tenantDiscovered || ''}
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
                    You have access to multiple organizations. Please select one to continue.
                  </p>
                </div>
              )}
              
              {tenantDiscovered && !showTenantSelector && formData['email'] && (
                <div className="tenant-confirmed-indicator" role="status">
                  <svg className="tenant-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="tenant-name">
                    Organization: <strong>{availableTenants.find(t => t.slug === tenantDiscovered)?.name || tenantDiscovered}</strong>
                  </span>
                </div>
              )}
              
              {submitError && (
                <div className="form-error" role="alert" aria-live="polite">
                  {submitError}
                </div>
              )}
              
              <div className="form-actions">
                {primaryActions.map(renderPrimaryAction)}
              </div>
              
              {linkActions.length > 0 && (
                <div className="form-links">
                  {linkActions.map(renderLinkAction)}
                </div>
              )}
            </form>
          </div>
        </section>
      </div>
      
      {(isSubmitting || externalLoading) && (
        <div className="login-shell__overlay" aria-hidden="true">
          <div className="loading-indicator">
            <span className="loading-spinner"></span>
            <span className="loading-text">Signing in...</span>
          </div>
        </div>
      )}
    </div>
  );
});

LoginShell.displayName = 'LoginShell';

// ==================== STYLES ====================

/**
 * Professional, accessible, and responsive CSS styles
 * Following shadcn design tokens and the project's theme system
 */
export const loginShellStyles = `/* Login Shell Styles - Imported from LoginShell component */

.login-shell {
  --login-spacing-xs: 0.5rem;
  --login-spacing-sm: 1rem;
  --login-spacing-md: 1.5rem;
  --login-spacing-lg: 2rem;
  --login-spacing-xl: 3rem;
  --login-border-radius: 1.25rem;
  --login-border-radius-sm: 0.85rem;
  --login-border-width: 1px;
  --login-font-size-xs: 0.75rem;
  --login-font-size-sm: 0.875rem;
  --login-font-size-base: 1rem;
  --login-font-size-lg: 1.125rem;
  --login-font-size-xl: 1.35rem;
  --login-font-size-2xl: 1.75rem;
  --login-font-size-3xl: 2.3rem;
  --login-transition: all 0.25s ease;
  --login-shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.06);
  --login-shadow-md: 0 12px 30px -18px rgb(15 23 42 / 0.28);
  --login-shadow-lg: 0 32px 60px -35px hsl(var(--primary) / 0.45);
  --login-padding-block: clamp(1rem, 3vh, 2rem);
  --login-padding-inline: clamp(1.5rem, 4vw, 3rem);
  
  height: 100dvh;
  min-height: 100dvh;
  padding-block: var(--login-padding-block);
  padding-inline: var(--login-padding-inline);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 8% -10%, hsl(var(--primary) / 0.18) 0%, transparent 45%),
    radial-gradient(circle at 85% 0%, hsl(var(--secondary) / 0.16) 0%, transparent 42%),
    hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
}

.login-shell__background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.login-shell__gradient {
  position: absolute;
  border-radius: 999px;
  filter: blur(130px);
  opacity: 0.65;
}

.login-shell__gradient--primary {
  width: 40vw;
  height: 40vw;
  top: -18%;
  right: -12%;
  background: linear-gradient(135deg, hsl(var(--primary) / 0.55), hsl(var(--accent) / 0.3));
  animation: floatOrb 18s ease-in-out infinite;
}

.login-shell__gradient--secondary {
  width: 50vw;
  height: 50vw;
  bottom: -25%;
  left: -18%;
  background: linear-gradient(150deg, hsl(var(--secondary) / 0.5), hsl(var(--muted) / 0.35));
  animation: floatOrb 22s ease-in-out infinite reverse;
}

.login-shell__orb {
  position: absolute;
  width: clamp(160px, 16vw, 220px);
  height: clamp(160px, 16vw, 220px);
  border-radius: 50%;
  background: linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--secondary) / 0.3));
  opacity: 0.35;
  filter: blur(40px);
}

.login-shell__orb--one {
  top: 22%;
  left: 12%;
}

.login-shell__orb--two {
  bottom: 18%;
  right: 16%;
}

.login-shell__mesh {
  position: absolute;
  inset: 0;
  background-size: 22px 22px;
  background-image: linear-gradient(to right, hsl(var(--border) / 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--border) / 0.08) 1px, transparent 1px);
  opacity: 0.32;
  mask-image: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.75), transparent 70%);
}

.login-shell__content {
  position: relative;
  z-index: 1;
  width: min(1100px, 100%);
  height: calc(100% - (var(--login-padding-block) * 2));
  display: flex;
  align-items: stretch;
  gap: clamp(1.5rem, 4vw, 3rem);
}

.login-shell__panel {
  border-radius: var(--login-border-radius);
  display: flex;
}

.login-shell__panel--hero {
  display: flex;
  align-items: flex-start;
  flex: 1 1 0%;
  background: linear-gradient(160deg, hsl(var(--card) / 0.45), hsl(var(--background) / 0.2));
  border: var(--login-border-width) solid hsl(var(--border) / 0.35);
  box-shadow: var(--login-shadow-lg);
  backdrop-filter: blur(18px);
  padding: clamp(1.8rem, 3.5vw, 2.6rem);
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 100%;
  position: relative;
  isolation: isolate;
  animation: heroFadeIn 0.9s ease 0.1s both;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border) / 0.5) transparent;
}

.login-shell__panel--hero::-webkit-scrollbar {
  width: 6px;
}

.login-shell__panel--hero::-webkit-scrollbar-track {
  background: transparent;
}

.login-shell__panel--hero::-webkit-scrollbar-thumb {
  background: hsl(var(--border) / 0.5);
  border-radius: 999px;
}

.login-shell__panel--hero::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--border) / 0.7);
}

.hero-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: clamp(1.1rem, 2.2vw, 1.6rem);
  max-width: 28rem;
  position: relative;
  padding-block: clamp(0.5rem, 2vw, 1rem);
  width: 100%;
}

.hero-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.12), transparent 60%);
  opacity: 0.7;
  z-index: -1;
  pointer-events: none;
}

.hero-panel__identity {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.hero-panel__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  font-size: var(--login-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: hsl(var(--primary-foreground));
  background: linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary)));
  box-shadow: 0 10px 22px -18px hsl(var(--primary));
}

.hero-panel__badge-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: hsl(var(--accent));
  box-shadow: 0 0 0 6px hsl(var(--accent) / 0.25);
}

.hero-panel__headline {
  margin: 0;
  font-size: clamp(2.1rem, 4vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: hsl(var(--foreground));
}

.hero-panel__title {
  margin: 0;
  font-size: clamp(1.3rem, 2.5vw, 1.6rem);
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-panel__divider {
  width: 120px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)));
  margin-top: 0.5rem;
}

.hero-panel__tagline {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

.hero-panel__description {
  margin: 0;
  font-size: 0.95rem;
  color: hsl(var(--foreground));
  line-height: 1.6;
}

.hero-panel__selling-points {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.selling-point {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.85rem 1rem;
  border-radius: var(--login-border-radius-sm);
  border: 1px solid hsl(var(--border) / 0.35);
  background: hsl(var(--card) / 0.2);
  box-shadow: inset 0 0 0 1px hsl(var(--border) / 0.15);
}

.selling-point__title {
  font-size: 0.92rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.selling-point__detail {
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
}

.hero-panel__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.hero-panel__stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 1rem;
  border-radius: var(--login-border-radius-sm);
  border: 1px solid hsl(var(--border) / 0.35);
  background: hsl(var(--card) / 0.2);
  min-width: 140px;
  box-shadow: inset 0 0 0 1px hsl(var(--border) / 0.2);
}

.hero-panel__stat-value {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: hsl(var(--primary));
  letter-spacing: -0.02em;
  background: linear-gradient(120deg, hsl(var(--primary)), hsl(var(--accent)));
  -webkit-background-clip: text;
  color: transparent;
}

.hero-panel__stat-label {
  font-size: 0.78rem;
  color: hsl(var(--muted-foreground));
}

.hero-panel__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.85rem 1.4rem;
  border-radius: var(--login-border-radius-sm);
  border: 1px solid transparent;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--login-transition);
  color: hsl(var(--primary-foreground));
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85));
  box-shadow: 0 18px 30px -18px hsl(var(--primary)), 0 10px 24px -22px hsl(var(--accent));
}

.cta-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 24px 38px -18px hsl(var(--primary) / 0.9);
}

.cta-button--ghost {
  background: transparent;
  color: hsl(var(--primary));
  border-color: hsl(var(--primary) / 0.35);
  box-shadow: none;
}

.cta-button--ghost:hover {
  border-color: hsl(var(--primary));
  color: hsl(var(--primary) / 0.9);
}

.login-shell__panel--form {
  animation: formSlideIn 0.9s ease 0.2s both;
}

.login-shell__panel--form {
  display: flex;
  align-items: center;
  flex: 0 0 clamp(340px, 32vw, 420px);
  background: linear-gradient(160deg, hsl(var(--card) / 0.95), hsl(var(--muted) / 0.6));
  border: var(--login-border-width) solid hsl(var(--border) / 0.45);
  box-shadow: var(--login-shadow-md);
  backdrop-filter: blur(20px);
  padding: clamp(1.8rem, 3.3vw, 2.6rem);
  overflow: hidden;
  max-height: 100%;
}

.login-shell__panel-content {
  display: flex;
  flex-direction: column;
  gap: clamp(1.3rem, 3vw, 2rem);
  width: 100%;
  position: relative;
  padding-block: clamp(1rem, 3vw, 1.75rem);
  justify-content: center;
}

.login-shell__branding {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--login-spacing-xs);
}

.branding-logo {
  max-height: 56px;
  width: auto;
  height: auto;
  filter: drop-shadow(0 10px 24px hsl(var(--primary) / 0.22));
}

.branding-tagline {
  margin: 0;
  font-size: var(--login-font-size-sm);
  color: hsl(var(--muted-foreground));
  letter-spacing: 0.01em;
}

.login-shell__header {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.login-title {
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  margin: 0;
  font-size: var(--login-font-size-base);
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

.login-description {
  margin: 0;
  font-size: var(--login-font-size-sm);
  color: hsl(var(--muted-foreground));
  line-height: 1.55;
}

.login-shell__form {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-lg);
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-md);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-xs);
}

.field-label {
  font-size: var(--login-font-size-sm);
  font-weight: 600;
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.required-indicator {
  color: hsl(var(--destructive));
  font-weight: 700;
}

.field-input {
  width: 100%;
  padding: calc(var(--login-spacing-sm) + 2px) calc(var(--login-spacing-sm) + 6px);
  font-size: var(--login-font-size-base);
  line-height: 1.5;
  color: hsl(var(--foreground));
  background: linear-gradient(180deg, hsl(var(--background) / 0.9), hsl(var(--background) / 0.85));
  border: var(--login-border-width) solid hsl(var(--input) / 0.8);
  border-radius: var(--login-border-radius-sm);
  transition: var(--login-transition);
  outline: none;
  box-shadow: inset 0 1px 0 hsl(var(--border) / 0.35);
}

.field-input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 4px hsl(var(--ring) / 0.12);
  background: hsl(var(--background));
}

.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: hsl(var(--muted) / 0.4);
}

.field-input--error {
  border-color: hsl(var(--destructive));
  box-shadow: 0 0 0 4px hsl(var(--destructive) / 0.12);
}

.field-error {
  font-size: var(--login-font-size-sm);
  color: hsl(var(--destructive));
  margin: 0;
}

.form-error {
  padding: var(--login-spacing-sm) var(--login-spacing-md);
  background: hsl(var(--destructive) / 0.12);
  border: var(--login-border-width) solid hsl(var(--destructive) / 0.28);
  border-radius: var(--login-border-radius-sm);
  color: hsl(var(--destructive));
  font-size: var(--login-font-size-sm);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-sm);
  align-items: stretch;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--login-spacing-xs);
  padding: calc(var(--login-spacing-sm) + 2px) var(--login-spacing-lg);
  font-size: var(--login-font-size-base);
  font-weight: 600;
  line-height: 1.5;
  border: var(--login-border-width) solid transparent;
  border-radius: var(--login-border-radius-sm);
  cursor: pointer;
  transition: var(--login-transition);
  text-decoration: none;
  outline: none;
  min-height: 48px;
  position: relative;
}

.action-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px hsl(var(--ring) / 0.25);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button--primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.82));
  color: hsl(var(--primary-foreground));
  box-shadow: 0 18px 32px -20px hsl(var(--primary)), 0 10px 24px -26px hsl(var(--accent));
}

.action-button--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 24px 36px -18px hsl(var(--primary) / 0.9);
}

.action-button--secondary {
  background: linear-gradient(135deg, hsl(var(--secondary) / 0.95), hsl(var(--muted) / 0.7));
  color: hsl(var(--secondary-foreground));
  border-color: hsl(var(--secondary) / 0.4);
}

.action-button--secondary:hover:not(:disabled) {
  border-color: hsl(var(--secondary));
}

.action-button--text,
.action-button--link {
  background: transparent;
  color: hsl(var(--primary));
  border-color: transparent;
  padding-left: 0;
  padding-right: 0;
  font-weight: 500;
}

.action-button--link {
  text-decoration: underline;
  text-underline-offset: 0.35rem;
}

.form-links {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.25rem;
}

.action-link {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: hsl(var(--primary));
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  position: relative;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
}

.action-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}

.action-link:hover,
.action-link:focus-visible {
  color: hsl(var(--primary) / 0.85);
}

.action-link:hover::after,
.action-link:focus-visible::after {
  transform: scaleX(1);
}

.action-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button--loading {
  color: transparent;
}

.loading-spinner {
  width: 1.05rem;
  height: 1.05rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.login-shell__overlay {
  position: absolute;
  inset: 0;
  background: hsl(var(--background) / 0.82);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--login-spacing-sm);
  padding: var(--login-spacing-lg);
  background: hsl(var(--card));
  border-radius: var(--login-border-radius);
  box-shadow: var(--login-shadow-sm);
  border: 1px solid hsl(var(--border) / 0.3);
}

.loading-text {
  font-size: var(--login-font-size-sm);
  color: hsl(var(--muted-foreground));
}

.tenant-discovery-indicator {
  display: flex;
  align-items: center;
  gap: var(--login-spacing-sm);
  padding: var(--login-spacing-sm) var(--login-spacing-md);
  background: hsl(var(--primary) / 0.08);
  border: 1px dashed hsl(var(--primary) / 0.4);
  border-radius: var(--login-border-radius-sm);
  color: hsl(var(--primary));
  font-size: var(--login-font-size-sm);
}

.discovery-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--primary) / 0.25);
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.tenant-selector-container {
  display: flex;
  flex-direction: column;
  gap: var(--login-spacing-xs);
  margin-top: var(--login-spacing-md);
  padding: var(--login-spacing-md);
  background: hsl(var(--muted) / 0.45);
  border: 1px solid hsl(var(--border) / 0.45);
  border-radius: var(--login-border-radius-sm);
}

.tenant-selector-label {
  font-size: var(--login-font-size-sm);
  font-weight: 600;
  color: hsl(var(--foreground));
}

.tenant-selector {
  width: 100%;
  padding: var(--login-spacing-sm) var(--login-spacing-md);
  font-size: 1rem;
  font-family: inherit;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  border: 1px solid hsl(var(--input));
  border-radius: var(--login-border-radius-sm);
  transition: var(--login-transition);
  cursor: pointer;
}

.tenant-selector:hover {
  border-color: hsl(var(--ring));
}

.tenant-selector:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 4px hsl(var(--ring) / 0.15);
}

.tenant-selector-hint {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
}

.tenant-confirmed-indicator {
  display: flex;
  align-items: center;
  gap: var(--login-spacing-sm);
  padding: var(--login-spacing-sm) var(--login-spacing-md);
  margin-top: var(--login-spacing-md);
  background: hsl(var(--success) / 0.12);
  border: 1px solid hsl(var(--success) / 0.35);
  border-radius: var(--login-border-radius-sm);
  font-size: var(--login-font-size-sm);
  color: hsl(var(--success));
}

.tenant-icon {
  width: 1.3rem;
  height: 1.3rem;
}

.tenant-name {
  color: hsl(var(--foreground));
}

.tenant-name strong {
  font-weight: 600;
  color: hsl(var(--primary));
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes heroFadeIn {
  0% {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
  60% {
    opacity: 1;
    transform: translateY(0) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes formSlideIn {
  0% {
    opacity: 0;
    transform: translateX(32px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes floatOrb {
  0%, 100% {
    transform: translate3d(0, -10px, 0) scale(1);
  }
  50% {
    transform: translate3d(0, 12px, 0) scale(1.02);
  }
}

@media (max-width: 1024px) {
  .login-shell__content {
    gap: clamp(1.25rem, 4vw, 2rem);
  }

  .login-shell__panel--form {
    flex-basis: clamp(320px, 36vw, 380px);
  }

  .hero-panel {
    max-width: 28rem;
  }
}

@media (max-width: 900px) {
  .login-shell {
    min-height: auto;
    height: auto;
    padding-inline: clamp(1rem, 6vw, 1.75rem);
  }

  .login-shell__content {
    flex-direction: column;
    height: auto;
  }

  .login-shell__panel--form,
  .login-shell__panel--hero {
    order: initial;
    flex-basis: auto;
    width: min(460px, 100%);
    margin: 0 auto;
    max-height: none;
    overflow: visible;
  }

  .login-shell__panel--hero {
    padding: clamp(1.6rem, 5vw, 2rem);
  }

  .hero-panel,
  .login-shell__panel-content {
    max-height: none;
    height: auto;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 540px) {
  .login-shell {
    padding: clamp(0.75rem, 5vh, 1.5rem) clamp(0.85rem, 6vw, 1.25rem);
  }

  .login-shell__panel--form {
    padding: 1.6rem;
    border-radius: 1rem;
  }

  .login-title {
    font-size: 1.85rem;
  }

  .hero-panel__stats {
    gap: 0.65rem;
  }

  .hero-panel__stat {
    flex: 1 1 calc(50% - 0.65rem);
    min-width: 0;
  }

  .form-links {
    justify-content: center;
  }
}

@media (prefers-contrast: high) {
  .field-input,
  .action-button,
  .cta-button {
    border-width: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-shell *,
  .login-shell *::before,
  .login-shell *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .login-shell__gradient--primary,
  .login-shell__gradient--secondary {
    animation: none;
  }
}

@media (prefers-color-scheme: dark) {
  .login-shell {
    color-scheme: dark;
  }
}
`

// ==================== DEFAULT METADATA ====================

/**
 * Default login metadata for fallback and demo purposes
 */
export const defaultLoginMetadata: LoginMetadata = {
  title: "Sign In",
  subtitle: "Enter your credentials to access your account.",
  branding: {
    companyName: "intelliSPEC",
    primaryColor: "hsl(221.2 83.2% 53.3%)", // Blue
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
        message: "Please enter a valid email address"
      }
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
        message: "Password must be at least 8 characters"
      }
    }
  ],
  actions: [
    {
      id: "login",
      type: "submit",
      label: "Sign In",
      variant: "primary"
    },
    {
      id: "forgot-password",
      type: "link",
      label: "Forgot Password?",
      variant: "text"
    }
  ],
  features: {
    tenantDiscovery: true,
    rememberMe: false,
    socialLogin: false,
    autoComplete: true
  },
  theme: {
    mode: "professional",
    layout: "centered",
    animations: true
  }
};

export default LoginShell;

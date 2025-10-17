/**
 * Simple Validation Badge Component
 * 
 * Lightweight validation indicator using standard UI components.
 */

import React from 'react';
import { Badge, Tooltip, Alert } from 'antd';
import { UseWorkspaceValidationResult } from '../../../hooks/useWorkspaceValidation';

interface ValidationBadgeProps {
  validation: UseWorkspaceValidationResult;
  showDetails?: boolean;
  size?: 'small' | 'default';
}

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({
  validation,
  showDetails = false,
  size = 'default'
}) => {
  const { isValid, hasErrors, hasWarnings, errorCount, warningCount, validationResult } = validation;

  // Don't show anything if no validation has been performed
  if (!validationResult) {
    return null;
  }

  // Don't show in production unless there are errors
  if (process.env.NODE_ENV === 'production' && isValid) {
    return null;
  }

  const getStatus = () => {
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  };

  const getText = () => {
    if (hasErrors) return `${errorCount} error${errorCount !== 1 ? 's' : ''}`;
    if (hasWarnings) return `${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
    return 'Valid';
  };

  const getTooltipContent = () => {
    if (!showDetails || (!hasErrors && !hasWarnings)) {
      return getText();
    }

    const content = [];
    
    if (hasErrors) {
      content.push(`Errors: ${errorCount}`);
      validationResult.errors.slice(0, 3).forEach(error => {
        content.push(`• ${error.path.join('.')}: ${error.message}`);
      });
      if (errorCount > 3) {
        content.push(`... and ${errorCount - 3} more`);
      }
    }

    if (hasWarnings) {
      if (content.length > 0) content.push('');
      content.push(`Warnings: ${warningCount}`);
      validationResult.warnings.slice(0, 2).forEach(warning => {
        content.push(`• ${warning.path.join('.')}: ${warning.message}`);
      });
      if (warningCount > 2) {
        content.push(`... and ${warningCount - 2} more`);
      }
    }

    return content.join('\n');
  };

  const badge = (
    <Badge
      status={getStatus()}
      text={getText()}
      size={size}
      style={{ cursor: showDetails ? 'help' : 'default' }}
    />
  );

  if (showDetails) {
    return (
      <Tooltip 
        title={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{getTooltipContent()}</pre>}
        placement="topLeft"
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

/**
 * Validation Alert for detailed error display
 */
interface ValidationAlertProps {
  validation: UseWorkspaceValidationResult;
  maxErrors?: number;
  maxWarnings?: number;
}

export const ValidationAlert: React.FC<ValidationAlertProps> = ({
  validation,
  maxErrors = 5,
  maxWarnings = 3
}) => {
  const { isValid, hasErrors, hasWarnings, validationResult } = validation;

  if (!validationResult || (isValid && !hasWarnings)) {
    return null;
  }

  // Don't show in production unless there are errors
  if (process.env.NODE_ENV === 'production' && !hasErrors) {
    return null;
  }

  const getAlertType = () => {
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  };

  const getMessage = () => {
    if (hasErrors && hasWarnings) {
      return `Configuration has ${validation.errorCount} error(s) and ${validation.warningCount} warning(s)`;
    }
    if (hasErrors) {
      return `Configuration has ${validation.errorCount} error(s)`;
    }
    if (hasWarnings) {
      return `Configuration has ${validation.warningCount} warning(s)`;
    }
    return 'Configuration is valid';
  };

  const getDescription = () => {
    const items = [];

    // Add errors
    if (hasErrors) {
      const errorsToShow = validationResult.errors.slice(0, maxErrors);
      errorsToShow.forEach(error => {
        items.push(
          <div key={`error-${error.path.join('.')}`} style={{ marginBottom: 4 }}>
            <strong>{error.path.join('.') || 'Root'}:</strong> {error.message}
            {error.suggestion && (
              <div style={{ fontSize: '0.9em', color: '#666', marginTop: 2 }}>
                💡 {error.suggestion}
              </div>
            )}
          </div>
        );
      });

      if (validationResult.errors.length > maxErrors) {
        items.push(
          <div key="more-errors" style={{ fontStyle: 'italic', color: '#666' }}>
            ... and {validationResult.errors.length - maxErrors} more error(s)
          </div>
        );
      }
    }

    // Add warnings
    if (hasWarnings) {
      if (items.length > 0) {
        items.push(<div key="divider" style={{ margin: '8px 0', borderTop: '1px solid #d9d9d9' }} />);
      }

      const warningsToShow = validationResult.warnings.slice(0, maxWarnings);
      warningsToShow.forEach(warning => {
        items.push(
          <div key={`warning-${warning.path.join('.')}`} style={{ marginBottom: 4 }}>
            <strong>{warning.path.join('.') || 'Root'}:</strong> {warning.message}
            {warning.suggestion && (
              <div style={{ fontSize: '0.9em', color: '#666', marginTop: 2 }}>
                💡 {warning.suggestion}
              </div>
            )}
          </div>
        );
      });

      if (validationResult.warnings.length > maxWarnings) {
        items.push(
          <div key="more-warnings" style={{ fontStyle: 'italic', color: '#666' }}>
            ... and {validationResult.warnings.length - maxWarnings} more warning(s)
          </div>
        );
      }
    }

    return <div>{items}</div>;
  };

  return (
    <Alert
      message={getMessage()}
      description={getDescription()}
      type={getAlertType()}
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};

export default ValidationBadge;

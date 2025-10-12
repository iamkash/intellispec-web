/**
 * API Configuration Diagnostics Component
 * 
 * Runs on app startup to validate API configuration and detect common issues.
 * Only shows UI in development mode. In production, logs to console only.
 */

import React, { useEffect, useState } from 'react';
import { apiConfig } from '../../config/api.config';

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export const ApiConfigDiagnostics: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: DiagnosticResult[] = [];

    // Check 1: Validate base URL
    const baseUrl = apiConfig.getBaseUrl();
    if (baseUrl.includes('4001')) {
      results.push({
        status: 'error',
        message: 'API base URL is configured to use port 4001, but the server runs on port 4000',
        details: { baseUrl, expectedPort: 4000, actualPort: 4001 }
      });
    } else if (baseUrl.includes('4000')) {
      results.push({
        status: 'success',
        message: 'API base URL is correctly configured to use port 4000',
        details: { baseUrl }
      });
    } else {
      results.push({
        status: 'warning',
        message: 'API base URL does not specify a port (may be using reverse proxy)',
        details: { baseUrl }
      });
    }

    // Check 2: Test API connection
    try {
      const isReachable = await apiConfig.testConnection();
      if (isReachable) {
        results.push({
          status: 'success',
          message: 'API server is reachable and responding',
          details: { endpoint: `${baseUrl}/api/health` }
        });
      } else {
        results.push({
          status: 'error',
          message: 'API server is not reachable. Check if the server is running.',
          details: { endpoint: `${baseUrl}/api/health` }
        });
      }
    } catch (error) {
      results.push({
        status: 'error',
        message: 'Failed to test API connection',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Check 3: Validate environment variables
    const hasEnvConfig = !!process.env.REACT_APP_API_BASE || !!process.env.REACT_APP_API_URL;
    if (hasEnvConfig) {
      results.push({
        status: 'success',
        message: 'API configuration loaded from environment variables',
        details: {
          REACT_APP_API_BASE: process.env.REACT_APP_API_BASE || 'not set',
          REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'not set'
        }
      });
    } else {
      results.push({
        status: 'warning',
        message: 'No environment variables found. Using auto-detected configuration.',
        details: { recommendation: 'Set REACT_APP_API_BASE in .env for explicit control' }
      });
    }

    setDiagnostics(results);

    // Show modal if there are errors (development only)
    if (process.env.NODE_ENV === 'development') {
      const hasErrors = results.some(r => r.status === 'error');
      if (hasErrors) {
        setShowModal(true);
      }
    }

    // Always log to console
    console.group('[API Config Diagnostics]');
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.message}`, result.details);
    });
    console.groupEnd();
  };

  // In production, don't show UI
  if (process.env.NODE_ENV !== 'development' || !showModal) {
    return <>{children}</>;
  }

  // Development modal
  return (
    <>
      {children}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#d32f2f' }}>
              ⚠️ API Configuration Issues Detected
            </h2>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              The following issues were found with your API configuration:
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {diagnostics.map((result, idx) => (
                <li key={idx} style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  backgroundColor: 
                    result.status === 'error' ? '#ffebee' :
                    result.status === 'warning' ? '#fff3e0' : '#e8f5e9',
                  border: `1px solid ${
                    result.status === 'error' ? '#ef5350' :
                    result.status === 'warning' ? '#ff9800' : '#66bb6a'
                  }`
                }}>
                  <strong>
                    {result.status === 'error' ? '❌' : result.status === 'warning' ? '⚠️' : '✅'}
                    {' '}{result.message}
                  </strong>
                  {result.details && (
                    <pre style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <strong>How to fix:</strong>
              <ol style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px' }}>
                <li>Ensure your API server is running on port 4000</li>
                <li>Check your <code>.env</code> file for REACT_APP_API_BASE</li>
                <li>Restart your dev server after making changes</li>
                <li>Clear browser cache and localStorage</li>
              </ol>
            </div>
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Continue Anyway
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                marginLeft: '8px',
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiConfigDiagnostics;





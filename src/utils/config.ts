/**
 * Configuration Utility
 * 
 * Centralized configuration management for API keys, endpoints, and settings.
 * Supports environment variables and fallback configurations.
 */

export interface AppConfig {
  openai: {
    apiKey: string;
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
  };
}

// Get configuration from environment variables with fallbacks
const getConfig = (): AppConfig => {
  return {
    openai: {
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
      baseUrl: process.env.REACT_APP_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      timeout: parseInt(process.env.REACT_APP_OPENAI_TIMEOUT || '30000'),
      retries: parseInt(process.env.REACT_APP_OPENAI_RETRIES || '3'),
    },
    app: {
      name: process.env.REACT_APP_NAME || 'IntelliSPEC',
      version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    },
  };
};

// Export the configuration
export const config = getConfig();

// OpenAI Configuration
export const getOpenAIConfig = () => {
  return {
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
    baseUrl: process.env.REACT_APP_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    timeout: 30000,
    retries: 3
  };
};

// Validation function
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.openai.apiKey) {
    errors.push('OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY environment variable.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Development helper - only show in development mode
export const getDevConfig = () => {
  if (config.app.environment === 'development') {
    return {
      showApiKey: config.openai.apiKey ? `${config.openai.apiKey.substring(0, 8)}...` : 'Not set',
      baseUrl: config.openai.baseUrl,
    };
  }
  return null;
}; 
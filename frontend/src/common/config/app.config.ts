// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

/**
 * Central configuration object for the application
 * All environment variables and app settings are defined here
 */
export const Config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  REQUEST_TIMEOUT: 30000, // 30 seconds

  // Token Configuration
  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY || 'auth_token',
  REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token',

  // App Information
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Invoice OCR Platform',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',

  // Feature Flags
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true' || import.meta.env.DEV,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',

  // Environment
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
} as const;

export default Config;


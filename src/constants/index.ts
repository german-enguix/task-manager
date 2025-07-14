// App constants
export const APP_NAME = 'Tasks Concept';
export const APP_VERSION = '1.0.0';

// API
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
  timeout: 10000,
} as const;

// Theme configuration - Material Design 3
export { lightTheme, darkTheme } from './theme';

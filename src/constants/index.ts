// App constants
export const APP_NAME = 'Tasks Concept';
export const APP_VERSION = '1.0.0';

// Colors (mantener para compatibilidad)
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  card: '#FFFFFF',
  border: '#C6C6C8',
  text: '#000000',
  textSecondary: '#8E8E93',
} as const;

// Sizes
export const SIZES = {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
} as const;

// API
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
  timeout: 10000,
} as const;

// Theme configuration
export { lightTheme, darkTheme } from './theme';

// Sistema de espaciado estandarizado (8dp Grid)
export const SPACING = {
  xs: 4,    // 4dp - micro espacios
  sm: 8,    // 8dp - pequeño
  md: 16,   // 16dp - medio (base)
  lg: 24,   // 24dp - grande
  xl: 32,   // 32dp - extra grande
  xxl: 40,  // 40dp - secciones principales
} as const;

// Breakpoints para diferentes tamaños de pantalla
export const BREAKPOINTS = {
  small: 320,   // Teléfonos pequeños
  medium: 375,  // Teléfonos estándar
  large: 414,   // Teléfonos grandes
  tablet: 768,  // Tablets
} as const;

// Paddings y margins estandarizados
export const LAYOUT = {
  // Containers principales
  container: {
    paddingHorizontal: SPACING.md,  // 16dp laterales
    paddingVertical: SPACING.lg,    // 24dp superior/inferior
  },
  // Cards y componentes
  card: {
    padding: SPACING.md,            // 16dp interno
    marginBottom: SPACING.md,       // 16dp entre cards
  },
  // Botones y elementos interactivos
  button: {
    marginVertical: SPACING.sm,     // 8dp vertical
    minHeight: 48,                  // Mínimo touch target
  },
  // Headers de pantalla
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    elevation: 4,
  },
  // Contenido de scroll
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
} as const;

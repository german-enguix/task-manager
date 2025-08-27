// Utility functions
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatDate = (date: Date): string => {
  // Forzar salida sin año: "27 de agosto"
  const day = date.getDate();
  const month = date.toLocaleString('es-ES', { month: 'long' });
  return `${day} de ${month}`;
};

export const formatDayShort = (date: Date): string => {
  // Ej.: "Mié" (3 primeras) con primera letra en mayúscula
  const full = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
  const trimmed = full.slice(0, 3);
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getPublicAvatarUrl = (seed: string): string => {
  const safe = encodeURIComponent(seed || 'User');
  return `https://api.dicebear.com/8.x/adventurer/png?size=96&seed=${safe}`;
};

// Logger export
export { logger } from './logger';

// Mock data exports
export { 
  mockTasks, 
  getTaskById, 
  getAllTasks, 
  updateTask, 
  completeRequiredEvidence,
  getAllNotifications,
  getUnreadNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addNotification
} from './mockData';

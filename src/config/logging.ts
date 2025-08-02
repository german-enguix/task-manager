import { logger } from '@/utils/logger';

// ============================================
// CONFIGURACIÓN DE LOGS
// ============================================
// 
// Para desactivar TODOS los logs de desarrollo,
// descomenta la siguiente línea:
//
// logger.setEnabled(false);

// Para desactivar logs específicos por categoría,
// descomenta las líneas que necesites:
//
// logger.setAuthLogs(false);        // Logs de autenticación
// logger.setDatabaseLogs(false);    // Logs de base de datos
// logger.setNavigationLogs(false);  // Logs de navegación
// logger.setNotificationLogs(false); // Logs de notificaciones
// logger.setTimerLogs(false);       // Logs de timers/timesheet

// ============================================
// CONFIGURACIÓN RÁPIDA
// ============================================

// ⚡ DESACTIVAR TODOS LOS LOGS (descomenta la siguiente línea)
logger.setEnabled(false);

// ⚡ ACTIVAR SOLO ERRORES (descomenta las siguientes líneas)
// logger.setEnabled(false);
// Los métodos error(), warning(), info(), success() siempre funcionan

// ⚡ CONFIGURACIÓN PERSONALIZADA
// logger.configure({
//   enabled: true,
//   enableAuth: false,
//   enableDatabase: false, 
//   enableNavigation: false,
//   enableNotifications: false,
//   enableTimers: false
// });

export { logger }; 
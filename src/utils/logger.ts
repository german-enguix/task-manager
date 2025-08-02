interface LoggerConfig {
  enabled: boolean;
  enableAuth: boolean;
  enableDatabase: boolean;
  enableNavigation: boolean;
  enableNotifications: boolean;
  enableTimers: boolean;
}

class Logger {
  private config: LoggerConfig = {
    enabled: true, // Cambiar a false para desactivar todos los logs
    enableAuth: true,
    enableDatabase: true,
    enableNavigation: true,
    enableNotifications: true,
    enableTimers: true,
  };

  // Configurar el logger
  configure(newConfig: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Métodos de logging por categoría
  auth(message: string, ...args: any[]) {
    if (this.config.enabled && this.config.enableAuth) {
      console.log(`🔐 ${message}`, ...args);
    }
  }

  database(message: string, ...args: any[]) {
    if (this.config.enabled && this.config.enableDatabase) {
      console.log(`💾 ${message}`, ...args);
    }
  }

  navigation(message: string, ...args: any[]) {
    if (this.config.enabled && this.config.enableNavigation) {
      console.log(`🧭 ${message}`, ...args);
    }
  }

  notifications(message: string, ...args: any[]) {
    if (this.config.enabled && this.config.enableNotifications) {
      console.log(`🔔 ${message}`, ...args);
    }
  }

  timers(message: string, ...args: any[]) {
    if (this.config.enabled && this.config.enableTimers) {
      console.log(`⏱️ ${message}`, ...args);
    }
  }

  // Métodos generales que siempre se muestran
  info(message: string, ...args: any[]) {
    console.log(`ℹ️ ${message}`, ...args);
  }

  success(message: string, ...args: any[]) {
    console.log(`✅ ${message}`, ...args);
  }

  warning(message: string, ...args: any[]) {
    console.warn(`⚠️ ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args);
  }

  // Método para obtener la configuración actual
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Método para activar/desactivar todos los logs
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
  }

  // Métodos específicos para activar/desactivar categorías
  setAuthLogs(enabled: boolean) {
    this.config.enableAuth = enabled;
  }

  setDatabaseLogs(enabled: boolean) {
    this.config.enableDatabase = enabled;
  }

  setNavigationLogs(enabled: boolean) {
    this.config.enableNavigation = enabled;
  }

  setNotificationLogs(enabled: boolean) {
    this.config.enableNotifications = enabled;
  }

  setTimerLogs(enabled: boolean) {
    this.config.enableTimers = enabled;
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Configuración inicial - puedes cambiar esto para desactivar logs
// logger.configure({
//   enabled: false, // Descomenta para desactivar todos los logs
//   enableAuth: false, // Descomenta para desactivar solo logs de autenticación
//   enableDatabase: false, // Descomenta para desactivar solo logs de base de datos
// }); 
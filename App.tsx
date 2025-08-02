import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { HomeScreen, ProjectsScreen, ProjectDetailScreen, ProfileScreen, LoginScreen } from '@/screens';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';
import { NavBar } from '@/components';
import { lightTheme, darkTheme } from '@/constants';
import { NavigationRoute, User } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { logger } from '@/utils/logger';
import '@/config/logging'; // Configuración de logs

type Screen = 'home' | 'projects' | 'profile' | 'taskDetail' | 'projectDetail';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [simulatedNotification, setSimulatedNotification] = useState<any>(null);
  const [simulatedExternalNFC, setSimulatedExternalNFC] = useState<any>(null);
  const [simulatedExternalQR, setSimulatedExternalQR] = useState<any>(null);

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Verificar autenticación al iniciar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      logger.auth('Starting authentication check...');
      
      const authStatus = await supabaseService.checkAuthStatus();
      
      logger.auth('Auth status result:', authStatus);
      
      if (authStatus.isAuthenticated && authStatus.sessionValid && authStatus.user) {
        // Obtener perfil del usuario
        const { data: profile } = await supabaseService.supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url')
          .eq('id', authStatus.user.id)
          .single();

        const userWithProfile = {
          id: authStatus.user.id,
          email: authStatus.user.email,
          name: profile?.full_name || authStatus.user.email,
          role: profile?.role,
          avatar_url: profile?.avatar_url,
        };

        setUser(userWithProfile);
        setIsAuthenticated(true);
        logger.auth('User authenticated and profile loaded:', userWithProfile.name);
      } else {
        logger.auth('Authentication failed:', authStatus.message);
        
        // Solo intentar refrescar la sesión si hay una sesión pero está expirada
        // No intentar refresh si simplemente no hay sesión (primera vez)
        const shouldRefresh = !authStatus.sessionValid && 
                             authStatus.message.includes('expirada');
        
        if (shouldRefresh) {
          logger.auth('Session expired, attempting to refresh...');
          const refreshed = await supabaseService.refreshSession();
          
          if (refreshed) {
            logger.auth('Session refreshed, retrying...');
            // Intentar de nuevo después del refresh
            const retryAuthStatus = await supabaseService.checkAuthStatus();
            if (retryAuthStatus.isAuthenticated && retryAuthStatus.sessionValid) {
              logger.auth('Authentication successful after refresh');
              // Recursively call checkAuthStatus to set user
              await checkAuthStatus();
              return;
            }
          }
        } else {
          logger.auth('No session to refresh, user needs to login');
        }
        
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      logger.error('Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setCurrentScreen('home');
  };

  const navigateToTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentScreen('taskDetail');
  };

  const navigateToProjectDetail = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentScreen('projectDetail');
  };

  const navigateToHome = () => {
    const wasInTaskDetail = currentScreen === 'taskDetail';
    setCurrentScreen('home');
    setSelectedTaskId(null);
    setSelectedProjectId(null);
    
    // Si venimos del detalle de una tarea, activar el refresh
    if (wasInTaskDetail) {
      setTaskRefreshTrigger(prev => prev + 1);
      logger.navigation('Activando refresh de tareas desde TaskDetail');
    }
  };

  const navigateToProjects = () => {
    setCurrentScreen('projects');
    setSelectedTaskId(null);
    setSelectedProjectId(null);
  };

  const navigateToProfile = () => {
    setCurrentScreen('profile');
    setSelectedTaskId(null);
    setSelectedProjectId(null);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => performLogout()
        }
      ]
    );
  };

  // Función de logout sin confirmación (para ProfileScreen)
  const performLogout = async () => {
    try {
      logger.auth('Logging out user...');
      await supabaseService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('home');
      logger.auth('User logged out successfully');
    } catch (error) {
      logger.error('Error during logout:', error);
      // Aún así limpiar el estado local
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('home');
    }
  };

  const handleNavigation = (route: NavigationRoute) => {
    switch (route) {
      case 'Home':
        navigateToHome();
        break;
      case 'Projects':
        navigateToProjects();
        break;
      case 'Profile':
        navigateToProfile();
        break;
      default:
        navigateToHome();
        break;
    }
  };

  const handleSimulateNotification = async () => {
    try {
      logger.notifications('Simulating notification...');
      
      // Crear una notificación simulada realista
      const notification = {
        id: 'simulated-' + Date.now(),
        title: 'Nueva tarea asignada',
        message: 'Se te ha asignado una nueva tarea de control de calidad que requiere verificación QR. Por favor, revisa los detalles.',
        type: 'task_assigned',
        isUrgent: false,
        actionRequired: true,
        actionData: {
          taskId: null, // Se podría asignar un ID real de tarea
          message: 'Navegar a tareas'
        },
        createdAt: new Date().toISOString()
      };

      // También crear la notificación real en la base de datos si el usuario está autenticado
      if (user?.id) {
        try {
          const notificationId = await supabaseService.createWorkNotification(
            user.id,
            notification.title,
            notification.message,
            {
              type: notification.type,
              isUrgent: notification.isUrgent,
              actionRequired: notification.actionRequired,
              actionType: 'navigate_to_task',
              actionData: notification.actionData
            }
          );
          
          // Actualizar el ID de la notificación con el ID real de la base de datos
          notification.id = notificationId;
          logger.notifications('Real notification created in database:', notificationId);
        } catch (error) {
          logger.error('Error creating real notification:', error);
          // Continuar con la notificación simulada aunque falle la base de datos
        }
      }

      // Establecer la notificación simulada
      setSimulatedNotification(notification);
      
      // Navegar a la pantalla Home para mostrar el dialog
      setCurrentScreen('home');
      
      logger.notifications('Notification simulation complete');
    } catch (error) {
      logger.error('Error simulating notification:', error);
      Alert.alert('Error', 'No se pudo simular la notificación. Inténtalo de nuevo.');
    }
  };

  const handleNotificationHandled = () => {
    setSimulatedNotification(null);
  };

  const handleSimulateExternalNFC = async () => {
    try {
      logger.notifications('Simulating external NFC read...');
      
      // Buscar una subtarea NFC de Zizi para usar en la simulación
      let nfcSubtask = null;
      let taskId = null;
      
      if (user?.id) {
        try {
          // Buscar tareas de Zizi con subtareas NFC
          const { data: tasks } = await supabaseService.supabase
            .from('tasks')
            .select(`
              id,
              title,
              subtasks!inner (
                id,
                title,
                description,
                is_completed,
                subtask_evidence_requirements!inner (
                  id,
                  type,
                  title,
                  description,
                  is_required
                )
              )
            `)
            .contains('assigned_to', [user.id])
            .eq('subtasks.subtask_evidence_requirements.type', 'nfc')
            .limit(1);

          if (tasks && tasks.length > 0 && tasks[0].subtasks.length > 0) {
            const task = tasks[0];
            const subtask = task.subtasks[0];
            taskId = task.id;
            
            nfcSubtask = {
              id: subtask.id,
              title: subtask.title,
              description: subtask.description,
              isCompleted: subtask.is_completed,
              evidenceRequirement: subtask.subtask_evidence_requirements[0] ? {
                id: subtask.subtask_evidence_requirements[0].id,
                type: 'nfc',
                title: subtask.subtask_evidence_requirements[0].title,
                description: subtask.subtask_evidence_requirements[0].description,
                isRequired: subtask.subtask_evidence_requirements[0].is_required
              } : null
            };
            
            logger.notifications('Found NFC subtask:', nfcSubtask);
          }
        } catch (error) {
          logger.error('Error fetching NFC subtask:', error);
        }
      }
      
      // Crear la simulación de lectura NFC externa
      const externalNFC = {
        id: 'external-nfc-' + Date.now(),
        tagId: `NFC_EXTERNAL_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        readAt: new Date(),
        location: 'Área de trabajo - Equipo #3',
        subtask: nfcSubtask,
        taskId: taskId,
        success: true
      };

      // Establecer la simulación NFC externa
      setSimulatedExternalNFC(externalNFC);
      
      // Navegar a la pantalla Home para mostrar el dialog
      setCurrentScreen('home');
      
      logger.notifications('External NFC simulation complete:', externalNFC);
    } catch (error) {
      logger.error('Error simulating external NFC:', error);
      Alert.alert('Error', 'No se pudo simular la lectura NFC externa. Inténtalo de nuevo.');
    }
  };

  const handleExternalNFCHandled = () => {
    setSimulatedExternalNFC(null);
  };

  const handleSimulateExternalQR = async () => {
    try {
      logger.notifications('Simulating external QR scan...');
      
      // Buscar cualquier tarea de Zizi para usar en la simulación
      let qrTask = null;
      
      if (user?.id) {
        try {
          // Buscar tareas asignadas a Zizi (cualquier tarea)
          const { data: tasks } = await supabaseService.supabase
            .from('tasks')
            .select(`
              id,
              title,
              description,
              status,
              priority,
              location,
              project_name,
              due_date,
              estimated_duration
            `)
            .contains('assigned_to', [user.id])
            .limit(1);

          if (tasks && tasks.length > 0) {
            const task = tasks[0];
            
            qrTask = {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              location: task.location,
              projectName: task.project_name,
              dueDate: task.due_date ? new Date(task.due_date) : undefined,
              estimatedDuration: task.estimated_duration
            };
            
            logger.notifications('Found task for QR simulation:', qrTask);
          }
        } catch (error) {
          logger.error('Error fetching task for QR:', error);
        }
      }
      
      // Crear la simulación de lectura QR externa
      const externalQR = {
        id: 'external-qr-' + Date.now(),
        qrCode: `QR_TASK_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        scannedAt: new Date(),
        source: 'Cámara del dispositivo',
        task: qrTask,
        taskId: qrTask?.id || null,
        success: true
      };

      // Establecer la simulación QR externa
      setSimulatedExternalQR(externalQR);
      
      // Navegar a la pantalla Home para mostrar el dialog
      setCurrentScreen('home');
      
      logger.notifications('External QR simulation complete:', externalQR);
    } catch (error) {
      logger.error('Error simulating external QR:', error);
      Alert.alert('Error', 'No se pudo simular la lectura QR externa. Inténtalo de nuevo.');
    }
  };

  const handleExternalQRHandled = () => {
    setSimulatedExternalQR(null);
  };

  const getCurrentRoute = (): NavigationRoute => {
    switch (currentScreen) {
      case 'home':
        return 'Home';
      case 'projects':
        return 'Projects';
      case 'profile':
        return 'Profile';
      case 'taskDetail':
        return 'Home'; // TaskDetail está relacionado con Home
      case 'projectDetail':
        return 'Projects'; // ProjectDetail está relacionado con Projects
      default:
        return 'Home';
    }
  };

  const showNavBar = isAuthenticated && !isCheckingAuth && (currentScreen === 'home' || currentScreen === 'projects' || currentScreen === 'profile');

  const renderScreen = () => {
    // Mostrar pantalla de carga mientras verifica autenticación
    if (isCheckingAuth) {
      return null; // Podrías agregar un splash screen aquí
    }

    // Mostrar login si no está autenticado
    if (!isAuthenticated) {
      return (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      );
    }

    // Mostrar pantallas principales si está autenticado
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            onNavigateToTask={navigateToTaskDetail}
            taskRefreshTrigger={taskRefreshTrigger}
            simulatedNotification={simulatedNotification}
            onNotificationHandled={handleNotificationHandled}
            simulatedExternalNFC={simulatedExternalNFC}
            onExternalNFCHandled={handleExternalNFCHandled}
            simulatedExternalQR={simulatedExternalQR}
            onExternalQRHandled={handleExternalQRHandled}
          />
        );
      case 'projects':
        return (
          <ProjectsScreen 
            onNavigateToProject={navigateToProjectDetail}
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            onLogout={performLogout}
            onSimulateNotification={handleSimulateNotification}
        onSimulateExternalNFC={handleSimulateExternalNFC}
        onSimulateExternalQR={handleSimulateExternalQR}
          />
        );
      case 'taskDetail':
        return selectedTaskId ? (
          <TaskDetailScreen 
            taskId={selectedTaskId}
            onGoBack={navigateToHome}
          />
        ) : (
          <HomeScreen 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            onNavigateToTask={navigateToTaskDetail}
            taskRefreshTrigger={taskRefreshTrigger}
            simulatedNotification={simulatedNotification}
            onNotificationHandled={handleNotificationHandled}
          />
        );
      case 'projectDetail':
        return selectedProjectId ? (
          <ProjectDetailScreen 
            projectId={selectedProjectId}
            onNavigateBack={navigateToProjects}
            onNavigateToTask={navigateToTaskDetail}
          />
        ) : (
          <ProjectsScreen 
            onNavigateToProject={navigateToProjectDetail}
          />
        );
      default:
        return (
          <HomeScreen 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            onNavigateToTask={navigateToTaskDetail}
            taskRefreshTrigger={taskRefreshTrigger}
            simulatedNotification={simulatedNotification}
            onNotificationHandled={handleNotificationHandled}
          />
        );
    }
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        {renderScreen()}
        {showNavBar && (
          <NavBar 
            currentRoute={getCurrentRoute()}
            onNavigate={handleNavigation}
          />
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

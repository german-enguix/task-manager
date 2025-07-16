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

type Screen = 'home' | 'projects' | 'profile' | 'taskDetail' | 'projectDetail';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Verificar autenticación al iniciar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🚀 Starting authentication check...');
      
      const authStatus = await supabaseService.checkAuthStatus();
      
      console.log('📊 Auth status result:', authStatus);
      
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
        console.log('✅ User authenticated and profile loaded:', userWithProfile.name);
      } else {
        console.log('❌ Authentication failed:', authStatus.message);
        
        // Si el usuario no está autenticado pero creemos que debería estar,
        // intentar refrescar la sesión
        if (!authStatus.sessionValid) {
          console.log('🔄 Attempting to refresh session...');
          const refreshed = await supabaseService.refreshSession();
          
          if (refreshed) {
            console.log('✅ Session refreshed, retrying...');
            // Intentar de nuevo después del refresh
            const retryAuthStatus = await supabaseService.checkAuthStatus();
            if (retryAuthStatus.isAuthenticated && retryAuthStatus.sessionValid) {
              console.log('✅ Authentication successful after refresh');
              // Recursively call checkAuthStatus to set user
              await checkAuthStatus();
              return;
            }
          }
        }
        
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
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
    setCurrentScreen('home');
    setSelectedTaskId(null);
    setSelectedProjectId(null);
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
      console.log('🚪 Logging out user...');
      await supabaseService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('home');
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
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

import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { HomeScreen, ProjectsScreen, ProjectDetailScreen, ProfileScreen } from '@/screens';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';
import { NavBar } from '@/components';
import { lightTheme, darkTheme } from '@/constants';
import { NavigationRoute, User } from '@/types';

type Screen = 'home' | 'projects' | 'profile' | 'taskDetail' | 'projectDetail';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Juan Pérez',
    email: 'juan.perez@ejemplo.com',
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
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

  const handleLogout = () => {
    Alert.alert(
      'Sesión Cerrada',
      'Has cerrado sesión exitosamente',
      [
        { 
          text: 'OK', 
          onPress: () => {
            // Aquí podrías resetear el estado de la app o navegar a login
            setCurrentScreen('home');
          }
        }
      ]
    );
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

  const showNavBar = currentScreen === 'home' || currentScreen === 'projects' || currentScreen === 'profile';

  const renderScreen = () => {
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
            user={user}
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
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

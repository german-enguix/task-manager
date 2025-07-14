import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { HomeScreen, TaskDetailScreen } from '@/screens';
import { lightTheme, darkTheme } from '@/constants';

type Screen = 'home' | 'taskDetail';

export default function App() {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navigateToTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentScreen('taskDetail');
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
    setSelectedTaskId(null);
  };

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
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

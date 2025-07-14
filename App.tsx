import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { HomeScreen } from '@/screens';
import { lightTheme, darkTheme } from '@/constants';

export default function App() {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        {/* Main Content */}
        <HomeScreen 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

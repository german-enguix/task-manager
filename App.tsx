import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, Surface, IconButton, Switch } from 'react-native-paper';
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

        {/* Theme Toggle Header */}
        <Surface style={styles.themeHeader} elevation={1}>
          <View style={styles.themeToggle}>
            <IconButton
              icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
              size={24}
              onPress={toggleTheme}
            />
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </Surface>

        {/* Main Content */}
        <HomeScreen />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

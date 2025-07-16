import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  ActivityIndicator,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { supabaseService } from '@/services/supabaseService';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isDarkMode = false,
  toggleTheme,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('El email es requerido');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Formato de email inválido');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('La contraseña es requerida');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await supabaseService.signIn(email.trim(), password);
      
      if (result.user) {
        // Obtener el perfil del usuario
        const userProfile = await supabaseService.getUserProfile(result.user.id);
        
        const userWithProfile = {
          id: result.user.id,
          email: result.user.email,
          name: userProfile?.name || result.user.email,
          role: userProfile?.role,
          avatar_url: userProfile?.avatar_url,
        };
        
        onLoginSuccess(userWithProfile);
      } else {
        Alert.alert(
          'Error de autenticación',
          'No se pudo obtener la información del usuario'
        );
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      
      let errorMessage = 'Ocurrió un error inesperado';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email requerido',
        'Por favor ingresa tu email para recuperar la contraseña'
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(
        'Email inválido',
        'Por favor ingresa un email válido'
      );
      return;
    }

    try {
      await supabaseService.resetPassword(email);
      Alert.alert(
        'Email enviado',
        'Se ha enviado un enlace de recuperación a tu email'
      );
    } catch (error: any) {
      console.error('Error al enviar email de recuperación:', error);
      Alert.alert(
        'Error',
        'No se pudo enviar el email de recuperación. Intenta de nuevo.'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header con tema toggle */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
            Iniciar Sesión
          </Text>
          {toggleTheme && (
            <IconButton
              icon={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'}
              size={24}
              onPress={toggleTheme}
            />
          )}
        </View>
      </Surface>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Brand Area */}
          <View style={styles.brandContainer}>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons 
                name="task-alt" 
                size={48} 
                color={theme.colors.onPrimary} 
              />
            </View>
            <Text 
              variant="headlineMedium" 
              style={[styles.brandText, { color: theme.colors.onBackground }]}
            >
              TaskManager
            </Text>
            <Text 
              variant="bodyMedium" 
              style={[styles.brandSubtext, { color: theme.colors.onSurfaceVariant }]}
            >
              Gestiona tus proyectos y tareas
            </Text>
          </View>

          {/* Login Form */}
          <Card style={styles.loginCard} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <Text 
                variant="titleLarge" 
                style={[styles.formTitle, { color: theme.colors.onSurface }]}
              >
                Accede a tu cuenta
              </Text>

              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                error={!!emailError}
                disabled={isLoading}
                left={<TextInput.Icon icon="email" />}
              />
              {emailError ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                  {emailError}
                </Text>
              ) : null}

              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                style={styles.input}
                error={!!passwordError}
                disabled={isLoading}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {passwordError ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                  {passwordError}
                </Text>
              ) : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <Button
                mode="text"
                onPress={handleForgotPassword}
                style={styles.forgotPasswordButton}
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Card.Content>
          </Card>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text 
              variant="bodySmall" 
              style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
            >
              Al iniciar sesión, aceptas nuestros términos y condiciones
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandText: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  brandSubtext: {
    textAlign: 'center',
  },
  loginCard: {
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 20,
  },
}); 
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { 
  Text, 
  Surface, 
  Card, 
  IconButton, 
  Switch, 
  List, 
  Divider,
  Button,
  TextInput,
  RadioButton,
  Portal,
  Modal,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import { User } from '@/types';
import { supabaseService } from '@/services/supabaseService';

interface ProfileScreenProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  isDarkMode, 
  toggleTheme,
  onLogout
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener usuario actual
      const currentUser = await supabaseService.getCurrentUser();
      
      if (currentUser && currentUser.profile) {
        const userProfile: User = {
          id: currentUser.profile.id,
          name: currentUser.profile.name,
          email: currentUser.profile.email,
        };
        
        setUser(userProfile);
        setEditedName(userProfile.name);
        setEditedEmail(userProfile.email);
        
        console.log('✅ User profile loaded:', userProfile.name);
      } else {
        setError('No se pudo cargar el perfil del usuario');
      }
    } catch (err) {
      console.error('❌ Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'pt', label: 'Português', flag: '🇵🇹' },
  ];

  const handleSaveUserData = async () => {
    if (!user) return;
    
    if (!editedName.trim() || !editedEmail.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setUpdating(true);
      
      // Actualizar perfil en Supabase
      const updatedProfile = await supabaseService.updateUserProfile(user.id, {
        name: editedName.trim(),
        email: editedEmail.trim(),
      });
      
      // Actualizar estado local
      const updatedUser: User = {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
      };
      
      setUser(updatedUser);
      setIsEditModalVisible(false);
      
      Alert.alert('Éxito', 'Datos actualizados correctamente');
      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      Alert.alert('Error', 'No se pudieron actualizar los datos. Inténtalo de nuevo.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalVisible(false);
    try {
      await supabaseService.signOut();
      onLogout?.();
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
    }
  };

  const cancelLogout = () => {
    setIsLogoutModalVisible(false);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageModalVisible(false);
    Alert.alert('Idioma', `Idioma cambiado a ${languages.find(l => l.value === language)?.label}`);
  };

  const getCurrentLanguage = () => {
    return languages.find(l => l.value === selectedLanguage);
  };

  // Loading State
  if (loading) {
    return (
      <Surface style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Mi Perfil</Text>
          <Text variant="bodyMedium">Cargando información...</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Cargando perfil del usuario...
          </Text>
        </View>
      </Surface>
    );
  }

  // Error State
  if (error || !user) {
    return (
      <Surface style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Mi Perfil</Text>
          <Text variant="bodyMedium">Error al cargar</Text>
        </View>
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.errorTitle}>
              ❌ {error || 'No se pudo cargar el perfil'}
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              No se pudo cargar la información del usuario.
            </Text>
            <Button
              mode="contained"
              onPress={loadUserProfile}
              style={styles.retryButton}
              icon="refresh"
            >
              Reintentar
            </Button>
          </Card.Content>
        </Card>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header integrado */}
        <View style={styles.header}>
          <Text variant="headlineMedium">
            Mi Perfil
          </Text>
          <Text variant="bodyMedium">
            Gestiona tu cuenta y preferencias
          </Text>
        </View>
        {/* Información del Usuario */}
        <Card style={styles.card}>
          <Card.Title 
            title="Información Personal" 
            subtitle="Datos de tu cuenta"
            left={(props) => <IconButton {...props} icon="account" />}
            right={(props) => (
              <IconButton 
                {...props} 
                icon="pencil" 
                onPress={() => setIsEditModalVisible(true)}
              />
            )}
          />
          <Card.Content>
            <View style={styles.userInfo}>
              <View style={styles.userInfoRow}>
                <Text variant="bodySmall" style={styles.userInfoLabel}>Nombre:</Text>
                <Text variant="titleMedium">{user.name}</Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text variant="bodySmall" style={styles.userInfoLabel}>Email:</Text>
                <Text variant="titleMedium">{user.email}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Preferencias de la Aplicación */}
        <Card style={styles.card}>
          <Card.Title 
            title="Preferencias" 
            subtitle="Configuración de la aplicación"
            left={(props) => <IconButton {...props} icon="cog" />}
          />
          <Card.Content>
            <List.Section>
              <List.Item
                title="Modo Oscuro"
                description="Cambia entre tema claro y oscuro"
                left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
                right={() => (
                  <View style={styles.switchContainer}>
                    <Switch value={isDarkMode} onValueChange={toggleTheme} />
                  </View>
                )}
              />
              
              <Divider />
              
              <List.Item
                title="Idioma"
                description={`${getCurrentLanguage()?.flag} ${getCurrentLanguage()?.label}`}
                left={(props) => <List.Icon {...props} icon="translate" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setIsLanguageModalVisible(true)}
              />
              
              <Divider />
              
              <List.Item
                title="Notificaciones"
                description="Recibir notificaciones de la app"
                left={(props) => <List.Icon {...props} icon="bell" />}
                right={() => (
                  <View style={styles.switchContainer}>
                    <Switch 
                      value={notificationsEnabled} 
                      onValueChange={setNotificationsEnabled} 
                    />
                  </View>
                )}
              />
              
              <Divider />
              
              <List.Item
                title="Ubicación"
                description="Permitir acceso a ubicación"
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                right={() => (
                  <View style={styles.switchContainer}>
                    <Switch 
                      value={locationEnabled} 
                      onValueChange={setLocationEnabled} 
                    />
                  </View>
                )}
              />
              
              <Divider />
              
              <List.Item
                title="Sincronización Automática"
                description="Sincronizar datos automáticamente"
                left={(props) => <List.Icon {...props} icon="sync" />}
                right={() => (
                  <View style={styles.switchContainer}>
                    <Switch 
                      value={autoSync} 
                      onValueChange={setAutoSync} 
                    />
                  </View>
                )}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Acciones */}
        <Card style={styles.card}>
          <Card.Title 
            title="Acciones" 
            subtitle="Opciones de cuenta"
            left={(props) => <IconButton {...props} icon="account-cog" />}
          />
          <Card.Content>
            <View style={styles.actionsContainer}>
              <Button
                mode="outlined"
                icon="pencil"
                style={styles.actionButton}
                onPress={() => setIsEditModalVisible(true)}
              >
                Editar Datos
              </Button>
              
              <Button
                mode="contained"
                icon="logout"
                style={[styles.actionButton, styles.logoutButton]}
                buttonColor="#f44336"
                onPress={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Información de la App */}
        <Card style={styles.card}>
          <Card.Title 
            title="Información" 
            subtitle="Sobre la aplicación"
            left={(props) => <IconButton {...props} icon="information" />}
          />
          <Card.Content>
            <View style={styles.appInfo}>
              <Text variant="bodyMedium">Versión: 1.0.0</Text>
              <Text variant="bodySmall" style={styles.appInfoSubtext}>
                Tasks Concept - Gestión de tareas y proyectos
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal para Editar Datos */}
      <Portal>
        <Modal 
          visible={isEditModalVisible} 
          onDismiss={() => setIsEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title title="Editar Datos Personales" />
            <Card.Content>
              <TextInput
                label="Nombre"
                value={editedName}
                onChangeText={setEditedName}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Email"
                value={editedEmail}
                onChangeText={setEditedEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
              />
            </Card.Content>
            <Card.Actions>
              <Button 
                onPress={() => setIsEditModalVisible(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSaveUserData}
                loading={updating}
                disabled={updating}
              >
                {updating ? 'Guardando...' : 'Guardar'}
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      {/* Modal para Seleccionar Idioma */}
      <Portal>
        <Modal 
          visible={isLanguageModalVisible} 
          onDismiss={() => setIsLanguageModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title title="Seleccionar Idioma" />
            <Card.Content>
              <RadioButton.Group 
                onValueChange={handleLanguageChange} 
                value={selectedLanguage}
              >
                {languages.map((language) => (
                  <View key={language.value} style={styles.languageOption}>
                    <RadioButton.Item
                      label={`${language.flag} ${language.label}`}
                      value={language.value}
                      labelStyle={styles.languageLabel}
                    />
                  </View>
                ))}
              </RadioButton.Group>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setIsLanguageModalVisible(false)}>
                Cancelar
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      {/* Modal para Confirmar Logout */}
      <Portal>
        <Modal 
          visible={isLogoutModalVisible} 
          onDismiss={cancelLogout}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title title="Cerrar Sesión" />
            <Card.Content>
              <Text>¿Estás seguro de que quieres cerrar sesión?</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={cancelLogout}>
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={confirmLogout}
                buttonColor="#F44336"
              >
                Cerrar Sesión
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },

  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  userInfo: {
    paddingVertical: 8,
  },
  userInfoRow: {
    marginBottom: 12,
  },
  userInfoLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  switchContainer: {
    justifyContent: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginVertical: 4,
  },
  logoutButton: {
    marginTop: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  appInfoSubtext: {
    opacity: 0.6,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 80,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  languageOption: {
    marginVertical: 4,
  },
  languageLabel: {
    fontSize: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorCard: {
    margin: 16,
    borderColor: '#F44336',
    borderWidth: 1,
  },
  errorTitle: {
    color: '#F44336',
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 16,
    opacity: 0.7,
  },
  retryButton: {
    alignSelf: 'center',
  },
}); 
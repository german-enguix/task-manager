import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { supabaseService } from '@/services/supabaseService';
import { supabaseMigration } from '@/utils/migrateToSupabase';
import { Tag } from '@/types';

export const SupabaseTest: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [creating, setCreating] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);

  useEffect(() => {
    testSupabaseConnection();
    checkMigrationStatus();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Intentar obtener los tags de ejemplo
      const fetchedTags = await supabaseService.getTags();
      
      setTags(fetchedTags);
      setConnectionStatus('success');
      setLoading(false);
      
      console.log('✅ Supabase connection successful!');
      console.log(`📊 Found ${fetchedTags.length} tags in database`);
      
    } catch (err) {
      console.error('❌ Supabase connection failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnectionStatus('error');
      setLoading(false);
    }
  };

  const createTestTag = async () => {
    setCreating(true);
    try {
      const randomColors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
      const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
      const timestamp = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      const newTag: Omit<Tag, 'id'> = {
        name: `Test Tag ${timestamp}`,
        color: randomColor,
        category: 'Prueba'
      };

      console.log('🏷️ Creating new tag:', newTag);
      
      const createdTag = await supabaseService.createTag(newTag);
      
      console.log('✅ Tag created successfully:', createdTag);
      
      // Actualizar la lista de tags
      const updatedTags = await supabaseService.getTags();
      setTags(updatedTags);
      
      console.log(`📊 Updated tags list: ${updatedTags.length} tags`);
      
    } catch (err) {
      console.error('❌ Error creating tag:', err);
      setError(err instanceof Error ? err.message : 'Error creating tag');
    } finally {
      setCreating(false);
    }
  };

  const checkMigrationStatus = async () => {
    try {
      const status = await supabaseMigration.checkMigrationStatus();
      setMigrationStatus(status);
    } catch (err) {
      console.warn('Could not check migration status:', err);
    }
  };

  const runMigration = async () => {
    setMigrating(true);
    try {
      console.log('🚀 Starting full migration from mock data...');
      
      await supabaseMigration.migrateAllData();
      
      // Actualizar estado después de la migración
      await checkMigrationStatus();
      await testSupabaseConnection();
      
      console.log('✅ Migration completed successfully!');
      
    } catch (err) {
      console.error('❌ Migration failed:', err);
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.center}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Probando conexión con Supabase...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <Card style={[styles.card, styles.errorCard]}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            ❌ Error de conexión
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
          <Text variant="bodySmall" style={styles.helpText}>
            Verifica que tu archivo .env esté configurado correctamente y que hayas ejecutado los scripts SQL.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, styles.successCard]}>
      <Card.Content>
        <Text variant="headlineSmall" style={styles.successTitle}>
          ✅ ¡Conexión exitosa!
        </Text>
        <Text variant="bodyMedium" style={styles.successText}>
          Supabase está conectado correctamente
        </Text>
        
        {migrationStatus && (
          <View style={styles.migrationStatus}>
            <Text variant="titleSmall" style={styles.statusTitle}>
              Estado de la base de datos:
            </Text>
            <View style={styles.statusGrid}>
              <Text variant="bodySmall">👤 Usuarios: {migrationStatus.users}</Text>
              <Text variant="bodySmall">📋 Tareas: {migrationStatus.tasks}</Text>
              <Text variant="bodySmall">📝 Subtareas: {migrationStatus.subtasks}</Text>
              <Text variant="bodySmall">🏷️ Tags: {migrationStatus.tags}</Text>
              <Text variant="bodySmall">🔗 Relaciones: {migrationStatus.taskTags}</Text>
            </View>
          </View>
        )}

        <Text variant="titleMedium" style={styles.tagsTitle}>
          Tags encontrados ({tags.length}):
        </Text>
        
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              mode="flat"
              style={[styles.tagChip, { backgroundColor: tag.color + '20' }]}
              textStyle={[styles.tagText, { color: tag.color }]}
              compact
            >
              {tag.name}
            </Chip>
          ))}
        </View>
        
        {tags.length === 0 && (
          <Text variant="bodySmall" style={styles.noTagsText}>
            No se encontraron tags. Ejecuta el script de inserción de datos de ejemplo.
          </Text>
        )}
        
        <View style={styles.buttonContainer}>
          {migrationStatus && migrationStatus.tasks === 0 && (
            <Button
              mode="contained"
              onPress={runMigration}
              loading={migrating}
              disabled={migrating}
              icon="database-import"
              style={[styles.actionButton, styles.migrationButton]}
            >
              {migrating ? 'Migrando datos...' : 'Migrar datos del Mock'}
            </Button>
          )}
          
          <Button
            mode="outlined"
            onPress={createTestTag}
            loading={creating}
            disabled={creating || migrating}
            icon="plus"
            style={styles.actionButton}
          >
            {creating ? 'Creando...' : 'Crear Tag de Prueba'}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  successCard: {
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  errorCard: {
    borderColor: '#f44336',
    borderWidth: 1,
  },
  center: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  successTitle: {
    color: '#4caf50',
    marginBottom: 8,
  },
  successText: {
    marginBottom: 16,
  },
  errorTitle: {
    color: '#f44336',
    marginBottom: 8,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 12,
  },
  helpText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  tagsTitle: {
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    marginBottom: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  noTagsText: {
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 16,
  },
  migrationStatus: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  statusTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  statusGrid: {
    flexDirection: 'column',
    gap: 4,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 200,
  },
  migrationButton: {
    backgroundColor: '#2196f3',
  },
}); 
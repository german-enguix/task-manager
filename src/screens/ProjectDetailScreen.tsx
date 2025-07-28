import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Surface, Card, Chip, IconButton, ProgressBar, Divider, Icon, ActivityIndicator } from 'react-native-paper';
import { supabaseService } from '@/services/supabaseService';
import { Project, ProjectStatus, ProjectPriority, SupervisorObservation } from '@/types';

interface ProjectDetailScreenProps {
  projectId: string;
  onNavigateBack: () => void;
  onNavigateToTask: (taskId: string) => void;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ 
  projectId, 
  onNavigateBack,
  onNavigateToTask
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projectData = await supabaseService.getProjectById(projectId);
      setProject(projectData);
      
      if (projectData) {
        console.log('✅ Project loaded from Supabase:', projectData.name);
      } else {
        setError('Proyecto no encontrado');
      }
    } catch (err) {
      console.error('❌ Error loading project:', err);
      setError(err instanceof Error ? err.message : 'Error loading project');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (observationId: string, isRead: boolean) => {
    try {
      console.log(`🔄 Marking observation as ${isRead ? 'read' : 'unread'}`);
      
      // Actualizar en Supabase
      await supabaseService.markObservationAsRead(observationId, isRead);
      
      // Actualizar estado local del proyecto
      setProject(prevProject => {
        if (!prevProject) return prevProject;
        
        return {
          ...prevProject,
          observations: prevProject.observations.map(obs => 
            obs.id === observationId 
              ? { 
                  ...obs, 
                  isRead, 
                  readAt: isRead ? new Date() : undefined 
                }
              : obs
          )
        };
      });
      
      console.log(`✅ Observation marked as ${isRead ? 'read' : 'unread'} successfully`);
    } catch (error) {
      console.error('❌ Error marking observation as read:', error);
      // Aquí podrías mostrar un toast o snackbar con el error
    }
  };

  // Loading State
  if (loading) {
    return (
      <Surface style={styles.container}>
        <Surface elevation={2} style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton icon="arrow-left" onPress={onNavigateBack} />
            <Text variant="headlineMedium">Cargando proyecto...</Text>
          </View>
        </Surface>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Cargando información del proyecto...
          </Text>
        </View>
      </Surface>
    );
  }

  // Error State
  if (error || !project) {
    return (
      <Surface style={styles.container}>
        <Surface elevation={2} style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton icon="arrow-left" onPress={onNavigateBack} />
            <Text variant="headlineMedium">Error</Text>
          </View>
        </Surface>
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.errorTitle}>
              ❌ {error || 'Proyecto no encontrado'}
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              No se pudo cargar la información del proyecto.
            </Text>
            <IconButton
              icon="refresh"
              mode="contained"
              onPress={loadProject}
              style={styles.retryButton}
            >
              Reintentar
            </IconButton>
          </Card.Content>
        </Card>
      </Surface>
    );
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PROGRAMMED:
        return '#9E9E9E';
      case ProjectStatus.IN_PROGRESS:
        return '#2196F3';
      case ProjectStatus.COMPLETED:
        return '#4CAF50';
      case ProjectStatus.CANCELLED:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PROGRAMMED:
        return 'Programado';
      case ProjectStatus.IN_PROGRESS:
        return 'En progreso';
      case ProjectStatus.COMPLETED:
        return 'Finalizado';
      case ProjectStatus.CANCELLED:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case ProjectPriority.LOW:
        return '#4CAF50';
      case ProjectPriority.MEDIUM:
        return '#FF9800';
      case ProjectPriority.HIGH:
        return '#F44336';
      case ProjectPriority.CRITICAL:
        return '#9C27B0';
      default:
        return '#9E9E9E';
    }
  };

  const getPriorityText = (priority: ProjectPriority) => {
    switch (priority) {
      case ProjectPriority.LOW:
        return 'Baja';
      case ProjectPriority.MEDIUM:
        return 'Media';
      case ProjectPriority.HIGH:
        return 'Alta';
      case ProjectPriority.CRITICAL:
        return 'Crítica';
      default:
        return 'Sin definir';
    }
  };

  const formatDateRange = (startDate: Date, endDate?: Date) => {
    const start = startDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
    
    if (!endDate) return `Desde ${start}`;
    
    const end = endDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
    
    return `${start} - ${end}`;
  };

  const formatObservationDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getObservationPriorityColor = (priority: ProjectPriority) => {
    return getPriorityColor(priority);
  };

  const renderObservation = (observation: SupervisorObservation) => (
    <View key={observation.id} style={styles.observationItem}>
      <View style={styles.observationHeader}>
        <View style={styles.observationInfo}>
          <Text variant="titleSmall" style={styles.observationSupervisor}>
            {observation.supervisorName}
          </Text>
          <Text variant="bodySmall" style={styles.observationRole}>
            {observation.supervisorRole}
          </Text>
        </View>
        
        <View style={styles.observationMeta}>
          <Chip 
            mode="outlined"
            style={[styles.observationPriorityChip, { borderColor: getObservationPriorityColor(observation.priority) }]}
            textStyle={{ color: getObservationPriorityColor(observation.priority), fontSize: 10 }}
          >
            {getPriorityText(observation.priority)}
          </Chip>
        </View>
      </View>
      
      <Text variant="bodyMedium" style={styles.observationText}>
        {observation.observation}
      </Text>
      
      <View style={styles.observationFooter}>
        <Text variant="bodySmall" style={styles.observationDate}>
          {formatObservationDate(observation.date)}
        </Text>
        
        <View style={styles.observationActions}>
          <View style={styles.observationStatus}>
            {observation.isResolved ? (
              <Chip 
                mode="flat"
                style={styles.resolvedChip}
                textStyle={styles.resolvedChipText}
                icon="check-circle"
              >
                Resuelto
              </Chip>
            ) : (
              <Chip 
                mode="flat"
                style={styles.pendingChip}
                textStyle={styles.pendingChipText}
                icon="clock"
              >
                Pendiente
              </Chip>
            )}
          </View>
          
          {/* Botón marcar como leído */}
          <Chip 
            mode={observation.isRead ? "flat" : "outlined"}
            style={[
              styles.readStatusChip,
              observation.isRead ? styles.readChip : styles.unreadChip
            ]}
            textStyle={[
              styles.readStatusChipText,
              observation.isRead ? styles.readChipText : styles.unreadChipText
            ]}
            icon={observation.isRead ? "eye-check" : "eye"}
            onPress={() => handleMarkAsRead(observation.id, !observation.isRead)}
          >
            {observation.isRead ? 'Leído' : 'Marcar como leído'}
          </Chip>
        </View>
      </View>
      
      {observation.isResolved && observation.resolution && (
        <View style={styles.resolutionContainer}>
          <Text variant="bodySmall" style={styles.resolutionLabel}>
            Resolución por {observation.resolvedBy}:
          </Text>
          <Text variant="bodySmall" style={styles.resolutionText}>
            {observation.resolution}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Surface style={styles.container}>
      {/* Header */}
      <Surface elevation={2} style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton icon="arrow-left" onPress={onNavigateBack} />
          <View style={styles.headerText}>
            <Text variant="headlineMedium" numberOfLines={1}>
              {project.name}
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtext}>
              Detalle del proyecto
            </Text>
          </View>
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {/* Status and Priority */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text variant="bodySmall" style={styles.statusLabel}>Estado</Text>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { borderColor: getStatusColor(project.status) }]}
                  textStyle={{ color: getStatusColor(project.status), fontSize: 12 }}
                >
                  {getStatusText(project.status)}
                </Chip>
              </View>
              
              <View style={styles.statusItem}>
                <Text variant="bodySmall" style={styles.statusLabel}>Prioridad</Text>
                <Chip 
                  mode="outlined" 
                  style={[styles.priorityChip, { borderColor: getPriorityColor(project.priority) }]}
                  textStyle={{ color: getPriorityColor(project.priority), fontSize: 12 }}
                >
                  {getPriorityText(project.priority)}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Project Info */}
        <Card style={styles.card}>
          <Card.Title title="Información del proyecto" />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.description}>
              {project.description}
            </Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoLabelContainer}>
                  <Icon source="map-marker" size={16} color="#666" />
                  <Text variant="bodySmall" style={styles.infoLabel}>Ubicación</Text>
                </View>
                <Text variant="bodyMedium" style={styles.infoValue}>
                  {project.location}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoLabelContainer}>
                  <Icon source="calendar" size={16} color="#666" />
                  <Text variant="bodySmall" style={styles.infoLabel}>Fechas</Text>
                </View>
                <Text variant="bodyMedium" style={styles.infoValue}>
                  {formatDateRange(project.startDate, project.endDate)}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoLabelContainer}>
                  <Icon source="clock-outline" size={16} color="#666" />
                  <Text variant="bodySmall" style={styles.infoLabel}>Duración</Text>
                </View>
                <Text variant="bodyMedium" style={styles.infoValue}>
                  {project.estimatedDuration} días estimados
                  {project.actualDuration && ` (${project.actualDuration} días reales)`}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoLabelContainer}>
                  <Icon source="account-group" size={16} color="#666" />
                  <Text variant="bodySmall" style={styles.infoLabel}>Equipo</Text>
                </View>
                <Text variant="bodyMedium" style={styles.infoValue}>
                  {(project.assignedTo || []).length > 0 
                    ? `${(project.assignedTo || []).length} usuario${(project.assignedTo || []).length !== 1 ? 's' : ''} asignado${(project.assignedTo || []).length !== 1 ? 's' : ''}`
                    : 'Sin usuarios asignados'
                  }
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Progress */}
        <Card style={styles.card}>
          <Card.Title title="Progreso del proyecto" />
          <Card.Content>
            <View style={styles.progressHeader}>
              <Text variant="bodyMedium" style={styles.progressLabel}>
                Completado
              </Text>
              <Text variant="titleMedium" style={styles.progressValue}>
                {Math.round(project.completionPercentage)}%
              </Text>
            </View>
            <ProgressBar 
              progress={project.completionPercentage / 100} 
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.tasksProgress}>
              {project.completedTasks} de {project.totalTasks} tareas completadas
            </Text>
          </Card.Content>
        </Card>

        {/* Tasks */}
        {(project.tasks && project.tasks.length > 0) && (
          <Card style={styles.card}>
            <Card.Title title="Tareas del proyecto" />
            <Card.Content>
              {project.tasks.map((task) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'not_started': return '#9E9E9E';
                    case 'in_progress': return '#2196F3';
                    case 'paused': return '#FF9800';
                    case 'completed': return '#4CAF50';
                    default: return '#9E9E9E';
                  }
                };

                const getStatusText = (status: string) => {
                  switch (status) {
                    case 'not_started': return 'Sin empezar';
                    case 'in_progress': return 'En progreso';
                    case 'paused': return 'Pausada';
                    case 'completed': return 'Finalizada';
                    default: return status;
                  }
                };

                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case 'high': return '#F44336';
                    case 'medium': return '#FF9800';
                    case 'low': return '#4CAF50';
                    default: return '#9E9E9E';
                  }
                };

                const completedSubtasks = task.subtasks?.filter(sub => sub.isCompleted).length || 0;
                const totalSubtasks = task.subtasks?.length || 0;
                const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
                
                return (
                  <Card 
                    key={task.id} 
                    style={styles.taskCard}
                    onPress={() => onNavigateToTask(task.id)}
                  >
                    <Card.Content>
                      <View style={styles.taskHeader}>
                        <Text variant="titleSmall" numberOfLines={1} style={styles.taskTitle}>
                          {task.title}
                        </Text>
                        <View style={styles.taskChips}>
                          <Chip 
                            mode="outlined" 
                            style={[styles.taskStatusChip, { borderColor: getStatusColor(task.status) }]}
                            textStyle={[styles.chipText, { color: getStatusColor(task.status) }]}
                            compact
                          >
                            {getStatusText(task.status)}
                          </Chip>
                          <Chip 
                            mode="outlined" 
                            style={[styles.taskPriorityChip, { borderColor: getPriorityColor(task.priority) }]}
                            textStyle={[styles.chipText, { color: getPriorityColor(task.priority) }]}
                            compact
                          >
                            {task.priority.toUpperCase()}
                          </Chip>
                        </View>
                      </View>
                      
                      <Text variant="bodySmall" style={styles.taskDescription} numberOfLines={2}>
                        {task.description}
                      </Text>
                      
                      {totalSubtasks > 0 && (
                        <View style={styles.progressSection}>
                          <View style={styles.progressHeader}>
                            <Text variant="bodySmall" style={styles.progressLabel}>
                              Subtareas: {completedSubtasks}/{totalSubtasks}
                            </Text>
                            <Text variant="bodySmall" style={styles.progressPercentage}>
                              {Math.round(progress)}%
                            </Text>
                          </View>
                          <ProgressBar progress={progress / 100} style={styles.progressBar} />
                        </View>
                      )}
                      
                      <View style={styles.taskFooter}>
                        <View style={styles.taskLocation}>
                          <Icon source="map-marker" size={14} color="#666" />
                          <Text variant="bodySmall" style={styles.taskLocationText}>
                            {task.location}
                          </Text>
                        </View>
                        {task.dueDate && (
                          <Text variant="bodySmall" style={styles.taskDueDate}>
                            {new Date(task.dueDate).toLocaleDateString('es-ES')}
                          </Text>
                        )}
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Supervisor Observations */}
        <Card style={styles.card}>
          <Card.Title title="Observaciones del supervisor" />
          <Card.Content>
            {project.observations.length > 0 ? (
              project.observations.map((observation, index) => (
                <View key={observation.id}>
                  {renderObservation(observation)}
                  {index < project.observations.length - 1 && <Divider style={styles.observationDivider} />}
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.noObservations}>
                No hay observaciones para este proyecto
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Tags */}
        <Card style={styles.card}>
          <Card.Title title="Etiquetas del proyecto" />
          <Card.Content>
            {project.tags && project.tags.length > 0 ? (
              <View style={styles.tagsContainer}>
                {project.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    mode="outlined"
                    style={[
                      styles.tagChip,
                      { borderColor: tag.color, backgroundColor: `${tag.color}15` }
                    ]}
                    textStyle={{ color: tag.color }}
                  >
                    {tag.name}
                  </Chip>
                ))}
              </View>
            ) : (
              <Text variant="bodyMedium" style={styles.noTags}>
                No hay etiquetas asignadas a este proyecto
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Espacio adicional para la navbar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  headerSubtext: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  statusChip: {
    alignSelf: 'center',
  },
  priorityChip: {
    alignSelf: 'center',
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoLabel: {
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: '500',
    marginLeft: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontWeight: '500',
  },
  progressValue: {
    fontWeight: '600',
    color: '#2196F3',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  tasksProgress: {
    opacity: 0.7,
    textAlign: 'center',
  },
  taskCard: {
    marginBottom: 8,
    elevation: 1,
  },
  taskDescription: {
    marginVertical: 4,
    opacity: 0.7,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  taskAssignee: {
    flex: 1,
  },
  taskStatusChip: {
    alignSelf: 'flex-end',
  },
  observationItem: {
    marginBottom: 16,
  },
  observationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  observationInfo: {
    flex: 1,
  },
  observationSupervisor: {
    fontWeight: '600',
  },
  observationRole: {
    opacity: 0.7,
  },
  observationMeta: {
    alignItems: 'flex-end',
  },
  observationPriorityChip: {
    alignSelf: 'flex-end',
  },
  observationText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  observationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  observationDate: {
    opacity: 0.6,
  },
  observationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  observationStatus: {
    alignItems: 'flex-end',
  },
  readStatusChip: {
    height: 28,
  },
  readStatusChipText: {
    fontSize: 10,
  },
  readChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  readChipText: {
    color: '#4CAF50',
  },
  unreadChip: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: '#2196F3',
  },
  unreadChipText: {
    color: '#2196F3',
  },
  resolvedChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  resolvedChipText: {
    color: '#4CAF50',
    fontSize: 11,
  },
  pendingChip: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  pendingChipText: {
    color: '#FF9800',
    fontSize: 11,
  },
  resolutionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 8,
  },
  resolutionLabel: {
    fontWeight: '500',
    marginBottom: 4,
  },
  resolutionText: {
    opacity: 0.8,
  },
  observationDivider: {
    marginVertical: 12,
  },
  noObservations: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  noTags: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 16,
  },
  bottomSpacer: {
    height: 80,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  taskChips: {
    flexDirection: 'row',
    gap: 4,
  },
  taskPriorityChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  progressSection: {
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontWeight: '500',
    fontSize: 12,
  },
  progressPercentage: {
    fontWeight: '600',
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  taskLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskLocationText: {
    marginLeft: 4,
    opacity: 0.7,
    fontSize: 12,
  },
  taskDueDate: {
    opacity: 0.7,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProjectDetailScreen; 
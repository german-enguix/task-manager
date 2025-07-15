import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Surface, Card, Chip, IconButton, ProgressBar, Divider, Icon } from 'react-native-paper';
import { getProjectById, getTaskById } from '@/utils/mockData';
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
  const project = getProjectById(projectId);
  
  if (!project) {
    return (
      <Surface style={styles.container}>
        <Surface elevation={2} style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton icon="arrow-left" onPress={onNavigateBack} />
            <Text variant="headlineMedium">Proyecto no encontrado</Text>
          </View>
        </Surface>
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
                  {project.assignedTeam.join(', ')}
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
        {project.taskIds.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Tareas del proyecto" />
            <Card.Content>
              {project.taskIds.map((taskId) => {
                const task = getTaskById(taskId);
                if (!task) return null;
                
                return (
                  <Card 
                    key={taskId} 
                    style={styles.taskCard}
                    onPress={() => onNavigateToTask(taskId)}
                  >
                    <Card.Content>
                      <Text variant="titleSmall" numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.taskDescription}>
                        {task.description}
                      </Text>
                      <View style={styles.taskFooter}>
                        <Text variant="bodySmall" style={styles.taskAssignee}>
                          Asignado a: {task.assignedTo}
                        </Text>
                        <Chip 
                          mode="outlined" 
                          style={styles.taskStatusChip}
                          textStyle={{ fontSize: 10 }}
                        >
                          {task.status}
                        </Chip>
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

        {/* Resources */}
        <Card style={styles.card}>
          <Card.Title title="Recursos requeridos" />
          <Card.Content>
            {project.requiredResources.map((resource, index) => (
              <View key={index} style={styles.resourceItem}>
                <Text variant="bodyMedium">• {resource}</Text>
              </View>
            ))}
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
  observationStatus: {
    alignItems: 'flex-end',
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
  resourceItem: {
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default ProjectDetailScreen; 
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  Portal,
  Dialog,
  Card,
  Text,
  Button,
  Icon,
  useTheme
} from 'react-native-paper';

interface NotificationDialogProps {
  visible: boolean;
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    isUrgent: boolean;
    actionRequired: boolean;
    actionData?: any;
    createdAt: string | Date;
  } | null;
  onDismiss: () => void;
  onAccept: () => void;
  onAction?: (actionData: any) => void;
}

export const NotificationDialog: React.FC<NotificationDialogProps> = ({
  visible,
  notification,
  onDismiss,
  onAccept,
  onAction
}) => {
  const theme = useTheme();

  if (!notification) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_reminder':
        return 'clock-alert';
      case 'task_assigned':
        return 'account-plus';
      case 'deadline_approaching':
        return 'calendar-alert';
      case 'task_completed':
        return 'check-circle';
      case 'urgent':
        return 'alert';
      case 'info':
        return 'information';
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'alert-circle';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string, isUrgent: boolean) => {
    if (isUrgent) return theme.colors.error;
    
    switch (type) {
      case 'task_reminder':
        return theme.colors.primary;
      case 'task_assigned':
        return theme.colors.secondary;
      case 'deadline_approaching':
        return theme.colors.tertiary;
      case 'task_completed':
        return '#4CAF50';
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const formatTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (!date || isNaN(date.getTime())) {
      return 'Ahora';
    }
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAccept = () => {
    onAccept();
    if (notification.actionRequired && notification.actionData) {
      onAction?.(notification.actionData);
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <Card style={[
          styles.card,
          notification.isUrgent && { borderLeftWidth: 4, borderLeftColor: theme.colors.error }
        ]}>
          <Card.Content>
            {/* Header con icono y hora */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Icon
                  source={getNotificationIcon(notification.type)}
                  size={28}
                  color={getNotificationColor(notification.type, notification.isUrgent)}
                />
              </View>
              <View style={styles.headerText}>
                <Text variant="bodySmall" style={styles.timeText}>
                  {formatTime(notification.createdAt)}
                </Text>
                {notification.isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Text variant="bodySmall" style={styles.urgentText}>
                      URGENTE
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Título */}
            <Text variant="headlineSmall" style={styles.title}>
              {notification.title}
            </Text>

            {/* Mensaje */}
            <Text variant="bodyMedium" style={styles.message}>
              {notification.message}
            </Text>

            {/* Indicador de acción requerida */}
            {notification.actionRequired && (
              <View style={styles.actionIndicator}>
                <Icon source="arrow-right-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodySmall" style={styles.actionText}>
                  Se requiere acción
                </Text>
              </View>
            )}
          </Card.Content>

          {/* Botones */}
          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.secondaryButton}
            >
              Cerrar
            </Button>
            <Button
              mode="contained"
              onPress={handleAccept}
              style={styles.primaryButton}
            >
              {notification.actionRequired ? 'Ver tarea' : 'Entendido'}
            </Button>
          </Card.Actions>
        </Card>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    margin: 20,
  },
  card: {
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  headerText: {
    alignItems: 'flex-end',
  },
  timeText: {
    opacity: 0.6,
    fontSize: 12,
  },
  urgentBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  urgentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  message: {
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.8,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#1976D2',
  },
  actions: {
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 0.4,
  },
  primaryButton: {
    flex: 0.5,
  },
}); 
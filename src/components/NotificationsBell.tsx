import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { 
  IconButton,
  Badge,
  Portal,
  Modal,
  Card,
  Text,
  Button,
  useTheme,
  Icon,
  Divider
} from 'react-native-paper';
import { Notification, NotificationType } from '@/types';

interface NotificationsBellProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationAction?: (notificationId: string, actionData?: any) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({
  notifications,
  unreadCount,
  onNotificationAction,
  onMarkAsRead,
  onMarkAllAsRead,
  open,
  onOpenChange,
  showTrigger = true,
}) => {
  const theme = useTheme();
  const [internalVisible, setInternalVisible] = useState(false);
  const isControlled = open !== undefined;
  const isModalVisible = isControlled ? !!open : internalVisible;
  const setVisible = (v: boolean) => {
    if (isControlled) {
      onOpenChange?.(v);
    } else {
      setInternalVisible(v);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return 'information';
      case NotificationType.WARNING:
        return 'alert';
      case NotificationType.ERROR:
        return 'alert-circle';
      case NotificationType.SUCCESS:
        return 'check-circle';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return theme.colors.primary;
      case NotificationType.WARNING:
        return theme.colors.secondary;
      case NotificationType.ERROR:
        return theme.colors.error;
      case NotificationType.SUCCESS:
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) {
      return `Hoy ${formatTime(date)}`;
    } else if (isYesterday) {
      return `Ayer ${formatTime(date)}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    console.log('🔔 NotificationsBell: Notification clicked!', {
      id: notification.id,
      title: notification.title,
      actionData: notification.actionData,
      actionRequired: notification.actionRequired
    });
    
    // Primero ejecutar la navegación (no bloquear por marcar como leída)
    const taskId = notification.actionData?.taskId;
    
    if (taskId) {
      console.log('🚀 Triggering navigation action with taskId:', taskId);
      onNotificationAction?.(notification.id, notification.actionData);
      setIsModalVisible(false);
      // Optimista: marcar como leída en cuanto navega
      if (!notification.isRead) {
        onMarkAsRead?.(notification.id);
      }
    } else {
      console.log('❌ No actionData.taskId found:', notification.actionData);
      console.log('ℹ️ This notification needs to be updated with a real taskId');
      // Cerrar modal aunque no haya navegación
      setIsModalVisible(false);
    }
    
    // Luego intentar marcar como leída (sin bloquear navegación)
    if (!notification.isRead) {
      console.log('📝 Attempting to mark notification as read:', notification.id);
      // Solo marcar como leída si no es una notificación simulada
      if (!notification.id.startsWith('simulated-')) {
        onMarkAsRead?.(notification.id);
      } else {
        console.log('⚠️ Skipping mark as read for simulated notification');
      }
    }
  };

  const handleMarkAllRead = () => {
    onMarkAllAsRead?.();
  };

  return (
    <>
      {/* Ícono de campana con badge */}
      {showTrigger && (
        <View style={styles.bellContainer}>
          <IconButton
            icon={unreadCount > 0 ? 'bell' : 'bell-outline'}
            size={24}
            onPress={() => setVisible(true)}
            iconColor={unreadCount > 0 ? theme.colors.primary : theme.colors.onSurface}
            accessibilityLabel={unreadCount > 0 ? 'Notificaciones sin leer' : 'Notificaciones'}
          />
          {unreadCount > 0 && (
            <Badge style={[styles.badge, { backgroundColor: theme.colors.error }]} size={18}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </View>
      )}

      {/* Modal de notificaciones */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title="Notificaciones"
              subtitle={`${notifications.length} total, ${unreadCount} sin leer`}
              left={(props) => <Icon {...props} source="bell" />}
              right={(props) => (
                <View style={styles.headerActions}>
                  {unreadCount > 0 && (
                    <Button
                      mode="text"
                      onPress={handleMarkAllRead}
                      style={styles.markAllButton}
                    >
                      Marcar todas
                    </Button>
                  )}
                  <IconButton
                    {...props}
                    icon="close"
                    onPress={() => setVisible(false)}
                  />
                </View>
              )}
            />
            
            <Card.Content style={styles.modalContent}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon source="bell-sleep" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No hay notificaciones
                  </Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.notificationsList} 
                  showsVerticalScrollIndicator={false}
                >
                  {notifications.map((notification, index) => (
                    <View key={notification.id}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.notificationItem,
                          !notification.isRead && styles.unreadNotification,
                          pressed && styles.notificationPressed,
                        ]}
                        onPress={() => {
                          console.log('🖱️ Pressable onPress triggered for:', notification.title);
                          handleNotificationPress(notification);
                        }}
                      >
                        <View style={styles.notificationHeader}>
                          <View style={styles.notificationIconRow}>
                            <Icon
                              source={getNotificationIcon(notification.type)}
                              size={20}
                              color={getNotificationColor(notification.type)}
                            />
                            <Text
                              variant="bodyMedium"
                              style={[
                                styles.notificationTitle,
                                !notification.isRead && styles.unreadText,
                              ]}
                            >
                              {notification.title}
                            </Text>
                          </View>
                          
                          <Text variant="bodySmall" style={styles.notificationTime}>
                            {notification.createdAt ? formatDate(notification.createdAt) : 'Ahora'}
                          </Text>
                        </View>

                        <Text variant="bodySmall" style={styles.notificationMessage}>
                          {notification.message}
                        </Text>

                        {!notification.isRead && (
                          <View style={styles.readIndicator}>
                            <View style={styles.unreadDot} />
                          </View>
                        )}
                      </Pressable>
                      
                      {index < notifications.length - 1 && (
                        <Divider style={styles.divider} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f44336',
  },
  modalContainer: {
    margin: 20,
    marginTop: 60,
    marginBottom: 60,
  },
  modalCard: {
    maxHeight: '90%',
  },
  modalContent: {
    padding: 0,
    paddingBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
    minHeight: 60, // Asegurar área de toque mínima
  },
  unreadNotification: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
  },
  notificationPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTitle: {
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationTime: {
    opacity: 0.6,
    fontSize: 12,
  },
  notificationMessage: {
    opacity: 0.8,
    lineHeight: 18,
    paddingLeft: 28,
    marginBottom: 8,
  },

  readIndicator: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  divider: {
    marginHorizontal: 16,
  },
}); 
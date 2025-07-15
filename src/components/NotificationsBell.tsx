import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({
  notifications,
  unreadCount,
  onNotificationAction,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const theme = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

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
    if (!notification.isRead) {
      onMarkAsRead?.(notification.id);
    }
    
    if (notification.actionRequired && notification.actionData) {
      onNotificationAction?.(notification.id, notification.actionData);
      setIsModalVisible(false);
    }
  };

  const handleMarkAllRead = () => {
    onMarkAllAsRead?.();
  };

  return (
    <>
      {/* Ícono de campana con badge */}
      <View style={styles.bellContainer}>
        <IconButton
          icon="bell"
          size={24}
          onPress={() => setIsModalVisible(true)}
        />
        {unreadCount > 0 && (
          <Badge style={styles.badge} size={18}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </View>

      {/* Modal de notificaciones */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
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
                    onPress={() => setIsModalVisible(false)}
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
                      <View
                        style={[
                          styles.notificationItem,
                          !notification.isRead && styles.unreadNotification,
                        ]}
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
                            {formatDate(notification.createdAt)}
                          </Text>
                        </View>

                        <Text variant="bodySmall" style={styles.notificationMessage}>
                          {notification.message}
                        </Text>

                        {notification.actionRequired && (
                          <View style={styles.actionRow}>
                            <Button
                              mode="contained-tonal"
                              onPress={() => handleNotificationPress(notification)}
                              style={styles.actionButton}
                              labelStyle={styles.actionButtonLabel}
                            >
                              {notification.actionLabel || 'Ver más'}
                            </Button>
                          </View>
                        )}

                        {!notification.isRead && (
                          <View style={styles.readIndicator}>
                            <View style={styles.unreadDot} />
                          </View>
                        )}
                      </View>
                      
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
  },
  unreadNotification: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
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
  actionRow: {
    paddingLeft: 28,
    marginTop: 4,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  actionButtonLabel: {
    fontSize: 12,
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
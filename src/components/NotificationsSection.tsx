import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, useTheme, Icon, Badge } from 'react-native-paper';
import { WorkDay, NotificationType } from '@/types';

interface NotificationsSectionProps {
  workDay: WorkDay;
  onNotificationAction: (notificationId: string, actionData?: any) => void;
  onMarkAsRead: (notificationId: string) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  workDay,
  onNotificationAction,
  onMarkAsRead,
}) => {
  const theme = useTheme();
  const { notifications } = workDay;

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionRequired && notification.actionData) {
      onNotificationAction(notification.id, notification.actionData);
    }
  };

  if (notifications.length === 0) {
    return (
      <Card style={styles.container}>
        <Card.Content style={styles.emptyContent}>
          <Icon source="bell-sleep" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.emptyText}>
            No hay notificaciones
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon source="bell" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.title}>
              Notificaciones
            </Text>
            {unreadCount > 0 && (
              <Badge style={styles.badge}>{unreadCount}</Badge>
            )}
          </View>
        </View>

        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {notifications.map((notification) => (
            <View
              key={notification.id}
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
                  {formatTime(notification.createdAt)}
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
          ))}
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  content: {
    paddingVertical: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    opacity: 0.6,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontWeight: '500',
  },
  badge: {
    marginLeft: 8,
  },
  notificationsList: {
    maxHeight: 300,
  },
  notificationItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    position: 'relative',
  },
  unreadNotification: {
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
  },
  notificationMessage: {
    opacity: 0.8,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  actionButtonLabel: {
    fontSize: 12,
  },
  readIndicator: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
});

export default NotificationsSection; 
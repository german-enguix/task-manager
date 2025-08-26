import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Appbar, Avatar, useTheme, Icon } from 'react-native-paper';
import { NotificationsBell } from '@/components/NotificationsBell';

interface AppBarProps {
  title: string;
  avatarUri?: string | null;
  displayName?: string;
  onAvatarPress?: () => void;
  onBellPress?: () => void; // fallback simple
  showBell?: boolean;
  notifications?: any[];
  unreadCount?: number;
  onNotificationAction?: (notificationId: string, actionData?: any) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  isNotificationsOpen?: boolean;
  onNotificationsOpenChange?: (open: boolean) => void;
  onRequestMarkAllFromApp?: () => void;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  avatarUri,
  displayName,
  onAvatarPress,
  onBellPress,
  showBell = true,
  notifications = [],
  unreadCount = 0,
  onNotificationAction,
  onMarkAsRead,
  onMarkAllAsRead,
  isNotificationsOpen,
  onNotificationsOpenChange,
  onRequestMarkAllFromApp,
}) => {
  const theme = useTheme();

  return (
    <Appbar.Header
      statusBarHeight={0}
      elevated={false}
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.leftContainer}>
        <Pressable onPress={onAvatarPress} hitSlop={8} style={styles.avatarWrapper}>
          {avatarUri ? (
            <Avatar.Image size={48} source={{ uri: avatarUri }} />
          ) : (
            <Avatar.Text 
              size={48}
              label={(displayName || 'Usuario')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map(p => p[0]?.toUpperCase())
                .join('') || 'U'}
              color={theme.colors.onSecondaryContainer}
              style={{ backgroundColor: theme.colors.secondaryContainer }}
            />
          )}
        </Pressable>
      </View>
      <Appbar.Content
        title={title}
        titleStyle={{ 
          color: theme.colors.onSurface, 
          textAlign: 'center',
          fontSize: 28,
          lineHeight: 36,
          fontWeight: '500',
        }}
      />
      {showBell ? (
        <View style={styles.sideAction}>
          <NotificationsBell
            notifications={notifications as any}
            unreadCount={unreadCount as number}
            onNotificationAction={onNotificationAction}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead || onRequestMarkAllFromApp}
            open={isNotificationsOpen}
            onOpenChange={onNotificationsOpenChange}
            showTrigger={true}
          />
        </View>
      ) : (
        // Espaciador para mantener el título centrado cuando no hay icono a la derecha
        <View style={styles.rightSpacer} />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    height: 80,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rightSpacer: {
    width: 48,
  },
  leftContainer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sideAction: {
    width: 48,
  },
});

export default AppBar;



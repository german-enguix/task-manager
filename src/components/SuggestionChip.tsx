import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';

export interface SuggestionChipProps {
  label: string;
  icon?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({ label, icon, onPress, disabled }) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        {
          borderColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.surface,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <Icon source={icon} size={18} color={theme.colors.onSurfaceVariant} />
        )}
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, fontWeight: '500', lineHeight: 20 }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingLeft: 8,
    paddingRight: 16,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default SuggestionChip;



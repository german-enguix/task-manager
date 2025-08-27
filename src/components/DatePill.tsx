import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';

interface DatePillProps {
  label: string; // Ej: "Mié, 27 de Agosto"
  onPrev: () => void;
  onNext: () => void;
  onOpenPicker?: () => void; // opcional si se quiere abrir datepicker al tocar
}

export const DatePill: React.FC<DatePillProps> = ({
  label,
  onPrev,
  onNext,
  onOpenPicker,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onOpenPicker}
        style={[styles.pill, { backgroundColor: theme.colors.secondaryContainer }]}
      >
        <IconButton
          icon="chevron-left"
          size={20}
          onPress={onPrev}
          style={styles.iconInside}
          iconColor={theme.colors.onSecondaryContainer}
        />
        <Text
          numberOfLines={1}
          variant="bodyLarge"
          style={[styles.label, { color: theme.colors.onSecondaryContainer }]}
        >
          {label}
        </Text>
        <IconButton
          icon="chevron-right"
          size={20}
          onPress={onNext}
          style={styles.iconInside}
          iconColor={theme.colors.onSecondaryContainer}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  pill: {
    flex: 1,
    borderRadius: 99,
    height: 48,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconInside: {
    margin: 0,
    width: 36,
    height: 36,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});

export default DatePill;



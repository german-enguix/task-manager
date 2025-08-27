import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface ProgressRowProps {
  label: string;
  valueLabel?: string; // ej. "1/3" o "30%"
  progress: number; // 0..1
  variant?: 'default' | 'large';
}

export const ProgressRow: React.FC<ProgressRowProps> = ({ label, valueLabel, progress, variant = 'default' }) => {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.container, variant === 'large' && styles.containerLarge]}>
      <View style={styles.header}>
        <Text
          variant={variant === 'large' ? 'titleMedium' : 'bodyMedium'}
          style={[
            styles.label,
            variant === 'large' && styles.labelLarge,
            { color: theme.colors.onSurface },
          ]}
        > {label} </Text>
        {valueLabel ? (
          <Text
            variant={variant === 'large' ? 'titleMedium' : 'bodyMedium'}
            style={[styles.value, variant === 'large' && styles.valueLarge, { color: theme.colors.onSurfaceVariant }]}
          > {valueLabel} </Text>
        ) : null}
      </View>
      <View style={[styles.bar, variant === 'large' && styles.barLarge, { backgroundColor: theme.colors.surfaceVariant }]}> 
        <View style={[styles.fill, variant === 'large' && styles.fillLarge, { width: `${pct * 100}%`, backgroundColor: theme.colors.primary }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  containerLarge: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontWeight: '500',
  },
  labelLarge: {
    fontWeight: '600',
  },
  value: {
  },
  valueLarge: {
    fontWeight: '600',
  },
  bar: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barLarge: {
    height: 12,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  fillLarge: {
    height: '100%',
  },
});

export default ProgressRow;



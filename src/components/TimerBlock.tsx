import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, useTheme, Button } from 'react-native-paper';

interface TimerBlockProps {
  displayText: string; // Ej. 07:00:00
  isRunning: boolean;
  activeTasksCount: number;
  dayOnlyDurationSeconds: number; // Para desglose "Día"
  tasksCurrentTimeSeconds: number; // Para desglose "Tareas"
  primaryLabel?: string;
  primaryIcon?: string;
  onPrimaryPress?: () => void;
  primaryDisabled?: boolean;
}

export const TimerBlock: React.FC<TimerBlockProps> = ({
  displayText,
  isRunning,
  activeTasksCount,
  dayOnlyDurationSeconds,
  tasksCurrentTimeSeconds,
  primaryLabel,
  primaryIcon,
  onPrimaryPress,
  primaryDisabled,
}) => {
  const theme = useTheme();

  const format = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={styles.section}> 
      <Text variant="bodySmall" style={[styles.captionTop, { color: theme.colors.onSurfaceVariant }]}> Tiempo total trabajado </Text>
      <View style={styles.timerContainer}>
        <Text
          variant="displayLarge"
          style={[
            styles.timerDisplay,
            { color: theme.colors.primary }
          ]}
        >
          {displayText}
        </Text>
        {/* Indicador de estado oculto según requerimiento: no mostrar copy ni icono cuando está activo */}
      </View>

      {primaryLabel && onPrimaryPress && (
        <Button
          mode="contained"
          icon={primaryIcon}
          onPress={onPrimaryPress}
          disabled={primaryDisabled}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
        >
          {primaryLabel}
        </Button>
      )}

      {/* Se elimina el desglose y el divisor inferior según Figma */}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerDisplay: {
    fontWeight: '700',
    letterSpacing: 0.15,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 100,
    alignSelf: 'stretch',
  },
  primaryButtonContent: {
    height: 56,
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  runningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownText: {
    fontSize: 12,
    opacity: 0.8,
  },
  caption: {
    opacity: 0.7,
    marginTop: 8,
  },
  captionTop: {
    opacity: 0.7,
    alignSelf: 'center',
    marginBottom: 8,
  },
});

export default TimerBlock;



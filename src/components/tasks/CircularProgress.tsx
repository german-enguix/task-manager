import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text, Icon, useTheme } from 'react-native-paper';

export interface CircularProgressProps {
  size?: number; // diameter
  strokeWidth?: number;
  value: number; // 0..1
  label?: string | number;
  labelVariant?: 'labelSmall' | 'labelMedium' | 'labelLarge';
  labelColor?: string;
  trackColor?: string;
  progressColor?: string;
  centerIcon?: string;
  centerIconSize?: number;
  centerIconColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 48,
  strokeWidth = 4,
  value,
  label,
  labelVariant = 'labelLarge',
  labelColor,
  trackColor,
  progressColor,
  centerIcon,
  centerIconSize = 18,
  centerIconColor,
}) => {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, value));
  const dashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? theme.colors.outlineVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor ?? theme.colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {(centerIcon || label !== undefined) && (
        <View style={StyleSheet.absoluteFill}
        >
          <View style={styles.center}>
            {centerIcon ? (
              <Icon source={centerIcon} size={centerIconSize} color={centerIconColor ?? (labelColor ?? theme.colors.onSurface)} />
            ) : (
              <Text variant={labelVariant} style={{ color: labelColor ?? theme.colors.onSurface }}>
                {label}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularProgress;

import React from 'react';
import { Chip, useTheme } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface PaperChipProps {
  label: string;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium';
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

export const PaperChip: React.FC<PaperChipProps> = ({
  label,
  variant = 'filled',
  size = 'medium',
  style,
  ...props
}) => {
  const theme = useTheme();
  const chipStyle = [
    styles.chip,
    variant === 'outlined' && { borderColor: theme.colors.outline },
    variant === 'filled' && { backgroundColor: theme.colors.secondaryContainer },
    size === 'small' && styles.small,
    style,
  ];

  return (
    <Chip
      style={chipStyle}
      mode={variant === 'outlined' ? 'outlined' : 'flat'}
      textStyle={{ color: variant === 'filled' ? theme.colors.onSecondaryContainer : undefined }}
      {...props}>
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    margin: 4,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
  small: {
    height: 28,
  },
});

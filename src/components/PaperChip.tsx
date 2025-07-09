import React from 'react';
import { Chip } from 'react-native-paper';
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
  const chipStyle = [
    styles.chip,
    variant === 'outlined' && styles.outlined,
    size === 'small' && styles.small,
    style,
  ];

  return (
    <Chip
      style={chipStyle}
      mode={variant === 'outlined' ? 'outlined' : 'flat'}
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

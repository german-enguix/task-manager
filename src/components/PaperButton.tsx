import React from 'react';
import { Button as PaperButton, ButtonProps, useTheme } from 'react-native-paper';

interface PaperButtonWrapperProps extends Omit<ButtonProps, 'children'> {
  title: string;
  variant?: 'contained' | 'outlined' | 'text';
}

export const PaperButtonComponent: React.FC<PaperButtonWrapperProps> = ({
  title,
  variant = 'contained',
  ...props
}) => {
  const theme = useTheme();

  const getButtonMode = () => {
    switch (variant) {
      case 'contained':
        return 'contained';
      case 'outlined':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const { style, disabled } = props as ButtonProps;

  const buttonColor = variant === 'contained' ? theme.colors.primary : undefined;
  const textColor = variant === 'contained' ? theme.colors.onPrimary : theme.colors.primary;

  const mergedStyle = [
    style,
    variant === 'outlined' && { borderColor: theme.colors.outline },
  ];

  return (
    <PaperButton
      mode={getButtonMode()}
      buttonColor={buttonColor}
      textColor={textColor}
      style={mergedStyle}
      {...props}>
      {title}
    </PaperButton>
  );
};

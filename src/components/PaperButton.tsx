import React from 'react';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';

interface PaperButtonWrapperProps extends Omit<ButtonProps, 'children'> {
  title: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
}

export const PaperButtonComponent: React.FC<PaperButtonWrapperProps> = ({
  title,
  variant = 'contained',
  size = 'medium',
  ...props
}) => {
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

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { height: 36 };
      case 'medium':
        return { height: 44 };
      case 'large':
        return { height: 52 };
      default:
        return { height: 44 };
    }
  };

  return (
    <PaperButton
      mode={getButtonMode()}
      contentStyle={getButtonSize()}
      {...props}>
      {title}
    </PaperButton>
  );
};

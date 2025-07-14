import React from 'react';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';

interface PaperButtonWrapperProps extends Omit<ButtonProps, 'children'> {
  title: string;
  variant?: 'contained' | 'outlined' | 'text';
}

export const PaperButtonComponent: React.FC<PaperButtonWrapperProps> = ({
  title,
  variant = 'contained',
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

  return (
    <PaperButton
      mode={getButtonMode()}
      {...props}>
      {title}
    </PaperButton>
  );
};

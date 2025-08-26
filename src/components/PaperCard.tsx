import React from 'react';
import { Card, Title, Paragraph, useTheme } from 'react-native-paper';

interface PaperCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: any;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export const PaperCard: React.FC<PaperCardProps> = ({
  title,
  subtitle,
  children,
  style,
  variant = 'elevated',
}) => {
  const theme = useTheme();

  const mode: 'elevated' | 'outlined' = variant === 'outlined' ? 'outlined' : 'elevated';

  const backgroundColor =
    variant === 'filled'
      ? theme.colors.surfaceVariant
      : theme.colors.surface;

  const containerStyle = [
    { backgroundColor },
    variant === 'outlined' && { borderColor: theme.colors.outlineVariant },
    style,
  ];

  return (
    <Card mode={mode} style={containerStyle}>
      <Card.Content>
        {title && <Title style={{ color: theme.colors.onSurface }}>{title}</Title>}
        {subtitle && (
          <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Paragraph>
        )}
        {children}
      </Card.Content>
    </Card>
  );
};

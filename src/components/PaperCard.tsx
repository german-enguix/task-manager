import React from 'react';
import { Card, Title, Paragraph } from 'react-native-paper';

interface PaperCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: any;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  title,
  subtitle,
  children,
  style,
}) => {
  return (
    <Card style={style}>
      <Card.Content>
        {title && <Title>{title}</Title>}
        {subtitle && <Paragraph>{subtitle}</Paragraph>}
        {children}
      </Card.Content>
    </Card>
  );
};

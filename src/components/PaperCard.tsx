import React from 'react';
import { Card, Title, Paragraph } from 'react-native-paper';
import { StyleSheet } from 'react-native';

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
    <Card style={[styles.card, style]}>
      <Card.Content>
        {title && <Title style={styles.title}>{title}</Title>}
        {subtitle && <Paragraph style={styles.subtitle}>{subtitle}</Paragraph>}
        {children}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
});

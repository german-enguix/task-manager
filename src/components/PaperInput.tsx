import React from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

interface PaperInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: any;
}

export const PaperInput: React.FC<PaperInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  helperText,
  required = false,
  style,
  ...props
}) => {
  const displayLabel = required ? `${label} *` : label;

  return (
    <View style={styles.container}>
      <TextInput
        label={displayLabel}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        error={!!error}
        style={[styles.input, style]}
        {...props}
      />
      {(error || helperText) && (
        <HelperText
          type={error ? 'error' : 'info'}
          visible={!!(error || helperText)}>
          {error || helperText}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
});

import React, { useState } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  TextInput,
  Icon,
  Divider,
  useTheme,
} from 'react-native-paper';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { ProblemReportType, ProblemSeverity } from '@/types';

interface ProblemReportDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    reportType: ProblemReportType,
    severity: ProblemSeverity,
    title: string,
    description: string
  ) => Promise<void>;
  isSubmitting: boolean;
}

export const ProblemReportDialog: React.FC<ProblemReportDialogProps> = ({
  visible,
  onDismiss,
  onSubmit,
  isSubmitting,
}) => {
  const theme = useTheme();
  const [step, setStep] = useState(1);
  const [reportType, setReportType] = useState<ProblemReportType | null>(null);
  const [severity, setSeverity] = useState<ProblemSeverity | null>(null);
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    // Reset form
    setStep(1);
    setReportType(null);
    setSeverity(null);
    setNotes('');
    onDismiss();
  };

  const handleSubmit = async () => {
    if (!reportType || !severity || !notes.trim()) {
      return;
    }

    try {
      await onSubmit(reportType, severity, 'Problema reportado', notes.trim());
      handleClose();
    } catch (error) {
      console.error('Error submitting problem report:', error);
    }
  };

  const handleNextStep = () => {
    if (reportType) {
      setStep(2);
    }
  };

  const handleBackStep = () => {
    setStep(1);
  };

  const getReportTypeIcon = (type: ProblemReportType) => {
    switch (type) {
      case 'blocking_issue': return 'block-helper';
      case 'missing_tools': return 'toolbox-outline';
      case 'unsafe_conditions': return 'shield-alert-outline';
      case 'technical_issue': return 'tools';
      case 'access_denied': return 'lock-outline';
      case 'material_shortage': return 'package-variant';
      case 'weather_conditions': return 'weather-lightning-rainy';
      case 'other': return 'alert-circle-outline';
      default: return 'alert';
    }
  };

  const reportTypeOptions = [
    { 
      value: 'blocking_issue', 
      label: 'Problema que impide continuar',
      description: 'No puedo seguir trabajando'
    },
    { 
      value: 'missing_tools', 
      label: 'Herramientas faltantes',
      description: 'No tengo las herramientas necesarias'
    },
    { 
      value: 'unsafe_conditions', 
      label: 'Condiciones inseguras',
      description: 'Es peligroso continuar'
    },
    { 
      value: 'technical_issue', 
      label: 'Problema técnico',
      description: 'Fallo en equipos o sistemas'
    },
    { 
      value: 'access_denied', 
      label: 'Acceso denegado',
      description: 'No puedo acceder al área'
    },
    { 
      value: 'material_shortage', 
      label: 'Falta de materiales',
      description: 'No hay suficientes materiales'
    },
    { 
      value: 'weather_conditions', 
      label: 'Condiciones climáticas',
      description: 'El clima impide trabajar'
    },
    { 
      value: 'other', 
      label: 'Otro problema',
      description: 'Algo diferente a lo anterior'
    },
  ];

  const severityOptions = [
    { 
      value: 'low', 
      label: 'Bajo', 
      color: '#4CAF50',
      description: 'Puedo continuar con demora'
    },
    { 
      value: 'medium', 
      label: 'Medio', 
      color: '#FF9800',
      description: 'Afecta el progreso normal'
    },
    { 
      value: 'high', 
      label: 'Alto', 
      color: '#FF5722',
      description: 'Problema serio, necesito ayuda'
    },
    { 
      value: 'critical', 
      label: 'Crítico', 
      color: '#F44336',
      description: 'Emergencia, atención inmediata'
    },
  ];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
        <Dialog.Title>
          {step === 1 ? 'Tipo de problema' : 'Severidad del problema'}
        </Dialog.Title>

        <Dialog.ScrollArea>
          <ScrollView style={styles.content}>
            {step === 1 ? (
              // PASO 1: Tipo de problema
              <View>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  ¿Qué tipo de problema estás experimentando?
                </Text>
                
                <View style={styles.optionsContainer}>
                  {reportTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.option,
                        reportType === option.value && styles.selectedOption
                      ]}
                      onPress={() => setReportType(option.value as ProblemReportType)}
                    >
                      <View style={styles.optionContent}>
                        <Icon
                          source={getReportTypeIcon(option.value as ProblemReportType)}
                          size={24}
                          color={reportType === option.value ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                        <View style={styles.optionText}>
                          <Text 
                            variant="bodyLarge" 
                            style={[
                              styles.optionLabel,
                              reportType === option.value && { color: theme.colors.primary }
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text 
                            variant="bodySmall" 
                            style={styles.optionDescription}
                          >
                            {option.description}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // PASO 2: Severidad y notas
              <View>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  ¿Qué tan severo es el problema?
                </Text>
                
                <View style={styles.optionsContainer}>
                  {severityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.severityOption,
                        severity === option.value && [
                          styles.selectedSeverityOption,
                          { borderColor: option.color }
                        ]
                      ]}
                      onPress={() => setSeverity(option.value as ProblemSeverity)}
                    >
                      <View style={styles.severityContent}>
                        <View style={[styles.severityIndicator, { backgroundColor: option.color }]} />
                        <View style={styles.severityText}>
                          <Text 
                            variant="bodyLarge" 
                            style={[
                              styles.severityLabel,
                              severity === option.value && { color: option.color }
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text 
                            variant="bodySmall" 
                            style={styles.optionDescription}
                          >
                            {option.description}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <Divider style={styles.divider} />

                <TextInput
                  label="Notas"
                  value={notes}
                  onChangeText={setNotes}
                  style={styles.notesInput}
                  placeholder="Describe el problema con más detalle..."
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          {step === 1 ? (
            <>
              <Button onPress={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleNextStep}
                disabled={!reportType}
              >
                Siguiente
              </Button>
            </>
          ) : (
            <>
              <Button onPress={handleBackStep} disabled={isSubmitting}>
                Atrás
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={isSubmitting || !severity || !notes.trim()}
                loading={isSubmitting}
              >
                Reportar
              </Button>
            </>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  content: {
    paddingHorizontal: 0,
  },
  subtitle: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  selectedOption: {
    borderColor: 'rgb(103, 80, 164)',
    backgroundColor: 'rgba(103, 80, 164, 0.08)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    opacity: 0.6,
  },
  severityOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  selectedSeverityOption: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  severityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityText: {
    marginLeft: 16,
    flex: 1,
  },
  severityLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  divider: {
    marginVertical: 20,
  },
  notesInput: {
    marginTop: 8,
  },
}); 
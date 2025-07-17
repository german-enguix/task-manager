import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Portal,
  Dialog,
  Text,
  Button,
  List,
  Divider,
  useTheme,
  Icon,
  TextInput,
  Chip,
} from 'react-native-paper';

// Definir tipos directamente aquí para evitar problemas de importación
enum ProblemReportType {
  BLOCKING_ISSUE = 'blocking_issue',
  MISSING_TOOLS = 'missing_tools',
  UNSAFE_CONDITIONS = 'unsafe_conditions',
  TECHNICAL_ISSUE = 'technical_issue',
  ACCESS_DENIED = 'access_denied',
  MATERIAL_SHORTAGE = 'material_shortage',
  WEATHER_CONDITIONS = 'weather_conditions',
  OTHER = 'other',
}

enum ProblemSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface ProblemReportTypeConfig {
  type: ProblemReportType;
  title: string;
  description: string;
  icon: string;
  suggestedSeverity: ProblemSeverity;
}

const PROBLEM_REPORT_TYPES: ProblemReportTypeConfig[] = [
  {
    type: ProblemReportType.BLOCKING_ISSUE,
    title: 'Problema que bloquea la tarea',
    description: 'No puedo continuar con la tarea debido a este problema',
    icon: 'block-helper',
    suggestedSeverity: ProblemSeverity.HIGH,
  },
  {
    type: ProblemReportType.MISSING_TOOLS,
    title: 'Herramientas faltantes',
    description: 'Faltan herramientas o equipos necesarios para la tarea',
    icon: 'toolbox-outline',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.UNSAFE_CONDITIONS,
    title: 'Condiciones inseguras',
    description: 'Las condiciones de trabajo no son seguras',
    icon: 'shield-alert-outline',
    suggestedSeverity: ProblemSeverity.CRITICAL,
  },
  {
    type: ProblemReportType.TECHNICAL_ISSUE,
    title: 'Problema técnico',
    description: 'Error técnico o mal funcionamiento de equipos',
    icon: 'tools',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.ACCESS_DENIED,
    title: 'Acceso denegado',
    description: 'No tengo acceso a la ubicación o recursos necesarios',
    icon: 'lock-outline',
    suggestedSeverity: ProblemSeverity.HIGH,
  },
  {
    type: ProblemReportType.MATERIAL_SHORTAGE,
    title: 'Falta de materiales',
    description: 'Materiales insuficientes o faltantes',
    icon: 'package-variant',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.WEATHER_CONDITIONS,
    title: 'Condiciones climáticas',
    description: 'El clima impide realizar la tarea de forma segura',
    icon: 'weather-lightning-rainy',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.OTHER,
    title: 'Otro problema',
    description: 'Problema no categorizado en las opciones anteriores',
    icon: 'alert-circle-outline',
    suggestedSeverity: ProblemSeverity.LOW,
  },
];

interface ProblemReportDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    reportType: ProblemReportType,
    severity: ProblemSeverity,
    title: string,
    description: string
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export const ProblemReportDialog: React.FC<ProblemReportDialogProps> = ({
  visible,
  onDismiss,
  onSubmit,
  isSubmitting = false,
}) => {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState<ProblemReportTypeConfig | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<ProblemSeverity | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'type' | 'details'>('type');

  console.log('🔍 ProblemReportDialog rendered, visible:', visible, 'step:', step);

  // Resetear estado al abrir/cerrar el diálogo
  React.useEffect(() => {
    if (visible) {
      setSelectedType(null);
      setSelectedSeverity(null);
      setNotes('');
      setStep('type');
    }
  }, [visible]);

  const handleTypeSelection = (typeConfig: ProblemReportTypeConfig) => {
    console.log('🎯 Type selected:', typeConfig.type);
    setSelectedType(typeConfig);
    setSelectedSeverity(typeConfig.suggestedSeverity);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedSeverity) {
      console.log('❌ Missing data for submit');
      return;
    }

    console.log('📝 Submitting report:', {
      type: selectedType.type,
      severity: selectedSeverity,
      title: selectedType.title,
      description: notes.trim() || selectedType.description
    });

    try {
      await onSubmit(
        selectedType.type,
        selectedSeverity,
        selectedType.title,
        notes.trim() || selectedType.description
      );
      onDismiss();
    } catch (error) {
      console.error('Error submitting problem report:', error);
    }
  };

  const getSeverityColor = (severity: ProblemSeverity) => {
    switch (severity) {
      case ProblemSeverity.CRITICAL:
        return theme.colors.error;
      case ProblemSeverity.HIGH:
        return '#FF6B35';
      case ProblemSeverity.MEDIUM:
        return theme.colors.primary;
      case ProblemSeverity.LOW:
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  const getSeverityLabel = (severity: ProblemSeverity) => {
    switch (severity) {
      case ProblemSeverity.CRITICAL:
        return 'Crítico';
      case ProblemSeverity.HIGH:
        return 'Alto';
      case ProblemSeverity.MEDIUM:
        return 'Medio';
      case ProblemSeverity.LOW:
        return 'Bajo';
      default:
        return severity;
    }
  };

  const renderTypeSelection = () => (
    <View>
      <Text variant="headlineSmall" style={styles.dialogTitle}>
        ¿Qué tipo de problema quieres reportar?
      </Text>
      <Text variant="bodyMedium" style={styles.dialogSubtitle}>
        Selecciona el tipo que mejor describa tu situación
      </Text>
      
      <ScrollView style={styles.typesList} showsVerticalScrollIndicator={false}>
        {PROBLEM_REPORT_TYPES.map((typeConfig, index) => (
          <View key={typeConfig.type}>
            <List.Item
              title={typeConfig.title}
              description={typeConfig.description}
              onPress={() => handleTypeSelection(typeConfig)}
              left={(props) => (
                <View style={styles.iconContainer}>
                  <Icon
                    source={typeConfig.icon}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
              )}
              right={(props) => (
                <Icon
                  source="chevron-right"
                  size={20}
                  color={theme.colors.outline}
                />
              )}
              style={styles.typeItem}
            />
            {index < PROBLEM_REPORT_TYPES.length - 1 && (
              <Divider style={styles.typeDivider} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderDetailsForm = () => (
    <View>
      <Text variant="headlineSmall" style={styles.dialogTitle}>
        Detalles del problema
      </Text>
      
      {/* Tipo seleccionado */}
      <View style={styles.selectedTypeContainer}>
        <Icon
          source={selectedType?.icon || 'alert'}
          size={20}
          color={theme.colors.primary}
        />
        <Text variant="bodyMedium" style={styles.selectedTypeText}>
          {selectedType?.title}
        </Text>
      </View>

      {/* Severidad */}
      <Text variant="titleSmall" style={styles.fieldLabel}>
        Nivel de severidad
      </Text>
      <View style={styles.severityContainer}>
        {[
          ProblemSeverity.LOW,
          ProblemSeverity.MEDIUM,
          ProblemSeverity.HIGH,
          ProblemSeverity.CRITICAL,
        ].map((severity) => (
          <Button
            key={severity}
            mode={selectedSeverity === severity ? 'contained' : 'outlined'}
            onPress={() => setSelectedSeverity(severity)}
            style={[
              styles.severityButton,
              selectedSeverity === severity && {
                backgroundColor: getSeverityColor(severity),
              }
            ]}
            labelStyle={styles.severityButtonText}
          >
            {getSeverityLabel(severity)}
          </Button>
        ))}
      </View>

      {/* Campo de notas */}
      <Text variant="titleSmall" style={styles.fieldLabel}>
        Notas adicionales (opcional)
      </Text>
      <TextInput
        mode="outlined"
        placeholder="Describe detalles específicos del problema..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={styles.notesInput}
        maxLength={500}
      />
    </View>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Content style={styles.dialogContent}>
          {step === 'type' ? renderTypeSelection() : renderDetailsForm()}
        </Dialog.Content>
        
        <Dialog.Actions style={styles.dialogActions}>
          {step === 'details' && (
            <Button
              mode="outlined"
              onPress={() => setStep('type')}
              disabled={isSubmitting}
              style={styles.actionButton}
            >
              Volver
            </Button>
          )}
          
          <Button
            mode="outlined"
            onPress={onDismiss}
            disabled={isSubmitting}
            style={styles.actionButton}
          >
            Cancelar
          </Button>
          
          {step === 'details' && (
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={
                isSubmitting ||
                !selectedType ||
                !selectedSeverity
              }
              loading={isSubmitting}
              style={styles.actionButton}
            >
              Reportar
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    marginHorizontal: 20,
    maxHeight: '90%',
  },
  dialogContent: {
    paddingBottom: 0,
  },
  dialogTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogSubtitle: {
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  typesList: {
    maxHeight: 400,
  },
  typeItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  typeDivider: {
    marginVertical: 4,
  },
  selectedTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  selectedTypeText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  fieldLabel: {
    marginBottom: 12,
    marginTop: 16,
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  severityButton: {
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
  },
  severityButtonText: {
    fontSize: 12,
  },
  notesInput: {
    marginBottom: 16,
    minHeight: 100,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
  },
  actionButton: {
    marginLeft: 8,
    minWidth: 80,
  },
}); 
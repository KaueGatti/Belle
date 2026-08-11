import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultiSelectField from './MultiSelectField';
import StepperList, { type StepperListOption } from './StepperList';
import { colors, spacing } from '../theme/colors';

interface CheckboxStepperProps {
  label?: string;
  placeholder?: string;
  options: StepperListOption[];
  onToggle: (value: string) => void;
  onIncrement: (value: string) => void;
  onDecrement: (value: string) => void;
  emptyMessage?: string;
  selectHint?: string;
}

// Select multivalor (combobox) para escolher itens + stepper de quantidade nos selecionados.
// Evita listar todos os itens com qtd 0 de uma vez.
export default function CheckboxStepper({
  label,
  placeholder = 'Selecionar',
  options,
  onToggle,
  onIncrement,
  onDecrement,
  emptyMessage = 'Nenhum item disponível',
  selectHint = 'Selecione os itens e defina a quantidade abaixo',
}: CheckboxStepperProps) {
  if (options.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }
  const selecionados = options.filter((o) => Number(o.qtd) > 0);
  return (
    <View>
      <MultiSelectField
        label={label}
        options={options}
        selected={selecionados.map((o) => o.value)}
        onToggle={onToggle}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
      />
      {selecionados.length > 0 ? (
        <View style={styles.stepWrap}>
          <Text style={styles.stepTitle}>Quantidade</Text>
          <StepperList
            options={selecionados}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            emptyMessage={emptyMessage}
          />
        </View>
      ) : (
        <Text style={styles.hint}>{selectHint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: spacing.md },
  stepWrap: { marginTop: spacing.sm },
  stepTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  hint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: spacing.sm },
});
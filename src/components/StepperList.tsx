import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QtyStepper from './QtyStepper';
import { colors, radius, spacing } from '../theme/colors';
import { formatCurrency } from '../utils/format';

export interface StepperListOption {
  value: string;
  label: string;
  subtitle?: string;
  price?: number;
  qtd: number;
  maxQtd?: number;
  disabled?: boolean;
  disabledReason?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface StepperListProps {
  options: StepperListOption[];
  onIncrement: (value: string) => void;
  onDecrement: (value: string) => void;
  emptyMessage?: string;
}

// Lista de itens com stepper de quantidade (serviços, produtos, pacotes).
export default function StepperList({ options, onIncrement, onDecrement, emptyMessage = 'Nenhum item disponível' }: StepperListProps) {
  if (options.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }
  return (
    <View style={styles.list}>
      {options.map((opt) => {
        const disabled = Boolean(opt.disabled);
        const atMax = !disabled && opt.qtd >= (opt.maxQtd ?? 99);
        return (
          <View key={opt.value} style={[styles.row, opt.qtd > 0 && styles.rowSelected, disabled && styles.rowDisabled]}>
            <View style={styles.iconWrap}>
              <Ionicons name={opt.icon || 'checkmark-circle-outline'} size={18} color={opt.qtd > 0 ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.subtitle ? <Text style={styles.subtitle}>{opt.subtitle}</Text> : null}
              {disabled && opt.disabledReason ? <Text style={styles.disabledText}>{opt.disabledReason}</Text> : null}
            </View>
            <View style={styles.right}>
              {opt.price ? <Text style={styles.price}>{formatCurrency(opt.price)}</Text> : null}
              <QtyStepper
                value={opt.qtd}
                onChange={(v) => {
                  if (v > opt.qtd) onIncrement(opt.value);
                  else onDecrement(opt.value);
                }}
                min={0}
                max={opt.maxQtd ?? 99}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '33' },
  rowDisabled: { opacity: 0.55 },
  iconWrap: { width: 30, alignItems: 'center' },
  info: { flex: 1, marginHorizontal: spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  disabledText: { fontSize: 11, color: colors.danger, marginTop: 1 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 2 },
});
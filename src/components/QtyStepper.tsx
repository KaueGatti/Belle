import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function QtyStepper({ value, onChange, min = 0, max = 99, size = 'md' }: QtyStepperProps) {
  const decrementDisabled = value <= min;
  const incrementDisabled = value >= max;
  const btnStyle = size === 'sm' ? styles.btnSm : styles.btn;
  const numStyle = size === 'sm' ? styles.numSm : styles.num;
  const iconSize = size === 'sm' ? 15 : 18;

  return (
    <View style={[styles.row, size === 'sm' ? styles.rowSm : null]}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={decrementDisabled}
        style={btnStyle}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={iconSize} color={decrementDisabled ? colors.textSecondary : colors.primary} />
      </TouchableOpacity>
      <Text style={numStyle}>{value}</Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={incrementDisabled}
        style={btnStyle}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={iconSize} color={incrementDisabled ? colors.textSecondary : colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  rowSm: { paddingVertical: 1 },
  btn: { padding: 6, borderRadius: 20 },
  btnSm: { padding: 4, borderRadius: 16 },
  num: {
    minWidth: 30,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  numSm: { minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
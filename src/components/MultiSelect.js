import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { formatCurrency } from '../utils/format';

// options: [{ label, value, price?, subtitle?, disabled? }] - seleção múltipla via checkboxes
export default function MultiSelect({ options, selected = [], onToggle, emptyMessage }) {
  if (options.length === 0) {
    return emptyMessage ? <Text style={styles.empty}>{emptyMessage}</Text> : null;
  }

  return (
    <View>
      {options.map((opt) => {
        const ativo = selected.includes(opt.value);
        const desabilitado = opt.disabled;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.option, ativo && styles.optionAtiva, desabilitado && styles.optionDesabilitada]}
            onPress={() => {
              if (!desabilitado) onToggle(opt.value);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.check, ativo && styles.checkAtivo]}>
              {ativo ? <Ionicons name="checkmark" size={16} color={colors.textInverse} /> : null}
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.subtitle ? <Text style={styles.subtitle}>{opt.subtitle}</Text> : null}
            </View>
            {opt.price != null ? <Text style={styles.price}>{formatCurrency(opt.price)}</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontSize: 13, paddingVertical: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionAtiva: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '33' },
  optionDesabilitada: { opacity: 0.45 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
});

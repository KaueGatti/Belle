import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';

const MAP = {
  pendente: { bg: colors.warningLight, fg: colors.warning, label: 'Pendente' },
  quitado: { bg: colors.successLight, fg: colors.success, label: 'Quitado' },
  atrasado: { bg: colors.dangerLight, fg: colors.danger, label: 'Atrasado' },
  agendado: { bg: colors.infoLight, fg: colors.info, label: 'Agendado' },
  concluido: { bg: colors.successLight, fg: colors.success, label: 'Concluído' },
  cancelado: { bg: colors.dangerLight, fg: colors.danger, label: 'Cancelado' },
};

export default function StatusBadge({ status, label }) {
  const cfg = MAP[status] || { bg: colors.surfaceAlt, fg: colors.textSecondary, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.fg }]}>{label || cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MultiSelect from './MultiSelect';
import { colors, radius, spacing } from '../theme/colors';

// Select que abre um modal com checkboxes para seleção múltipla.
// options: [{ label, value, price? }] | selected: [] | onToggle(id)
export default function MultiSelectField({
  label,
  options,
  selected = [],
  onToggle,
  placeholder = 'Selecionar',
  required = false,
  emptyMessage = 'Nenhuma opção disponível',
}) {
  const [open, setOpen] = useState(false);
  const selecionados = options.filter((o) => selected.includes(o.value));
  const resumo = selecionados.map((o) => o.label).join(', ');

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <Text
          style={[styles.fieldText, selecionados.length === 0 && { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {resumo || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label || 'Selecione'}</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              <MultiSelect options={options} selected={selected} onToggle={onToggle} emptyMessage={emptyMessage} />
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Concluir</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  fieldText: { fontSize: 15, color: colors.textPrimary, flex: 1, marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(46,33,38,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  cancelBtn: { alignItems: 'center', paddingTop: spacing.md },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
});

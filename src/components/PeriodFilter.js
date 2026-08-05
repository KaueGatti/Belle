import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import DateField from './DateField';
import { colors, spacing, radius } from '../theme/colors';
import { periodRange, todayISO } from '../utils/format';

// value: null (todos) ou { key, start, end }. onChange recebe o mesmo formato.
const OPTIONS = [
  { key: null, label: 'Todos' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'ontem', label: 'Ontem' },
  { key: 'amanha', label: 'Amanhã' },
  { key: 'semana', label: 'Essa Semana' },
  { key: 'mes', label: 'Esse Mês' },
  { key: 'custom', label: 'Período' },
];

export default function PeriodFilter({ value, onChange }) {
  const key = value?.key ?? null;
  const [customStart, setCustomStart] = useState(value?.start || todayISO());
  const [customEnd, setCustomEnd] = useState(value?.end || todayISO());

  useEffect(() => {
    if (value?.key === 'custom') {
      if (value.start) setCustomStart(value.start);
      if (value.end) setCustomEnd(value.end);
    }
  }, [value]);

  function select(optKey) {
    if (optKey === null) {
      onChange(null);
      return;
    }
    const range = periodRange(optKey, customStart, customEnd);
    onChange({ key: optKey, start: range.start, end: range.end });
  }

  function touchCustom(s, e) {
    setCustomStart(s);
    setCustomEnd(e);
    onChange({ key: 'custom', start: s, end: e });
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {OPTIONS.map((opt) => {
          const active = opt.key === key;
          return (
            <TouchableOpacity
              key={String(opt.key)}
              onPress={() => select(opt.key)}
              activeOpacity={0.8}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {key === 'custom' ? (
        <View style={styles.dateRow}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <DateField label="De" value={customStart} onChange={(d) => touchCustom(d, customEnd)} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label="Até" value={customEnd} onChange={(d) => touchCustom(customStart, d)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { paddingRight: spacing.md, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  dateRow: { flexDirection: 'row', marginTop: spacing.sm },
});
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../theme/colors';
import { timeToString } from '../utils/format';

// value: string 'HH:mm'
export default function TimeField({ label, value, onChange, required = false }) {
  const [show, setShow] = useState(false);

  function toDate() {
    const d = new Date();
    if (value) {
      const [h, m] = value.split(':').map(Number);
      d.setHours(h || 0, m || 0, 0, 0);
    }
    return d;
  }

  function handleChange(event, selectedDate) {
    setShow(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }
    if (selectedDate) {
      onChange(timeToString(selectedDate));
    }
    if (Platform.OS === 'android') setShow(false);
  }

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)} activeOpacity={0.75}>
        <Text style={styles.fieldText}>{value || 'Selecionar horário'}</Text>
        <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker value={toDate()} mode="time" is24Hour display="default" onChange={handleChange} />
      )}
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
  fieldText: { fontSize: 15, color: colors.textPrimary },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme/colors';

export default function ScreenTitle({ children }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{children}</Text>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  accent: { width: 46, height: 5, borderRadius: 3, marginTop: 6 },
});

import React, { useRef, type ReactNode } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/colors';

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<ButtonVariant, { fg: string; border: string; bg?: string; gradient?: [string, string] }> = {
  primary: { fg: colors.textInverse, border: 'transparent', gradient: [colors.primary, colors.primaryDark] },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  danger: { bg: colors.danger, fg: colors.textInverse, border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.96, speed: 40, bounciness: 0, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, speed: 40, bounciness: 0, useNativeDriver: true }).start();
  }

  const content = loading ? (
    <ActivityIndicator color={v.fg} />
  ) : (
    <>
      {icon}
      <Text style={[styles.text, { color: v.fg }, Boolean(icon) && { marginLeft: 6 }]}>{title}</Text>
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.shadow, (disabled || loading) && { opacity: 0.5 }]}
      >
        {v.gradient ? (
          <LinearGradient
            colors={v.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, styles.gradientBorder]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[styles.base, { backgroundColor: v.bg, borderColor: v.border }]}>{content}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  gradientBorder: { borderColor: 'transparent' },
  text: { fontSize: 15, fontWeight: '700' },
});
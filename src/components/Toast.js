import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme/colors';

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: 'checkmark-circle', color: colors.success, bg: colors.successLight },
  error: { icon: 'alert-circle', color: colors.danger, bg: colors.dangerLight },
  info: { icon: 'information-circle', color: colors.info, bg: colors.infoLight },
};

export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const hideTimer = useRef(null);

  const showToast = useCallback(
    (message, type = 'success') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type });
      opacity.setValue(0);
      translateY.setValue(-24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, speed: 14, bounciness: 6, useNativeDriver: true }),
      ]).start();
      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -24, duration: 220, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 2600);
    },
    [opacity, translateY]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrapper,
            { top: insets.top + 10, opacity, transform: [{ translateY }] },
          ]}
        >
          <Animated.View style={[styles.toast, { backgroundColor: ICONS[toast.type].bg }]}>
            <Ionicons name={ICONS[toast.type].icon} size={20} color={ICONS[toast.type].color} />
            <Text style={[styles.text, { color: ICONS[toast.type].color }]}>{toast.message}</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de um ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 5,
  },
  text: { fontSize: 14, fontWeight: '700' },
});

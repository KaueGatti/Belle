import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, View, Text, Pressable, BackHandler, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

interface AppModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  children?: ReactNode;
}

// Bottom sheet estilizado no design do app. Overlay in-screen (não é RN Modal)
// para o header nativo permanecer tocável (ex.: botão "Sair").
export default function AppModal({ visible, onClose, title, icon, iconColor = colors.primary, children }: AppModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {title ? (
          <View style={styles.header}>
            {icon ? (
              <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
              </View>
            ) : null}
            <Text style={[styles.title, icon ? { marginLeft: spacing.sm } : null]}>{title}</Text>
          </View>
        ) : null}
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46,33,38,0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
});

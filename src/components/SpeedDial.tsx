import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

export interface SpeedDialAction {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  bottomOffset?: number;
}

// Botão flutuante em leque: ao tocar, expande as ações acima do botão.
// Estilizado no design do app (gradiente primary→accent).
export default function SpeedDial({ actions, bottomOffset = 0 }: SpeedDialProps) {
  const [open, setOpen] = useState(false);
  const nav = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const itemsAnim = useRef(new Animated.Value(0)).current;

  function openMenu() {
    setOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(itemsAnim, { toValue: 1, speed: 18, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }

  function closeMenu() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => setOpen(false));
    itemsAnim.setValue(0);
  }

  function handleAction(action: SpeedDialAction) {
    closeMenu();
    action.onPress();
  }

  return (
    <>
      <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu}>
        <Pressable style={styles.backdrop} onPress={closeMenu}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <View style={[styles.actions, { paddingBottom: bottomOffset + 76 }]}>
              {actions.map((action, i) => {
                const delay = (actions.length - i) * 30;
                return (
                  <Animated.View
                    key={action.key}
                    style={{
                      opacity: itemsAnim,
                      transform: [
                        { translateY: itemsAnim.interpolate({ inputRange: [0, 1], outputRange: [18 + delay, 0] }) },
                      ],
                    }}
                  >
                    <TouchableOpacity style={styles.actionRow} onPress={() => handleAction(action)} activeOpacity={0.85}>
                      <View style={styles.actionLabel}>
                        <Text style={styles.actionText}>{action.label}</Text>
                      </View>
                      <View style={styles.actionIconWrap}>
                        <Ionicons name={action.icon} size={20} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      <Animated.View style={[styles.fabWrap, { bottom: bottomOffset + 20 }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={open ? closeMenu : openMenu} style={{ borderRadius: radius.pill }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Ionicons name={open ? 'close' : 'add'} size={28} color={colors.textInverse} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46,33,38,0.45)' },
  overlay: { flex: 1 },
  actions: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  actionLabel: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  fabWrap: {
    position: 'absolute',
    right: 20,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 8,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
import React, { type ReactNode } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
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

// Modal (bottom sheet) estilizado no design do app. Backdrop escurece e fecha ao tocar fora.
export default function AppModal({ visible, onClose, title, icon, iconColor = colors.primary, children }: AppModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46,33,38,0.45)', justifyContent: 'flex-end' },
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
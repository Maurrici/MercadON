import { colors, radius, spacing } from '@/theme';
import { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  title?: string;
  onRequestClose: () => void;
  scrollable?: boolean;
  showCloseButton?: boolean;
}>;

export function BottomSheet({
  visible,
  title,
  onRequestClose,
  scrollable = false,
  showCloseButton = false,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const content = scrollable ? (
    <ScrollView
      bounces={false}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onRequestClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fechar"
          accessibilityRole="button"
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          {title ? (
            <View style={styles.heading}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton ? (
                <Pressable
                  accessibilityLabel="Fechar"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onRequestClose}
                  style={styles.close}
                >
                  <Text style={styles.closeLabel}>×</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <View style={styles.content}>{content}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.48)' },
  sheet: {
    maxHeight: '88%',
    paddingTop: 32,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  handle: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  heading: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeLabel: { fontSize: 24, lineHeight: 28, color: colors.textSecondary },
  content: { marginTop: 13 },
});

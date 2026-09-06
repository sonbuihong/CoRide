/**
 * Web fallback cho DraggableBottomSheet.
 *
 * Trên web, @gorhom/bottom-sheet gọi findNodeHandle (không được hỗ trợ),
 * nên chúng ta dùng một panel cố định ở cuối màn hình thay thế.
 * Interface giống hệt bản native để các màn hình không cần thay đổi gì.
 */
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from '../../theme/tokens';

import type { SharedValue } from 'react-native-reanimated';

export interface DraggableBottomSheetRef {
  snapToIndex: (index: number) => void;
}

interface DraggableBottomSheetProps {
  snapPoints?: (number | string)[];
  initialSnapIndex?: number;
  onSnapChange?: (index: number, fraction: number) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Bỏ qua trên web – chỉ tồn tại để giữ type compatibility với bản native */
  animatedPosition?: SharedValue<number>;
}

const DEFAULT_SNAP_POINTS = [0.35, 0.62, 0.92];

function toFraction(p: number | string): number {
  if (typeof p === 'string') {
    return parseFloat(p) / 100;
  }
  return p <= 1 ? p : p / 100;
}

export const DraggableBottomSheet = forwardRef<
  DraggableBottomSheetRef,
  DraggableBottomSheetProps
>(function DraggableBottomSheet(
  {
    snapPoints = DEFAULT_SNAP_POINTS,
    initialSnapIndex = 0,
    onSnapChange,
    children,
    footer,
  },
  ref,
) {
  const [activeIndex, setActiveIndex] = useState(initialSnapIndex);

  const fractions = snapPoints.map(toFraction);

  useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      const clamped = Math.max(0, Math.min(index, snapPoints.length - 1));
      setActiveIndex(clamped);
      onSnapChange?.(clamped, fractions[clamped] ?? fractions[0]);
    },
  }));

  // Chiều cao tương ứng với snap point hiện tại
  const heightPercent = `${Math.round((fractions[activeIndex] ?? fractions[0]) * 100)}%`;

  return (
    <View style={[styles.container, { height: heightPercent as any }]}>
      {/* Handle indicator giả lập */}
      <View style={styles.handleBar} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footer ? 80 : spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer && (
        <View style={styles.footerContainer}>{footer}</View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    bottom: 0,
    left: 0,
    maxWidth: layout.maxContentWidth,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    width: '100%',
    // Đổ bóng phía trên để giống bottom-sheet native
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 24,
  },
  handleBar: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong || '#E5E7EB',
    borderRadius: 2,
    height: 4,
    marginVertical: 8,
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  footerContainer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border || '#F3F4F6',
    borderTopWidth: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
});

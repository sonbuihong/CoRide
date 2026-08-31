import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetFooter, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';

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
  animatedPosition?: SharedValue<number>;
}

export const DraggableBottomSheet = forwardRef<
  DraggableBottomSheetRef,
  DraggableBottomSheetProps
>(function DraggableBottomSheet(
  {
    snapPoints = [0.35, 0.62, 0.92],
    initialSnapIndex = 0,
    onSnapChange,
    children,
    footer,
    animatedPosition,
  },
  ref,
) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(initialSnapIndex);
  
  // Transform percentage to string for @gorhom/bottom-sheet (e.g., [0.34, 0.62, 1] -> ['34%', '62%', '100%'])
  const gorhomSnapPoints = useMemo(() => {
    return snapPoints.map((p) => { if (typeof p === "number") { return p <= 1 ? `${Math.round(p * 100)}%` : p; } return p; });
  }, [snapPoints]);

  useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      bottomSheetRef.current?.snapToIndex(index);
    },
  }));

  const renderFooter = useCallback(
    (props: any) => {
      if (!footer) return null;
      return (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View style={[styles.footerContainer, { paddingBottom: insets.bottom || spacing.md }]}>
            {footer}
          </View>
        </BottomSheetFooter>
      );
    },
    [footer, insets.bottom]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={initialSnapIndex}
      snapPoints={gorhomSnapPoints}
      enableDynamicSizing={false}
      enableOverDrag={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      animatedPosition={animatedPosition}
      onChange={(index) => {
        setActiveIndex(index);
        if (onSnapChange && index >= 0) {
          const selected = snapPoints[index];
          onSnapChange(index, typeof selected === 'number' ? selected : Number.parseFloat(selected) / 100);
        }
      }}
      footerComponent={footer ? renderFooter : undefined}
      handleIndicatorStyle={{ backgroundColor: colors.borderStrong || '#E5E7EB', width: 40 }}
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 26 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footer ? 140 : insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={activeIndex > 0}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0, // Padding should be handled by children if needed
  },
  footerContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#F3F4F6',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  }
});

/**
 * Web implementation cho DraggableBottomSheet.
 *
 * Hỗ trợ kéo thả (drag/pan gesture), nhấp chuột chuyển nấc (click-to-toggle)
 * và nút mở rộng/thu gọn trực quan cho trải nghiệm web/desktop tối ưu.
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors, layout, radius, spacing } from '../../theme/tokens';

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
    animatedPosition,
  },
  ref,
) {
  const { height: windowHeight } = useWindowDimensions();

  const fractions = useMemo(() => snapPoints.map(toFraction), [snapPoints]);
  const pixelSnapPoints = useMemo(
    () => fractions.map((f) => Math.round(f * windowHeight)),
    [fractions, windowHeight],
  );

  const [activeIndex, setActiveIndex] = useState(initialSnapIndex);
  const [isDragging, setIsDragging] = useState(false);

  const activeIndexRef = useRef(initialSnapIndex);
  activeIndexRef.current = activeIndex;

  const initialHeight = pixelSnapPoints[initialSnapIndex] ?? Math.round(windowHeight * 0.35);
  const heightAnim = useRef(new Animated.Value(initialHeight)).current;
  const currentHeightRef = useRef(initialHeight);
  const dragStartHeightRef = useRef(initialHeight);
  const isDraggingRef = useRef(false);

  // Cập nhật animatedPosition (Reanimated) nếu có
  const updateAnimatedPosition = useCallback(
    (sheetHeight: number) => {
      if (animatedPosition) {
        animatedPosition.value = Math.max(0, windowHeight - sheetHeight);
      }
    },
    [animatedPosition, windowHeight],
  );

  // Chuyển tới snap point cụ thể kèm hiệu ứng chuyển động mượt mà
  const animateToSnapIndex = useCallback(
    (targetIndex: number) => {
      const clamped = Math.max(0, Math.min(targetIndex, snapPoints.length - 1));
      const targetH = pixelSnapPoints[clamped] ?? Math.round(windowHeight * fractions[clamped]);

      setActiveIndex(clamped);
      activeIndexRef.current = clamped;
      currentHeightRef.current = targetH;

      Animated.timing(heightAnim, {
        toValue: targetH,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        updateAnimatedPosition(targetH);
      });

      updateAnimatedPosition(targetH);
      onSnapChange?.(clamped, fractions[clamped] ?? fractions[0]);
    },
    [fractions, heightAnim, onSnapChange, pixelSnapPoints, snapPoints.length, updateAnimatedPosition, windowHeight],
  );

  useImperativeHandle(
    ref,
    () => ({
      snapToIndex: (index: number) => {
        animateToSnapIndex(index);
      },
    }),
    [animateToSnapIndex],
  );

  // Khi kích thước màn hình thay đổi, tự động căn chỉnh lại độ cao
  useEffect(() => {
    if (!isDraggingRef.current) {
      const targetH = pixelSnapPoints[activeIndexRef.current] ?? Math.round(windowHeight * 0.35);
      currentHeightRef.current = targetH;
      heightAnim.setValue(targetH);
      updateAnimatedPosition(targetH);
    }
  }, [heightAnim, pixelSnapPoints, updateAnimatedPosition, windowHeight]);

  // PanResponder hỗ trợ kéo thả bằng chuột / cảm ứng
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_evt, gesture) => Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          dragStartHeightRef.current = currentHeightRef.current;
          setIsDragging(true);
        },
        onPanResponderMove: (_evt, gesture) => {
          // Kéo lên (dy âm) -> tăng chiều cao; kéo xuống (dy dương) -> giảm chiều cao
          const minH = pixelSnapPoints[0] * 0.85;
          const maxH = pixelSnapPoints[pixelSnapPoints.length - 1] * 1.02;
          const nextH = Math.max(minH, Math.min(maxH, dragStartHeightRef.current - gesture.dy));
          currentHeightRef.current = nextH;
          heightAnim.setValue(nextH);
          updateAnimatedPosition(nextH);
        },
        onPanResponderRelease: (_evt, gesture) => {
          isDraggingRef.current = false;
          setIsDragging(false);

          const isClick = Math.abs(gesture.dy) < 6 && Math.abs(gesture.dx) < 6;
          if (isClick) {
            // Nhấp chuột vào thanh kéo: chuyển tiếp nấc tiếp theo (0 -> 1 -> 2 -> 0)
            const nextIndex = (activeIndexRef.current + 1) % snapPoints.length;
            animateToSnapIndex(nextIndex);
            return;
          }

          // Dựa vào hướng và vận tốc vuốt
          let targetIndex = activeIndexRef.current;
          if (gesture.vy < -0.3) {
            // Vuốt mạnh lên trên -> bung lên nấc tiếp theo
            targetIndex = Math.min(activeIndexRef.current + 1, snapPoints.length - 1);
          } else if (gesture.vy > 0.3) {
            // Vuốt mạnh xuống dưới -> thu gọn xuống nấc thấp hơn
            targetIndex = Math.max(activeIndexRef.current - 1, 0);
          } else {
            // Thả chậm -> snap vào điểm gần nhất
            const finalH = dragStartHeightRef.current - gesture.dy;
            let minDiff = Infinity;
            pixelSnapPoints.forEach((sp, idx) => {
              const diff = Math.abs(sp - finalH);
              if (diff < minDiff) {
                minDiff = diff;
                targetIndex = idx;
              }
            });
          }

          animateToSnapIndex(targetIndex);
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          setIsDragging(false);
          animateToSnapIndex(activeIndexRef.current);
        },
      }),
    [animateToSnapIndex, heightAnim, pixelSnapPoints, snapPoints.length, updateAnimatedPosition],
  );

  const isMaxSnap = activeIndex === snapPoints.length - 1;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: heightAnim,
          maxHeight: windowHeight * 0.96,
        },
      ]}
    >
      {/* Thanh Handle Header với tương tác Kéo/Nhấn */}
      <View style={styles.headerBar}>
        {/* Vùng cảm ứng kéo thả chính */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.handleTouchArea,
            { cursor: isDragging ? 'grabbing' : 'grab' } as any,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Kéo hoặc nhấn để mở rộng hoặc thu gọn chi tiết chuyến đi"
        >
          <View style={styles.handleBar} />
        </View>

        {/* Nút bấm nhanh mở rộng toàn màn hình / thu gọn */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => {
            animateToSnapIndex(isMaxSnap ? 0 : snapPoints.length - 1);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isMaxSnap ? 'Thu gọn chi tiết' : 'Mở rộng toàn màn hình'}
        >
          <View style={{ transform: [{ rotate: isMaxSnap ? '0deg' : '180deg' }] }}>
            <ChevronDown size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Nội dung cuộn bên trong */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footer ? 80 : spacing.xxl },
        ]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer && <View style={styles.footerContainer}>{footer}</View>}
    </Animated.View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 24,
    zIndex: 20,
  },
  headerBar: {
    alignItems: 'center',
    borderBottomColor: colors.border || '#F3F4F6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
    position: 'relative',
    width: '100%',
  },
  handleTouchArea: {
    alignItems: 'center',
    flex: 1,
    height: 34,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong || '#E5E7EB',
    borderRadius: 2,
    height: 5,
    width: 48,
  },
  expandButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary || '#F3F4F6',
    borderRadius: radius.full,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: 3,
    width: 28,
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
    elevation: 10,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
});

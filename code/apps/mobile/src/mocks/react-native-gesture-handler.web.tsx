/**
 * Web mock cho react-native-gesture-handler.
 *
 * Thư viện gốc gọi findNodeHandle nội bộ, không được hỗ trợ trên web.
 * File này export các stub tương thích để app web không bị crash.
 *
 * Được inject bởi metro.config.js khi platform === 'web'.
 */
import React from 'react';
import {
  View,
  ScrollView as RNScrollView,
  type ViewProps,
  type ScrollViewProps,
} from 'react-native';

// GestureHandlerRootView – chỉ cần render children trên web
export const GestureHandlerRootView = ({ style, children, ...rest }: ViewProps) => (
  <View style={[{ flex: 1 }, style]} {...rest}>
    {children}
  </View>
);

// Gesture stubs – trả về object giả để không crash khi config gesture
const noop = () => {};
const gestureStub = {
  onBegin: () => gestureStub,
  onStart: () => gestureStub,
  onActive: () => gestureStub,
  onEnd: () => gestureStub,
  onFinalize: () => gestureStub,
  onFail: () => gestureStub,
  onCancel: () => gestureStub,
  onTouchesDown: () => gestureStub,
  onTouchesMove: () => gestureStub,
  onTouchesUp: () => gestureStub,
  onTouchesCancelled: () => gestureStub,
  simultaneousWithExternalGesture: () => gestureStub,
  requireExternalGestureToFail: () => gestureStub,
  blocksExternalGesture: () => gestureStub,
  enabled: () => gestureStub,
  shouldCancelWhenOutside: () => gestureStub,
  hitSlop: () => gestureStub,
  activeCursor: () => gestureStub,
  mouseButton: () => gestureStub,
  runOnJS: () => gestureStub,
  withRef: () => gestureStub,
};

export const Gesture = {
  Tap: () => ({ ...gestureStub }),
  Pan: () => ({ ...gestureStub, activeOffset: () => gestureStub, failOffset: () => gestureStub, minDistance: () => gestureStub, maxPointers: () => gestureStub }),
  Pinch: () => ({ ...gestureStub }),
  Rotation: () => ({ ...gestureStub }),
  Fling: () => ({ ...gestureStub }),
  LongPress: () => ({ ...gestureStub }),
  Native: () => ({ ...gestureStub }),
  Manual: () => ({ ...gestureStub }),
  Race: (..._gestures: any[]) => gestureStub,
  Simultaneous: (..._gestures: any[]) => gestureStub,
  Exclusive: (..._gestures: any[]) => gestureStub,
};

// GestureDetector – trên web chỉ render children
export const GestureDetector = ({ children }: { gesture?: any; children?: React.ReactNode }) => (
  <>{children}</>
);

// ScrollView stub – dùng alias để tránh trùng tên với import
export const ScrollView: React.FC<ScrollViewProps & { children?: React.ReactNode }> =
  ({ children, ...props }) => <RNScrollView {...props}>{children}</RNScrollView>;

// Handler components stubs
export const TapGestureHandler = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const PanGestureHandler = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const PinchGestureHandler = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const RotationGestureHandler = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const FlingGestureHandler = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const LongPressGestureHandler = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const NativeViewGestureHandler = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const RawButton = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const BaseButton = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const RectButton = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const BorderlessButton = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const Swipeable = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
export const DrawerLayout = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;

// Animated components stubs
export const createNativeWrapper = (Component: any) => Component;

// State enums
export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

export const MouseButton = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
  BUTTON_4: 3,
  BUTTON_5: 4,
};

// enableExperimentalWebImplementation – no-op trên web
export const enableExperimentalWebImplementation = noop;
export const enableLegacyWebImplementation = noop;

// useAnimatedGestureHandler – stub (thường dùng với reanimated)
export const useAnimatedGestureHandler = () => ({});

export default {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  State,
  Directions,
};

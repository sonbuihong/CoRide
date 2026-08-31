import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

export interface NotificationSwipeRowHandle {
  close: () => void;
}

interface Props {
  actionWidth: number;
  children: React.ReactNode;
  onClose: () => void;
  onWillOpen: () => void;
  rightAction: React.ReactNode;
}

export const NotificationSwipeRow = forwardRef<NotificationSwipeRowHandle, Props>(function NotificationSwipeRow(
  { actionWidth, children, onClose, onWillOpen, rightAction },
  ref,
) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startOffset = useRef(0);
  const [open, setOpen] = useState(false);

  const settle = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) onWillOpen(); else onClose();
    Animated.timing(translateX, { duration: 180, toValue: nextOpen ? -actionWidth : 0, useNativeDriver: true }).start();
  };
  useImperativeHandle(ref, () => ({ close: () => settle(false) }));
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 5 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: () => { startOffset.current = open ? -actionWidth : 0; },
    onPanResponderMove: (_event, gesture) => translateX.setValue(Math.max(-actionWidth, Math.min(0, startOffset.current + gesture.dx))),
    onPanResponderRelease: (_event, gesture) => settle(startOffset.current + gesture.dx < -(actionWidth * 0.38)),
    onPanResponderTerminate: () => settle(open),
  });

  return (
    <View style={styles.shell}>
      <View style={[styles.action, { width: actionWidth }]}>{rightAction}</View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: { overflow: 'hidden', position: 'relative' },
  action: { bottom: 0, position: 'absolute', right: 0, top: 0 },
});

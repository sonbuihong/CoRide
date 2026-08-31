import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

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
  const swipeable = useRef<any>(null);

  useImperativeHandle(ref, () => ({ close: () => swipeable.current?.close() }), []);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={actionWidth * 0.38}
      overshootRight={false}
      dragOffsetFromLeftEdge={Number.MAX_SAFE_INTEGER}
      onSwipeableWillOpen={onWillOpen}
      onSwipeableClose={onClose}
      renderRightActions={() => rightAction}
    >
      {children}
    </ReanimatedSwipeable>
  );
});

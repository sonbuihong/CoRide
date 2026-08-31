import type React from 'react';

export interface NotificationSwipeRowHandle {
  close: () => void;
}

interface NotificationSwipeRowProps {
  actionWidth: number;
  children: React.ReactNode;
  onClose: () => void;
  onWillOpen: () => void;
  rightAction: React.ReactNode;
}

export const NotificationSwipeRow: React.ForwardRefExoticComponent<
  NotificationSwipeRowProps & React.RefAttributes<NotificationSwipeRowHandle>
>;

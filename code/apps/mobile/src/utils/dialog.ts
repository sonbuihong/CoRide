import { Alert, Platform } from 'react-native';

/**
 * Hiển thị hộp thoại xác nhận đa nền tảng (Web & Native).
 * Trên Web: Dùng window.confirm để không bị nuốt callback do Alert.alert rỗng trên React Native Web.
 * Trên Native: Dùng Alert.alert với 2 nút Hủy / Xác nhận.
 */
export const showConfirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onCancel?: () => void
) => {
  if (Platform.OS === 'web') {
    const text = title ? `${title}\n\n${message}` : message;
    const confirmed = typeof window !== 'undefined' ? window.confirm(text) : true;
    if (confirmed) {
      onConfirm();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      { text: confirmText, style: 'default', onPress: onConfirm },
    ]);
  }
};

/**
 * Hiển thị thông báo thông tin đa nền tảng.
 */
export const showInfoDialog = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    const text = title ? `${title}\n\n${message}` : message;
    if (typeof window !== 'undefined') {
      window.alert(text);
    }
    onOk?.();
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};

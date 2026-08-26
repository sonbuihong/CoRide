import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors } from '../../theme/tokens';

export function Divider({ style, ...props }: ViewProps) {
  return <View accessibilityRole="none" style={[styles.divider, style]} {...props} />;
}

const styles = StyleSheet.create({ divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, width: '100%' } });

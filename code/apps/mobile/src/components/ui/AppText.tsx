import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';

import { colors } from '../../theme/tokens';

export interface AppTextProps extends TextProps {
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'bodySmall' | 'caption' | 'button';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  weight = 'normal',
  className = '',
  style,
  children,
  ...props
}) => {
  const flatStyle = StyleSheet.flatten(style) || {};
  const baseStyle = flatStyle.color || /\btext-/.test(className) ? undefined : styles.base;

  return (
    <Text className={className} {...props} maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? 1} style={[baseStyle, variantStyles[variant], weightStyles[weight], style]}>
      {children}
    </Text>
  );
};

const variantStyles: Record<NonNullable<AppTextProps['variant']>, TextStyle> = {
  display: { fontSize: 30, lineHeight: 36 },
  h1: { fontSize: 24, lineHeight: 30 },
  h2: { fontSize: 20, lineHeight: 26 },
  h3: { fontSize: 18, lineHeight: 24 },
  title: { fontSize: 18, lineHeight: 27 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 21 },
  caption: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  button: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
};

const weightStyles: Record<NonNullable<AppTextProps['weight']>, TextStyle> = {
  normal: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

const styles = StyleSheet.create({ base: { color: colors.textPrimary } });

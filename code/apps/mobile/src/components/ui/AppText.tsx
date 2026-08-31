import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';

import { colors, typography } from '../../theme/tokens';

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
    <Text className={className} {...props} maxFontSizeMultiplier={props.maxFontSizeMultiplier} style={[baseStyle, variantStyles[variant], weightStyles[weight], style]}>
      {children}
    </Text>
  );
};

const variantStyles: Record<NonNullable<AppTextProps['variant']>, TextStyle> = {
  display: { fontSize: typography.display.fontSize, lineHeight: typography.display.lineHeight },
  h1: { fontSize: typography.heading1.fontSize, lineHeight: typography.heading1.lineHeight },
  h2: { fontSize: typography.heading2.fontSize, lineHeight: typography.heading2.lineHeight },
  h3: { fontSize: typography.heading3.fontSize, lineHeight: typography.heading3.lineHeight },
  title: { fontSize: 18, lineHeight: 27 },
  body: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
  bodySmall: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight },
  caption: { color: colors.textSecondary, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight },
  button: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight, textAlign: 'center' },
};

const weightStyles: Record<NonNullable<AppTextProps['weight']>, TextStyle> = {
  normal: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

const styles = StyleSheet.create({ base: { color: colors.textPrimary } });

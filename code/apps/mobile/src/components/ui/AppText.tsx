import { Text, TextProps, StyleSheet } from 'react-native';

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
  const hasColor = flatStyle.color || /\btext-/.test(className);
  const baseStyle = hasColor ? '' : 'text-text-primary';
  
  const variantStyles = {
    display: 'text-3xl leading-tight',
    h1: 'text-2xl leading-snug',
    h2: 'text-xl leading-snug',
    h3: 'text-lg leading-snug',
    title: 'text-lg leading-normal',
    body: 'text-base leading-normal',
    bodySmall: 'text-sm leading-normal',
    caption: 'text-xs text-text-secondary leading-normal',
    button: 'text-base text-center',
  };
  
  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const combinedStyles = `${baseStyle} ${variantStyles[variant]} ${weightStyles[weight]} ${className}`;

  return (
    <Text className={combinedStyles} {...props} style={style}>
      {children}
    </Text>
  );
};

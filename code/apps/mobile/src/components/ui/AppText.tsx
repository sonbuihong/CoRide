import { Text, TextProps } from 'react-native';

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
  children,
  ...props
}) => {
  const baseStyle = 'text-text-primary';
  
  const variantStyles = {
    display: 'text-4xl leading-tight',
    h1: 'text-3xl leading-snug',
    h2: 'text-2xl leading-snug',
    h3: 'text-lg leading-snug',
    title: 'text-xl leading-normal',
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
    <Text className={combinedStyles} {...props}>
      {children}
    </Text>
  );
};

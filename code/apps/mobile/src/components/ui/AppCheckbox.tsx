import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import { AppText } from './AppText';

export interface AppCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const AppCheckbox: React.FC<AppCheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={`flex-row items-center ${disabled ? 'opacity-50' : ''} ${className}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? '#0071E3' : '#FFFFFF',
          borderColor: checked ? '#0071E3' : '#94A3B8',
          borderWidth: 2,
        }}
      >
        {checked && <Check size={15} color="#FFFFFF" strokeWidth={3.5} />}
      </View>
      {label && (
        <AppText
          variant="bodySmall"
          weight="medium"
          style={{ marginLeft: 8, color: '#1E293B' }}
        >
          {label}
        </AppText>
      )}
    </TouchableOpacity>
  );
};

import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { ACTIVITY_SEGMENTS, type ActivitySegment } from './activity.types';
import { SEGMENT_ACCESSIBILITY_LABELS, SEGMENT_LABELS } from './activity.utils';

interface Props {
  compact?: boolean;
  selected: ActivitySegment;
  role: 'PASSENGER' | 'DRIVER';
  onChange: (segment: ActivitySegment) => void;
}

export function ActivitySegmentedControl({ compact = false, selected, role, onChange }: Props) {
  const tabRefs = useRef<(React.ElementRef<typeof Pressable> | null)[]>([]);

  const moveSelection = (direction: -1 | 1) => {
    const current = ACTIVITY_SEGMENTS.indexOf(selected);
    const next = (current + direction + ACTIVITY_SEGMENTS.length) % ACTIVITY_SEGMENTS.length;
    onChange(ACTIVITY_SEGMENTS[next]);
    requestAnimationFrame(() => tabRefs.current[next]?.focus?.());
  };

  return (
    <View accessibilityLabel="Bộ lọc hoạt động" accessibilityRole="tablist" style={[styles.container, compact && styles.containerCompact]}>
      {ACTIVITY_SEGMENTS.map((segment, index) => (
        <ActivityTab
          key={segment}
          ref={(value) => { tabRefs.current[index] = value; }}
          segment={segment}
          selected={selected === segment}
          role={role}
          compact={compact}
          onPress={() => onChange(segment)}
          onMove={moveSelection}
        />
      ))}
    </View>
  );
}

interface TabProps {
  segment: ActivitySegment;
  selected: boolean;
  role: 'PASSENGER' | 'DRIVER';
  compact: boolean;
  onPress: () => void;
  onMove: (direction: -1 | 1) => void;
}

const ActivityTab = React.forwardRef<React.ElementRef<typeof Pressable>, TabProps>(function ActivityTab({
  segment,
  selected,
  role,
  compact,
  onPress,
  onMove,
}, ref) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const accent = role === 'DRIVER' ? colors.navigationDriver : colors.primary;
  const webKeyboardProps = Platform.OS === 'web' ? {
    tabIndex: selected ? (0 as const) : (-1 as const),
    onKeyDown: (event: any) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); onMove(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); onMove(-1); }
    },
  } : {};

  return (
    <View style={styles.tabSlot}>
      <Pressable
        ref={ref}
        accessibilityLabel={`Hiển thị chuyến ${SEGMENT_ACCESSIBILITY_LABELS[segment].toLocaleLowerCase('vi-VN')}`}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tab,
          compact && styles.tabCompact,
          pressed && styles.tabPressed,
          Platform.OS === 'web' && ({ cursor: 'pointer', outlineStyle: 'none' } as any),
        ]}
        {...webKeyboardProps}
      >
        <View
          pointerEvents="none"
          style={[
            styles.tabSurface,
            selected && [styles.tabSelected, { borderColor: accent }],
            hovered && !selected && styles.tabInteraction,
            focused && { borderColor: accent },
          ]}
        >
          <AppText
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
            minimumFontScale={0.8}
            numberOfLines={1}
            variant="caption"
            weight={selected ? 'semibold' : 'medium'}
            style={[styles.label, { color: selected ? accent : colors.textSecondary }]}
          >
            {SEGMENT_LABELS[segment]}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.input,
    flexDirection: 'row',
    minHeight: layout.minTouchTarget + spacing.xs * 2,
    overflow: 'hidden',
    padding: spacing.xs,
    width: '100%',
  },
  containerCompact: { padding: spacing.xxs },
  tabSlot: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  tab: {
    alignItems: 'stretch',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    minWidth: 0,
  },
  tabCompact: { minWidth: 0 },
  tabPressed: { opacity: 0.72 },
  tabSurface: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 2,
    minHeight: layout.minTouchTarget,
    overflow: 'hidden',
    paddingHorizontal: 2,
  },
  tabSelected: { backgroundColor: colors.surface },
  tabInteraction: { backgroundColor: colors.navigationPressed },
  label: { flexShrink: 1, includeFontPadding: false, textAlign: 'center', width: '100%' },
});

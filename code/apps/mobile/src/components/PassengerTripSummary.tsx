import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Navigation, CalendarClock, ChevronRight } from 'lucide-react-native';
import { format } from 'date-fns';
import { AppText } from './ui/AppText';
import { activityService } from '../services/activity.service';
import { colors, radius, spacing, layout } from '../theme/tokens';
import { getRealtimeRefetchInterval, useSocketConnection } from '../hooks/useSocketConnection';
import { useAppStore } from '../stores/useAppStore';
import { getActivityActions, STATUS_LABELS } from '../features/activities/activity.utils';

export function PassengerTripSummary() {
  const router = useRouter();
  const appMode = useAppStore((state) => state.appMode);
  const socketConnected = useSocketConnection();
  
  const queryEnabled = appMode === 'passenger';

  const activeQuery = useQuery({
    queryKey: ['trip-summary', 'passenger', 'ACTIVE'],
    queryFn: () => activityService.getActivities('PASSENGER', 'ACTIVE', undefined, 1),
    enabled: queryEnabled,
    refetchInterval: getRealtimeRefetchInterval(socketConnected),
  });

  const upcomingQuery = useQuery({
    queryKey: ['trip-summary', 'passenger', 'UPCOMING'],
    queryFn: () => activityService.getActivities('PASSENGER', 'UPCOMING', undefined, 1),
    enabled: queryEnabled,
    refetchInterval: getRealtimeRefetchInterval(socketConnected),
  });

  const activeItem = activeQuery.data?.items?.[0];
  const upcomingItem = upcomingQuery.data?.items?.[0];

  if (!activeItem && !upcomingItem) return null;

  const renderCard = (item: any, type: 'ACTIVE' | 'UPCOMING') => {
    const isUpcoming = type === 'UPCOMING';
    const primaryAction = getActivityActions(item, 'PASSENGER').find(a => a.kind === 'primary');
    
    const handlePress = () => {
      if (primaryAction) {
        if (primaryAction.params) {
          router.push({ pathname: primaryAction.route as never, params: primaryAction.params } as never);
        } else {
          router.push(primaryAction.route as never);
        }
      }
    };

    const statusText = STATUS_LABELS[item.status] || item.status;
    
    const badgeColor = isUpcoming ? colors.warning : colors.primary;
    const badgeBg = isUpcoming ? colors.warningSoft : colors.primarySoft;
    const BadgeIcon = isUpcoming ? CalendarClock : Navigation;

    return (
      <View key={item.id} style={styles.cardWrapper}>
        <Pressable
          accessibilityRole="button"
          onPress={handlePress}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: badgeBg }]}>
              <BadgeIcon size={20} color={badgeColor} />
            </View>
            
            <View style={styles.textContainer}>
              <AppText variant="bodySmall" weight="semibold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                {isUpcoming ? 'Sắp tới' : 'Đang diễn ra'}: {item.destination}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {statusText} • {item.departureTime ? format(new Date(item.departureTime), 'HH:mm - dd/MM') : 'Ngay bây giờ'}
              </AppText>
            </View>
            
            <ChevronRight size={20} color={colors.textTertiary} />
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {activeItem ? renderCard(activeItem, 'ACTIVE') : renderCard(upcomingItem!, 'UPCOMING')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, // Reduced padding
    width: '100%',
  },
  cardWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  pressable: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: colors.navigationPressed,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
});

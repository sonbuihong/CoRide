import React, { memo } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare, Phone, Star } from 'lucide-react-native';

import { AppText } from '../../components/ui/AppText';
import { colors, radius, spacing } from '../../theme/tokens';

interface DriverSummaryUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  rating?: number | null;
  phone?: string | null;
}

interface DriverSummaryVehicle {
  licensePlate?: string | null;
  color?: string | null;
  model?: string | null;
  type?: string | null;
}

interface PassengerDriverSummaryProps {
  rideId: string;
  driver: DriverSummaryUser;
  vehicle?: DriverSummaryVehicle | null;
}

export const PassengerDriverSummary = memo(function PassengerDriverSummary({
  rideId,
  driver,
  vehicle,
}: PassengerDriverSummaryProps) {
  const router = useRouter();
  const driverName = [driver.firstName, driver.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const avatarUri = driver.avatarUrl || driver.avatar;

  // Visual text for rating: do NOT fake 5.0 if no rating
  const hasRating = driver.rating != null && driver.rating > 0;
  const ratingText = hasRating ? driver.rating!.toFixed(1) : 'Mới';

  // Vehicle info
  const vehicleText = [
    vehicle?.color,
    vehicle?.licensePlate,
  ].filter(Boolean).join(' • ') || 'Phương tiện CoRide';

  return (
    <View style={styles.container}>
      <View style={styles.driverRow}>
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <AppText variant="h3" weight="bold" style={styles.fallbackText}>
                {driver.firstName?.charAt(0)?.toUpperCase() || 'T'}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.infoWrap}>
          <AppText variant="body" weight="bold" style={styles.nameText} numberOfLines={1}>
            {driverName}
          </AppText>
          <View style={styles.subInfoRow}>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <AppText variant="caption" weight="bold" style={styles.ratingText}>
                {ratingText}
              </AppText>
            </View>
            <AppText variant="caption" style={styles.bulletDot}>•</AppText>
            <AppText variant="caption" style={styles.vehicleText} numberOfLines={1}>
              {vehicleText}
            </AppText>
          </View>
        </View>

        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Nhắn tin cho tài xế"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              router.push({
                pathname: `/chat/${rideId}` as any,
                params: {
                  rideId,
                  otherUserId: driver.id,
                  otherUserName: driverName,
                },
              });
            }}
          >
            <MessageSquare size={18} color={colors.navigationPassenger || '#0071E3'} />
          </TouchableOpacity>

          {Boolean(driver.phone) && (
            <TouchableOpacity
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Gọi điện thoại cho tài xế"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                if (driver.phone) {
                  void Linking.openURL(`tel:${driver.phone}`);
                }
              }}
            >
              <Phone size={18} color={colors.navigationPassenger || '#0071E3'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.navigationPassengerSoft || '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.navigationPassenger || '#0071E3',
  },
  infoWrap: {
    flex: 1,
    minWidth: 0,
  },
  nameText: {
    color: colors.textPrimary,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  bulletDot: {
    color: colors.textTertiary,
  },
  vehicleText: {
    flex: 1,
    color: colors.textSecondary,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.navigationPassengerSoft || '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

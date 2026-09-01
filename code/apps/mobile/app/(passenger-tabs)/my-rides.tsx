import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityScreen } from '../../src/features/activities/ActivityScreen';
import type { ActivitySegment } from '../../src/features/activities/activity.types';

export default function PassengerActivityRoute() {
  const params = useLocalSearchParams<{ segment?: string; bookingId?: string }>();
  const initialSegment: ActivitySegment = params.segment === 'UPCOMING' ? 'UPCOMING' : 'ACTIVE';
  return <ActivityScreen role="PASSENGER" initialSegment={initialSegment} navigationKey={params.bookingId} />;
}

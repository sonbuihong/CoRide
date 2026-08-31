import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TripHistoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/driver/trips/${id}`} />;
}

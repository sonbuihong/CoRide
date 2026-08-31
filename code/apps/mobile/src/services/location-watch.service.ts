import { Platform } from 'react-native';
import * as Location from 'expo-location';

type LocationCallback = (location: Location.LocationObject) => void;

export async function watchLocation(
  options: Location.LocationOptions,
  callback: LocationCallback,
): Promise<Location.LocationSubscription> {
  if (Platform.OS !== 'web') {
    return Location.watchPositionAsync(options, callback);
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Trình duyệt không hỗ trợ theo dõi vị trí.');
  }

  let lastUpdate = 0;
  const minimumInterval = options.timeInterval ?? 0;
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (position.timestamp - lastUpdate < minimumInterval) return;
      lastUpdate = position.timestamp;

      callback({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        },
        timestamp: position.timestamp,
      });
    },
    (error) => console.warn('[Location] Browser watch failed:', error.message),
    {
      enableHighAccuracy: options.accuracy !== Location.Accuracy.Lowest,
      maximumAge: minimumInterval,
      timeout: 10_000,
    },
  );

  return {
    remove: () => navigator.geolocation.clearWatch(watchId),
  };
}

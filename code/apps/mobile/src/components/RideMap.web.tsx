import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { GoongMapCanvas } from './GoongMapCanvas.web';
import { getDirections } from '../services/direction.service';

interface RideMapProps {
  departureCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
  containerStyle?: ViewStyle;
  fullScreen?: boolean;
}

export const RideMap: React.FC<RideMapProps> = ({
  departureCoords,
  destinationCoords,
  containerStyle,
  fullScreen = false,
}) => {
  const [route, setRoute] = useState<{ latitude: number; longitude: number }[]>([]);

  const departureLat = departureCoords?.latitude;
  const departureLng = departureCoords?.longitude;
  const destinationLat = destinationCoords?.latitude;
  const destinationLng = destinationCoords?.longitude;

  useEffect(() => {
    if (departureLat == null || departureLng == null || destinationLat == null || destinationLng == null) return;
    let active = true;
    getDirections(
      { latitude: departureLat, longitude: departureLng },
      { latitude: destinationLat, longitude: destinationLng }
    ).then((result) => {
      if (active && result?.polylineCoords?.length) {
        setRoute(result.polylineCoords);
      }
    });
    return () => {
      active = false;
    };
  }, [departureLat, departureLng, destinationLat, destinationLng]);

  const center = useMemo(() => {
    return departureCoords || destinationCoords || { latitude: 21.0285, longitude: 105.8542 };
  }, [departureCoords, destinationCoords]);

  const routeLines = useMemo(() => {
    return route.length > 1 ? [route] : [];
  }, [route]);

  return (
    <View
      style={[
        fullScreen ? styles.fullScreen : styles.card,
        containerStyle,
      ]}
    >
      <GoongMapCanvas
        center={center}
        origin={departureCoords}
        destination={destinationCoords}
        routeLines={routeLines}
        zoom={13}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 240,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  fullScreen: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
});

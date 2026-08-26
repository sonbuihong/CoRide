import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface PickupMarker {
  coordinate: LatLng;
  label: string;
  isActive: boolean;
  bookingId: string;
}

interface ActiveRideMapProps {
  originCoords: LatLng;
  destinationCoords: LatLng;
  routeCoords: LatLng[];
  driverLocation?: LatLng | null;
  originLabel?: string;
  destinationLabel?: string;
  pickupMarkers?: PickupMarker[];
}

export const ActiveRideMap: React.FC<ActiveRideMapProps> = ({
  originCoords,
  driverLocation
}) => {
  // Lấy vị trí trung tâm là tài xế (nếu có) hoặc điểm xuất phát
  const centerLat = driverLocation?.latitude || originCoords.latitude;
  const centerLng = driverLocation?.longitude || originCoords.longitude;
  
  // Google Maps embed URL đáng tin cậy hơn trên localhost và web view
  const mapUrl = `https://maps.google.com/maps?q=${centerLat},${centerLng}&z=15&output=embed`;

  return (
    <View style={styles.container}>
      {/* Sử dụng div bọc iframe để tương thích tốt nhất với React Native Web */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <iframe 
          title="Bản đồ hành trình"
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          src={mapUrl} 
          style={{ border: 0 }}
        />
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
});

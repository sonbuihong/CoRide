const fs = require('fs');
const file = 'app/ride/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize to LF for easy replacement
content = content.replace(/\r\n/g, '\n');

// 1. Imports
content = content.replace(
  `  ScrollView,\n  StyleSheet,\n  View,\n} from 'react-native';`,
  `  ScrollView,\n  StyleSheet,\n  View,\n  useWindowDimensions,\n} from 'react-native';\nimport Animated, { useSharedValue } from 'react-native-reanimated';`
);

content = content.replace(
  `import { DraggableBottomSheet, type DraggableBottomSheetRef } from '../../src/components/ui/DraggableBottomSheet';`,
  `import { DraggableBottomSheet, type DraggableBottomSheetRef } from '../../src/components/ui/DraggableBottomSheet';\nimport { FloatingMyLocation } from '../../src/components/ui/FloatingMyLocation';`
);

// 2. SNAP_POINTS
content = content.replace(
  `const SNAP_POINTS = [0.34, 0.62, 0.92];`,
  `const SNAP_POINTS = [0.34, 0.62, 1];`
);

// 3. Refs inside PassengerRideView
content = content.replace(
  `  const [mapRoute, setMapRoute] = useState<{ latitude: number; longitude: number }[]>([]);\n  const sheetRef = useRef<DraggableBottomSheetRef>(null);`,
  `  const [mapRoute, setMapRoute] = useState<{ latitude: number; longitude: number }[]>([]);\n  const sheetRef = useRef<DraggableBottomSheetRef>(null);\n  const mapRef = useRef<MapView>(null);\n  const { height: screenHeight } = useWindowDimensions();\n  const animatedPosition = useSharedValue(screenHeight);`
);

// 4. fetchRoute
content = content.replace(
  `      if (result?.polylineCoords) setMapRoute(result.polylineCoords);\n    } catch {`,
  `      if (result?.polylineCoords) {\n        setMapRoute(result.polylineCoords);\n        setTimeout(() => {\n          mapRef.current?.fitToCoordinates(result.polylineCoords, {\n            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },\n            animated: true\n          });\n        }, 500);\n      }\n    } catch {`
);

// 5. MapView & FloatingMyLocation
content = content.replace(
  `        <MapView\n          provider={PROVIDER_GOOGLE}\n          style={StyleSheet.absoluteFillObject}\n          initialRegion={mapRegion}\n          scrollEnabled={false}\n          zoomEnabled={false}\n          pitchEnabled={false}\n          rotateEnabled={false}\n          toolbarEnabled={false}\n          showsUserLocation={false}\n          showsMyLocationButton={false}\n          accessibilityLabel="Bản đồ hành trình"\n        >`,
  `        <MapView\n          ref={mapRef}\n          provider={PROVIDER_GOOGLE}\n          style={StyleSheet.absoluteFillObject}\n          initialRegion={mapRegion}\n          mapPadding={{ bottom: screenHeight * SNAP_POINTS[0] + 40, top: 40, left: 24, right: 24 }}\n          toolbarEnabled={false}\n          showsUserLocation={true}\n          showsMyLocationButton={false}\n          accessibilityLabel="Bản đồ hành trình"\n          onMapReady={() => {\n            if (ride?.departureCoords && ride?.destinationCoords) {\n              mapRef.current?.fitToCoordinates([ride.departureCoords, ride.destinationCoords], {\n                edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },\n                animated: true\n              });\n            }\n          }}\n        >`
);

content = content.replace(
  `          )}\n        </MapView>\n      </View>\n\n      {/* ── Nút Back nổi ── */}`,
  `          )}\n        </MapView>\n      </View>\n      <FloatingMyLocation \n        animatedPosition={animatedPosition} \n        onRecenter={(loc) => {\n          mapRef.current?.animateCamera({ center: loc });\n        }} \n      />\n\n      {/* ── Nút Back nổi ── */}`
);

// 6. DraggableBottomSheet props
content = content.replace(
  `        initialSnapIndex={SNAP_COLLAPSED}\n        onSnapChange={(idx) => setSnapIndex(idx)}\n        footer={sheetFooter}\n      >`,
  `        initialSnapIndex={SNAP_COLLAPSED}\n        onSnapChange={(idx) => setSnapIndex(idx)}\n        footer={sheetFooter}\n        animatedPosition={animatedPosition}\n      >`
);

// 7. NEW STYLES for screenshot UI
content = content.replace(
  `  quickInfoBar: {`,
  `  statusRow: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    marginBottom: spacing.sm,\n  },\n  statusLeft: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    gap: spacing.xs,\n  },\n  statusText: {\n    color: colors.navigationPassenger || '#0071E3',\n    fontSize: 16,\n  },\n  statusRight: {\n    color: colors.textTertiary,\n  },\n  summaryCard: {\n    backgroundColor: colors.surface,\n    borderRadius: radius.card,\n    padding: spacing.md,\n    borderWidth: 1,\n    borderColor: colors.border || '#F3F4F6',\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.05,\n    shadowRadius: 8,\n    elevation: 2,\n  },\n  summaryCardDivider: {\n    height: 1,\n    backgroundColor: colors.border || '#F3F4F6',\n    marginVertical: spacing.sm,\n  },\n  cardTagsRow: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n    marginTop: spacing.xs,\n  },\n  cardTag: {\n    alignItems: 'center',\n    flex: 1,\n  },\n  cardTagIcon: {\n    width: 32,\n    height: 32,\n    borderRadius: 16,\n    backgroundColor: colors.navigationPassengerSoft || '#EFF6FF',\n    alignItems: 'center',\n    justifyContent: 'center',\n    marginBottom: 4,\n  },\n  cardTagText: {\n    color: colors.textSecondary,\n    fontSize: 11,\n  },\n\n  quickInfoBar: {`
);

// 8. Replace Trip Summary Layout
const oldSummary = `          {/* ─── Collapsed + Medium: Trip summary ─── */}\n          <View style={pStyles.sheetPadding}>\n\n            {/* Giờ + ngày */}\n            <AppText weight="semibold" style={pStyles.departureTime}>{departureDateFormatted}</AppText>\n\n            {/* Route timeline - luôn hiển thị */}\n            <RouteTimeline\n              departure={ride.departure ?? ''}\n              destination={ride.destination ?? ''}\n              distance={ride.originDistanceKm ? ride.originDistanceKm * 1000 : undefined}\n              duration={undefined}\n            />\n\n            {/* Quick info bar: ghế còn + giá (visible ở collapsed) */}\n            <View style={pStyles.quickInfoBar}>\n              <View style={pStyles.quickInfoItem}>\n                <Users size={14} color={colors.textTertiary} strokeWidth={2} />\n                <AppText variant="caption" style={pStyles.quickInfoText}>\n                  {ride.availableSeats} ghế còn\n                </AppText>\n              </View>\n              <View style={pStyles.quickInfoDivider} />\n              <View style={pStyles.quickInfoItem}>\n                <Wallet size={14} color={colors.textTertiary} strokeWidth={2} />\n                <AppText variant="caption" style={pStyles.quickInfoText}>\n                  {formatVnd(pricePerSeat)} / ghế\n                </AppText>\n              </View>\n              {ride.originDistanceKm ? (\n                <>\n                  <View style={pStyles.quickInfoDivider} />\n                  <View style={pStyles.quickInfoItem}>\n                    <Route size={14} color={colors.textTertiary} strokeWidth={2} />\n                    <AppText variant="caption" style={pStyles.quickInfoText}>\n                      {ride.originDistanceKm} km\n                    </AppText>\n                  </View>\n                </>\n              ) : null}\n            </View>\n          </View>`;

const newSummary = `          {/* ─── Collapsed + Medium: Trip summary ─── */}\n          <View style={pStyles.sheetPadding}>\n            {/* Top Row: Status + Time */}\n            <View style={pStyles.statusRow}>\n              <View style={pStyles.statusLeft}>\n                <Navigation size={18} color={colors.navigationPassenger || '#0071E3'} />\n                <AppText weight="bold" style={pStyles.statusText}>\n                  {rideStatusMeta(ride.status).label || 'Thông tin chuyến đi'}\n                </AppText>\n              </View>\n              <AppText variant="caption" style={pStyles.statusRight}>\n                {departureDateFormatted}\n              </AppText>\n            </View>\n\n            {/* White Card */}\n            <View style={pStyles.summaryCard}>\n              <RouteTimeline\n                departure={ride.departure ?? ''}\n                destination={ride.destination ?? ''}\n                distance={ride.originDistanceKm ? ride.originDistanceKm * 1000 : undefined}\n                duration={undefined}\n              />\n              \n              <View style={pStyles.summaryCardDivider} />\n              \n              <View style={pStyles.cardTagsRow}>\n                <View style={pStyles.cardTag}>\n                  <View style={pStyles.cardTagIcon}>\n                    <Users size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />\n                  </View>\n                  <AppText variant="caption" weight="medium" style={pStyles.cardTagText}>\n                    {ride.availableSeats} khách\n                  </AppText>\n                </View>\n                \n                {ride.originDistanceKm ? (\n                  <View style={pStyles.cardTag}>\n                    <View style={pStyles.cardTagIcon}>\n                      <MapPin size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />\n                    </View>\n                    <AppText variant="caption" weight="medium" style={pStyles.cardTagText}>\n                      {ride.originDistanceKm} km\n                    </AppText>\n                  </View>\n                ) : null}\n\n                <View style={pStyles.cardTag}>\n                  <View style={pStyles.cardTagIcon}>\n                    <Wallet size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />\n                  </View>\n                  <AppText variant="caption" weight="medium" style={pStyles.cardTagText}>\n                    {formatVnd(pricePerSeat)}\n                  </AppText>\n                </View>\n              </View>\n            </View>\n          </View>`;

content = content.replace(oldSummary, newSummary);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched successfully!");

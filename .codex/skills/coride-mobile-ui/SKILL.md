---
name: coride-mobile-ui
description: Design, implement, or refactor CoRide Expo mobile and React Native Web UI for passenger/driver screens, maps, bottom sheets, navigation, forms, active trips, ride-hailing, or reusable mobile components.
---

# CoRide Mobile UI

## Stack

- Expo `~54.0.33`, React Native `0.81.5`, React 19, Expo Router 6; routes are under `code/apps/mobile/app` with passenger/driver tab groups.
- Native/web share the app. Maps use paired `.tsx`/`.web.tsx` components; web Goong is `src/components/GoongMapCanvas.web.tsx`, native uses `react-native-maps`.
- NativeWind/Tailwind, `src/theme/tokens.ts`, shared design tokens; Lucide/Expo icons.
- TanStack Query for server cache, Zustand where feature state needs it, Axios `src/api/client.ts`, service modules in `src/services`.
- Safe area via `react-native-safe-area-context`; sheets via Gorhom Bottom Sheet, gesture-handler and Reanimated.

## Rules

Search `src/components/ui`, `src/components`, and `src/features` before adding anything. Reuse AppButton/Input/Text/Screen, Card, status/loading/error/empty components, BottomSheetSurface/DraggableBottomSheet, map variants, RideCard/InfoPanel, and trip-flow pieces.

Use mobile-first, minimal, map-centric hierarchy. Avoid carding every section. Keep one obvious CTA, large targets, tokens, safe areas, and loading/error/empty/offline states.

Active ride follows map + draggable sheet + fixed footer/action in `src/features/trip-flow/TripScreen.tsx`, `TripBottomSheet.tsx`, `TripFloatingControls.tsx`, and `DriverActionBar.tsx`. `DraggableBottomSheet` defaults to 35/62/92%. Sheet/scroll gestures must not block map pan/zoom.

Keep urgent driver accept/arrive/start/finish and passenger find/cancel/pay actions reachable without scrolling. Labels must match backend transitions; ride-hailing completion currently follows `WAITING_PAYMENT` payment.

Check both platform files and `Platform` branches; never import native-only modules in web implementations. Clean socket/location/AppState listeners. Memoize only measured/high-frequency map, marker, polyline, or callback work. Stop location watchers and do not duplicate TanStack Query server state locally.

## Verify

From `code/`: `pnpm --filter @repo/mobile typecheck`, `lint`, and `build`; smoke-test `pnpm --filter @repo/mobile web` plus an Expo device for platform changes. Check safe areas, keyboard, map gestures, sheet snaps, CTA reachability, reconnect, and states.

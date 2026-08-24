# CoRide Mobile UI Audit

Audit date: 2026-08-22

## Product direction

CoRide is a consumer mobility product, not an operations dashboard. The primary experience is:

`Map → Location → Matching → Ride → Booking → Active trip`

The visual direction is light-first, map-first and minimal. CoRide Blue is the only brand accent. Green, amber and red are reserved for semantic status. Passenger and Driver modes share the same component language.

## What stays

- Expo Router route groups and authentication/mode guards.
- React Query data ownership and cache invalidation.
- REST services, Socket.IO events and realtime ride/trip lifecycle.
- Goong autocomplete and place-detail coordinate lookup.
- Existing booking, payment, wallet, KYC, vehicle and notification APIs.
- Map implementations and driver-location hooks.

## What is reused and strengthened

- `AppText`, `AppButton`, `AppInput`, `AppScreen` as base primitives.
- `RideMap`, `ActiveRideMap`, `RideCard`, `RideInfoPanel` and `DriverActionBar` as domain components.
- Empty, error, offline and skeleton states.
- Profile mode switching and KYC eligibility logic.

## Findings

| Area | Current issue | Redesign decision |
| --- | --- | --- |
| Navigation | Five top-level tabs; notifications and quick ride consume primary navigation | Four tabs: Home, Trips, Messages, Account. Keep secondary routes reachable from headers/profile. |
| Passenger Home | Map is a card, followed by search card, quick-action cards and ride cards | Full-screen map, floating identity/location header and one bottom sheet focused on “Bạn muốn đi đâu?”. |
| Matching | Backend metadata is discarded | Extend the mobile ride model and translate scores/distances/detours into human explanations. |
| Visual system | Repeated raw hex values, mixed blue/amber role accents and large card/shadow use | Semantic tokens, one brand blue, borders/surface contrast and low elevation. |
| Trips | History is one undifferentiated list | Segments for upcoming, active, completed and cancelled. |
| Messages | Chat detail exists but has no top-level inbox | Build conversations from real booking relationships; no mock data. |
| Driver Home | Dashboard language and analytics-first hierarchy | Availability and next action first; earnings and history remain secondary. |
| Accessibility | Several controls are 40px and icon-only labels are inconsistent | 48px minimum targets for new primitives, labels/hints, visible form labels and dynamic text support. |
| Loading | Full-screen spinners are common | Use skeletons for content and reserve spinners for blocking mutations or map boot. |

## Screen disposition

- Redesign first: Passenger Home, matching result cards, Ride Detail, My Trips, Messages, Driver Home.
- Refactor next: booking confirmation/detail, passenger/driver active trip, create ride, chat detail.
- Restyle on shared foundation: wallet, payment, profile, vehicle, KYC, notifications and settings.
- Keep routes but remove from top-level tabs: quick ride-hailing, notifications and driver publish.

## Design system source of truth

- Runtime tokens: `src/theme/tokens.ts` and matching NativeWind semantic colors.
- Typography: system font/Inter-compatible scale of 30, 24, 20, 18, 16, 14 and 12.
- Spacing: 4, 8, 12, 16, 20, 24, 32 and 40.
- Radius: 14 input, 16 button, 18 card and 26 sheet.
- Motion: 150–300ms, purposeful and reduced-motion friendly.
- Touch: 48dp target for primary controls and icon-button hit slop.

## Implementation guardrails

- Do not change API contracts or trip/booking status transitions for presentation work.
- Do not replace real API data with fixtures.
- One primary CTA per state.
- Hide bottom navigation during active trips.
- Never render raw matching values; always format them as user meaning.
- Every new list must include loading, empty and recoverable error states.


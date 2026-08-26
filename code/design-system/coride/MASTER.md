# CoRide Design System

Runtime values live in `packages/design-tokens`; neither Web CSS nor Native styles are the source of truth.

```text
Semantic tokens (@repo/design-tokens)
              |
 Shared Tailwind vocabulary
 (@repo/tailwind-config)
        /             \
Web: Tailwind/CSS   Mobile: NativeWind/StyleSheet
                           |
                      Android + iOS
```

> **Web CSS is NOT reusable Native CSS.** Share token meaning and component behavior, then use platform-correct rendering primitives.

## Semantic foundation

- Action: `primary`, `primaryPressed`, `primarySoft`, `accent`.
- Canvas: `background`, `surface`, `surfaceSecondary`.
- Content: `textPrimary`, `textSecondary`, `textMuted`.
- Structure: `border`, `borderStrong`.
- Feedback: `success`, `warning`, `danger`, `info` and soft surfaces.
- Map colors are domain tokens, not general status colors.
- Do not add raw colors when an existing semantic token expresses the purpose.

The current light-first CoRide blue palette is intentionally preserved. Palette changes require a separate product decision.

## Spacing, typography, radius

- Shared spacing: 4, 8, 12, 16, 20, 24, 32, 48. Screen gutter is 20; touch targets are at least 48dp.
- Type: `display`, `heading1`, `heading2`, `heading3`, `body`, `bodySmall`, `caption`. Preserve OS text scaling. Text containers use padding/min-height, not fixed height.
- Radius: `sm`, `input`, `button`, `card`, `sheet`, `full`.
- Native elevation uses `nativeShadows`: iOS shadow properties and Android elevation. Match hierarchy, not pixels.
- Motion uses 150–300ms and respects reduced motion.

CoRide currently uses platform/system fonts. The former Be Vietnam Pro/Noto Sans CSS import was not a native font contract. Any future font change must add Expo font assets/loading and Web loading together.

## Component behavior

- Button: primary, secondary, outline, ghost, danger; disabled/loading states.
- Input: default, focused, error, disabled; visible label/error.
- Card: default, outlined, elevated.
- Badge: info, success, warning, danger, neutral.
- Screen: background, optional safe area, scrolling, keyboard adaptation and gutter.

Keep existing public APIs backward-compatible during migration. Android and iOS share the mobile component unless a native capability requires adaptation.

## Platform adaptation

### WEB ONLY

Web may use `:hover`, `:focus-visible`, cursor, media/container queries, CSS Grid, fixed positioning, backdrop filter, CSS box-shadow and CSS animation. MapLibre browser DOM/CSS stays on Web.

### NATIVE ONLY

Use React Native primitives, NativeWind and `StyleSheet`. Safe area comes from `react-native-safe-area-context`. Platform branches are allowed for keyboard behavior, system UI, permissions, storage, native pickers/maps, iOS shadow and Android elevation.

Do not use `Platform` for ordinary layout. Do not put browser CSS in native branches. Expo Web implementations belong in `.web.tsx` files or guarded Web branches.

Mobile layout is Flexbox-first. Never encode a target device frame. `useWindowDimensions` is for a real breakpoint (tablet at 768+), not ordinary positioning.

### Map screens

Maps may use absolute overlays, markers, floating controls and bottom sheets. Account for safe-area, bottom navigation and home indicators. Map algorithms/providers are outside style migration.

## Shared Tailwind vocabulary

Both apps may use `bg-coride-background`, `bg-coride-surface`, `bg-coride-accent`, `text-coride-primary`, `text-coride-secondary`, `border-coride-border`, `text-title`, `text-body`, and `text-caption`. Web interaction utilities remain Web-only.

## Migration order

Tokens/preset → Mobile foundations → Screen/Button/Input/Card/Typography → common layouts → high-traffic screens → remaining screens → verified legacy cleanup. Each group must pass typecheck/lint and retain routes, API contracts, navigation, business rules and map providers.

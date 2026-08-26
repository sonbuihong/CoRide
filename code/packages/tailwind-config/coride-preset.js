const tokens = require('../design-tokens/token-values.json');

const px = (value) => `${value}px`;
const fontSize = Object.fromEntries(
  Object.entries(tokens.typography).map(([name, value]) => [
    name === 'heading1' ? 'title' : name,
    [px(value.fontSize), { lineHeight: px(value.lineHeight), fontWeight: value.fontWeight }],
  ]),
);

/** Shared semantic vocabulary. NativeWind and Tailwind consume this preset separately. */
module.exports = {
  theme: {
    extend: {
      colors: {
        coride: {
          primary: tokens.colors.textPrimary,
          secondary: tokens.colors.textSecondary,
          muted: tokens.colors.textMuted,
          accent: tokens.colors.accent,
          background: tokens.colors.background,
          surface: tokens.colors.surface,
          'surface-secondary': tokens.colors.surfaceSecondary,
          border: tokens.colors.border,
          success: tokens.colors.success,
          warning: tokens.colors.warning,
          danger: tokens.colors.danger,
          info: tokens.colors.info,
        },
      },
      spacing: Object.fromEntries(Object.entries(tokens.spacing).map(([key, value]) => [`coride-${key}`, px(value)])),
      borderRadius: Object.fromEntries(Object.entries(tokens.radius).map(([key, value]) => [`coride-${key}`, px(value)])),
      fontSize,
      minHeight: { 'coride-touch': px(tokens.sizing.touchTarget) },
      minWidth: { 'coride-touch': px(tokens.sizing.touchTarget) },
      maxWidth: { 'coride-mobile': px(tokens.sizing.maxMobileContent) },
      zIndex: Object.fromEntries(Object.entries(tokens.zIndex).map(([key, value]) => [`coride-${key}`, String(value)])),
    },
  },
};

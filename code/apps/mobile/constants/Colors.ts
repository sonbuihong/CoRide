export const palette = {
  slate950: '#1D1D1F',
  slate500: '#515154',
  blue600: '#0071E3',
  white: '#FFFFFF',
} as const;

export default {
  light: {
    text: palette.slate950,
    background: palette.white,
    tint: palette.blue600,
    tabIconDefault: palette.slate500,
    tabIconSelected: palette.blue600,
  },
  dark: {
    text: palette.white,
    background: palette.slate950,
    tint: palette.white,
    tabIconDefault: palette.slate500,
    tabIconSelected: palette.white,
  },
};

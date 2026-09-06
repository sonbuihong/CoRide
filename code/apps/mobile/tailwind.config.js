/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset"), require("../../packages/tailwind-config/coride-preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0071E3",
          pressed: "#0066CC",
          soft: "#EAF4FF",
        },
        secondary: "#515154",
        background: "#F5F5F7",
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#FFFFFF",
          muted: "#FAFAFC",
        },
        text: {
          primary: "#1D1D1F",
          secondary: "#515154",
          disabled: "#8E8E93",
        },
        border: {
          DEFAULT: "#E5E5EA",
          strong: "#D1D1D6",
        },
        status: {
          success: "#16A34A", // Green 600
          warning: "#F97316", // Orange 500
          danger: "#DC2626", // Red 600
          info: "#2563EB", // Blue 600
        },
        // Bổ sung các màu sắc semantic theo đặc tả CoRide
        passenger: {
          DEFAULT: "#0071E3",
          pressed: "#0066CC",
          soft: "#EAF4FF",
        },
        driver: {
          DEFAULT: "#34C759",
          pressed: "#2DB34F",
          soft: "#EAF9EE",
        },
        pending: "#F59E0B",
        confirmed: "#16A34A",
        cancelled: "#94A3B8",
        rejected: "#DC2626",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // Blue 500
          pressed: "#2563EB", // Blue 600
          soft: "#EFF6FF", // Blue 50
        },
        secondary: "#64748B", // Slate 500
        background: "#F8FAFC", // Slate 50
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#FFFFFF",
        },
        text: {
          primary: "#0F172A", // Slate 900
          secondary: "#64748B", // Slate 500
          disabled: "#94A3B8", // Slate 400
        },
        border: {
          DEFAULT: "#E2E8F0", // Slate 200
          strong: "#CBD5E1", // Slate 300
        },
        status: {
          success: "#16A34A", // Green 600
          warning: "#F97316", // Orange 500
          danger: "#DC2626", // Red 600
          info: "#2563EB", // Blue 600
        },
        // Bổ sung các màu sắc semantic theo đặc tả CoRide
        passenger: {
          DEFAULT: "#3B82F6",
          pressed: "#2563EB",
          soft: "#EFF6FF",
        },
        driver: {
          DEFAULT: "#F59E0B", // Amber 500
          pressed: "#D97706", // Amber 600
          soft: "#FEF3C7", // Amber 100
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

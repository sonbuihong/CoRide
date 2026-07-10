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
          success: "#22C55E", // Green 500
          warning: "#F59E0B", // Amber 500
          danger: "#EF4444", // Red 500
          info: "#3B82F6", // Blue 500
        }
      },
    },
  },
  plugins: [],
};

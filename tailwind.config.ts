import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        velo: {
          dark: "#000000",
          darkElevated: "#09090B",
          darkCard: "#121215",
          light: "#FFFFFF",
          lightElevated: "#F8FAFC",
          lightCard: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        "glass-light": "0 8px 30px rgba(0, 0, 0, 0.05)",
        pill: "0 2px 10px rgba(0, 0, 0, 0.2)",
      },
      keyframes: {
        waveBar: {
          "0%": { height: "20%" },
          "100%": { height: "100%" },
        },
      },
      animation: {
        "wave-bar-1": "waveBar 0.8s ease-in-out infinite alternate",
        "wave-bar-2": "waveBar 0.6s ease-in-out infinite alternate 0.2s",
        "wave-bar-3": "waveBar 0.9s ease-in-out infinite alternate 0.4s",
      },
    },
  },
  plugins: [],
};

export default config;

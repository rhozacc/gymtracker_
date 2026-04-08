import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        accent: "var(--color-accent)",
        muted: "var(--color-muted)",
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": {
            borderColor: "var(--color-accent)",
            boxShadow: "0 0 8px var(--color-accent), 0 0 16px color-mix(in srgb, var(--color-accent) 30%, transparent)",
          },
          "50%": {
            borderColor: "var(--color-border)",
            boxShadow: "none",
          },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-border": "pulse-border 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

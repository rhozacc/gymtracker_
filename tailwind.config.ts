import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        accent: "var(--color-accent)",
        muted: "var(--color-muted)",
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": { borderColor: "var(--color-accent)" },
          "50%": { borderColor: "var(--color-border)" },
        },
      },
      animation: {
        "pulse-border": "pulse-border 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

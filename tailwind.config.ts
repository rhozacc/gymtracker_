import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        border: "#222222",
        accent: "#f0f0f0",
        muted: "#666666",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#FAF8F5",
        jungle: "#F3EFE6",
        sand: "#0F172A",
        terracotta: "#EA580C",
        ember: "#F59E0B",
        ivory: "#FAF8F5",
        "soft-sand": "#F3EFE6",
        charcoal: "#0F172A",
        sierra: "#065F46",
        "sierra-light": "#0D9488",
        caribe: "#0284C7",
        coral: "#EA580C",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

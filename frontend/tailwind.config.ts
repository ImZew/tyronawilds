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
        obsidian: "#26211D",
        terracotta: "#C89D66",
        ember: "#DAB485",
        sand: "#F5F2EB",
        jungle: "#362F29",
        espresso: "#26211D",
        "stone-warm": "#362F29",
        alabaster: "#F5F2EB",
        charcoal: "#1C1917",
        bronze: "#C89D66",
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

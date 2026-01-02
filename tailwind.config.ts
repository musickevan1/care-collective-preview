import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5A7D78", // Using accessible sage dark
          contrast: "#4A6B66",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#9A6B61", // Using accessible dusty rose
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#C39778",
          foreground: "#483129",
        },
        background: {
          DEFAULT: "#FBF2E9",
          foreground: "#483129",
        },
        dark: {
          accent: "#483129",
          foreground: "#FFFFFF",
        },
        terracotta: "#BC6547",
        navy: "#324158",
        tan: "#C39778",
        cream: "#FBF2E9",
        brown: "#483129",
        sage: "#7A9E99",
        "sage-light": "#A3C4BF",
        "sage-dark": "#5A7D78",
        "sage-accessible": "#4A6B66",
        "dusty-rose": "#D8A8A0",
        "dusty-rose-light": "#E5C6C1",
        "dusty-rose-dark": "#B88B83",
        "dusty-rose-accessible": "#9A6B61",
        almond: "#E9DDD4",
        seafoam: "#D6E2DF",
        rose: "#C28C83",
        teal: {
          DEFAULT: "#3D4F52",
          light: "#4A6065",
          dark: "#2D3A3D",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        overlock: ["Overlock", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "Times New Roman", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
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
          DEFAULT: "var(--color-teal)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--color-rose)",
          foreground: "var(--color-brown)",
        },
        background: {
          DEFAULT: "var(--color-cream)",
          foreground: "var(--color-brown)",
        },
        cream: "var(--color-cream)", // #FBF2E9
        tan: "var(--color-tan)",     // #C39778
        terracotta: "var(--color-terracotta)", // #BC6547
        brown: "var(--color-brown)", // #483129
        teal: "var(--color-teal)",   // #3D4F52
        rose: "var(--color-rose)",   // #D8A8A0

        // Legacy mapping for compatibility
        sage: "var(--color-sage)",
        "sage-light": "var(--color-sage-light)",
        "sage-dark": "var(--color-sage-dark)",

        border: "var(--color-tan)",
        input: "var(--color-cream)",
        ring: "var(--color-teal)",
        foreground: "var(--color-brown)",

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
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'cal-surface': '0px 1px 5px -4px rgba(19, 19, 22, 0.70), 0px 0px 0px 1px rgba(34, 42, 53, 0.08), 0px 4px 8px 0px rgba(34, 42, 53, 0.05)',
        'cal-ring': '0px 0px 0px 1px rgba(34, 42, 53, 0.08)',
        'cal-elevated': '0px 2px 8px -2px rgba(19, 19, 22, 0.70), 0px 0px 0px 1px rgba(34, 42, 53, 0.08), 0px 8px 16px 0px rgba(34, 42, 53, 0.08)',
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        brand: {
          teal: "#004255",
          dark: "#0D0D0D",
          green: "#133D20",
          shopify: "#008060",
          shopifyDark: "#006e52",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "San Francisco", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

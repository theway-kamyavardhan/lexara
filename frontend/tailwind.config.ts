import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        appleDark: "#000000",
        appleGray: "#1d1d1f",
        appleLightGray: "#f5f5f7",
        accent: "#0071e3",
        success: "#34c759",
      },
      fontFamily: {
        dyslexic: ['"OpenDyslexic"', "sans-serif"],
        sans: ['"Inter"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        'glowing': '0 0 40px -10px rgba(0, 113, 227, 0.5)',
      },
      animation: {
        'aurora': 'aurora 20s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1.5)' },
          '50%': { transform: 'rotate(180deg) scale(2)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;

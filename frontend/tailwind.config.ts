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
        cream: "#FDFBF7",
        warmGray: "#3F3D3C",
        highlight: "#FFF3C4",
        accent: "#F07167",
        success: "#0081A7",
      },
      fontFamily: {
        dyslexic: ['"OpenDyslexic"', "sans-serif"],
        sans: ['"Inter"', "sans-serif"],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'float': '0 20px 40px -10px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
};
export default config;

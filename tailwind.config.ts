import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#060811",
        panel: "#0f1424",
        border: "rgba(255,255,255,0.12)",
        gold: "#b89a5b"
      },
      boxShadow: {
        premium: "0 20px 45px rgba(0,0,0,0.45)"
      }
    }
  },
  plugins: []
} satisfies Config;

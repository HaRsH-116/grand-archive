/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          50:  "#fffbeb", 100: "#fef3c7", 200: "#fde68a",
          300: "#fcd34d", 400: "#fbbf24", 500: "#d4af37",
          600: "#b8960c", 700: "#92740a", 800: "#78590e", 900: "#5c420a",
        },
        mahogany: {
          100: "#7a3a25", 200: "#5c2a18", 300: "#4a1e10",
          400: "#3d1f0a", 500: "#2a1505", 600: "#1a0a02",
        },
        oak: {
          100: "#e8d5b0", 200: "#d4b896", 300: "#c8a882",
          400: "#b8945e", 500: "#9a7a48",
        },
        leather: {
          burgundy: "#6B1A1A",
          slate:    "#2C4A6E",
          cream:    "#F5EDD6",
        },
        parchment: {
          50: "#fffef7", 100: "#fdf9ec", 200: "#f9efd4",
          300: "#f2e0b3", 400: "#e8cc8a", 500: "#d4b06a",
        },
        wax: { red: "#8B0000", dark: "#5c0000" },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'Crimson Text'",     "Palatino", "serif"],
        mono:    ["'Courier Prime'",    "'Courier New'", "monospace"],
      },
      boxShadow: {
        "book":       "4px 6px 20px rgba(0,0,0,0.8), inset -4px 0 10px rgba(0,0,0,0.5)",
        "book-light": "4px 6px 12px rgba(0,0,0,0.25), inset -3px 0 8px rgba(0,0,0,0.15)",
        "shelf":      "0 12px 40px rgba(0,0,0,0.9), inset 0 -6px 12px rgba(0,0,0,0.5)",
        "gold-glow":  "0 0 20px rgba(212,175,55,0.5), 0 0 50px rgba(212,175,55,0.2)",
        "wax":        "0 6px 25px rgba(139,0,0,0.8), inset 0 2px 8px rgba(255,150,150,0.15)",
        "modal":      "0 25px 80px rgba(0,0,0,0.9)",
        "parchment":  "inset 0 0 60px rgba(180,140,60,0.12), 0 4px 20px rgba(0,0,0,0.3)",
      },
      keyframes: {
        flicker: {
          "0%,100%": { opacity: "1",    filter: "drop-shadow(0 0 8px rgba(255,180,50,0.9))"  },
          "33%":     { opacity: "0.85", filter: "drop-shadow(0 0 14px rgba(255,140,20,1))"   },
          "66%":     { opacity: "0.92", filter: "drop-shadow(0 0 5px rgba(255,220,80,0.8))"  },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 200%" },
          "100%": { backgroundPosition: "-200% -200%" },
        },
        sealSpin: {
          "0%":   { transform: "rotate(0deg) scale(0)"   },
          "60%":  { transform: "rotate(380deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)"  },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
        pulse_soft: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.6" },
        },
      },
      animation: {
        "flicker":     "flicker 2.5s ease-in-out infinite",
        "shimmer":     "shimmer 4s linear infinite",
        "seal-spin":   "sealSpin 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "fade-up":     "fadeUp 0.4s ease-out forwards",
        "pulse-soft":  "pulse_soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}

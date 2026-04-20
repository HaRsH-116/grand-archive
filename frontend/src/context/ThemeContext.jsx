import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ga-theme") || "dark"
  );

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark",       theme === "dark");
    html.classList.toggle("theme-light", theme === "light");
    localStorage.setItem("ga-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};

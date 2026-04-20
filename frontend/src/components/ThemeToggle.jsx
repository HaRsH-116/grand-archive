import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Scholar's Morning" : "Switch to Midnight Study"}
      className="flex items-center gap-1.5 px-3 py-1.5 gold-border rounded-full
                 font-body text-xs hover:bg-yellow-900/20 transition-colors"
      style={{ color: "var(--text-lo)" }}
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        {isDark
          ? <Moon size={13} style={{ color: "var(--gold)" }} />
          : <Sun  size={13} style={{ color: "var(--gold)" }} />}
      </motion.span>
      <span className="hidden sm:inline select-none">
        {isDark ? "Midnight Study" : "Scholar's Morning"}
      </span>
    </button>
  );
}

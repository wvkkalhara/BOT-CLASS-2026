import { Moon, Sun } from "lucide-react";
import { useApp } from "../store/AppStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="icon-btn relative overflow-hidden"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span
        className="transition-transform duration-500 ease-[cubic-bezier(.2,.8,.3,1.2)]"
        style={{
          display: "inline-flex",
          transform: dark ? "rotate(0deg)" : "rotate(120deg)",
        }}
      >
        {dark ? <Moon size={17} className="text-[var(--primary-2)]" /> : <Sun size={17} className="text-[var(--gold)]" />}
      </span>
    </button>
  );
}

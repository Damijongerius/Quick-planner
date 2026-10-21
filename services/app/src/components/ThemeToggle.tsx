"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

function readTheme(): Theme {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
}

export function ThemeToggle({ className = "" }: Readonly<{ className?: string }>) {
  const [theme, setTheme] = useState<Theme>("system");

  // Read after mount: the server can't know the stored preference, so initialising lazily would cause a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
  }, []);

  const next = () => {
    const nextTheme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button type="button" onClick={next} className={`icon-button ${className}`} title={LABEL[theme]} aria-label={LABEL[theme]}>
      <Icon size={16} />
    </button>
  );
}

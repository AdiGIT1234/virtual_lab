import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContextBase";

export function ThemeProvider({ children }) {
  const prefersDark = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;

  const [theme, setTheme] = useState(prefersDark ? "dark" : "light");

  useEffect(() => {
    const body = document.body;
    body.classList.remove("theme-light", "theme-dark");
    body.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

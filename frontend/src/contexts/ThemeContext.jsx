import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext({ theme: "system", setTheme: () => {} });

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "system";
    } catch (e) {
      return "system";
    }
  });

  const getSystemPreference = () =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const applyThemeClass = (t) => {
    const resolved = t === "system" ? getSystemPreference() : t;
    if (typeof document !== "undefined") {
      if (resolved === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyThemeClass(theme);

    // If theme is system, listen for changes in the OS preference
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyThemeClass("system");
      mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
      return () => (mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler));
    }

    return undefined;
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const resolvedPrev = prev === "system" ? getSystemPreference() : prev;
      const next = resolvedPrev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      return next;
    });
  };

  const resolvedTheme = theme === "system" ? getSystemPreference() : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}

export { ThemeProvider, ThemeContext };

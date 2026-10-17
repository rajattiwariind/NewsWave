
/* =========================================================
   NEWSWAVE — Theme preferences
   File: src/main/resources/static/js/theme.js
   ========================================================= */

(() => {
  "use strict";

  const root = document.documentElement;
  const button = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  const STORAGE_KEY = "newswave-theme";

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved === "dark" || saved === "light") {
        return saved;
      }
    } catch (_) {
      // Browser storage may be disabled.
    }

    // Cinematic dark is the default for NewsWave.
    return "dark";
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";

    root.dataset.theme = isDark ? "dark" : "light";
    root.style.colorScheme = isDark ? "dark" : "light";

    if (icon) {
      icon.textContent = isDark ? "☀" : "☾";
    }

    if (button) {
      const label = isDark
        ? "Switch to light theme"
        : "Switch to dark theme";

      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    }

    if (metaTheme) {
      metaTheme.setAttribute("content", isDark ? "#0a0b10" : "#f4f5f7");
    }
  }

  applyTheme(getInitialTheme());

  if (button) {
    button.addEventListener("click", () => {
      const nextTheme =
        root.dataset.theme === "dark" ? "light" : "dark";

      applyTheme(nextTheme);

      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch (_) {
        // Theme still changes for this page session.
      }
    });
  }
})();

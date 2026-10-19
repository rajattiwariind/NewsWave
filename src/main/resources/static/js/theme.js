
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");

  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem("newswave-theme") || "dark";
  } catch {}

  function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    if (icon) icon.textContent = nextTheme === "dark" ? "☼" : "☾";
    if (toggle) {
      toggle.setAttribute(
        "aria-label",
        nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  applyTheme(savedTheme);

  toggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      localStorage.setItem("newswave-theme", nextTheme);
    } catch {}
  });
})();

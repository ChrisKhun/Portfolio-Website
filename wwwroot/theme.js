// Apply the saved appearance before the first paint. Dark is the default.
(() => {
  let theme = "dark";
  try {
    if (localStorage.getItem("portfolio-theme") === "light") theme = "light";
  } catch { /* Storage can be unavailable in restricted browsing modes. */ }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#101321" : "#f4f0ed";
})();

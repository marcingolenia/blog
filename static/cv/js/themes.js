// --- PHOSPHOR THEME SWITCHER ---
const themes = ['green', 'amber', 'white'];

function setTheme(themeName) {
  document.body.classList.remove('theme-green', 'theme-amber', 'theme-white');
  document.body.classList.add(`theme-${themeName}`);
  localStorage.setItem('phosphor-theme', themeName);
  beep(1200, 50, 0.08);
}

// Load saved theme on startup
function initTheme() {
  const savedTheme = localStorage.getItem('phosphor-theme');
  if (savedTheme && themes.includes(savedTheme)) {
    document.body.classList.add(`theme-${savedTheme}`);
  }
}


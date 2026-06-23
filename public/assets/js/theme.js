(function () {
  // Selecteurs potentiels pour les boutons (support legacy)
  const TOGGLE_SELECTORS = ['#themeToggle', '#themeToggleDesktop', '#themeToggleMobile'];

  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');

  (function applyClassImmediately(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })(initialTheme);

  function getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  function updateTheme(theme, { updateIcons = false } = {}) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    if (updateIcons) {
      TOGGLE_SELECTORS.forEach(sel => {
        const btn = document.querySelector(sel);
        if (!btn) return;

        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = theme === 'dark' ? 'bx bx-moon text-xl' : 'bx bx-sun text-xl';
        } else {
          btn.innerHTML = theme === 'dark'
            ? '<i class="bx bx-moon text-xl"></i>'
            : '<i class="bx bx-sun text-xl"></i>';
        }
      });
    }

    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // storage might be blocked; ignore
    }
  }

  function toggleTheme() {
    const newTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    updateTheme(newTheme, { updateIcons: true });
  }

  function attachToggleListeners() {
    TOGGLE_SELECTORS.forEach(sel => {
      const btn = document.querySelector(sel);
      if (!btn) return;

      if (btn._themeListenerAttached) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });

      btn._themeListenerAttached = true;
    });
  }

  // Filet de sécurité : délégation globale si les boutons sont injectés dynamiquement
  document.addEventListener('click', (event) => {
    const target = event.target.closest(TOGGLE_SELECTORS.join(','));
    if (!target) return;
    if (target._themeListenerAttached) return; // un listener direct existe déjà
    event.preventDefault();
    toggleTheme();
  });

  function syncThemeControls() {
    attachToggleListeners();
    updateTheme(getCurrentTheme(), { updateIcons: true });
  }

  const observer = new MutationObserver((mutations) => {
    if (mutations.some(m => m.addedNodes && m.addedNodes.length > 0)) {
      syncThemeControls();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('DOMContentLoaded', () => {
    syncThemeControls();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const sysTheme = e.matches ? 'dark' : 'light';
      updateTheme(sysTheme, { updateIcons: true });
    }
  });

  const api = {
    updateTheme(theme, options = {}) {
      const opts = Object.assign({ updateIcons: true }, options);
      updateTheme(theme, opts);
    },
    toggleTheme,
    ensureThemeToggleListener: syncThemeControls,
    getCurrentTheme
  };

  window.themeManager = api;
  window.updateTheme = api.updateTheme;
  window.ensureThemeToggleListener = api.ensureThemeToggleListener;
})();

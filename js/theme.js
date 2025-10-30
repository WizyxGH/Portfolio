(function () {
  // Sélecteurs potentiels pour les boutons (support legacy)
  const TOGGLE_SELECTORS = ['#themeToggle', '#themeToggleDesktop', '#themeToggleMobile'];

  // Détecte la préférence système
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Récupère la préférence sauvegardée
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');

  // Applique la classe sur <html> immédiatement (minimise le FOUC)
  (function applyClassImmediately(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })(initialTheme);

  // Met à jour le thème (classe + icônes si demandé) et sauve la préférence
  function updateTheme(theme, { updateIcons = false } = {}) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Met à jour toutes les icônes trouvées (si demandé ou si bouton existe maintenant)
    if (updateIcons) {
      TOGGLE_SELECTORS.forEach(sel => {
        const btn = document.querySelector(sel);
        if (!btn) return;

        // Si le bouton contient une <i>, on met à jour sa className,
        // sinon on remplace le innerHTML par un <i> adapté.
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

    // Sauvegarde la préférence utilisateur
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // si localStorage bloqué, on ignore silencieusement
      // (ex: mode privé strict)
    }
  }

  // Toggle simple
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    updateTheme(newTheme, { updateIcons: true });
  }

  // Attache des listeners idempotents aux boutons existants
  function attachToggleListeners() {
    TOGGLE_SELECTORS.forEach(sel => {
      const btn = document.querySelector(sel);
      if (!btn) return;

      // propriété interne pour éviter doublons (idempotence)
      if (btn._themeListenerAttached) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });

      btn._themeListenerAttached = true;
    });
  }

  // Observer : si le DOM change (injection dynamique), on ré-attache les listeners
  const observer = new MutationObserver((mutations) => {
    // optimisation basique : n'essaie que si un node a été ajouté
    if (mutations.some(m => m.addedNodes && m.addedNodes.length > 0)) {
      attachToggleListeners();
      // et mettre à jour les icônes au cas où (si le thème est déjà appliqué)
      updateTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light', { updateIcons: true });
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Au chargement du DOM : attacher listeners et s'assurer que les icônes sont à jour
  document.addEventListener('DOMContentLoaded', () => {
    attachToggleListeners();
    updateTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light', { updateIcons: true });
  });

  // Écoute le changement de préférence système si l'utilisateur n'a rien choisi
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const sysTheme = e.matches ? 'dark' : 'light';
      updateTheme(sysTheme, { updateIcons: true });
    }
  });

})();

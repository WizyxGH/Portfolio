// Fonction pour mettre à jour le thème
function updateTheme(theme) {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');

    // Appliquer ou retirer la classe "dark" sur <html>
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    // Mettre à jour l'icône du bouton (🌙 pour sombre, ☀️ pour clair)
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'dark'
            ? '<i class="bx bx-moon text-xl"></i>'
            : '<i class="bx bx-sun text-xl"></i>';
    }

    // Sauvegarder la préférence utilisateur
    localStorage.setItem('theme', theme);
}

// Attacher le comportement du bouton (évite les doublons)
function ensureThemeToggleListener() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    if (themeToggle._themeListenerAttached) return;

    themeToggle.addEventListener('click', () => {
        // Inverser le thème actuel
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        updateTheme(newTheme);
    });

    themeToggle._themeListenerAttached = true;
}

// Vérifier la préférence système
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Déterminer le thème initial (préférence utilisateur ou système)
const savedTheme = localStorage.getItem('theme');
const initialTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');

// Appliquer le thème dès que possible
updateTheme(initialTheme);

// Quand le DOM est chargé, attacher l’écouteur du bouton
document.addEventListener('DOMContentLoaded', ensureThemeToggleListener);

// Mettre à jour automatiquement si la préférence système change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {c
        updateTheme(e.matches ? 'dark' : 'light');
    }
});

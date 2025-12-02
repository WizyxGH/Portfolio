document.addEventListener('DOMContentLoaded', () => {
    ensureBoxiconsStyles();
    // Charger navbar et footer en parallèle
    Promise.all([loadNavbar(), loadFooter()]);
});

function ensureBoxiconsStyles() {
    const head = document.head;
    if (!head) return;
    if (head.querySelector('link[href*="/assets/css/boxicons"]')) return;

    // Charge la feuille locale (plus rapide qu'un CDN)
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/boxicons.min.css';
    stylesheet.setAttribute('data-boxicons', 'true');
    head.appendChild(stylesheet);
}

async function loadNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;
    try {
        const res = await fetch('/partials/navbar.html');
        const html = await res.text();
        container.innerHTML = html;

        // Initialiser les interactions après l'injection du HTML
        initNavbarInteractions();
        setActiveNavLinks();
        
        // Initialiser le thème après le chargement de la navbar
        const currentTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        updateTheme(currentTheme);
        // S'assurer que le listener du bouton thème est attaché (si le bouton existe maintenant)
        if (typeof ensureThemeToggleListener === 'function') ensureThemeToggleListener();
    } catch (e) {
        console.error('Erreur chargement navbar:', e);
    }
}

function initNavbarInteractions() {
    // --- Menu burger ---
    const menuButton = document.getElementById('menuButton');
    const navMenu = document.getElementById('navMenu');
    if (menuButton && navMenu) {
        menuButton.addEventListener('click', () => navMenu.classList.toggle('hidden'));
    }

    // --- Dropdown ---
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const dropdownChevron = document.getElementById('dropdownChevron');
    if (dropdownButton && dropdownMenu) {
        dropdownButton.addEventListener('click', () => {
            dropdownMenu.classList.toggle('hidden');
            if (dropdownChevron) {
                dropdownChevron.classList.toggle('bx-chevron-down', dropdownMenu.classList.contains('hidden'));
                dropdownChevron.classList.toggle('bx-chevron-up', !dropdownMenu.classList.contains('hidden'));
            }
        });
    }
}

function setActiveNavLinks() {
    let currentPath = new URL(location.href).pathname.replace(/\/+$/, '');
    if (currentPath === '') currentPath = '/';

    document.querySelectorAll('#navMenu a').forEach(link => {
        let href = link.getAttribute('href');
        if (!href) return;

        let linkPath;
        try {
            linkPath = new URL(href, location.origin).pathname.replace(/\/+$/, '');
            if (linkPath === '') linkPath = '/';
        } catch (err) {
            return;
        }

        if (linkPath === currentPath) {
            link.classList.add('font-semibold');
        }
    });
}

async function loadFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;
    try {
        const res = await fetch('/partials/footer.html');
        const html = await res.text();
        container.innerHTML = html;
    } catch (e) {
        console.error('Erreur chargement footer:', e);
    }
}

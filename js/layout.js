document.addEventListener('DOMContentLoaded', () => {
    ensureBoxiconsStyles();
    initNavbar();
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

function syncNavbarThemeIcons(root = document) {
    const isDark = document.documentElement.classList.contains('dark');
    root.querySelectorAll('#themeToggleDesktop i, #themeToggleMobile i').forEach(icon => {
        icon.className = isDark ? 'bx bx-moon text-xl' : 'bx bx-sun text-xl';
    });
}

function bindNavbarThemeToggle(root = document) {
    const buttons = root.querySelectorAll('#themeToggleDesktop, #themeToggleMobile');
    if (!buttons.length) return;

    // Si le gestionnaire global est dispo, on lui laisse la main (il attache déjà ses listeners)
    if (window.themeManager) {
        const theme = window.themeManager.getCurrentTheme
            ? window.themeManager.getCurrentTheme()
            : (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        window.themeManager.updateTheme(theme, { updateIcons: true });
        if (typeof window.themeManager.ensureThemeToggleListener === 'function') {
            window.themeManager.ensureThemeToggleListener();
        }
        return;
    }

    const applyToggle = () => {
        if (window.themeManager?.toggleTheme) {
            window.themeManager.toggleTheme();
        } else {
            const isDark = document.documentElement.classList.contains('dark');
            const next = isDark ? 'light' : 'dark';
            if (typeof window.updateTheme === 'function') {
                window.updateTheme(next, { updateIcons: true });
            } else {
                document.documentElement.classList.toggle('dark', next === 'dark');
                syncNavbarThemeIcons(root);
                try { localStorage.setItem('theme', next); } catch (e) { }
            }
        }
        // Mise à jour des icônes immédiatement après bascule
        if (window.themeManager?.updateTheme) {
            const theme = window.themeManager.getCurrentTheme
                ? window.themeManager.getCurrentTheme()
                : (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            window.themeManager.updateTheme(theme, { updateIcons: true });
        } else {
            syncNavbarThemeIcons(root);
        }
    };

    buttons.forEach(btn => {
        if (btn._navbarThemeBound) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            applyToggle();
        });
        // Marque comme déjà lié pour éviter délégation + double toggle
        btn._themeListenerAttached = true;
        btn._navbarThemeBound = true;
    });

    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    if (window.themeManager?.updateTheme) {
        window.themeManager.updateTheme(theme, { updateIcons: true });
    } else if (typeof window.updateTheme === 'function') {
        window.updateTheme(theme, { updateIcons: true });
    } else {
        syncNavbarThemeIcons(root);
    }
}

function initNavbar() {
    const container = document.getElementById('navbar');
    if (!container) return;

    // Initialiser les interactions
    initNavbarInteractions();
    setActiveNavLinks();

    // Initialiser le thème
    const currentTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    if (typeof window.updateTheme === 'function') {
        window.updateTheme(currentTheme, { updateIcons: true });
    } else {
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    }

    if (typeof window.ensureThemeToggleListener === 'function') {
        window.ensureThemeToggleListener();
    }

    // Réaffecte les helpers globaux vers ceux de theme.js si disponibles
    if (window.themeManager) {
        window.updateTheme = window.themeManager.updateTheme;
        window.toggleTheme = window.themeManager.toggleTheme;
        window.ensureThemeToggleListener = window.themeManager.ensureThemeToggleListener;
    }

    bindNavbarThemeToggle(container);
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

// ===== Scroll Animations =====
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.remove('opacity-0', 'translate-y-8');
                    entry.target.classList.add('opacity-100', 'translate-y-0');

                    // Trigger counter animation if element has counters
                    const counters = entry.target.querySelectorAll('[data-counter]');
                    counters.forEach(counter => animateCounter(counter));
                }, delay);

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.counter);
    const suffix = element.dataset.suffix || '';
    const finalText = element.dataset.final || null; // e.g. "Illimité"
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    // Reset to 0 before starting animation
    element.textContent = '0';

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = finalText !== null ? finalText : target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// Initialize scroll animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}

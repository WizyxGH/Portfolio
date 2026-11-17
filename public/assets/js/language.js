document.addEventListener('DOMContentLoaded', () => {
    const defaultLang = 'fr';
    const supportedLangs = ['fr', 'en', 'de'];
    let translations = {};

    // Flag SVGs for switcher
    const flags = {
        fr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" class="w-5 h-auto rounded-sm shadow-sm"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#FFFFFF"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>`,
        en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" class="w-5 h-auto rounded-sm shadow-sm"><clipPath id="s_flag"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t_flag"><path d="M30,15 h30 v15 z v-15 h-30 z h-30 v-15 z v15 h30 z"/></clipPath><g clip-path="url(#s_flag)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t_flag)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>`,
        de: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" class="w-5 h-auto rounded-sm shadow-sm"><rect width="5" height="1" y="0" fill="#000000"/><rect width="5" height="1" y="1" fill="#DD0000"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>`
    };

    // 1. Determine Language
    function getLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        let lang = urlParams.get('lang');

        // If URL param is valid, save preference and return
        if (lang && supportedLangs.includes(lang)) {
            localStorage.setItem('lang', lang);
            return lang;
        }

        // Check storage if user previously selected
        const storedLang = localStorage.getItem('lang');
        if (storedLang && supportedLangs.includes(storedLang)) {
            return storedLang;
        }

        return defaultLang;
    }

    const currentLang = getLanguage();
    
    // Setup dropdown event listeners once
    initDropdownListeners();

    // Update switcher display immediately
    updateSwitcher(currentLang);

    // 2. Load Translations
    async function loadTranslations() {
        try {
            const response = await fetch('/assets/data/translations.json');
            translations = await response.json();
            if (currentLang !== defaultLang) {
                applyLanguage(currentLang);
            }
            updateUrl(currentLang);
        } catch (error) {
            console.error('Could not load translations:', error);
        }
    }

    // 3. Apply Translations
    function applyLanguage(lang) {
        if (!translations[lang]) return;

        document.documentElement.lang = lang;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = translations[lang][key];
            if (translation !== undefined) {
                if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                    el.placeholder = translation;
                } else if (translation.includes('<') || el.hasAttribute('data-i18n-html')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Update Links to preserve ?lang= param (only internal links)
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel:') || href.startsWith('sms:') || href.startsWith('javascript:')) return;

            const url = new URL(link.href, window.location.origin);
            if (lang !== defaultLang) {
                url.searchParams.set('lang', lang);
            } else {
                url.searchParams.delete('lang');
            }
            link.href = url.pathname + url.search + url.hash;
        });

        // Update Typewriter language if available
        if (window.setTypewriterLanguage) {
            window.setTypewriterLanguage(lang);
        }

        // Update Switcher State
        updateSwitcher(lang);
    }

    // 4. Update URL (History API)
    function updateUrl(lang) {
        const url = new URL(window.location);
        const currentParam = url.searchParams.get('lang');

        if (lang !== defaultLang) {
            if (currentParam !== lang) {
                url.searchParams.set('lang', lang);
                window.history.replaceState({}, '', url);
            }
        } else {
            if (currentParam) {
                url.searchParams.delete('lang');
                window.history.replaceState({}, '', url);
            }
        }
    }

    // 5. Switcher UI & Dropdown Logic
    function updateSwitcher(lang) {
        const currentFlagSvg = flags[lang] || flags.fr;
        const currentCode = (lang || 'fr').toUpperCase();

        // Update dropdown triggers
        document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
            const flagContainer = dropdown.querySelector('.current-flag-container');
            if (flagContainer) {
                flagContainer.innerHTML = currentFlagSvg;
            }
            const codeEl = dropdown.querySelector('.current-lang-code');
            if (codeEl) {
                codeEl.textContent = currentCode;
            }

            // Update options within this dropdown
            dropdown.querySelectorAll('.lang-option').forEach(opt => {
                const optLang = opt.getAttribute('data-lang');
                const isSelected = optLang === lang;

                if (isSelected) {
                    opt.classList.add('font-bold', 'text-brand-primary', 'dark:text-brand-secondary', 'bg-brand-muted', 'dark:bg-brand-dark');
                    opt.setAttribute('aria-selected', 'true');
                } else {
                    opt.classList.remove('font-bold', 'text-brand-primary', 'dark:text-brand-secondary', 'bg-brand-muted', 'dark:bg-brand-dark');
                    opt.setAttribute('aria-selected', 'false');
                }
            });
        });

        // Legacy/fallback buttons if present
        ['fr', 'en', 'de'].forEach(l => {
            const btn = document.getElementById(`lang-btn-${l}`);
            if (btn) {
                btn.classList.toggle('font-bold', lang === l);
                btn.classList.toggle('opacity-50', lang !== l);
            }
        });
    }

    function initDropdownListeners() {
        // Mobile trigger
        document.querySelectorAll('.lang-dropdown-trigger').forEach(trigger => {
            const menu = trigger.nextElementSibling;
            if (!menu) return;

            trigger.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = !menu.classList.contains('hidden');
                closeAllDropdowns();
                if (!isOpen) {
                    menu.classList.remove('hidden');
                    trigger.setAttribute('aria-expanded', 'true');
                }
            };
        });

        // Option click (mobile & desktop)
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetLang = opt.getAttribute('data-lang');
                if (targetLang) {
                    window.setLanguage(targetLang);
                }
                closeAllDropdowns();
            };
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.lang-dropdown')) {
                closeAllDropdowns();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllDropdowns();
            }
        });
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.lang-dropdown-menu, .lang-dropdown .nav-dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
        document.querySelectorAll('.lang-dropdown-trigger, .lang-dropdown .nav-dropdown-btn').forEach(trigger => {
            trigger.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.lang-dropdown .nav-dropdown-chevron').forEach(chevron => {
            chevron.classList.add('bx-chevron-down');
            chevron.classList.remove('bx-chevron-up');
        });
    }

    // Public API
    window.setLanguage = async function (lang) {
        if (!supportedLangs.includes(lang)) return;
        localStorage.setItem('lang', lang);

        if (!translations[lang]) {
            await loadTranslations();
        }

        applyLanguage(lang);
        updateUrl(lang);
    };

    window.applyTranslations = function () {
        const lang = getLanguage();
        if (translations[lang]) {
            applyLanguage(lang);
        }
    };

    loadTranslations();
});
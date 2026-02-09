document.addEventListener('DOMContentLoaded', () => {
    const defaultLang = 'fr';
    const supportedLangs = ['fr', 'en'];
    let translations = {};

    // 1. Determine Language
    function getLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        let lang = urlParams.get('lang');

        // If URL param is valid, it takes format priority
        if (lang && supportedLangs.includes(lang)) {
            // If explicit param, save preference
            localStorage.setItem('lang', lang);
            return lang;
        }

        // If no param, check storage
        const storedLang = localStorage.getItem('lang');
        if (storedLang && supportedLangs.includes(storedLang)) {
            return storedLang;
        }

        // Feature: Auto-detect Browser Lang for new users
        // If navigator.language starts with 'en', suggest EN
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.startsWith('en')) {
            return 'en';
        }

        return defaultLang;
    }

    const currentLang = getLanguage();

    // 2. Load Translations
    // We fetch the JSON file. Ensure this file is accessible via URL.
    // Jekyll puts _data in the build? No, _data is used at build time.
    // We need to expose this data. 
    // Ideally, we output it into a JS variable in the layout or fetch it from a generated JSON file.
    // For now, I will assume we can fetch it if I put it in assets or generate it.
    // Wait, _data files are NOT served directly. 
    // Correction: I need to create a Jekyll page that outputs this JSON at a URL, OR embed it.
    // Embedding is strictly faster and simpler for this scale.
    // PROPOSAL: I will fetch a specific endpoint. 
    // Let's create `assets/js/translations.json` instead of `_data` or copy it.
    // actually better: put it in `js/translations.js` as a global object if it's small, 
    // OR keep it in `_data` and have a liquid file output it.
    // Let's go with fetching `assets/data/translations.json` which I will create via a write (simulating a build step or just placing it there).
    // Actually, `_data` is best for Jekyll. I will simply render it into a global variable in `_layouts/default.html` or `_includes/head.html`?
    // No, cleaner to fetch. I'll write to `assets/data/translations.json` for now to serve it.

    // Changing approach: I will write the JSON content to `assets/data/translations.json` directly so it can be fetched.

    async function loadTranslations() {
        try {
            const response = await fetch('/assets/data/translations.json');
            translations = await response.json();
            applyLanguage(currentLang);
            updateUrl(currentLang);
        } catch (error) {
            console.error('Could not load translations:', error);
        }
    }

    // 3. Apply Translations
    function applyLanguage(lang) {
        if (!translations[lang]) return;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                // Check if it's an input with placeholder
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });

        // Update Links to preserve ?lang= param
        // Only internal links
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

            // If current lang is NOT default, append param
            // If default, remove param (clean URL) - per constraint "FR par défaut"
            // Constraint: "FR par défaut : https://wizyx.me/services ou https://wizyx.me/services?lang=fr"
            // "Une seule URL par page... ?lang="

            const url = new URL(link.href, window.location.origin);
            if (lang !== defaultLang) {
                url.searchParams.set('lang', lang);
            } else {
                url.searchParams.delete('lang');
            }
            link.href = url.pathname + url.search; // Keep hash if any? url.hash
        });

        // Update Language Switcher State
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
            // Default language: remove param if we want clean URLs, OR keep it if user explicitly chose it?
            // "il n’y a pas de paramètre ?lang= dans l’URL" => implies clean URL for FR default detection.
            // But "FR ... : ...services?lang=fr" is also allowed.
            // Let's clean it for aesthetics if it's standard FR logic, unless specifically requested to keep.
            // User example: "FR par défaut : ...services ou ...services?lang=fr"
            // But "EN : ...services?lang=en"
            // I'll keep it clean for FR to match the "Detection... si il n'y a pas de param" logic.
            if (currentParam) {
                url.searchParams.delete('lang');
                window.history.replaceState({}, '', url);
            }
        }
    }

    // 5. Switcher Logic
    function updateSwitcher(lang) {
        const switcherBtn = document.getElementById('lang-toggle');
        if (switcherBtn) {
            // Example: click simply toggles between the two
            const nextLang = lang === 'fr' ? 'en' : 'fr';
            switcherBtn.textContent = nextLang.toUpperCase();
            switcherBtn.onclick = (e) => {
                e.preventDefault();
                setLanguage(nextLang);
            };
        }

        // If we have distinct buttons
        const frBtn = document.getElementById('lang-btn-fr');
        const enBtn = document.getElementById('lang-btn-en');
        if (frBtn) {
            frBtn.classList.toggle('font-bold', lang === 'fr');
            frBtn.classList.toggle('opacity-50', lang !== 'fr');
        }
        if (enBtn) {
            enBtn.classList.toggle('font-bold', lang === 'en');
            enBtn.classList.toggle('opacity-50', lang !== 'en');
        }
    }

    window.setLanguage = function (lang) {
        if (!supportedLangs.includes(lang)) return;
        localStorage.setItem('lang', lang);

        // Reload is NOT forced, but we update state
        applyLanguage(lang);
        updateUrl(lang);
    }

    loadTranslations();
});
